// routes/dashboard.js
import { Router } from "express";
import { budgetData, billsData, remindersData } from "../data/index.js";

const router = Router();

const ensureLoggedIn = (req, res, next) => {
  if (!req.session || !req.session.user) return res.redirect("/login");
  next();
};

router.get("/", ensureLoggedIn, async (req, res) => {
  const userId = req.session.user._id;

  try {
    // Budgets
    const rawBudgets = await budgetData.getBudgetsForUser(userId);
    const budgetSummaries = await Promise.all(
      rawBudgets.map(budgetData.calculateBudgetSummary)
    );

    // Bills summary
    const bills = await billsData.getBillsForUser(userId);
    const utilitySummary = {
      paid: bills.filter((b) => b.status === "paid").length,
      due: bills.filter((b) => b.status === "due").length,
      upcoming: bills.filter((b) => b.status === "upcoming").length,
      overdue: bills.filter((b) => b.status === "overdue").length,
      total: bills.length,
    };

    // In-app reminders: due now and not yet sent
    const dueReminders =
      (await remindersData.getDueRemindersForUserWithDetails(userId)) || [];


    res.render("dashboard", {
      title: "BudgetWise Dashboard",
      budgetSummaries,
      utilitySummary,
      reminders: dueReminders, // pass to template
    });
  } catch (error) {
    res.status(500).render("dashboard", {
      title: "BudgetWise Dashboard",
      budgetSummaries: [],
      error: error.message || "Unable to load dashboard data.",
    });
  }
});

export default router;
