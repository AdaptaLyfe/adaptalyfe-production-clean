import type { AdaptAIContext, AiBill, AiBudgetCategory, AiBudgetEntry } from "./ai-context.js";

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function billLabel(bill: AiBill): string {
  return `${bill.name} (${money(bill.amount)})`;
}

function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function unpaidBills(context: AdaptAIContext): AiBill[] {
  return (context.finance?.bills ?? context.finance?.due ?? []).filter((bill) => !bill.isPaid);
}

function recordedBills(context: AdaptAIContext): AiBill[] {
  return context.finance?.bills ?? context.finance?.due ?? [];
}

function billPriority(bill: AiBill): number {
  switch (bill.dueStatus) {
    case "overdue":
      return 0;
    case "due_today":
      return 1;
    case "due_soon":
      return 2;
    default:
      return 3;
  }
}

function sortedUnpaidBills(context: AdaptAIContext): AiBill[] {
  return unpaidBills(context).slice().sort((a, b) => {
    const priorityDifference = billPriority(a) - billPriority(b);
    return priorityDifference !== 0
      ? priorityDifference
      : (a.daysUntilDue ?? Number.POSITIVE_INFINITY) -
          (b.daysUntilDue ?? Number.POSITIVE_INFINITY);
  });
}

function billSummarySentence(context: AdaptAIContext): string | undefined {
  const bills = sortedUnpaidBills(context);
  if (bills.length === 0) return undefined;

  const overdue = bills.filter((bill) => bill.dueStatus === "overdue");
  const dueToday = bills.filter((bill) => bill.dueStatus === "due_today");
  const dueSoon = bills.filter((bill) => bill.dueStatus === "due_soon");
  const parts: string[] = [];

  if (overdue.length > 0) {
    parts.push(
      `${countLabel(overdue.length, "overdue bill")}: ${overdue
        .slice(0, 3)
        .map(billLabel)
        .join(", ")}.`
    );
  }
  if (dueToday.length > 0) {
    parts.push(
      `${countLabel(dueToday.length, "bill")} due today: ${dueToday
        .slice(0, 3)
        .map((bill) => `${bill.name} is marked as unpaid`)
        .join(", ")}.`
    );
  }
  if (dueSoon.length > 0) {
    parts.push(
      `${countLabel(dueSoon.length, "bill")} due soon: ${dueSoon
        .slice(0, 3)
        .map(billLabel)
        .join(", ")}.`
    );
  }

  const later = bills.filter(
    (bill) =>
      bill.dueStatus !== "overdue" &&
      bill.dueStatus !== "due_today" &&
      bill.dueStatus !== "due_soon"
  );
  if (later.length > 0) {
    parts.push(
      `${countLabel(later.length, "upcoming bill")}: ${later
        .slice(0, 3)
        .map((bill) => `${bill.name}, due on day ${bill.dueDayOfMonth}`)
        .join(", ")}.`
    );
  }

  return parts.join(" ");
}

function budgetSummarySentence(
  entries: AiBudgetEntry[],
  categories: AiBudgetCategory[]
): string | undefined {
  if (entries.length === 0 && categories.length === 0) return undefined;

  const income = entries
    .filter((entry) => entry.type.toLowerCase() === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expenses = entries
    .filter((entry) => entry.type.toLowerCase() === "expense")
    .reduce((total, entry) => total + entry.amount, 0);
  const savings = entries
    .filter((entry) => entry.type.toLowerCase() === "savings_allocation")
    .reduce((total, entry) => total + entry.amount, 0);
  const pieces: string[] = [];

  if (income !== 0) pieces.push(`${money(income)} recorded income`);
  if (expenses !== 0) pieces.push(`${money(expenses)} recorded expenses`);
  if (savings !== 0) pieces.push(`${money(savings)} recorded for savings`);
  if (categories.length > 0) {
    const planned = categories.reduce((total, category) => total + category.budgetedAmount, 0);
    pieces.push(`${money(planned)} budgeted across ${countLabel(categories.length, "category")}`);
  }

  return pieces.length > 0
    ? `Your recorded budget includes ${pieces.join(", ")}.`
    : "I have recorded budget categories, but no amounts to summarize.";
}

function goalSentence(context: AdaptAIContext): string | undefined {
  const goals = (context.goals ?? []).filter((goal) => !goal.isCompleted);
  if (goals.length === 0) return undefined;
  const goal = goals[0];
  const progress =
    goal.currentAmount !== undefined && goal.targetAmount !== undefined
      ? ` (${money(goal.currentAmount)} of ${money(goal.targetAmount)} recorded)`
      : "";
  return `Your recorded financial goal is ${goal.title}${progress}.`;
}

function noFinanceResponse(): string {
  return "I don't have recorded bills, budget information, or financial goals to summarize yet.";
}

function investmentSafetyResponse(): string {
  return "I can summarize your recorded bills, budget, and financial goals, but I can't provide personalized investment advice.";
}

/**
 * Recognize finance requests handled by the deterministic finance module.
 * Investment questions are included so they receive the safety boundary
 * instead of an improvised personalized recommendation.
 */
export function isFinanceRequest(message: string): boolean {
  const normalized = normalize(message);
  return [
    /\bwhat bills? (?:are )?coming up\b/,
    /\bwhat do i need to pay\b/,
    /\bhow am i doing with my budget\b/,
    /\bwhat financial task should i handle next\b/,
    /\bwhat is due today\b/,
    /\b(?:bill|bills|budget|financial|finance|money|overdue|investment|investing|stocks?|crypto|retirement)\b/,
  ].some((pattern) => pattern.test(normalized));
}

export function shouldIncludeFinanceContext(message: string): boolean {
  return isFinanceRequest(message);
}

/**
 * Build a concise, read-only response from the authenticated user's existing
 * bills, budgets, and savings goals. No payment is initiated and no financial
 * record is changed.
 */
export function buildFinanceResponse(message: string, context: AdaptAIContext): string {
  const normalized = normalize(message);
  if (/\b(?:investment|investing|stocks?|crypto|retirement)\b/.test(normalized)) {
    return investmentSafetyResponse();
  }

  const asksBudget = /\b(?:budget|how am i doing)\b/.test(normalized);
  const asksNext = /\b(?:financial task|financial next step|handle next)\b/.test(normalized);
  const asksToday = /\bdue today\b/.test(normalized);
  const asksBills = /\b(?:bill|bills|coming up|pay)\b/.test(normalized);
  const parts: string[] = [];

  if (asksNext) {
    const nextBill = sortedUnpaidBills(context)[0];
    if (nextBill) {
      const urgency =
        nextBill.dueStatus === "overdue"
          ? "Start with your overdue bill"
          : nextBill.dueStatus === "due_today"
            ? "Start with the bill due today"
            : nextBill.dueStatus === "due_soon"
              ? "Start with the bill due soon"
              : "Your next recorded financial task is";
      return `${urgency}: ${billLabel(nextBill)}.`;
    }
    const goal = goalSentence(context);
    if (goal) return `A useful recorded financial next step is to review ${goal.slice(0, -1)}.`;
    if (context.finance?.budgetEntries?.length || context.finance?.budgetCategories?.length) {
      return "A useful financial next step is to review your recorded budget.";
    }
    return "I don't have a recorded financial task to suggest yet.";
  }

  if (asksToday) {
    const todayBills = unpaidBills(context).filter((bill) => bill.dueStatus === "due_today");
    if (todayBills.length === 0) {
      return "You don't have an unpaid bill recorded as due today.";
    }
    return `You have ${countLabel(todayBills.length, "bill")} due today. ${todayBills
      .slice(0, 3)
      .map((bill) => `${bill.name} is marked as unpaid`)
      .join(", ")}.`;
  }

  if (asksBills || !asksBudget) {
    const billSummary = billSummarySentence(context);
    if (billSummary) parts.push(billSummary);
    else if (recordedBills(context).length > 0) {
      const paidBills = recordedBills(context).filter((bill) => bill.isPaid);
      parts.push(
        `Your recorded ${countLabel(paidBills.length, "bill")} ${
          paidBills.length === 1 ? "is" : "are"
        } marked as paid: ${paidBills.slice(0, 3).map((bill) => bill.name).join(", ")}.`
      );
    } else {
      parts.push("You don't have any unpaid bills recorded.");
    }
  }

  if (asksBudget) {
    const budgetSummary = budgetSummarySentence(
      context.finance?.budgetEntries ?? [],
      context.finance?.budgetCategories ?? []
    );
    parts.push(budgetSummary ?? "I don't have recorded budget information to summarize.");
  }

  const goal = asksBudget ? goalSentence(context) : undefined;
  if (goal) parts.push(goal);

  return parts.length > 0 ? parts.join(" ") : noFinanceResponse();
}

/**
 * Surface only urgent unpaid financial records in a Today Briefing.
 * Paid bills and bills due later are deliberately omitted.
 */
export function buildFinanceContextNote(context: AdaptAIContext): string | undefined {
  const bills = sortedUnpaidBills(context);
  const overdue = bills.filter((bill) => bill.dueStatus === "overdue");
  const dueToday = bills.filter((bill) => bill.dueStatus === "due_today");
  const dueSoon = bills.filter((bill) => bill.dueStatus === "due_soon");

  if (overdue.length > 0) {
    return `Urgent: You have ${countLabel(overdue.length, "overdue bill")}: ${overdue
      .slice(0, 3)
      .map((bill) => `${bill.name} is marked as unpaid`)
      .join(", ")}.`;
  }
  if (dueToday.length > 0) {
    return `You have ${countLabel(dueToday.length, "bill")} due today. ${dueToday
      .slice(0, 3)
      .map((bill) => `${bill.name} is marked as unpaid`)
      .join(", ")}.`;
  }
  if (dueSoon.length > 0) {
    return `You have ${countLabel(dueSoon.length, "bill")} due soon: ${dueSoon
      .slice(0, 3)
      .map((bill) => bill.name)
      .join(", ")}.`;
  }
  return undefined;
}