export interface AssignmentWriteInput {
  classId: number | null;
  title: string;
  description: string | null;
  type: string;
  dueDate: Date;
  priority: string;
  estimatedHours: number;
}

export class AssignmentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentInputError";
  }
}

export function parseAssignmentEstimatedHours(value: unknown): number {
  const estimatedHours =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value.trim())
        : Number.NaN;

  if (
    !Number.isFinite(estimatedHours) ||
    estimatedHours <= 0 ||
    estimatedHours > 100
  ) {
    throw new AssignmentInputError(
      "Estimated hours must be greater than 0 and at most 100.",
    );
  }

  return estimatedHours;
}

export function parseAssignmentWriteInput(
  value: unknown,
): AssignmentWriteInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AssignmentInputError("Assignment data must be an object.");
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const priority =
    body.priority === undefined || body.priority === null
      ? "medium"
      : typeof body.priority === "string"
        ? body.priority.trim()
        : "";

  if (!title) {
    throw new AssignmentInputError("Assignment title is required.");
  }
  if (!type) {
    throw new AssignmentInputError("Assignment type is required.");
  }
  if (!priority) {
    throw new AssignmentInputError("Assignment priority is required.");
  }

  if (
    typeof body.dueDate !== "string" &&
    typeof body.dueDate !== "number"
  ) {
    throw new AssignmentInputError("A valid due date is required.");
  }
  const dueDate = new Date(body.dueDate);
  if (!Number.isFinite(dueDate.getTime())) {
    throw new AssignmentInputError("A valid due date is required.");
  }

  let classId: number | null = null;
  if (body.classId !== undefined && body.classId !== null) {
    const parsedClassId =
      typeof body.classId === "number" || typeof body.classId === "string"
        ? Number(body.classId)
        : Number.NaN;
    if (!Number.isSafeInteger(parsedClassId) || parsedClassId <= 0) {
      throw new AssignmentInputError("Class must be a valid class.");
    }
    classId = parsedClassId;
  }

  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string") {
      throw new AssignmentInputError("Description must be text.");
    }
    description = body.description;
  }

  return {
    classId,
    title,
    description,
    type,
    dueDate,
    priority,
    estimatedHours: parseAssignmentEstimatedHours(body.estimatedHours),
  };
}