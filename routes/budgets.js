import { Router } from 'express';
import * as budgetData from '../data/budget.js';

const router = Router();

const ensureLoggedIn = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const CATEGORY_OPTIONS = ['Food', 'Housing', 'Travel', 'Utilities', 'Entertainment', 'Other'];

//GET - show list of current budgets + form to add a new one
router.get('/', ensureLoggedIn, async (req, res) => {
    try {
        const userId = req.session.user._id;

        //Fetch budgets for the user. 
        const userBudgets = await budgetData.getBudgetsForUser(userId);

        const formattedBudgets = userBudgets.map((b) => ({
            ...b,
            startDateFormatted: b.startDate ? new Date(b.startDate).toLocaleDateString('en-US'): '',
            endDateFormatted: b.endDate ? new Date(b.endDate).toLocaleDateString('en-US') : ''
        }));

        return res.render('budget', {
            title: 'Manage Budgets',
            budgets: formattedBudgets,
            categories: CATEGORY_OPTIONS,
            error: req.query.error || null,
            message: req.query.message || null
        });
    } catch (e) {
        return res.status(500).render('budget', {
            title: 'Manage Budgets',
            budgets: [],
            categories: CATEGORY_OPTIONS,
            error: e.message || 'Server error',
            message: null
        });
    }
});

//POST - create a new budget
router.post('/', ensureLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const { category, amountLimit, startDate, endDate } = req.body;

  try {
    if (!category || !amountLimit || !startDate || !endDate) {

      const userBudgets = await budgetData.getBudgetsForUser(userId);


      const formattedBudgets = userBudgets.map((b) => ({
        ...b,
        startDateFormatted: new Date(b.startDate).toLocaleDateString('en-US'),
        endDateFormatted: new Date(b.endDate).toLocaleDateString('en-US')
      }));
      return res.status(400).render('budget', {
          title: 'Manage Budgets',
          budgets: formattedBudgets,
          categories: CATEGORY_OPTIONS,
          error: 'All budget fields (category, amount, dates) are required.',
          message: null
       });
    }

    await budgetData.createBudget({
        userId,
        category,
        amountLimit: Number(amountLimit),
        startDate,
        endDate 
    });

    return res.redirect('/budgets?message=' + encodeURIComponent('Budget created successfully'));
} catch (e) {
    let userBudgets = [];
    try {
        userBudgets = await budgetData.getBudgetsForUser(userId);
    } catch { }

    const formattedBudgets = userBudgets.map((b) => ({
        ...b,
        startDateFormatted: new Date(b.startDate).toLocaleDateString('en-US'),
        endDateFormatted: new Date(b.endDate).toLocaleDateString('en-US')
    }));

    return res.status(500).render('budget', {
        title: 'Manage Budgets',
        budgets: formattedBudgets,
        categories: CATEGORY_OPTIONS,
        error: e.message || "Could not save the new budget."
      });
    } 
});


//POST /delete - a specific budget
router.post('/delete', ensureLoggedIn, async (req, res) => {
    const { budgetId } = req.body;

    try {

        if (!budgetId) {
            return res.redirect(
                '/budgets?error=' + encodeURIComponent('Missing budgetId')
            );
        }

        const success = await budgetData.deleteBudgetById(budgetId);

        if (!success) {
            return res.redirect(
                '/budgets?error=' + encodeURIComponent('Budget not found')
            );
        }

        return res.redirect(
            '/budgets?message=' + encodeURIComponent ('Budget deleted successfully')
        );
    } catch (e) {
        return res.redirect(
            '/budgets?error=' + encodeURIComponent(e.message || 'Failed to delete budget')
        );
    }
});

router.post('/toggle/:id', ensureLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        await budgetData.toggleBudgetActive(id, req.session.user._id);
    } catch (err) {
        console.error('Errror toggling budget:', err);
        }
        return res.redirect('/budgets');
});


export default router;