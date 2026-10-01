import { db } from "./db";
import { paymentAnalytics } from "@shared/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export class PaymentAnalytics {
  // Track payment method selection
  static async trackMethodSelection(userId: number, billId: number, paymentMethod: 'link' | 'autopay') {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: 'method_selected',
      paymentMethod,
      metadata: { timestamp: new Date().toISOString() }
    });
  }

  // Track payment link clicks
  static async trackLinkClick(userId: number, billId: number, payeeWebsite: string) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: 'link_clicked',
      paymentMethod: 'link',
      metadata: { 
        timestamp: new Date().toISOString(),
        payeeWebsite,
      }
    });
  }

  // Track successful payments
  static async trackPaymentProcessed(userId: number, billId: number, paymentMethod: 'link' | 'autopay', amount: number) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: 'payment_processed',
      paymentMethod,
      metadata: { 
        timestamp: new Date().toISOString(),
        amount,
        success: true
      }
    });
  }

  // Get payment usage analytics
  static async getUsageReport(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(paymentAnalytics.createdAt, startDate));
    if (endDate) conditions.push(lte(paymentAnalytics.createdAt, endDate));

    const report = await db
      .select({
        eventType: paymentAnalytics.eventType,
        paymentMethod: paymentAnalytics.paymentMethod,
        totalEvents: sql<number>`count(*)`,
      })
      .from(paymentAnalytics)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(
        paymentAnalytics.eventType, 
        paymentAnalytics.paymentMethod
      );

    return report;
  }

  // Get user payment preferences
  static async getUserPaymentPreferences(userId: number) {
    const preferences = await db
      .select({
        paymentMethod: paymentAnalytics.paymentMethod,
        count: sql<number>`count(*)`,
      })
      .from(paymentAnalytics)
      .where(and(
        eq(paymentAnalytics.userId, userId),
        eq(paymentAnalytics.eventType, 'method_selected')
      ))
      .groupBy(paymentAnalytics.paymentMethod);

    return preferences;
  }
}