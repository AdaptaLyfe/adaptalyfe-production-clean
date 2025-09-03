import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import OpenAI from "openai";
import Stripe from "stripe";
import bankingRoutes from "./banking-routes";
import { registerAnalyticsRoutes } from "./analytics-routes";
import { registerBillPaymentRoutes } from "./bill-payment-routes";
import session from "express-session";

// Extend the session data interface
declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: any;
  }
}

// Initialize Stripe with dynamic key support
function getStripeInstance() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not found, using demo mode');
    return null;
  }
  
  console.log('Using Stripe key prefix:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// Stripe instance is created dynamically when needed
import { 
  insertDailyTaskSchema, insertBillSchema, insertBankAccountSchema, insertMoodEntrySchema, 
  insertAchievementSchema, insertCaregiverSchema, insertMessageSchema,
  insertBudgetEntrySchema, insertSavingsGoalSchema, insertSavingsTransactionSchema, 
  insertBudgetCategorySchema, insertAppointmentSchema, insertMealPlanSchema,
  insertShoppingListSchema, loginSchema, registerSchema, insertPharmacySchema, insertUserPharmacySchema,
  insertMedicationSchema, insertRefillOrderSchema, insertPersonalResourceSchema,
  insertBusScheduleSchema, insertEmergencyTreatmentPlanSchema,
  insertNotificationSchema, insertUserPreferencesSchema, insertUserAchievementSchema,
  insertStreakTrackingSchema, insertVoiceInteractionSchema, insertQuickResponseSchema,
  insertMessageReactionSchema, insertActivityPatternSchema
} from "@shared/schema";
import { z } from "zod";
import { initializeComprehensiveDemo } from "./demo-data";
import { shouldAllowAutoLogin, shouldInitializeDemoData, PRODUCTION_CONFIG } from "./production-config";
import { configureForProduction } from "./production-environment";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced fallback responses when OpenAI is unavailable
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Help and How-to questions
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    if (lowerMessage.includes('app') || lowerMessage.includes('feature') || lowerMessage.includes('use')) {
      return "I'd love to help you navigate AdaptaLyfe! Here's what you can do:\n\n• **Daily Tasks**: Plan and track your daily activities\n• **Financial**: Manage bills, budgets, and savings goals\n• **Mood Tracking**: Log how you're feeling each day\n• **Medical**: Track medications and appointments\n• **Caregiver Connection**: Stay in touch with your support team\n• **Meal Planning**: Plan healthy meals and shopping lists\n• **Calendar**: Keep track of important dates\n\nWhich area would you like to explore first?";
    }
    return "I'm here to help you build independence and achieve your goals! I can assist with:\n\n• Creating daily routines and task lists\n• Managing money and budgets\n• Understanding medications and health\n• Connecting with your support network\n• Learning new life skills\n• Handling difficult emotions\n• Planning meals and shopping\n• Organizing your schedule\n\nWhat would you like help with today?";
  }
  
  // Emotional support responses
  if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('upset') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
    return "I understand you're going through a tough time, and it's completely normal to have these feelings. You're not alone. Here are some things that can help:\n\n• **Breathe slowly**: Take 5 deep breaths in and out\n• **Talk to someone**: Reach out to a caregiver or friend\n• **Do something small**: Complete one easy task to feel accomplished\n• **Practice self-care**: Listen to music, take a walk, or do something you enjoy\n• **Remember your strengths**: Think about recent successes you've had\n\nIf these feelings continue, please talk to a trusted caregiver or healthcare provider. You matter and your feelings are valid.";
  }
  
  // Task and routine management
  if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('routine') || lowerMessage.includes('schedule') || lowerMessage.includes('organize')) {
    return "Building good routines is a key independence skill! Here's my step-by-step approach:\n\n**Getting Started:**\n• Begin with just 2-3 simple tasks daily\n• Choose the same time each day for consistency\n• Write tasks down or use the Daily Tasks feature\n\n**Making Tasks Easier:**\n• Break big tasks into small steps\n• Set realistic goals you can achieve\n• Celebrate each completion, no matter how small\n\n**Building Habits:**\n• Start with things you already do (like brushing teeth)\n• Add new tasks one at a time\n• Use reminders and alarms\n\nWould you like help creating a specific routine or organizing a particular task?";
  }
  
  // Financial management
  if (lowerMessage.includes('money') || lowerMessage.includes('budget') || lowerMessage.includes('bill') || lowerMessage.includes('save') || lowerMessage.includes('spend')) {
    return "Managing money wisely is an important life skill! Here's how to get started:\n\n**Budgeting Basics:**\n• List your monthly income (job, benefits, family support)\n• Track your essential expenses (rent, food, bills)\n• Set aside money for savings, even if it's small\n• Use the Financial section to monitor spending\n\n**Bill Management:**\n• Set up payment reminders for due dates\n• Keep important account information in a safe place\n• Ask for help understanding bills you don't recognize\n• Pay essential bills first (housing, utilities, food)\n\n**Smart Spending:**\n• Compare prices before big purchases\n• Wait 24 hours before buying non-essential items\n• Look for discounts and sales\n\nWould you like help setting up a specific budget or understanding a particular bill?";
  }
  
  // Health and medication
  if (lowerMessage.includes('medication') || lowerMessage.includes('medicine') || lowerMessage.includes('pill') || lowerMessage.includes('doctor') || lowerMessage.includes('health')) {
    return "Taking care of your health is very important! Here's how to stay organized:\n\n**Medication Safety:**\n• Take medications exactly as prescribed\n• Use the Pharmacy section to track all your medicines\n• Set daily reminders for pill times\n• Never skip doses without talking to your doctor first\n• Keep a list of all medications with you\n\n**Doctor Appointments:**\n• Write down questions before visits\n• Bring a list of your medications\n• Ask for clarification if you don't understand something\n• Use the Calendar feature to track appointments\n\n**Emergency Information:**\n• Keep emergency contacts easily accessible\n• Know your allergies and medical conditions\n• Have a plan for medical emergencies\n\nRemember: Always consult with healthcare professionals for medical advice. I can help you stay organized, but your doctors are the experts!";
  }
  
  // Cooking and meal planning
  if (lowerMessage.includes('cook') || lowerMessage.includes('food') || lowerMessage.includes('meal') || lowerMessage.includes('eat') || lowerMessage.includes('recipe')) {
    return "Cooking and eating well are important for your health and independence! Here are some tips:\n\n**Easy Cooking Tips:**\n• Start with simple recipes (sandwiches, pasta, eggs)\n• Read recipes completely before starting\n• Gather all ingredients first\n• Keep your cooking area clean and safe\n• Ask for help when trying new techniques\n\n**Meal Planning:**\n• Plan 3-4 simple meals for the week\n• Make a shopping list before going to the store\n• Use the Meal Planning feature to stay organized\n• Include fruits and vegetables in your meals\n• Keep healthy snacks available\n\n**Food Safety:**\n• Wash hands before cooking\n• Check expiration dates\n• Store food properly\n• Cook meat thoroughly\n\nWould you like help planning meals for this week or learning a specific cooking skill?";
  }
  
  // Social and communication
  if (lowerMessage.includes('friend') || lowerMessage.includes('social') || lowerMessage.includes('talk') || lowerMessage.includes('communicate') || lowerMessage.includes('caregiver')) {
    return "Building and maintaining relationships is a wonderful part of life! Here's how to strengthen your connections:\n\n**Staying Connected:**\n• Use the Caregiver features to message your support team\n• Schedule regular check-ins with friends and family\n• Share your successes and challenges with trusted people\n• Ask for help when you need it - that's what support networks are for!\n\n**Making New Friends:**\n• Join activities or groups that interest you\n• Be yourself and show genuine interest in others\n• Start with small conversations\n• Remember that friendships take time to develop\n\n**Communication Tips:**\n• Listen actively when others speak\n• Ask questions to show you're interested\n• Share your own experiences and feelings\n• Be patient and kind with yourself and others\n\nYour support team is here because they care about you. Don't hesitate to reach out when you need encouragement or assistance!";
  }
  
  // Learning and skills
  if (lowerMessage.includes('learn') || lowerMessage.includes('skill') || lowerMessage.includes('independence') || lowerMessage.includes('grow')) {
    return "Learning new skills is exciting and helps you become more independent! Here's how to approach it:\n\n**Learning Strategies:**\n• Break skills into small, manageable steps\n• Practice regularly, even for just a few minutes\n• Don't be afraid to make mistakes - they're part of learning\n• Ask questions when you don't understand\n• Celebrate small improvements\n\n**Independence Skills to Focus On:**\n• Personal care (hygiene, dressing, grooming)\n• Household tasks (cleaning, laundry, organization)\n• Money management (budgeting, shopping, bill paying)\n• Communication (phone calls, emails, asking for help)\n• Transportation (public transit, walking safety)\n• Health management (medication, appointments, self-care)\n\n**Getting Support:**\n• Use the Task Builder feature for step-by-step guides\n• Practice with a trusted caregiver or friend\n• Take your time - everyone learns at their own pace\n• Ask for help when you need it\n\nWhat new skill would you like to work on? I can help you break it down into manageable steps!";
  }
  
  // Technology and app usage
  if (lowerMessage.includes('app') || lowerMessage.includes('phone') || lowerMessage.includes('computer') || lowerMessage.includes('technology')) {
    return "Technology can be a great tool for independence! Here's how to make the most of it:\n\n**Using AdaptaLyfe Effectively:**\n• Explore each section (Daily Tasks, Financial, Mood, etc.)\n• Set up reminders and notifications\n• Update your information regularly\n• Use the search features to find what you need\n• Ask caregivers for help if you get stuck\n\n**General Technology Tips:**\n• Keep your devices charged and updated\n• Use simple passwords you can remember\n• Learn one new feature at a time\n• Don't be afraid to explore and experiment\n• Ask for help from tech-savvy friends or family\n\n**Safety Online:**\n• Don't share personal information with strangers\n• Be careful about clicking unknown links\n• Keep your private information secure\n• Ask for help if something seems suspicious\n\nRemember: Technology should make your life easier, not more stressful. Take your time learning, and don't hesitate to ask for support!";
  }
  
  // Default encouraging response with more comprehensive support
  return "Thank you for reaching out! I'm AdaptAI, and I'm here to support you on your independence journey. While I'm having some technical difficulties with my advanced features right now, I want you to know:\n\n**You're Doing Great!**\n• Using AdaptaLyfe shows you're taking charge of your independence\n• Every question you ask helps you learn and grow\n• It's completely normal to need support - we all do!\n• Your caregivers and support team believe in you\n\n**What I Can Help With:**\n• Daily task planning and organization\n• Money management and budgeting\n• Health and medication tracking\n• Meal planning and cooking tips\n• Building life skills and confidence\n• Connecting with your support network\n\n**Next Steps:**\n• Explore the different sections of the app\n• Try setting up a simple daily routine\n• Reach out to your caregivers if you need extra support\n• Remember that every small step forward is progress!\n\nIs there a specific area where you'd like to start? I'm here to help guide you through it!";
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure environment for production readiness
  configureForProduction();
  
  // Initialize comprehensive demo only in development or demo mode
  if (shouldInitializeDemoData()) {
    console.log("🚀 Demo mode enabled - initializing demo data");
    initializeComprehensiveDemo();
  } else {
    console.log("🏭 Production mode - skipping demo data initialization");
  }
  
  // Setup sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'demo-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Middleware to ensure user is logged in for protected routes
  const requireAuth = async (req: any, res: any, next: any) => {
    // Production mode - no auto-login
    if (!req.session.userId || !req.session.user) {
      console.log("❌ No authenticated user - access denied to protected route");
      return res.status(401).json({ message: "Authentication required" });
    }
    
    req.user = req.session.user;
    next();
  };

  // User registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, username, password, plan, subscribeNewsletter } = req.body;
      
      // Validate required fields
      if (!username || !password || !name) {
        return res.status(400).json({ message: "Username, password, and name are required" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user
      const user = await storage.createUser({
        username,
        password, // In production, this would be hashed
        name,
        email: email || null
      });

      // Create session for new user
      req.session.userId = user.id;
      req.session.user = user;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ 
        message: "Registration successful",
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // In production, compare hashed passwords
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session for user
      req.session.userId = user.id;
      req.session.user = user;
      
      await new Promise<void>((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ 
        message: "Login successful",
        user: { 
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Demo login endpoint
  app.post("/api/demo-login", async (req: any, res) => {
    try {
      const { username, password } = req.body;
      console.log("Demo login attempt:", { username, password });
      
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? { id: user.id, username: user.username, password: user.password } : "No user found");
      
      if (!user) {
        console.log("No user found for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Simple password check for demo (in production, use proper hashing)
      if (user.password !== password) {
        console.log("Password mismatch:", { provided: password, expected: user.password });
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user in session and save the session
      req.session.userId = user.id;
      req.session.user = user;
      
      // Save session explicitly before sending response
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log("Session saved successfully for user:", user.id);
        
        res.json({ 
          message: "Login successful", 
          user: { 
            id: user.id, 
            username: user.username, 
            name: user.name, 
            email: user.email 
          } 
        });
      });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", async (req: any, res) => {
    try {
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user - mobile-optimized session handling
  app.get("/api/user", async (req: any, res) => {
    console.log("🔍 Checking session for user authentication");
    console.log("Session ID:", req.sessionID);
    console.log("User-Agent:", req.headers['user-agent']?.substring(0, 100));
    console.log("Cookies:", req.headers.cookie);
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    
    // Check session validity and attempt recovery
    if (!req.session.userId || !req.session.user) {
      console.log("❌ No authenticated user found in session");
      
      // For mobile devices, try extra recovery attempts
      const isMobile = /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent'] || '');
      console.log("📱 Mobile device detected:", isMobile);
      
      // Check if session exists but is corrupted - try to rebuild from userId
      if (req.session.userId && !req.session.user) {
        console.log("🔧 Attempting to rebuild user session from userId:", req.session.userId);
        try {
          const user = await storage.getUserById(req.session.userId);
          if (user) {
            req.session.user = user;
            await new Promise<void>((resolve, reject) => {
              req.session.save((err: any) => {
                if (err) {
                  console.error("Session save error:", err);
                  reject(err);
                } else {
                  console.log("✅ Session rebuilt successfully");
                  resolve();
                }
              });
            });
            const { password, ...userResponse } = user;
            return res.json(userResponse);
          }
        } catch (error) {
          console.error("Error rebuilding session:", error);
        }
      }
      
      return res.status(401).json({ message: "Authentication required", mobile: isMobile });
    }
    
    const user = req.session.user;
    console.log("✅ Authenticated user found:", user.username);
    
    // Don't return password in response
    const { password, ...userResponse } = user;
    res.json(userResponse);
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create new user (excluding confirmPassword)
      const { confirmPassword, ...userData } = validatedData;
      const newUser = await storage.createUser(userData);
      
      // Don't return password in response
      const { password, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });





  // Daily Tasks routes
  app.get("/api/daily-tasks", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const tasks = await storage.getDailyTasksByUser(user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const notificationId = parseInt(req.params.id);
      const user = req.session.user;
      
      await storage.markNotificationAsRead(notificationId, user.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Test reminder endpoint
  app.post("/api/test-reminder", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const testNotification = {
        userId: user.id,
        type: 'test_reminder',
        title: '🔔 Test Reminder',
        message: 'This is a test reminder to verify the notification system is working properly.',
        priority: 'normal',
        isRead: false,
        metadata: {
          source: 'test',
          timestamp: new Date().toISOString()
        }
      };

      const notification = await storage.createNotification(testNotification);
      res.json({ message: "Test reminder sent", notification });
    } catch (error) {
      console.error("Error sending test reminder:", error);
      res.status(500).json({ message: "Failed to send test reminder" });
    }
  });

  // User preferences endpoints
  app.get("/api/user-preferences", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const preferences = await storage.getUserPreferences(user.id);
      res.json(preferences || {
        reminderTiming: { taskReminders: 5, overdueReminders: true },
        notificationSettings: { pushEnabled: true }
      });
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.put("/api/user-preferences", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const preferences = await storage.updateUserPreferences(user.id, req.body);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.post("/api/daily-tasks", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const data = insertDailyTaskSchema.parse({ ...req.body, userId: user.id });
      const task = await storage.createDailyTask(data);
      res.json(task);
    } catch (error) {
      console.error("Failed to create task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  // Update daily task details
  app.patch("/api/daily-tasks/:id", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user;
      const taskId = parseInt(req.params.id);
      const updates = req.body;

      // Get the task first to verify ownership
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask || existingTask.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      const task = await storage.updateDailyTask(taskId, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(500).json({ 
        message: "Failed to update task", 
        error: error.message 
      });
    }
  });

  app.patch("/api/daily-tasks/:id/complete", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user;
      const taskId = parseInt(req.params.id);
      const { isCompleted } = req.body;
      
      // Get the task to check ownership and point value
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask || existingTask.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }

      const task = await storage.updateTaskCompletion(taskId, isCompleted);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Award points when task is completed (not when uncompleted)
      if (isCompleted && existingTask.pointValue && existingTask.pointValue > 0) {
        try {
          await storage.updateUserPoints(
            user.id, 
            existingTask.pointValue, 
            "task_completion", 
            `Completed: ${existingTask.title}`, 
            user.id
          );
          console.log(`Awarded ${existingTask.pointValue} points for completing task: ${existingTask.title}`);
        } catch (pointsError) {
          console.error("Error awarding points for task completion:", pointsError);
          // Don't fail the task completion if points award fails
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Error updating task completion:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Bills routes
  app.get("/api/bills", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const bills = await storage.getBillsByUser(user.id);
      res.json(bills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const data = insertBillSchema.parse({ ...req.body, userId: user.id });
      const bill = await storage.createBill(data);
      res.json(bill);
    } catch (error) {
      console.error("Failed to create bill:", error);
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.patch("/api/bills/:id", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const billId = parseInt(req.params.id);
      const data = insertBillSchema.omit({ userId: true }).parse(req.body);
      const bill = await storage.updateBill(billId, data);
      res.json(bill);
    } catch (error) {
      console.error("Failed to update bill:", error);
      res.status(400).json({ message: "Invalid bill data" });
    }
  });

  app.patch("/api/bills/:id/pay", async (req, res) => {
    const billId = parseInt(req.params.id);
    const { isPaid } = req.body;
    const bill = await storage.updateBillPayment(billId, isPaid);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  });

  app.patch("/api/bills/:id/payment-link", async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const { payeeWebsite, payeeAccountNumber } = req.body;
      
      const bill = await storage.updateBill(billId, {
        payeeWebsite,
        payeeAccountNumber,
      });
      
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      
      res.json(bill);
    } catch (error) {
      console.error("Failed to update payment link:", error);
      res.status(500).json({ message: "Failed to update payment link" });
    }
  });

  // Bank account routes
  app.get("/api/bank-accounts", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const accounts = await storage.getBankAccountsByUser(user.id);
      res.json(accounts);
    } catch (error) {
      console.error("Failed to fetch bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      // Don't validate with schema since we need to handle accountName differently
      const requestData = req.body;
      const data = {
        userId: user.id,
        bankName: requestData.bankName,
        accountType: requestData.accountType,
        accountNickname: requestData.accountNickname,
        bankWebsite: requestData.bankWebsite,
        lastFour: requestData.lastFour,
      };
      const account = await storage.createBankAccount(data);
      res.json(account);
    } catch (error) {
      console.error("Failed to create bank account:", error);
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  app.delete("/api/bank-accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const success = await storage.deleteBankAccount(accountId);
      if (!success) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      console.error("Failed to delete bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  // Mood entries routes
  app.get("/api/mood-entries", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const entries = await storage.getMoodEntriesByUser(user.id);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.get("/api/mood-entries/today", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const entry = await storage.getTodayMoodEntry(user.id);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's mood entry" });
    }
  });

  app.post("/api/mood-entries", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      
      // Check if user already has a mood entry for today
      const existingTodayEntry = await storage.getTodayMoodEntry(user.id);
      if (existingTodayEntry) {
        return res.status(400).json({ 
          message: "You have already logged your mood for today. Please check back tomorrow!",
          existing: true
        });
      }
      
      const data = insertMoodEntrySchema.parse({ ...req.body, userId: user.id });
      const entry = await storage.createMoodEntry(data);
      res.json(entry);
    } catch (error) {
      console.error("Failed to create mood entry:", error);
      res.status(400).json({ message: "Invalid mood entry data" });
    }
  });

  // Achievements routes
  app.get("/api/achievements", async (req, res) => {
    const achievements = await storage.getAchievementsByUser(1);
    res.json(achievements);
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const data = insertAchievementSchema.parse({ ...req.body, userId: 1 });
      const achievement = await storage.createAchievement(data);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });

  // Caregivers routes
  app.get("/api/caregivers", async (req, res) => {
    const caregivers = await storage.getCaregiversByUser(1);
    res.json(caregivers);
  });

  app.post("/api/caregivers", async (req, res) => {
    try {
      const data = insertCaregiverSchema.parse({ ...req.body, userId: 1 });
      const caregiver = await storage.createCaregiver(data);
      res.json(caregiver);
    } catch (error) {
      res.status(400).json({ message: "Invalid caregiver data" });
    }
  });

  // Messages routes
  app.get("/api/messages", async (req, res) => {
    const messages = await storage.getMessagesByUser(1);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.parse({ ...req.body, userId: 1 });
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // Budget entries routes
  app.get("/api/budget-entries", async (req: any, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const entries = await storage.getBudgetEntriesByUser(req.session.userId);
      res.json(entries);
    } catch (error) {
      console.error("Error in /api/budget-entries:", error);
      res.status(500).json({ message: "Failed to fetch budget entries" });
    }
  });

  app.post("/api/budget-entries", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const data = insertBudgetEntrySchema.parse({ ...req.body, userId: user.id });
      const entry = await storage.createBudgetEntry(data);
      res.json(entry);
    } catch (error) {
      console.error("Failed to create budget entry:", error);
      res.status(400).json({ message: "Invalid budget entry data" });
    }
  });

  // Budget Categories routes
  app.get("/api/budget-categories", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const categories = await storage.getBudgetCategoriesByUser(user.id);
      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch budget categories:", error);
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post("/api/budget-categories", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const data = insertBudgetCategorySchema.parse({ ...req.body, userId: user.id });
      const category = await storage.createBudgetCategory(data);
      res.json(category);
    } catch (error) {
      console.error("Failed to create budget category:", error);
      res.status(400).json({ message: "Invalid budget category data" });
    }
  });

  app.patch("/api/budget-categories/:id", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const categoryId = parseInt(req.params.id);
      const data = insertBudgetCategorySchema.omit({ userId: true }).parse(req.body);
      const category = await storage.updateBudgetCategory(categoryId, data);
      res.json(category);
    } catch (error) {
      console.error("Failed to update budget category:", error);
      res.status(400).json({ message: "Invalid budget category data" });
    }
  });

  // Savings Goals routes
  app.get("/api/savings-goals", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const goals = await storage.getSavingsGoalsByUser(user.id);
      res.json(goals);
    } catch (error) {
      console.error("Failed to fetch savings goals:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.post("/api/savings-goals", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      
      // Create schema that handles string dates for creation
      const createSchema = z.object({
        title: z.string().min(1, "Goal title is required"),
        description: z.string().optional(),
        targetAmount: z.number().min(0.01, "Target amount must be greater than 0"),
        currentAmount: z.number().min(0, "Current amount cannot be negative").default(0),
        targetDate: z.string().transform(str => str ? new Date(str) : null),
        category: z.string().optional().default("general"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        userId: z.number(),
      });
      
      const data = createSchema.parse({ ...req.body, userId: user.id });
      const goal = await storage.createSavingsGoal(data);
      res.json(goal);
    } catch (error) {
      console.error("Failed to create savings goal:", error);
      res.status(400).json({ message: "Invalid savings goal data" });
    }
  });

  app.patch("/api/savings-goals/:id", async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      
      // Create update schema that handles string dates
      const updateSchema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        targetAmount: z.number().optional(),
        currentAmount: z.number().optional(),
        targetDate: z.string().transform(str => str ? new Date(str) : null).optional(),
        category: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      });
      
      const updates = updateSchema.parse(req.body);
      
      const goal = await storage.updateSavingsGoal(goalId, updates);
      if (!goal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.json(goal);
    } catch (error) {
      console.error("Failed to update savings goal:", error);
      res.status(500).json({ message: "Failed to update savings goal" });
    }
  });

  app.delete("/api/savings-goals/:id", async (req: any, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const success = await storage.deleteSavingsGoal(goalId);
      
      if (!success) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      
      res.json({ message: "Savings goal deleted successfully" });
    } catch (error) {
      console.error("Failed to delete savings goal:", error);
      res.status(500).json({ message: "Failed to delete savings goal" });
    }
  });

  // Savings Transactions routes
  app.get("/api/savings-transactions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const { goalId } = req.query;
      
      let transactions;
      if (goalId) {
        transactions = await storage.getSavingsTransactionsByGoal(parseInt(goalId as string));
      } else {
        transactions = await storage.getSavingsTransactionsByUser(user.id);
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch savings transactions:", error);
      res.status(500).json({ message: "Failed to fetch savings transactions" });
    }
  });

  app.post("/api/savings-transactions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const data = insertSavingsTransactionSchema.parse({ ...req.body, userId: user.id });
      const transaction = await storage.createSavingsTransaction(data);
      res.json(transaction);
    } catch (error) {
      console.error("Failed to create savings transaction:", error);
      res.status(400).json({ message: "Invalid savings transaction data" });
    }
  });

  // Appointments routes
  app.get("/api/appointments", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const appointments = await storage.getAppointmentsByUser(req.session.userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/upcoming", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const appointments = await storage.getUpcomingAppointments(user.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
  });

  app.post("/api/appointments", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const data = insertAppointmentSchema.parse({ ...req.body, userId: req.session.userId });
      const appointment = await storage.createAppointment(data);
      res.json(appointment);
    } catch (error) {
      console.error("Failed to create appointment:", error);
      res.status(400).json({ message: "Invalid appointment data" });
    }
  });

  app.patch("/api/appointments/:id/complete", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { isCompleted } = req.body;
      const appointment = await storage.updateAppointmentCompletion(appointmentId, isCompleted);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Academic routes
  app.get("/api/assignments", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const assignments = await storage.getAssignmentsByUser(user.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      
      // Convert dueDate string to proper timestamp
      const dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error("Invalid due date provided");
      }
      
      const assignmentData = { 
        ...req.body, 
        userId: user.id,
        dueDate: dueDate
      };
      
      const assignment = await storage.createAssignment(assignmentData);
      
      res.json(assignment);
    } catch (error) {
      console.error("Failed to create assignment:", error);
      res.status(400).json({ message: "Invalid assignment data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/academic-classes", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const classes = await storage.getAcademicClassesByUser(user.id);
      res.json(classes);
    } catch (error) {
      console.error("Error fetching academic classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/academic-classes", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const classData = { ...req.body, userId: user.id };
      const academicClass = await storage.createAcademicClass(classData);
      res.json(academicClass);
    } catch (error) {
      console.error("Failed to create class:", error);
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  app.get("/api/study-sessions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const studySessions = await storage.getStudySessionsByUser(user.id);
      res.json(studySessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      res.status(500).json({ message: "Failed to fetch study sessions" });
    }
  });

  app.post("/api/study-sessions", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const sessionData = { ...req.body, userId: user.id };
      const studySession = await storage.createStudySession(sessionData);
      res.json(studySession);
    } catch (error) {
      console.error("Error creating study session:", error);
      res.status(500).json({ message: "Failed to create study session" });
    }
  });

  app.patch("/api/study-sessions/:id", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const sessionId = parseInt(req.params.id);
      const updateData = req.body;
      const studySession = await storage.updateStudySession(sessionId, updateData);
      res.json(studySession);
    } catch (error) {
      console.error("Error updating study session:", error);
      res.status(500).json({ message: "Failed to update study session" });
    }
  });

  app.get("/api/campus-transport", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const transport = await storage.getCampusTransportByUser(user.id);
      res.json(transport);
    } catch (error) {
      console.error("Failed to fetch campus transport:", error);
      res.status(500).json({ message: "Failed to fetch campus transport" });
    }
  });

  app.post("/api/campus-transport", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const transportData = {
        ...req.body,
        userId: user.id
      };
      
      const transport = await storage.createCampusTransport(transportData);
      res.json(transport);
    } catch (error) {
      console.error("Failed to create campus transport:", error);
      res.status(500).json({ message: "Failed to create campus transport" });
    }
  });

  app.get("/api/campus-locations", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const locations = await storage.getCampusLocationsByUser(user.id);
      res.json(locations);
    } catch (error) {
      console.error("Failed to fetch campus locations:", error);
      res.status(500).json({ message: "Failed to fetch campus locations" });
    }
  });

  app.post("/api/campus-locations", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const locationData = {
        ...req.body,
        userId: user.id
      };
      
      const location = await storage.createCampusLocation(locationData);
      res.json(location);
    } catch (error) {
      console.error("Failed to create campus location:", error);
      res.status(500).json({ message: "Failed to create campus location" });
    }
  });

  app.get("/api/study-groups", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const studyGroups = await storage.getStudyGroupsByUser(user.id);
      res.json(studyGroups);
    } catch (error) {
      console.error("Error fetching study groups:", error);
      res.status(500).json({ message: "Failed to fetch study groups" });
    }
  });

  app.post("/api/study-groups", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      
      // Handle date conversion for study group data  
      const studyGroupData = { 
        ...req.body, 
        userId: user.id,
        meetingTime: req.body.meetingTime ? new Date(req.body.meetingTime) : null
      };
      
      console.log("Study group data:", studyGroupData);
      
      const studyGroup = await storage.createStudyGroup(studyGroupData);
      res.json(studyGroup);
    } catch (error) {
      console.error("Error creating study group:", error);
      res.status(500).json({ message: "Failed to create study group" });
    }
  });

  app.get("/api/transition-skills", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const skills = await storage.getTransitionSkillsByUser(user.id);
      res.json(skills);
    } catch (error) {
      console.error("Failed to fetch transition skills:", error);
      res.status(500).json({ message: "Failed to fetch transition skills" });
    }
  });

  app.post("/api/transition-skills", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const skillData = {
        ...req.body,
        userId: user.id
      };
      
      const skill = await storage.createTransitionSkill(skillData);
      res.json(skill);
    } catch (error) {
      console.error("Failed to create transition skill:", error);
      res.status(500).json({ message: "Failed to create transition skill" });
    }
  });

  app.patch("/api/transition-skills/:id", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const skillId = parseInt(req.params.id);
      const updateData = req.body;
      
      const skill = await storage.updateTransitionSkill(skillId, updateData);
      res.json(skill);
    } catch (error) {
      console.error("Failed to update transition skill:", error);
      res.status(500).json({ message: "Failed to update transition skill" });
    }
  });

  app.delete("/api/transition-skills/:id", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const skillId = parseInt(req.params.id);
      
      await storage.deleteTransitionSkill(skillId);
      res.json({ message: "Transition skill deleted successfully" });
    } catch (error) {
      console.error("Failed to delete transition skill:", error);
      res.status(500).json({ message: "Failed to delete transition skill" });
    }
  });

  // Calendar Events routes
  app.get("/api/calendar-events", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const events = await storage.getCalendarEventsByUser(req.session.userId);
      res.json(events);
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar-events", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Convert date strings to Date objects
      const eventData = {
        ...req.body,
        userId: req.session.userId,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Failed to create calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.put("/api/calendar-events/:id", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const eventId = parseInt(req.params.id);
      
      // Convert date strings to Date objects if they exist
      const updateData = {
        ...req.body
      };
      if (req.body.startDate) {
        updateData.startDate = new Date(req.body.startDate);
      }
      if (req.body.endDate) {
        updateData.endDate = new Date(req.body.endDate);
      }
      
      const event = await storage.updateCalendarEvent(eventId, updateData);
      res.json(event);
    } catch (error) {
      console.error("Failed to update calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const eventId = parseInt(req.params.id);
      const deleted = await storage.deleteCalendarEvent(eventId);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Event not found" });
      }
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Meal Plans routes
  app.get("/api/meal-plans", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const mealPlans = await storage.getMealPlansByUser(user.id);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  app.post("/api/meal-plans", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const data = insertMealPlanSchema.parse({ ...req.body, userId: user.id });
      const mealPlan = await storage.createMealPlan(data);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(400).json({ message: "Invalid meal plan data" });
    }
  });

  app.patch("/api/meal-plans/:id/completion", async (req, res) => {
    try {
      const mealPlanId = parseInt(req.params.id);
      const { isCompleted } = req.body;
      const mealPlan = await storage.updateMealPlanCompletion(mealPlanId, isCompleted);
      if (!mealPlan) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      res.json(mealPlan);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/meal-plans/date/:date", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const date = req.params.date;
      const mealPlans = await storage.getMealPlansByDate(user.id, date);
      res.json(mealPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });

  // Shopping Lists routes
  app.get("/api/shopping-lists", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const items = await storage.getShoppingListsByUser(user.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
      res.status(500).json({ message: "Failed to fetch shopping lists" });
    }
  });

  app.get("/api/shopping-lists/active", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const items = await storage.getActiveShoppingItems(user.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching active shopping items:", error);
      res.status(500).json({ message: "Failed to fetch active shopping items" });
    }
  });

  app.post("/api/shopping-lists", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const data = insertShoppingListSchema.parse({ ...req.body, userId: user.id });
      const item = await storage.createShoppingListItem(data);
      res.json(item);
    } catch (error) {
      console.error("Failed to create shopping list item:", error);
      res.status(400).json({ message: "Invalid shopping list item data" });
    }
  });

  app.patch("/api/shopping-lists/:id/purchased", async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const { isPurchased, actualCost } = req.body;
      const item = await storage.updateShoppingItemPurchased(itemId, isPurchased, actualCost);
      if (!item) {
        return res.status(404).json({ message: "Shopping item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Grocery Stores routes
  app.get("/api/grocery-stores", async (req, res) => {
    try {
      const stores = await storage.getGroceryStoresByUser(1);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery stores" });
    }
  });

  app.post("/api/grocery-stores", async (req, res) => {
    try {
      const data = { ...req.body, userId: 1 };
      const store = await storage.createGroceryStore(data);
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid grocery store data" });
    }
  });

  app.put("/api/grocery-stores/:id", async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const store = await storage.updateGroceryStore(storeId, req.body);
      if (!store) {
        return res.status(404).json({ message: "Grocery store not found" });
      }
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.delete("/api/grocery-stores/:id", async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const success = await storage.deleteGroceryStore(storeId);
      if (!success) {
        return res.status(404).json({ message: "Grocery store not found" });
      }
      res.json({ message: "Grocery store deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Emergency resources routes
  app.get("/api/emergency-resources", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || 1;
      const resources = await storage.getEmergencyResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching emergency resources:", error);
      res.status(500).json({ message: "Failed to fetch emergency resources" });
    }
  });

  app.post("/api/emergency-resources", async (req: any, res) => {
    try {
      const userId = req.session?.user?.id || 1;
      const resourceData = { ...req.body, userId };
      const resource = await storage.createEmergencyResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating emergency resource:", error);
      res.status(500).json({ message: "Failed to create emergency resource" });
    }
  });

  app.put("/api/emergency-resources/:id", async (req: any, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const updates = req.body;
      const resource = await storage.updateEmergencyResource(resourceId, updates);
      
      if (!resource) {
        return res.status(404).json({ message: "Emergency resource not found" });
      }
      
      res.json(resource);
    } catch (error) {
      console.error("Error updating emergency resource:", error);
      res.status(500).json({ message: "Failed to update emergency resource" });
    }
  });

  app.delete("/api/emergency-resources/:id", async (req: any, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const success = await storage.deleteEmergencyResource(resourceId);
      
      if (!success) {
        return res.status(404).json({ message: "Emergency resource not found" });
      }
      
      res.json({ message: "Emergency resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting emergency resource:", error);
      res.status(500).json({ message: "Failed to delete emergency resource" });
    }
  });

  // Caregiver access control endpoint
  app.get("/api/caregiver-access", async (req: any, res) => {
    try {
      console.log('🔍 Checking caregiver access for session:', req.session?.userId);
      console.log('🔍 Session user:', req.session?.user?.username);
      
      // Check if user has valid session
      if (!req.session?.userId || !req.session?.user) {
        console.log('❌ No valid session found');
        return res.status(401).json({ message: "User not authenticated" });
      }

      const currentUser = req.session.user;
      console.log('✅ Caregiver access check for user:', currentUser.username);

      // SOFT LAUNCH MODE: Allow all authenticated users to access caregiver dashboard for testing
      // This enables testers to experience both user and caregiver functionality
      // In full production, this would check proper caregiver credentials
      const isCaregiver = true; // Demo mode - all users can test caregiver features
      
      res.json({ 
        isCaregiver,
        userId: currentUser.id,
        username: currentUser.username,
        demoMode: true, // Indicate this is soft launch demo access
        message: "Soft launch testing mode - caregiver dashboard access granted for demo purposes"
      });
    } catch (error) {
      console.error("Error checking caregiver access:", error);
      res.status(500).json({ message: "Failed to verify caregiver access" });
    }
  });

  // Backup sync endpoint for mobile app
  app.post('/api/backup/sync', requireAuth, async (req: any, res) => {
    try {
      const backupData = req.body;
      const userId = req.user.id;
      
      // Store backup data (simplified implementation)
      // In production, this would sync to cloud storage
      res.json({ 
        success: true, 
        message: 'Backup synced successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Backup sync error:', error);
      res.status(500).json({ error: 'Failed to sync backup' });
    }
  });

  // Sync offline data endpoint
  app.post('/api/sync-offline-data', requireAuth, async (req: any, res) => {
    try {
      const offlineData = req.body;
      const userId = req.user.id;
      
      // Process offline task completions, notes, etc.
      // This would update the database with offline changes
      
      res.json({ 
        success: true, 
        message: 'Offline data synced successfully' 
      });
    } catch (error) {
      console.error('Offline sync error:', error);
      res.status(500).json({ error: 'Failed to sync offline data' });
    }
  });

  // AI Chatbot API endpoints
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      
      if (!message || !userId) {
        return res.status(400).json({ error: "Message and userId are required" });
      }

      // Get user data for context
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create enhanced system prompt with user context
      const systemPrompt = `You are AdaptAI, a supportive AI assistant for AdaptaLyfe, an app designed to help individuals with developmental disabilities build independence and confidence.

User context:
- Name: ${user.name || user.username}
- Subscription: ${user.subscriptionTier || 'basic'}

Core Guidelines:
- Use simple, clear language that's easy to understand
- Be encouraging, patient, and genuinely supportive
- Focus on building independence, confidence, and life skills
- Break complex tasks into simple, manageable steps
- Celebrate small wins and progress
- Be warm and friendly, like a helpful friend

Response Style:
- Keep responses helpful but concise (2-4 sentences when possible)
- Use bullet points for step-by-step instructions
- Offer specific, actionable advice
- Ask follow-up questions to be more helpful
- Use positive, encouraging language

Special Situations:
- If the user seems distressed, provide emotional support and suggest contacting their caregiver
- For medical questions, remind them to consult healthcare professionals
- For app-specific questions, guide them to the relevant features
- If they share accomplishments, celebrate with them enthusiastically

App Features to Reference:
- Daily Tasks for planning and tracking activities
- Financial section for budgeting and bill management
- Mood Tracking for emotional wellness
- Medical/Pharmacy for health management
- Caregiver features for staying connected
- Meal Planning for nutrition and cooking
- Calendar for appointments and scheduling

User message: "${message}"

Provide a helpful, encouraging response:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 400,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      });

      const response = completion.choices[0]?.message?.content || "I'm here to help! Could you ask me again?";
      
      res.json({ 
        message: response,
        type: "text"
      });
    } catch (error: any) {
      console.error("Error in chat endpoint:", error);
      
      // Handle OpenAI quota exceeded or rate limiting
      if (error.status === 429 || error.code === 'insufficient_quota') {
        // Provide helpful fallback responses based on common queries
        const fallbackResponse = getFallbackResponse(req.body.message);
        res.json({ 
          message: fallbackResponse,
          type: "fallback",
          notice: "AI assistant is temporarily unavailable. Here's some helpful guidance:"
        });
      } else {
        res.status(500).json({ 
          error: "I'm having trouble connecting right now. Please try again in a moment.",
          type: "general_error"
        });
      }
    }
  });

  // Get quick suggestions for chatbot
  app.get("/api/chat/suggestions", async (req, res) => {
    try {
      const suggestions = [
        {
          id: "help-1",
          text: "How do I create a daily routine?",
          category: "help",
        },
        {
          id: "encouragement-1", 
          text: "I'm feeling overwhelmed today",
          category: "encouragement",
        },
        {
          id: "planning-1",
          text: "Help me plan my week",
          category: "planning",
        },
        {
          id: "skills-1",
          text: "I want to learn something new",
          category: "skills",
        },
        {
          id: "help-2",
          text: "How do I organize my medications?",
          category: "help",
        },
        {
          id: "encouragement-2",
          text: "I accomplished something today!",
          category: "encouragement",
        },
        {
          id: "planning-2",
          text: "Help me build a daily routine",
          category: "planning",
        },
        {
          id: "skills-2",
          text: "Show me simple cooking tips",
          category: "skills",
        },
        {
          id: "help-3",
          text: "Help me understand my budget",
          category: "help",
        },
        {
          id: "help-4",
          text: "How do I use this app?",
          category: "help",
        },
        {
          id: "social-1",
          text: "I want to connect with my caregivers",
          category: "help",
        },
        {
          id: "encouragement-3",
          text: "I need some motivation today",
          category: "encouragement",
        }
      ];
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting chat suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });

  // Rewards API Routes
  app.get("/api/rewards", async (req, res) => {
    try {
      console.log("=== REWARDS: GET /api/rewards (FIRST ROUTE) ===");
      console.log("Session data:", req.session);
      
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("Final user ID:", req.session.userId);
      const rewards = await storage.getRewardsByUser(req.session.userId);
      console.log("Found rewards count:", rewards.length);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      // Set default caregiver_id if not provided
      const rewardData = { 
        ...req.body, 
        userId: req.session.userId,
        caregiverId: req.body.caregiverId || 1 // Default to caregiver ID 1 (Mom)
      };
      const reward = await storage.createReward(rewardData);
      res.json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  app.post("/api/rewards/:id/redeem", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const rewardId = parseInt(req.params.id);
      // Reward redemption system ready for implementation
      const redemption = { id: rewardId, status: "redeemed", userId: req.session.userId };
      res.json(redemption);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });

  // Points API Routes  
  app.get("/api/points/balance", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const balance = await storage.getUserPointsBalance(req.session.userId);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching points balance:", error);
      res.status(500).json({ message: "Failed to fetch points balance" });
    }
  });

  app.get("/api/points/transactions", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const transactions = await storage.getPointsTransactionsByUser(req.session.userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points transactions:", error);
      res.status(500).json({ message: "Failed to fetch points transactions" });
    }
  });

  app.post("/api/points/transactions", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const transactionData = { ...req.body, userId: req.session.userId };
      // Points system endpoint ready for future implementation
      res.json({ message: "Points system endpoint ready for implementation" });
    } catch (error) {
      console.error("Error creating points transaction:", error);
      res.status(500).json({ message: "Failed to create points transaction" });
    }
  });

  // Caregiver Permission Management Routes
  app.get("/api/caregiver-permissions/:userId/:caregiverId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const caregiverId = parseInt(req.params.caregiverId);
      const permissions = await storage.getCaregiverPermissions(userId, caregiverId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching caregiver permissions:", error);
      res.status(500).json({ message: "Failed to fetch caregiver permissions" });
    }
  });

  app.post("/api/caregiver-permissions", async (req, res) => {
    try {
      const permission = await storage.setCaregiverPermission(req.body);
      res.json(permission);
    } catch (error) {
      console.error("Error setting caregiver permission:", error);
      res.status(400).json({ message: "Failed to set caregiver permission" });
    }
  });

  app.delete("/api/caregiver-permissions/:userId/:caregiverId/:permissionType", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const caregiverId = parseInt(req.params.caregiverId);
      const { permissionType } = req.params;
      const success = await storage.removeCaregiverPermission(userId, caregiverId, permissionType);
      
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      
      res.json({ message: "Permission removed successfully" });
    } catch (error) {
      console.error("Error removing caregiver permission:", error);
      res.status(500).json({ message: "Failed to remove caregiver permission" });
    }
  });

  // Locked User Settings Routes
  app.get("/api/locked-settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getLockedUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching locked settings:", error);
      res.status(500).json({ message: "Failed to fetch locked settings" });
    }
  });

  // Caregiver Invitation Routes
  app.post("/api/caregiver-invitations", async (req: any, res) => {
    try {
      // Check authentication
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Ensure the invitation is linked to the authenticated user
      const invitationData = {
        ...req.body,
        caregiverId: user.id, // Use authenticated user's ID
      };

      console.log("Creating caregiver invitation:", invitationData);
      const invitation = await storage.createCaregiverInvitation(invitationData);
      
      console.log("Invitation created successfully:", invitation);
      res.json(invitation);
    } catch (error) {
      console.error("Error creating caregiver invitation:", error);
      res.status(400).json({ message: "Failed to create caregiver invitation", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/caregiver-invitations/:caregiverId", async (req: any, res) => {
    try {
      // Check authentication
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const caregiverId = parseInt(req.params.caregiverId);
      
      // Users can only view their own invitations
      if (user.id !== caregiverId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const invitations = await storage.getCaregiverInvitationsByCaregiver(caregiverId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching caregiver invitations:", error);
      res.status(500).json({ message: "Failed to fetch caregiver invitations" });
    }
  });

  app.get("/api/invitation/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const invitation = await storage.getCaregiverInvitation(code);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Check if invitation is expired
      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.expireCaregiverInvitation(code);
        return res.status(410).json({ message: "Invitation has expired" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "Invitation is no longer valid" });
      }

      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/accept-invitation", async (req, res) => {
    try {
      const { invitationCode, userId } = req.body;
      
      if (!invitationCode || !userId) {
        return res.status(400).json({ message: "Invitation code and user ID are required" });
      }

      const acceptedInvitation = await storage.acceptCaregiverInvitation(invitationCode, userId);
      
      if (!acceptedInvitation) {
        return res.status(400).json({ message: "Invalid or expired invitation" });
      }

      res.json({ 
        message: "Invitation accepted successfully",
        invitation: acceptedInvitation
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Care Relationship Routes
  app.get("/api/care-relationships/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const relationships = await storage.getCareRelationshipsByUser(userId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching care relationships:", error);
      res.status(500).json({ message: "Failed to fetch care relationships" });
    }
  });

  app.get("/api/care-relationships/caregiver/:caregiverId", async (req, res) => {
    try {
      const caregiverId = parseInt(req.params.caregiverId);
      const relationships = await storage.getCareRelationshipsByCaregiver(caregiverId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching care relationships:", error);
      res.status(500).json({ message: "Failed to fetch care relationships" });
    }
  });

  app.get("/api/locked-settings/:userId/:settingKey", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settingKey } = req.params;
      const setting = await storage.getLockedUserSetting(userId, settingKey);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching locked setting:", error);
      res.status(500).json({ message: "Failed to fetch locked setting" });
    }
  });

  app.post("/api/locked-settings", async (req, res) => {
    try {
      const setting = await storage.lockUserSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error locking user setting:", error);
      res.status(400).json({ message: "Failed to lock user setting" });
    }
  });

  app.delete("/api/locked-settings/:userId/:settingKey", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settingKey } = req.params;
      const caregiverId = parseInt(req.body.caregiverId || req.query.caregiverId as string);
      
      if (!caregiverId) {
        return res.status(400).json({ message: "Caregiver ID is required" });
      }
      
      const success = await storage.unlockUserSetting(userId, settingKey, caregiverId);
      
      if (!success) {
        return res.status(403).json({ message: "Permission denied or setting not found" });
      }
      
      res.json({ message: "Setting unlocked successfully" });
    } catch (error) {
      console.error("Error unlocking user setting:", error);
      res.status(500).json({ message: "Failed to unlock user setting" });
    }
  });

  app.get("/api/settings-check/:userId/:settingKey/locked", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settingKey } = req.params;
      const isLocked = await storage.isSettingLocked(userId, settingKey);
      res.json({ isLocked });
    } catch (error) {
      console.error("Error checking if setting is locked:", error);
      res.status(500).json({ message: "Failed to check setting lock status" });
    }
  });

  app.get("/api/settings-check/:userId/:settingKey/modifiable", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settingKey } = req.params;
      const canModify = await storage.canUserModifySetting(userId, settingKey);
      res.json({ canModify });
    } catch (error) {
      console.error("Error checking if user can modify setting:", error);
      res.status(500).json({ message: "Failed to check setting modification permissions" });
    }
  });

  // Pharmacy Integration Routes
  app.get("/api/pharmacies", async (req, res) => {
    try {
      const pharmacies = await storage.getPharmacies();
      res.json(pharmacies);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });

  // Add custom pharmacy
  app.post("/api/pharmacies", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const pharmacyData = {
        ...req.body,
        type: "custom",
        isCustom: true,
        createdBy: user.id
      };

      const validatedData = insertPharmacySchema.parse(pharmacyData);
      const pharmacy = await storage.createPharmacy(validatedData);
      res.status(201).json(pharmacy);
    } catch (error) {
      console.error("Error creating custom pharmacy:", error);
      res.status(500).json({ message: "Failed to create pharmacy" });
    }
  });

  app.post("/api/user-pharmacies", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userPharmacyData = {
        ...req.body,
        userId: user.id,
        pharmacyId: parseInt(req.body.pharmacyId) // Convert string to number
      };

      const validatedData = insertUserPharmacySchema.parse(userPharmacyData);
      const userPharmacy = await storage.addUserPharmacy(validatedData);
      res.status(201).json(userPharmacy);
    } catch (error) {
      console.error("Error adding user pharmacy:", error);
      res.status(500).json({ message: "Failed to add pharmacy" });
    }
  });

  app.get("/api/user-pharmacies", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userPharmacies = await storage.getUserPharmacies(user.id);
      res.json(userPharmacies);
    } catch (error) {
      console.error("Error fetching user pharmacies:", error);
      res.status(500).json({ message: "Failed to fetch user pharmacies" });
    }
  });

  // Medication Routes
  app.get("/api/medications", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const medications = await storage.getMedicationsByUser(user.id);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  app.post("/api/medications", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Convert date strings to Date objects
      const medicationData = {
        ...req.body,
        userId: user.id,
        nextRefillDate: req.body.nextRefillDate ? new Date(req.body.nextRefillDate) : null,
        dateStarted: req.body.dateStarted ? new Date(req.body.dateStarted) : null,
        dateFilled: req.body.dateFilled ? new Date(req.body.dateFilled) : null
      };
      
      const validatedData = insertMedicationSchema.parse(medicationData);
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error) {
      console.error("Error creating medication:", error);
      res.status(500).json({ message: "Failed to create medication" });
    }
  });

  app.get("/api/medications/due-for-refill", async (req: any, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const medications = await storage.getMedicationsDueForRefill(user.id);
      res.json(medications);
    } catch (error) {
      console.error("Error fetching medications due for refill:", error);
      res.status(500).json({ message: "Failed to fetch medications due for refill" });
    }
  });

  // Refill Order Routes
  app.get("/api/refill-orders", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const refillOrders = await storage.getRefillOrdersByUser(userId);
      res.json(refillOrders);
    } catch (error) {
      console.error("Error fetching refill orders:", error);
      res.status(500).json({ message: "Failed to fetch refill orders" });
    }
  });

  app.post("/api/refill-orders", async (req, res) => {
    try {
      const validatedData = insertRefillOrderSchema.parse(req.body);
      const refillOrder = await storage.createRefillOrder(validatedData);
      res.status(201).json(refillOrder);
    } catch (error) {
      console.error("Error creating refill order:", error);
      res.status(500).json({ message: "Failed to create refill order" });
    }
  });

  app.patch("/api/refill-orders/:id/status", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      const refillOrder = await storage.updateRefillOrderStatus(orderId, status);
      res.json(refillOrder);
    } catch (error) {
      console.error("Error updating refill order status:", error);
      res.status(500).json({ message: "Failed to update refill order status" });
    }
  });

  // Medical Information Routes
  
  // Allergies
  app.get("/api/allergies", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const allergies = await storage.getAllergiesByUser(userId);
      res.json(allergies);
    } catch (error) {
      console.error("Error fetching allergies:", error);
      res.status(500).json({ message: "Failed to fetch allergies" });
    }
  });

  app.post("/api/allergies", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const allergyData = { ...req.body, userId };
      const allergy = await storage.createAllergy(allergyData);
      res.status(201).json(allergy);
    } catch (error) {
      console.error("Error creating allergy:", error);
      res.status(500).json({ message: "Failed to create allergy" });
    }
  });

  app.put("/api/allergies/:id", async (req, res) => {
    try {
      const allergyId = parseInt(req.params.id);
      const allergy = await storage.updateAllergy(allergyId, req.body);
      res.json(allergy);
    } catch (error) {
      console.error("Error updating allergy:", error);
      res.status(500).json({ message: "Failed to update allergy" });
    }
  });

  app.delete("/api/allergies/:id", async (req, res) => {
    try {
      const allergyId = parseInt(req.params.id);
      const success = await storage.deleteAllergy(allergyId);
      if (!success) {
        return res.status(404).json({ message: "Allergy not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting allergy:", error);
      res.status(500).json({ message: "Failed to delete allergy" });
    }
  });

  // Medical Conditions
  app.get("/api/medical-conditions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const conditions = await storage.getMedicalConditionsByUser(user.id);
      res.json(conditions);
    } catch (error) {
      console.error("Error fetching medical conditions:", error);
      res.status(500).json({ message: "Failed to fetch medical conditions" });
    }
  });

  app.post("/api/medical-conditions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      // Convert diagnosedDate string to Date object if provided
      const conditionData = { ...req.body, userId: user.id };
      if (conditionData.diagnosedDate) {
        conditionData.diagnosedDate = new Date(conditionData.diagnosedDate);
      }
      const condition = await storage.createMedicalCondition(conditionData);
      res.status(201).json(condition);
    } catch (error) {
      console.error("Error creating medical condition:", error);
      res.status(500).json({ message: "Failed to create medical condition" });
    }
  });

  app.put("/api/medical-conditions/:id", async (req, res) => {
    try {
      const conditionId = parseInt(req.params.id);
      const condition = await storage.updateMedicalCondition(conditionId, req.body);
      res.json(condition);
    } catch (error) {
      console.error("Error updating medical condition:", error);
      res.status(500).json({ message: "Failed to update medical condition" });
    }
  });

  app.delete("/api/medical-conditions/:id", async (req, res) => {
    try {
      const conditionId = parseInt(req.params.id);
      const success = await storage.deleteMedicalCondition(conditionId);
      if (!success) {
        return res.status(404).json({ message: "Medical condition not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting medical condition:", error);
      res.status(500).json({ message: "Failed to delete medical condition" });
    }
  });

  // Adverse Medications
  app.get("/api/adverse-medications", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const adverseMeds = await storage.getAdverseMedicationsByUser(user.id);
      res.json(adverseMeds);
    } catch (error) {
      console.error("Error fetching adverse medications:", error);
      res.status(500).json({ message: "Failed to fetch adverse medications" });
    }
  });

  app.post("/api/adverse-medications", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      // Convert reactionDate string to Date object if provided
      const adverseMedData = { ...req.body, userId: user.id };
      if (adverseMedData.reactionDate) {
        adverseMedData.reactionDate = new Date(adverseMedData.reactionDate);
      }
      const adverseMed = await storage.createAdverseMedication(adverseMedData);
      res.status(201).json(adverseMed);
    } catch (error) {
      console.error("Error creating adverse medication:", error);
      res.status(500).json({ message: "Failed to create adverse medication" });
    }
  });

  app.put("/api/adverse-medications/:id", async (req, res) => {
    try {
      const adverseMedId = parseInt(req.params.id);
      const adverseMed = await storage.updateAdverseMedication(adverseMedId, req.body);
      res.json(adverseMed);
    } catch (error) {
      console.error("Error updating adverse medication:", error);
      res.status(500).json({ message: "Failed to update adverse medication" });
    }
  });

  app.delete("/api/adverse-medications/:id", async (req, res) => {
    try {
      const adverseMedId = parseInt(req.params.id);
      const success = await storage.deleteAdverseMedication(adverseMedId);
      if (!success) {
        return res.status(404).json({ message: "Adverse medication not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting adverse medication:", error);
      res.status(500).json({ message: "Failed to delete adverse medication" });
    }
  });

  // Sleep Tracking Routes
  app.get("/api/sleep-sessions", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessions = await storage.getSleepSessionsByUser(req.session.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sleep sessions:", error);
      res.status(500).json({ message: "Failed to fetch sleep sessions" });
    }
  });

  app.post("/api/sleep-sessions", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessionData = { ...req.body, userId: req.session.user.id };
      
      // Convert ISO strings to Date objects for TIMESTAMP columns
      if (sessionData.bedtime) {
        sessionData.bedtime = new Date(sessionData.bedtime);
      }
      if (sessionData.sleepTime) {
        sessionData.sleepTime = new Date(sessionData.sleepTime);
      }
      if (sessionData.wakeTime) {
        sessionData.wakeTime = new Date(sessionData.wakeTime);
      }
      
      const session = await storage.createSleepSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating sleep session:", error);
      res.status(500).json({ message: "Failed to create sleep session" });
    }
  });

  app.put("/api/sleep-sessions/:id", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessionId = parseInt(req.params.id);
      const updates = { ...req.body };
      
      // Convert ISO strings to Date objects for TIMESTAMP columns
      if (updates.bedtime) {
        updates.bedtime = new Date(updates.bedtime);
      }
      if (updates.sleepTime) {
        updates.sleepTime = new Date(updates.sleepTime);
      }
      if (updates.wakeTime) {
        updates.wakeTime = new Date(updates.wakeTime);
      }
      
      const session = await storage.updateSleepSession(sessionId, updates);
      if (!session) {
        return res.status(404).json({ message: "Sleep session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error updating sleep session:", error);
      res.status(500).json({ message: "Failed to update sleep session" });
    }
  });

  app.delete("/api/sleep-sessions/:id", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessionId = parseInt(req.params.id);
      const success = await storage.deleteSleepSession(sessionId);
      if (!success) {
        return res.status(404).json({ message: "Sleep session not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sleep session:", error);
      res.status(500).json({ message: "Failed to delete sleep session" });
    }
  });

  app.get("/api/sleep-sessions/date/:date", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const session = await storage.getSleepSessionByDate(req.session.user.id, req.params.date);
      if (!session) {
        return res.status(404).json({ message: "No sleep session found for this date" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching sleep session by date:", error);
      res.status(500).json({ message: "Failed to fetch sleep session" });
    }
  });

  // Health Metrics Routes
  app.get("/api/health-metrics", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { metricType, startDate, endDate } = req.query;
      const metrics = await storage.getHealthMetricsByUser(
        req.session.user.id, 
        metricType as string,
        startDate as string, 
        endDate as string
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  app.post("/api/health-metrics", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const metricData = { ...req.body, userId: req.session.user.id };
      
      // Convert recordedAt to Date object
      if (metricData.recordedAt) {
        metricData.recordedAt = new Date(metricData.recordedAt);
      }
      
      const metric = await storage.createHealthMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error creating health metric:", error);
      res.status(500).json({ message: "Failed to create health metric" });
    }
  });

  // Emergency Contacts
  app.get("/api/emergency-contacts", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const contacts = await storage.getEmergencyContactsByUser(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const contactData = { ...req.body, userId };
      const contact = await storage.createEmergencyContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ message: "Failed to create emergency contact" });
    }
  });

  app.put("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.updateEmergencyContact(contactId, req.body);
      res.json(contact);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ message: "Failed to update emergency contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const success = await storage.deleteEmergencyContact(contactId);
      if (!success) {
        return res.status(404).json({ message: "Emergency contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ message: "Failed to delete emergency contact" });
    }
  });

  // Primary Care Providers
  app.get("/api/primary-care-providers", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const providers = await storage.getPrimaryCareProvidersByUser(userId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching primary care providers:", error);
      res.status(500).json({ message: "Failed to fetch primary care providers" });
    }
  });

  app.post("/api/primary-care-providers", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const providerData = { ...req.body, userId };
      const provider = await storage.createPrimaryCareProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating primary care provider:", error);
      res.status(500).json({ message: "Failed to create primary care provider" });
    }
  });

  app.put("/api/primary-care-providers/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updatePrimaryCareProvider(providerId, req.body);
      res.json(provider);
    } catch (error) {
      console.error("Error updating primary care provider:", error);
      res.status(500).json({ message: "Failed to update primary care provider" });
    }
  });

  app.delete("/api/primary-care-providers/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const success = await storage.deletePrimaryCareProvider(providerId);
      if (!success) {
        return res.status(404).json({ message: "Primary care provider not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting primary care provider:", error);
      res.status(500).json({ message: "Failed to delete primary care provider" });
    }
  });

  // Symptom Tracking Routes
  app.get("/api/symptom-entries", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const entries = await storage.getSymptomEntriesByUser(req.session.userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching symptom entries:", error);
      res.status(500).json({ message: "Failed to fetch symptom entries" });
    }
  });

  app.get("/api/symptom-entries/date-range", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const entries = await storage.getSymptomEntriesByDateRange(
        req.session.userId, 
        startDate as string, 
        endDate as string
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching symptom entries by date range:", error);
      res.status(500).json({ message: "Failed to fetch symptom entries" });
    }
  });

  app.post("/api/symptom-entries", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("Creating symptom entry for user:", req.session.userId);
      console.log("Request body:", req.body);
      
      const entryData = { 
        ...req.body, 
        userId: req.session.userId,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null
      };
      
      console.log("Entry data to save:", entryData);
      
      const entry = await storage.createSymptomEntry(entryData);
      console.log("Created symptom entry:", entry);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating symptom entry:", error);
      res.status(500).json({ message: "Failed to create symptom entry" });
    }
  });

  app.patch("/api/symptom-entries/:id", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const entryId = parseInt(req.params.id);
      const updates = req.body;
      
      const updated = await storage.updateSymptomEntry(entryId, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Symptom entry not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating symptom entry:", error);
      res.status(500).json({ message: "Failed to update symptom entry" });
    }
  });

  app.delete("/api/symptom-entries/:id", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const entryId = parseInt(req.params.id);
      const deleted = await storage.deleteSymptomEntry(entryId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Symptom entry not found" });
      }
      
      res.json({ message: "Symptom entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting symptom entry:", error);
      res.status(500).json({ message: "Failed to delete symptom entry" });
    }
  });

  // Personal Resources Routes
  app.get("/api/personal-resources", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const { category } = req.query;
      
      let resources;
      if (category && typeof category === 'string') {
        resources = await storage.getPersonalResourcesByCategory(userId, category);
      } else {
        resources = await storage.getPersonalResourcesByUser(userId);
      }
      
      res.json(resources);
    } catch (error) {
      console.error("Error fetching personal resources:", error);
      res.status(500).json({ message: "Failed to fetch personal resources" });
    }
  });

  app.post("/api/personal-resources", async (req, res) => {
    try {
      const userId = 1; // Hardcoded for demo
      const resourceData = insertPersonalResourceSchema.parse({ ...req.body, userId });
      
      const resource = await storage.createPersonalResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating personal resource:", error);
      res.status(500).json({ message: "Failed to create personal resource" });
    }
  });

  app.patch("/api/personal-resources/:id", async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const updates = req.body;
      
      const updated = await storage.updatePersonalResource(resourceId, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Personal resource not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating personal resource:", error);
      res.status(500).json({ message: "Failed to update personal resource" });
    }
  });

  app.delete("/api/personal-resources/:id", async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const deleted = await storage.deletePersonalResource(resourceId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Personal resource not found" });
      }
      
      res.json({ message: "Personal resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting personal resource:", error);
      res.status(500).json({ message: "Failed to delete personal resource" });
    }
  });

  app.patch("/api/personal-resources/:id/access", async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const updated = await storage.incrementResourceAccess(resourceId);
      
      if (!updated) {
        return res.status(404).json({ message: "Personal resource not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating resource access:", error);
      res.status(500).json({ message: "Failed to update resource access" });
    }
  });

  // Bus Schedule Routes
  app.get("/api/bus-schedules", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const schedules = await storage.getBusSchedulesByUser(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching bus schedules:", error);
      res.status(500).json({ message: "Failed to fetch bus schedules" });
    }
  });

  app.get("/api/bus-schedules/day/:day", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const { day } = req.params;
      const schedules = await storage.getBusSchedulesByDay(userId, day);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching bus schedules by day:", error);
      res.status(500).json({ message: "Failed to fetch bus schedules by day" });
    }
  });

  app.get("/api/bus-schedules/frequent", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const schedules = await storage.getFrequentBusRoutes(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching frequent bus routes:", error);
      res.status(500).json({ message: "Failed to fetch frequent bus routes" });
    }
  });

  app.post("/api/bus-schedules", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const data = insertBusScheduleSchema.parse({ ...req.body, userId });
      const schedule = await storage.createBusSchedule(data);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating bus schedule:", error);
      res.status(500).json({ message: "Failed to create bus schedule" });
    }
  });

  app.put("/api/bus-schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const data = insertBusScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateBusSchedule(scheduleId, data);
      
      if (!schedule) {
        return res.status(404).json({ message: "Bus schedule not found" });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error("Error updating bus schedule:", error);
      res.status(500).json({ message: "Failed to update bus schedule" });
    }
  });

  app.delete("/api/bus-schedules/:id", async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const success = await storage.deleteBusSchedule(scheduleId);
      
      if (!success) {
        return res.status(404).json({ message: "Bus schedule not found" });
      }
      
      res.json({ message: "Bus schedule deleted successfully" });
    } catch (error) {
      console.error("Error deleting bus schedule:", error);
      res.status(500).json({ message: "Failed to delete bus schedule" });
    }
  });

  // Emergency Treatment Plan Routes
  app.get("/api/emergency-treatment-plans", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const plans = await storage.getEmergencyTreatmentPlansByUser(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching emergency treatment plans:", error);
      res.status(500).json({ message: "Failed to fetch emergency treatment plans" });
    }
  });

  app.get("/api/emergency-treatment-plans/active", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const plans = await storage.getActiveEmergencyTreatmentPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching active emergency treatment plans:", error);
      res.status(500).json({ message: "Failed to fetch active emergency treatment plans" });
    }
  });

  app.post("/api/emergency-treatment-plans", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const data = insertEmergencyTreatmentPlanSchema.parse({ ...req.body, userId });
      const plan = await storage.createEmergencyTreatmentPlan(data);
      res.json(plan);
    } catch (error) {
      console.error("Error creating emergency treatment plan:", error);
      res.status(500).json({ message: "Failed to create emergency treatment plan" });
    }
  });

  app.put("/api/emergency-treatment-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const data = insertEmergencyTreatmentPlanSchema.partial().parse(req.body);
      const plan = await storage.updateEmergencyTreatmentPlan(planId, data);
      
      if (!plan) {
        return res.status(404).json({ message: "Emergency treatment plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error updating emergency treatment plan:", error);
      res.status(500).json({ message: "Failed to update emergency treatment plan" });
    }
  });

  app.delete("/api/emergency-treatment-plans/:id", async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const success = await storage.deleteEmergencyTreatmentPlan(planId);
      
      if (!success) {
        return res.status(404).json({ message: "Emergency treatment plan not found" });
      }
      
      res.json({ message: "Emergency treatment plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting emergency treatment plan:", error);
      res.status(500).json({ message: "Failed to delete emergency treatment plan" });
    }
  });

  // Geofencing API routes
  app.get("/api/geofences", async (req, res) => {
    try {
      const geofences = await storage.getGeofencesByUser(1);
      res.json(geofences);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({ message: "Failed to fetch geofences" });
    }
  });

  app.get("/api/geofences/active", async (req, res) => {
    try {
      const geofences = await storage.getActiveGeofencesByUser(1);
      res.json(geofences);
    } catch (error) {
      console.error("Error fetching active geofences:", error);
      res.status(500).json({ message: "Failed to fetch active geofences" });
    }
  });

  app.post("/api/geofences", async (req, res) => {
    try {
      const geofenceData = { ...req.body, userId: 1 };
      const geofence = await storage.createGeofence(geofenceData);
      res.json(geofence);
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence" });
    }
  });

  app.put("/api/geofences/:id", async (req, res) => {
    try {
      const geofenceId = parseInt(req.params.id);
      const updates = req.body;
      const geofence = await storage.updateGeofence(geofenceId, updates);
      
      if (!geofence) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      res.json(geofence);
    } catch (error) {
      console.error("Error updating geofence:", error);
      res.status(500).json({ message: "Failed to update geofence" });
    }
  });

  app.delete("/api/geofences/:id", async (req, res) => {
    try {
      const geofenceId = parseInt(req.params.id);
      const success = await storage.deleteGeofence(geofenceId);
      
      if (!success) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      res.json({ message: "Geofence deleted successfully" });
    } catch (error) {
      console.error("Error deleting geofence:", error);
      res.status(500).json({ message: "Failed to delete geofence" });
    }
  });

  // Note: The sleep tracking routes were added above with proper session auth

  app.get("/api/geofence-events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getGeofenceEventsByUser(1, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofence events:", error);
      res.status(500).json({ message: "Failed to fetch geofence events" });
    }
  });

  app.get("/api/geofences/:id/events", async (req, res) => {
    try {
      const geofenceId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 50;
      const events = await storage.getGeofenceEventsByGeofence(geofenceId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofence events:", error);
      res.status(500).json({ message: "Failed to fetch geofence events" });
    }
  });

  app.post("/api/geofence-events", async (req, res) => {
    try {
      const eventData = { ...req.body, userId: 1 };
      const event = await storage.createGeofenceEvent(eventData);
      
      // Here you could add logic to send notifications to caregivers
      // based on the geofence settings and caregiver preferences
      
      res.json(event);
    } catch (error) {
      console.error("Error creating geofence event:", error);
      res.status(500).json({ message: "Failed to create geofence event" });
    }
  });

  app.put("/api/geofence-events/:id/notify", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const success = await storage.markGeofenceEventNotified(eventId);
      
      if (!success) {
        return res.status(404).json({ message: "Geofence event not found" });
      }
      
      res.json({ message: "Geofence event marked as notified" });
    } catch (error) {
      console.error("Error marking geofence event as notified:", error);
      res.status(500).json({ message: "Failed to mark geofence event as notified" });
    }
  });

  // User Preferences Routes
  app.get("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const preferences = await storage.getUserPreferences(userId);
      
      // Return default preferences if none exist
      if (!preferences) {
        const defaultPreferences = {
          userId,
          notificationSettings: {},
          reminderTiming: {},
          themeSettings: {
            quickActions: ["mood-tracking", "daily-tasks", "financial", "caregiver"]
          },
          accessibilitySettings: {},
          behaviorPatterns: {}
        };
        res.json(defaultPreferences);
      } else {
        res.json(preferences);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ message: "Failed to fetch user preferences" });
    }
  });

  app.post("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1; // TODO: Get from auth
      const preferencesData = req.body;
      const preferences = await storage.upsertUserPreferences(userId, preferencesData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ message: "Failed to update user preferences" });
    }
  });

  // Wearable Devices Demo Routes (Simple static data for demo)
  app.get("/api/wearable-devices", async (req, res) => {
    try {
      const demoDevices = [
        {
          id: 1,
          name: "Apple Watch Series 9",
          type: "smartwatch",
          brand: "Apple",
          model: "Series 9",
          isConnected: true,
          batteryLevel: 87,
          lastSync: new Date().toISOString(),
          features: ["heart_rate", "steps", "sleep", "workouts", "blood_oxygen"]
        },
        {
          id: 2,
          name: "Fitbit Charge 5",
          type: "fitness_tracker",
          brand: "Fitbit",
          model: "Charge 5",
          isConnected: true,
          batteryLevel: 65,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          features: ["heart_rate", "steps", "sleep", "stress"]
        },
        {
          id: 3,
          name: "Galaxy Watch6 Classic",
          type: "smartwatch",
          brand: "Samsung",
          model: "Watch6 Classic",
          isConnected: true,
          batteryLevel: 72,
          lastSync: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          features: ["heart_rate", "steps", "sleep", "workouts", "blood_oxygen", "body_composition", "ecg"]
        }
      ];
      res.json(demoDevices);
    } catch (error) {
      console.error("Error fetching wearable devices:", error);
      res.status(500).json({ message: "Failed to fetch wearable devices" });
    }
  });

  app.get("/api/health-metrics", async (req, res) => {
    try {
      const demoMetrics = [
        {
          id: 1,
          metricType: "heart_rate",
          value: 72,
          unit: "bpm",
          recordedAt: new Date().toISOString(),
          context: "resting",
          deviceId: 1 // Apple Watch
        },
        {
          id: 2,
          metricType: "steps",
          value: 7543,
          unit: "steps",
          recordedAt: new Date().toISOString(),
          context: "daily_total",
          deviceId: 1 // Apple Watch
        },
        {
          id: 3,
          metricType: "blood_oxygen",
          value: 98,
          unit: "%",
          recordedAt: new Date().toISOString(),
          context: "resting",
          deviceId: 1 // Apple Watch
        },
        {
          id: 4,
          metricType: "heart_rate",
          value: 68,
          unit: "bpm",
          recordedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          context: "resting",
          deviceId: 3 // Galaxy Watch
        },
        {
          id: 5,
          metricType: "steps",
          value: 8124,
          unit: "steps",
          recordedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          context: "daily_total",
          deviceId: 3 // Galaxy Watch
        },
        {
          id: 6,
          metricType: "blood_oxygen",
          value: 97,
          unit: "%",
          recordedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          context: "resting",
          deviceId: 3 // Galaxy Watch
        }
      ];
      res.json(demoMetrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });

  app.get("/api/activity-sessions", async (req, res) => {
    try {
      const demoActivities = [
        {
          id: 1,
          activityType: "walking",
          duration: 45,
          caloriesBurned: 185,
          steps: 3200,
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          deviceId: 1 // Apple Watch
        },
        {
          id: 2,
          activityType: "cycling",
          duration: 30,
          caloriesBurned: 240,
          steps: 0,
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
          deviceId: 2 // Fitbit
        },
        {
          id: 3,
          activityType: "strength_training",
          duration: 25,
          caloriesBurned: 120,
          steps: 150,
          startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
          deviceId: 1 // Apple Watch
        },
        {
          id: 4,
          activityType: "running",
          duration: 35,
          caloriesBurned: 320,
          steps: 4200,
          startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          deviceId: 3 // Galaxy Watch
        },
        {
          id: 5,
          activityType: "yoga",
          duration: 20,
          caloriesBurned: 95,
          steps: 50,
          startedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          deviceId: 3 // Galaxy Watch
        }
      ];
      res.json(demoActivities);
    } catch (error) {
      console.error("Error fetching activity sessions:", error);
      res.status(500).json({ message: "Failed to fetch activity sessions" });
    }
  });

  app.get("/api/sleep-sessions", async (req, res) => {
    try {
      const demoSleep = [
        {
          id: 1,
          sleepDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // last night
          totalSleepDuration: 450, // 7.5 hours in minutes
          sleepScore: 85,
          quality: "good"
        },
        {
          id: 2,
          sleepDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 nights ago
          totalSleepDuration: 420, // 7 hours
          sleepScore: 78,
          quality: "fair"
        },
        {
          id: 3,
          sleepDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 nights ago
          totalSleepDuration: 480, // 8 hours
          sleepScore: 92,
          quality: "excellent"
        }
      ];
      res.json(demoSleep);
    } catch (error) {
      console.error("Error fetching sleep sessions:", error);
      res.status(500).json({ message: "Failed to fetch sleep sessions" });
    }
  });

  app.post("/api/wearable-devices/:id/sync", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      // Simulate sync operation
      setTimeout(() => {
        res.json({ 
          message: "Device synced successfully", 
          deviceId,
          lastSync: new Date().toISOString()
        });
      }, 1000);
    } catch (error) {
      console.error("Error syncing device:", error);
      res.status(500).json({ message: "Failed to sync device" });
    }
  });

  // Subscription Management Routes
  app.get("/api/subscription", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const now = new Date();
      
      // Admin accounts get full access without payment requirements
      const isAdmin = user.accountType === 'admin' || user.username === 'admin' || user.name?.toLowerCase().includes('admin');
      
      if (isAdmin) {
        const adminSubscription = {
          id: user.id,
          planType: "admin",
          status: "active",
          billingCycle: "lifetime",
          currentPeriodStart: user.createdAt,
          currentPeriodEnd: null,
          trialDaysLeft: null,
          usageStats: {
            tasks: { count: 0, limit: null },
            caregivers: { count: 0, limit: null },
            dataExports: { count: 0, limit: null }
          },
          features: {
            wearableDevices: true,
            mealPlanning: true,
            medicationManagement: true,
            locationSafety: true,
            advancedAnalytics: true,
            prioritySupport: true
          }
        };
        return res.json(adminSubscription);
      }
      
      // Calculate trial days left for regular users
      const trialEndDate = new Date(user.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialDaysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      
      // Check subscription status
      const isActiveSubscription = user.subscriptionStatus === 'active' && 
                                 user.subscriptionExpiresAt && 
                                 new Date(user.subscriptionExpiresAt) > now;
      
      const subscription = {
        id: user.id,
        planType: user.subscriptionTier || "free",
        status: isActiveSubscription ? "active" : (trialDaysLeft > 0 ? "trialing" : "expired"),
        billingCycle: "monthly",
        currentPeriodStart: user.createdAt,
        currentPeriodEnd: user.subscriptionExpiresAt || trialEndDate.toISOString(),
        trialDaysLeft: trialDaysLeft > 0 ? trialDaysLeft : null,
        usageStats: {
          tasks: { count: 0, limit: user.subscriptionTier === 'family' ? null : (user.subscriptionTier === 'premium' ? 1000 : 50) },
          caregivers: { count: 0, limit: user.subscriptionTier === 'family' ? null : (user.subscriptionTier === 'premium' ? 5 : 1) },
          dataExports: { count: 0, limit: user.subscriptionTier === 'free' ? 0 : null }
        },
        features: {
          wearableDevices: user.subscriptionTier !== 'free',
          mealPlanning: user.subscriptionTier !== 'free',
          medicationManagement: user.subscriptionTier !== 'free',
          locationSafety: user.subscriptionTier === 'family',
          advancedAnalytics: user.subscriptionTier === 'family',
          prioritySupport: user.subscriptionTier !== 'free'
        }
      };
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscription/upgrade", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { planType, billingCycle } = req.body;
      const user = req.session.user;
      
      // Calculate new trial end date (7 days from now)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      
      // Update user subscription information in session (in production this would update database)
      req.session.user = {
        ...user,
        subscriptionTier: planType,
        subscriptionStatus: 'trialing',
        subscriptionExpiresAt: trialEndDate.toISOString()
      };

      const upgradedSubscription = {
        id: user.id,
        planType,
        status: "trialing",
        billingCycle,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: trialEndDate.toISOString(),
        trialDaysLeft: 7,
        usageStats: {
          tasks: { count: 0, limit: planType === "family" ? null : 1000 },
          caregivers: { count: 0, limit: planType === "family" ? null : 10 },
          dataExports: { count: 0, limit: null }
        },
        features: {
          wearableDevices: true,
          mealPlanning: true,
          medicationManagement: true,
          locationSafety: planType === "family",
          advancedAnalytics: planType === "family",
          prioritySupport: true,
          familyAccounts: planType === "family" ? 5 : 1
        }
      };

      res.json(upgradedSubscription);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  // Real Stripe Payment Routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { planType, billingCycle } = req.body;
      
      // Check if Stripe is available
      const currentStripe = getStripeInstance();
      if (!currentStripe) {
        console.log("Stripe not configured - using demo mode");
        return res.status(200).json({ 
          clientSecret: "pi_demo_" + Date.now() + "_secret_demo",
          demoMode: true,
          message: "Demo payment mode - Stripe configuration pending"
        });
      }
      
      // Define pricing based on plan
      const pricing = {
        basic: { monthly: 499, annual: 4900 }, // $4.99, $49
        premium: { monthly: 1299, annual: 12900 }, // $12.99, $129
        family: { monthly: 2499, annual: 24900 } // $24.99, $249
      };
      
      const amount = pricing[planType as keyof typeof pricing]?.[billingCycle as keyof typeof pricing.basic] || 1299;
      
      const paymentIntent = await currentStripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          planType,
          billingCycle,
          userId: "1" // Replace with actual user ID
        }
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        demoMode: false,
        message: "Live payment processing enabled"
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      
      // Handle specific Stripe authentication errors
      if (error.type === 'StripeAuthenticationError') {
        console.log("Stripe authentication failed - falling back to demo mode");
        
        // Fallback to demo mode while Stripe account is being activated
        return res.status(200).json({ 
          clientSecret: "pi_demo_" + Date.now() + "_secret_demo",
          demoMode: true,
          message: "Demo payment mode - your Stripe account is being activated"
        });
      }
      
      res.status(500).json({ 
        message: "Failed to create payment intent",
        error: error.message || "Unknown error"
      });
    }
  });

  // Upgrade user subscription after successful payment
  app.post("/api/upgrade-subscription", async (req, res) => {
    try {
      const { planType, billingCycle, paymentIntentId } = req.body;
      const user = storage.getCurrentUser();
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify payment intent was successful (in production, verify with Stripe)
      const currentStripe = getStripeInstance();
      if (currentStripe && paymentIntentId) {
        const paymentIntent = await currentStripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment not confirmed" });
        }
      }
      
      // Upgrade user subscription
      const subscriptionTier = planType === 'basic' ? 'basic' : 
                              planType === 'premium' ? 'premium' : 'family';
      
      const expiresAt = new Date();
      if (billingCycle === 'annual') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      
      // Update user subscription in storage
      await storage.updateUserSubscription(user.id, {
        subscriptionTier,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt
      });
      
      res.json({ 
        message: "Subscription upgraded successfully",
        plan: planType,
        billing: billingCycle,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error: any) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ 
        message: "Failed to upgrade subscription",
        error: error.message || "Unknown error"
      });
    }
  });

  // Subscription status check middleware
  function requireActiveSubscription(req: any, res: any, next: any) {
    if (!req.session?.userId || !req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.session.user;
    const now = new Date();
    
    // Check if user has active subscription or is still in trial
    if (user.subscriptionStatus === 'active' && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now) {
      return next(); // Active paid subscription
    }
    
    // Check if user is in free trial (7 days from account creation)
    const trialEndDate = new Date(user.createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    if (now <= trialEndDate && user.subscriptionTier === 'free') {
      return next(); // Still in free trial
    }
    
    // Trial expired and no active subscription
    return res.status(402).json({ 
      message: "Subscription required",
      trialExpired: true,
      requiresPayment: true
    });
  }

  // Create Stripe subscription with proper setup
  app.post("/api/create-subscription", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const { planType, billingCycle } = req.body;
      
      const currentStripe = getStripeInstance();
      if (!currentStripe) {
        return res.status(500).json({ message: "Payment processing unavailable" });
      }
      
      // Create or retrieve Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await currentStripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await currentStripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id.toString() }
        });
        
        // Update user with Stripe customer ID
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }
      
      // Define pricing
      const pricing = {
        basic: { monthly: 499, annual: 4900 }, // $4.99, $49
        premium: { monthly: 1299, annual: 12900 }, // $12.99, $129
        family: { monthly: 2499, annual: 24900 } // $24.99, $249
      };
      
      const amount = pricing[planType as keyof typeof pricing]?.[billingCycle as keyof typeof pricing.basic] || 1299;
      
      // First create a product
      const product = await currentStripe.products.create({
        name: `Adaptalyfe ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        description: `${billingCycle} subscription to Adaptalyfe ${planType} features`
      });

      // Create a price first
      const price = await currentStripe.prices.create({
        currency: 'usd',
        product: product.id,
        unit_amount: amount,
        recurring: {
          interval: billingCycle === 'annual' ? 'year' : 'month'
        }
      });

      // Create subscription with immediate payment intent
      const subscription = await currentStripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          planType,
          billingCycle
        }
      });

      // Get payment intent from subscription
      let paymentIntent = null;
      const invoice = subscription.latest_invoice as any;
      
      if (invoice && invoice.payment_intent) {
        paymentIntent = invoice.payment_intent;
      } else if (invoice && !invoice.payment_intent) {
        // Create a standalone payment intent for manual payment
        console.log('Creating standalone payment intent for subscription payment');
        paymentIntent = await currentStripe.paymentIntents.create({
          amount: invoice.amount_due,
          currency: 'usd',
          customer: customer.id,
          metadata: {
            userId: user.id.toString(),
            subscriptionId: subscription.id,
            invoiceId: invoice.id
          },
          automatic_payment_methods: {
            enabled: true,
          }
        });
      }
      
      // Update user subscription info
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: planType,
        subscriptionStatus: 'pending'
      });
      
      // Get client secret from payment intent
      let clientSecret = null;
      if (paymentIntent) {
        clientSecret = paymentIntent.client_secret;
      }
      
      console.log('Final subscription setup:', {
        subscriptionId: subscription.id,
        hasClientSecret: !!clientSecret,
        subscriptionStatus: subscription.status,
        paymentIntentId: paymentIntent?.id
      });
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
        status: subscription.status,
        requiresPayment: !!clientSecret
      });
      
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Failed to create subscription",
        error: error.message 
      });
    }
  });

  // Confirm subscription payment
  app.post("/api/confirm-subscription", async (req: any, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const { subscriptionId } = req.body;
      
      const currentStripe = getStripeInstance();
      if (!currentStripe) {
        return res.status(500).json({ message: "Payment processing unavailable" });
      }
      
      // Retrieve subscription status
      const subscription = await currentStripe.subscriptions.retrieve(subscriptionId);
      
      if (subscription.status === 'active') {
        // Update user with active subscription
        const expiresAt = new Date();
        const metadata = subscription.metadata;
        
        if (metadata.billingCycle === 'annual') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        
        await storage.updateUser(user.id, {
          subscriptionTier: metadata.planType || 'premium',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt
        });
        
        res.json({ 
          success: true, 
          message: "Subscription activated successfully",
          plan: metadata.planType,
          expiresAt: expiresAt.toISOString()
        });
      } else {
        res.json({ 
          success: false, 
          status: subscription.status,
          message: "Payment not completed"
        });
      }
      
    } catch (error: any) {
      console.error("Error confirming subscription:", error);
      res.status(500).json({ 
        message: "Failed to confirm subscription",
        error: error.message 
      });
    }
  });

  app.get("/api/subscription/payment-history", async (req, res) => {
    try {
      // Get actual payment history from Stripe
      const stripeInstance = getStripeInstance();
      if (!stripeInstance) {
        return res.json([]);
      }
      const payments = await stripeInstance.paymentIntents.list({
        limit: 10,
        metadata: { userId: "1" } // Replace with actual user ID
      });
      
      const formattedPayments = payments.data.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description || "Adaptalyfe Subscription",
        paidAt: new Date(payment.created * 1000).toISOString(),
        paymentMethod: payment.payment_method ? "•••• " + payment.payment_method.slice(-4) : "N/A"
      }));
      
      res.json(formattedPayments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Caregiver dashboard routes
  app.get("/api/caregiver-users", async (req, res) => {
    try {
      // In a real app, this would get users assigned to the authenticated caregiver
      // For demo purposes, return the demo user
      // Demo caregiver users - replace with actual data from storage
      const users = [{ id: 1, username: "demo_user", name: "Demo User" }];
      const userProgress = users.map((user: any) => ({
        userId: user.id,
        userName: user.name || user.username,
        streakDays: user.streakDays || 12,
        lastActive: new Date().toISOString(),
        completionRate: 85,
        moodTrend: 'stable' as const,
        alertsCount: 1
      }));
      res.json(userProgress);
    } catch (error) {
      console.error("Error fetching caregiver users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/user-summary/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const tasks = await storage.getDailyTasks(userId);
      const moods = await storage.getMoodEntries(userId);
      const appointments = await storage.getAppointments(userId);
      const medications = await storage.getMedications(userId);

      const summary = {
        user,
        taskCompletion: {
          total: tasks.length,
          completed: tasks.filter(t => t.isCompleted).length,
          rate: tasks.length > 0 ? Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100) : 0
        },
        moodData: {
          recent: moods.slice(-7),
          average: moods.length > 0 ? (moods.reduce((sum, m) => sum + m.mood, 0) / moods.length).toFixed(1) : 0
        },
        upcomingAppointments: appointments.filter(a => new Date(a.appointmentDate) > new Date()).slice(0, 3),
        medications: medications.filter(m => !m.isDiscontinued)
      };

      res.json(summary);
    } catch (error) {
      console.error("Error fetching user summary:", error);
      res.status(500).json({ message: "Failed to fetch user summary" });
    }
  });

  // Banking demo routes (simplified for now)
  app.post('/api/bank-accounts/connect-plaid', (req, res) => {
    res.json({ 
      message: 'Demo bank accounts connected successfully',
      demo_mode: true,
      linkToken: 'demo-link-token-12345'
    });
  });

  app.get('/api/bank-accounts', (req, res) => {
    res.json([
      {
        id: 1,
        accountName: 'Demo Checking Account',
        accountType: 'checking',
        bankName: 'Demo Bank',
        accountNumber: '****1234',
        routingNumber: '****5678',
        balance: 2500.00,
        isActive: true,
        lastSynced: new Date().toISOString()
      },
      {
        id: 2,
        accountName: 'Demo Savings Account',
        accountType: 'savings',
        bankName: 'Demo Bank',
        accountNumber: '****9876',
        routingNumber: '****5678',
        balance: 8750.00,
        isActive: true,
        lastSynced: new Date().toISOString()
      }
    ]);
  });

  app.get('/api/bill-payments', (req, res) => {
    res.json([
      {
        id: 1,
        billName: 'Electric Bill',
        payeeWebsite: 'demo-electric.com',
        accountNumber: '****1234',
        isAutoPay: true,
        paymentAmount: 85.00,
        paymentDate: 15,
        nextPayment: '2025-08-15',
        status: 'active'
      }
    ]);
  });

  app.post('/api/bill-payments', (req, res) => {
    try {
      const { billName, payeeWebsite, accountNumber, paymentAmount, paymentDate, isAutoPay } = req.body;
      
      // Create a new bill payment record
      const newPayment = {
        id: Date.now(), // Simple ID generation for demo
        billName,
        payeeWebsite: payeeWebsite || 'demo-payee.com',
        accountNumber: accountNumber || '****1234',
        isAutoPay,
        paymentAmount,
        paymentDate,
        isActive: true,
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'active'
      };
      
      res.json(newPayment);
    } catch (error) {
      console.error('Error creating bill payment:', error);
      res.status(400).json({ message: 'Failed to create bill payment' });
    }
  });

  // Payment limits endpoint
  app.get('/api/payment-limits', (req, res) => {
    res.json([
      {
        id: 1,
        limitType: 'daily',
        amount: 500,
        isActive: true
      },
      {
        id: 2,
        limitType: 'monthly',
        amount: 2000,
        isActive: true
      },
      {
        id: 3,
        limitType: 'per_transaction',
        amount: 1000,
        isActive: true
      }
    ]);
  });

  // Bank account sync endpoint
  app.post('/api/bank-accounts/:id/sync', (req, res) => {
    const accountId = parseInt(req.params.id);
    res.json({ 
      message: 'Account balance synced successfully',
      accountId,
      lastSynced: new Date().toISOString()
    });
  });

  // Bill payment toggle endpoint
  app.patch('/api/bill-payments/:id/toggle', (req, res) => {
    const paymentId = parseInt(req.params.id);
    const { isActive } = req.body;
    res.json({ 
      message: 'Auto pay setting updated',
      paymentId,
      isActive
    });
  });

  // Serve screenshot capture tool
  app.get("/screenshot-capture", (_req, res) => {
    res.sendFile(path.resolve("screenshot-capture.html"));
  });

  // Alternative route for screenshots
  app.get("/screenshots", (_req, res) => {
    res.sendFile(path.resolve("public/screenshot-capture.html"));
  });

  // Simple screenshot generator
  app.get("/screenshots-simple", (_req, res) => {
    res.sendFile(path.resolve("screenshot-simple.html"));
  });

  // Rewards Program routes
  app.get("/api/rewards", async (req: any, res) => {
    try {
      console.log("=== REWARDS: GET /api/rewards ===");
      console.log("Session data:", req.session);
      
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user from session
      let user = req.session.user;
      
      // If still no user, try to fetch by ID
      if (!user && req.session.userId) {
        user = await storage.getUser(req.session.userId);
        req.session.user = user;
      }

      console.log("Final user:", user?.id, user?.username);
      
      if (!user) {
        console.log("No user found after all attempts, returning 401");
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const rewards = await storage.getRewardsByUser(user.id);
      console.log("Found rewards count:", rewards.length);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.get("/api/rewards/caregiver", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const rewards = await storage.getRewardsByCaregiver(user.id);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching caregiver rewards:", error);
      res.status(500).json({ message: "Failed to fetch caregiver rewards" });
    }
  });

  app.post("/api/rewards", async (req: any, res) => {
    try {
      console.log("=== REWARDS: POST /api/rewards ===");
      console.log("Session data:", req.session);
      console.log("Request body:", req.body);

      if (!req.session.userId || !req.session.user) {
        console.log("No authenticated user found, returning 401");
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get user from session
      let user = req.session.user;
      
      // If still no user, try to fetch by ID
      if (!user && req.session.userId) {
        user = await storage.getUser(req.session.userId);
        req.session.user = user;
      }

      console.log("Final user:", user?.id, user?.username);
      
      if (!user) {
        console.log("No user found after all attempts, returning 401");
        return res.status(401).json({ message: "Not authenticated" });
      }

      const rewardData = {
        ...req.body,
        caregiverId: user.id // Caregiver creating the reward
      };

      console.log("Creating reward with data:", rewardData);
      const reward = await storage.createReward(rewardData);
      console.log("Created reward:", reward);
      res.json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward", error: error.message });
    }
  });

  app.get("/api/points/balance", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user || storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const balance = await storage.getUserPointsBalance(user.id);
      res.json(balance);
    } catch (error) {
      console.error("Error fetching points balance:", error);
      res.status(500).json({ message: "Failed to fetch points balance" });
    }
  });

  app.get("/api/points/transactions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user || storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const transactions = await storage.getPointsTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points transactions:", error);
      res.status(500).json({ message: "Failed to fetch points transactions" });
    }
  });

  app.post("/api/points/award", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user || storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { userId, points, source, description } = req.body;
      const balance = await storage.updateUserPoints(userId, points, source, description, user.id);
      res.json(balance);
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(500).json({ message: "Failed to award points" });
    }
  });

  app.post("/api/rewards/redeem", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user || storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const redemptionData = {
        ...req.body,
        userId: user.id
      };

      const redemption = await storage.createRewardRedemption(redemptionData);
      
      // Deduct points from user's balance
      await storage.updateUserPoints(
        user.id, 
        -redemptionData.pointsSpent, 
        "reward_redemption", 
        `Redeemed reward: ${redemptionData.rewardId}`, 
        user.id
      );

      res.json(redemption);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });

  app.get("/api/rewards/redemptions", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.session.user || storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const redemptions = await storage.getRewardRedemptions(user.id);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching reward redemptions:", error);
      res.status(500).json({ message: "Failed to fetch reward redemptions" });
    }
  });

  // Personal Documents routes
  app.get("/api/personal-documents", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const documents = await storage.getPersonalDocuments(user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching personal documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/personal-documents/category/:category", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const { category } = req.params;
      const documents = await storage.getPersonalDocumentsByCategory(user.id, category);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents by category:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/personal-documents", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = req.session.user;
      const documentData = { ...req.body, userId: user.id };
      const document = await storage.createPersonalDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating personal document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/personal-documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.updatePersonalDocument(documentId, req.body);
      res.json(document);
    } catch (error) {
      console.error("Error updating personal document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/personal-documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deletePersonalDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting personal document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Object storage routes for personal document images
  app.post("/api/personal-documents/upload", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/personal-documents/set-image", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const userId = req.session.user.id;

      try {
        const { ObjectStorageService } = await import('./objectStorage');
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          imageURL,
          {
            owner: userId.toString(),
            visibility: "private", // Personal documents should be private
          }
        );

        res.status(200).json({
          objectPath: objectPath,
        });
      } catch (error) {
        console.error("Error setting document image:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    } catch (error) {
      console.error("Error in set-image endpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route to serve uploaded personal document images
  app.get("/objects/:objectPath(*)", async (req: any, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { ObjectStorageService, ObjectNotFoundError } = await import('./objectStorage');
      const { ObjectPermission } = await import('./objectAcl');
      const objectStorageService = new ObjectStorageService();
      
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(req.path);
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: req.session.user.id.toString(),
          requestedPermission: ObjectPermission.READ,
        });
        
        if (!canAccess) {
          return res.sendStatus(401);
        }
        
        objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error checking object access:", error);
        if (error instanceof ObjectNotFoundError) {
          return res.sendStatus(404);
        }
        return res.sendStatus(500);
      }
    } catch (error) {
      console.error("Error in objects route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mount banking routes
  app.use("/api/banking", bankingRoutes);
  
  // Register analytics routes
  registerAnalyticsRoutes(app);
  
  // Register bill payment routes
  registerBillPaymentRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
