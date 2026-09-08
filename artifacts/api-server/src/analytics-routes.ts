import type { Express, Request } from "express";
import { PaymentAnalytics } from "./analytics";
import { z } from "zod";

// Extend Request type for authenticated routes
interface AuthenticatedRequest extends Request {
  isAuthenticated(): boolean;
  user: { id: number; accountType: string };
}

const trackPaymentMethodSchema = z.object({
  billId: z.number(),
  paymentMethod: z.enum(['link', 'autopay']),
});

const trackLinkClickSchema = z.object({
  billId: z.number(),
  payeeWebsite: z.string().url(),
});

const trackPaymentSchema = z.object({
  billId: z.number(),
  paymentMethod: z.enum(['link', 'autopay']),
  amount: z.number().positive(),
});

export function registerAnalyticsRoutes(app: Express) {
  // Track when users select payment methods
  app.post("/api/analytics/payment-method", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { billId, paymentMethod } = trackPaymentMethodSchema.parse(req.body);
      
      await PaymentAnalytics.trackMethodSelection(
        req.user.id, 
        billId, 
        paymentMethod
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to track payment method selection",
        error: error.message 
      });
    }
  });

  // Track when users click payment links (cost savings)
  app.post("/api/analytics/link-click", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { billId, payeeWebsite } = trackLinkClickSchema.parse(req.body);
      
      await PaymentAnalytics.trackLinkClick(
        req.user.id, 
        billId, 
        payeeWebsite
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to track link click",
        error: error.message 
      });
    }
  });

  // Track successful payments
  app.post("/api/analytics/payment", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { billId, paymentMethod, amount } = trackPaymentSchema.parse(req.body);
      
      await PaymentAnalytics.trackPaymentProcessed(
        req.user.id, 
        billId, 
        paymentMethod,
        amount
      );

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ 
        message: "Failed to track payment",
        error: error.message 
      });
    }
  });

  // Get usage analytics for admin/cost optimization
  app.get("/api/analytics/usage", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // Only allow admin users to view analytics
    if (req.user.accountType !== 'admin') {
      return res.sendStatus(403);
    }

    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const report = await PaymentAnalytics.getUsageReport(startDate, endDate);
      const monthlyPlaidCosts = await PaymentAnalytics.estimateMonthlyPlaidCosts();

      res.json({
        report,
        monthlyPlaidCosts,
        costSavingsFromLinks: report
          .filter(r => r.eventType === 'link_clicked')
          .reduce((total, r) => total + (r.totalEvents * 0.12), 0), // $0.12 saved per link click
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to generate usage report",
        error: error.message 
      });
    }
  });

  // Get user payment preferences
  app.get("/api/analytics/user-preferences", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const preferences = await PaymentAnalytics.getUserPaymentPreferences(req.user.id);
      
      res.json({ preferences });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to get user preferences",
        error: error.message 
      });
    }
  });
}