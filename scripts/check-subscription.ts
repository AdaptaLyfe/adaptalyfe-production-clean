import { db } from "./server/db";
import { users, subscriptions } from "./shared/schema";
import { eq, like, or } from "drizzle-orm";
import { sql } from "drizzle-orm";

async function main() {
  // Find user by username or name
  const userResults = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    subscriptionTier: users.subscriptionTier,
    subscriptionStatus: users.subscriptionStatus,
    subscriptionExpiresAt: users.subscriptionExpiresAt,
    stripeSubscriptionId: users.stripeSubscriptionId,
    stripeCustomerId: users.stripeCustomerId,
    subscriptionPlatform: users.subscriptionPlatform,
  }).from(users)
    .where(or(
      like(users.username, "%Gavin%"),
      like(users.username, "%gavin%"),
      like(users.firstName, "%Rachel%"),
      like(users.lastName, "%Barrett%"),
    ));

  console.log("User records:");
  console.log(JSON.stringify(userResults, null, 2));

  if (userResults.length > 0) {
    const userId = userResults[0].id;
    // Check subscriptions table
    const subResults = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    console.log("\nSubscription records:");
    console.log(JSON.stringify(subResults, null, 2));
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
