import { Router } from 'express';
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from 'plaid';
import CryptoJS from 'crypto-js';
import puppeteer from 'puppeteer';
import { db } from './db';
import { 
  bankAccounts, 
  billPayments, 
  paymentTransactions, 
  paymentLimits,
  payeeCredentials,
  balanceHistory 
} from '@shared/banking-schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { storage } from './storage';

const router = Router();

// Initialize Plaid client with demo fallback
const plaidConfiguration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'demo-client-id',
      'PLAID-SECRET': process.env.PLAID_SECRET || 'demo-secret',
    },
  },
});

const plaidClient = new PlaidApi(plaidConfiguration);

// Demo mode checker
const isDemoMode = !process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET;

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY || 'default-key-change-in-production';

// Utility functions for encryption/decryption
function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
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
      plaidAccessToken: undefined, // Never send access tokens to frontend
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
      plaidAccessToken: undefined, // Never send access tokens to frontend
    }));

    res.json(safeAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    res.status(500).json({ message: 'Failed to fetch bank accounts' });
  }
});

// Initialize Plaid Link for connecting bank accounts
router.post('/bank-accounts/connect-plaid', requireAuth, async (req: any, res) => {
  try {
    if (isDemoMode) {
      // Create demo bank accounts for testing
      await db.insert(bankAccounts).values([
        {
          userId: req.user.id,
          accountName: 'Demo Checking Account',
          accountType: 'checking',
          bankName: 'Demo Bank',
          accountNumber: encrypt('1234567890'),
          routingNumber: encrypt('123456789'),
          balance: '2500.00',
          plaidAccountId: 'demo-checking-123',
          plaidAccessToken: encrypt('demo-access-token'),
          isActive: true,
        },
        {
          userId: req.user.id,
          accountName: 'Demo Savings Account',
          accountType: 'savings',
          bankName: 'Demo Bank',
          accountNumber: encrypt('0987654321'),
          routingNumber: encrypt('123456789'),
          balance: '8750.00',
          plaidAccountId: 'demo-savings-456',
          plaidAccessToken: encrypt('demo-access-token'),
          isActive: true,
        }
      ]);

      return res.json({ 
        message: 'Demo bank accounts connected successfully',
        demo_mode: true,
        linkToken: 'demo-link-token-12345'
      });
    }

    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: req.user.id.toString(),
      },
      client_name: 'Adaptalyfe',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: `${process.env.WEBHOOK_URL}/api/banking/plaid-webhook`,
      redirect_uri: `${process.env.APP_URL}/banking-integration`,
    });

    res.json({ linkToken: linkTokenResponse.data.link_token });
  } catch (error) {
    console.error('Error creating Plaid link token:', error);
    res.status(500).json({ 
      message: 'Failed to create link token',
      demo_mode: isDemoMode,
      error: isDemoMode ? 'Demo mode active - created sample accounts' : 'Server error'
    });
  }
});

// Handle Plaid Link success (called after user connects their bank)
router.post('/bank-accounts/plaid-exchange', requireAuth, async (req: any, res) => {
  try {
    const { public_token } = req.body;

    if (isDemoMode) {
      // Demo mode - accounts already created in connect-plaid
      return res.json({ 
        message: 'Demo bank accounts connected successfully',
        demo_mode: true
      });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Store each account in database
    for (const account of accountsResponse.data.accounts) {
      await db.insert(bankAccounts).values({
        userId: req.user.id,
        accountName: account.name,
        accountType: account.subtype || account.type,
        bankName: accountsResponse.data.item.institution_id || 'Unknown Bank',
        accountNumber: encrypt(account.account_id),
        routingNumber: account.routing_number ? encrypt(account.routing_number) : null,
        balance: account.balances.current?.toString() || '0',
        plaidAccountId: account.account_id,
        plaidAccessToken: encrypt(accessToken),
        isActive: true,
      });

      // Record initial balance
      await db.insert(balanceHistory).values({
        bankAccountId: account.account_id,
        balance: account.balances.current?.toString() || '0',
      });
    }

    res.json({ message: 'Bank accounts connected successfully' });
  } catch (error) {
    console.error('Error exchanging Plaid token:', error);
    res.status(500).json({ message: 'Failed to connect bank accounts' });
  }
});

// Sync account balance with Plaid
router.post('/bank-accounts/:id/sync', requireAuth, async (req: any, res) => {
  try {
    const accountId = parseInt(req.params.id);
    
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(and(
        eq(bankAccounts.id, accountId),
        eq(bankAccounts.userId, req.user.id)
      ));

    if (!account || !account.plaidAccessToken) {
      return res.status(404).json({ message: 'Account not found or not connected to Plaid' });
    }

    const accessToken = decrypt(account.plaidAccessToken);

    // Get updated balance from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const plaidAccount = accountsResponse.data.accounts.find(
      acc => acc.account_id === account.plaidAccountId
    );

    if (plaidAccount) {
      const newBalance = plaidAccount.balances.current?.toString() || '0';

      // Update account balance
      await db
        .update(bankAccounts)
        .set({ 
          balance: newBalance,
          lastSynced: new Date(),
        })
        .where(eq(bankAccounts.id, accountId));

      // Record balance history
      await db.insert(balanceHistory).values({
        bankAccountId: accountId,
        balance: newBalance,
      });

      res.json({ message: 'Balance updated successfully', balance: newBalance });
    } else {
      res.status(404).json({ message: 'Account not found in Plaid' });
    }
  } catch (error) {
    console.error('Error syncing account balance:', error);
    res.status(500).json({ message: 'Failed to sync balance' });
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

// Plaid webhook handler
router.post('/plaid-webhook', async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id } = req.body;

    console.log('Plaid webhook received:', { webhook_type, webhook_code, item_id });

    if (webhook_type === 'TRANSACTIONS') {
      // Handle transaction updates
      // Sync new transactions and balances
    } else if (webhook_type === 'ITEM') {
      // Handle item updates (account connection issues, etc.)
      if (webhook_code === 'ERROR') {
        // Handle account connection errors
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Plaid webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
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
      plaidAccountId: null,
      plaidAccessToken: null,
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