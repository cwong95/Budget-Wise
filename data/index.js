import { Router } from "express";
import budgetRoutes from "./budgetRoutes.js";
import authRoutes from "./authRoutes.js";
import historyRoutes from "./historyRoutes.js";

const router = Router();

// Public home page.
router.use("/", budgetRoutes);

// Auth routes: /signup, /login, /logout.
router.use("/", authRoutes);

// Authenticated views like bill history.
router.use("/", historyRoutes);

export default router;

//import * as usersDataFunctions from './users.js';
//import * as utilitiesDataFunctions from './utilities.js';
//import * as billsDataFunctions from './bills.js';
//import * as remindersDataFunctions from './reminders.js';
import * as budgetDataFunctions from './budget.js'; 


//export const usersData = usersDataFunctions;
//export const utilitiesData = utilitiesDataFunctions;
//export const billsData = billsDataFunctions;
//export const remindersData = remindersDataFunctions;
export const budgetData = budgetDataFunctions;

