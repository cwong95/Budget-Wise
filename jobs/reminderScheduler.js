import cron from "node-cron";
import { getDueReminders, markReminderSent, hydrateReminder } from "../data/reminders.js";

/**
 * Replace this with your delivery method (email/SMS/in-app).
 * For now, it logs a message.
 */
async function sendNotification(reminder) {
  const r = await hydrateReminder(reminder);
  const label = r.type === "on" ? "Bill is due today" : "Upcoming bill due soon";
  const utilityName = r.utility?.provider || "Utility";
  const dueDate = r.bill ? new Date(r.bill.dueDate).toLocaleDateString() : "unknown";
  console.log(`🔔 ${label}: ${utilityName} — due ${dueDate} (user ${r.userId})`);
}

/**
 * Run every minute to process pending reminders
 */
export function startReminderScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const due = await getDueReminders();
      for (const reminder of due) {
        await sendNotification(reminder);
        await markReminderSent(reminder._id);
      }
    } catch (err) {
      console.error("Reminder scheduler error:", err);
    }
  });
  console.log("⏱️ Reminder scheduler started (runs every minute)");
}
