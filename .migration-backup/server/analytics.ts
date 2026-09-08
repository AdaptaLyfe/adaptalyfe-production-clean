import { db } from "./db";
import { paymentAnalytics, type InsertPaymentAnalytics } from "@shared/schema";
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

  // Track Plaid API usage with cost estimation
  static async trackPlaidUsage(userId: number, apiCall: string, estimatedCost: number, billId?: number) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: 'api_call',
      plaidApiCall: apiCall,
      estimatedCost: estimatedCost.toString(),
      metadata: { timestamp: new Date().toISOString(), provider: 'plaid' }
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
        costSavings: 0.12 // Estimated Plaid API cost avoided
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

  // Get usage analytics for cost optimization
  static async getUsageReport(startDate?: Date, endDate?: Date) {
    const conditions = [];
    if (startDate) conditions.push(gte(paymentAnalytics.createdAt, startDate));
    if (endDate) conditions.push(lte(paymentAnalytics.createdAt, endDate));

    const report = await db
      .select({
        eventType: paymentAnalytics.eventType,
        paymentMethod: paymentAnalytics.paymentMethod,
        plaidApiCall: paymentAnalytics.plaidApiCall,
        totalEvents: sql<number>`count(*)`,
        totalCost: sql<number>`sum(CAST(${paymentAnalytics.estimatedCost} AS decimal))`,
      })
      .from(paymentAnalytics)
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(
        paymentAnalytics.eventType, 
        paymentAnalytics.paymentMethod,
        paymentAnalytics.plaidApiCall
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

  // Estimate monthly Plaid costs
  static async estimateMonthlyPlaidCosts(userId?: number) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const conditions = [
      gte(paymentAnalytics.createdAt, thirtyDaysAgo),
      eq(paymentAnalytics.eventType, 'api_call')
    ];
    
    if (userId) {
      conditions.push(eq(paymentAnalytics.userId, userId));
    }

    const costs = await db
      .select({
        totalCost: sql<number>`sum(CAST(${paymentAnalytics.estimatedCost} AS decimal))`,
        apiCallCount: sql<number>`count(*)`,
      })
      .from(paymentAnalytics)
      .where(and(...conditions));

    return costs[0] || { totalCost: 0, apiCallCount: 0 };
  }
}

// Plaid API Cost Constants (based on current pricing)
export const PLAID_COSTS = {
  LINK_TOKEN: 0.60,        // Per successful connection
  ACCOUNT_INFO: 0.12,      // Per account info request
  BALANCE: 0.03,           // Per balance check
  TRANSACTIONS: 0.12,      // Per transaction pull
  PAYMENT_INITIATE: 0.25,  // Per payment initiation
  IDENTITY: 0.12,          // Per identity verification
};