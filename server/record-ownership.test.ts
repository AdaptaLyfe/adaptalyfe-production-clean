import assert from "node:assert/strict";
import test from "node:test";
import { createRecordOwnershipGuard, ownedRecordForPath } from "./record-ownership";

test("record paths map to their table", () => {
  assert.deepEqual(ownedRecordForPath("/allergies/12"), { table: "allergies", id: 12 });
  assert.deepEqual(ownedRecordForPath("/bills/4/pay"), { table: "bills", id: 4 });
  assert.equal(ownedRecordForPath("/allergies"), null);
  assert.equal(ownedRecordForPath("/bus-schedules/day/monday"), null);
  assert.equal(ownedRecordForPath("/locked-settings/3"), null);
});

test("only the owner or their caregiver can touch a record", async () => {
  const guard = createRecordOwnershipGuard({
    ownerOf: async (_t, id) => (id === 1 ? 10 : id === 2 ? 20 : null),
    caresFor: async (cg, user) => cg === 30 && user === 20,
  });
  const run = async (userId: number | undefined, path: string, accountType = "user") => {
    let status = 200; let passed = false;
    const res: any = { status(c: number) { status = c; return this; }, json() { return this; } };
    await guard({ path, session: { userId, user: { accountType } } }, res, () => { passed = true; });
    return passed ? 200 : status;
  };
  assert.equal(await run(10, "/allergies/1"), 200);
  assert.equal(await run(20, "/allergies/1"), 404);
  assert.equal(await run(30, "/allergies/2"), 200);
  assert.equal(await run(30, "/allergies/1"), 404);
  assert.equal(await run(10, "/allergies/3"), 404);
  assert.equal(await run(undefined, "/allergies/1"), 401);
  assert.equal(await run(99, "/allergies/1", "admin"), 200);
  assert.equal(await run(undefined, "/allergies"), 200);
});
