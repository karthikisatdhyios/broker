import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Datastore from '@seald-io/nedb';

/**
 * A tiny Mongoose-like ODM over NeDB (pure-JS, file-backed).
 * Implements just the subset of the Mongoose API this project uses:
 *   Model.create / find (cursor: sort/limit/populate) / findOne / findById /
 *   findOneAndUpdate / findOneAndDelete / updateOne / updateMany /
 *   countDocuments / deleteMany / new Model().save() / doc.populate()
 *
 * It supports MongoDB-style query operators ($in, $gte, $lte, $or, $regex...)
 * natively via NeDB, so controller query objects work unchanged.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

function applyDefaults(defaults, data) {
  const out = {};
  for (const [key, def] of Object.entries(defaults || {})) {
    out[key] = typeof def === 'function' ? def() : structuredCloneSafe(def);
  }
  Object.assign(out, data);
  return out;
}

function structuredCloneSafe(v) {
  if (v === null || typeof v !== 'object') return v;
  if (v instanceof Date) return new Date(v);
  return JSON.parse(JSON.stringify(v));
}

// Convert a "plain" update (no $ operators) into a $set update.
function normalizeUpdate(update) {
  const hasOp = Object.keys(update).some((k) => k.startsWith('$'));
  return hasOp ? update : { $set: update };
}

export function createModel(name, options = {}) {
  const { defaults = {}, methods = {}, refs = {}, indexes = [], timestamps = true } = options;

  const ds = new Datastore({ filename: path.join(DATA_DIR, `${name}.db`), autoload: true });
  indexes.forEach((idx) => ds.ensureIndex(idx, () => {}));

  class Document {
    constructor(data = {}, { isNew = true } = {}) {
      Object.assign(this, isNew ? applyDefaults(defaults, data) : data);
      Object.defineProperty(this, '$isNew', { value: isNew, writable: true, enumerable: false });
    }

    // Serialize to a plain DB record (refs collapsed back to ids).
    toRecord() {
      const rec = {};
      for (const [k, v] of Object.entries(this)) {
        if (typeof v === 'function') continue;
        if (refs[k]) {
          rec[k] = collapseRef(v);
        } else {
          rec[k] = v;
        }
      }
      return rec;
    }

    toObject() {
      return this.toRecord();
    }

    async save() {
      if (timestamps) {
        const now = new Date();
        if (this.$isNew && !this.createdAt) this.createdAt = now;
        this.updatedAt = now;
      }
      const rec = this.toRecord();
      if (this.$isNew || !this._id) {
        const inserted = await ds.insertAsync(rec);
        this._id = inserted._id;
        this.$isNew = false;
      } else {
        await ds.updateAsync({ _id: this._id }, rec, {});
      }
      return this;
    }

    async populate(arg, select) {
      const list = Array.isArray(arg) ? arg : [{ path: arg, select }];
      for (const { path: p } of list) {
        const refName = refs[p];
        if (!refName) continue;
        const RefModel = registry[refName];
        if (!RefModel) continue;
        const val = this[p];
        if (Array.isArray(val)) {
          this[p] = await Promise.all(val.map((id) => RefModel.findById(collapseRef(id))));
        } else if (val) {
          this[p] = await RefModel.findById(collapseRef(val));
        }
      }
      return this;
    }
  }

  // attach custom instance methods
  for (const [mName, fn] of Object.entries(methods)) {
    Document.prototype[mName] = fn;
  }

  function hydrate(raw) {
    if (!raw) return null;
    return new Document(raw, { isNew: false });
  }

  // Thenable cursor supporting .sort().limit().populate() in any order.
  class Cursor {
    constructor(filter) {
      this._filter = filter;
      this._sort = null;
      this._limit = null;
      this._populate = [];
    }
    sort(spec) { this._sort = spec; return this; }
    limit(n) { this._limit = n; return this; }
    populate(p, select) { this._populate.push({ path: p, select }); return this; }
    async exec() {
      let cur = ds.find(this._filter);
      if (this._sort) cur = cur.sort(this._sort);
      if (this._limit != null) cur = cur.limit(this._limit);
      const raws = await cur.execAsync();
      const docs = raws.map(hydrate);
      if (this._populate.length) {
        await Promise.all(docs.map((d) => d.populate(this._populate)));
      }
      return docs;
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
    catch(cb) { return this.exec().catch(cb); }
  }

  // Attach statics directly to the Document class so both `new Model(data)`
  // and `Model.find(...)` work like Mongoose.
  const statics = {
    modelName: name,

    async create(input) {
      if (Array.isArray(input)) {
        return Promise.all(input.map((d) => statics.create(d)));
      }
      const doc = new Document(input, { isNew: true });
      await doc.save();
      return doc;
    },

    find(filter = {}) {
      return new Cursor(filter);
    },

    async findOne(filter = {}) {
      const raw = await ds.findOneAsync(filter);
      return hydrate(raw);
    },

    async findById(id) {
      if (!id) return null;
      const raw = await ds.findOneAsync({ _id: collapseRef(id) });
      return hydrate(raw);
    },

    async findOneAndUpdate(filter, update) {
      const res = await ds.updateAsync(filter, normalizeUpdate(update), {
        multi: false,
        returnUpdatedDocs: true,
      });
      const updated = res.affectedDocuments;
      if (!updated) return null;
      if (timestamps) {
        await ds.updateAsync({ _id: updated._id }, { $set: { updatedAt: new Date() } }, {});
      }
      return statics.findById(updated._id);
    },

    async findOneAndDelete(filter) {
      const raw = await ds.findOneAsync(filter);
      if (!raw) return null;
      await ds.removeAsync({ _id: raw._id }, { multi: false });
      return hydrate(raw);
    },

    async updateOne(filter, update) {
      const res = await ds.updateAsync(filter, normalizeUpdate(update), { multi: false });
      return { modifiedCount: res?.numAffected ?? res ?? 0 };
    },

    async updateMany(filter, update) {
      const res = await ds.updateAsync(filter, normalizeUpdate(update), { multi: true });
      return { modifiedCount: res?.numAffected ?? res ?? 0 };
    },

    async countDocuments(filter = {}) {
      return ds.countAsync(filter);
    },

    async deleteMany(filter = {}) {
      const n = await ds.removeAsync(filter, { multi: true });
      return { deletedCount: n };
    },
  };

  Object.assign(Document, statics);
  registry[name] = Document;
  return Document;
}

// id helpers: collapse a possible Document/Objectish to its string id.
function collapseRef(v) {
  if (v == null) return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return v._id;
  return v;
}

export const registry = {};
