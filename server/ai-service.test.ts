import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdaptAIChatSystemPrompt,
  generateAdaptAIChatTurn,
  getAdaptAIChatFallbackResponse,
} from "./ai-service.js";

test("chat prompt consumes communication profile as presentation guidance", () => {
  const context = {
    identity: { displayName: "Alex" },
    communicationProfile: {
      preferredName: "Sam",
      communicationPreferences: {
        simpleLanguage: true,
        tone: "gentle",
        useStepByStep: true,
      },
      detailLevel: "concise",
      accessibilityPreferences: {
        screenReader: true,
        largerText: false,
        voiceOutput: true,
        reducedMotion: false,
        highContrast: false,
      },
      routinePreferences: {
        preferredTaskTime: "morning",
        supportLevel: "enhanced",
      },
    },
    today: {
      date: "2026-09-04",
      time: "09:00",
      timezone: "Asia/Calcutta",
    },
  } as any;

  const prompt = buildAdaptAIChatSystemPrompt(context);

  assert.match(prompt, /Use communicationProfile only for presentation/);
  assert.match(prompt, /never infer autism, disability, illness/i);
  assert.match(prompt, /"preferredName":"Sam"/);
  assert.match(prompt, /"detailLevel":"concise"/);
  assert.match(prompt, /"screenReader":true/);
});

test("chat fallback is plain text and does not invent records", () => {
  const fallback = getAdaptAIChatFallbackResponse("What tasks do I have today?");

  assert.match(fallback, /temporarily unavailable/i);
  assert.doesNotMatch(fallback, /[*•]/);
  assert.doesNotMatch(fallback, /Buy|appointment|medication/i);
});

test("chat returns a safe fallback when the provider is not configured", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const result = await generateAdaptAIChatTurn(
      "Tell me something helpful",
      {
        identity: { displayName: "Alex" },
        communicationProfile: {} as any,
        today: {
          date: "2026-09-04",
          time: "09:00",
          timezone: "UTC",
        },
      } as any,
    );

    assert.equal(result.fallback, true);
    assert.match(result.message, /temporarily unavailable/i);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});