/**
 * Record ownership check for "/api/<resource>/<id>" routes.
 *
 * Many update/delete routes look a record up by its id only. Without this
 * check, any signed-in account could edit or delete another account's
 * bills, health records, documents, etc. just by changing the id in the URL.
 *
 * The guard lets the request through only when the record belongs to the
 * signed-in account, or to someone that account actively cares for
 * (caregivers manage their care recipients' records). Otherwise it answers
 * 404 so the record's existence isn't revealed.
 */

/** URL resource name → database table (all have a user_id column). */
export const OWNED_RECORD_TABLES: Record<string, string> = {
  "bills": "bills",
  "bank-accounts": "bank_accounts",
  "budget-entries": "budget_entries",
  "budget-categories": "budget_categories",
  "savings-goals": "savings_goals",
  "assignments": "assignments",
  "study-sessions": "study_sessions",
  "meal-plans": "meal_plans",
  "shopping-lists": "shopping_lists",
  "grocery-stores": "grocery_stores",
  "medications": "medications",
  "refill-orders": "refill_orders",
  "allergies": "allergies",
  "medical-conditions": "medical_conditions",
  "adverse-medications": "adverse_medications",
  "sleep-sessions": "sleep_sessions",
  "emergency-contacts": "emergency_contacts",
  "primary-care-providers": "primary_care_providers",
  "bus-schedules": "bus_schedules",
  "emergency-treatment-plans": "emergency_treatment_plans",
  "geofences": "geofences",
  "geofence-events": "geofence_events",
  "personal-documents": "personal_documents",
  "rewards": "rewards",
  "appointments": "appointments",
  "calendar-events": "calendar_events",
};

/** For a path relative to /api (e.g. "/bills/12/pay"), the table and record id to check. */
export function ownedRecordForPath(path: string): { table: string; id: number } | null {
  const match = /^\/([a-z-]+)\/(\d+)(?:\/|$)/.exec(path);
  if (!match) return null;
  const table = OWNED_RECORD_TABLES[match[1]];
  if (!table) return null;
  const id = Number(match[2]);
  return Number.isSafeInteger(id) ? { table, id } : null;
}

export function createRecordOwnershipGuard(deps: {
  /** user_id of the record, or null when there is no such record. */
  ownerOf: (table: string, id: number) => Promise<number | null>;
  /** Whether caregiverId actively cares for userId. */
  caresFor: (caregiverId: number, userId: number) => Promise<boolean>;
}) {
  return async (req: any, res: any, next: any) => {
    const target = ownedRecordForPath(req.path);
    if (!target) return next();
    const sessionUserId: number | undefined = req.session?.userId;
    if (!sessionUserId) return res.status(401).json({ message: "Authentication required" });
    if (req.session?.user?.accountType === "admin") return next();
    try {
      const owner = await deps.ownerOf(target.table, target.id);
      if (owner === null) return res.status(404).json({ message: "Not found" });
      if (owner === sessionUserId) return next();
      if (await deps.caresFor(sessionUserId, owner)) return next();
      return res.status(404).json({ message: "Not found" });
    } catch {
      return res.status(503).json({ message: "Please try again." });
    }
  };
}
