import assert from "node:assert/strict";
import test from "node:test";
import { buildAdaptAIChatSystemPrompt } from "./ai-service.js";

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