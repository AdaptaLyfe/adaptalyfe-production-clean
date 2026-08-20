import { db } from "./server/db";
import { users } from "./shared/schema";
import { like, or } from "drizzle-orm";

async function main() {
  const admins = await db.select({
    id: users.id, username: users.username, email: users.email,
    firstName: users.firstName, lastName: users.lastName,
    role: (users as any).role, isAdmin: (users as any).isAdmin,
    accountType: (users as any).accountType,
  }).from(users)
    .where(or(
      like(users.email, "%admin%"),
      like(users.email, "%skillbridge%"),
      like(users.username, "%admin%")
    ));
  console.log("Admin users:", JSON.stringify(admins, null, 2));
}
main().catch(console.error).finally(() => process.exit(0));
