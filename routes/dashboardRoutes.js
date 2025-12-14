import { Router } from "express";
import { budgetData } from "../data/index.js";
//import { billsData } from "../data/index.js"; -- KV

const router = Router();

const ensureLoggedIn = (req, res, next) => {
    if (!req.session ||!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

//GET dashboard

router.get("/", ensureLoggedIn, async (req, res) => {
    const userId = req.session.user._id;

    try {
        
        const rawBudgets = await budgetData.getBudgetsForUser(userId);

        //Show only active budgets
        const activeBudgets = rawBudgets.filter(b => b.active === true);

        const budgetSummaries = await Promise.all(
            activeBudgets.map(async (budget) => {
                const summary = await budgetData.calculateBudgetSummary(budget);
                
                return {
                    ...summary,
                    amountLimitFormatted: Number(summary.amountLimit || 0).toFixed(2),
                    amountUsedFormatted: Number(summary.amountUsed || 0).toFixed(2),
                    amountRemainingFormatted: Number(summary.amountRemaining || 0).toFixed(2),
                    percentageUsedRounded: Math.round(Number(summary.percentageUsed || 0))
                };
            })
        );

        // NR's feature for utilitySummary

        res.render("dashboard", {
            title: "BudgetWise Dashboard",
            budgetSummaries, 
            //utilitySumary: utilitySummary || {}
        });
    } catch (error) {
        res.status(500).render("dashboard", {
            title: "BudgetWise Dashboard",
            budgetSummaries: [],
            error: error.message || "Unable to load dashboard data."
        });
    }
});

export default router;