import assert from "node:assert/strict";
import test from "node:test";
import {
  claimDailyChatbotGreeting,
  getChatbotGreeting,
  getDisplayName,
} from "./chatbot-greeting";

test("formats requested username examples", () => {
  const examples = [
    ["Ethan", "Ethan"],
    ["Ethan123", "Ethan"],
    ["Ethan456", "Ethan"],
    ["ethan123", "Ethan"],
    ["ETHAN123", "Ethan"],
    ["Ethan_123", "Ethan"],
    ["Ethan-123", "Ethan"],
    ["Ethan12345", "Ethan"],
  ] as const;

  for (const [username, expected] of examples) {
    assert.equal(getDisplayName(username), expected);
  }
});

test("preserves words and prefers profile names", () => {
  assert.equal(getDisplayName("EthanSmith123"), "Ethan Smith");
  assert.equal(getDisplayName("Ethan_Smith123"), "Ethan Smith");
  assert.equal(getDisplayName("ethan123", "Ethan Smith"), "Ethan Smith");
  assert.equal(getDisplayName("technical_user_123", "Ethan Smith"), "Ethan Smith");
});

test("keeps meaningful digits in the middle of a name", () => {
  assert.equal(getDisplayName("Room2B123"), "Room2 B");
});

test("rejects unsafe or non-human username fallbacks", () => {
  assert.equal(getDisplayName(""), null);
  assert.equal(getDisplayName(null), null);
  assert.equal(getDisplayName("123456"), null);
  assert.equal(getDisplayName("user_123"), null);
  assert.equal(getDisplayName("550e8400-e29b-41d4-a716-446655440000"), null);
  assert.equal(getDisplayName("ethan@example.com"), null);
  assert.equal(getDisplayName("ethan@example.com", "Ethan"), "Ethan");
});

test("cleans spaces and special characters", () => {
  assert.equal(getDisplayName("  eTHAN-123!!!  "), "Ethan");
  assert.equal(getDisplayName("Ethan...Smith123"), "Ethan Smith");
});

test("uses the resolved human display name in the first greeting", () => {
  assert.equal(
    getChatbotGreeting(getDisplayName("ethan123", "Ethan Smith"), new Date(2026, 8, 4, 9)),
    "Good morning, Ethan Smith 👋",
  );
});

test("claims a greeting once per user and local day", () => {
  const userId = `greeting-test-${Date.now()}`;
  const firstDay = new Date(2026, 8, 4, 9);
  const nextDay = new Date(2026, 8, 5, 9);

  assert.equal(claimDailyChatbotGreeting(userId, firstDay), true);
  assert.equal(claimDailyChatbotGreeting(userId, firstDay), false);
  assert.equal(claimDailyChatbotGreeting(userId, nextDay), true);
});