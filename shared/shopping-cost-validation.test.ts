import assert from "node:assert/strict";
import test from "node:test";

import {
  insertShoppingListSchema,
  updateShoppingItemPurchasedSchema,
} from "./schema.js";

const baseShoppingItem = {
  userId: 1,
  itemName: "Apples",
  category: "produce",
};

test("shopping item estimated cost accepts zero and positive decimals", () => {
  for (const estimatedCost of [0, 0.4, 1.5, 10]) {
    const result = insertShoppingListSchema.safeParse({
      ...baseShoppingItem,
      estimatedCost,
    });

    assert.equal(result.success, true);
  }
});

test("shopping item estimated cost rejects negative values", () => {
  const result = insertShoppingListSchema.safeParse({
    ...baseShoppingItem,
    estimatedCost: -0.4,
  });

  assert.equal(result.success, false);
});

test("purchased shopping item cost rejects negative values", () => {
  const result = updateShoppingItemPurchasedSchema.safeParse({
    isPurchased: true,
    actualCost: -1,
  });

  assert.equal(result.success, false);
});

test("purchased shopping item cost accepts zero and positive decimals", () => {
  for (const actualCost of [0, 0.4, 1.5, 10]) {
    const result = updateShoppingItemPurchasedSchema.safeParse({
      isPurchased: true,
      actualCost,
    });

    assert.equal(result.success, true);
  }
});