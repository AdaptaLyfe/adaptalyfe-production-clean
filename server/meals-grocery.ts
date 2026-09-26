import type { AdaptAIContext, AiMeal, AiShoppingItem } from "./ai-context.js";

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

function activeMeals(context: AdaptAIContext): AiMeal[] {
  return (context.meals ?? []).filter((meal) => !meal.isCompleted);
}

function mealLabel(meal: AiMeal): string {
  return meal.mealType.trim()
    ? `${meal.mealType.trim().toLowerCase()}: ${meal.mealName}`
    : meal.mealName;
}

function itemLabel(item: AiShoppingItem): string {
  return item.quantity ? `${item.itemName} (${item.quantity})` : item.itemName;
}

function grocerySentence(items: AiShoppingItem[]): string {
  if (items.length === 0) return "You don't have any uncompleted grocery items on your list.";

  const listedItems = items.slice(0, 8).map(itemLabel).join(", ");
  const suffix = items.length > 8 ? `, and ${items.length - 8} more` : "";
  return `You have ${items.length} grocery ${items.length === 1 ? "item" : "items"} still on your list: ${listedItems}${suffix}.`;
}

function mealSentence(meals: AiMeal[], asksDinner: boolean): string {
  if (meals.length === 0) {
    return asksDinner
      ? "I don't have a planned dinner for today."
      : "I don't have any uncompleted meals planned for today.";
  }

  if (asksDinner) {
    const dinner = meals.find((meal) => meal.mealType.trim().toLowerCase() === "dinner");
    return dinner
      ? `Tonight's planned meal is ${dinner.mealName}.`
      : "I don't have a planned dinner for today.";
  }

  const listedMeals = meals.slice(0, 6).map(mealLabel).join(", ");
  const suffix = meals.length > 6 ? `, and ${meals.length - 6} more` : "";
  return `Today's planned meals are ${listedMeals}${suffix}.`;
}

/**
 * Recognize explicit meal, dinner, grocery, shopping-list, and preparation
 * questions. "Prepare next" stays here so it can choose a recorded meal
 * instead of inventing a cooking task.
 */
export function isMealsGroceryRequest(message: string): boolean {
  const normalized = normalize(message);
  return [
    /\bwhat(?:'s| is) for dinner\b/,
    /\bwhat meals? (?:are )?planned today\b/,
    /\bwhat do i need from the grocery store\b/,
    /\bwhat(?:'s| is) on my shopping list\b/,
    /\bwhat should i prepare next\b/,
    /\b(?:meal|meals|grocery|groceries|shopping list)\b/,
  ].some((pattern) => pattern.test(normalized));
}

export function shouldIncludeMealsGroceryContext(message: string): boolean {
  return isMealsGroceryRequest(message) || /\b(?:dinner|breakfast|lunch|snack|cook|prepare)\b/i.test(message);
}

/**
 * Build a concise answer entirely from today's recorded meals and the
 * authenticated user's active shopping items. This function is read-only and
 * never creates or changes a meal or shopping-list item.
 */
export function buildMealsGroceryResponse(message: string, context: AdaptAIContext): string {
  const normalized = normalize(message);
  const meals = activeMeals(context);
  const asksDinner = /\bdinner\b/.test(normalized);
  const asksMeals = /\b(?:meal|meals|dinner|breakfast|lunch|snack|prepare|cook)\b/.test(normalized);
  const asksGroceries = /\b(?:grocery|groceries|shopping list|shop|store)\b/.test(normalized);
  const asksNext = normalized.includes("prepare next");
  const shopping = context.shopping ?? [];

  if (asksNext) {
    const nextMeal = meals[0];
    return nextMeal
      ? `Your next recorded meal to prepare is ${mealLabel(nextMeal)}.`
      : "I don't have an uncompleted meal planned for today to prepare next.";
  }

  const parts: string[] = [];
  if (asksMeals || !asksGroceries) parts.push(mealSentence(meals, asksDinner));
  if (asksGroceries) parts.push(grocerySentence(shopping));
  return parts.join(" ");
}

/**
 * Add meal/grocery information only to a Today Briefing. Completed meals are
 * omitted, and shopping is already active-only at the storage boundary.
 */
export function buildMealsGroceryContextNote(context: AdaptAIContext): string | undefined {
  const meals = activeMeals(context);
  const shopping = context.shopping ?? [];
  if (meals.length === 0 && shopping.length === 0) return undefined;

  const dinner = meals.find((meal) => meal.mealType.trim().toLowerCase() === "dinner");
  const mealNote = dinner
    ? `Tonight's planned meal is ${dinner.mealName}.`
    : meals.length > 0
      ? `You have ${meals.length} planned meal${meals.length === 1 ? "" : "s"} today.`
      : undefined;
  const groceryNote =
    shopping.length > 0
      ? `You have ${shopping.length} grocery ${shopping.length === 1 ? "item" : "items"} still on your list.`
      : undefined;

  return [mealNote, groceryNote].filter(Boolean).join(" ");
}