import { pgTable, text, serial, integer, boolean, timestamp, real, varchar, jsonb, decimal, date, time, numeric, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import banking schemas
export * from './banking-schema';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").unique(),
  accountType: text("account_type").notNull().default("user"), // "user" or "caregiver"
  subscriptionTier: text("subscription_tier").notNull().default("free"), // "free", "premium", "family"
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // "active", "inactive", "cancelled", "past_due"
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  streakDays: integer("streak_days").default(0),
  createdBy: integer("created_by"), // Caregiver who created this user account
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Caregiver invitations for setting up care relationships
export const caregiverInvitations = pgTable("caregiver_invitations", {
  id: serial("id").primaryKey(),
  caregiverId: integer("caregiver_id").notNull(),
  userEmail: text("user_email"),
  userName: text("user_name").notNull(),
  userAge: integer("user_age"),
  invitationCode: text("invitation_code").notNull().unique(),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "expired", "cancelled"
  relationship: text("relationship").notNull(), // "parent", "guardian", "therapist", "case_worker", etc.
  permissionsGranted: jsonb("permissions_granted"), // Array of permission types
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: integer("accepted_by"), // User ID who accepted
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyTasks = pgTable("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "morning", "cooking", "organization", etc.
  frequency: text("frequency").notNull().default("daily"), // "daily", "weekly", "monthly"
  estimatedMinutes: integer("estimated_minutes").notNull(),
  pointValue: integer("point_value").default(0), // Points awarded when task is completed
  scheduledTime: time("scheduled_time"), // Specific time when task should be completed (e.g., 10:00 AM)
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"), // For weekly/monthly tasks
  lastCompleted: timestamp("last_completed"), // Track when task was last done
  lastReminderSent: timestamp("last_reminder_sent"), // When reminder was last sent
  lastOverdueReminder: timestamp("last_overdue_reminder"), // When overdue reminder was last sent
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  dueDate: integer("due_date").notNull(), // day of month (1-31)
  isRecurring: boolean("is_recurring").default(true),
  isPaid: boolean("is_paid").default(false),
  category: text("category").notNull(), // "utilities", "phone", "rent", etc.
  payeeWebsite: text("payee_website"), // Payment website URL
  payeeAccountNumber: text("payee_account_number"), // User's account number with the payee
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Optional - can be anonymous
  rating: integer("rating").notNull(), // 1-5 stars
  category: text("category").notNull(), // "usability", "features", "bugs", "accessibility", etc.
  message: text("message").notNull(),
  page: text("page"), // Which page the feedback was given from
  userAgent: text("user_agent"), // Browser/device info
  isResolved: boolean("is_resolved").default(false),
  adminNotes: text("admin_notes"), // Internal notes for tracking resolution
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  accountName: text("account_name").notNull(), // Required field from existing table
  bankName: text("bank_name").notNull(),
  accountType: text("account_type").notNull(), // "checking", "savings", "credit"
  accountNickname: text("account_nickname"), // User's nickname for the account
  bankWebsite: text("bank_website"), // Bank's login website URL
  lastFour: text("last_four"), // Last 4 digits of account (optional, for reference)
  balance: real("balance").default(0.00), // Existing balance field
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(), // "Vacation to Hawaii", "Emergency Fund", "New Car"
  description: text("description"),
  targetAmount: real("target_amount").notNull(), // How much they want to save
  currentAmount: real("current_amount").default(0.00), // How much they've saved so far
  targetDate: timestamp("target_date"), // When they want to reach their goal
  category: text("category").notNull(), // "vacation", "emergency", "purchase", "education", "home", "other"
  priority: text("priority").notNull().default("medium"), // "high", "medium", "low"
  isActive: boolean("is_active").default(true),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const savingsTransactions = pgTable("savings_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  savingsGoalId: integer("savings_goal_id").notNull(),
  amount: real("amount").notNull(), // Positive for deposits, negative for withdrawals
  transactionType: text("transaction_type").notNull(), // "deposit", "withdrawal", "goal_transfer"
  description: text("description"), // Optional note about the transaction
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: integer("mood").notNull(), // 1-5 scale
  notes: text("notes"),
  entryDate: timestamp("entry_date").defaultNow(),
});



export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "streak", "tasks", "financial", etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
});

// User-caregiver connections table
export const userCaregiverConnections = pgTable("user_caregiver_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The person receiving care
  caregiverId: integer("caregiver_id").notNull(), // The caregiver account
  relationship: text("relationship").notNull(), // "parent", "sibling", "therapist", etc.
  permissions: text("permissions").notNull().default("view"), // "view", "edit", "admin"
  isEmergencyContact: boolean("is_emergency_contact").default(false),
  connectionStatus: text("connection_status").notNull().default("active"), // "pending", "active", "inactive"
  isPrimaryCaregiver: boolean("is_primary_caregiver").default(false), // Has full administrative control
  canModifySettings: boolean("can_modify_settings").default(true),
  canAccessLocation: boolean("can_access_location").default(true),
  canReceiveAlerts: boolean("can_receive_alerts").default(true),
  connectedAt: timestamp("connected_at").defaultNow(),
  notes: text("notes"),
});

// Care relationships between caregivers and users
export const careRelationships = pgTable("care_relationships", {
  id: serial("id").primaryKey(),
  caregiverId: integer("caregiver_id").notNull(),
  userId: integer("user_id").notNull(),
  relationship: text("relationship").notNull(), // "parent", "guardian", "therapist", etc.
  isPrimary: boolean("is_primary").default(false), // Primary caregiver has full access
  isActive: boolean("is_active").default(true),
  establishedAt: timestamp("established_at").defaultNow(),
  establishedVia: text("established_via").default("invitation"), // "invitation", "manual", "import"
});

// Caregiver permissions for granular control
export const caregiverPermissions = pgTable("caregiver_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // The user being cared for
  caregiverId: integer("caregiver_id").notNull(),
  permissionType: text("permission_type").notNull(), // "location_tracking", "medication_management", "emergency_contacts", etc.
  isGranted: boolean("is_granted").default(true),
  isLocked: boolean("is_locked").default(false), // Can't be changed by user
  grantedBy: integer("granted_by"), // Which caregiver granted this
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Settings that caregivers can lock to prevent user modification
export const lockedUserSettings = pgTable("locked_user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  settingKey: text("setting_key").notNull(), // "location_tracking", "geofencing", "emergency_contacts", etc.
  settingValue: text("setting_value").notNull(),
  isLocked: boolean("is_locked").default(true),
  lockedBy: integer("locked_by").notNull(), // Caregiver who locked it
  lockReason: text("lock_reason"), // Optional reason for the lock
  canUserView: boolean("can_user_view").default(true), // Whether user can see the setting
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invitation codes for linking accounts
export const invitationCodes = pgTable("invitation_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  createdByUserId: integer("created_by_user_id").notNull(),
  targetUserType: text("target_user_type").notNull(), // "user" or "caregiver"
  relationship: text("relationship").notNull(),
  permissions: text("permissions").notNull().default("view"),
  isUsed: boolean("is_used").default(false),
  usedByUserId: integer("used_by_user_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Legacy caregiver table - keeping for backward compatibility
export const caregivers = pgTable("caregivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // "parent", "therapist", "support worker"
  email: text("email"),
  isActive: boolean("is_active").default(true),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  caregiverId: integer("caregiver_id").notNull(),
  content: text("content").notNull(),
  fromUser: boolean("from_user").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const budgetEntries = pgTable("budget_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // "income", "expense", "savings_allocation"
  description: text("description"),
  savingsGoalId: integer("savings_goal_id"), // Optional - if this entry is allocated to a specific savings goal
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"), // "weekly", "monthly", "yearly"
  entryDate: timestamp("entry_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(), // "Food", "Transportation", "Entertainment", "Savings"
  type: text("type").notNull(), // "expense", "income", "savings"
  budgetedAmount: real("budgeted_amount").default(0.00), // How much they plan to spend/save in this category
  color: text("color").default("#6B7280"), // For UI visualization
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: text("appointment_date").notNull(), // Store as string for easier form handling
  location: text("location"),
  provider: text("provider"), // doctor, dentist, therapist, etc.
  isCompleted: boolean("is_completed").default(false),
  reminderSet: boolean("reminder_set").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  mealName: text("meal_name").notNull(),
  plannedDate: text("planned_date").notNull(), // YYYY-MM-DD format
  isCompleted: boolean("is_completed").default(false),
  recipe: text("recipe"),
  cookingTime: integer("cooking_time"), // minutes
  createdAt: timestamp("created_at").defaultNow(),
});

export const groceryStores = pgTable("grocery_stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: varchar("name").notNull(),
  website: varchar("website"),
  onlineOrderingUrl: varchar("online_ordering_url"),
  address: text("address"),
  phoneNumber: varchar("phone_number"),
  isPreferred: boolean("is_preferred").default(false),
  deliveryAvailable: boolean("delivery_available").default(false),
  pickupAvailable: boolean("pickup_available").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});



export const shoppingLists = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  storeId: integer("store_id").references(() => groceryStores.id),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(), // produce, dairy, meat, pantry, etc.
  quantity: text("quantity"), // "2 lbs", "1 gallon", etc.
  isPurchased: boolean("is_purchased").default(false),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  addedDate: timestamp("added_date").defaultNow(),
  purchasedDate: timestamp("purchased_date"),
});

export const emergencyResources = pgTable("emergency_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  resourceType: varchar("resource_type").notNull(), // "crisis", "counselor", "hospital", "mental_health", "support_group"
  phoneNumber: varchar("phone_number"),
  address: text("address"),
  description: text("description"),
  isAvailable24_7: boolean("is_available_24_7").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// HIPAA Compliance: Audit logging table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// HIPAA Compliance: Data consent and privacy settings
export const userPrivacySettings = pgTable("user_privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  analyticsConsent: boolean("analytics_consent").default(false),
  marketingConsent: boolean("marketing_consent").default(false),
  caregiverDataSharing: boolean("caregiver_data_sharing").default(true),
  healthDataSharing: boolean("health_data_sharing").default(false),
  dataRetentionPeriod: integer("data_retention_period").default(365), // days
  consentDate: timestamp("consent_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// HIPAA Compliance: Data access requests and user rights
export const dataAccessRequests = pgTable("data_access_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  requestType: varchar("request_type", { length: 50 }).notNull(), // 'access', 'export', 'delete', 'correction'
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'processing', 'completed', 'denied'
  requestData: text("request_data"), // JSON string with request details
  responseData: text("response_data"), // JSON string with response
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  expiresAt: timestamp("expires_at"),
});

// Pharmacy Integration Tables
export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // walgreens, cvs, truepill, local, custom
  address: text("address"),
  phoneNumber: varchar("phone_number"),
  hours: text("hours"),
  website: varchar("website"), // Pharmacy website for online refills
  refillUrl: varchar("refill_url"), // Direct URL for online refill orders
  apiEndpoint: varchar("api_endpoint"),
  isActive: boolean("is_active").default(true),
  isCustom: boolean("is_custom").default(false), // True if added by user
  createdBy: integer("created_by"), // User ID who added this custom pharmacy
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPharmacies = pgTable("user_pharmacies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  isPrimary: boolean("is_primary").default(false),
  accountNumber: varchar("account_number"),
  membershipId: varchar("membership_id"), // Insurance or membership ID
  preferredPickupTime: varchar("preferred_pickup_time"), // e.g., "morning", "afternoon", "evening"
  hasInsurance: boolean("has_insurance").default(true),
  insuranceProvider: varchar("insurance_provider"),
  insuranceGroupNumber: varchar("insurance_group_number"),
  insuranceMemberId: varchar("insurance_member_id"),
  autoRefillEnabled: boolean("auto_refill_enabled").default(false),
  textNotifications: boolean("text_notifications").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prescriptionNumber: varchar("prescription_number"),
  medicationName: varchar("medication_name").notNull(),
  dosage: varchar("dosage"),
  quantity: integer("quantity"),
  refillsRemaining: integer("refills_remaining").default(0),
  prescribedBy: varchar("prescribed_by"),
  pharmacyId: integer("pharmacy_id").references(() => pharmacies.id),
  lastFilled: timestamp("last_filled"),
  nextRefillDate: timestamp("next_refill_date"),
  instructions: text("instructions"),
  // Pill appearance description fields
  pillColor: varchar("pill_color"),
  pillShape: varchar("pill_shape"),
  pillSize: varchar("pill_size"),
  pillMarkings: text("pill_markings"),
  pillDescription: text("pill_description"),
  isActive: boolean("is_active").default(true),
  reminderEnabled: boolean("reminder_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const refillOrders = pgTable("refill_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  orderNumber: varchar("order_number"),
  status: varchar("status").notNull().default("pending"), // pending, processing, ready, picked_up, delivered
  orderDate: timestamp("order_date").defaultNow(),
  readyDate: timestamp("ready_date"),
  pickupMethod: varchar("pickup_method").default("in_store"), // in_store, delivery, mail
  trackingNumber: varchar("tracking_number"),
  totalCost: decimal("total_cost"),
  insuranceCovered: decimal("insurance_covered"),
  copay: decimal("copay"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const allergies = pgTable("allergies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  allergen: varchar("allergen", { length: 255 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull(), // mild, moderate, severe, life-threatening
  reaction: text("reaction"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const medicalConditions = pgTable("medical_conditions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  condition: varchar("condition", { length: 255 }).notNull(),
  diagnosedDate: timestamp("diagnosed_date"),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, resolved
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adverseMedications = pgTable("adverse_medications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicationName: varchar("medication_name", { length: 255 }).notNull(),
  reaction: text("reaction").notNull(),
  severity: varchar("severity", { length: 50 }).notNull(), // mild, moderate, severe, life-threatening
  reactionDate: timestamp("reaction_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  relationship: varchar("relationship", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  isPrimary: boolean("is_primary").default(false),
  isEmergencyContact: boolean("is_emergency_contact").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const primaryCareProviders = pgTable("primary_care_providers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 100 }).notNull(),
  practiceName: varchar("practice_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const symptomEntries = pgTable("symptom_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  symptomName: varchar("symptom_name", { length: 255 }).notNull(),
  severity: integer("severity").notNull(), // 1-10 scale
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  triggers: text("triggers"),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});



export const personalResources = pgTable("personal_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  url: text("url").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // music, videos, websites, apps, etc.
  tags: text("tags"), // comma-separated tags for filtering
  isFavorite: boolean("is_favorite").default(false),
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
});



export const busSchedules = pgTable("bus_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  routeName: varchar("route_name", { length: 100 }).notNull(),
  routeNumber: varchar("route_number", { length: 20 }),
  stopName: varchar("stop_name", { length: 200 }).notNull(),
  stopAddress: text("stop_address"),
  direction: varchar("direction", { length: 50 }), // northbound, southbound, etc.
  departureTime: varchar("departure_time", { length: 10 }).notNull(), // HH:MM format
  daysOfWeek: text("days_of_week").notNull(), // comma-separated: monday,tuesday,etc
  isFrequent: boolean("is_frequent").default(false), // for frequent/favorite routes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emergencyTreatmentPlans = pgTable("emergency_treatment_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planName: varchar("plan_name", { length: 200 }).notNull(),
  conditionType: varchar("condition_type", { length: 100 }).notNull(), // seizure, anxiety, allergic reaction, etc.
  symptoms: text("symptoms").notNull(), // what to watch for
  immediateActions: text("immediate_actions").notNull(), // step-by-step response
  medications: text("medications"), // emergency medications to use
  emergencyContacts: text("emergency_contacts"), // specific contacts for this emergency
  hospitalPreference: varchar("hospital_preference", { length: 200 }),
  importantNotes: text("important_notes"), // allergies, medical info, etc.
  isActive: boolean("is_active").default(true),
  lastReviewed: timestamp("last_reviewed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer("radius").notNull(), // in meters
  isActive: boolean("is_active").default(true),
  notifyOnExit: boolean("notify_on_exit").default(true),
  notifyOnEnter: boolean("notify_on_enter").default(false),
  caregiverIds: integer("caregiver_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  geofenceId: integer("geofence_id").notNull().references(() => geofences.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'enter' or 'exit'
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  notificationSent: boolean("notification_sent").default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  streakDays: true,
  createdAt: true,
});



export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
  accountType: z.enum(["user", "caregiver"]).default("user"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertUserCaregiverConnectionSchema = createInsertSchema(userCaregiverConnections).omit({
  id: true,
  connectedAt: true,
});

export const insertInvitationCodeSchema = createInsertSchema(invitationCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  isUsed: true,
  usedByUserId: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  completedAt: true,
  lastCompleted: true,
  lastReminderSent: true,
  lastOverdueReminder: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  entryDate: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

export const insertCaregiverSchema = createInsertSchema(caregivers).omit({
  id: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});

export const insertBudgetEntrySchema = createInsertSchema(budgetEntries).omit({
  id: true,
  entryDate: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});



export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
}).extend({
  mealName: z.string().min(1, "Meal name is required"),
  mealType: z.string().min(1, "Meal type is required"),
  plannedDate: z.string().min(1, "Planned date is required"),
});

export const insertGroceryStoreSchema = createInsertSchema(groceryStores).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  addedDate: true,
  purchasedDate: true,
}).extend({
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
});

export const insertEmergencyResourceSchema = createInsertSchema(emergencyResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPrivacySettingsSchema = createInsertSchema(userPrivacySettings).omit({
  id: true,
  consentDate: true,
  lastUpdated: true,
});

export const insertDataAccessRequestSchema = createInsertSchema(dataAccessRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  expiresAt: true,
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPharmacySchema = createInsertSchema(userPharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRefillOrderSchema = createInsertSchema(refillOrders).omit({
  id: true,
  orderDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAllergySchema = createInsertSchema(allergies).omit({
  id: true,
  createdAt: true,
});

export const insertMedicalConditionSchema = createInsertSchema(medicalConditions).omit({
  id: true,
  createdAt: true,
});

export const insertAdverseMedicationSchema = createInsertSchema(adverseMedications).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true,
  createdAt: true,
});

export const insertPrimaryCareProviderSchema = createInsertSchema(primaryCareProviders).omit({
  id: true,
  createdAt: true,
});

export const insertSymptomEntrySchema = createInsertSchema(symptomEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertPersonalResourceSchema = createInsertSchema(personalResources).omit({
  id: true,
  accessCount: true,
  createdAt: true,
  lastAccessedAt: true,
});

export const insertBusScheduleSchema = createInsertSchema(busSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertEmergencyTreatmentPlanSchema = createInsertSchema(emergencyTreatmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReviewed: true,
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents).omit({
  id: true,
  timestamp: true,
});



// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Feedback schemas
export const insertFeedbackSchema = createInsertSchema(feedback);
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  accountName: true, // This is auto-generated from nickname or bankName
  balance: true,
  createdAt: true,
  updatedAt: true,
});
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Caregiver = typeof caregivers.$inferSelect;
export type InsertCaregiver = z.infer<typeof insertCaregiverSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type BudgetEntry = typeof budgetEntries.$inferSelect;
export type InsertBudgetEntry = z.infer<typeof insertBudgetEntrySchema>;

// Savings Goals
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
  id: true,
  currentAmount: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;

// Savings Transactions
export const insertSavingsTransactionSchema = createInsertSchema(savingsTransactions).omit({
  id: true,
  createdAt: true,
});

export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type InsertSavingsTransaction = z.infer<typeof insertSavingsTransactionSchema>;

// Budget Categories
export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type GroceryStore = typeof groceryStores.$inferSelect;
export type InsertGroceryStore = z.infer<typeof insertGroceryStoreSchema>;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;
export type EmergencyResource = typeof emergencyResources.$inferSelect;
export type InsertEmergencyResource = z.infer<typeof insertEmergencyResourceSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;
export type InsertUserPrivacySettings = z.infer<typeof insertUserPrivacySettingsSchema>;
export type DataAccessRequest = typeof dataAccessRequests.$inferSelect;
export type InsertDataAccessRequest = z.infer<typeof insertDataAccessRequestSchema>;
export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;
export type UserPharmacy = typeof userPharmacies.$inferSelect;
export type InsertUserPharmacy = z.infer<typeof insertUserPharmacySchema>;
export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;
export type RefillOrder = typeof refillOrders.$inferSelect;
export type InsertRefillOrder = z.infer<typeof insertRefillOrderSchema>;
export type Allergy = typeof allergies.$inferSelect;
export type InsertAllergy = z.infer<typeof insertAllergySchema>;
export type MedicalCondition = typeof medicalConditions.$inferSelect;
export type InsertMedicalCondition = z.infer<typeof insertMedicalConditionSchema>;
export type AdverseMedication = typeof adverseMedications.$inferSelect;
export type InsertAdverseMedication = z.infer<typeof insertAdverseMedicationSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type PrimaryCareProvider = typeof primaryCareProviders.$inferSelect;
export type InsertPrimaryCareProvider = z.infer<typeof insertPrimaryCareProviderSchema>;
export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;
export type PersonalResource = typeof personalResources.$inferSelect;
export type InsertPersonalResource = z.infer<typeof insertPersonalResourceSchema>;
export type BusSchedule = typeof busSchedules.$inferSelect;
export type InsertBusSchedule = z.infer<typeof insertBusScheduleSchema>;
export type EmergencyTreatmentPlan = typeof emergencyTreatmentPlans.$inferSelect;
export type InsertEmergencyTreatmentPlan = z.infer<typeof insertEmergencyTreatmentPlanSchema>;
export type Geofence = typeof geofences.$inferSelect;
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type GeofenceEvent = typeof geofenceEvents.$inferSelect;
export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;
export type PaymentAnalytics = typeof paymentAnalytics.$inferSelect;
export type InsertPaymentAnalytics = z.infer<typeof insertPaymentAnalyticsSchema>;



// Smart Notifications System
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "task_reminder", "appointment", "medication", "achievement", "streak"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  relatedId: integer("related_id"), // Related task/appointment ID
  priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"
  createdAt: timestamp("created_at").defaultNow(),
});

// User Preferences for Smart Features
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  notificationSettings: jsonb("notification_settings").default({}), // Push, email, SMS preferences
  reminderTiming: jsonb("reminder_timing").default({}), // Custom reminder schedules
  themeSettings: jsonb("theme_settings").default({}), // Colors, layout preferences
  accessibilitySettings: jsonb("accessibility_settings").default({}), // Voice, text size, etc.
  behaviorPatterns: jsonb("behavior_patterns").default({}), // Learned user patterns
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Analytics - Track payment method preferences and Plaid usage
export const paymentAnalytics = pgTable("payment_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(), // 'method_selected', 'plaid_connection', 'payment_processed', 'link_clicked', 'api_call'
  paymentMethod: text("payment_method"), // 'link', 'autopay'
  billId: integer("bill_id").references(() => bills.id, { onDelete: "cascade" }),
  plaidApiCall: text("plaid_api_call"), // 'link_token', 'account_balance', 'payment_initiate', etc.
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }), // Cost in dollars for Plaid API calls
  metadata: json("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentAnalyticsSchema = createInsertSchema(paymentAnalytics).omit({
  id: true,
  createdAt: true,
});

// Enhanced Achievement System
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementType: text("achievement_type").notNull(), // "task_streak", "mood_consistency", "milestone"
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  category: text("category").notNull(), // "daily_tasks", "mood", "financial", "health"
  points: integer("points").default(0),
  level: integer("level").default(1),
});

// Streak Tracking
export const streakTracking = pgTable("streak_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  streakType: text("streak_type").notNull(), // "daily_tasks", "mood_check", "exercise", "medication"
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastActivityDate: date("last_activity_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Commands & Interactions
export const voiceInteractions = pgTable("voice_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  command: text("command").notNull(),
  transcript: text("transcript").notNull(),
  action: text("action").notNull(), // "add_task", "complete_task", "mood_entry", "navigate"
  success: boolean("success").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Communication Features
export const quickResponses = pgTable("quick_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  messageTemplate: text("message_template").notNull(),
  category: text("category").notNull(), // "greeting", "emergency", "status", "request"
  useCount: integer("use_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Message Reactions
export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(), // "👍", "❤️", "😊", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Calendar Events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  allDay: boolean("all_day").default(false),
  category: text("category").default("personal"), // "personal", "work", "health", "social", "education"
  color: text("color").default("#3b82f6"), // Hex color for event display
  location: text("location"),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"), // "daily", "weekly", "monthly", "yearly"
  reminderMinutes: integer("reminder_minutes"), // Minutes before event to remind
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Activity Patterns for Personalization
export const activityPatterns = pgTable("activity_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // "task_completion", "mood_entry", "app_usage"
  timeOfDay: time("time_of_day"),
  dayOfWeek: integer("day_of_week"), // 0-6 (Sunday-Saturday)
  frequency: integer("frequency").default(1),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Academic Classes and Schedules
export const academicClasses = pgTable("academic_classes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  className: text("class_name").notNull(),
  instructor: text("instructor"),
  room: text("room"),
  building: text("building"),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  semester: text("semester").notNull(), // "Fall 2025", "Spring 2026"
  credits: integer("credits"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study Sessions and Focus Time
export const studySessions = pgTable("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  classId: integer("class_id").references(() => academicClasses.id),
  subject: text("subject").notNull(),
  duration: integer("duration").notNull(),
  technique: text("technique"), // "pomodoro", "focused", "review", "practice"
  location: text("location"), // "library", "dorm", "study_hall"
  effectiveness: integer("effectiveness"), // 1-5 scale
  notes: text("notes"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Assignments and Deadlines
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  classId: integer("class_id").references(() => academicClasses.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "homework", "project", "exam", "quiz", "paper"
  dueDate: timestamp("due_date").notNull(),
  estimatedHours: integer("estimated_hours"),
  priority: text("priority").default("medium"), // "low", "medium", "high", "urgent"
  status: text("status").default("not_started"), // "not_started", "in_progress", "completed", "submitted"
  grade: text("grade"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campus Navigation and Locations
export const campusLocations = pgTable("campus_locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  building: text("building"),
  floor: text("floor"),
  description: text("description"),
  category: text("category").notNull().default("academic"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Campus Transportation
export const campusTransport = pgTable("campus_transport", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  routeName: text("route_name").notNull(),
  fromStop: text("from_stop").notNull(),
  toStop: text("to_stop"),
  departureTime: text("departure_time"),
  estimatedDuration: integer("estimated_duration").default(15),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study Groups and Social Learning
export const studyGroups = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  classId: integer("class_id").references(() => academicClasses.id),
  groupName: text("group_name").notNull(),
  meetingTime: timestamp("meeting_time"),
  location: text("location"),
  members: text("members").array(), // Names or contact info
  topics: text("topics").array(), // Study topics
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"), // "weekly", "biweekly"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Academic Resources
export const academicResources = pgTable("academic_resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  classId: integer("class_id").references(() => academicClasses.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // "textbook", "website", "video", "tutorial", "practice_test"
  url: text("url"),
  description: text("description"),
  rating: integer("rating"), // 1-5 scale
  tags: text("tags").array(),
  isFavorite: boolean("is_favorite").default(false),
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transition Skills Tracking
export const transitionSkills = pgTable("transition_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillCategory: text("skill_category").notNull(), // "academic", "social", "independent_living", "career"
  skillName: text("skill_name").notNull(),
  description: text("description"),
  currentLevel: integer("current_level").default(1), // 1-5 scale
  targetLevel: integer("target_level").default(5),
  practiceActivities: text("practice_activities").array(),
  milestones: jsonb("milestones").default('[]'), // Array of completed milestones
  lastPracticed: timestamp("last_practiced"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Visual Task Templates with step-by-step breakdown
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "cooking", "cleaning", "personal_care", "social", "work"
  difficulty: text("difficulty").notNull().default("beginner"), // "beginner", "intermediate", "advanced"
  estimatedMinutes: integer("estimated_minutes").notNull(),
  icon: text("icon").default("CheckSquare"), // Lucide icon name
  color: text("color").default("blue"),
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by"), // user who created template
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskSteps = pgTable("task_steps", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => taskTemplates.id),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  visualAid: text("visual_aid"), // Icon or image description
  estimatedMinutes: integer("estimated_minutes").default(1),
  tips: text("tips"), // Helpful tips for this step
  safetyNotes: text("safety_notes"), // Important safety information
});

// User's personalized task instances
export const userTaskInstances = pgTable("user_task_instances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  templateId: integer("template_id").notNull().references(() => taskTemplates.id),
  currentStep: integer("current_step").default(1),
  isCompleted: boolean("is_completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  difficulty: text("difficulty").notNull(), // User can adjust difficulty
  stepProgress: jsonb("step_progress").default('{}'), // Track individual step completion
});

// Enhanced Emergency Quick Access (using existing emergencyContacts table)

// Skills Assessment and Progressive Learning
export const skillAssessments = pgTable("skill_assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillCategory: text("skill_category").notNull(), // "daily_living", "social", "academic", "work", "safety"
  skillName: text("skill_name").notNull(),
  currentLevel: integer("current_level").default(1), // 1-5 scale
  targetLevel: integer("target_level").default(5),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  assessedBy: text("assessed_by"), // "self", "caregiver", "therapist"
  notes: text("notes"),
  recommendedActivities: text("recommended_activities").array(),
  nextAssessment: timestamp("next_assessment"),
});

// Visual Routine Builder
export const visualRoutines = pgTable("visual_routines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  routineName: text("routine_name").notNull(),
  routineType: text("routine_type").notNull(), // "morning", "evening", "work", "social", "custom"
  isActive: boolean("is_active").default(true),
  estimatedMinutes: integer("estimated_minutes"),
  reminderTime: time("reminder_time"),
  steps: jsonb("steps").notNull().default('[]'), // Array of routine steps with visuals
  completionCount: integer("completion_count").default(0),
  lastCompleted: timestamp("last_completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wearable Devices
export const wearableDevices = pgTable("wearable_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // "Apple Watch Series 9", "Fitbit Sense 2"
  type: text("type").notNull(), // "smartwatch", "fitness_tracker", "health_monitor"
  brand: text("brand").notNull(), // "apple", "fitbit", "garmin", "samsung"
  model: text("model").notNull(),
  deviceId: text("device_id").unique(), // External device identifier
  isConnected: boolean("is_connected").default(false),
  lastSync: timestamp("last_sync"),
  batteryLevel: integer("battery_level"), // 0-100
  firmwareVersion: text("firmware_version"),
  features: text("features").array(), // ["heart_rate", "steps", "sleep", "location"]
  syncFrequency: text("sync_frequency").default("automatic"), // "automatic", "manual", "hourly", "daily"
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  pairedAt: timestamp("paired_at").defaultNow(),
});

// Health Metrics from Wearables
export const healthMetrics = pgTable("health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => wearableDevices.id),
  metricType: text("metric_type").notNull(), // "heart_rate", "steps", "sleep", "calories", "stress"
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // "bpm", "steps", "hours", "calories", "percentage"
  recordedAt: timestamp("recorded_at").notNull(),
  context: text("context"), // "resting", "exercise", "deep_sleep", "light_sleep"
  accuracy: text("accuracy").default("good"), // "poor", "fair", "good", "excellent"
  source: text("source").default("automatic"), // "automatic", "manual", "estimated"
  notes: text("notes"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Activity Sessions (Workouts, Walks, etc.)
export const activitySessions = pgTable("activity_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => wearableDevices.id),
  activityType: text("activity_type").notNull(), // "walking", "running", "cycling", "swimming", "workout"
  duration: integer("duration_minutes").notNull(),
  distance: decimal("distance", { precision: 8, scale: 2 }), // in meters
  caloriesBurned: integer("calories_burned"),
  averageHeartRate: integer("average_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  steps: integer("steps"),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  location: text("location"), // "Home", "Gym", "Park"
  intensity: text("intensity"), // "light", "moderate", "vigorous"
  notes: text("notes"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Sleep Tracking Data
export const sleepSessions = pgTable("sleep_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => wearableDevices.id),
  sleepDate: date("sleep_date").notNull(), // The night's date
  bedtime: timestamp("bedtime"),
  sleepTime: timestamp("sleep_time"), // When actually fell asleep
  wakeTime: timestamp("wake_time"),
  totalSleepDuration: integer("total_sleep_duration"), // minutes
  deepSleepDuration: integer("deep_sleep_duration"), // minutes
  lightSleepDuration: integer("light_sleep_duration"), // minutes
  remSleepDuration: integer("rem_sleep_duration"), // minutes
  awakeDuration: integer("awake_duration"), // minutes awake during night
  sleepEfficiency: decimal("sleep_efficiency", { precision: 5, scale: 2 }), // percentage
  sleepScore: integer("sleep_score"), // 0-100
  heartRateVariability: integer("heart_rate_variability"),
  restingHeartRate: integer("resting_heart_rate"),
  quality: text("quality"), // "poor", "fair", "good", "excellent"
  notes: text("notes"),
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Wearable Alerts and Notifications
export const wearableAlerts = pgTable("wearable_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => wearableDevices.id),
  alertType: text("alert_type").notNull(), // "medication", "hydration", "movement", "heart_rate", "fall_detection"
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("medium"), // "low", "medium", "high", "emergency"
  isRead: boolean("is_read").default(false),
  isAcknowledged: boolean("is_acknowledged").default(false),
  triggerValue: text("trigger_value"), // The metric value that triggered alert
  actionTaken: text("action_taken"), // What user did in response
  triggeredAt: timestamp("triggered_at").notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
});

// Wearable Device Settings and Preferences
export const wearableSettings = pgTable("wearable_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceId: integer("device_id").references(() => wearableDevices.id),
  settingName: text("setting_name").notNull(), // "heart_rate_alerts", "step_goal", "sleep_goal"
  settingValue: text("setting_value").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  lastModified: timestamp("last_modified").defaultNow(),
  modifiedBy: text("modified_by"), // "user" or "caregiver"
});

// Insert schemas for new tables
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertStreakTrackingSchema = createInsertSchema(streakTracking).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceInteractionSchema = createInsertSchema(voiceInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertQuickResponseSchema = createInsertSchema(quickResponses).omit({
  id: true,
  useCount: true,
  createdAt: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertActivityPatternSchema = createInsertSchema(activityPatterns).omit({
  id: true,
  lastUpdated: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Student-focused insert schemas
export const insertAcademicClassSchema = createInsertSchema(academicClasses).omit({
  id: true,
  createdAt: true,
});

export const insertStudySessionSchema = createInsertSchema(studySessions).omit({
  id: true,
  startedAt: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  createdAt: true,
});

export const insertCampusLocationSchema = createInsertSchema(campusLocations).omit({
  id: true,
  createdAt: true,
});

export const insertCampusTransportSchema = createInsertSchema(campusTransport).omit({
  id: true,
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
});

export const insertAcademicResourceSchema = createInsertSchema(academicResources).omit({
  id: true,
  accessCount: true,
  createdAt: true,
});

export const insertTransitionSkillSchema = createInsertSchema(transitionSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type StreakTracking = typeof streakTracking.$inferSelect;
export type InsertStreakTracking = z.infer<typeof insertStreakTrackingSchema>;
export type VoiceInteraction = typeof voiceInteractions.$inferSelect;
export type InsertVoiceInteraction = z.infer<typeof insertVoiceInteractionSchema>;
export type QuickResponse = typeof quickResponses.$inferSelect;
export type InsertQuickResponse = z.infer<typeof insertQuickResponseSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type ActivityPattern = typeof activityPatterns.$inferSelect;
export type InsertActivityPattern = z.infer<typeof insertActivityPatternSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;

// Student-focused types
export type AcademicClass = typeof academicClasses.$inferSelect;
export type InsertAcademicClass = z.infer<typeof insertAcademicClassSchema>;
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = z.infer<typeof insertStudySessionSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type CampusLocation = typeof campusLocations.$inferSelect;
export type InsertCampusLocation = z.infer<typeof insertCampusLocationSchema>;
export type CampusTransport = typeof campusTransport.$inferSelect;
export type InsertCampusTransport = z.infer<typeof insertCampusTransportSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type AcademicResource = typeof academicResources.$inferSelect;
export type InsertAcademicResource = z.infer<typeof insertAcademicResourceSchema>;
export type TransitionSkill = typeof transitionSkills.$inferSelect;
export type InsertTransitionSkill = z.infer<typeof insertTransitionSkillSchema>;

// Schema validation for caregiver permission tables
export const insertCaregiverPermissionSchema = createInsertSchema(caregiverPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLockedUserSettingSchema = createInsertSchema(lockedUserSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCaregiverInvitationSchema = createInsertSchema(caregiverInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertCareRelationshipSchema = createInsertSchema(careRelationships).omit({
  id: true,
  establishedAt: true,
});

// Types for caregiver permission tables
export type CaregiverPermission = typeof caregiverPermissions.$inferSelect;
export type InsertCaregiverPermission = z.infer<typeof insertCaregiverPermissionSchema>;
export type LockedUserSetting = typeof lockedUserSettings.$inferSelect;
export type InsertLockedUserSetting = z.infer<typeof insertLockedUserSettingSchema>;
export type CaregiverInvitation = typeof caregiverInvitations.$inferSelect;
export type InsertCaregiverInvitation = z.infer<typeof insertCaregiverInvitationSchema>;

// Personal documents storage for important information
export const personalDocuments = pgTable("personal_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(), // "insurance", "medical", "vehicle", "financial", "personal", "emergency"
  description: text("description"),
  documentType: text("document_type").notNull(), // "text", "number", "date", "image", "file", "link"
  content: text("content"), // For text/number content
  imageUrl: text("image_url"), // For image storage
  fileName: text("file_name"), // For file uploads
  linkUrl: text("link_url"), // For web links/URLs
  tags: text("tags").array(), // For searchability
  isImportant: boolean("is_important").default(false),
  expirationDate: date("expiration_date"), // For documents that expire
  reminderDays: integer("reminder_days"), // Days before expiration to remind
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonalDocumentSchema = createInsertSchema(personalDocuments).omit({ 
  id: true, 
  userId: true,
  createdAt: true, 
  updatedAt: true 
});
export type InsertPersonalDocument = z.infer<typeof insertPersonalDocumentSchema>;
export type PersonalDocument = typeof personalDocuments.$inferSelect;


export type CareRelationship = typeof careRelationships.$inferSelect;
export type InsertCareRelationship = z.infer<typeof insertCareRelationshipSchema>;

// Rewards Program - Caregiver-created incentives for users
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  caregiverId: integer("caregiver_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pointsRequired: integer("points_required").notNull(),
  category: text("category").notNull(), // "privilege", "item", "activity", "money", "special"
  rewardType: text("reward_type").notNull(), // "immediate", "delayed", "recurring"
  value: text("value"), // Monetary value or description
  isActive: boolean("is_active").default(true),
  maxRedemptions: integer("max_redemptions"), // null = unlimited
  currentRedemptions: integer("current_redemptions").default(0),
  expiresAt: timestamp("expires_at"),
  iconName: text("icon_name").default("gift"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward Redemptions - Track when users claim rewards
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  rewardId: integer("reward_id").notNull().references(() => rewards.id),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").default("pending"), // "pending", "approved", "denied", "completed"
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  fulfilledAt: timestamp("fulfilled_at"), // matches actual DB column name
  notes: text("notes"),
});

// Points Transactions - Track all point earning and spending
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(), // positive for earning, negative for spending
  transactionType: text("transaction_type").notNull(), // "task_completion", "mood_entry", "streak_bonus", "reward_redemption", "manual_adjustment"
  source: text("source").notNull(),
  description: text("description").notNull(),
  awardedBy: integer("awarded_by").references(() => users.id), // caregiver who awarded points
  createdAt: timestamp("created_at").defaultNow(),
});

// User Points Balance - Current point totals
export const userPointsBalance = pgTable("user_points_balance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  totalPoints: integer("total_points").default(0),
  availablePoints: integer("available_points").default(0), // total - spent
  lifetimeEarned: integer("lifetime_earned").default(0),
  lifetimeSpent: integer("lifetime_spent").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for new high-value features
export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertTaskStepSchema = createInsertSchema(taskSteps).omit({
  id: true,
});

export const insertUserTaskInstanceSchema = createInsertSchema(userTaskInstances).omit({
  id: true,
  startedAt: true,
});

export const insertSkillAssessmentSchema = createInsertSchema(skillAssessments).omit({
  id: true,
  assessmentDate: true,
});

export const insertVisualRoutineSchema = createInsertSchema(visualRoutines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Wearable device insert schemas
export const insertWearableDeviceSchema = createInsertSchema(wearableDevices).omit({
  id: true,
  pairedAt: true,
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  syncedAt: true,
});

export const insertActivitySessionSchema = createInsertSchema(activitySessions).omit({
  id: true,
  syncedAt: true,
});

export const insertSleepSessionSchema = createInsertSchema(sleepSessions).omit({
  id: true,
  syncedAt: true,
});

export const insertWearableAlertSchema = createInsertSchema(wearableAlerts).omit({
  id: true,
});

export const insertWearableSettingSchema = createInsertSchema(wearableSettings).omit({
  id: true,
  lastModified: true,
});

// Types for new high-value features
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskStep = typeof taskSteps.$inferSelect;
export type InsertTaskStep = z.infer<typeof insertTaskStepSchema>;
export type UserTaskInstance = typeof userTaskInstances.$inferSelect;
export type InsertUserTaskInstance = z.infer<typeof insertUserTaskInstanceSchema>;
export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type InsertSkillAssessment = z.infer<typeof insertSkillAssessmentSchema>;
export type VisualRoutine = typeof visualRoutines.$inferSelect;
export type InsertVisualRoutine = z.infer<typeof insertVisualRoutineSchema>;

// Wearable device types
export type WearableDevice = typeof wearableDevices.$inferSelect;
export type InsertWearableDevice = z.infer<typeof insertWearableDeviceSchema>;
export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type ActivitySession = typeof activitySessions.$inferSelect;
export type InsertActivitySession = z.infer<typeof insertActivitySessionSchema>;
export type SleepSession = typeof sleepSessions.$inferSelect;
export type InsertSleepSession = z.infer<typeof insertSleepSessionSchema>;
export type WearableAlert = typeof wearableAlerts.$inferSelect;
export type InsertWearableAlert = z.infer<typeof insertWearableAlertSchema>;
export type WearableSetting = typeof wearableSettings.$inferSelect;
export type InsertWearableSetting = z.infer<typeof insertWearableSettingSchema>;

// Subscription Management Tables
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planType: text("plan_type").notNull(), // "free", "premium", "family"
  billingCycle: text("billing_cycle").default("monthly"), // "monthly", "annual"
  status: text("status").notNull().default("active"), // "active", "cancelled", "past_due", "trialing"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  priceId: text("price_id"),
  amount: integer("amount"), // in cents
  currency: text("currency").default("usd"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptionUsage = pgTable("subscription_usage", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  featureName: text("feature_name").notNull(), // "tasks", "caregivers", "data_export"
  usageCount: integer("usage_count").default(0),
  usageLimit: integer("usage_limit"), // null for unlimited
  resetPeriod: text("reset_period").default("monthly"), // "monthly", "annual", "never"
  lastReset: timestamp("last_reset").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // "succeeded", "failed", "pending"
  paymentMethod: text("payment_method"), // "card", "bank_transfer"
  description: text("description"),
  failureReason: text("failure_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription schema exports
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertSubscriptionUsageSchema = createInsertSchema(subscriptionUsage);
export const insertPaymentHistorySchema = createInsertSchema(paymentHistory);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SubscriptionUsage = typeof subscriptionUsage.$inferSelect;
export type InsertSubscriptionUsage = z.infer<typeof insertSubscriptionUsageSchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;

// Rewards Program Types - moved after table definitions
export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  currentRedemptions: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertUserPointsBalanceSchema = createInsertSchema(userPointsBalance).omit({
  id: true,
  updatedAt: true,
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type UserPointsBalance = typeof userPointsBalance.$inferSelect;
export type InsertUserPointsBalance = z.infer<typeof insertUserPointsBalanceSchema>;
