import type { Express } from "express";
import { z } from "zod";
import { storage } from "./storage";

const updatePaymentLinkSchema = z.object({
  payeeWebsite: z.string().url("Please enter a valid website URL").optional(),
  payeeAccountNumber: z.string().optional(),
});

export function registerBillPaymentRoutes(app: Express) {
  // Update bill with payment link information
  app.patch("/api/bills/:id/payment-link", async (req, res) => {
    if (!req.isAuthenticated?.() && !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const billId = parseInt(req.params.id);
      const { payeeWebsite, payeeAccountNumber } = updatePaymentLinkSchema.parse(req.body);

      // Get the bill to verify ownership
      const bill = await storage.getBill(billId);
      if (!bill || bill.userId !== req.user.id) {
        return res.status(404).json({ message: "Bill not found" });
      }

      // Update bill with payment link info
      const updatedBill = await storage.updateBill(billId, {
        ...bill,
        payeeWebsite: payeeWebsite || bill.payeeWebsite,
        payeeAccountNumber: payeeAccountNumber || bill.payeeAccountNumber,
      });

      res.json(updatedBill);
    } catch (error: any) {
      console.error("Error updating payment link:", error);
      res.status(400).json({ 
        message: "Failed to save payment link",
        error: error.message 
      });
    }
  });
}