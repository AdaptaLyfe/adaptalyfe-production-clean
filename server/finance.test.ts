import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiBill, AiBudgetCategory, AiBudgetEntry, AiGoal } from "./ai-context.js";
import { mapBillsToContext, mapBudgetCategoriesToContext, mapBudgetEntriesToContext } from "./ai-context.js";
import { buildTodayBriefing } from "./today-briefing.js";
import {
  buildFinanceContextNote,
  buildFinanceResponse,
  isFinanceRequest,
} from "./finance.js";

const baseContext = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Alex" },
  today: { date: "2026-09-04", time: "09:00", timezone: "Asia/Calcutta" },
  ...overrides,
});

const bill = (overrides: Partial<AiBill> = {}): AiBill => ({
  name: "Electricity",
  amount: 80,
  dueDayOfMonth: 4,
  isPaid: false,
  dueStatus: "due_today",
  daysUntilDue: 0,
  ...overrides,
});

const budgetEntry = (overrides: Partial<AiBudgetEntry> = {}): AiBudgetEntry => ({
  category: "Food",
  amount: 120,
  type: "expense",
  ...overrides,
});

const budgetCategory = (overrides: Partial<AiBudgetCategory> = {}): AiBudgetCategory => ({
  name: "Food",
  type: "expense",
  budgetedAmount: 300,
  ...overrides,
});

test("recognizes supported finance questions", () => {
  for (const request of [
    "What bills are coming up?",
    "What do I need to pay?",
    "How am I doing with my budget?",
    "What financial task should I handle next?",
    "What is due today?",
  ]) {
    assert.equal(isFinanceRequest(request), true, request);
  }
});

test("prioritizes overdue bills", () => {
  const response = buildFinanceResponse(
    "What bills are coming up?",
    baseContext({
      finance: {
        due: [],
        bills: [
          bill({ name: "Electricity", dueStatus: "overdue", dueDayOfMonth: 1, daysUntilDue: -3 }),
          bill({ name: "Internet", dueStatus: "due_soon", dueDayOfMonth: 8, daysUntilDue: 4 }),
        ],
      },
    })
  );

  assert.ok(response.indexOf("overdue") < response.indexOf("due soon"));
  assert.match(response, /Electricity/);
  assert.match(response, /Internet/);
});

test("summarizes a bill due soon and a financial next task", () => {
  const context = baseContext({
    finance: {
      due: [],
      bills: [bill({ name: "Internet", dueStatus: "due_soon", dueDayOfMonth: 8, daysUntilDue: 4 })],
    },
  });

  assert.match(buildFinanceResponse("What bills are coming up?", context), /1 bill due soon: Internet/);
  assert.match(buildFinanceResponse("What financial task should I handle next?", context), /Start with the bill due soon/);
});

test("does not ask the user to pay a paid bill", () => {
  const context = baseContext({
    finance: {
      due: [],
      bills: [bill({ name: "Electricity", isPaid: true, dueStatus: "paid" })],
    },
  });

  const response = buildFinanceResponse("What do I need to pay?", context);
  assert.match(response, /marked as paid/);
  assert.doesNotMatch(response, /pay your|unpaid/i);
});

test("handles empty finance records without inventing information", () => {
  const response = buildFinanceResponse("How am I doing with my budget?", baseContext());

  assert.match(response, /don't have recorded budget information/i);
  assert.doesNotMatch(response, /\$|bill due|income|expense/i);
});

test("summarizes recorded budget entries, categories, and financial goals", () => {
  const goal: AiGoal = {
    title: "Emergency fund",
    category: "savings",
    priority: "high",
    targetAmount: 1000,
    currentAmount: 250,
    isDueToday: false,
    isCompleted: false,
  };
  const response = buildFinanceResponse(
    "How am I doing with my budget?",
    baseContext({
      finance: {
        due: [],
        budgetEntries: [
          budgetEntry({ type: "income", amount: 1000 }),
          budgetEntry({ type: "expense", amount: 120 }),
          budgetEntry({ type: "savings_allocation", amount: 80 }),
        ],
        budgetCategories: [budgetCategory()],
      },
      goals: [goal],
    })
  );

  assert.match(response, /\$1000 recorded income/);
  assert.match(response, /\$120 recorded expenses/);
  assert.match(response, /\$80 recorded for savings/);
  assert.match(response, /\$300 budgeted across 1 category/);
  assert.match(response, /Emergency fund/);
});

test("derives overdue and due-today status from user-scoped bill records", () => {
  const mapped = mapBillsToContext(
    [
      { userId: 42, name: "Electricity", amount: 80, dueDate: 1, category: "utilities", isPaid: false },
      { userId: 42, name: "Internet", amount: 50, dueDate: 4, category: "utilities", isPaid: false },
      { userId: 99, name: "Private bill", amount: 900, dueDate: 4, category: "private", isPaid: false },
    ] as any,
    "2026-09-04",
    42
  );

  assert.deepEqual(mapped.map((item) => [item.name, item.dueStatus]), [
    ["Electricity", "overdue"],
    ["Internet", "due_today"],
  ]);
});

test("filters budget projections to the authenticated user", () => {
  const entries = mapBudgetEntriesToContext(
    [
      { userId: 42, category: "Food", amount: 100, type: "expense" },
      { userId: 99, category: "Private", amount: 999, type: "expense" },
    ] as any,
    42
  );
  const categories = mapBudgetCategoriesToContext(
    [
      { userId: 42, name: "Food", type: "expense", budgetedAmount: 300, isActive: true },
      { userId: 99, name: "Private", type: "expense", budgetedAmount: 999, isActive: true },
    ] as any,
    42
  );

  assert.deepEqual(entries.map((entry) => entry.category), ["Food"]);
  assert.deepEqual(categories.map((category) => category.name), ["Food"]);
});

test("adds urgent unpaid financial items to Today Briefing", () => {
  const context = baseContext({
    finance: {
      due: [bill({ name: "Electricity", dueStatus: "overdue", dueDayOfMonth: 1, daysUntilDue: -3 })],
      bills: [bill({ name: "Electricity", dueStatus: "overdue", dueDayOfMonth: 1, daysUntilDue: -3 })],
    },
  });

  const briefing = buildTodayBriefing(context);
  assert.match(briefing, /Urgent: You have 1 overdue bill/);
  assert.match(briefing, /Electricity is marked as unpaid/);
  assert.match(briefing, /Overdue bill: Electricity/);
});