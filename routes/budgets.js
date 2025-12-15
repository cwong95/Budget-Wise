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

  const isAjax =
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes('application/json'));

  const renderWithError = async (statusCode, errMsg) => {
    try {
      const userBudgets = await budgetData.getBudgetsForUser(userId);
      const formattedBudgets = userBudgets.map((b) => ({
        ...b,
        startDateFormatted: b.startDate
          ? new Date(b.startDate).toLocaleDateString('en-US')
          : '',
        endDateFormatted: b.endDate
          ? new Date(b.endDate).toLocaleDateString('en-US')
          : ''
      }));

      return res.status(statusCode).render('budget', {
        title: 'Manage Budgets',
        budgets: formattedBudgets,
        categories: CATEGORY_OPTIONS,
        error: errMsg,
        message: null
      });
    } catch {
      return res.status(statusCode).render('budget', {
        title: 'Manage Budgets',
        budgets: [],
        categories: CATEGORY_OPTIONS,
        error: errMsg,
        message: null
      });
    }
  };

  try {
    if (!category || !amountLimit || !startDate || !endDate) {
      const errMsg = 'All budget fields (category, amount, dates) are required.';

      if (isAjax) {
        return res.status(400).json({ success: false, error: errMsg });
      }

      return renderWithError(400, errMsg);
    }

    const newBudget = await budgetData.createBudget({
      userId,
      category,
      amountLimit: Number(amountLimit),
      startDate,
      endDate,
      active: true
    });

    if (isAjax) {
      return res.status(200).json({ success: true, budget: newBudget });
    }

    return res.redirect(
      '/budgets?message=' + encodeURIComponent('Budget created successfully')
    );
  } catch (e) {
    const errMsg = e.message || 'Could not save the new budget.';

    if (isAjax) {
      return res.status(500).json({ success: false, error: errMsg });
    }

    return renderWithError(500, errMsg);
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