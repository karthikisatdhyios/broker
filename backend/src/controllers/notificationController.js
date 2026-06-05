import { Notification } from '../models/Notification.js';

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications, unread });
}

export async function markRead(req, res) {
  await Notification.updateOne(
    { _id: req.params.id, user: req.user._id },
    { read: true }
  );
  res.json({ ok: true });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}
