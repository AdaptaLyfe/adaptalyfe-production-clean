import { Router } from 'express';
import CryptoJS from 'crypto-js';
import puppeteer from 'puppeteer';
import { db } from './db';
import { 
  bankAccounts, 
  billPayments, 
  paymentTransactions, 
  paymentLimits,
  payeeCredentials
} from '@shared/banking-schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { storage } from './storage';

const router = Router();

// Never encrypt banking data with a predictable fallback key. In production,
// fail during startup if the secret is missing; elsewhere, fail on use.
const ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY?.trim();
if (process.env.NODE_ENV === "production" && !ENCRYPTION_KEY) {
  throw new Error("BANKING_ENCRYPTION_KEY is required in production");
}

function requireEncryptionKey(): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Banking encryption is unavailable: BANKING_ENCRYPTION_KEY is not configured");
  }
  return ENCRYPTION_KEY;
}

// Utility functions for encryption/decryption
function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, requireEncryptionKey()).toString();
}

function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, requireEncryptionKey());
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Middleware to check authentication - updated to use session
function requireAuth(req: any, res: any, next: any) {
  // Auto-login if no session exists
  if (!req.session?.userId) {
    console.log("No user in session for banking, attempting auto-login");
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Set req.user for compatibility with existing code
  req.user = { id: req.session.userId };
  next();
}

// Get user's bank accounts (multiple route aliases for compatibility)
router.get('/accounts', async (req: any, res) => {
  try {
    // Production mode - no auto-login
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, req.session.userId));

    // Decrypt sensitive data for display (mask account numbers)
    const safeAccounts = accounts.map(account => ({
      ...account,
      accountNumber: account.accountNumber ? '****' + decrypt(account.accountNumber).slice(-4) : '',
      routingNumber: account.routingNumber ? '****' + decrypt(account.routingNumber).slice(-4) : '',
      legacyPlaidAccountId: undefined,
      legacyPlaidAccessToken: undefined,
    }));

    res.json(safeAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Failed to fetch bank accounts' });
  }
});

router.get('/bank-accounts', requireAuth, async (req: any, res) => {
  try {
    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, req.user.id));

    // Decrypt sensitive data for display (mask account numbers)
    const safeAccounts = accounts.map(account => ({
      ...account,
      accountNumber: account.accountNumber ? '****' + decrypt(account.accountNumber).slice(-4) : '',
      routingNumber: account.routingNumber ? '****' + decrypt(account.routingNumber).slice(-4) : '',
      legacyPlaidAccountId: undefined,
      legacyPlaidAccessToken: undefined,
    }));

    res.json(safeAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Failed to fetch bank accounts' });
  }
});

// Get bill payments
router.get('/bill-payments', async (req: any, res) => {
  try {
    // Auto-login if no session exists
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
    }
    
    const payments = await db
      .select()
      .from(billPayments)
      .where(eq(billPayments.userId, req.session.userId));

    // Mask sensitive data
    const safePayments = payments.map(payment => ({
      ...payment,
      payeeAccountNumber: payment.payeeAccountNumber ? '****' + decrypt(payment.payeeAccountNumber).slice(-4) : '',
      payeeLoginCredentials: undefined, // Never send credentials to frontend
    }));

    res.json(safePayments);
  } catch (error) {
    console.error('Error fetching bill payments:', error);
    res.status(500).json({ message: 'Failed to fetch bill payments' });
  }
});

// Setup automatic bill payment
router.post('/bill-payments', requireAuth, async (req: any, res) => {
  try {
    const {
      billId,
      bankAccountId,
      payeeWebsite,
      payeeAccountNumber,
      paymentAmount,
      paymentDate,
      isAutoPay,
    } = req.body;

    // Verify user owns the bank account
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(and(
        eq(bankAccounts.id, bankAccountId),
        eq(bankAccounts.userId, req.user.id)
      ));

    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }

    // Calculate next payment date
    const now = new Date();
    const nextPayment = new Date(now.getFullYear(), now.getMonth(), paymentDate);
    if (nextPayment <= now) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }

    // Create bill payment configuration
    await db.insert(billPayments).values({
      userId: req.user.id,
      billId,
      bankAccountId,
      payeeWebsite,
      payeeAccountNumber: encrypt(payeeAccountNumber),
      isAutoPay,
      paymentAmount: paymentAmount.toString(),
      paymentDate,
      nextPaymentDate: nextPayment,
      status: 'active',
    });

    res.json({ message: 'Bill payment setup successfully' });
  } catch (error) {
    console.error('Error setting up bill payment:', error);
    res.status(500).json({ message: 'Failed to setup bill payment' });
  }
});

// Toggle auto pay for a bill
router.patch('/bill-payments/:id/toggle', requireAuth, async (req: any, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { isActive } = req.body;

    await db
      .update(billPayments)
      .set({ 
        isAutoPay: isActive,
        status: isActive ? 'active' : 'paused',
        updatedAt: new Date(),
      })
      .where(and(
        eq(billPayments.id, paymentId),
        eq(billPayments.userId, req.user.id)
      ));

    res.json({ message: 'Auto pay setting updated' });
  } catch (error) {
    console.error('Error toggling auto pay:', error);
    res.status(500).json({ message: 'Failed to update auto pay setting' });
  }
});

// Get payment limits
router.get('/payment-limits', requireAuth, async (req: any, res) => {
  try {
    const limits = await db
      .select()
      .from(paymentLimits)
      .where(eq(paymentLimits.userId, req.user.id));

    res.json(limits);
  } catch (error) {
    console.error('Error fetching payment limits:', error);
    res.status(500).json({ message: 'Failed to fetch payment limits' });
  }
});

// Set payment limits
router.post('/payment-limits', requireAuth, async (req: any, res) => {
  try {
    const { limitType, amount } = req.body;

    // Check if limit already exists for this type
    const [existingLimit] = await db
      .select()
      .from(paymentLimits)
      .where(and(
        eq(paymentLimits.userId, req.user.id),
        eq(paymentLimits.limitType, limitType)
      ));

    if (existingLimit) {
      // Update existing limit
      await db
        .update(paymentLimits)
        .set({ 
          amount: amount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(paymentLimits.id, existingLimit.id));
    } else {
      // Create new limit
      await db.insert(paymentLimits).values({
        userId: req.user.id,
        limitType,
        amount: amount.toString(),
        isActive: true,
      });
    }

    res.json({ message: 'Payment limit updated' });
  } catch (error) {
    console.error('Error setting payment limit:', error);
    res.status(500).json({ message: 'Failed to set payment limit' });
  }
});

// Get payment transaction history
router.get('/payment-transactions', requireAuth, async (req: any, res) => {
  try {
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, req.user.id))
      .orderBy(paymentTransactions.initiatedAt);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    res.status(500).json({ message: 'Failed to fetch payment transactions' });
  }
});

// Process bill payment (called by scheduled job or manually)
router.post('/bill-payments/:id/process', requireAuth, async (req: any, res) => {
  try {
    const paymentId = parseInt(req.params.id);

    const [payment] = await db
      .select()
      .from(billPayments)
      .where(and(
        eq(billPayments.id, paymentId),
        eq(billPayments.userId, req.user.id)
      ));

    if (!payment) {
      return res.status(404).json({ message: 'Bill payment not found' });
    }

    // Check payment limits
    const limits = await db
      .select()
      .from(paymentLimits)
      .where(and(
        eq(paymentLimits.userId, req.user.id),
        eq(paymentLimits.isActive, true)
      ));

    for (const limit of limits) {
      if (limit.limitType === 'per_transaction' && parseFloat(payment.paymentAmount) > parseFloat(limit.amount)) {
        return res.status(400).json({ 
          message: `Payment amount exceeds per-transaction limit of $${limit.amount}` 
        });
      }
    }

    // Create transaction record
    const [transaction] = await db.insert(paymentTransactions).values({
      userId: req.user.id,
      billPaymentId: paymentId,
      bankAccountId: payment.bankAccountId,
      amount: payment.paymentAmount,
      status: 'pending',
    }).returning();

    // In a real implementation, this would integrate with bank APIs or 
    // use web scraping to actually make the payment
    // For now, we'll simulate a successful payment
    setTimeout(async () => {
      await db
        .update(paymentTransactions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          confirmationNumber: `CONF-${Date.now()}`,
        })
        .where(eq(paymentTransactions.id, transaction.id));

      // Update next payment date
      const nextPayment = new Date(payment.nextPaymentDate);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      await db
        .update(billPayments)
        .set({
          lastPaymentDate: new Date(),
          nextPaymentDate: nextPayment,
        })
        .where(eq(billPayments.id, paymentId));
    }, 2000);

    res.json({ 
      message: 'Payment initiated successfully',
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Error processing bill payment:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

// Simple connect account endpoint that frontend expects
router.post('/connect-account', async (req: any, res) => {
  try {
    // Auto-login if no session exists
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
    }

    const { accountName, accountNumber, routingNumber } = req.body;
    
    if (!accountName || !accountNumber || !routingNumber) {
      return res.status(400).json({ message: 'All bank account fields are required' });
    }

    // Extract bank name and account type from accountName (e.g., "Chase Checking" -> "Chase", "checking")
    const bankName = accountName.split(' ')[0] || 'Bank';
    const accountType = accountName.toLowerCase().includes('saving') ? 'savings' : 'checking';

    const accountData = {
      userId: req.session.userId,
      accountName: accountName,
      accountType: accountType,
      bankName: bankName,
      accountNumber: encrypt(accountNumber),
      routingNumber: encrypt(routingNumber),
      balance: '0.00', // Default balance
      isActive: true,
    };

    const bankAccount = await db.insert(bankAccounts).values(accountData).returning();
    
    console.log('Bank account created successfully:', bankAccount[0]?.id);
    
    res.json({ 
      message: 'Bank account connected successfully', 
      account: {
        ...bankAccount[0],
        accountNumber: '****' + accountNumber.slice(-4),
        routingNumber: '****' + routingNumber.slice(-4),
      }
    });
  } catch (error) {
    console.error('Error connecting bank account:', error);
    res.status(500).json({ message: 'Failed to connect bank account' });
  }
});

// Simple bill payment setup endpoint that frontend expects  
router.post('/setup-autopay', async (req: any, res) => {
  try {
    // Auto-login if no session exists
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
    }

    const { billId, bankAccountId, paymentDate, maxAmount } = req.body;
    
    if (!billId || !bankAccountId) {
      return res.status(400).json({ message: 'Bill ID and bank account are required' });
    }

    const billPaymentData = {
      userId: req.session.userId,
      billId: billId,
      bankAccountId: bankAccountId,
      paymentDate: paymentDate || new Date().getDate(), // Default to today's date of month
      maxAmount: maxAmount || '999999.99', // Default high limit
      isActive: true,
    };

    const billPayment = await db.insert(billPayments).values(billPaymentData).returning();
    
    console.log('Bill payment setup successfully:', billPayment[0]?.id);
    
    res.json({ 
      message: 'Automatic bill payment setup successfully', 
      payment: billPayment[0]
    });
  } catch (error) {
    console.error('Error setting up bill payment:', error);
    res.status(500).json({ message: 'Failed to setup bill payment' });
  }
});

export default router;