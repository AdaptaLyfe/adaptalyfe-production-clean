import assert from "node:assert/strict";
import test from "node:test";
import type { AdaptAIContext, AiMedication, AiTask } from "./ai-context.js";
import {
  buildMedicationHealthResponse,
  isExplicitMedicalInformationRequest,
  isMedicationHealthRequest,
} from "./medication-health.js";

const medication = (
  medicationName: string,
  overrides: Partial<AiMedication> = {}
): AiMedication => ({
  medicationName,
  reminderEnabled: true,
  ...overrides,
});

const task = (overrides: Partial<AiTask>): AiTask => ({
  title: "Task",
  category: "health",
  isCompleted: false,
  frequency: "daily",
  estimatedMinutes: 5,
  ...overrides,
});

const context = (
  medications: AiMedication[] = [],
  tasks: AiTask[] = [],
  time = "10:00"
): AdaptAIContext => ({
  identity: { displayName: "Alex" },
  today: { date: "2026-09-03", time, timezone: "Asia/Calcutta" },
  medications: medications.length
    ? {
        recorded: medications,
        scheduledToday: medications.filter((item) => item.reminderEnabled),
      }
    : undefined,
  tasks: tasks.length
    ? {
        today: tasks,
        incomplete: tasks.filter((item) => !item.isCompleted),
        completed: tasks.filter((item) => item.isCompleted),
      }
    : undefined,
});

test("does not report no medication when the medication section failed", () => {
  const response = buildMedicationHealthResponse("What medications do I take?", {
    ...context(),
    dataAvailability: { unavailableSections: ["medications"] },
  });

  assert.match(response, /couldn't load your medication records/i);
});

test("recognizes medication requests and explicit medical-record requests", () => {
  assert.equal(isMedicationHealthRequest("What medications are recorded?"), true);
  assert.equal(isMedicationHealthRequest("Did I miss my medication reminder?"), true);
  assert.equal(isExplicitMedicalInformationRequest("What medical conditions do I have?"), true);
  assert.equal(isExplicitMedicalInformationRequest("Can I take this with food?"), false);
});

test("summarizes recorded medications with stored dosage and instructions", () => {
  const response = buildMedicationHealthResponse(
    "What medications am I taking?",
    context([
      medication("Sertraline", {
        dosage: "50mg",
        instructions: "Take with food in the morning",
      }),
      medication("Vitamin D3", {
        dosage: "2000 IU",
        reminderEnabled: false,
      }),
    ])
  );

  assert.match(response, /Sertraline/);
  assert.match(response, /50mg/);
  assert.match(response, /Take with food in the morning/);
  assert.match(response, /Vitamin D3/);
  assert.match(response, /2000 IU/);
  assert.match(response, /can't prescribe|cannot prescribe/i);
});

test("reports only reminder-enabled medication records for reminder requests", () => {
  const response = buildMedicationHealthResponse(
    "When is my medication reminder?",
    context([
      medication("Sertraline", {
        instructions: "Take at 9:00 AM with breakfast",
      }),
      medication("Vitamin D3", {
        reminderEnabled: false,
        instructions: "Take with largest meal",
      }),
    ])
  );

  assert.match(response, /Medication reminders enabled/);
  assert.match(response, /Take at 9:00 AM with breakfast/);
  assert.doesNotMatch(response, /Vitamin D3/);
});

test("identifies an overdue medication task without claiming the medication was missed", () => {
  const response = buildMedicationHealthResponse(
    "Did I miss my medication?",
    context(
      [medication("Sertraline")],
      [task({ title: "Take morning medication", scheduledTime: "08:00" })],
      "10:00"
    )
  );

  assert.match(response, /Take morning medication/);
  assert.match(response, /scheduled for 8:00 AM/);
  assert.match(response, /does not record whether the medication itself was taken/);
});

test("summarizes explicitly requested medical information without inference", () => {
  const medicalContext = context([medication("Sertraline")]);
  medicalContext.medical = {
    conditions: [{ condition: "ADHD", status: "active", diagnosedDate: "2020-03-15" }],
    allergies: [{ allergen: "Penicillin", severity: "severe", reaction: "Rash" }],
    adverseMedications: [
      { medicationName: "Example medicine", reaction: "Nausea", severity: "moderate" },
    ],
  };

  const response = buildMedicationHealthResponse(
    "What medical conditions and allergies do I have?",
    medicalContext
  );

  assert.match(response, /ADHD/);
  assert.match(response, /Penicillin/);
  assert.match(response, /Example medicine/);
  assert.doesNotMatch(response, /therefore|you have|likely|you may have|based on this/i);
});

test("refuses medication judgment while distinguishing recorded information", () => {
  const response = buildMedicationHealthResponse(
    "Should I change my dose?",
    context([medication("Sertraline", { dosage: "50mg" })])
  );

  assert.match(response, /recorded information/);
  assert.match(response, /50mg/);
  assert.match(response, /can't diagnose|cannot diagnose/i);
  assert.match(response, /qualified healthcare professional/);
  assert.doesNotMatch(response, /increase your dose|decrease your dose|change it to/i);
});

test("does not claim a missed reminder when the recorded task is on time", () => {
  const response = buildMedicationHealthResponse(
    "Did I miss my medication reminder?",
    context(
      [medication("Sertraline")],
      [task({ title: "Take medication", scheduledTime: "12:00" })],
      "10:00"
    )
  );

  assert.equal(
    response,
    "I don't see an incomplete medication task or reminder whose recorded due time has passed."
  );
});