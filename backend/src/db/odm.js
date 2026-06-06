import crypto from 'node:crypto';
import { getDb } from '../config/db.js';

/**
 * A tiny Mongoose-like ODM over the native MongoDB driver. It implements just
 * the subset of the Mongoose API this project uses:
 *   Model.create / find (cursor: sort/limit/populate) / findOne / findById /
 *   findOneAndUpdate / findOneAndDelete / updateOne / updateMany /
 *   countDocuments / deleteMany / new Model().save() / doc.populate()
 *
 * MongoDB-style query operators ($in, $gte, $lte, $or, $regex...) are passed
 * straight through to the driver, so controller query objects work unchanged.
 *
 * Documents use string `_id`s (UUIDs) to keep all existing string-based id
 * comparisons in controllers/refs stable across database backends.
 */

export const registry = {};

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
  return hasOp ? { ...update } : { $set: { ...update } };
}

// id helpers: collapse a possible Document/Objectish to its string id.
function collapseRef(v) {
  if (v == null) return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return v._id;
  return v;
}

// "name agency email" -> { name: 1, agency: 1, email: 1 }
function selToProjection(select) {
  if (!select) return null;
  const proj = {};
  String(select)
    .split(/\s+/)
    .filter(Boolean)
    .forEach((f) => {
      proj[f] = 1;
    });
  return Object.keys(proj).length ? proj : null;
}

// Some driver versions return { value } from findOneAndUpdate/Delete, others
// return the document directly. Normalize both.
function unwrap(res) {
  if (res && typeof res === 'object' && 'value' in res && !('_id' in res)) {
    return res.value;
  }
  return res;
}

export function createModel(name, options = {}) {
  const { defaults = {}, methods = {}, refs = {}, indexes = [], timestamps = true } = options;

  let indexPromise = null;
  async function col() {
    const db = await getDb();
    const c = db.collection(name);
    if (indexPromise === null) {
      indexPromise = indexes.length
        ? Promise.all(
            indexes.map((idx) =>
              c
                .createIndex({ [idx.fieldName]: 1 }, { unique: !!idx.unique })
                .catch(() => {})
            )
          )
        : Promise.resolve();
    }
    await indexPromise;
    return c;
  }

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
        rec[k] = refs[k] ? collapseRef(v) : v;
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
      if (!this._id) this._id = crypto.randomUUID();
      const rec = this.toRecord();
      rec._id = this._id;
      const c = await col();
      await c.replaceOne({ _id: this._id }, rec, { upsert: true });
      this.$isNew = false;
      return this;
    }

    async populate(arg, select) {
      const list = Array.isArray(arg) ? arg : [{ path: arg, select }];
      for (const item of list) {
        const p = item.path;
        const refName = refs[p];
        if (!refName) continue;
        const RefModel = registry[refName];
        if (!RefModel) continue;
        const proj = selToProjection(item.select);
        const val = this[p];
        if (Array.isArray(val)) {
          this[p] = await Promise.all(val.map((id) => RefModel.findByIdRaw(collapseRef(id), proj)));
        } else if (val) {
          this[p] = await RefModel.findByIdRaw(collapseRef(val), proj);
        }
      }
      return this;
    }
  }

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
      const c = await col();
      let cursor = c.find(this._filter);
      if (this._sort) cursor = cursor.sort(this._sort);
      if (this._limit != null) cursor = cursor.limit(this._limit);
      const raws = await cursor.toArray();
      const docs = raws.map(hydrate);
      if (this._populate.length) {
        await Promise.all(docs.map((d) => d.populate(this._populate)));
      }
      return docs;
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
    catch(cb) { return this.exec().catch(cb); }
  }

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
      const c = await col();
      return hydrate(await c.findOne(filter));
    },

    async findById(id) {
      if (!id) return null;
      const c = await col();
      return hydrate(await c.findOne({ _id: collapseRef(id) }));
    },

    // Plain projected object (used by populate). Always includes _id.
    async findByIdRaw(id, projection) {
      if (!id) return null;
      const c = await col();
      return c.findOne({ _id: collapseRef(id) }, projection ? { projection } : undefined);
    },

    async findOneAndUpdate(filter, update) {
      const c = await col();
      const upd = normalizeUpdate(update);
      if (timestamps) {
        upd.$set = { ...(upd.$set || {}), updatedAt: new Date() };
      }
      const res = await c.findOneAndUpdate(filter, upd, { returnDocument: 'after' });
      return hydrate(unwrap(res));
    },

    async findOneAndDelete(filter) {
      const c = await col();
      const res = await c.findOneAndDelete(filter);
      return hydrate(unwrap(res));
    },

    async updateOne(filter, update) {
      const c = await col();
      const r = await c.updateOne(filter, normalizeUpdate(update));
      return { modifiedCount: r.modifiedCount ?? 0 };
    },

    async updateMany(filter, update) {
      const c = await col();
      const r = await c.updateMany(filter, normalizeUpdate(update));
      return { modifiedCount: r.modifiedCount ?? 0 };
    },

    async countDocuments(filter = {}) {
      const c = await col();
      return c.countDocuments(filter);
    },

    async deleteMany(filter = {}) {
      const c = await col();
      const r = await c.deleteMany(filter);
      return { deletedCount: r.deletedCount ?? 0 };
    },
  };

  Object.assign(Document, statics);
  registry[name] = Document;
  return Document;
}
