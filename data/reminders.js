import { ObjectId } from "mongodb";
import { reminders as remindersCollectionFn, bills as billsCollectionFn, utilities as utilitiesCollectionFn } from "../config/mongoCollections.js";

/**
 * Create a single reminder
 */
export const createReminder = async (userId, billId, reminderDate, type = "before") => {
  const remindersCollection = await remindersCollectionFn();
  const doc = {
    userId: new ObjectId(userId),
    billId: new ObjectId(billId),
    reminderDate: new Date(reminderDate),
    type, // "before" | "on"
    sent: false,
    createdAt: new Date()
  };
  const res = await remindersCollection.insertOne(doc);
  return { ...doc, _id: res.insertedId.toString() };
};

/**
 * Create both reminders for a bill: N days before and on due date
 */
export const createBillReminders = async (userId, bill, daysBefore = 3) => {
  const due = new Date(bill.dueDate);

  const before = new Date(due);
  before.setDate(due.getDate() - Number(daysBefore || 3));

  const beforeReminder = await createReminder(userId, bill._id, before, "before");
  const onReminder = await createReminder(userId, bill._id, due, "on");

  return { beforeReminder, onReminder };
};

/**
 * Get reminders for a user (optionally filter sent/pending)
 */
export const getRemindersForUser = async (userId, { sent } = {}) => {
  const remindersCollection = await remindersCollectionFn();
  const query = { userId: new ObjectId(userId) };
  if (typeof sent === "boolean") query.sent = sent;

  const items = await remindersCollection.find(query).sort({ reminderDate: 1 }).toArray();
  return items.map(r => ({
    ...r,
    _id: r._id.toString(),
    userId: r.userId.toString(),
    billId: r.billId.toString()
  }));
};

/**
 * Get due reminders (to be sent now)
 */
export const getDueReminders = async () => {
  const remindersCollection = await remindersCollectionFn();
  const now = new Date();
  return remindersCollection.find({
    reminderDate: { $lte: now },
    sent: false
  }).toArray();
};

/**
 * Mark reminder as sent
 */
export const markReminderSent = async (reminderId) => {
  const remindersCollection = await remindersCollectionFn();
  await remindersCollection.updateOne(
    { _id: new ObjectId(reminderId) },
    { $set: { sent: true, sentAt: new Date() } }
  );
};

/**
 * Convenience: expand reminder with bill and utility info
 */
export const hydrateReminder = async (reminder) => {
  const billsCollection = await billsCollectionFn();
  const utilitiesCollection = await utilitiesCollectionFn();

  const bill = await billsCollection.findOne({ _id: new ObjectId(reminder.billId) });
  const utility = bill
    ? await utilitiesCollection.findOne({ _id: new ObjectId(bill.utilityId) })
    : null;

  return {
    ...reminder,
    bill: bill
      ? {
          ...bill,
          _id: bill._id.toString(),
          userId: bill.userId.toString(),
          utilityId: bill.utilityId.toString()
        }
      : null,
    utility: utility
      ? {
          ...utility,
          _id: utility._id.toString(),
          userId: utility.userId.toString()
        }
      : null
  };
};

export default {
  createReminder,
  createBillReminders,
  getRemindersForUser,
  getDueReminders,
  markReminderSent,
  hydrateReminder
};
