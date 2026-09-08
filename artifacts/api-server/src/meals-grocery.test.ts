import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiMeal, AiShoppingItem } from "./ai-context.js";
import { mapShoppingToContext } from "./ai-context.js";
import { buildTodayBriefing } from "./today-briefing.js";
import {
  buildMealsGroceryContextNote,
  buildMealsGroceryResponse,
  isMealsGroceryRequest,
} from "./meals-grocery.js";

const baseContext = (overrides: Partial<AdaptAIContext> = {}): AdaptAIContext => ({
  identity: { displayName: "Alex" },
  today: { date: "2026-09-04", time: "17:00", timezone: "Asia/Calcutta" },
  ...overrides,
});

const meal = (overrides: Partial<AiMeal> = {}): AiMeal => ({
  mealType: "dinner",
  mealName: "Pasta",
  plannedDate: "2026-09-04",
  isCompleted: false,
  ...overrides,
});

const item = (overrides: Partial<AiShoppingItem> = {}): AiShoppingItem => ({
  itemName: "Tomatoes",
  category: "produce",
  ...overrides,
});

test("recognizes meal, dinner, grocery, shopping-list, and preparation questions", () => {
  for (const request of [
    "What's for dinner?",
    "What do I need from the grocery store?",
    "What meals are planned today?",
    "What should I prepare next?",
    "What is on my shopping list?",
  ]) {
    assert.equal(isMealsGroceryRequest(request), true, request);
  }
});

test("summarizes an existing meal without inventing a recipe", () => {
  const response = buildMealsGroceryResponse(
    "What's for dinner?",
    baseContext({ meals: [meal({ mealName: "Pasta primavera" })] })
  );

  assert.equal(response, "Tonight's planned meal is Pasta primavera.");
  assert.doesNotMatch(response, /recipe|ingredients|garlic|sauce/i);
});

test("reports no meal when no meal is recorded", () => {
  assert.equal(
    buildMealsGroceryResponse("What's for dinner?", baseContext()),
    "I don't have a planned dinner for today."
  );
});

test("lists active shopping items with quantities", () => {
  const response = buildMealsGroceryResponse(
    "What do I need from the grocery store?",
    baseContext({
      shopping: [
        item({ itemName: "Milk", quantity: "1 gallon" }),
        item({ itemName: "Bread", quantity: "1 loaf" }),
      ],
    })
  );

  assert.equal(
    response,
    "You have 2 grocery items still on your list: Milk (1 gallon), Bread (1 loaf)."
  );
});

test("filters completed shopping items before they reach AdaptAI", () => {
  const mapped = mapShoppingToContext(
    [
      { userId: 42, itemName: "Milk", category: "dairy", isPurchased: false },
      { userId: 42, itemName: "Bread", category: "bakery", isPurchased: true },
    ] as any,
    42
  );

  assert.deepEqual(mapped.map((shoppingItem) => shoppingItem.itemName), ["Milk"]);
  assert.equal(
    buildMealsGroceryResponse("What is on my shopping list?", baseContext({ shopping: mapped })),
    "You have 1 grocery item still on your list: Milk."
  );
});

test("combines a planned meal and grocery count", () => {
  const context = baseContext({
    meals: [meal({ mealName: "Pasta" })],
    shopping: [item(), item({ itemName: "Parmesan" })],
  });

  assert.equal(
    buildMealsGroceryResponse("What's for dinner and what is on my shopping list?", context),
    "Tonight's planned meal is Pasta. You have 2 grocery items still on your list: Tomatoes, Parmesan."
  );
  assert.equal(
    buildMealsGroceryContextNote(context),
    "Tonight's planned meal is Pasta. You have 2 grocery items still on your list."
  );
});

test("connects meal and grocery information to Today Briefing", () => {
  const briefing = buildTodayBriefing(
    baseContext({
      meals: [meal({ mealName: "Pasta" })],
      shopping: [item(), item({ itemName: "Parmesan" })],
    })
  );

  assert.match(
    briefing,
    /Tonight's planned meal is Pasta\. You have 2 grocery items still on your list\./
  );
  assert.match(briefing, /Anytime — dinner: Pasta/);
});