#!/usr/bin/env node
import { dbConnection, closeConnection } from '../config/mongoConnection.js';
import {
  users as usersCol,
  utilities as utilitiesCol,
  bills as billsCol,
  transactions as transactionsCol,
  reminders as remindersCol,
  budgets as budgetsCol,
} from '../config/mongoCollections.js';
import * as usersData from '../data/users.js';
import * as utilitiesData from '../data/utilities.js';
import * as billsData from '../data/bills.js';
import * as transactionsData from '../data/transactions.js';
import * as remindersData from '../data/reminders.js';
import * as budgetData from '../data/budget.js';

const clearCollections = async () => {
  const colFns = [usersCol, utilitiesCol, billsCol, transactionsCol, remindersCol, budgetsCol];
  for (const fn of colFns) {
    try {
      const c = await fn();
      await c.deleteMany({});
    } catch (e) {
      console.warn('Warning clearing collection', e.message || e);
    }
  }
};

const run = async () => {
  try {
    await dbConnection();
    console.log('Connected to DB — seeding data...');

    // Clear existing demo data
    await clearCollections();

    // Create demo user
    const demoUser = await usersData.createUser({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'password123',
    });
    console.log('Created user:', demoUser.email, demoUser._id);

    // Create some utilities (auto-creates current month's bill when defaultDay provided)
    const u1 = await utilitiesData.createUtility(
      demoUser._id,
      'Electric Co',
      'ELEC-001',
      15,
      85.5,
      'Monthly electricity',
      true
    );
    console.log('Created utility:', u1.utility.provider, u1.utility._id);

    const u2 = await utilitiesData.createUtility(
      demoUser._id,
      'Waterworks',
      'WTR-123',
      10,
      25.0,
      'Municipal water',
      true
    );
    console.log('Created utility:', u2.utility.provider, u2.utility._id);

    // Create a manual bill (for variety)
    const manualBill = await billsData.createBill(
      demoUser._id,
      u1.utility._id,
      new Date(new Date().getFullYear(), new Date().getMonth(), 20),
      95.0,
      'upcoming',
      'Extra charge for meter upgrade'
    );
    console.log('Created manual bill:', manualBill._id);

    // Create transactions
    await transactionsData.addTransaction(
      demoUser._id,
      'Salary',
      'Paycheck',
      2500,
      'Income',
      'Income',
      new Date().toISOString(),
      'Monthly salary'
    );
    await transactionsData.addTransaction(
      demoUser._id,
      'Grocery',
      'Supermarket',
      120.45,
      'Groceries',
      'Expense',
      new Date().toISOString(),
      'Weekly groceries'
    );
    await transactionsData.addTransaction(
      demoUser._id,
      'Coffee',
      'Cafe',
      4.5,
      'Dining',
      'Expense',
      new Date().toISOString(),
      'Morning coffee'
    );
    console.log('Added sample transactions');

    // Create a budget
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
    const budget = await budgetData.createBudget({
      userId: demoUser._id,
      category: 'Groceries',
      amountLimit: 500,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    console.log('Created budget:', budget._id);

    // Create reminders for all bills for the user
    const billsForUser = await billsData.getBillsForUser(demoUser._id);
    for (const b of billsForUser) {
      const created = await remindersData.createBillReminders(demoUser._id, b, 3);
      if (created && created.length)
        console.log(`Created ${created.length} reminders for bill ${b._id}`);
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await closeConnection();
    console.log('DB connection closed.');
  }
};

if (
  import.meta.url === `file://${process.argv[1]}` ||
  (process.argv[1] && process.argv[1].endsWith('db_seed.js'))
) {
  run();
}

export default run;
