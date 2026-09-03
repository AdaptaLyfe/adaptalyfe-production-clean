import type {
  AdaptAIContext,
  AiAdverseMedication,
  AiAllergy,
  AiMedication,
  AiMedicalCondition,
  AiTask,
} from "./ai-context.js";

function normalize(message: string): string {
  return message.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
}

const medicationWords = /\b(medication|medications|medicine|medicines|pill|pills|prescription|prescriptions|dose|dosage)\b/;

/**
 * Recognize questions that can be answered from recorded medication or
 * explicitly requested medical information. General health conversation is
 * left to the existing AI flow unless it matches a structured request.
 */
export function isMedicationHealthRequest(message: string): boolean {
  const normalized = normalize(message);
  return (
    medicationWords.test(normalized) ||
    /\b(what medical information|show my medical information|what(?:'s| is) in my medical record|what health information)\b/.test(
      normalized
    ) ||
    /\b(did i take|missed|miss|reminder|scheduled)\b/.test(normalized) &&
      /\b(take|medication|medicine|pill|dose)\b/.test(normalized)
  );
}

/**
 * Medical records are intentionally fetched only when the user explicitly
 * asks for stored medical information. Medication-only requests do not load
 * conditions, allergies, or adverse reactions into the AI context.
 */
export function isExplicitMedicalInformationRequest(message: string): boolean {
  const normalized = normalize(message);
  return (
    /\bwhat medical (information|conditions?) do i have\b/.test(normalized) ||
    /\bshow my medical (information|record)\b/.test(normalized) ||
    /\bwhat(?:'s| is) in my medical record\b/.test(normalized) ||
    /\bwhat (?:medical )?(?:conditions?|allerg(?:y|ies)|adverse medication reactions?)(?: and (?:conditions?|allerg(?:y|ies)|adverse medication reactions?))* do i have\b/.test(normalized) ||
    /\bmedical history\b/.test(normalized)
  );
}

function recordedMedications(context: AdaptAIContext): AiMedication[] {
  return context.medications?.recorded ?? context.medications?.scheduledToday ?? [];
}

function medicationLabel(medication: AiMedication): string {
  const dosage = medication.dosage ? ` — dosage recorded as ${medication.dosage}` : "";
  const instructions = medication.instructions
    ? ` — instructions recorded as '${medication.instructions}'`
    : "";
  return `${medication.medicationName}${dosage}${instructions}`;
}

function medicationSummary(context: AdaptAIContext): string {
  const medications = recordedMedications(context);
  if (medications.length === 0) {
    return "I don't see any active medications recorded in Adaptalyfe.";
  }

  return `Adaptalyfe records these active medications: ${medications
    .map(medicationLabel)
    .join("; ")}. I can share recorded information, but I can't prescribe medication or recommend changing it.`;
}

function reminderSummary(context: AdaptAIContext): string {
  const medications = context.medications?.scheduledToday ?? [];
  if (medications.length === 0) {
    return "I don't see a medication reminder enabled in your Adaptalyfe records.";
  }

  const reminders = medications.map((medication) => {
    const storedTiming = medication.instructions
      ? ` Stored instructions: '${medication.instructions}'.`
      : " No reminder time is recorded.";
    return `${medication.medicationName}.${storedTiming}`;
  });

  return `Medication reminders enabled in Adaptalyfe: ${reminders.join(" ")}`;
}

function timeMinutes(time?: string): number | undefined {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return undefined;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

function isMedicationTask(task: AiTask): boolean {
  return medicationWords.test(`${task.title} ${task.description ?? ""}`);
}

function isMissedMedicationTask(task: AiTask, context: AdaptAIContext): boolean {
  if (task.isCompleted || !isMedicationTask(task)) return false;
  if (task.dueDate && task.dueDate < context.today.date) return true;

  const scheduled = timeMinutes(task.scheduledTime);
  const current = timeMinutes(context.today.time);
  return scheduled !== undefined && current !== undefined && scheduled < current;
}

function missedMedicationResponse(context: AdaptAIContext): string {
  const missedTasks = (context.tasks?.incomplete ?? []).filter((task) =>
    isMissedMedicationTask(task, context)
  );
  if (missedTasks.length === 0) {
    return "I don't see an incomplete medication task or reminder whose recorded due time has passed.";
  }

  const task = missedTasks[0];
  const scheduled = task.scheduledTime
    ? ` scheduled for ${formatTime(task.scheduledTime)}`
    : task.dueDate
      ? ` due on ${task.dueDate}`
      : "";
  return `Your medication task '${task.title}' is still incomplete${scheduled}. Adaptalyfe does not record whether the medication itself was taken.`;
}

function formatTime(time: string): string {
  const minutes = timeMinutes(time);
  if (minutes === undefined) return time;
  const hours = Math.floor(minutes / 60);
  const minutePart = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutePart).padStart(2, "0")} ${suffix}`;
}

function storedMedicalSummary(context: AdaptAIContext): string {
  const medical = context.medical;
  if (!medical) {
    return "I don't see any medical conditions, allergies, or adverse medication reactions recorded in Adaptalyfe.";
  }

  const sections: string[] = [];
  if (medical.conditions.length > 0) {
    sections.push(
      `Conditions: ${medical.conditions.map(formatCondition).join("; ")}`
    );
  }
  if (medical.allergies.length > 0) {
    sections.push(`Allergies: ${medical.allergies.map(formatAllergy).join("; ")}`);
  }
  if (medical.adverseMedications.length > 0) {
    sections.push(
      `Adverse medication reactions: ${medical.adverseMedications
        .map(formatAdverseMedication)
        .join("; ")}`
    );
  }

  return sections.length > 0
    ? `Here is the medical information recorded in Adaptalyfe: ${sections.join(". ")}.`
    : "I don't see any medical conditions, allergies, or adverse medication reactions recorded in Adaptalyfe.";
}

function formatCondition(condition: AiMedicalCondition): string {
  const diagnosed = condition.diagnosedDate
    ? `, diagnosed ${condition.diagnosedDate}`
    : "";
  return `${condition.condition} (${condition.status}${diagnosed})`;
}

function formatAllergy(allergy: AiAllergy): string {
  return `${allergy.allergen} (${allergy.severity}${
    allergy.reaction ? `; reaction recorded as ${allergy.reaction}` : ""
  })`;
}

function formatAdverseMedication(entry: AiAdverseMedication): string {
  return `${entry.medicationName}: ${entry.reaction} (${entry.severity})`;
}

function requiresMedicalJudgment(message: string): boolean {
  const normalized = normalize(message);
  return (
    /\b(can i|may i|should i|is it safe|is .* okay|what should i do|do i need to|interact|side effects?|diagnos|symptoms?)\b/.test(
      normalized
    ) ||
    /\b(start|stop|change|increase|decrease|skip)\b.*\b(medication|medicine|pill|dose)\b/.test(
      normalized
    )
  );
}

function medicalJudgmentBoundary(context: AdaptAIContext): string {
  const medications = recordedMedications(context);
  const stored =
    medications.length > 0
      ? ` Your Adaptalyfe record lists: ${medications.map(medicationLabel).join("; ")}.`
      : "";
  return `Adaptalyfe can show recorded information, but I can't diagnose a condition or determine whether a medication is safe for you, change a dose, or tell you to start or stop one.${stored} Please ask a qualified healthcare professional for medical guidance.`;
}

function isReminderRequest(normalized: string): boolean {
  return (
    /\b(reminder|scheduled|schedule|when do i take|when should i take|take today|today)\b/.test(
      normalized
    ) &&
    /\b(medication|medicine|pill|dose|take)\b/.test(normalized)
  );
}

function isMissedRequest(normalized: string): boolean {
  return /\b(missed|miss|did i take|forgot|late)\b/.test(normalized) &&
    /\b(medication|medicine|pill|dose|take|reminder)\b/.test(normalized);
}

export function buildMedicationHealthResponse(
  message: string,
  context: AdaptAIContext
): string {
  const normalized = normalize(message);
  if (requiresMedicalJudgment(message)) return medicalJudgmentBoundary(context);
  if (isExplicitMedicalInformationRequest(message)) return storedMedicalSummary(context);
  if (isMissedRequest(normalized)) return missedMedicationResponse(context);
  if (isReminderRequest(normalized)) return reminderSummary(context);

  if (/\b(where|listed|list|recorded|have|taking|take)\b/.test(normalized)) {
    if (/\bwhere\b.*\b(listed|medication|medicine|pill)\b/.test(normalized)) {
      return recordedMedications(context).length > 0
        ? `Your recorded medications are listed in Adaptalyfe's Medical section: ${recordedMedications(
            context
          )
            .map((medication) => medication.medicationName)
            .join(", ")}.`
        : "I don't see any active medications recorded in Adaptalyfe's Medical section.";
    }
    return medicationSummary(context);
  }

  return medicationSummary(context);
}