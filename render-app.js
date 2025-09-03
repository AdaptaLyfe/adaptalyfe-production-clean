var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/objectAcl.ts
var objectAcl_exports = {};
__export(objectAcl_exports, {
  ObjectAccessGroupType: () => ObjectAccessGroupType,
  ObjectPermission: () => ObjectPermission,
  canAccessObject: () => canAccessObject,
  getObjectAclPolicy: () => getObjectAclPolicy,
  setObjectAclPolicy: () => setObjectAclPolicy
});
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}
var ACL_POLICY_METADATA_KEY, ObjectAccessGroupType, ObjectPermission;
var init_objectAcl = __esm({
  "server/objectAcl.ts"() {
    "use strict";
    ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
    ObjectAccessGroupType = /* @__PURE__ */ ((ObjectAccessGroupType2) => {
      return ObjectAccessGroupType2;
    })(ObjectAccessGroupType || {});
    ObjectPermission = /* @__PURE__ */ ((ObjectPermission2) => {
      ObjectPermission2["READ"] = "read";
      ObjectPermission2["WRITE"] = "write";
      return ObjectPermission2;
    })(ObjectPermission || {});
  }
});

// server/objectStorage.ts
var objectStorage_exports = {};
__export(objectStorage_exports, {
  ObjectNotFoundError: () => ObjectNotFoundError,
  ObjectStorageService: () => ObjectStorageService,
  objectStorageClient: () => objectStorageClient
});
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    init_objectAcl();
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    objectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      // Gets the public object search paths.
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      // Gets the private object directory.
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return dir;
      }
      // Search for a public object from the search paths.
      async searchPublicObject(filePath) {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      // Downloads an object to the response.
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": metadata.size,
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      // Gets the upload URL for an object entity.
      async getObjectEntityUploadURL() {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const objectId = randomUUID();
        const fullPath = `${privateObjectDir}/uploads/${objectId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the object entity file from the object path.
      async getObjectEntityFile(objectPath) {
        if (!objectPath.startsWith("/objects/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
          objectEntityDir = `${objectEntityDir}/`;
        }
        if (!rawObjectPath.startsWith(objectEntityDir)) {
          return rawObjectPath;
        }
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
      // Tries to set the ACL policy for the object entity and return the normalized path.
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
          return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return normalizedPath;
      }
      // Checks if the user can access the object entity.
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
    };
  }
});

// server/production.ts
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

// server/routes.ts
import { createServer } from "http";
import path from "path";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  academicClasses: () => academicClasses,
  academicResources: () => academicResources,
  achievements: () => achievements,
  activityPatterns: () => activityPatterns,
  activitySessions: () => activitySessions,
  adverseMedications: () => adverseMedications,
  allergies: () => allergies,
  appointments: () => appointments,
  assignments: () => assignments,
  auditLogs: () => auditLogs,
  balanceHistory: () => balanceHistory,
  bankAccounts: () => bankAccounts2,
  billPayments: () => billPayments,
  bills: () => bills,
  budgetCategories: () => budgetCategories,
  budgetEntries: () => budgetEntries,
  busSchedules: () => busSchedules,
  calendarEvents: () => calendarEvents,
  campusLocations: () => campusLocations,
  campusTransport: () => campusTransport,
  careRelationships: () => careRelationships,
  caregiverInvitations: () => caregiverInvitations,
  caregiverPermissions: () => caregiverPermissions,
  caregivers: () => caregivers,
  dailyTasks: () => dailyTasks,
  dataAccessRequests: () => dataAccessRequests,
  emergencyContacts: () => emergencyContacts,
  emergencyResources: () => emergencyResources,
  emergencyTreatmentPlans: () => emergencyTreatmentPlans,
  feedback: () => feedback,
  geofenceEvents: () => geofenceEvents,
  geofences: () => geofences,
  groceryStores: () => groceryStores,
  healthMetrics: () => healthMetrics,
  insertAcademicClassSchema: () => insertAcademicClassSchema,
  insertAcademicResourceSchema: () => insertAcademicResourceSchema,
  insertAchievementSchema: () => insertAchievementSchema,
  insertActivityPatternSchema: () => insertActivityPatternSchema,
  insertActivitySessionSchema: () => insertActivitySessionSchema,
  insertAdverseMedicationSchema: () => insertAdverseMedicationSchema,
  insertAllergySchema: () => insertAllergySchema,
  insertAppointmentSchema: () => insertAppointmentSchema,
  insertAssignmentSchema: () => insertAssignmentSchema,
  insertBankAccountSchema: () => insertBankAccountSchema2,
  insertBillPaymentSchema: () => insertBillPaymentSchema,
  insertBillSchema: () => insertBillSchema,
  insertBudgetCategorySchema: () => insertBudgetCategorySchema,
  insertBudgetEntrySchema: () => insertBudgetEntrySchema,
  insertBusScheduleSchema: () => insertBusScheduleSchema,
  insertCalendarEventSchema: () => insertCalendarEventSchema,
  insertCampusLocationSchema: () => insertCampusLocationSchema,
  insertCampusTransportSchema: () => insertCampusTransportSchema,
  insertCareRelationshipSchema: () => insertCareRelationshipSchema,
  insertCaregiverInvitationSchema: () => insertCaregiverInvitationSchema,
  insertCaregiverPermissionSchema: () => insertCaregiverPermissionSchema,
  insertCaregiverSchema: () => insertCaregiverSchema,
  insertDailyTaskSchema: () => insertDailyTaskSchema,
  insertDataAccessRequestSchema: () => insertDataAccessRequestSchema,
  insertEmergencyContactSchema: () => insertEmergencyContactSchema,
  insertEmergencyResourceSchema: () => insertEmergencyResourceSchema,
  insertEmergencyTreatmentPlanSchema: () => insertEmergencyTreatmentPlanSchema,
  insertFeedbackSchema: () => insertFeedbackSchema,
  insertGeofenceEventSchema: () => insertGeofenceEventSchema,
  insertGeofenceSchema: () => insertGeofenceSchema,
  insertGroceryStoreSchema: () => insertGroceryStoreSchema,
  insertHealthMetricSchema: () => insertHealthMetricSchema,
  insertInvitationCodeSchema: () => insertInvitationCodeSchema,
  insertLockedUserSettingSchema: () => insertLockedUserSettingSchema,
  insertMealPlanSchema: () => insertMealPlanSchema,
  insertMedicalConditionSchema: () => insertMedicalConditionSchema,
  insertMedicationSchema: () => insertMedicationSchema,
  insertMessageReactionSchema: () => insertMessageReactionSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertMoodEntrySchema: () => insertMoodEntrySchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPayeeCredentialSchema: () => insertPayeeCredentialSchema,
  insertPaymentAnalyticsSchema: () => insertPaymentAnalyticsSchema,
  insertPaymentHistorySchema: () => insertPaymentHistorySchema,
  insertPaymentLimitSchema: () => insertPaymentLimitSchema,
  insertPaymentTransactionSchema: () => insertPaymentTransactionSchema,
  insertPersonalDocumentSchema: () => insertPersonalDocumentSchema,
  insertPersonalResourceSchema: () => insertPersonalResourceSchema,
  insertPharmacySchema: () => insertPharmacySchema,
  insertPointsTransactionSchema: () => insertPointsTransactionSchema,
  insertPrimaryCareProviderSchema: () => insertPrimaryCareProviderSchema,
  insertQuickResponseSchema: () => insertQuickResponseSchema,
  insertRefillOrderSchema: () => insertRefillOrderSchema,
  insertRewardRedemptionSchema: () => insertRewardRedemptionSchema,
  insertRewardSchema: () => insertRewardSchema,
  insertSavingsGoalSchema: () => insertSavingsGoalSchema,
  insertSavingsTransactionSchema: () => insertSavingsTransactionSchema,
  insertShoppingListSchema: () => insertShoppingListSchema,
  insertSkillAssessmentSchema: () => insertSkillAssessmentSchema,
  insertSleepSessionSchema: () => insertSleepSessionSchema,
  insertStreakTrackingSchema: () => insertStreakTrackingSchema,
  insertStudyGroupSchema: () => insertStudyGroupSchema,
  insertStudySessionSchema: () => insertStudySessionSchema,
  insertSubscriptionSchema: () => insertSubscriptionSchema,
  insertSubscriptionUsageSchema: () => insertSubscriptionUsageSchema,
  insertSymptomEntrySchema: () => insertSymptomEntrySchema,
  insertTaskStepSchema: () => insertTaskStepSchema,
  insertTaskTemplateSchema: () => insertTaskTemplateSchema,
  insertTransitionSkillSchema: () => insertTransitionSkillSchema,
  insertUserAchievementSchema: () => insertUserAchievementSchema,
  insertUserCaregiverConnectionSchema: () => insertUserCaregiverConnectionSchema,
  insertUserPharmacySchema: () => insertUserPharmacySchema,
  insertUserPointsBalanceSchema: () => insertUserPointsBalanceSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserPrivacySettingsSchema: () => insertUserPrivacySettingsSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserTaskInstanceSchema: () => insertUserTaskInstanceSchema,
  insertVisualRoutineSchema: () => insertVisualRoutineSchema,
  insertVoiceInteractionSchema: () => insertVoiceInteractionSchema,
  insertWearableAlertSchema: () => insertWearableAlertSchema,
  insertWearableDeviceSchema: () => insertWearableDeviceSchema,
  insertWearableSettingSchema: () => insertWearableSettingSchema,
  invitationCodes: () => invitationCodes,
  lockedUserSettings: () => lockedUserSettings,
  loginSchema: () => loginSchema,
  mealPlans: () => mealPlans,
  medicalConditions: () => medicalConditions,
  medications: () => medications,
  messageReactions: () => messageReactions,
  messages: () => messages,
  moodEntries: () => moodEntries,
  notifications: () => notifications,
  payeeCredentials: () => payeeCredentials,
  paymentAnalytics: () => paymentAnalytics,
  paymentHistory: () => paymentHistory,
  paymentLimits: () => paymentLimits,
  paymentTransactions: () => paymentTransactions,
  personalDocuments: () => personalDocuments,
  personalResources: () => personalResources,
  pharmacies: () => pharmacies,
  pointsTransactions: () => pointsTransactions,
  primaryCareProviders: () => primaryCareProviders,
  quickResponses: () => quickResponses,
  refillOrders: () => refillOrders,
  registerSchema: () => registerSchema,
  rewardRedemptions: () => rewardRedemptions,
  rewards: () => rewards,
  savingsGoals: () => savingsGoals,
  savingsTransactions: () => savingsTransactions,
  shoppingLists: () => shoppingLists,
  skillAssessments: () => skillAssessments,
  sleepSessions: () => sleepSessions,
  streakTracking: () => streakTracking,
  studyGroups: () => studyGroups,
  studySessions: () => studySessions,
  subscriptionUsage: () => subscriptionUsage,
  subscriptions: () => subscriptions,
  symptomEntries: () => symptomEntries,
  taskSteps: () => taskSteps,
  taskTemplates: () => taskTemplates,
  transitionSkills: () => transitionSkills,
  userAchievements: () => userAchievements,
  userCaregiverConnections: () => userCaregiverConnections,
  userPharmacies: () => userPharmacies,
  userPointsBalance: () => userPointsBalance,
  userPreferences: () => userPreferences,
  userPrivacySettings: () => userPrivacySettings,
  userTaskInstances: () => userTaskInstances,
  users: () => users,
  visualRoutines: () => visualRoutines,
  voiceInteractions: () => voiceInteractions,
  wearableAlerts: () => wearableAlerts,
  wearableDevices: () => wearableDevices,
  wearableSettings: () => wearableSettings
});
import { pgTable as pgTable2, text as text2, serial, integer as integer2, boolean as boolean2, timestamp as timestamp2, real, varchar as varchar2, jsonb, decimal as decimal2, date, time, json as json2 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
import { z } from "zod";

// shared/banking-schema.ts
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var bankAccounts = pgTable("bank_accounts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull(),
  // checking, savings, credit
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }).notNull(),
  // encrypted
  routingNumber: varchar("routing_number", { length: 255 }),
  // encrypted
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  plaidAccountId: varchar("plaid_account_id", { length: 255 }),
  plaidAccessToken: text("plaid_access_token"),
  // encrypted
  lastSynced: timestamp("last_synced").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var billPayments = pgTable("bill_payments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  billId: integer("bill_id").notNull(),
  // references existing bills table
  bankAccountId: integer("bank_account_id").notNull(),
  payeeWebsite: varchar("payee_website", { length: 255 }).notNull(),
  payeeAccountNumber: varchar("payee_account_number", { length: 255 }).notNull(),
  // encrypted
  payeeLoginCredentials: text("payee_login_credentials"),
  // encrypted JSON
  isAutoPay: boolean("is_auto_pay").default(false),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: integer("payment_date").notNull(),
  // day of month (1-31)
  isActive: boolean("is_active").default(true),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date").notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  // active, paused, failed
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var paymentTransactions = pgTable("payment_transactions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  billPaymentId: integer("bill_payment_id").notNull(),
  bankAccountId: integer("bank_account_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  // pending, completed, failed, cancelled
  transactionId: varchar("transaction_id", { length: 255 }),
  // external transaction ID
  confirmationNumber: varchar("confirmation_number", { length: 255 }),
  errorMessage: text("error_message"),
  initiatedAt: timestamp("initiated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata")
  // additional transaction details
});
var paymentLimits = pgTable("payment_limits", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  limitType: varchar("limit_type", { length: 50 }).notNull(),
  // daily, monthly, per_transaction
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var balanceHistory = pgTable("balance_history", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  bankAccountId: integer("bank_account_id").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow()
});
var payeeCredentials = pgTable("payee_credentials", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").notNull(),
  payeeName: varchar("payee_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }).notNull(),
  loginUsername: text("login_username"),
  // encrypted
  loginPassword: text("login_password"),
  // encrypted
  accountNumber: text("account_number"),
  // encrypted
  additionalFields: json("additional_fields"),
  // encrypted JSON for custom fields
  isActive: boolean("is_active").default(true),
  lastVerified: timestamp("last_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSynced: true
});
var insertBillPaymentSchema = createInsertSchema(billPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastPaymentDate: true
});
var insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  initiatedAt: true,
  completedAt: true
});
var insertPaymentLimitSchema = createInsertSchema(paymentLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPayeeCredentialSchema = createInsertSchema(payeeCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastVerified: true
});

// shared/schema.ts
var users = pgTable2("users", {
  id: serial("id").primaryKey(),
  username: text2("username").notNull().unique(),
  password: text2("password").notNull(),
  name: text2("name").notNull(),
  email: text2("email").unique(),
  accountType: text2("account_type").notNull().default("user"),
  // "user" or "caregiver"
  subscriptionTier: text2("subscription_tier").notNull().default("free"),
  // "free", "premium", "family"
  stripeCustomerId: text2("stripe_customer_id"),
  stripeSubscriptionId: text2("stripe_subscription_id"),
  subscriptionStatus: text2("subscription_status").default("inactive"),
  // "active", "inactive", "cancelled", "past_due"
  subscriptionExpiresAt: timestamp2("subscription_expires_at"),
  streakDays: integer2("streak_days").default(0),
  createdBy: integer2("created_by"),
  // Caregiver who created this user account
  isActive: boolean2("is_active").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var caregiverInvitations = pgTable2("caregiver_invitations", {
  id: serial("id").primaryKey(),
  caregiverId: integer2("caregiver_id").notNull(),
  userEmail: text2("user_email"),
  userName: text2("user_name").notNull(),
  userAge: integer2("user_age"),
  invitationCode: text2("invitation_code").notNull().unique(),
  status: text2("status").notNull().default("pending"),
  // "pending", "accepted", "expired", "cancelled"
  relationship: text2("relationship").notNull(),
  // "parent", "guardian", "therapist", "case_worker", etc.
  permissionsGranted: jsonb("permissions_granted"),
  // Array of permission types
  expiresAt: timestamp2("expires_at").notNull(),
  acceptedAt: timestamp2("accepted_at"),
  acceptedBy: integer2("accepted_by"),
  // User ID who accepted
  createdAt: timestamp2("created_at").defaultNow()
});
var dailyTasks = pgTable2("daily_tasks", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  category: text2("category").notNull(),
  // "morning", "cooking", "organization", etc.
  frequency: text2("frequency").notNull().default("daily"),
  // "daily", "weekly", "monthly"
  estimatedMinutes: integer2("estimated_minutes").notNull(),
  pointValue: integer2("point_value").default(0),
  // Points awarded when task is completed
  scheduledTime: time("scheduled_time"),
  // Specific time when task should be completed (e.g., 10:00 AM)
  isCompleted: boolean2("is_completed").default(false),
  completedAt: timestamp2("completed_at"),
  dueDate: timestamp2("due_date"),
  // For weekly/monthly tasks
  lastCompleted: timestamp2("last_completed"),
  // Track when task was last done
  lastReminderSent: timestamp2("last_reminder_sent"),
  // When reminder was last sent
  lastOverdueReminder: timestamp2("last_overdue_reminder")
  // When overdue reminder was last sent
});
var bills = pgTable2("bills", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  name: text2("name").notNull(),
  amount: real("amount").notNull(),
  dueDate: integer2("due_date").notNull(),
  // day of month (1-31)
  isRecurring: boolean2("is_recurring").default(true),
  isPaid: boolean2("is_paid").default(false),
  category: text2("category").notNull(),
  // "utilities", "phone", "rent", etc.
  payeeWebsite: text2("payee_website"),
  // Payment website URL
  payeeAccountNumber: text2("payee_account_number")
  // User's account number with the payee
});
var feedback = pgTable2("feedback", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id"),
  // Optional - can be anonymous
  rating: integer2("rating").notNull(),
  // 1-5 stars
  category: text2("category").notNull(),
  // "usability", "features", "bugs", "accessibility", etc.
  message: text2("message").notNull(),
  page: text2("page"),
  // Which page the feedback was given from
  userAgent: text2("user_agent"),
  // Browser/device info
  isResolved: boolean2("is_resolved").default(false),
  adminNotes: text2("admin_notes"),
  // Internal notes for tracking resolution
  createdAt: timestamp2("created_at").defaultNow()
});
var bankAccounts2 = pgTable2("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  accountName: text2("account_name").notNull(),
  // Required field from existing table
  bankName: text2("bank_name").notNull(),
  accountType: text2("account_type").notNull(),
  // "checking", "savings", "credit"
  accountNickname: text2("account_nickname"),
  // User's nickname for the account
  bankWebsite: text2("bank_website"),
  // Bank's login website URL
  lastFour: text2("last_four"),
  // Last 4 digits of account (optional, for reference)
  balance: real("balance").default(0),
  // Existing balance field
  isActive: boolean2("is_active").default(true),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var savingsGoals = pgTable2("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  title: text2("title").notNull(),
  // "Vacation to Hawaii", "Emergency Fund", "New Car"
  description: text2("description"),
  targetAmount: real("target_amount").notNull(),
  // How much they want to save
  currentAmount: real("current_amount").default(0),
  // How much they've saved so far
  targetDate: timestamp2("target_date"),
  // When they want to reach their goal
  category: text2("category").notNull(),
  // "vacation", "emergency", "purchase", "education", "home", "other"
  priority: text2("priority").notNull().default("medium"),
  // "high", "medium", "low"
  isActive: boolean2("is_active").default(true),
  isCompleted: boolean2("is_completed").default(false),
  completedAt: timestamp2("completed_at"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var savingsTransactions = pgTable2("savings_transactions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  savingsGoalId: integer2("savings_goal_id").notNull(),
  amount: real("amount").notNull(),
  // Positive for deposits, negative for withdrawals
  transactionType: text2("transaction_type").notNull(),
  // "deposit", "withdrawal", "goal_transfer"
  description: text2("description"),
  // Optional note about the transaction
  transactionDate: timestamp2("transaction_date").defaultNow(),
  createdAt: timestamp2("created_at").defaultNow()
});
var moodEntries = pgTable2("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  mood: integer2("mood").notNull(),
  // 1-5 scale
  notes: text2("notes"),
  entryDate: timestamp2("entry_date").defaultNow()
});
var achievements = pgTable2("achievements", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  type: text2("type").notNull(),
  // "streak", "tasks", "financial", etc.
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  icon: text2("icon").notNull(),
  earnedAt: timestamp2("earned_at").defaultNow()
});
var userCaregiverConnections = pgTable2("user_caregiver_connections", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  // The person receiving care
  caregiverId: integer2("caregiver_id").notNull(),
  // The caregiver account
  relationship: text2("relationship").notNull(),
  // "parent", "sibling", "therapist", etc.
  permissions: text2("permissions").notNull().default("view"),
  // "view", "edit", "admin"
  isEmergencyContact: boolean2("is_emergency_contact").default(false),
  connectionStatus: text2("connection_status").notNull().default("active"),
  // "pending", "active", "inactive"
  isPrimaryCaregiver: boolean2("is_primary_caregiver").default(false),
  // Has full administrative control
  canModifySettings: boolean2("can_modify_settings").default(true),
  canAccessLocation: boolean2("can_access_location").default(true),
  canReceiveAlerts: boolean2("can_receive_alerts").default(true),
  connectedAt: timestamp2("connected_at").defaultNow(),
  notes: text2("notes")
});
var careRelationships = pgTable2("care_relationships", {
  id: serial("id").primaryKey(),
  caregiverId: integer2("caregiver_id").notNull(),
  userId: integer2("user_id").notNull(),
  relationship: text2("relationship").notNull(),
  // "parent", "guardian", "therapist", etc.
  isPrimary: boolean2("is_primary").default(false),
  // Primary caregiver has full access
  isActive: boolean2("is_active").default(true),
  establishedAt: timestamp2("established_at").defaultNow(),
  establishedVia: text2("established_via").default("invitation")
  // "invitation", "manual", "import"
});
var caregiverPermissions = pgTable2("caregiver_permissions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  // The user being cared for
  caregiverId: integer2("caregiver_id").notNull(),
  permissionType: text2("permission_type").notNull(),
  // "location_tracking", "medication_management", "emergency_contacts", etc.
  isGranted: boolean2("is_granted").default(true),
  isLocked: boolean2("is_locked").default(false),
  // Can't be changed by user
  grantedBy: integer2("granted_by"),
  // Which caregiver granted this
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var lockedUserSettings = pgTable2("locked_user_settings", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  settingKey: text2("setting_key").notNull(),
  // "location_tracking", "geofencing", "emergency_contacts", etc.
  settingValue: text2("setting_value").notNull(),
  isLocked: boolean2("is_locked").default(true),
  lockedBy: integer2("locked_by").notNull(),
  // Caregiver who locked it
  lockReason: text2("lock_reason"),
  // Optional reason for the lock
  canUserView: boolean2("can_user_view").default(true),
  // Whether user can see the setting
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var invitationCodes = pgTable2("invitation_codes", {
  id: serial("id").primaryKey(),
  code: text2("code").notNull().unique(),
  createdByUserId: integer2("created_by_user_id").notNull(),
  targetUserType: text2("target_user_type").notNull(),
  // "user" or "caregiver"
  relationship: text2("relationship").notNull(),
  permissions: text2("permissions").notNull().default("view"),
  isUsed: boolean2("is_used").default(false),
  usedByUserId: integer2("used_by_user_id"),
  expiresAt: timestamp2("expires_at").notNull(),
  createdAt: timestamp2("created_at").defaultNow(),
  usedAt: timestamp2("used_at")
});
var caregivers = pgTable2("caregivers", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  name: text2("name").notNull(),
  relationship: text2("relationship").notNull(),
  // "parent", "therapist", "support worker"
  email: text2("email"),
  isActive: boolean2("is_active").default(true)
});
var messages = pgTable2("messages", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  caregiverId: integer2("caregiver_id").notNull(),
  content: text2("content").notNull(),
  fromUser: boolean2("from_user").notNull(),
  sentAt: timestamp2("sent_at").defaultNow()
});
var budgetEntries = pgTable2("budget_entries", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  category: text2("category").notNull(),
  amount: real("amount").notNull(),
  type: text2("type").notNull(),
  // "income", "expense", "savings_allocation"
  description: text2("description"),
  savingsGoalId: integer2("savings_goal_id"),
  // Optional - if this entry is allocated to a specific savings goal
  isRecurring: boolean2("is_recurring").default(false),
  recurringFrequency: text2("recurring_frequency"),
  // "weekly", "monthly", "yearly"
  entryDate: timestamp2("entry_date").defaultNow(),
  createdAt: timestamp2("created_at").defaultNow()
});
var budgetCategories = pgTable2("budget_categories", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  name: text2("name").notNull(),
  // "Food", "Transportation", "Entertainment", "Savings"
  type: text2("type").notNull(),
  // "expense", "income", "savings"
  budgetedAmount: real("budgeted_amount").default(0),
  // How much they plan to spend/save in this category
  color: text2("color").default("#6B7280"),
  // For UI visualization
  isActive: boolean2("is_active").default(true),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var appointments = pgTable2("appointments", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  title: text2("title").notNull(),
  description: text2("description"),
  appointmentDate: text2("appointment_date").notNull(),
  // Store as string for easier form handling
  location: text2("location"),
  provider: text2("provider"),
  // doctor, dentist, therapist, etc.
  isCompleted: boolean2("is_completed").default(false),
  reminderSet: boolean2("reminder_set").default(false),
  createdAt: timestamp2("created_at").defaultNow()
});
var mealPlans = pgTable2("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  mealType: text2("meal_type").notNull(),
  // breakfast, lunch, dinner, snack
  mealName: text2("meal_name").notNull(),
  plannedDate: text2("planned_date").notNull(),
  // YYYY-MM-DD format
  isCompleted: boolean2("is_completed").default(false),
  recipe: text2("recipe"),
  cookingTime: integer2("cooking_time"),
  // minutes
  createdAt: timestamp2("created_at").defaultNow()
});
var groceryStores = pgTable2("grocery_stores", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  name: varchar2("name").notNull(),
  website: varchar2("website"),
  onlineOrderingUrl: varchar2("online_ordering_url"),
  address: text2("address"),
  phoneNumber: varchar2("phone_number"),
  isPreferred: boolean2("is_preferred").default(false),
  deliveryAvailable: boolean2("delivery_available").default(false),
  pickupAvailable: boolean2("pickup_available").default(false),
  createdAt: timestamp2("created_at").defaultNow()
});
var shoppingLists = pgTable2("shopping_lists", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  storeId: integer2("store_id").references(() => groceryStores.id),
  itemName: text2("item_name").notNull(),
  category: text2("category").notNull(),
  // produce, dairy, meat, pantry, etc.
  quantity: text2("quantity"),
  // "2 lbs", "1 gallon", etc.
  isPurchased: boolean2("is_purchased").default(false),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  addedDate: timestamp2("added_date").defaultNow(),
  purchasedDate: timestamp2("purchased_date")
});
var emergencyResources = pgTable2("emergency_resources", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: varchar2("name").notNull(),
  resourceType: varchar2("resource_type").notNull(),
  // "crisis", "counselor", "hospital", "mental_health", "support_group"
  phoneNumber: varchar2("phone_number"),
  address: text2("address"),
  description: text2("description"),
  isAvailable24_7: boolean2("is_available_24_7").default(false),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var auditLogs = pgTable2("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").references(() => users.id),
  action: varchar2("action", { length: 100 }).notNull(),
  resource: varchar2("resource", { length: 100 }).notNull(),
  resourceId: varchar2("resource_id", { length: 100 }),
  ipAddress: varchar2("ip_address", { length: 45 }),
  userAgent: text2("user_agent"),
  success: boolean2("success").notNull(),
  errorMessage: text2("error_message"),
  metadata: text2("metadata"),
  // JSON string
  timestamp: timestamp2("timestamp").defaultNow().notNull()
});
var userPrivacySettings = pgTable2("user_privacy_settings", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  dataProcessingConsent: boolean2("data_processing_consent").default(false),
  analyticsConsent: boolean2("analytics_consent").default(false),
  marketingConsent: boolean2("marketing_consent").default(false),
  caregiverDataSharing: boolean2("caregiver_data_sharing").default(true),
  healthDataSharing: boolean2("health_data_sharing").default(false),
  dataRetentionPeriod: integer2("data_retention_period").default(365),
  // days
  consentDate: timestamp2("consent_date").defaultNow(),
  lastUpdated: timestamp2("last_updated").defaultNow()
});
var dataAccessRequests = pgTable2("data_access_requests", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  requestType: varchar2("request_type", { length: 50 }).notNull(),
  // 'access', 'export', 'delete', 'correction'
  status: varchar2("status", { length: 20 }).default("pending"),
  // 'pending', 'processing', 'completed', 'denied'
  requestData: text2("request_data"),
  // JSON string with request details
  responseData: text2("response_data"),
  // JSON string with response
  requestedAt: timestamp2("requested_at").defaultNow(),
  processedAt: timestamp2("processed_at"),
  expiresAt: timestamp2("expires_at")
});
var pharmacies = pgTable2("pharmacies", {
  id: serial("id").primaryKey(),
  name: varchar2("name").notNull(),
  type: varchar2("type").notNull(),
  // walgreens, cvs, truepill, local, custom
  address: text2("address"),
  phoneNumber: varchar2("phone_number"),
  hours: text2("hours"),
  website: varchar2("website"),
  // Pharmacy website for online refills
  refillUrl: varchar2("refill_url"),
  // Direct URL for online refill orders
  apiEndpoint: varchar2("api_endpoint"),
  isActive: boolean2("is_active").default(true),
  isCustom: boolean2("is_custom").default(false),
  // True if added by user
  createdBy: integer2("created_by"),
  // User ID who added this custom pharmacy
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var userPharmacies = pgTable2("user_pharmacies", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  pharmacyId: integer2("pharmacy_id").notNull().references(() => pharmacies.id),
  isPrimary: boolean2("is_primary").default(false),
  accountNumber: varchar2("account_number"),
  membershipId: varchar2("membership_id"),
  // Insurance or membership ID
  preferredPickupTime: varchar2("preferred_pickup_time"),
  // e.g., "morning", "afternoon", "evening"
  hasInsurance: boolean2("has_insurance").default(true),
  insuranceProvider: varchar2("insurance_provider"),
  insuranceGroupNumber: varchar2("insurance_group_number"),
  insuranceMemberId: varchar2("insurance_member_id"),
  autoRefillEnabled: boolean2("auto_refill_enabled").default(false),
  textNotifications: boolean2("text_notifications").default(true),
  emailNotifications: boolean2("email_notifications").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var medications = pgTable2("medications", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  prescriptionNumber: varchar2("prescription_number"),
  medicationName: varchar2("medication_name").notNull(),
  dosage: varchar2("dosage"),
  quantity: integer2("quantity"),
  refillsRemaining: integer2("refills_remaining").default(0),
  prescribedBy: varchar2("prescribed_by"),
  pharmacyId: integer2("pharmacy_id").references(() => pharmacies.id),
  lastFilled: timestamp2("last_filled"),
  nextRefillDate: timestamp2("next_refill_date"),
  instructions: text2("instructions"),
  // Pill appearance description fields
  pillColor: varchar2("pill_color"),
  pillShape: varchar2("pill_shape"),
  pillSize: varchar2("pill_size"),
  pillMarkings: text2("pill_markings"),
  pillDescription: text2("pill_description"),
  isActive: boolean2("is_active").default(true),
  reminderEnabled: boolean2("reminder_enabled").default(true),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var refillOrders = pgTable2("refill_orders", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  medicationId: integer2("medication_id").notNull().references(() => medications.id),
  pharmacyId: integer2("pharmacy_id").notNull().references(() => pharmacies.id),
  orderNumber: varchar2("order_number"),
  status: varchar2("status").notNull().default("pending"),
  // pending, processing, ready, picked_up, delivered
  orderDate: timestamp2("order_date").defaultNow(),
  readyDate: timestamp2("ready_date"),
  pickupMethod: varchar2("pickup_method").default("in_store"),
  // in_store, delivery, mail
  trackingNumber: varchar2("tracking_number"),
  totalCost: decimal2("total_cost"),
  insuranceCovered: decimal2("insurance_covered"),
  copay: decimal2("copay"),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var allergies = pgTable2("allergies", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  allergen: varchar2("allergen", { length: 255 }).notNull(),
  severity: varchar2("severity", { length: 50 }).notNull(),
  // mild, moderate, severe, life-threatening
  reaction: text2("reaction"),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var medicalConditions = pgTable2("medical_conditions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  condition: varchar2("condition", { length: 255 }).notNull(),
  diagnosedDate: timestamp2("diagnosed_date"),
  status: varchar2("status", { length: 50 }).notNull().default("active"),
  // active, inactive, resolved
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var adverseMedications = pgTable2("adverse_medications", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  medicationName: varchar2("medication_name", { length: 255 }).notNull(),
  reaction: text2("reaction").notNull(),
  severity: varchar2("severity", { length: 50 }).notNull(),
  // mild, moderate, severe, life-threatening
  reactionDate: timestamp2("reaction_date"),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var emergencyContacts = pgTable2("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: varchar2("name", { length: 255 }).notNull(),
  relationship: varchar2("relationship", { length: 100 }),
  phoneNumber: varchar2("phone_number", { length: 20 }).notNull(),
  email: varchar2("email", { length: 255 }),
  address: text2("address"),
  isPrimary: boolean2("is_primary").default(false),
  isEmergencyContact: boolean2("is_emergency_contact").default(true),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var primaryCareProviders = pgTable2("primary_care_providers", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: varchar2("name", { length: 255 }).notNull(),
  specialty: varchar2("specialty", { length: 100 }).notNull(),
  practiceName: varchar2("practice_name", { length: 255 }),
  phoneNumber: varchar2("phone_number", { length: 20 }).notNull(),
  email: varchar2("email", { length: 255 }),
  address: text2("address"),
  isPrimary: boolean2("is_primary").default(false),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var symptomEntries = pgTable2("symptom_entries", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  symptomName: varchar2("symptom_name", { length: 255 }).notNull(),
  severity: integer2("severity").notNull(),
  // 1-10 scale
  startTime: timestamp2("start_time").notNull(),
  endTime: timestamp2("end_time"),
  triggers: text2("triggers"),
  location: varchar2("location", { length: 255 }),
  description: text2("description"),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var personalResources = pgTable2("personal_resources", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  title: varchar2("title", { length: 200 }).notNull(),
  url: text2("url").notNull(),
  description: text2("description"),
  category: varchar2("category", { length: 50 }).notNull(),
  // music, videos, websites, apps, etc.
  tags: text2("tags"),
  // comma-separated tags for filtering
  isFavorite: boolean2("is_favorite").default(false),
  accessCount: integer2("access_count").default(0),
  createdAt: timestamp2("created_at").defaultNow(),
  lastAccessedAt: timestamp2("last_accessed_at")
});
var busSchedules = pgTable2("bus_schedules", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  routeName: varchar2("route_name", { length: 100 }).notNull(),
  routeNumber: varchar2("route_number", { length: 20 }),
  stopName: varchar2("stop_name", { length: 200 }).notNull(),
  stopAddress: text2("stop_address"),
  direction: varchar2("direction", { length: 50 }),
  // northbound, southbound, etc.
  departureTime: varchar2("departure_time", { length: 10 }).notNull(),
  // HH:MM format
  daysOfWeek: text2("days_of_week").notNull(),
  // comma-separated: monday,tuesday,etc
  isFrequent: boolean2("is_frequent").default(false),
  // for frequent/favorite routes
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var emergencyTreatmentPlans = pgTable2("emergency_treatment_plans", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  planName: varchar2("plan_name", { length: 200 }).notNull(),
  conditionType: varchar2("condition_type", { length: 100 }).notNull(),
  // seizure, anxiety, allergic reaction, etc.
  symptoms: text2("symptoms").notNull(),
  // what to watch for
  immediateActions: text2("immediate_actions").notNull(),
  // step-by-step response
  medications: text2("medications"),
  // emergency medications to use
  emergencyContacts: text2("emergency_contacts"),
  // specific contacts for this emergency
  hospitalPreference: varchar2("hospital_preference", { length: 200 }),
  importantNotes: text2("important_notes"),
  // allergies, medical info, etc.
  isActive: boolean2("is_active").default(true),
  lastReviewed: timestamp2("last_reviewed"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var geofences = pgTable2("geofences", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: varchar2("name", { length: 255 }).notNull(),
  latitude: decimal2("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal2("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer2("radius").notNull(),
  // in meters
  isActive: boolean2("is_active").default(true),
  notifyOnExit: boolean2("notify_on_exit").default(true),
  notifyOnEnter: boolean2("notify_on_enter").default(false),
  caregiverIds: integer2("caregiver_ids").array(),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var geofenceEvents = pgTable2("geofence_events", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  geofenceId: integer2("geofence_id").notNull().references(() => geofences.id),
  eventType: varchar2("event_type", { length: 50 }).notNull(),
  // 'enter' or 'exit'
  latitude: decimal2("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal2("longitude", { precision: 11, scale: 8 }).notNull(),
  timestamp: timestamp2("timestamp").defaultNow(),
  notificationSent: boolean2("notification_sent").default(false)
});
var insertUserSchema = createInsertSchema2(users).omit({
  id: true,
  streakDays: true,
  createdAt: true
});
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
var registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
  accountType: z.enum(["user", "caregiver"]).default("user")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var insertUserCaregiverConnectionSchema = createInsertSchema2(userCaregiverConnections).omit({
  id: true,
  connectedAt: true
});
var insertInvitationCodeSchema = createInsertSchema2(invitationCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  isUsed: true,
  usedByUserId: true
});
var insertDailyTaskSchema = createInsertSchema2(dailyTasks).omit({
  id: true,
  completedAt: true,
  lastCompleted: true,
  lastReminderSent: true,
  lastOverdueReminder: true
});
var insertBillSchema = createInsertSchema2(bills).omit({
  id: true
});
var insertMoodEntrySchema = createInsertSchema2(moodEntries).omit({
  id: true,
  entryDate: true
});
var insertAchievementSchema = createInsertSchema2(achievements).omit({
  id: true,
  earnedAt: true
});
var insertCaregiverSchema = createInsertSchema2(caregivers).omit({
  id: true
});
var insertMessageSchema = createInsertSchema2(messages).omit({
  id: true,
  sentAt: true
});
var insertBudgetEntrySchema = createInsertSchema2(budgetEntries).omit({
  id: true,
  entryDate: true,
  createdAt: true
});
var insertAppointmentSchema = createInsertSchema2(appointments).omit({
  id: true,
  createdAt: true
});
var insertMealPlanSchema = createInsertSchema2(mealPlans).omit({
  id: true,
  createdAt: true
});
var insertGroceryStoreSchema = createInsertSchema2(groceryStores).omit({
  id: true,
  createdAt: true
});
var insertShoppingListSchema = createInsertSchema2(shoppingLists).omit({
  id: true,
  addedDate: true,
  purchasedDate: true
});
var insertEmergencyResourceSchema = createInsertSchema2(emergencyResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserPrivacySettingsSchema = createInsertSchema2(userPrivacySettings).omit({
  id: true,
  consentDate: true,
  lastUpdated: true
});
var insertDataAccessRequestSchema = createInsertSchema2(dataAccessRequests).omit({
  id: true,
  requestedAt: true,
  processedAt: true,
  expiresAt: true
});
var insertPharmacySchema = createInsertSchema2(pharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserPharmacySchema = createInsertSchema2(userPharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMedicationSchema = createInsertSchema2(medications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertRefillOrderSchema = createInsertSchema2(refillOrders).omit({
  id: true,
  orderDate: true,
  createdAt: true,
  updatedAt: true
});
var insertAllergySchema = createInsertSchema2(allergies).omit({
  id: true,
  createdAt: true
});
var insertMedicalConditionSchema = createInsertSchema2(medicalConditions).omit({
  id: true,
  createdAt: true
});
var insertAdverseMedicationSchema = createInsertSchema2(adverseMedications).omit({
  id: true,
  createdAt: true
});
var insertEmergencyContactSchema = createInsertSchema2(emergencyContacts).omit({
  id: true,
  createdAt: true
});
var insertPrimaryCareProviderSchema = createInsertSchema2(primaryCareProviders).omit({
  id: true,
  createdAt: true
});
var insertSymptomEntrySchema = createInsertSchema2(symptomEntries).omit({
  id: true,
  userId: true,
  createdAt: true
});
var insertPersonalResourceSchema = createInsertSchema2(personalResources).omit({
  id: true,
  accessCount: true,
  createdAt: true,
  lastAccessedAt: true
});
var insertBusScheduleSchema = createInsertSchema2(busSchedules).omit({
  id: true,
  createdAt: true
});
var insertEmergencyTreatmentPlanSchema = createInsertSchema2(emergencyTreatmentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReviewed: true
});
var insertGeofenceSchema = createInsertSchema2(geofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertGeofenceEventSchema = createInsertSchema2(geofenceEvents).omit({
  id: true,
  timestamp: true
});
var insertFeedbackSchema = createInsertSchema2(feedback);
var insertBankAccountSchema2 = createInsertSchema2(bankAccounts2).omit({
  id: true,
  accountName: true,
  // This is auto-generated from nickname or bankName
  balance: true,
  createdAt: true,
  updatedAt: true
});
var insertSavingsGoalSchema = createInsertSchema2(savingsGoals).omit({
  id: true,
  currentAmount: true,
  isCompleted: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true
});
var insertSavingsTransactionSchema = createInsertSchema2(savingsTransactions).omit({
  id: true,
  createdAt: true
});
var insertBudgetCategorySchema = createInsertSchema2(budgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var notifications = pgTable2("notifications", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  type: text2("type").notNull(),
  // "task_reminder", "appointment", "medication", "achievement", "streak"
  title: text2("title").notNull(),
  message: text2("message").notNull(),
  isRead: boolean2("is_read").default(false),
  scheduledFor: timestamp2("scheduled_for"),
  sentAt: timestamp2("sent_at"),
  relatedId: integer2("related_id"),
  // Related task/appointment ID
  priority: text2("priority").default("normal"),
  // "low", "normal", "high", "urgent"
  createdAt: timestamp2("created_at").defaultNow()
});
var userPreferences = pgTable2("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().unique().references(() => users.id),
  notificationSettings: jsonb("notification_settings").default({}),
  // Push, email, SMS preferences
  reminderTiming: jsonb("reminder_timing").default({}),
  // Custom reminder schedules
  themeSettings: jsonb("theme_settings").default({}),
  // Colors, layout preferences
  accessibilitySettings: jsonb("accessibility_settings").default({}),
  // Voice, text size, etc.
  behaviorPatterns: jsonb("behavior_patterns").default({}),
  // Learned user patterns
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var paymentAnalytics = pgTable2("payment_analytics", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  eventType: text2("event_type").notNull(),
  // 'method_selected', 'plaid_connection', 'payment_processed', 'link_clicked', 'api_call'
  paymentMethod: text2("payment_method"),
  // 'link', 'autopay'
  billId: integer2("bill_id").references(() => bills.id, { onDelete: "cascade" }),
  plaidApiCall: text2("plaid_api_call"),
  // 'link_token', 'account_balance', 'payment_initiate', etc.
  estimatedCost: decimal2("estimated_cost", { precision: 10, scale: 4 }),
  // Cost in dollars for Plaid API calls
  metadata: json2("metadata"),
  // Additional context
  createdAt: timestamp2("created_at").defaultNow().notNull()
});
var insertPaymentAnalyticsSchema = createInsertSchema2(paymentAnalytics).omit({
  id: true,
  createdAt: true
});
var userAchievements = pgTable2("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  achievementType: text2("achievement_type").notNull(),
  // "task_streak", "mood_consistency", "milestone"
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  iconName: text2("icon_name").notNull(),
  earnedAt: timestamp2("earned_at").defaultNow(),
  category: text2("category").notNull(),
  // "daily_tasks", "mood", "financial", "health"
  points: integer2("points").default(0),
  level: integer2("level").default(1)
});
var streakTracking = pgTable2("streak_tracking", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  streakType: text2("streak_type").notNull(),
  // "daily_tasks", "mood_check", "exercise", "medication"
  currentStreak: integer2("current_streak").default(0),
  longestStreak: integer2("longest_streak").default(0),
  lastActivityDate: date("last_activity_date"),
  isActive: boolean2("is_active").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var voiceInteractions = pgTable2("voice_interactions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  command: text2("command").notNull(),
  transcript: text2("transcript").notNull(),
  action: text2("action").notNull(),
  // "add_task", "complete_task", "mood_entry", "navigate"
  success: boolean2("success").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var quickResponses = pgTable2("quick_responses", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  messageTemplate: text2("message_template").notNull(),
  category: text2("category").notNull(),
  // "greeting", "emergency", "status", "request"
  useCount: integer2("use_count").default(0),
  isActive: boolean2("is_active").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var messageReactions = pgTable2("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer2("message_id").notNull().references(() => messages.id),
  userId: integer2("user_id").notNull().references(() => users.id),
  emoji: text2("emoji").notNull(),
  // "👍", "❤️", "😊", etc.
  createdAt: timestamp2("created_at").defaultNow()
});
var calendarEvents = pgTable2("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  title: text2("title").notNull(),
  description: text2("description"),
  startDate: timestamp2("start_date").notNull(),
  endDate: timestamp2("end_date"),
  allDay: boolean2("all_day").default(false),
  category: text2("category").default("personal"),
  // "personal", "work", "health", "social", "education"
  color: text2("color").default("#3b82f6"),
  // Hex color for event display
  location: text2("location"),
  isRecurring: boolean2("is_recurring").default(false),
  recurrenceRule: text2("recurrence_rule"),
  // "daily", "weekly", "monthly", "yearly"
  reminderMinutes: integer2("reminder_minutes"),
  // Minutes before event to remind
  isCompleted: boolean2("is_completed").default(false),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var activityPatterns = pgTable2("activity_patterns", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  activityType: text2("activity_type").notNull(),
  // "task_completion", "mood_entry", "app_usage"
  timeOfDay: time("time_of_day"),
  dayOfWeek: integer2("day_of_week"),
  // 0-6 (Sunday-Saturday)
  frequency: integer2("frequency").default(1),
  lastUpdated: timestamp2("last_updated").defaultNow()
});
var academicClasses = pgTable2("academic_classes", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  className: text2("class_name").notNull(),
  instructor: text2("instructor"),
  room: text2("room"),
  building: text2("building"),
  dayOfWeek: integer2("day_of_week").notNull(),
  // 0-6 (Sunday-Saturday)
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  semester: text2("semester").notNull(),
  // "Fall 2025", "Spring 2026"
  credits: integer2("credits"),
  isActive: boolean2("is_active").default(true),
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var studySessions = pgTable2("study_sessions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  classId: integer2("class_id").references(() => academicClasses.id),
  subject: text2("subject").notNull(),
  duration: integer2("duration").notNull(),
  technique: text2("technique"),
  // "pomodoro", "focused", "review", "practice"
  location: text2("location"),
  // "library", "dorm", "study_hall"
  effectiveness: integer2("effectiveness"),
  // 1-5 scale
  notes: text2("notes"),
  startedAt: timestamp2("started_at").defaultNow(),
  completedAt: timestamp2("completed_at")
});
var assignments = pgTable2("assignments", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  classId: integer2("class_id").references(() => academicClasses.id),
  title: text2("title").notNull(),
  description: text2("description"),
  type: text2("type").notNull(),
  // "homework", "project", "exam", "quiz", "paper"
  dueDate: timestamp2("due_date").notNull(),
  estimatedHours: integer2("estimated_hours"),
  priority: text2("priority").default("medium"),
  // "low", "medium", "high", "urgent"
  status: text2("status").default("not_started"),
  // "not_started", "in_progress", "completed", "submitted"
  grade: text2("grade"),
  submittedAt: timestamp2("submitted_at"),
  createdAt: timestamp2("created_at").defaultNow()
});
var campusLocations = pgTable2("campus_locations", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: text2("name").notNull(),
  building: text2("building"),
  floor: text2("floor"),
  description: text2("description"),
  category: text2("category").notNull().default("academic"),
  createdAt: timestamp2("created_at").defaultNow()
});
var campusTransport = pgTable2("campus_transport", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  routeName: text2("route_name").notNull(),
  fromStop: text2("from_stop").notNull(),
  toStop: text2("to_stop"),
  departureTime: text2("departure_time"),
  estimatedDuration: integer2("estimated_duration").default(15),
  createdAt: timestamp2("created_at").defaultNow()
});
var studyGroups = pgTable2("study_groups", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  classId: integer2("class_id").references(() => academicClasses.id),
  groupName: text2("group_name").notNull(),
  meetingTime: timestamp2("meeting_time"),
  location: text2("location"),
  members: text2("members").array(),
  // Names or contact info
  topics: text2("topics").array(),
  // Study topics
  isRecurring: boolean2("is_recurring").default(false),
  recurringPattern: text2("recurring_pattern"),
  // "weekly", "biweekly"
  notes: text2("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var academicResources = pgTable2("academic_resources", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  classId: integer2("class_id").references(() => academicClasses.id),
  title: text2("title").notNull(),
  type: text2("type").notNull(),
  // "textbook", "website", "video", "tutorial", "practice_test"
  url: text2("url"),
  description: text2("description"),
  rating: integer2("rating"),
  // 1-5 scale
  tags: text2("tags").array(),
  isFavorite: boolean2("is_favorite").default(false),
  accessCount: integer2("access_count").default(0),
  lastAccessed: timestamp2("last_accessed"),
  createdAt: timestamp2("created_at").defaultNow()
});
var transitionSkills = pgTable2("transition_skills", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  skillCategory: text2("skill_category").notNull(),
  // "academic", "social", "independent_living", "career"
  skillName: text2("skill_name").notNull(),
  description: text2("description"),
  currentLevel: integer2("current_level").default(1),
  // 1-5 scale
  targetLevel: integer2("target_level").default(5),
  practiceActivities: text2("practice_activities").array(),
  milestones: jsonb("milestones").default("[]"),
  // Array of completed milestones
  lastPracticed: timestamp2("last_practiced"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var taskTemplates = pgTable2("task_templates", {
  id: serial("id").primaryKey(),
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  category: text2("category").notNull(),
  // "cooking", "cleaning", "personal_care", "social", "work"
  difficulty: text2("difficulty").notNull().default("beginner"),
  // "beginner", "intermediate", "advanced"
  estimatedMinutes: integer2("estimated_minutes").notNull(),
  icon: text2("icon").default("CheckSquare"),
  // Lucide icon name
  color: text2("color").default("blue"),
  isPublic: boolean2("is_public").default(true),
  createdBy: integer2("created_by"),
  // user who created template
  createdAt: timestamp2("created_at").defaultNow()
});
var taskSteps = pgTable2("task_steps", {
  id: serial("id").primaryKey(),
  templateId: integer2("template_id").notNull().references(() => taskTemplates.id),
  stepNumber: integer2("step_number").notNull(),
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  visualAid: text2("visual_aid"),
  // Icon or image description
  estimatedMinutes: integer2("estimated_minutes").default(1),
  tips: text2("tips"),
  // Helpful tips for this step
  safetyNotes: text2("safety_notes")
  // Important safety information
});
var userTaskInstances = pgTable2("user_task_instances", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  templateId: integer2("template_id").notNull().references(() => taskTemplates.id),
  currentStep: integer2("current_step").default(1),
  isCompleted: boolean2("is_completed").default(false),
  startedAt: timestamp2("started_at").defaultNow(),
  completedAt: timestamp2("completed_at"),
  notes: text2("notes"),
  difficulty: text2("difficulty").notNull(),
  // User can adjust difficulty
  stepProgress: jsonb("step_progress").default("{}")
  // Track individual step completion
});
var skillAssessments = pgTable2("skill_assessments", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  skillCategory: text2("skill_category").notNull(),
  // "daily_living", "social", "academic", "work", "safety"
  skillName: text2("skill_name").notNull(),
  currentLevel: integer2("current_level").default(1),
  // 1-5 scale
  targetLevel: integer2("target_level").default(5),
  assessmentDate: timestamp2("assessment_date").defaultNow(),
  assessedBy: text2("assessed_by"),
  // "self", "caregiver", "therapist"
  notes: text2("notes"),
  recommendedActivities: text2("recommended_activities").array(),
  nextAssessment: timestamp2("next_assessment")
});
var visualRoutines = pgTable2("visual_routines", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  routineName: text2("routine_name").notNull(),
  routineType: text2("routine_type").notNull(),
  // "morning", "evening", "work", "social", "custom"
  isActive: boolean2("is_active").default(true),
  estimatedMinutes: integer2("estimated_minutes"),
  reminderTime: time("reminder_time"),
  steps: jsonb("steps").notNull().default("[]"),
  // Array of routine steps with visuals
  completionCount: integer2("completion_count").default(0),
  lastCompleted: timestamp2("last_completed"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var wearableDevices = pgTable2("wearable_devices", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  name: text2("name").notNull(),
  // "Apple Watch Series 9", "Fitbit Sense 2"
  type: text2("type").notNull(),
  // "smartwatch", "fitness_tracker", "health_monitor"
  brand: text2("brand").notNull(),
  // "apple", "fitbit", "garmin", "samsung"
  model: text2("model").notNull(),
  deviceId: text2("device_id").unique(),
  // External device identifier
  isConnected: boolean2("is_connected").default(false),
  lastSync: timestamp2("last_sync"),
  batteryLevel: integer2("battery_level"),
  // 0-100
  firmwareVersion: text2("firmware_version"),
  features: text2("features").array(),
  // ["heart_rate", "steps", "sleep", "location"]
  syncFrequency: text2("sync_frequency").default("automatic"),
  // "automatic", "manual", "hourly", "daily"
  isActive: boolean2("is_active").default(true),
  notes: text2("notes"),
  pairedAt: timestamp2("paired_at").defaultNow()
});
var healthMetrics = pgTable2("health_metrics", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  deviceId: integer2("device_id").references(() => wearableDevices.id),
  metricType: text2("metric_type").notNull(),
  // "heart_rate", "steps", "sleep", "calories", "stress"
  value: decimal2("value", { precision: 10, scale: 2 }).notNull(),
  unit: text2("unit").notNull(),
  // "bpm", "steps", "hours", "calories", "percentage"
  recordedAt: timestamp2("recorded_at").notNull(),
  context: text2("context"),
  // "resting", "exercise", "deep_sleep", "light_sleep"
  accuracy: text2("accuracy").default("good"),
  // "poor", "fair", "good", "excellent"
  source: text2("source").default("automatic"),
  // "automatic", "manual", "estimated"
  notes: text2("notes"),
  syncedAt: timestamp2("synced_at").defaultNow()
});
var activitySessions = pgTable2("activity_sessions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  deviceId: integer2("device_id").references(() => wearableDevices.id),
  activityType: text2("activity_type").notNull(),
  // "walking", "running", "cycling", "swimming", "workout"
  duration: integer2("duration_minutes").notNull(),
  distance: decimal2("distance", { precision: 8, scale: 2 }),
  // in meters
  caloriesBurned: integer2("calories_burned"),
  averageHeartRate: integer2("average_heart_rate"),
  maxHeartRate: integer2("max_heart_rate"),
  steps: integer2("steps"),
  startedAt: timestamp2("started_at").notNull(),
  completedAt: timestamp2("completed_at"),
  location: text2("location"),
  // "Home", "Gym", "Park"
  intensity: text2("intensity"),
  // "light", "moderate", "vigorous"
  notes: text2("notes"),
  syncedAt: timestamp2("synced_at").defaultNow()
});
var sleepSessions = pgTable2("sleep_sessions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  deviceId: integer2("device_id").references(() => wearableDevices.id),
  sleepDate: date("sleep_date").notNull(),
  // The night's date
  bedtime: timestamp2("bedtime"),
  sleepTime: timestamp2("sleep_time"),
  // When actually fell asleep
  wakeTime: timestamp2("wake_time"),
  totalSleepDuration: integer2("total_sleep_duration"),
  // minutes
  deepSleepDuration: integer2("deep_sleep_duration"),
  // minutes
  lightSleepDuration: integer2("light_sleep_duration"),
  // minutes
  remSleepDuration: integer2("rem_sleep_duration"),
  // minutes
  awakeDuration: integer2("awake_duration"),
  // minutes awake during night
  sleepEfficiency: decimal2("sleep_efficiency", { precision: 5, scale: 2 }),
  // percentage
  sleepScore: integer2("sleep_score"),
  // 0-100
  heartRateVariability: integer2("heart_rate_variability"),
  restingHeartRate: integer2("resting_heart_rate"),
  quality: text2("quality"),
  // "poor", "fair", "good", "excellent"
  notes: text2("notes"),
  syncedAt: timestamp2("synced_at").defaultNow()
});
var wearableAlerts = pgTable2("wearable_alerts", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  deviceId: integer2("device_id").references(() => wearableDevices.id),
  alertType: text2("alert_type").notNull(),
  // "medication", "hydration", "movement", "heart_rate", "fall_detection"
  title: text2("title").notNull(),
  message: text2("message").notNull(),
  priority: text2("priority").default("medium"),
  // "low", "medium", "high", "emergency"
  isRead: boolean2("is_read").default(false),
  isAcknowledged: boolean2("is_acknowledged").default(false),
  triggerValue: text2("trigger_value"),
  // The metric value that triggered alert
  actionTaken: text2("action_taken"),
  // What user did in response
  triggeredAt: timestamp2("triggered_at").notNull(),
  acknowledgedAt: timestamp2("acknowledged_at"),
  resolvedAt: timestamp2("resolved_at")
});
var wearableSettings = pgTable2("wearable_settings", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  deviceId: integer2("device_id").references(() => wearableDevices.id),
  settingName: text2("setting_name").notNull(),
  // "heart_rate_alerts", "step_goal", "sleep_goal"
  settingValue: text2("setting_value").notNull(),
  isEnabled: boolean2("is_enabled").default(true),
  lastModified: timestamp2("last_modified").defaultNow(),
  modifiedBy: text2("modified_by")
  // "user" or "caregiver"
});
var insertNotificationSchema = createInsertSchema2(notifications).omit({
  id: true,
  sentAt: true,
  createdAt: true
});
var insertUserPreferencesSchema = createInsertSchema2(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserAchievementSchema = createInsertSchema2(userAchievements).omit({
  id: true,
  earnedAt: true
});
var insertStreakTrackingSchema = createInsertSchema2(streakTracking).omit({
  id: true,
  createdAt: true
});
var insertVoiceInteractionSchema = createInsertSchema2(voiceInteractions).omit({
  id: true,
  createdAt: true
});
var insertQuickResponseSchema = createInsertSchema2(quickResponses).omit({
  id: true,
  useCount: true,
  createdAt: true
});
var insertMessageReactionSchema = createInsertSchema2(messageReactions).omit({
  id: true,
  createdAt: true
});
var insertActivityPatternSchema = createInsertSchema2(activityPatterns).omit({
  id: true,
  lastUpdated: true
});
var insertCalendarEventSchema = createInsertSchema2(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAcademicClassSchema = createInsertSchema2(academicClasses).omit({
  id: true,
  createdAt: true
});
var insertStudySessionSchema = createInsertSchema2(studySessions).omit({
  id: true,
  startedAt: true
});
var insertAssignmentSchema = createInsertSchema2(assignments).omit({
  id: true,
  createdAt: true
});
var insertCampusLocationSchema = createInsertSchema2(campusLocations).omit({
  id: true,
  createdAt: true
});
var insertCampusTransportSchema = createInsertSchema2(campusTransport).omit({
  id: true
});
var insertStudyGroupSchema = createInsertSchema2(studyGroups).omit({
  id: true,
  createdAt: true
});
var insertAcademicResourceSchema = createInsertSchema2(academicResources).omit({
  id: true,
  accessCount: true,
  createdAt: true
});
var insertTransitionSkillSchema = createInsertSchema2(transitionSkills).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCaregiverPermissionSchema = createInsertSchema2(caregiverPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLockedUserSettingSchema = createInsertSchema2(lockedUserSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCaregiverInvitationSchema = createInsertSchema2(caregiverInvitations).omit({
  id: true,
  createdAt: true
});
var insertCareRelationshipSchema = createInsertSchema2(careRelationships).omit({
  id: true,
  establishedAt: true
});
var personalDocuments = pgTable2("personal_documents", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull(),
  title: text2("title").notNull(),
  category: text2("category").notNull(),
  // "insurance", "medical", "vehicle", "financial", "personal", "emergency"
  description: text2("description"),
  documentType: text2("document_type").notNull(),
  // "text", "number", "date", "image", "file", "link"
  content: text2("content"),
  // For text/number content
  imageUrl: text2("image_url"),
  // For image storage
  fileName: text2("file_name"),
  // For file uploads
  linkUrl: text2("link_url"),
  // For web links/URLs
  tags: text2("tags").array(),
  // For searchability
  isImportant: boolean2("is_important").default(false),
  expirationDate: date("expiration_date"),
  // For documents that expire
  reminderDays: integer2("reminder_days"),
  // Days before expiration to remind
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var insertPersonalDocumentSchema = createInsertSchema2(personalDocuments).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true
});
var rewards = pgTable2("rewards", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  caregiverId: integer2("caregiver_id").notNull().references(() => users.id),
  title: text2("title").notNull(),
  description: text2("description").notNull(),
  pointsRequired: integer2("points_required").notNull(),
  category: text2("category").notNull(),
  // "privilege", "item", "activity", "money", "special"
  rewardType: text2("reward_type").notNull(),
  // "immediate", "delayed", "recurring"
  value: text2("value"),
  // Monetary value or description
  isActive: boolean2("is_active").default(true),
  maxRedemptions: integer2("max_redemptions"),
  // null = unlimited
  currentRedemptions: integer2("current_redemptions").default(0),
  expiresAt: timestamp2("expires_at"),
  iconName: text2("icon_name").default("gift"),
  color: text2("color").default("#3b82f6"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var rewardRedemptions = pgTable2("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  rewardId: integer2("reward_id").notNull().references(() => rewards.id),
  pointsSpent: integer2("points_spent").notNull(),
  status: text2("status").default("pending"),
  // "pending", "approved", "denied", "completed"
  redeemedAt: timestamp2("redeemed_at").defaultNow(),
  fulfilledAt: timestamp2("fulfilled_at"),
  // matches actual DB column name
  notes: text2("notes")
});
var pointsTransactions = pgTable2("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  points: integer2("points").notNull(),
  // positive for earning, negative for spending
  transactionType: text2("transaction_type").notNull(),
  // "task_completion", "mood_entry", "streak_bonus", "reward_redemption", "manual_adjustment"
  source: text2("source").notNull(),
  description: text2("description").notNull(),
  awardedBy: integer2("awarded_by").references(() => users.id),
  // caregiver who awarded points
  createdAt: timestamp2("created_at").defaultNow()
});
var userPointsBalance = pgTable2("user_points_balance", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().unique().references(() => users.id),
  totalPoints: integer2("total_points").default(0),
  availablePoints: integer2("available_points").default(0),
  // total - spent
  lifetimeEarned: integer2("lifetime_earned").default(0),
  lifetimeSpent: integer2("lifetime_spent").default(0),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var insertTaskTemplateSchema = createInsertSchema2(taskTemplates).omit({
  id: true,
  createdAt: true
});
var insertTaskStepSchema = createInsertSchema2(taskSteps).omit({
  id: true
});
var insertUserTaskInstanceSchema = createInsertSchema2(userTaskInstances).omit({
  id: true,
  startedAt: true
});
var insertSkillAssessmentSchema = createInsertSchema2(skillAssessments).omit({
  id: true,
  assessmentDate: true
});
var insertVisualRoutineSchema = createInsertSchema2(visualRoutines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertWearableDeviceSchema = createInsertSchema2(wearableDevices).omit({
  id: true,
  pairedAt: true
});
var insertHealthMetricSchema = createInsertSchema2(healthMetrics).omit({
  id: true,
  syncedAt: true
});
var insertActivitySessionSchema = createInsertSchema2(activitySessions).omit({
  id: true,
  syncedAt: true
});
var insertSleepSessionSchema = createInsertSchema2(sleepSessions).omit({
  id: true,
  syncedAt: true
});
var insertWearableAlertSchema = createInsertSchema2(wearableAlerts).omit({
  id: true
});
var insertWearableSettingSchema = createInsertSchema2(wearableSettings).omit({
  id: true,
  lastModified: true
});
var subscriptions = pgTable2("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer2("user_id").notNull().references(() => users.id),
  planType: text2("plan_type").notNull(),
  // "free", "premium", "family"
  billingCycle: text2("billing_cycle").default("monthly"),
  // "monthly", "annual"
  status: text2("status").notNull().default("active"),
  // "active", "cancelled", "past_due", "trialing"
  currentPeriodStart: timestamp2("current_period_start").notNull(),
  currentPeriodEnd: timestamp2("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean2("cancel_at_period_end").default(false),
  trialStart: timestamp2("trial_start"),
  trialEnd: timestamp2("trial_end"),
  stripeCustomerId: text2("stripe_customer_id"),
  stripeSubscriptionId: text2("stripe_subscription_id"),
  priceId: text2("price_id"),
  amount: integer2("amount"),
  // in cents
  currency: text2("currency").default("usd"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var subscriptionUsage = pgTable2("subscription_usage", {
  id: serial("id").primaryKey(),
  subscriptionId: integer2("subscription_id").notNull().references(() => subscriptions.id),
  featureName: text2("feature_name").notNull(),
  // "tasks", "caregivers", "data_export"
  usageCount: integer2("usage_count").default(0),
  usageLimit: integer2("usage_limit"),
  // null for unlimited
  resetPeriod: text2("reset_period").default("monthly"),
  // "monthly", "annual", "never"
  lastReset: timestamp2("last_reset").defaultNow(),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var paymentHistory = pgTable2("payment_history", {
  id: serial("id").primaryKey(),
  subscriptionId: integer2("subscription_id").notNull().references(() => subscriptions.id),
  stripePaymentIntentId: text2("stripe_payment_intent_id"),
  amount: integer2("amount").notNull(),
  // in cents
  currency: text2("currency").default("usd"),
  status: text2("status").notNull(),
  // "succeeded", "failed", "pending"
  paymentMethod: text2("payment_method"),
  // "card", "bank_transfer"
  description: text2("description"),
  failureReason: text2("failure_reason"),
  paidAt: timestamp2("paid_at"),
  createdAt: timestamp2("created_at").defaultNow()
});
var insertSubscriptionSchema = createInsertSchema2(subscriptions);
var insertSubscriptionUsageSchema = createInsertSchema2(subscriptionUsage);
var insertPaymentHistorySchema = createInsertSchema2(paymentHistory);
var insertRewardSchema = createInsertSchema2(rewards).omit({
  id: true,
  currentRedemptions: true,
  createdAt: true,
  updatedAt: true
});
var insertRewardRedemptionSchema = createInsertSchema2(rewardRedemptions).omit({
  id: true,
  redeemedAt: true
});
var insertPointsTransactionSchema = createInsertSchema2(pointsTransactions).omit({
  id: true,
  createdAt: true
});
var insertUserPointsBalanceSchema = createInsertSchema2(userPointsBalance).omit({
  id: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, gte, lte, desc, gt } from "drizzle-orm";
var DatabaseStorage = class {
  currentUser = null;
  getCurrentUser() {
    return this.currentUser;
  }
  setCurrentUser(user) {
    this.currentUser = user;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(userId, updates) {
    const [user] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
  async updateUserStreak(userId, streakDays) {
    const [user] = await db.update(users).set({ streakDays }).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
  async updateUserSubscription(userId, subscriptionData) {
    const [user] = await db.update(users).set(subscriptionData).where(eq(users.id, userId)).returning();
    return user || void 0;
  }
  async authenticateUser(username, password) {
    const [user] = await db.select().from(users).where(and(eq(users.username, username), eq(users.password, password)));
    return user || null;
  }
  async getDailyTasksByUser(userId) {
    return await db.select().from(dailyTasks).where(eq(dailyTasks.userId, userId));
  }
  async getTaskById(taskId) {
    const [task] = await db.select().from(dailyTasks).where(eq(dailyTasks.id, taskId));
    return task || void 0;
  }
  async createDailyTask(insertTask) {
    const [task] = await db.insert(dailyTasks).values(insertTask).returning();
    return task;
  }
  async updateDailyTask(taskId, updates) {
    const [task] = await db.update(dailyTasks).set(updates).where(eq(dailyTasks.id, taskId)).returning();
    return task || void 0;
  }
  async updateTaskCompletion(taskId, isCompleted) {
    const [task] = await db.update(dailyTasks).set({
      isCompleted,
      completedAt: isCompleted ? /* @__PURE__ */ new Date() : null
    }).where(eq(dailyTasks.id, taskId)).returning();
    return task || void 0;
  }
  async getBillsByUser(userId) {
    return await db.select().from(bills).where(eq(bills.userId, userId));
  }
  async getBill(billId) {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    return bill || void 0;
  }
  async createBill(insertBill) {
    const [bill] = await db.insert(bills).values(insertBill).returning();
    return bill;
  }
  async updateBill(billId, updates) {
    const [bill] = await db.update(bills).set(updates).where(eq(bills.id, billId)).returning();
    return bill || void 0;
  }
  async updateBillPayment(billId, isPaid) {
    const [bill] = await db.update(bills).set({ isPaid }).where(eq(bills.id, billId)).returning();
    return bill || void 0;
  }
  async getBankAccountsByUser(userId) {
    return await db.select().from(bankAccounts2).where(eq(bankAccounts2.userId, userId));
  }
  async createBankAccount(insertAccount) {
    const accountData = {
      userId: insertAccount.userId,
      accountName: insertAccount.accountNickname || insertAccount.bankName,
      bankName: insertAccount.bankName,
      accountType: insertAccount.accountType,
      accountNickname: insertAccount.accountNickname,
      bankWebsite: insertAccount.bankWebsite,
      lastFour: insertAccount.lastFour,
      balance: 0,
      isActive: true
    };
    const [account] = await db.insert(bankAccounts2).values(accountData).returning();
    return account;
  }
  async deleteBankAccount(accountId) {
    const result = await db.delete(bankAccounts2).where(eq(bankAccounts2.id, accountId)).returning();
    return result.length > 0;
  }
  async getMoodEntriesByUser(userId) {
    return await db.select().from(moodEntries).where(eq(moodEntries.userId, userId));
  }
  async createMoodEntry(insertEntry) {
    const entryWithDate = {
      ...insertEntry,
      entryDate: insertEntry.entryDate || /* @__PURE__ */ new Date()
    };
    console.log(`Creating mood entry for user ${entryWithDate.userId} at ${entryWithDate.entryDate?.toISOString()}`);
    const [entry] = await db.insert(moodEntries).values(entryWithDate).returning();
    return entry;
  }
  async getTodayMoodEntry(userId) {
    const now = /* @__PURE__ */ new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    console.log(`Checking mood entry for user ${userId} between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
    const [entry] = await db.select().from(moodEntries).where(
      and(
        eq(moodEntries.userId, userId),
        gte(moodEntries.entryDate, startOfDay),
        lte(moodEntries.entryDate, endOfDay)
      )
    ).orderBy(desc(moodEntries.entryDate)).limit(1);
    return entry || void 0;
  }
  async getAchievementsByUser(userId) {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }
  async createAchievement(insertAchievement) {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }
  async createFeedback(insertFeedback) {
    const [feedbackEntry] = await db.insert(feedback).values(insertFeedback).returning();
    return feedbackEntry;
  }
  // Notifications
  async getNotificationsByUser(userId) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }
  async createNotification(notification) {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }
  async markNotificationAsRead(notificationId, userId) {
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }
  // User Preferences
  async getUserPreferences(userId) {
    const [result] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result;
  }
  async updateUserPreferences(userId, preferences) {
    const existing2 = await this.getUserPreferences(userId);
    if (existing2) {
      const [result] = await db.update(userPreferences).set({ ...preferences, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userPreferences.userId, userId)).returning();
      return result;
    } else {
      const [result] = await db.insert(userPreferences).values({ userId, ...preferences }).returning();
      return result;
    }
  }
  async getCaregiversByUser(userId) {
    return await db.select().from(caregivers).where(eq(caregivers.userId, userId));
  }
  async createCaregiver(insertCaregiver) {
    const [caregiver] = await db.insert(caregivers).values(insertCaregiver).returning();
    return caregiver;
  }
  async getMessagesByUser(userId) {
    return await db.select().from(messages).where(eq(messages.userId, userId));
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async getBudgetEntriesByUser(userId) {
    try {
      return await db.select().from(budgetEntries).where(eq(budgetEntries.userId, userId));
    } catch (error) {
      console.error("Error in getBudgetEntriesByUser:", error);
      throw error;
    }
  }
  async createBudgetEntry(insertEntry) {
    try {
      const [entry] = await db.insert(budgetEntries).values(insertEntry).returning();
      return entry;
    } catch (error) {
      console.error("Error in createBudgetEntry:", error);
      throw error;
    }
  }
  // Budget Categories
  async getBudgetCategoriesByUser(userId) {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.userId, userId));
  }
  async createBudgetCategory(insertCategory) {
    const [category] = await db.insert(budgetCategories).values(insertCategory).returning();
    return category;
  }
  async updateBudgetCategory(categoryId, updates) {
    const [category] = await db.update(budgetCategories).set(updates).where(eq(budgetCategories.id, categoryId)).returning();
    return category || void 0;
  }
  async deleteBudgetCategory(categoryId) {
    const result = await db.delete(budgetCategories).where(eq(budgetCategories.id, categoryId));
    return result.rowCount > 0;
  }
  // Savings Goals
  async getSavingsGoalsByUser(userId) {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
  }
  async getSavingsGoal(goalId) {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, goalId));
    return goal || void 0;
  }
  async createSavingsGoal(insertGoal) {
    const [goal] = await db.insert(savingsGoals).values(insertGoal).returning();
    return goal;
  }
  async updateSavingsGoal(goalId, updates) {
    const [goal] = await db.update(savingsGoals).set(updates).where(eq(savingsGoals.id, goalId)).returning();
    return goal || void 0;
  }
  async updateSavingsGoalAmount(goalId, currentAmount) {
    const [goal] = await db.update(savingsGoals).set({
      currentAmount,
      isCompleted: currentAmount >= 0 ? void 0 : false,
      // Only check if we have the target amount
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(savingsGoals.id, goalId)).returning();
    return goal || void 0;
  }
  async deleteSavingsGoal(goalId) {
    const result = await db.delete(savingsGoals).where(eq(savingsGoals.id, goalId));
    return result.rowCount > 0;
  }
  // Savings Transactions
  async getSavingsTransactionsByUser(userId) {
    return await db.select().from(savingsTransactions).where(eq(savingsTransactions.userId, userId));
  }
  async getSavingsTransactionsByGoal(goalId) {
    return await db.select().from(savingsTransactions).where(eq(savingsTransactions.savingsGoalId, goalId));
  }
  async createSavingsTransaction(insertTransaction) {
    const [transaction] = await db.insert(savingsTransactions).values(insertTransaction).returning();
    if (insertTransaction.savingsGoalId && insertTransaction.amount) {
      const [currentGoal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, insertTransaction.savingsGoalId));
      if (currentGoal) {
        const newAmount = (currentGoal.currentAmount || 0) + insertTransaction.amount;
        const isCompleted = newAmount >= (currentGoal.targetAmount || 0);
        await db.update(savingsGoals).set({
          currentAmount: newAmount,
          isCompleted,
          completedAt: isCompleted ? /* @__PURE__ */ new Date() : null,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(savingsGoals.id, insertTransaction.savingsGoalId));
      }
    }
    return transaction;
  }
  async getAppointmentsByUser(userId) {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }
  async createAppointment(insertAppointment) {
    const [appointment] = await db.insert(appointments).values(insertAppointment).returning();
    return appointment;
  }
  async updateAppointmentCompletion(appointmentId, isCompleted) {
    const [appointment] = await db.update(appointments).set({ isCompleted }).where(eq(appointments.id, appointmentId)).returning();
    return appointment || void 0;
  }
  async getUpcomingAppointments(userId) {
    const now = /* @__PURE__ */ new Date();
    return await db.select().from(appointments).where(
      and(
        eq(appointments.userId, userId),
        eq(appointments.isCompleted, false),
        gte(appointments.appointmentDate, now.toISOString())
      )
    ).orderBy(appointments.appointmentDate);
  }
  async getMealPlansByUser(userId) {
    return await db.select().from(mealPlans).where(eq(mealPlans.userId, userId));
  }
  async createMealPlan(insertMealPlan) {
    const [mealPlan] = await db.insert(mealPlans).values(insertMealPlan).returning();
    return mealPlan;
  }
  async updateMealPlanCompletion(mealPlanId, isCompleted) {
    const [mealPlan] = await db.update(mealPlans).set({ isCompleted }).where(eq(mealPlans.id, mealPlanId)).returning();
    return mealPlan || void 0;
  }
  async getMealPlansByDate(userId, date2) {
    return await db.select().from(mealPlans).where(
      and(
        eq(mealPlans.userId, userId),
        eq(mealPlans.plannedDate, date2)
      )
    );
  }
  async getShoppingListsByUser(userId) {
    return await db.select().from(shoppingLists).where(eq(shoppingLists.userId, userId));
  }
  async getGroceryStoresByUser(userId) {
    return await db.select().from(groceryStores).where(eq(groceryStores.userId, userId));
  }
  async createGroceryStore(insertStore) {
    const [store] = await db.insert(groceryStores).values(insertStore).returning();
    return store;
  }
  async updateGroceryStore(storeId, data) {
    const [store] = await db.update(groceryStores).set(data).where(eq(groceryStores.id, storeId)).returning();
    return store || void 0;
  }
  async deleteGroceryStore(storeId) {
    const result = await db.delete(groceryStores).where(eq(groceryStores.id, storeId));
    return result.rowCount > 0;
  }
  async createShoppingListItem(insertItem) {
    const [item] = await db.insert(shoppingLists).values(insertItem).returning();
    return item;
  }
  async updateShoppingItemPurchased(itemId, isPurchased, actualCost) {
    const updateData = {
      isPurchased,
      purchasedDate: isPurchased ? /* @__PURE__ */ new Date() : null
    };
    if (actualCost !== void 0) {
      updateData.actualCost = actualCost;
    }
    const [item] = await db.update(shoppingLists).set(updateData).where(eq(shoppingLists.id, itemId)).returning();
    return item || void 0;
  }
  async getActiveShoppingItems(userId) {
    return await db.select().from(shoppingLists).where(
      and(
        eq(shoppingLists.userId, userId),
        eq(shoppingLists.isPurchased, false)
      )
    );
  }
  async getEmergencyResourcesByUser(userId) {
    return await db.select().from(emergencyResources).where(eq(emergencyResources.userId, userId)).orderBy(emergencyResources.resourceType, emergencyResources.name);
  }
  async createEmergencyResource(insertResource) {
    const [resource] = await db.insert(emergencyResources).values(insertResource).returning();
    return resource;
  }
  async updateEmergencyResource(resourceId, updates) {
    const [resource] = await db.update(emergencyResources).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(emergencyResources.id, resourceId)).returning();
    return resource || void 0;
  }
  async deleteEmergencyResource(resourceId) {
    const result = await db.delete(emergencyResources).where(eq(emergencyResources.id, resourceId));
    return (result.rowCount ?? 0) > 0;
  }
  // Pharmacy Integration Methods
  async getPharmacies() {
    return await db.select().from(pharmacies).where(eq(pharmacies.isActive, true));
  }
  async createCustomPharmacy(pharmacyData) {
    const [pharmacy] = await db.insert(pharmacies).values({
      ...pharmacyData,
      isCustom: true,
      type: "custom"
    }).returning();
    return pharmacy;
  }
  async createPharmacy(insertPharmacy) {
    const [pharmacy] = await db.insert(pharmacies).values(insertPharmacy).returning();
    return pharmacy;
  }
  async getUserPharmacies(userId) {
    return await db.select({
      id: userPharmacies.id,
      userId: userPharmacies.userId,
      pharmacyId: userPharmacies.pharmacyId,
      isPrimary: userPharmacies.isPrimary,
      accountNumber: userPharmacies.accountNumber,
      membershipId: userPharmacies.membershipId,
      preferredPickupTime: userPharmacies.preferredPickupTime,
      hasInsurance: userPharmacies.hasInsurance,
      insuranceProvider: userPharmacies.insuranceProvider,
      insuranceGroupNumber: userPharmacies.insuranceGroupNumber,
      insuranceMemberId: userPharmacies.insuranceMemberId,
      autoRefillEnabled: userPharmacies.autoRefillEnabled,
      textNotifications: userPharmacies.textNotifications,
      emailNotifications: userPharmacies.emailNotifications,
      createdAt: userPharmacies.createdAt,
      pharmacy: {
        id: pharmacies.id,
        name: pharmacies.name,
        type: pharmacies.type,
        address: pharmacies.address,
        phoneNumber: pharmacies.phoneNumber,
        hours: pharmacies.hours,
        website: pharmacies.website,
        refillUrl: pharmacies.refillUrl
      }
    }).from(userPharmacies).leftJoin(pharmacies, eq(userPharmacies.pharmacyId, pharmacies.id)).where(eq(userPharmacies.userId, userId));
  }
  async addUserPharmacy(insertUserPharmacy) {
    const [userPharmacy] = await db.insert(userPharmacies).values(insertUserPharmacy).returning();
    return userPharmacy;
  }
  // Medication Methods
  async getMedicationsByUser(userId) {
    return await db.select().from(medications).where(and(eq(medications.userId, userId), eq(medications.isActive, true))).orderBy(medications.medicationName);
  }
  async createMedication(insertMedication) {
    const [medication] = await db.insert(medications).values(insertMedication).returning();
    return medication;
  }
  async updateMedication(medicationId, updates) {
    const [medication] = await db.update(medications).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(medications.id, medicationId)).returning();
    return medication || void 0;
  }
  async getMedicationsDueForRefill(userId) {
    const today = /* @__PURE__ */ new Date();
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1e3);
    return await db.select().from(medications).where(
      and(
        eq(medications.userId, userId),
        eq(medications.isActive, true),
        lte(medications.nextRefillDate, threeDaysFromNow),
        gt(medications.refillsRemaining, 0)
      )
    );
  }
  // Refill Order Methods
  async getRefillOrdersByUser(userId) {
    return await db.select({
      id: refillOrders.id,
      userId: refillOrders.userId,
      medicationId: refillOrders.medicationId,
      pharmacyId: refillOrders.pharmacyId,
      orderNumber: refillOrders.orderNumber,
      status: refillOrders.status,
      orderDate: refillOrders.orderDate,
      readyDate: refillOrders.readyDate,
      pickupMethod: refillOrders.pickupMethod,
      trackingNumber: refillOrders.trackingNumber,
      totalCost: refillOrders.totalCost,
      insuranceCovered: refillOrders.insuranceCovered,
      copay: refillOrders.copay,
      notes: refillOrders.notes,
      createdAt: refillOrders.createdAt,
      updatedAt: refillOrders.updatedAt,
      medication: {
        medicationName: medications.medicationName,
        dosage: medications.dosage,
        prescriptionNumber: medications.prescriptionNumber
      },
      pharmacy: {
        name: pharmacies.name,
        address: pharmacies.address,
        phoneNumber: pharmacies.phoneNumber
      }
    }).from(refillOrders).leftJoin(medications, eq(refillOrders.medicationId, medications.id)).leftJoin(pharmacies, eq(refillOrders.pharmacyId, pharmacies.id)).where(eq(refillOrders.userId, userId)).orderBy(desc(refillOrders.orderDate));
  }
  async createRefillOrder(insertRefillOrder) {
    const [refillOrder] = await db.insert(refillOrders).values(insertRefillOrder).returning();
    return refillOrder;
  }
  async updateRefillOrderStatus(orderId, status) {
    const [refillOrder] = await db.update(refillOrders).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(refillOrders.id, orderId)).returning();
    return refillOrder || void 0;
  }
  // Medical Information Methods
  async getAllergiesByUser(userId) {
    return await db.select().from(allergies).where(eq(allergies.userId, userId));
  }
  async createAllergy(insertAllergy) {
    const [allergy] = await db.insert(allergies).values(insertAllergy).returning();
    return allergy;
  }
  async updateAllergy(allergyId, updates) {
    const [updated] = await db.update(allergies).set(updates).where(eq(allergies.id, allergyId)).returning();
    return updated;
  }
  async deleteAllergy(allergyId) {
    const result = await db.delete(allergies).where(eq(allergies.id, allergyId));
    return (result.rowCount ?? 0) > 0;
  }
  async getMedicalConditionsByUser(userId) {
    return await db.select().from(medicalConditions).where(eq(medicalConditions.userId, userId));
  }
  async createMedicalCondition(insertCondition) {
    const [condition] = await db.insert(medicalConditions).values(insertCondition).returning();
    return condition;
  }
  async updateMedicalCondition(conditionId, updates) {
    const [updated] = await db.update(medicalConditions).set(updates).where(eq(medicalConditions.id, conditionId)).returning();
    return updated;
  }
  async deleteMedicalCondition(conditionId) {
    const result = await db.delete(medicalConditions).where(eq(medicalConditions.id, conditionId));
    return (result.rowCount ?? 0) > 0;
  }
  async getAdverseMedicationsByUser(userId) {
    return await db.select().from(adverseMedications).where(eq(adverseMedications.userId, userId));
  }
  async createAdverseMedication(insertAdverseMed) {
    const [adverseMed] = await db.insert(adverseMedications).values(insertAdverseMed).returning();
    return adverseMed;
  }
  async updateAdverseMedication(adverseMedId, updates) {
    const [updated] = await db.update(adverseMedications).set(updates).where(eq(adverseMedications.id, adverseMedId)).returning();
    return updated;
  }
  async deleteAdverseMedication(adverseMedId) {
    const result = await db.delete(adverseMedications).where(eq(adverseMedications.id, adverseMedId));
    return (result.rowCount ?? 0) > 0;
  }
  async getEmergencyContactsByUser(userId) {
    return await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId));
  }
  async createEmergencyContact(insertContact) {
    const [contact] = await db.insert(emergencyContacts).values(insertContact).returning();
    return contact;
  }
  async updateEmergencyContact(contactId, updates) {
    const [updated] = await db.update(emergencyContacts).set(updates).where(eq(emergencyContacts.id, contactId)).returning();
    return updated;
  }
  async deleteEmergencyContact(contactId) {
    const result = await db.delete(emergencyContacts).where(eq(emergencyContacts.id, contactId));
    return (result.rowCount ?? 0) > 0;
  }
  async getPrimaryCareProvidersByUser(userId) {
    return await db.select().from(primaryCareProviders).where(eq(primaryCareProviders.userId, userId));
  }
  async createPrimaryCareProvider(insertProvider) {
    const [provider] = await db.insert(primaryCareProviders).values(insertProvider).returning();
    return provider;
  }
  async updatePrimaryCareProvider(providerId, updates) {
    const [updated] = await db.update(primaryCareProviders).set(updates).where(eq(primaryCareProviders.id, providerId)).returning();
    return updated;
  }
  async deletePrimaryCareProvider(providerId) {
    const result = await db.delete(primaryCareProviders).where(eq(primaryCareProviders.id, providerId));
    return (result.rowCount ?? 0) > 0;
  }
  // Symptom Tracking Methods
  async getSymptomEntriesByUser(userId) {
    return await db.select().from(symptomEntries).where(eq(symptomEntries.userId, userId)).orderBy(desc(symptomEntries.startTime));
  }
  async getSymptomEntriesByDateRange(userId, startDate, endDate) {
    return await db.select().from(symptomEntries).where(
      and(
        eq(symptomEntries.userId, userId),
        gte(symptomEntries.startTime, startDate),
        lte(symptomEntries.startTime, endDate)
      )
    ).orderBy(desc(symptomEntries.startTime));
  }
  async createSymptomEntry(insertEntry) {
    const [entry] = await db.insert(symptomEntries).values(insertEntry).returning();
    return entry;
  }
  async updateSymptomEntry(entryId, updates) {
    const [updated] = await db.update(symptomEntries).set(updates).where(eq(symptomEntries.id, entryId)).returning();
    return updated;
  }
  async deleteSymptomEntry(entryId) {
    const result = await db.delete(symptomEntries).where(eq(symptomEntries.id, entryId));
    return (result.rowCount || 0) > 0;
  }
  // Personal Resources
  async getPersonalResourcesByUser(userId) {
    return await db.select().from(personalResources).where(eq(personalResources.userId, userId)).orderBy(desc(personalResources.createdAt));
  }
  async getPersonalResourcesByCategory(userId, category) {
    return await db.select().from(personalResources).where(
      and(
        eq(personalResources.userId, userId),
        eq(personalResources.category, category)
      )
    ).orderBy(desc(personalResources.createdAt));
  }
  async createPersonalResource(resource) {
    const [created] = await db.insert(personalResources).values(resource).returning();
    return created;
  }
  async updatePersonalResource(resourceId, updates) {
    const [updated] = await db.update(personalResources).set(updates).where(eq(personalResources.id, resourceId)).returning();
    return updated;
  }
  async deletePersonalResource(resourceId) {
    const result = await db.delete(personalResources).where(eq(personalResources.id, resourceId));
    return (result.rowCount || 0) > 0;
  }
  async incrementResourceAccess(resourceId) {
    const [current] = await db.select().from(personalResources).where(eq(personalResources.id, resourceId));
    if (!current) return void 0;
    const [updated] = await db.update(personalResources).set({
      accessCount: (current.accessCount || 0) + 1,
      lastAccessedAt: /* @__PURE__ */ new Date()
    }).where(eq(personalResources.id, resourceId)).returning();
    return updated;
  }
  // Bus Schedules
  async getBusSchedulesByUser(userId) {
    return await db.select().from(busSchedules).where(eq(busSchedules.userId, userId)).orderBy(desc(busSchedules.createdAt));
  }
  async getBusSchedulesByDay(userId, dayOfWeek) {
    return await db.select().from(busSchedules).where(eq(busSchedules.userId, userId)).orderBy(busSchedules.departureTime);
  }
  async getFrequentBusRoutes(userId) {
    return await db.select().from(busSchedules).where(
      and(
        eq(busSchedules.userId, userId),
        eq(busSchedules.isFrequent, true)
      )
    ).orderBy(busSchedules.departureTime);
  }
  async createBusSchedule(schedule) {
    const [created] = await db.insert(busSchedules).values(schedule).returning();
    return created;
  }
  async updateBusSchedule(scheduleId, updates) {
    const [updated] = await db.update(busSchedules).set(updates).where(eq(busSchedules.id, scheduleId)).returning();
    return updated;
  }
  async deleteBusSchedule(scheduleId) {
    const result = await db.delete(busSchedules).where(eq(busSchedules.id, scheduleId));
    return (result.rowCount || 0) > 0;
  }
  // Emergency Treatment Plans
  async getEmergencyTreatmentPlansByUser(userId) {
    return await db.select().from(emergencyTreatmentPlans).where(eq(emergencyTreatmentPlans.userId, userId)).orderBy(desc(emergencyTreatmentPlans.createdAt));
  }
  async getActiveEmergencyTreatmentPlans(userId) {
    return await db.select().from(emergencyTreatmentPlans).where(
      and(
        eq(emergencyTreatmentPlans.userId, userId),
        eq(emergencyTreatmentPlans.isActive, true)
      )
    ).orderBy(desc(emergencyTreatmentPlans.updatedAt));
  }
  async createEmergencyTreatmentPlan(plan) {
    const [created] = await db.insert(emergencyTreatmentPlans).values(plan).returning();
    return created;
  }
  async updateEmergencyTreatmentPlan(planId, updates) {
    const [updated] = await db.update(emergencyTreatmentPlans).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(emergencyTreatmentPlans.id, planId)).returning();
    return updated;
  }
  async deleteEmergencyTreatmentPlan(planId) {
    const result = await db.delete(emergencyTreatmentPlans).where(eq(emergencyTreatmentPlans.id, planId));
    return (result.rowCount || 0) > 0;
  }
  // Geofences
  async getGeofencesByUser(userId) {
    return await db.select().from(geofences).where(eq(geofences.userId, userId)).orderBy(desc(geofences.createdAt));
  }
  async getActiveGeofencesByUser(userId) {
    return await db.select().from(geofences).where(
      and(
        eq(geofences.userId, userId),
        eq(geofences.isActive, true)
      )
    ).orderBy(desc(geofences.createdAt));
  }
  async createGeofence(geofence) {
    const [created] = await db.insert(geofences).values(geofence).returning();
    return created;
  }
  async updateGeofence(geofenceId, updates) {
    const [updated] = await db.update(geofences).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(geofences.id, geofenceId)).returning();
    return updated;
  }
  async deleteGeofence(geofenceId) {
    const result = await db.delete(geofences).where(eq(geofences.id, geofenceId));
    return (result.rowCount || 0) > 0;
  }
  // Geofence Events
  async getGeofenceEventsByUser(userId, limit = 50) {
    return await db.select().from(geofenceEvents).where(eq(geofenceEvents.userId, userId)).orderBy(desc(geofenceEvents.timestamp)).limit(limit);
  }
  async getGeofenceEventsByGeofence(geofenceId, limit = 50) {
    return await db.select().from(geofenceEvents).where(eq(geofenceEvents.geofenceId, geofenceId)).orderBy(desc(geofenceEvents.timestamp)).limit(limit);
  }
  async createGeofenceEvent(event) {
    const [created] = await db.insert(geofenceEvents).values(event).returning();
    return created;
  }
  async markGeofenceEventNotified(eventId) {
    const result = await db.update(geofenceEvents).set({ notificationSent: true }).where(eq(geofenceEvents.id, eventId));
    return (result.rowCount || 0) > 0;
  }
  // Smart Notifications Implementation
  async markNotificationRead(notificationId) {
    const [updated] = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId)).returning();
    return updated;
  }
  async scheduleNotification(notification) {
    const [created] = await db.insert(notifications).values({
      ...notification,
      scheduledFor: notification.scheduledFor || /* @__PURE__ */ new Date()
    }).returning();
    return created;
  }
  // User Preferences Implementation
  async upsertUserPreferences(userId, preferences) {
    const [upserted] = await db.insert(userPreferences).values({ userId, ...preferences }).onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...preferences, updatedAt: /* @__PURE__ */ new Date() }
    }).returning();
    return upserted;
  }
  // Enhanced Achievements Implementation
  async getUserAchievements(userId) {
    return await db.select().from(userAchievements).where(eq(userAchievements.userId, userId)).orderBy(desc(userAchievements.earnedAt));
  }
  async createUserAchievement(achievement) {
    const [created] = await db.insert(userAchievements).values(achievement).returning();
    return created;
  }
  // Streak Tracking Implementation
  async getStreaksByUser(userId) {
    return await db.select().from(streakTracking).where(eq(streakTracking.userId, userId));
  }
  async updateStreak(userId, streakType, increment) {
    const [existing2] = await db.select().from(streakTracking).where(and(eq(streakTracking.userId, userId), eq(streakTracking.streakType, streakType)));
    if (existing2) {
      const newStreak = increment ? (existing2.currentStreak || 0) + 1 : 0;
      const [updated] = await db.update(streakTracking).set({
        currentStreak: newStreak,
        longestStreak: Math.max(existing2.longestStreak || 0, newStreak),
        lastActivityDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }).where(eq(streakTracking.id, existing2.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(streakTracking).values({
        userId,
        streakType,
        currentStreak: increment ? 1 : 0,
        longestStreak: increment ? 1 : 0,
        lastActivityDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }).returning();
      return created;
    }
  }
  // Voice Interactions Implementation
  async createVoiceInteraction(interaction) {
    const [created] = await db.insert(voiceInteractions).values(interaction).returning();
    return created;
  }
  async getVoiceInteractionHistory(userId) {
    return await db.select().from(voiceInteractions).where(eq(voiceInteractions.userId, userId)).orderBy(desc(voiceInteractions.createdAt)).limit(50);
  }
  // Communication Enhancements Implementation
  async getQuickResponsesByUser(userId) {
    return await db.select().from(quickResponses).where(and(eq(quickResponses.userId, userId), eq(quickResponses.isActive, true))).orderBy(desc(quickResponses.useCount));
  }
  async createQuickResponse(response) {
    const [created] = await db.insert(quickResponses).values(response).returning();
    return created;
  }
  async incrementQuickResponseUsage(responseId) {
    const [updated] = await db.update(quickResponses).set({ useCount: (existing?.useCount || 0) + 1 }).where(eq(quickResponses.id, responseId)).returning();
    return updated;
  }
  // Message Reactions Implementation
  async getMessageReactions(messageId) {
    return await db.select().from(messageReactions).where(eq(messageReactions.messageId, messageId)).orderBy(desc(messageReactions.createdAt));
  }
  async addMessageReaction(reaction) {
    const [created] = await db.insert(messageReactions).values(reaction).returning();
    return created;
  }
  async removeMessageReaction(messageId, userId, emoji) {
    const result = await db.delete(messageReactions).where(and(
      eq(messageReactions.messageId, messageId),
      eq(messageReactions.userId, userId),
      eq(messageReactions.emoji, emoji)
    ));
    return (result.rowCount || 0) > 0;
  }
  // Activity Patterns Implementation
  async recordActivityPattern(pattern) {
    const [existing2] = await db.select().from(activityPatterns).where(and(
      eq(activityPatterns.userId, pattern.userId),
      eq(activityPatterns.activityType, pattern.activityType),
      eq(activityPatterns.timeOfDay, pattern.timeOfDay || "00:00:00"),
      eq(activityPatterns.dayOfWeek, pattern.dayOfWeek || 0)
    ));
    if (existing2) {
      const [updated] = await db.update(activityPatterns).set({
        frequency: existing2.frequency + 1,
        lastUpdated: /* @__PURE__ */ new Date()
      }).where(eq(activityPatterns.id, existing2.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(activityPatterns).values(pattern).returning();
      return created;
    }
  }
  async getActivityPatterns(userId, activityType) {
    return await db.select().from(activityPatterns).where(and(eq(activityPatterns.userId, userId), eq(activityPatterns.activityType, activityType))).orderBy(desc(activityPatterns.frequency));
  }
  async getUserBehaviorInsights(userId) {
    const patterns = await db.select().from(activityPatterns).where(eq(activityPatterns.userId, userId));
    const insights = {
      mostActiveTimeOfDay: null,
      preferredDays: [],
      frequentActivities: [],
      suggestions: []
    };
    if (patterns.length > 0) {
      const timeFrequency = patterns.reduce((acc, pattern) => {
        const time2 = pattern.timeOfDay?.toString() || "00:00:00";
        acc[time2] = (acc[time2] || 0) + pattern.frequency;
        return acc;
      }, {});
      insights.mostActiveTimeOfDay = Object.keys(timeFrequency).reduce((a, b) => timeFrequency[a] > timeFrequency[b] ? a : b);
      insights.frequentActivities = patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 5).map((p) => ({ type: p.activityType, frequency: p.frequency }));
    }
    return insights;
  }
  // Caregiver Permission Management
  async getCaregiverPermissions(userId, caregiverId) {
    return await db.select().from(caregiverPermissions).where(and(
      eq(caregiverPermissions.userId, userId),
      eq(caregiverPermissions.caregiverId, caregiverId)
    ));
  }
  async setCaregiverPermission(permission) {
    const [newPermission] = await db.insert(caregiverPermissions).values(permission).onConflictDoUpdate({
      target: [caregiverPermissions.userId, caregiverPermissions.caregiverId, caregiverPermissions.permissionType],
      set: {
        isGranted: permission.isGranted,
        isLocked: permission.isLocked,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return newPermission;
  }
  async removeCaregiverPermission(userId, caregiverId, permissionType) {
    const result = await db.delete(caregiverPermissions).where(and(
      eq(caregiverPermissions.userId, userId),
      eq(caregiverPermissions.caregiverId, caregiverId),
      eq(caregiverPermissions.permissionType, permissionType)
    ));
    return (result.rowCount || 0) > 0;
  }
  // Locked User Settings Management
  async getLockedUserSettings(userId) {
    return await db.select().from(lockedUserSettings).where(eq(lockedUserSettings.userId, userId));
  }
  async getLockedUserSetting(userId, settingKey) {
    const [setting] = await db.select().from(lockedUserSettings).where(and(
      eq(lockedUserSettings.userId, userId),
      eq(lockedUserSettings.settingKey, settingKey)
    ));
    return setting;
  }
  async lockUserSetting(setting) {
    const [newSetting] = await db.insert(lockedUserSettings).values(setting).onConflictDoUpdate({
      target: [lockedUserSettings.userId, lockedUserSettings.settingKey],
      set: {
        settingValue: setting.settingValue,
        isLocked: setting.isLocked,
        lockedBy: setting.lockedBy,
        lockReason: setting.lockReason,
        canUserView: setting.canUserView,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return newSetting;
  }
  async unlockUserSetting(userId, settingKey, caregiverId) {
    const setting = await this.getLockedUserSetting(userId, settingKey);
    if (!setting) return false;
    const connections = await db.select().from(userCaregiverConnections).where(and(
      eq(userCaregiverConnections.userId, userId),
      eq(userCaregiverConnections.caregiverId, caregiverId),
      eq(userCaregiverConnections.connectionStatus, "active")
    ));
    const connection = connections[0];
    const canUnlock = setting.lockedBy === caregiverId || connection && connection.isPrimaryCaregiver;
    if (!canUnlock) return false;
    const result = await db.delete(lockedUserSettings).where(and(
      eq(lockedUserSettings.userId, userId),
      eq(lockedUserSettings.settingKey, settingKey)
    ));
    return (result.rowCount || 0) > 0;
  }
  async isSettingLocked(userId, settingKey) {
    const setting = await this.getLockedUserSetting(userId, settingKey);
    return setting?.isLocked || false;
  }
  async canUserModifySetting(userId, settingKey) {
    const isLocked = await this.isSettingLocked(userId, settingKey);
    return !isLocked;
  }
  // Caregiver Invitation Management
  async createCaregiverInvitation(invitation) {
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const [newInvitation] = await db.insert(caregiverInvitations).values({
      ...invitation,
      invitationCode,
      expiresAt
    }).returning();
    return newInvitation;
  }
  async getCaregiverInvitation(invitationCode) {
    const [invitation] = await db.select().from(caregiverInvitations).where(eq(caregiverInvitations.invitationCode, invitationCode));
    return invitation || void 0;
  }
  async getCaregiverInvitationsByCaregiver(caregiverId) {
    return await db.select().from(caregiverInvitations).where(eq(caregiverInvitations.caregiverId, caregiverId)).orderBy(desc(caregiverInvitations.createdAt));
  }
  async acceptCaregiverInvitation(invitationCode, acceptedBy) {
    const invitation = await this.getCaregiverInvitation(invitationCode);
    if (!invitation || invitation.status !== "pending" || /* @__PURE__ */ new Date() > new Date(invitation.expiresAt)) {
      return void 0;
    }
    const [updatedInvitation] = await db.update(caregiverInvitations).set({
      status: "accepted",
      acceptedAt: /* @__PURE__ */ new Date(),
      acceptedBy
    }).where(eq(caregiverInvitations.invitationCode, invitationCode)).returning();
    if (updatedInvitation) {
      await this.createCareRelationship({
        caregiverId: updatedInvitation.caregiverId,
        userId: acceptedBy,
        relationship: updatedInvitation.relationship,
        isPrimary: false,
        isActive: true,
        establishedVia: "invitation"
      });
    }
    return updatedInvitation || void 0;
  }
  async expireCaregiverInvitation(invitationCode) {
    const result = await db.update(caregiverInvitations).set({ status: "expired" }).where(eq(caregiverInvitations.invitationCode, invitationCode));
    return (result.rowCount || 0) > 0;
  }
  // Care Relationship Management
  async createCareRelationship(relationship) {
    const [newRelationship] = await db.insert(careRelationships).values(relationship).returning();
    return newRelationship;
  }
  async getCareRelationshipsByUser(userId) {
    return await db.select().from(careRelationships).where(and(
      eq(careRelationships.userId, userId),
      eq(careRelationships.isActive, true)
    ));
  }
  async getCareRelationshipsByCaregiver(caregiverId) {
    return await db.select().from(careRelationships).where(and(
      eq(careRelationships.caregiverId, caregiverId),
      eq(careRelationships.isActive, true)
    ));
  }
  async updateCareRelationship(id, updates) {
    const [updatedRelationship] = await db.update(careRelationships).set(updates).where(eq(careRelationships.id, id)).returning();
    return updatedRelationship || void 0;
  }
  async removeCareRelationship(id) {
    const result = await db.update(careRelationships).set({ isActive: false }).where(eq(careRelationships.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Academic features implementation
  async getAcademicClassesByUser(userId) {
    return await db.select().from(academicClasses).where(eq(academicClasses.userId, userId));
  }
  async createAcademicClass(classData) {
    const [academicClass] = await db.insert(academicClasses).values(classData).returning();
    return academicClass;
  }
  async getAssignmentsByUser(userId) {
    return await db.select().from(assignments).where(eq(assignments.userId, userId));
  }
  async createAssignment(assignmentData) {
    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    return assignment;
  }
  async getStudySessionsByUser(userId) {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }
  async createStudySession(sessionData) {
    const processedData = { ...sessionData };
    if (processedData.completedAt && typeof processedData.completedAt === "string") {
      processedData.completedAt = new Date(processedData.completedAt);
    }
    if (processedData.startedAt && typeof processedData.startedAt === "string") {
      processedData.startedAt = new Date(processedData.startedAt);
    }
    const [session2] = await db.insert(studySessions).values(processedData).returning();
    return session2;
  }
  async updateStudySession(sessionId, updateData) {
    const processedData = { ...updateData };
    if (processedData.completedAt && typeof processedData.completedAt === "string") {
      processedData.completedAt = new Date(processedData.completedAt);
    }
    if (processedData.startedAt && typeof processedData.startedAt === "string") {
      processedData.startedAt = new Date(processedData.startedAt);
    }
    const [session2] = await db.update(studySessions).set(processedData).where(eq(studySessions.id, sessionId)).returning();
    return session2;
  }
  async getCampusLocationsByUser(userId) {
    return await db.select().from(campusLocations).where(eq(campusLocations.userId, userId));
  }
  async createCampusLocation(locationData) {
    const [location] = await db.insert(campusLocations).values(locationData).returning();
    return location;
  }
  async getCampusTransportByUser(userId) {
    return await db.select().from(campusTransport).where(eq(campusTransport.userId, userId));
  }
  async createCampusTransport(transportData) {
    const [transport] = await db.insert(campusTransport).values(transportData).returning();
    return transport;
  }
  async getStudyGroupsByUser(userId) {
    return await db.select().from(studyGroups).where(eq(studyGroups.userId, userId));
  }
  async createStudyGroup(groupData) {
    const [group] = await db.insert(studyGroups).values(groupData).returning();
    return group;
  }
  async getTransitionSkillsByUser(userId) {
    return await db.select().from(transitionSkills).where(eq(transitionSkills.userId, userId));
  }
  async createTransitionSkill(skillData) {
    const [skill] = await db.insert(transitionSkills).values(skillData).returning();
    return skill;
  }
  async updateTransitionSkill(skillId, updateData) {
    const [skill] = await db.update(transitionSkills).set(updateData).where(eq(transitionSkills.id, skillId)).returning();
    return skill;
  }
  async deleteTransitionSkill(skillId) {
    await db.delete(transitionSkills).where(eq(transitionSkills.id, skillId));
  }
  // Calendar Events implementation
  async getCalendarEventsByUser(userId) {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  }
  async createCalendarEvent(eventData) {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }
  async updateCalendarEvent(id, eventData) {
    const [event] = await db.update(calendarEvents).set({ ...eventData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(calendarEvents.id, id)).returning();
    return event;
  }
  async deleteCalendarEvent(id) {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return (result.rowCount || 0) > 0;
  }
  // Personal Documents methods
  async getPersonalDocuments(userId) {
    return await db.select().from(personalDocuments).where(eq(personalDocuments.userId, userId));
  }
  async createPersonalDocument(data) {
    const [newDocument] = await db.insert(personalDocuments).values(data).returning();
    return newDocument;
  }
  async updatePersonalDocument(documentId, updates) {
    const [updatedDocument] = await db.update(personalDocuments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(personalDocuments.id, documentId)).returning();
    if (!updatedDocument) throw new Error("Document not found");
    return updatedDocument;
  }
  async deletePersonalDocument(documentId) {
    await db.delete(personalDocuments).where(eq(personalDocuments.id, documentId));
  }
  async getPersonalDocumentsByCategory(userId, category) {
    return await db.select().from(personalDocuments).where(
      and(
        eq(personalDocuments.userId, userId),
        eq(personalDocuments.category, category)
      )
    );
  }
  // Sleep Tracking Methods
  async getSleepSessionsByUser(userId) {
    return await db.select().from(sleepSessions).where(eq(sleepSessions.userId, userId)).orderBy(desc(sleepSessions.sleepDate));
  }
  async getSleepSessionByDate(userId, date2) {
    const [session2] = await db.select().from(sleepSessions).where(
      and(
        eq(sleepSessions.userId, userId),
        eq(sleepSessions.sleepDate, date2)
      )
    );
    return session2 || void 0;
  }
  async createSleepSession(session2) {
    const [newSession] = await db.insert(sleepSessions).values(session2).returning();
    return newSession;
  }
  async updateSleepSession(sessionId, updates) {
    const [updatedSession] = await db.update(sleepSessions).set(updates).where(eq(sleepSessions.id, sessionId)).returning();
    return updatedSession || void 0;
  }
  async deleteSleepSession(sessionId) {
    const result = await db.delete(sleepSessions).where(eq(sleepSessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }
  // Health Metrics Methods
  async getHealthMetricsByUser(userId, metricType, startDate, endDate) {
    let conditions = [eq(healthMetrics.userId, userId)];
    if (metricType) {
      conditions.push(eq(healthMetrics.metricType, metricType));
    }
    if (startDate) {
      conditions.push(gte(healthMetrics.recordedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(healthMetrics.recordedAt, new Date(endDate)));
    }
    return await db.select().from(healthMetrics).where(and(...conditions)).orderBy(desc(healthMetrics.recordedAt));
  }
  async createHealthMetric(metric) {
    const [newMetric] = await db.insert(healthMetrics).values(metric).returning();
    return newMetric;
  }
  // Rewards Program Methods
  async getRewardsByUser(userId) {
    return await db.select().from(rewards).where(eq(rewards.userId, userId));
  }
  async getRewardsByCaregiver(caregiverId) {
    return await db.select().from(rewards).where(eq(rewards.caregiverId, caregiverId));
  }
  async createReward(rewardData) {
    const [reward] = await db.insert(rewards).values(rewardData).returning();
    return reward;
  }
  async updateReward(id, updates) {
    const [reward] = await db.update(rewards).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(rewards.id, id)).returning();
    return reward || void 0;
  }
  async deleteReward(id) {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Points System Methods
  async getUserPointsBalance(userId) {
    const [balance] = await db.select().from(userPointsBalance).where(eq(userPointsBalance.userId, userId));
    if (!balance) {
      const [newBalance] = await db.insert(userPointsBalance).values({ userId, totalPoints: 0, availablePoints: 0, lifetimeEarned: 0, lifetimeSpent: 0 }).returning();
      return newBalance;
    }
    return balance;
  }
  async updateUserPoints(userId, points, source, description, awardedBy) {
    await db.insert(pointsTransactions).values({
      userId,
      points,
      transactionType: source,
      source: description,
      description,
      awardedBy
    });
    const balance = await this.getUserPointsBalance(userId);
    if (!balance) throw new Error("Could not get user balance");
    const newTotalPoints = balance.totalPoints + points;
    const newAvailablePoints = balance.availablePoints + points;
    const newLifetimeEarned = points > 0 ? balance.lifetimeEarned + points : balance.lifetimeEarned;
    const newLifetimeSpent = points < 0 ? balance.lifetimeSpent + Math.abs(points) : balance.lifetimeSpent;
    const [updatedBalance] = await db.update(userPointsBalance).set({
      totalPoints: newTotalPoints,
      availablePoints: newAvailablePoints,
      lifetimeEarned: newLifetimeEarned,
      lifetimeSpent: newLifetimeSpent,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(userPointsBalance.userId, userId)).returning();
    return updatedBalance;
  }
  async getPointsTransactions(userId) {
    return await db.select().from(pointsTransactions).where(eq(pointsTransactions.userId, userId)).orderBy(desc(pointsTransactions.createdAt));
  }
  async getPointsTransactionsByUser(userId) {
    return await this.getPointsTransactions(userId);
  }
  // Reward Redemptions Methods
  async getRewardRedemptions(userId) {
    return await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.userId, userId)).orderBy(desc(rewardRedemptions.redeemedAt));
  }
  async createRewardRedemption(redemptionData) {
    const [redemption] = await db.insert(rewardRedemptions).values(redemptionData).returning();
    return redemption;
  }
  async updateRewardRedemptionStatus(redemptionId, status) {
    const updateData = { status };
    if (status === "completed") updateData.fulfilledAt = /* @__PURE__ */ new Date();
    const [redemption] = await db.update(rewardRedemptions).set(updateData).where(eq(rewardRedemptions.id, redemptionId)).returning();
    return redemption || void 0;
  }
};
var storage = new DatabaseStorage();
async function initializeDemoMode() {
  try {
    console.log("\u{1F680} Initializing comprehensive demo mode...");
    const existingContacts = await storage.getEmergencyContactsByUser(1);
    if (existingContacts.length > 0) {
      console.log("\u{1F4DD} Demo data already exists, skipping initialization");
      return;
    }
    const demoEmergencyContacts = [
      {
        userId: 1,
        name: "Mom",
        relationship: "Mother",
        phoneNumber: "(555) 123-4567",
        email: "mom@example.com",
        isPrimary: true,
        notes: "Available 24/7, prefers calls over texts"
      },
      {
        userId: 1,
        name: "Dr. Smith",
        relationship: "Therapist",
        phoneNumber: "(555) 987-6543",
        email: "dr.smith@therapy.com",
        isPrimary: false,
        notes: "M-F 9-5, emergency after-hours service available"
      },
      {
        userId: 1,
        name: "Best Friend Jamie",
        relationship: "Friend",
        phoneNumber: "(555) 555-0123",
        email: "jamie@example.com",
        isPrimary: false,
        notes: "Good listener, always available for support"
      }
    ];
    for (const contact of demoEmergencyContacts) {
      await storage.createEmergencyContact(contact);
    }
    const demoMedications = [
      {
        userId: 1,
        medicationName: "Sertraline",
        dosage: "50mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Johnson",
        startDate: /* @__PURE__ */ new Date("2024-01-15"),
        instructions: "Take with food in the morning",
        isActive: true,
        pillColor: "light blue",
        pillShape: "oval",
        pillSize: "medium",
        pillMarkings: "ZLF 50",
        additionalDescription: "Light blue oval tablet with ZLF 50 imprint"
      },
      {
        userId: 1,
        medicationName: "Vitamin D3",
        dosage: "2000 IU",
        frequency: "Once daily",
        prescribedBy: "Dr. Wilson",
        startDate: /* @__PURE__ */ new Date("2024-02-01"),
        instructions: "Take with largest meal",
        isActive: true,
        pillColor: "yellow",
        pillShape: "round",
        pillSize: "small",
        pillMarkings: "D3",
        additionalDescription: "Small yellow round softgel capsule"
      }
    ];
    for (const medication of demoMedications) {
      await storage.createMedication(medication);
    }
    const demoDailyTasks = [
      {
        userId: 1,
        title: "Take morning medication",
        description: "Take Sertraline with breakfast",
        category: "health",
        estimatedMinutes: 2,
        frequency: "daily",
        isCompleted: false
      },
      {
        userId: 1,
        title: "Check in with Mom",
        description: "Send a text or call to check in",
        category: "social",
        estimatedMinutes: 10,
        frequency: "daily",
        isCompleted: true
      },
      {
        userId: 1,
        title: "Complete homework - Math",
        description: "Finish algebra problems from Chapter 5",
        category: "education",
        estimatedMinutes: 60,
        frequency: "daily",
        isCompleted: false
      },
      {
        userId: 1,
        title: "Grocery shopping",
        description: "Buy items from weekly shopping list",
        category: "life_skills",
        estimatedMinutes: 45,
        frequency: "weekly",
        isCompleted: false
      }
    ];
    for (const task of demoDailyTasks) {
      await storage.createDailyTask(task);
    }
    const demoAppointments = [
      {
        userId: 1,
        title: "Therapy Session",
        appointmentDate: "2025-07-08T14:00:00",
        description: "Weekly session, discuss anxiety management",
        provider: "Dr. Smith",
        location: "Downtown Counseling Center",
        isCompleted: false
      },
      {
        userId: 1,
        title: "Annual Physical",
        appointmentDate: "2025-07-15T10:30:00",
        description: "Bring medication list and insurance card",
        provider: "Dr. Johnson",
        location: "Main Street Medical",
        isCompleted: false
      }
    ];
    for (const appointment of demoAppointments) {
      await storage.createAppointment(appointment);
    }
    const demoMealPlans = [
      {
        userId: 1,
        mealType: "breakfast",
        mealName: "Oatmeal with berries",
        plannedDate: "2025-07-07",
        recipe: "Oatmeal with berries and honey",
        cookingTime: 10,
        isCompleted: false
      },
      {
        userId: 1,
        mealType: "dinner",
        mealName: "Spaghetti with marinara",
        plannedDate: "2025-07-07",
        recipe: "Spaghetti with turkey marinara sauce",
        cookingTime: 25,
        isCompleted: false
      }
    ];
    for (const mealPlan of demoMealPlans) {
      await storage.createMealPlan(mealPlan);
    }
    const demoShoppingItems = [
      {
        userId: 1,
        itemName: "Oats",
        category: "pantry",
        quantity: "1 container",
        estimatedCost: 3.99,
        isPurchased: false,
        notes: "Steel cut preferred"
      },
      {
        userId: 1,
        itemName: "Blueberries",
        category: "produce",
        quantity: "1 container",
        estimatedCost: 4.5,
        isPurchased: true,
        notes: "Fresh, not frozen"
      },
      {
        userId: 1,
        itemName: "Ground turkey",
        category: "meat",
        quantity: "1 lb",
        estimatedCost: 6.99,
        isPurchased: false,
        notes: "93/7 lean"
      }
    ];
    for (const item of demoShoppingItems) {
      await storage.createShoppingListItem(item);
    }
    const demoBills = [
      {
        userId: 1,
        name: "Phone Bill",
        amount: 65,
        dueDate: (/* @__PURE__ */ new Date("2025-07-15")).getTime(),
        category: "utilities",
        isPaid: false,
        isRecurring: true
      },
      {
        userId: 1,
        name: "Student Loan",
        amount: 150,
        dueDate: (/* @__PURE__ */ new Date("2025-07-10")).getTime(),
        category: "education",
        isPaid: true,
        isRecurring: true
      }
    ];
    for (const bill of demoBills) {
      await storage.createBill(bill);
    }
    await storage.createMoodEntry({
      userId: 1,
      mood: 4,
      notes: "Feeling good today! Completed most of my tasks and had a nice chat with Jamie."
    });
    const demoPersonalResources = [
      {
        userId: 1,
        title: "Calm App",
        url: "https://calm.com",
        category: "mental_health",
        description: "Meditation and sleep stories",
        isFavorite: true,
        tags: "meditation,anxiety,sleep"
      },
      {
        userId: 1,
        title: "Khan Academy",
        url: "https://khanacademy.org",
        category: "education",
        description: "Free online courses and practice",
        isFavorite: true,
        tags: "math,science,learning"
      }
    ];
    for (const resource of demoPersonalResources) {
      await storage.createPersonalResource(resource);
    }
    await storage.getUserPointsBalance(1);
    await storage.updateUserPoints(1, 25, "daily_task", "Completed morning medication task", 2);
    await storage.updateUserPoints(1, 15, "mood_check", "Daily mood tracking completed", 2);
    await storage.updateUserPoints(1, 30, "appointment", "Attended therapy session", 2);
    await storage.updateUserPoints(1, 10, "caregiver_bonus", "Bonus points from caregiver", 2);
    const demoRewards = [
      {
        userId: 1,
        caregiverId: 2,
        // Caregiver who created the reward
        title: "Extra Screen Time",
        description: "30 minutes of extra screen time on weekends",
        pointsRequired: 25,
        category: "privilege",
        rewardType: "immediate",
        value: "30 minutes",
        maxRedemptions: 2,
        currentRedemptions: 0,
        iconName: "monitor",
        color: "#3b82f6"
      },
      {
        userId: 1,
        caregiverId: 2,
        title: "Favorite Snack",
        description: "Choose your favorite snack for movie night",
        pointsRequired: 15,
        category: "item",
        rewardType: "immediate",
        value: "$5",
        maxRedemptions: 4,
        currentRedemptions: 0,
        iconName: "cookie",
        color: "#f59e0b"
      },
      {
        userId: 1,
        caregiverId: 2,
        title: "Friend Hangout",
        description: "Extra 2 hours to hang out with friends",
        pointsRequired: 50,
        category: "activity",
        rewardType: "delayed",
        value: "2 hours",
        maxRedemptions: 1,
        currentRedemptions: 0,
        iconName: "users",
        color: "#10b981"
      },
      {
        userId: 1,
        caregiverId: 2,
        title: "Weekly Allowance",
        description: "Extra $10 added to weekly allowance",
        pointsRequired: 75,
        category: "money",
        rewardType: "immediate",
        value: "$10",
        maxRedemptions: 1,
        currentRedemptions: 0,
        iconName: "dollar-sign",
        color: "#8b5cf6"
      },
      {
        userId: 1,
        caregiverId: 2,
        title: "Pizza Night",
        description: "Choose pizza toppings for family dinner",
        pointsRequired: 40,
        category: "special",
        rewardType: "delayed",
        value: "Family dinner",
        maxRedemptions: 2,
        currentRedemptions: 0,
        iconName: "pizza",
        color: "#ef4444"
      }
    ];
    for (const reward of demoRewards) {
      await storage.createReward(reward);
    }
    const demoPersonalDocuments = [
      {
        userId: 1,
        title: "Car Insurance Card",
        category: "insurance",
        description: "State Farm auto insurance policy",
        documentType: "text",
        content: "Policy #: SF789456123\nAgent: Sarah Johnson\nPhone: (555) 123-4567\nPolicy Period: 01/01/2025 - 01/01/2026",
        tags: ["car", "insurance", "statefarm"],
        isImportant: true,
        expirationDate: "2026-01-01",
        reminderDays: 30
      },
      {
        userId: 1,
        title: "Tire Size",
        category: "vehicle",
        description: "Honda Civic tire specifications",
        documentType: "text",
        content: "215/55R16 93H\nRecommended PSI: 32 front, 30 rear\nLast changed: March 2024",
        tags: ["honda", "civic", "tires"],
        isImportant: false
      },
      {
        userId: 1,
        title: "Glasses Prescription",
        category: "medical",
        description: "Current eyeglass prescription from Dr. Smith",
        documentType: "text",
        content: "OD (Right): -2.25 -0.50 x 180\nOS (Left): -2.00 -0.75 x 170\nPD: 63mm\nDate: 12/15/2024",
        tags: ["glasses", "prescription", "vision"],
        isImportant: true,
        expirationDate: "2026-12-15",
        reminderDays: 60
      },
      {
        userId: 1,
        title: "Social Security Number",
        category: "personal",
        description: "Important identification number",
        documentType: "number",
        content: "123-45-6789",
        tags: ["ssn", "identification"],
        isImportant: true
      },
      {
        userId: 1,
        title: "Emergency Contact Info",
        category: "emergency",
        description: "Primary emergency contact details",
        documentType: "text",
        content: "Name: Mom (Sarah)\nPhone: (555) 987-6543\nRelationship: Mother\nAddress: 123 Main St, Springfield, IL",
        tags: ["emergency", "family", "contact"],
        isImportant: true
      },
      {
        userId: 1,
        title: "Bank Account Number",
        category: "financial",
        description: "Checking account at First National Bank",
        documentType: "number",
        content: "Account: 1234567890\nRouting: 987654321\nBank: First National Bank",
        tags: ["bank", "checking", "account"],
        isImportant: true
      }
    ];
    for (const document of demoPersonalDocuments) {
      await storage.createPersonalDocument(document);
    }
    console.log("\u2705 Demo mode initialized successfully with comprehensive data!");
  } catch (error) {
    console.error("\u274C Error initializing demo mode:", error);
  }
}
initializeDemoMode();

// server/routes.ts
import OpenAI from "openai";
import Stripe from "stripe";

// server/banking-routes.ts
import { Router } from "express";
import { PlaidApi, Configuration, PlaidEnvironments, Products, CountryCode } from "plaid";
import CryptoJS from "crypto-js";
import { eq as eq2, and as and2 } from "drizzle-orm";
var router = Router();
var plaidConfiguration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  // Use sandbox for development
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "demo-client-id",
      "PLAID-SECRET": process.env.PLAID_SECRET || "demo-secret"
    }
  }
});
var plaidClient = new PlaidApi(plaidConfiguration);
var isDemoMode = !process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET;
var ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY || "default-key-change-in-production";
function encrypt(text3) {
  return CryptoJS.AES.encrypt(text3, ENCRYPTION_KEY).toString();
}
function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    console.log("No user in session for banking, attempting auto-login");
    return res.status(401).json({ message: "Authentication required" });
  }
  req.user = { id: req.session.userId };
  next();
}
router.get("/accounts", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const accounts = await db.select().from(bankAccounts).where(eq2(bankAccounts.userId, req.session.userId));
    const safeAccounts = accounts.map((account) => ({
      ...account,
      accountNumber: account.accountNumber ? "****" + decrypt(account.accountNumber).slice(-4) : "",
      routingNumber: account.routingNumber ? "****" + decrypt(account.routingNumber).slice(-4) : "",
      plaidAccessToken: void 0
      // Never send access tokens to frontend
    }));
    res.json(safeAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ message: "Failed to fetch bank accounts" });
  }
});
router.get("/bank-accounts", requireAuth, async (req, res) => {
  try {
    const accounts = await db.select().from(bankAccounts).where(eq2(bankAccounts.userId, req.user.id));
    const safeAccounts = accounts.map((account) => ({
      ...account,
      accountNumber: account.accountNumber ? "****" + decrypt(account.accountNumber).slice(-4) : "",
      routingNumber: account.routingNumber ? "****" + decrypt(account.routingNumber).slice(-4) : "",
      plaidAccessToken: void 0
      // Never send access tokens to frontend
    }));
    res.json(safeAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ message: "Failed to fetch bank accounts" });
  }
});
router.post("/bank-accounts/connect-plaid", requireAuth, async (req, res) => {
  try {
    if (isDemoMode) {
      await db.insert(bankAccounts).values([
        {
          userId: req.user.id,
          accountName: "Demo Checking Account",
          accountType: "checking",
          bankName: "Demo Bank",
          accountNumber: encrypt("1234567890"),
          routingNumber: encrypt("123456789"),
          balance: "2500.00",
          plaidAccountId: "demo-checking-123",
          plaidAccessToken: encrypt("demo-access-token"),
          isActive: true
        },
        {
          userId: req.user.id,
          accountName: "Demo Savings Account",
          accountType: "savings",
          bankName: "Demo Bank",
          accountNumber: encrypt("0987654321"),
          routingNumber: encrypt("123456789"),
          balance: "8750.00",
          plaidAccountId: "demo-savings-456",
          plaidAccessToken: encrypt("demo-access-token"),
          isActive: true
        }
      ]);
      return res.json({
        message: "Demo bank accounts connected successfully",
        demo_mode: true,
        linkToken: "demo-link-token-12345"
      });
    }
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: req.user.id.toString()
      },
      client_name: "Adaptalyfe",
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: `${process.env.WEBHOOK_URL}/api/banking/plaid-webhook`,
      redirect_uri: `${process.env.APP_URL}/banking-integration`
    });
    res.json({ linkToken: linkTokenResponse.data.link_token });
  } catch (error) {
    console.error("Error creating Plaid link token:", error);
    res.status(500).json({
      message: "Failed to create link token",
      demo_mode: isDemoMode,
      error: isDemoMode ? "Demo mode active - created sample accounts" : "Server error"
    });
  }
});
router.post("/bank-accounts/plaid-exchange", requireAuth, async (req, res) => {
  try {
    const { public_token } = req.body;
    if (isDemoMode) {
      return res.json({
        message: "Demo bank accounts connected successfully",
        demo_mode: true
      });
    }
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token
    });
    const accessToken = exchangeResponse.data.access_token;
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    for (const account of accountsResponse.data.accounts) {
      await db.insert(bankAccounts).values({
        userId: req.user.id,
        accountName: account.name,
        accountType: account.subtype || account.type,
        bankName: accountsResponse.data.item.institution_id || "Unknown Bank",
        accountNumber: encrypt(account.account_id),
        routingNumber: account.routing_number ? encrypt(account.routing_number) : null,
        balance: account.balances.current?.toString() || "0",
        plaidAccountId: account.account_id,
        plaidAccessToken: encrypt(accessToken),
        isActive: true
      });
      await db.insert(balanceHistory).values({
        bankAccountId: account.account_id,
        balance: account.balances.current?.toString() || "0"
      });
    }
    res.json({ message: "Bank accounts connected successfully" });
  } catch (error) {
    console.error("Error exchanging Plaid token:", error);
    res.status(500).json({ message: "Failed to connect bank accounts" });
  }
});
router.post("/bank-accounts/:id/sync", requireAuth, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id);
    const [account] = await db.select().from(bankAccounts).where(and2(
      eq2(bankAccounts.id, accountId),
      eq2(bankAccounts.userId, req.user.id)
    ));
    if (!account || !account.plaidAccessToken) {
      return res.status(404).json({ message: "Account not found or not connected to Plaid" });
    }
    const accessToken = decrypt(account.plaidAccessToken);
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });
    const plaidAccount = accountsResponse.data.accounts.find(
      (acc) => acc.account_id === account.plaidAccountId
    );
    if (plaidAccount) {
      const newBalance = plaidAccount.balances.current?.toString() || "0";
      await db.update(bankAccounts).set({
        balance: newBalance,
        lastSynced: /* @__PURE__ */ new Date()
      }).where(eq2(bankAccounts.id, accountId));
      await db.insert(balanceHistory).values({
        bankAccountId: accountId,
        balance: newBalance
      });
      res.json({ message: "Balance updated successfully", balance: newBalance });
    } else {
      res.status(404).json({ message: "Account not found in Plaid" });
    }
  } catch (error) {
    console.error("Error syncing account balance:", error);
    res.status(500).json({ message: "Failed to sync balance" });
  }
});
router.get("/bill-payments", async (req, res) => {
  try {
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }
    }
    const payments = await db.select().from(billPayments).where(eq2(billPayments.userId, req.session.userId));
    const safePayments = payments.map((payment) => ({
      ...payment,
      payeeAccountNumber: payment.payeeAccountNumber ? "****" + decrypt(payment.payeeAccountNumber).slice(-4) : "",
      payeeLoginCredentials: void 0
      // Never send credentials to frontend
    }));
    res.json(safePayments);
  } catch (error) {
    console.error("Error fetching bill payments:", error);
    res.status(500).json({ message: "Failed to fetch bill payments" });
  }
});
router.post("/bill-payments", requireAuth, async (req, res) => {
  try {
    const {
      billId,
      bankAccountId,
      payeeWebsite,
      payeeAccountNumber,
      paymentAmount,
      paymentDate,
      isAutoPay
    } = req.body;
    const [account] = await db.select().from(bankAccounts).where(and2(
      eq2(bankAccounts.id, bankAccountId),
      eq2(bankAccounts.userId, req.user.id)
    ));
    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }
    const now = /* @__PURE__ */ new Date();
    const nextPayment = new Date(now.getFullYear(), now.getMonth(), paymentDate);
    if (nextPayment <= now) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
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
      status: "active"
    });
    res.json({ message: "Bill payment setup successfully" });
  } catch (error) {
    console.error("Error setting up bill payment:", error);
    res.status(500).json({ message: "Failed to setup bill payment" });
  }
});
router.patch("/bill-payments/:id/toggle", requireAuth, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { isActive } = req.body;
    await db.update(billPayments).set({
      isAutoPay: isActive,
      status: isActive ? "active" : "paused",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and2(
      eq2(billPayments.id, paymentId),
      eq2(billPayments.userId, req.user.id)
    ));
    res.json({ message: "Auto pay setting updated" });
  } catch (error) {
    console.error("Error toggling auto pay:", error);
    res.status(500).json({ message: "Failed to update auto pay setting" });
  }
});
router.get("/payment-limits", requireAuth, async (req, res) => {
  try {
    const limits = await db.select().from(paymentLimits).where(eq2(paymentLimits.userId, req.user.id));
    res.json(limits);
  } catch (error) {
    console.error("Error fetching payment limits:", error);
    res.status(500).json({ message: "Failed to fetch payment limits" });
  }
});
router.post("/payment-limits", requireAuth, async (req, res) => {
  try {
    const { limitType, amount } = req.body;
    const [existingLimit] = await db.select().from(paymentLimits).where(and2(
      eq2(paymentLimits.userId, req.user.id),
      eq2(paymentLimits.limitType, limitType)
    ));
    if (existingLimit) {
      await db.update(paymentLimits).set({
        amount: amount.toString(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(paymentLimits.id, existingLimit.id));
    } else {
      await db.insert(paymentLimits).values({
        userId: req.user.id,
        limitType,
        amount: amount.toString(),
        isActive: true
      });
    }
    res.json({ message: "Payment limit updated" });
  } catch (error) {
    console.error("Error setting payment limit:", error);
    res.status(500).json({ message: "Failed to set payment limit" });
  }
});
router.get("/payment-transactions", requireAuth, async (req, res) => {
  try {
    const transactions = await db.select().from(paymentTransactions).where(eq2(paymentTransactions.userId, req.user.id)).orderBy(paymentTransactions.initiatedAt);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching payment transactions:", error);
    res.status(500).json({ message: "Failed to fetch payment transactions" });
  }
});
router.post("/bill-payments/:id/process", requireAuth, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const [payment] = await db.select().from(billPayments).where(and2(
      eq2(billPayments.id, paymentId),
      eq2(billPayments.userId, req.user.id)
    ));
    if (!payment) {
      return res.status(404).json({ message: "Bill payment not found" });
    }
    const limits = await db.select().from(paymentLimits).where(and2(
      eq2(paymentLimits.userId, req.user.id),
      eq2(paymentLimits.isActive, true)
    ));
    for (const limit of limits) {
      if (limit.limitType === "per_transaction" && parseFloat(payment.paymentAmount) > parseFloat(limit.amount)) {
        return res.status(400).json({
          message: `Payment amount exceeds per-transaction limit of $${limit.amount}`
        });
      }
    }
    const [transaction] = await db.insert(paymentTransactions).values({
      userId: req.user.id,
      billPaymentId: paymentId,
      bankAccountId: payment.bankAccountId,
      amount: payment.paymentAmount,
      status: "pending"
    }).returning();
    setTimeout(async () => {
      await db.update(paymentTransactions).set({
        status: "completed",
        completedAt: /* @__PURE__ */ new Date(),
        confirmationNumber: `CONF-${Date.now()}`
      }).where(eq2(paymentTransactions.id, transaction.id));
      const nextPayment = new Date(payment.nextPaymentDate);
      nextPayment.setMonth(nextPayment.getMonth() + 1);
      await db.update(billPayments).set({
        lastPaymentDate: /* @__PURE__ */ new Date(),
        nextPaymentDate: nextPayment
      }).where(eq2(billPayments.id, paymentId));
    }, 2e3);
    res.json({
      message: "Payment initiated successfully",
      transactionId: transaction.id
    });
  } catch (error) {
    console.error("Error processing bill payment:", error);
    res.status(500).json({ message: "Failed to process payment" });
  }
});
router.post("/plaid-webhook", async (req, res) => {
  try {
    const { webhook_type, webhook_code, item_id } = req.body;
    console.log("Plaid webhook received:", { webhook_type, webhook_code, item_id });
    if (webhook_type === "TRANSACTIONS") {
    } else if (webhook_type === "ITEM") {
      if (webhook_code === "ERROR") {
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Plaid webhook:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
});
router.post("/connect-account", async (req, res) => {
  try {
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
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
      return res.status(400).json({ message: "All bank account fields are required" });
    }
    const bankName = accountName.split(" ")[0] || "Bank";
    const accountType = accountName.toLowerCase().includes("saving") ? "savings" : "checking";
    const accountData = {
      userId: req.session.userId,
      accountName,
      accountType,
      bankName,
      accountNumber: encrypt(accountNumber),
      routingNumber: encrypt(routingNumber),
      balance: "0.00",
      // Default balance
      plaidAccountId: null,
      plaidAccessToken: null,
      isActive: true
    };
    const bankAccount = await db.insert(bankAccounts).values(accountData).returning();
    console.log("Bank account created successfully:", bankAccount[0]?.id);
    res.json({
      message: "Bank account connected successfully",
      account: {
        ...bankAccount[0],
        accountNumber: "****" + accountNumber.slice(-4),
        routingNumber: "****" + routingNumber.slice(-4)
      }
    });
  } catch (error) {
    console.error("Error connecting bank account:", error);
    res.status(500).json({ message: "Failed to connect bank account" });
  }
});
router.post("/setup-autopay", async (req, res) => {
  try {
    if (!req.session?.userId) {
      const alexUser = await storage.getUserByUsername("alex");
      if (alexUser) {
        req.session.userId = alexUser.id;
        req.session.user = alexUser;
        await new Promise((resolve, reject) => {
          req.session.save((err) => {
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
      return res.status(400).json({ message: "Bill ID and bank account are required" });
    }
    const billPaymentData = {
      userId: req.session.userId,
      billId,
      bankAccountId,
      paymentDate: paymentDate || (/* @__PURE__ */ new Date()).getDate(),
      // Default to today's date of month
      maxAmount: maxAmount || "999999.99",
      // Default high limit
      isActive: true
    };
    const billPayment = await db.insert(billPayments).values(billPaymentData).returning();
    console.log("Bill payment setup successfully:", billPayment[0]?.id);
    res.json({
      message: "Automatic bill payment setup successfully",
      payment: billPayment[0]
    });
  } catch (error) {
    console.error("Error setting up bill payment:", error);
    res.status(500).json({ message: "Failed to setup bill payment" });
  }
});
var banking_routes_default = router;

// server/analytics.ts
import { eq as eq3, sql, and as and3, gte as gte3, lte as lte3 } from "drizzle-orm";
var PaymentAnalytics = class {
  // Track payment method selection
  static async trackMethodSelection(userId, billId, paymentMethod) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: "method_selected",
      paymentMethod,
      metadata: { timestamp: (/* @__PURE__ */ new Date()).toISOString() }
    });
  }
  // Track Plaid API usage with cost estimation
  static async trackPlaidUsage(userId, apiCall, estimatedCost, billId) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: "api_call",
      plaidApiCall: apiCall,
      estimatedCost: estimatedCost.toString(),
      metadata: { timestamp: (/* @__PURE__ */ new Date()).toISOString(), provider: "plaid" }
    });
  }
  // Track payment link clicks
  static async trackLinkClick(userId, billId, payeeWebsite) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: "link_clicked",
      paymentMethod: "link",
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        payeeWebsite,
        costSavings: 0.12
        // Estimated Plaid API cost avoided
      }
    });
  }
  // Track successful payments
  static async trackPaymentProcessed(userId, billId, paymentMethod, amount) {
    await db.insert(paymentAnalytics).values({
      userId,
      billId,
      eventType: "payment_processed",
      paymentMethod,
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        amount,
        success: true
      }
    });
  }
  // Get usage analytics for cost optimization
  static async getUsageReport(startDate, endDate) {
    const conditions = [];
    if (startDate) conditions.push(gte3(paymentAnalytics.createdAt, startDate));
    if (endDate) conditions.push(lte3(paymentAnalytics.createdAt, endDate));
    const report = await db.select({
      eventType: paymentAnalytics.eventType,
      paymentMethod: paymentAnalytics.paymentMethod,
      plaidApiCall: paymentAnalytics.plaidApiCall,
      totalEvents: sql`count(*)`,
      totalCost: sql`sum(CAST(${paymentAnalytics.estimatedCost} AS decimal))`
    }).from(paymentAnalytics).where(conditions.length ? and3(...conditions) : void 0).groupBy(
      paymentAnalytics.eventType,
      paymentAnalytics.paymentMethod,
      paymentAnalytics.plaidApiCall
    );
    return report;
  }
  // Get user payment preferences
  static async getUserPaymentPreferences(userId) {
    const preferences = await db.select({
      paymentMethod: paymentAnalytics.paymentMethod,
      count: sql`count(*)`
    }).from(paymentAnalytics).where(and3(
      eq3(paymentAnalytics.userId, userId),
      eq3(paymentAnalytics.eventType, "method_selected")
    )).groupBy(paymentAnalytics.paymentMethod);
    return preferences;
  }
  // Estimate monthly Plaid costs
  static async estimateMonthlyPlaidCosts(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    const conditions = [
      gte3(paymentAnalytics.createdAt, thirtyDaysAgo),
      eq3(paymentAnalytics.eventType, "api_call")
    ];
    if (userId) {
      conditions.push(eq3(paymentAnalytics.userId, userId));
    }
    const costs = await db.select({
      totalCost: sql`sum(CAST(${paymentAnalytics.estimatedCost} AS decimal))`,
      apiCallCount: sql`count(*)`
    }).from(paymentAnalytics).where(and3(...conditions));
    return costs[0] || { totalCost: 0, apiCallCount: 0 };
  }
};

// server/analytics-routes.ts
import { z as z2 } from "zod";
var trackPaymentMethodSchema = z2.object({
  billId: z2.number(),
  paymentMethod: z2.enum(["link", "autopay"])
});
var trackLinkClickSchema = z2.object({
  billId: z2.number(),
  payeeWebsite: z2.string().url()
});
var trackPaymentSchema = z2.object({
  billId: z2.number(),
  paymentMethod: z2.enum(["link", "autopay"]),
  amount: z2.number().positive()
});
function registerAnalyticsRoutes(app2) {
  app2.post("/api/analytics/payment-method", async (req, res) => {
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
    } catch (error) {
      res.status(400).json({
        message: "Failed to track payment method selection",
        error: error.message
      });
    }
  });
  app2.post("/api/analytics/link-click", async (req, res) => {
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
    } catch (error) {
      res.status(400).json({
        message: "Failed to track link click",
        error: error.message
      });
    }
  });
  app2.post("/api/analytics/payment", async (req, res) => {
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
    } catch (error) {
      res.status(400).json({
        message: "Failed to track payment",
        error: error.message
      });
    }
  });
  app2.get("/api/analytics/usage", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user.accountType !== "admin") {
      return res.sendStatus(403);
    }
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate) : void 0;
      const endDate = req.query.endDate ? new Date(req.query.endDate) : void 0;
      const report = await PaymentAnalytics.getUsageReport(startDate, endDate);
      const monthlyPlaidCosts = await PaymentAnalytics.estimateMonthlyPlaidCosts();
      res.json({
        report,
        monthlyPlaidCosts,
        costSavingsFromLinks: report.filter((r) => r.eventType === "link_clicked").reduce((total, r) => total + r.totalEvents * 0.12, 0)
        // $0.12 saved per link click
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to generate usage report",
        error: error.message
      });
    }
  });
  app2.get("/api/analytics/user-preferences", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    try {
      const preferences = await PaymentAnalytics.getUserPaymentPreferences(req.user.id);
      res.json({ preferences });
    } catch (error) {
      res.status(500).json({
        message: "Failed to get user preferences",
        error: error.message
      });
    }
  });
}

// server/bill-payment-routes.ts
import { z as z3 } from "zod";
var updatePaymentLinkSchema = z3.object({
  payeeWebsite: z3.string().url("Please enter a valid website URL").optional(),
  payeeAccountNumber: z3.string().optional()
});
function registerBillPaymentRoutes(app2) {
  app2.patch("/api/bills/:id/payment-link", async (req, res) => {
    if (!req.isAuthenticated?.() && !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const billId = parseInt(req.params.id);
      const { payeeWebsite, payeeAccountNumber } = updatePaymentLinkSchema.parse(req.body);
      const bill = await storage.getBill(billId);
      if (!bill || bill.userId !== req.user.id) {
        return res.status(404).json({ message: "Bill not found" });
      }
      const updatedBill = await storage.updateBill(billId, {
        ...bill,
        payeeWebsite: payeeWebsite || bill.payeeWebsite,
        payeeAccountNumber: payeeAccountNumber || bill.payeeAccountNumber
      });
      res.json(updatedBill);
    } catch (error) {
      console.error("Error updating payment link:", error);
      res.status(400).json({
        message: "Failed to save payment link",
        error: error.message
      });
    }
  });
}

// server/routes.ts
import session from "express-session";
import { z as z4 } from "zod";

// server/demo-data.ts
async function initializeComprehensiveDemo() {
  try {
    console.log("\u{1F680} Initializing comprehensive demo mode...");
    const existingUser = await storage.getUserByUsername("alex");
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const adminUser2 = await storage.createUser({
        username: "admin",
        password: "demo2025",
        name: "Demo Administrator",
        email: "admin@skillbridge.com"
      });
      console.log("\u{1F511} Created admin user: Demo Administrator (username: admin, password: demo2025)");
    }
    if (existingUser) {
      console.log("\u{1F4DD} Demo data already exists, skipping initialization");
      return;
    }
    const user = await storage.createUser({
      username: "alex",
      password: "password",
      // In real app, this would be hashed
      name: "Alex Chen",
      email: "alex@skillbridge.demo"
    });
    const adminUser = await storage.createUser({
      username: "admin",
      password: "demo2025",
      // Strong demo password
      name: "Demo Administrator",
      email: "admin@skillbridge.com"
    });
    console.log("\u{1F464} Created demo user: Alex Chen");
    console.log("\u{1F511} Created admin user: Demo Administrator (username: admin, password: demo2025)");
    await createDemoTasks(user.id);
    await createDemoFinances(user.id);
    await createDemoMoodEntries(user.id);
    await createDemoAppointments(user.id);
    await createDemoMealsAndShopping(user.id);
    await createDemoTasks(adminUser.id);
    await createDemoFinances(adminUser.id);
    await createDemoMoodEntries(adminUser.id);
    await createDemoAppointments(adminUser.id);
    await createDemoMealsAndShopping(adminUser.id);
    await createDemoMedicalData(adminUser.id);
    await createDemoPharmacyData(adminUser.id);
    await createDemoCaregiverData(adminUser.id);
    await createDemoResourcesData(adminUser.id);
    await createDemoAchievements(adminUser.id);
    await createDemoPreferences(adminUser.id);
    await createDemoNotifications(adminUser.id);
    await createDemoCalendarEvents(adminUser.id);
    console.log("\u2705 Comprehensive demo initialization complete!");
  } catch (error) {
    console.error("\u274C Error initializing demo data:", error);
  }
}
async function createDemoTasks(userId) {
  const tasks = [
    {
      userId,
      title: "Brush teeth and shower",
      description: "Complete morning hygiene routine",
      isCompleted: true,
      category: "self-care",
      frequency: "daily",
      estimatedMinutes: 20
    },
    {
      userId,
      title: "Take medication",
      description: "Morning pills with breakfast",
      isCompleted: true,
      category: "health",
      frequency: "daily",
      estimatedMinutes: 5
    },
    {
      userId,
      title: "Practice social conversation",
      description: "Call a friend or family member",
      isCompleted: false,
      category: "social",
      frequency: "daily",
      estimatedMinutes: 15
    },
    {
      userId,
      title: "Grocery shopping",
      description: "Buy items from shopping list",
      isCompleted: false,
      category: "life-skills",
      frequency: "weekly",
      estimatedMinutes: 60
    },
    {
      userId,
      title: "Clean bedroom",
      description: "Organize and tidy living space",
      isCompleted: false,
      category: "life-skills",
      frequency: "weekly",
      estimatedMinutes: 30
    }
  ];
  for (const task of tasks) {
    await storage.createDailyTask(task);
  }
  console.log("\u{1F4CB} Created demo daily tasks");
}
async function createDemoFinances(userId) {
  const bills2 = [
    {
      userId,
      name: "Phone bill",
      amount: 45.99,
      dueDate: 15,
      // day of month
      isPaid: false,
      category: "utilities"
    },
    {
      userId,
      name: "Therapy session",
      amount: 120,
      dueDate: 10,
      // day of month
      isPaid: true,
      category: "healthcare"
    },
    {
      userId,
      name: "Grocery budget",
      amount: 200,
      dueDate: 20,
      // day of month
      isPaid: false,
      category: "food"
    }
  ];
  for (const bill of bills2) {
    await storage.createBill(bill);
  }
  console.log("\u{1F4B0} Created demo bills");
}
async function createDemoMoodEntries(userId) {
  const moods = [
    {
      userId,
      mood: 4,
      notes: "Had a great day at work, feeling accomplished!"
    },
    {
      userId,
      mood: 3,
      notes: "Okay day, felt a bit anxious about tomorrow's appointment"
    },
    {
      userId,
      mood: 5,
      notes: "Excellent day! Completed all my tasks and had fun with friends"
    }
  ];
  for (const mood of moods) {
    await storage.createMoodEntry(mood);
  }
  console.log("\u{1F60A} Created demo mood entries");
}
async function createDemoAppointments(userId) {
  const appointments2 = [
    {
      userId,
      title: "Annual Physical Exam",
      description: "Yearly checkup with Dr. Smith",
      appointmentDate: "2025-07-15 10:00",
      location: "Community Health Center",
      provider: "Dr. Smith",
      isCompleted: false
    },
    {
      userId,
      title: "Dentist Cleaning",
      description: "6-month dental cleaning",
      appointmentDate: "2025-07-20 14:30",
      location: "Bright Smiles Dental",
      provider: "Dr. Johnson DDS",
      isCompleted: false
    },
    {
      userId,
      title: "Therapy Session",
      description: "Weekly counseling appointment",
      appointmentDate: "2025-07-08 11:00",
      location: "Wellness Therapy Center",
      provider: "Dr. Martinez",
      isCompleted: true
    }
  ];
  for (const appointment of appointments2) {
    await storage.createAppointment(appointment);
  }
  console.log("\u{1F4C5} Created demo appointments");
}
async function createDemoMealsAndShopping(userId) {
  const mealPlans2 = [
    {
      userId,
      mealType: "breakfast",
      mealName: "Scrambled Eggs with Toast",
      plannedDate: "2025-07-08",
      recipe: "2 eggs, 2 slices bread, butter, salt, pepper",
      cookingTime: 10,
      isCompleted: true
    },
    {
      userId,
      mealType: "lunch",
      mealName: "Turkey Sandwich",
      plannedDate: "2025-07-08",
      recipe: "turkey slices, bread, lettuce, tomato, mayo",
      cookingTime: 5,
      isCompleted: false
    },
    {
      userId,
      mealType: "dinner",
      mealName: "Spaghetti with Marinara",
      plannedDate: "2025-07-09",
      recipe: "spaghetti pasta, marinara sauce, parmesan cheese",
      cookingTime: 20,
      isCompleted: false
    }
  ];
  for (const meal of mealPlans2) {
    await storage.createMealPlan(meal);
  }
  const shoppingItems = [
    {
      userId,
      itemName: "Eggs",
      category: "dairy",
      quantity: 12,
      estimatedCost: 3.99,
      purchased: true
    },
    {
      userId,
      itemName: "Bread",
      category: "bakery",
      quantity: 1,
      estimatedCost: 2.49,
      purchased: true
    },
    {
      userId,
      itemName: "Turkey slices",
      category: "deli",
      quantity: 1,
      estimatedCost: 5.99,
      purchased: false
    },
    {
      userId,
      itemName: "Spaghetti pasta",
      category: "pantry",
      quantity: 1,
      estimatedCost: 1.99,
      purchased: false
    }
  ];
  for (const item of shoppingItems) {
    await storage.createShoppingListItem(item);
  }
  console.log("\u{1F37D}\uFE0F Created demo meals and shopping data");
}
async function createDemoMedicalData(userId) {
  const emergencyContacts2 = [
    {
      userId,
      name: "Mom",
      phoneNumber: "555-0123",
      relationship: "mother",
      isPrimary: true
    },
    {
      userId,
      name: "Dr. Smith",
      phoneNumber: "555-0456",
      relationship: "doctor",
      isPrimary: false
    }
  ];
  for (const contact of emergencyContacts2) {
    await storage.createEmergencyContact(contact);
  }
  const allergies2 = [
    {
      userId,
      allergen: "Penicillin",
      severity: "severe",
      symptoms: "Rash, difficulty breathing"
    },
    {
      userId,
      allergen: "Peanuts",
      severity: "moderate",
      symptoms: "Hives, swelling"
    }
  ];
  for (const allergy of allergies2) {
    await storage.createAllergy(allergy);
  }
  const conditions = [
    {
      userId,
      condition: "ADHD",
      diagnosedDate: /* @__PURE__ */ new Date("2020-03-15"),
      status: "active",
      notes: "Managed with medication and therapy"
    },
    {
      userId,
      condition: "Anxiety",
      diagnosedDate: /* @__PURE__ */ new Date("2021-06-10"),
      status: "active",
      notes: "Improving with counseling"
    }
  ];
  for (const condition of conditions) {
    await storage.createMedicalCondition(condition);
  }
  console.log("\u{1F3E5} Created demo medical data");
}
async function createDemoPharmacyData(userId) {
  const pharmacy = await storage.createPharmacy({
    name: "Walgreens #1234",
    address: "123 Main St, City, State 12345",
    phoneNumber: "555-0789",
    type: "walgreens"
  });
  await storage.createUserPharmacy({
    userId,
    pharmacyId: pharmacy.id,
    isPrimary: true
  });
  const medications2 = [
    {
      userId,
      prescriptionNumber: "RX123456",
      medicationName: "Adderall XR",
      dosage: "20mg",
      frequency: "daily",
      prescribedBy: "Dr. Smith",
      refillsRemaining: 2,
      lastRefillDate: /* @__PURE__ */ new Date("2025-06-15"),
      nextRefillDate: /* @__PURE__ */ new Date("2025-07-15"),
      pharmacyId: pharmacy.id,
      appearance: {
        color: "Blue and white",
        shape: "Capsule",
        size: "Medium",
        markings: "XR 20",
        description: "Blue and white capsule with XR 20 imprint"
      }
    },
    {
      userId,
      prescriptionNumber: "RX789012",
      medicationName: "Sertraline",
      dosage: "50mg",
      frequency: "daily",
      prescribedBy: "Dr. Johnson",
      refillsRemaining: 0,
      lastRefillDate: /* @__PURE__ */ new Date("2025-06-01"),
      nextRefillDate: /* @__PURE__ */ new Date("2025-07-01"),
      pharmacyId: pharmacy.id,
      appearance: {
        color: "Light blue",
        shape: "Oval",
        size: "Small",
        markings: "S 50",
        description: "Small light blue oval tablet with S 50 marking"
      }
    }
  ];
  for (const medication of medications2) {
    await storage.createMedication(medication);
  }
  console.log("\u{1F48A} Created demo pharmacy and medication data");
}
async function createDemoCaregiverData(userId) {
  const caregiver = await storage.createCaregiver({
    userId,
    name: "Mom",
    relationship: "mother",
    phoneNumber: "555-0123",
    email: "mom@family.com",
    canViewMedical: true,
    canViewFinancial: false,
    emergencyContact: true
  });
  const messages2 = [
    {
      userId,
      caregiverId: caregiver.id,
      content: "How was your therapy session today?",
      isFromCaregiver: true,
      isRead: true
    },
    {
      userId,
      caregiverId: caregiver.id,
      content: "It went really well! We worked on coping strategies.",
      isFromCaregiver: false,
      isRead: true
    },
    {
      userId,
      caregiverId: caregiver.id,
      content: "That's wonderful! Remember to take your evening medication.",
      isFromCaregiver: true,
      isRead: false
    }
  ];
  for (const message of messages2) {
    await storage.createMessage(message);
  }
  console.log("\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} Created demo caregiver and communication data");
}
async function createDemoResourcesData(userId) {
  const resources = [
    {
      userId,
      title: "Crisis Text Line",
      url: "https://www.crisistextline.org",
      category: "crisis-support",
      description: "24/7 crisis support via text",
      isFavorite: true,
      accessCount: 3
    },
    {
      userId,
      title: "Calm Meditation App",
      url: "https://www.calm.com",
      category: "relaxation",
      description: "Guided meditation and sleep stories",
      isFavorite: true,
      accessCount: 15
    },
    {
      userId,
      title: "NAMI Support Groups",
      url: "https://www.nami.org",
      category: "support-groups",
      description: "Mental health support and education",
      isFavorite: false,
      accessCount: 1
    }
  ];
  for (const resource of resources) {
    await storage.createPersonalResource(resource);
  }
  console.log("\u{1F4DA} Created demo resources data");
}
async function createDemoAchievements(userId) {
  const achievements2 = [
    {
      userId,
      title: "7-Day Streak Master",
      description: "Completed daily tasks for 7 days in a row",
      category: "streak",
      pointsEarned: 100,
      unlockedAt: /* @__PURE__ */ new Date("2025-07-01")
    },
    {
      userId,
      title: "Mood Tracker Pro",
      description: "Logged mood for 30 consecutive days",
      category: "consistency",
      pointsEarned: 150,
      unlockedAt: /* @__PURE__ */ new Date("2025-06-25")
    }
  ];
  for (const achievement of achievements2) {
    await storage.createAchievement(achievement);
  }
  console.log("\u{1F3C6} Created demo achievements");
}
async function createDemoPreferences(userId) {
  await storage.createUserPreferences({
    userId,
    notificationSettings: {
      enablePush: true,
      enableEmail: false,
      reminderTiming: "1hour",
      quietHours: {
        enabled: true,
        startTime: "22:00",
        endTime: "08:00"
      }
    },
    accessibilitySettings: {
      highContrast: false,
      largeText: false,
      reducedMotion: false
    },
    privacySettings: {
      shareLocationWithCaregivers: true,
      allowDataExport: true,
      marketingEmails: false
    }
  });
  console.log("\u2699\uFE0F Created demo user preferences");
}
async function createDemoCalendarEvents(userId) {
  const events = [
    {
      userId,
      title: "Doctor Appointment",
      description: "Annual check-up with primary care physician",
      startDate: /* @__PURE__ */ new Date("2025-07-10T09:00:00.000Z"),
      endDate: /* @__PURE__ */ new Date("2025-07-10T10:00:00.000Z"),
      allDay: false,
      category: "health",
      color: "#ef4444",
      location: "Medical Center",
      isRecurring: false,
      reminderMinutes: 30,
      isCompleted: false
    },
    {
      userId,
      title: "Study Session",
      description: "Review math homework with tutor",
      startDate: /* @__PURE__ */ new Date("2025-07-08T15:00:00.000Z"),
      endDate: /* @__PURE__ */ new Date("2025-07-08T16:30:00.000Z"),
      allDay: false,
      category: "education",
      color: "#8b5cf6",
      location: "Library",
      isRecurring: false,
      reminderMinutes: 15,
      isCompleted: false
    },
    {
      userId,
      title: "Birthday Party",
      description: "Friend's birthday celebration",
      startDate: /* @__PURE__ */ new Date("2025-07-12T18:00:00.000Z"),
      allDay: false,
      category: "social",
      color: "#f59e0b",
      location: "Community Center",
      isRecurring: false,
      reminderMinutes: 60,
      isCompleted: false
    },
    {
      userId,
      title: "Grocery Shopping",
      description: "Weekly grocery store trip",
      startDate: /* @__PURE__ */ new Date("2025-07-09T10:00:00.000Z"),
      allDay: false,
      category: "personal",
      color: "#10b981",
      location: "Safeway",
      isRecurring: true,
      recurrenceRule: "weekly",
      reminderMinutes: 30,
      isCompleted: false
    }
  ];
  for (const event of events) {
    await storage.createCalendarEvent(event);
  }
  console.log("\u{1F4C5} Created demo calendar events");
}
async function createDemoNotifications(userId) {
  const notifications2 = [
    {
      userId,
      title: "Medication Reminder",
      message: "Time to take your morning Adderall XR",
      type: "medication",
      priority: "high",
      isRead: false,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1e3)
      // 30 minutes from now
    },
    {
      userId,
      title: "Appointment Tomorrow",
      message: "Don't forget your dental cleaning at 2:30 PM",
      type: "appointment",
      priority: "medium",
      isRead: true,
      scheduledFor: /* @__PURE__ */ new Date("2025-07-19T14:30:00")
    }
  ];
  for (const notification of notifications2) {
    await storage.createNotification(notification);
  }
  console.log("\u{1F514} Created demo notifications");
}

// server/production-config.ts
var PRODUCTION_CONFIG = {
  // Environment detection
  isProduction: process.env.NODE_ENV === "production",
  isDemoMode: process.env.DEMO_MODE === "true" || false,
  // Demo controls - disabled for production readiness testing
  enableAutoLogin: false,
  // Disabled for soft launch
  enableDemoData: process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true",
  // Security settings
  requireStrictAuth: process.env.NODE_ENV === "production",
  sessionSecret: process.env.SESSION_SECRET || "demo-secret-key-change-in-production",
  // Feature flags for soft launch
  enableUserRegistration: true,
  enablePasswordReset: true,
  enableEmailVerification: false,
  // Can be enabled later
  // Logging
  logLevel: process.env.NODE_ENV === "production" ? "error" : "info"
};
function shouldInitializeDemoData() {
  return PRODUCTION_CONFIG.enableDemoData;
}

// server/production-environment.ts
function configureForProduction() {
  if (process.env.NODE_ENV === "production") {
    process.env.DEMO_MODE = "false";
    console.log("\u{1F3ED} Production mode activated");
    console.log("\u2705 Demo mode disabled");
    console.log("\u2705 Auto-login disabled");
    console.log("\u2705 Real user registration enabled");
  } else {
    console.log("\u{1F6E0}\uFE0F Development mode - demo features available");
  }
}

// server/routes.ts
function getStripeInstance() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY not found, using demo mode");
    return null;
  }
  console.log("Using Stripe key prefix:", process.env.STRIPE_SECRET_KEY.substring(0, 10) + "...");
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil"
  });
}
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
    if (lowerMessage.includes("app") || lowerMessage.includes("feature") || lowerMessage.includes("use")) {
      return "I'd love to help you navigate AdaptaLyfe! Here's what you can do:\n\n\u2022 **Daily Tasks**: Plan and track your daily activities\n\u2022 **Financial**: Manage bills, budgets, and savings goals\n\u2022 **Mood Tracking**: Log how you're feeling each day\n\u2022 **Medical**: Track medications and appointments\n\u2022 **Caregiver Connection**: Stay in touch with your support team\n\u2022 **Meal Planning**: Plan healthy meals and shopping lists\n\u2022 **Calendar**: Keep track of important dates\n\nWhich area would you like to explore first?";
    }
    return "I'm here to help you build independence and achieve your goals! I can assist with:\n\n\u2022 Creating daily routines and task lists\n\u2022 Managing money and budgets\n\u2022 Understanding medications and health\n\u2022 Connecting with your support network\n\u2022 Learning new life skills\n\u2022 Handling difficult emotions\n\u2022 Planning meals and shopping\n\u2022 Organizing your schedule\n\nWhat would you like help with today?";
  }
  if (lowerMessage.includes("sad") || lowerMessage.includes("down") || lowerMessage.includes("upset") || lowerMessage.includes("anxious") || lowerMessage.includes("worried")) {
    return "I understand you're going through a tough time, and it's completely normal to have these feelings. You're not alone. Here are some things that can help:\n\n\u2022 **Breathe slowly**: Take 5 deep breaths in and out\n\u2022 **Talk to someone**: Reach out to a caregiver or friend\n\u2022 **Do something small**: Complete one easy task to feel accomplished\n\u2022 **Practice self-care**: Listen to music, take a walk, or do something you enjoy\n\u2022 **Remember your strengths**: Think about recent successes you've had\n\nIf these feelings continue, please talk to a trusted caregiver or healthcare provider. You matter and your feelings are valid.";
  }
  if (lowerMessage.includes("task") || lowerMessage.includes("todo") || lowerMessage.includes("routine") || lowerMessage.includes("schedule") || lowerMessage.includes("organize")) {
    return "Building good routines is a key independence skill! Here's my step-by-step approach:\n\n**Getting Started:**\n\u2022 Begin with just 2-3 simple tasks daily\n\u2022 Choose the same time each day for consistency\n\u2022 Write tasks down or use the Daily Tasks feature\n\n**Making Tasks Easier:**\n\u2022 Break big tasks into small steps\n\u2022 Set realistic goals you can achieve\n\u2022 Celebrate each completion, no matter how small\n\n**Building Habits:**\n\u2022 Start with things you already do (like brushing teeth)\n\u2022 Add new tasks one at a time\n\u2022 Use reminders and alarms\n\nWould you like help creating a specific routine or organizing a particular task?";
  }
  if (lowerMessage.includes("money") || lowerMessage.includes("budget") || lowerMessage.includes("bill") || lowerMessage.includes("save") || lowerMessage.includes("spend")) {
    return "Managing money wisely is an important life skill! Here's how to get started:\n\n**Budgeting Basics:**\n\u2022 List your monthly income (job, benefits, family support)\n\u2022 Track your essential expenses (rent, food, bills)\n\u2022 Set aside money for savings, even if it's small\n\u2022 Use the Financial section to monitor spending\n\n**Bill Management:**\n\u2022 Set up payment reminders for due dates\n\u2022 Keep important account information in a safe place\n\u2022 Ask for help understanding bills you don't recognize\n\u2022 Pay essential bills first (housing, utilities, food)\n\n**Smart Spending:**\n\u2022 Compare prices before big purchases\n\u2022 Wait 24 hours before buying non-essential items\n\u2022 Look for discounts and sales\n\nWould you like help setting up a specific budget or understanding a particular bill?";
  }
  if (lowerMessage.includes("medication") || lowerMessage.includes("medicine") || lowerMessage.includes("pill") || lowerMessage.includes("doctor") || lowerMessage.includes("health")) {
    return "Taking care of your health is very important! Here's how to stay organized:\n\n**Medication Safety:**\n\u2022 Take medications exactly as prescribed\n\u2022 Use the Pharmacy section to track all your medicines\n\u2022 Set daily reminders for pill times\n\u2022 Never skip doses without talking to your doctor first\n\u2022 Keep a list of all medications with you\n\n**Doctor Appointments:**\n\u2022 Write down questions before visits\n\u2022 Bring a list of your medications\n\u2022 Ask for clarification if you don't understand something\n\u2022 Use the Calendar feature to track appointments\n\n**Emergency Information:**\n\u2022 Keep emergency contacts easily accessible\n\u2022 Know your allergies and medical conditions\n\u2022 Have a plan for medical emergencies\n\nRemember: Always consult with healthcare professionals for medical advice. I can help you stay organized, but your doctors are the experts!";
  }
  if (lowerMessage.includes("cook") || lowerMessage.includes("food") || lowerMessage.includes("meal") || lowerMessage.includes("eat") || lowerMessage.includes("recipe")) {
    return "Cooking and eating well are important for your health and independence! Here are some tips:\n\n**Easy Cooking Tips:**\n\u2022 Start with simple recipes (sandwiches, pasta, eggs)\n\u2022 Read recipes completely before starting\n\u2022 Gather all ingredients first\n\u2022 Keep your cooking area clean and safe\n\u2022 Ask for help when trying new techniques\n\n**Meal Planning:**\n\u2022 Plan 3-4 simple meals for the week\n\u2022 Make a shopping list before going to the store\n\u2022 Use the Meal Planning feature to stay organized\n\u2022 Include fruits and vegetables in your meals\n\u2022 Keep healthy snacks available\n\n**Food Safety:**\n\u2022 Wash hands before cooking\n\u2022 Check expiration dates\n\u2022 Store food properly\n\u2022 Cook meat thoroughly\n\nWould you like help planning meals for this week or learning a specific cooking skill?";
  }
  if (lowerMessage.includes("friend") || lowerMessage.includes("social") || lowerMessage.includes("talk") || lowerMessage.includes("communicate") || lowerMessage.includes("caregiver")) {
    return "Building and maintaining relationships is a wonderful part of life! Here's how to strengthen your connections:\n\n**Staying Connected:**\n\u2022 Use the Caregiver features to message your support team\n\u2022 Schedule regular check-ins with friends and family\n\u2022 Share your successes and challenges with trusted people\n\u2022 Ask for help when you need it - that's what support networks are for!\n\n**Making New Friends:**\n\u2022 Join activities or groups that interest you\n\u2022 Be yourself and show genuine interest in others\n\u2022 Start with small conversations\n\u2022 Remember that friendships take time to develop\n\n**Communication Tips:**\n\u2022 Listen actively when others speak\n\u2022 Ask questions to show you're interested\n\u2022 Share your own experiences and feelings\n\u2022 Be patient and kind with yourself and others\n\nYour support team is here because they care about you. Don't hesitate to reach out when you need encouragement or assistance!";
  }
  if (lowerMessage.includes("learn") || lowerMessage.includes("skill") || lowerMessage.includes("independence") || lowerMessage.includes("grow")) {
    return "Learning new skills is exciting and helps you become more independent! Here's how to approach it:\n\n**Learning Strategies:**\n\u2022 Break skills into small, manageable steps\n\u2022 Practice regularly, even for just a few minutes\n\u2022 Don't be afraid to make mistakes - they're part of learning\n\u2022 Ask questions when you don't understand\n\u2022 Celebrate small improvements\n\n**Independence Skills to Focus On:**\n\u2022 Personal care (hygiene, dressing, grooming)\n\u2022 Household tasks (cleaning, laundry, organization)\n\u2022 Money management (budgeting, shopping, bill paying)\n\u2022 Communication (phone calls, emails, asking for help)\n\u2022 Transportation (public transit, walking safety)\n\u2022 Health management (medication, appointments, self-care)\n\n**Getting Support:**\n\u2022 Use the Task Builder feature for step-by-step guides\n\u2022 Practice with a trusted caregiver or friend\n\u2022 Take your time - everyone learns at their own pace\n\u2022 Ask for help when you need it\n\nWhat new skill would you like to work on? I can help you break it down into manageable steps!";
  }
  if (lowerMessage.includes("app") || lowerMessage.includes("phone") || lowerMessage.includes("computer") || lowerMessage.includes("technology")) {
    return "Technology can be a great tool for independence! Here's how to make the most of it:\n\n**Using AdaptaLyfe Effectively:**\n\u2022 Explore each section (Daily Tasks, Financial, Mood, etc.)\n\u2022 Set up reminders and notifications\n\u2022 Update your information regularly\n\u2022 Use the search features to find what you need\n\u2022 Ask caregivers for help if you get stuck\n\n**General Technology Tips:**\n\u2022 Keep your devices charged and updated\n\u2022 Use simple passwords you can remember\n\u2022 Learn one new feature at a time\n\u2022 Don't be afraid to explore and experiment\n\u2022 Ask for help from tech-savvy friends or family\n\n**Safety Online:**\n\u2022 Don't share personal information with strangers\n\u2022 Be careful about clicking unknown links\n\u2022 Keep your private information secure\n\u2022 Ask for help if something seems suspicious\n\nRemember: Technology should make your life easier, not more stressful. Take your time learning, and don't hesitate to ask for support!";
  }
  return "Thank you for reaching out! I'm AdaptAI, and I'm here to support you on your independence journey. While I'm having some technical difficulties with my advanced features right now, I want you to know:\n\n**You're Doing Great!**\n\u2022 Using AdaptaLyfe shows you're taking charge of your independence\n\u2022 Every question you ask helps you learn and grow\n\u2022 It's completely normal to need support - we all do!\n\u2022 Your caregivers and support team believe in you\n\n**What I Can Help With:**\n\u2022 Daily task planning and organization\n\u2022 Money management and budgeting\n\u2022 Health and medication tracking\n\u2022 Meal planning and cooking tips\n\u2022 Building life skills and confidence\n\u2022 Connecting with your support network\n\n**Next Steps:**\n\u2022 Explore the different sections of the app\n\u2022 Try setting up a simple daily routine\n\u2022 Reach out to your caregivers if you need extra support\n\u2022 Remember that every small step forward is progress!\n\nIs there a specific area where you'd like to start? I'm here to help guide you through it!";
}
async function registerRoutes(app2) {
  configureForProduction();
  if (shouldInitializeDemoData()) {
    console.log("\u{1F680} Demo mode enabled - initializing demo data");
    initializeComprehensiveDemo();
  } else {
    console.log("\u{1F3ED} Production mode - skipping demo data initialization");
  }
  app2.use(session({
    secret: process.env.SESSION_SECRET || "demo-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  const requireAuth2 = async (req, res, next) => {
    if (!req.session.userId || !req.session.user) {
      console.log("\u274C No authenticated user - access denied to protected route");
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = req.session.user;
    next();
  };
  app2.post("/api/register", async (req, res) => {
    try {
      const { name, email, username, password, plan, subscribeNewsletter } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ message: "Username, password, and name are required" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        username,
        password,
        // In production, this would be hashed
        name,
        email: email || null
      });
      req.session.userId = user.id;
      req.session.user = user;
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
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
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.user = user;
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
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
  app2.post("/api/demo-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Demo login attempt:", { username, password });
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? { id: user.id, username: user.username, password: user.password } : "No user found");
      if (!user) {
        console.log("No user found for username:", username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.password !== password) {
        console.log("Password mismatch:", { provided: password, expected: user.password });
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      req.session.user = user;
      req.session.save((err) => {
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
  app2.post("/api/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
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
  app2.get("/api/user", async (req, res) => {
    console.log("\u{1F50D} Checking session for user authentication");
    console.log("Session ID:", req.sessionID);
    console.log("User-Agent:", req.headers["user-agent"]?.substring(0, 100));
    console.log("Cookies:", req.headers.cookie);
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    if (!req.session.userId || !req.session.user) {
      console.log("\u274C No authenticated user found in session");
      const isMobile = /Mobile|Android|iPhone|iPad/.test(req.headers["user-agent"] || "");
      console.log("\u{1F4F1} Mobile device detected:", isMobile);
      if (req.session.userId && !req.session.user) {
        console.log("\u{1F527} Attempting to rebuild user session from userId:", req.session.userId);
        try {
          const user2 = await storage.getUserById(req.session.userId);
          if (user2) {
            req.session.user = user2;
            await new Promise((resolve, reject) => {
              req.session.save((err) => {
                if (err) {
                  console.error("Session save error:", err);
                  reject(err);
                } else {
                  console.log("\u2705 Session rebuilt successfully");
                  resolve();
                }
              });
            });
            const { password: password2, ...userResponse2 } = user2;
            return res.json(userResponse2);
          }
        } catch (error) {
          console.error("Error rebuilding session:", error);
        }
      }
      return res.status(401).json({ message: "Authentication required", mobile: isMobile });
    }
    const user = req.session.user;
    console.log("\u2705 Authenticated user found:", user.username);
    const { password, ...userResponse } = user;
    res.json(userResponse);
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const { confirmPassword, ...userData } = validatedData;
      const newUser = await storage.createUser(userData);
      const { password, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });
  app2.get("/api/daily-tasks", async (req, res) => {
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
  app2.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const notifications2 = await storage.getNotificationsByUser(user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.post("/api/notifications/:id/read", async (req, res) => {
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
  app2.post("/api/test-reminder", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const testNotification = {
        userId: user.id,
        type: "test_reminder",
        title: "\u{1F514} Test Reminder",
        message: "This is a test reminder to verify the notification system is working properly.",
        priority: "normal",
        isRead: false,
        metadata: {
          source: "test",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      const notification = await storage.createNotification(testNotification);
      res.json({ message: "Test reminder sent", notification });
    } catch (error) {
      console.error("Error sending test reminder:", error);
      res.status(500).json({ message: "Failed to send test reminder" });
    }
  });
  app2.get("/api/user-preferences", async (req, res) => {
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
  app2.put("/api/user-preferences", async (req, res) => {
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
  app2.post("/api/daily-tasks", async (req, res) => {
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
  app2.patch("/api/daily-tasks/:id", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const taskId = parseInt(req.params.id);
      const updates = req.body;
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask || existingTask.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }
      const task = await storage.updateDailyTask(taskId, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({
        message: "Failed to update task",
        error: error.message
      });
    }
  });
  app2.patch("/api/daily-tasks/:id/complete", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const taskId = parseInt(req.params.id);
      const { isCompleted } = req.body;
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask || existingTask.userId !== user.id) {
        return res.status(404).json({ message: "Task not found" });
      }
      const task = await storage.updateTaskCompletion(taskId, isCompleted);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
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
        }
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task completion:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.get("/api/bills", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const bills2 = await storage.getBillsByUser(user.id);
      res.json(bills2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });
  app2.post("/api/bills", async (req, res) => {
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
  app2.patch("/api/bills/:id", async (req, res) => {
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
  app2.patch("/api/bills/:id/pay", async (req, res) => {
    const billId = parseInt(req.params.id);
    const { isPaid } = req.body;
    const bill = await storage.updateBillPayment(billId, isPaid);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  });
  app2.patch("/api/bills/:id/payment-link", async (req, res) => {
    try {
      const billId = parseInt(req.params.id);
      const { payeeWebsite, payeeAccountNumber } = req.body;
      const bill = await storage.updateBill(billId, {
        payeeWebsite,
        payeeAccountNumber
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
  app2.get("/api/bank-accounts", async (req, res) => {
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
  app2.post("/api/bank-accounts", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const requestData = req.body;
      const data = {
        userId: user.id,
        bankName: requestData.bankName,
        accountType: requestData.accountType,
        accountNickname: requestData.accountNickname,
        bankWebsite: requestData.bankWebsite,
        lastFour: requestData.lastFour
      };
      const account = await storage.createBankAccount(data);
      res.json(account);
    } catch (error) {
      console.error("Failed to create bank account:", error);
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });
  app2.delete("/api/bank-accounts/:id", async (req, res) => {
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
  app2.get("/api/mood-entries", async (req, res) => {
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
  app2.get("/api/mood-entries/today", async (req, res) => {
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
  app2.post("/api/mood-entries", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
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
  app2.get("/api/achievements", async (req, res) => {
    const achievements2 = await storage.getAchievementsByUser(1);
    res.json(achievements2);
  });
  app2.post("/api/achievements", async (req, res) => {
    try {
      const data = insertAchievementSchema.parse({ ...req.body, userId: 1 });
      const achievement = await storage.createAchievement(data);
      res.json(achievement);
    } catch (error) {
      res.status(400).json({ message: "Invalid achievement data" });
    }
  });
  app2.get("/api/caregivers", async (req, res) => {
    const caregivers2 = await storage.getCaregiversByUser(1);
    res.json(caregivers2);
  });
  app2.post("/api/caregivers", async (req, res) => {
    try {
      const data = insertCaregiverSchema.parse({ ...req.body, userId: 1 });
      const caregiver = await storage.createCaregiver(data);
      res.json(caregiver);
    } catch (error) {
      res.status(400).json({ message: "Invalid caregiver data" });
    }
  });
  app2.get("/api/messages", async (req, res) => {
    const messages2 = await storage.getMessagesByUser(1);
    res.json(messages2);
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      const data = insertMessageSchema.parse({ ...req.body, userId: 1 });
      const message = await storage.createMessage(data);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.get("/api/budget-entries", async (req, res) => {
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
  app2.post("/api/budget-entries", async (req, res) => {
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
  app2.get("/api/budget-categories", async (req, res) => {
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
  app2.post("/api/budget-categories", async (req, res) => {
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
  app2.patch("/api/budget-categories/:id", async (req, res) => {
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
  app2.get("/api/savings-goals", async (req, res) => {
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
  app2.post("/api/savings-goals", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const createSchema = z4.object({
        title: z4.string().min(1, "Goal title is required"),
        description: z4.string().optional(),
        targetAmount: z4.number().min(0.01, "Target amount must be greater than 0"),
        currentAmount: z4.number().min(0, "Current amount cannot be negative").default(0),
        targetDate: z4.string().transform((str) => str ? new Date(str) : null),
        category: z4.string().optional().default("general"),
        priority: z4.enum(["low", "medium", "high"]).default("medium"),
        userId: z4.number()
      });
      const data = createSchema.parse({ ...req.body, userId: user.id });
      const goal = await storage.createSavingsGoal(data);
      res.json(goal);
    } catch (error) {
      console.error("Failed to create savings goal:", error);
      res.status(400).json({ message: "Invalid savings goal data" });
    }
  });
  app2.patch("/api/savings-goals/:id", async (req, res) => {
    try {
      const goalId = parseInt(req.params.id);
      const updateSchema = z4.object({
        title: z4.string().optional(),
        description: z4.string().optional(),
        targetAmount: z4.number().optional(),
        currentAmount: z4.number().optional(),
        targetDate: z4.string().transform((str) => str ? new Date(str) : null).optional(),
        category: z4.string().optional(),
        priority: z4.enum(["low", "medium", "high"]).optional()
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
  app2.delete("/api/savings-goals/:id", async (req, res) => {
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
  app2.get("/api/savings-transactions", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const { goalId } = req.query;
      let transactions;
      if (goalId) {
        transactions = await storage.getSavingsTransactionsByGoal(parseInt(goalId));
      } else {
        transactions = await storage.getSavingsTransactionsByUser(user.id);
      }
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch savings transactions:", error);
      res.status(500).json({ message: "Failed to fetch savings transactions" });
    }
  });
  app2.post("/api/savings-transactions", async (req, res) => {
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
  app2.get("/api/appointments", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const appointments2 = await storage.getAppointmentsByUser(req.session.userId);
      res.json(appointments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });
  app2.get("/api/appointments/upcoming", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const appointments2 = await storage.getUpcomingAppointments(user.id);
      res.json(appointments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
  });
  app2.post("/api/appointments", async (req, res) => {
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
  app2.patch("/api/appointments/:id/complete", async (req, res) => {
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
  app2.get("/api/assignments", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const assignments2 = await storage.getAssignmentsByUser(user.id);
      res.json(assignments2);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  app2.post("/api/assignments", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        throw new Error("Invalid due date provided");
      }
      const assignmentData = {
        ...req.body,
        userId: user.id,
        dueDate
      };
      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Failed to create assignment:", error);
      res.status(400).json({ message: "Invalid assignment data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/academic-classes", async (req, res) => {
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
  app2.post("/api/academic-classes", async (req, res) => {
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
  app2.get("/api/study-sessions", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const studySessions2 = await storage.getStudySessionsByUser(user.id);
      res.json(studySessions2);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
      res.status(500).json({ message: "Failed to fetch study sessions" });
    }
  });
  app2.post("/api/study-sessions", async (req, res) => {
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
  app2.patch("/api/study-sessions/:id", async (req, res) => {
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
  app2.get("/api/campus-transport", async (req, res) => {
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
  app2.post("/api/campus-transport", async (req, res) => {
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
  app2.get("/api/campus-locations", async (req, res) => {
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
  app2.post("/api/campus-locations", async (req, res) => {
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
  app2.get("/api/study-groups", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const studyGroups2 = await storage.getStudyGroupsByUser(user.id);
      res.json(studyGroups2);
    } catch (error) {
      console.error("Error fetching study groups:", error);
      res.status(500).json({ message: "Failed to fetch study groups" });
    }
  });
  app2.post("/api/study-groups", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
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
  app2.get("/api/transition-skills", async (req, res) => {
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
  app2.post("/api/transition-skills", async (req, res) => {
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
  app2.patch("/api/transition-skills/:id", async (req, res) => {
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
  app2.delete("/api/transition-skills/:id", async (req, res) => {
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
  app2.get("/api/calendar-events", async (req, res) => {
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
  app2.post("/api/calendar-events", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
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
  app2.put("/api/calendar-events/:id", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const eventId = parseInt(req.params.id);
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
  app2.delete("/api/calendar-events/:id", async (req, res) => {
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
  app2.get("/api/meal-plans", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const mealPlans2 = await storage.getMealPlansByUser(user.id);
      res.json(mealPlans2);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });
  app2.post("/api/meal-plans", async (req, res) => {
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
  app2.patch("/api/meal-plans/:id/completion", async (req, res) => {
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
  app2.get("/api/meal-plans/date/:date", async (req, res) => {
    try {
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const date2 = req.params.date;
      const mealPlans2 = await storage.getMealPlansByDate(user.id, date2);
      res.json(mealPlans2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meal plans" });
    }
  });
  app2.get("/api/shopping-lists", async (req, res) => {
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
  app2.get("/api/shopping-lists/active", async (req, res) => {
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
  app2.post("/api/shopping-lists", async (req, res) => {
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
  app2.patch("/api/shopping-lists/:id/purchased", async (req, res) => {
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
  app2.get("/api/grocery-stores", async (req, res) => {
    try {
      const stores = await storage.getGroceryStoresByUser(1);
      res.json(stores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery stores" });
    }
  });
  app2.post("/api/grocery-stores", async (req, res) => {
    try {
      const data = { ...req.body, userId: 1 };
      const store = await storage.createGroceryStore(data);
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid grocery store data" });
    }
  });
  app2.put("/api/grocery-stores/:id", async (req, res) => {
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
  app2.delete("/api/grocery-stores/:id", async (req, res) => {
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
  app2.get("/api/emergency-resources", async (req, res) => {
    try {
      const userId = req.session?.user?.id || 1;
      const resources = await storage.getEmergencyResourcesByUser(userId);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching emergency resources:", error);
      res.status(500).json({ message: "Failed to fetch emergency resources" });
    }
  });
  app2.post("/api/emergency-resources", async (req, res) => {
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
  app2.put("/api/emergency-resources/:id", async (req, res) => {
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
  app2.delete("/api/emergency-resources/:id", async (req, res) => {
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
  app2.get("/api/caregiver-access", async (req, res) => {
    try {
      console.log("\u{1F50D} Checking caregiver access for session:", req.session?.userId);
      console.log("\u{1F50D} Session user:", req.session?.user?.username);
      if (!req.session?.userId || !req.session?.user) {
        console.log("\u274C No valid session found");
        return res.status(401).json({ message: "User not authenticated" });
      }
      const currentUser = req.session.user;
      console.log("\u2705 Caregiver access check for user:", currentUser.username);
      const isCaregiver = true;
      res.json({
        isCaregiver,
        userId: currentUser.id,
        username: currentUser.username,
        demoMode: true,
        // Indicate this is soft launch demo access
        message: "Soft launch testing mode - caregiver dashboard access granted for demo purposes"
      });
    } catch (error) {
      console.error("Error checking caregiver access:", error);
      res.status(500).json({ message: "Failed to verify caregiver access" });
    }
  });
  app2.post("/api/backup/sync", requireAuth2, async (req, res) => {
    try {
      const backupData = req.body;
      const userId = req.user.id;
      res.json({
        success: true,
        message: "Backup synced successfully",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Backup sync error:", error);
      res.status(500).json({ error: "Failed to sync backup" });
    }
  });
  app2.post("/api/sync-offline-data", requireAuth2, async (req, res) => {
    try {
      const offlineData = req.body;
      const userId = req.user.id;
      res.json({
        success: true,
        message: "Offline data synced successfully"
      });
    } catch (error) {
      console.error("Offline sync error:", error);
      res.status(500).json({ error: "Failed to sync offline data" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, userId } = req.body;
      if (!message || !userId) {
        return res.status(400).json({ error: "Message and userId are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const systemPrompt = `You are AdaptAI, a supportive AI assistant for AdaptaLyfe, an app designed to help individuals with developmental disabilities build independence and confidence.

User context:
- Name: ${user.name || user.username}
- Subscription: ${user.subscriptionTier || "basic"}

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
        presence_penalty: 0.3
      });
      const response = completion.choices[0]?.message?.content || "I'm here to help! Could you ask me again?";
      res.json({
        message: response,
        type: "text"
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      if (error.status === 429 || error.code === "insufficient_quota") {
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
  app2.get("/api/chat/suggestions", async (req, res) => {
    try {
      const suggestions = [
        {
          id: "help-1",
          text: "How do I create a daily routine?",
          category: "help"
        },
        {
          id: "encouragement-1",
          text: "I'm feeling overwhelmed today",
          category: "encouragement"
        },
        {
          id: "planning-1",
          text: "Help me plan my week",
          category: "planning"
        },
        {
          id: "skills-1",
          text: "I want to learn something new",
          category: "skills"
        },
        {
          id: "help-2",
          text: "How do I organize my medications?",
          category: "help"
        },
        {
          id: "encouragement-2",
          text: "I accomplished something today!",
          category: "encouragement"
        },
        {
          id: "planning-2",
          text: "Help me build a daily routine",
          category: "planning"
        },
        {
          id: "skills-2",
          text: "Show me simple cooking tips",
          category: "skills"
        },
        {
          id: "help-3",
          text: "Help me understand my budget",
          category: "help"
        },
        {
          id: "help-4",
          text: "How do I use this app?",
          category: "help"
        },
        {
          id: "social-1",
          text: "I want to connect with my caregivers",
          category: "help"
        },
        {
          id: "encouragement-3",
          text: "I need some motivation today",
          category: "encouragement"
        }
      ];
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting chat suggestions:", error);
      res.status(500).json({ error: "Failed to get suggestions" });
    }
  });
  app2.get("/api/rewards", async (req, res) => {
    try {
      console.log("=== REWARDS: GET /api/rewards (FIRST ROUTE) ===");
      console.log("Session data:", req.session);
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log("Final user ID:", req.session.userId);
      const rewards2 = await storage.getRewardsByUser(req.session.userId);
      console.log("Found rewards count:", rewards2.length);
      res.json(rewards2);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });
  app2.post("/api/rewards", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const rewardData = {
        ...req.body,
        userId: req.session.userId,
        caregiverId: req.body.caregiverId || 1
        // Default to caregiver ID 1 (Mom)
      };
      const reward = await storage.createReward(rewardData);
      res.json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ message: "Failed to create reward" });
    }
  });
  app2.post("/api/rewards/:id/redeem", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const rewardId = parseInt(req.params.id);
      const redemption = await storage.redeemReward(req.session.userId, rewardId);
      res.json(redemption);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      res.status(500).json({ message: "Failed to redeem reward" });
    }
  });
  app2.get("/api/points/balance", async (req, res) => {
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
  app2.get("/api/points/transactions", async (req, res) => {
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
  app2.post("/api/points/transactions", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const transactionData = { ...req.body, userId: req.session.userId };
      const transaction = await storage.createPointsTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating points transaction:", error);
      res.status(500).json({ message: "Failed to create points transaction" });
    }
  });
  app2.get("/api/caregiver-permissions/:userId/:caregiverId", async (req, res) => {
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
  app2.post("/api/caregiver-permissions", async (req, res) => {
    try {
      const permission = await storage.setCaregiverPermission(req.body);
      res.json(permission);
    } catch (error) {
      console.error("Error setting caregiver permission:", error);
      res.status(400).json({ message: "Failed to set caregiver permission" });
    }
  });
  app2.delete("/api/caregiver-permissions/:userId/:caregiverId/:permissionType", async (req, res) => {
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
  app2.get("/api/locked-settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getLockedUserSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching locked settings:", error);
      res.status(500).json({ message: "Failed to fetch locked settings" });
    }
  });
  app2.post("/api/caregiver-invitations", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const invitationData = {
        ...req.body,
        caregiverId: user.id
        // Use authenticated user's ID
      };
      console.log("Creating caregiver invitation:", invitationData);
      const invitation = await storage.createCaregiverInvitation(invitationData);
      console.log("Invitation created successfully:", invitation);
      res.json(invitation);
    } catch (error) {
      console.error("Error creating caregiver invitation:", error);
      res.status(400).json({ message: "Failed to create caregiver invitation", error: error.message });
    }
  });
  app2.get("/api/caregiver-invitations/:caregiverId", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const caregiverId = parseInt(req.params.caregiverId);
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
  app2.get("/api/invitation/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const invitation = await storage.getCaregiverInvitation(code);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (/* @__PURE__ */ new Date() > new Date(invitation.expiresAt)) {
        await storage.expireCaregiverInvitation(code);
        return res.status(410).json({ message: "Invitation has expired" });
      }
      if (invitation.status !== "pending") {
        return res.status(400).json({ message: "Invitation is no longer valid" });
      }
      res.json(invitation);
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });
  app2.post("/api/accept-invitation", async (req, res) => {
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
  app2.get("/api/care-relationships/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const relationships = await storage.getCareRelationshipsByUser(userId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching care relationships:", error);
      res.status(500).json({ message: "Failed to fetch care relationships" });
    }
  });
  app2.get("/api/care-relationships/caregiver/:caregiverId", async (req, res) => {
    try {
      const caregiverId = parseInt(req.params.caregiverId);
      const relationships = await storage.getCareRelationshipsByCaregiver(caregiverId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching care relationships:", error);
      res.status(500).json({ message: "Failed to fetch care relationships" });
    }
  });
  app2.get("/api/locked-settings/:userId/:settingKey", async (req, res) => {
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
  app2.post("/api/locked-settings", async (req, res) => {
    try {
      const setting = await storage.lockUserSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error locking user setting:", error);
      res.status(400).json({ message: "Failed to lock user setting" });
    }
  });
  app2.delete("/api/locked-settings/:userId/:settingKey", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { settingKey } = req.params;
      const caregiverId = parseInt(req.body.caregiverId || req.query.caregiverId);
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
  app2.get("/api/settings-check/:userId/:settingKey/locked", async (req, res) => {
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
  app2.get("/api/settings-check/:userId/:settingKey/modifiable", async (req, res) => {
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
  app2.get("/api/pharmacies", async (req, res) => {
    try {
      const pharmacies2 = await storage.getPharmacies();
      res.json(pharmacies2);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      res.status(500).json({ message: "Failed to fetch pharmacies" });
    }
  });
  app2.post("/api/pharmacies", async (req, res) => {
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
  app2.post("/api/user-pharmacies", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userPharmacyData = {
        ...req.body,
        userId: user.id,
        pharmacyId: parseInt(req.body.pharmacyId)
        // Convert string to number
      };
      const validatedData = insertUserPharmacySchema.parse(userPharmacyData);
      const userPharmacy = await storage.addUserPharmacy(validatedData);
      res.status(201).json(userPharmacy);
    } catch (error) {
      console.error("Error adding user pharmacy:", error);
      res.status(500).json({ message: "Failed to add pharmacy" });
    }
  });
  app2.get("/api/user-pharmacies", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userPharmacies2 = await storage.getUserPharmacies(user.id);
      res.json(userPharmacies2);
    } catch (error) {
      console.error("Error fetching user pharmacies:", error);
      res.status(500).json({ message: "Failed to fetch user pharmacies" });
    }
  });
  app2.get("/api/medications", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const medications2 = await storage.getMedicationsByUser(user.id);
      res.json(medications2);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });
  app2.post("/api/medications", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
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
  app2.get("/api/medications/due-for-refill", async (req, res) => {
    try {
      const user = req.session?.user || req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const medications2 = await storage.getMedicationsDueForRefill(user.id);
      res.json(medications2);
    } catch (error) {
      console.error("Error fetching medications due for refill:", error);
      res.status(500).json({ message: "Failed to fetch medications due for refill" });
    }
  });
  app2.get("/api/refill-orders", async (req, res) => {
    try {
      const userId = 1;
      const refillOrders2 = await storage.getRefillOrdersByUser(userId);
      res.json(refillOrders2);
    } catch (error) {
      console.error("Error fetching refill orders:", error);
      res.status(500).json({ message: "Failed to fetch refill orders" });
    }
  });
  app2.post("/api/refill-orders", async (req, res) => {
    try {
      const validatedData = insertRefillOrderSchema.parse(req.body);
      const refillOrder = await storage.createRefillOrder(validatedData);
      res.status(201).json(refillOrder);
    } catch (error) {
      console.error("Error creating refill order:", error);
      res.status(500).json({ message: "Failed to create refill order" });
    }
  });
  app2.patch("/api/refill-orders/:id/status", async (req, res) => {
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
  app2.get("/api/allergies", async (req, res) => {
    try {
      const userId = 1;
      const allergies2 = await storage.getAllergiesByUser(userId);
      res.json(allergies2);
    } catch (error) {
      console.error("Error fetching allergies:", error);
      res.status(500).json({ message: "Failed to fetch allergies" });
    }
  });
  app2.post("/api/allergies", async (req, res) => {
    try {
      const userId = 1;
      const allergyData = { ...req.body, userId };
      const allergy = await storage.createAllergy(allergyData);
      res.status(201).json(allergy);
    } catch (error) {
      console.error("Error creating allergy:", error);
      res.status(500).json({ message: "Failed to create allergy" });
    }
  });
  app2.put("/api/allergies/:id", async (req, res) => {
    try {
      const allergyId = parseInt(req.params.id);
      const allergy = await storage.updateAllergy(allergyId, req.body);
      res.json(allergy);
    } catch (error) {
      console.error("Error updating allergy:", error);
      res.status(500).json({ message: "Failed to update allergy" });
    }
  });
  app2.delete("/api/allergies/:id", async (req, res) => {
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
  app2.get("/api/medical-conditions", async (req, res) => {
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
  app2.post("/api/medical-conditions", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
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
  app2.put("/api/medical-conditions/:id", async (req, res) => {
    try {
      const conditionId = parseInt(req.params.id);
      const condition = await storage.updateMedicalCondition(conditionId, req.body);
      res.json(condition);
    } catch (error) {
      console.error("Error updating medical condition:", error);
      res.status(500).json({ message: "Failed to update medical condition" });
    }
  });
  app2.delete("/api/medical-conditions/:id", async (req, res) => {
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
  app2.get("/api/adverse-medications", async (req, res) => {
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
  app2.post("/api/adverse-medications", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
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
  app2.put("/api/adverse-medications/:id", async (req, res) => {
    try {
      const adverseMedId = parseInt(req.params.id);
      const adverseMed = await storage.updateAdverseMedication(adverseMedId, req.body);
      res.json(adverseMed);
    } catch (error) {
      console.error("Error updating adverse medication:", error);
      res.status(500).json({ message: "Failed to update adverse medication" });
    }
  });
  app2.delete("/api/adverse-medications/:id", async (req, res) => {
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
  app2.get("/api/sleep-sessions", async (req, res) => {
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
  app2.post("/api/sleep-sessions", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const sessionData = { ...req.body, userId: req.session.user.id };
      if (sessionData.bedtime) {
        sessionData.bedtime = new Date(sessionData.bedtime);
      }
      if (sessionData.sleepTime) {
        sessionData.sleepTime = new Date(sessionData.sleepTime);
      }
      if (sessionData.wakeTime) {
        sessionData.wakeTime = new Date(sessionData.wakeTime);
      }
      const session2 = await storage.createSleepSession(sessionData);
      res.status(201).json(session2);
    } catch (error) {
      console.error("Error creating sleep session:", error);
      res.status(500).json({ message: "Failed to create sleep session" });
    }
  });
  app2.put("/api/sleep-sessions/:id", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const sessionId = parseInt(req.params.id);
      const updates = { ...req.body };
      if (updates.bedtime) {
        updates.bedtime = new Date(updates.bedtime);
      }
      if (updates.sleepTime) {
        updates.sleepTime = new Date(updates.sleepTime);
      }
      if (updates.wakeTime) {
        updates.wakeTime = new Date(updates.wakeTime);
      }
      const session2 = await storage.updateSleepSession(sessionId, updates);
      if (!session2) {
        return res.status(404).json({ message: "Sleep session not found" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error updating sleep session:", error);
      res.status(500).json({ message: "Failed to update sleep session" });
    }
  });
  app2.delete("/api/sleep-sessions/:id", async (req, res) => {
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
  app2.get("/api/sleep-sessions/date/:date", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const session2 = await storage.getSleepSessionByDate(req.session.user.id, req.params.date);
      if (!session2) {
        return res.status(404).json({ message: "No sleep session found for this date" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error fetching sleep session by date:", error);
      res.status(500).json({ message: "Failed to fetch sleep session" });
    }
  });
  app2.get("/api/health-metrics", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { metricType, startDate, endDate } = req.query;
      const metrics = await storage.getHealthMetricsByUser(
        req.session.user.id,
        metricType,
        startDate,
        endDate
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });
  app2.post("/api/health-metrics", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const metricData = { ...req.body, userId: req.session.user.id };
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
  app2.get("/api/emergency-contacts", async (req, res) => {
    try {
      const userId = 1;
      const contacts = await storage.getEmergencyContactsByUser(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ message: "Failed to fetch emergency contacts" });
    }
  });
  app2.post("/api/emergency-contacts", async (req, res) => {
    try {
      const userId = 1;
      const contactData = { ...req.body, userId };
      const contact = await storage.createEmergencyContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ message: "Failed to create emergency contact" });
    }
  });
  app2.put("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.updateEmergencyContact(contactId, req.body);
      res.json(contact);
    } catch (error) {
      console.error("Error updating emergency contact:", error);
      res.status(500).json({ message: "Failed to update emergency contact" });
    }
  });
  app2.delete("/api/emergency-contacts/:id", async (req, res) => {
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
  app2.get("/api/primary-care-providers", async (req, res) => {
    try {
      const userId = 1;
      const providers = await storage.getPrimaryCareProvidersByUser(userId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching primary care providers:", error);
      res.status(500).json({ message: "Failed to fetch primary care providers" });
    }
  });
  app2.post("/api/primary-care-providers", async (req, res) => {
    try {
      const userId = 1;
      const providerData = { ...req.body, userId };
      const provider = await storage.createPrimaryCareProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating primary care provider:", error);
      res.status(500).json({ message: "Failed to create primary care provider" });
    }
  });
  app2.put("/api/primary-care-providers/:id", async (req, res) => {
    try {
      const providerId = parseInt(req.params.id);
      const provider = await storage.updatePrimaryCareProvider(providerId, req.body);
      res.json(provider);
    } catch (error) {
      console.error("Error updating primary care provider:", error);
      res.status(500).json({ message: "Failed to update primary care provider" });
    }
  });
  app2.delete("/api/primary-care-providers/:id", async (req, res) => {
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
  app2.get("/api/symptom-entries", async (req, res) => {
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
  app2.get("/api/symptom-entries/date-range", async (req, res) => {
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
        startDate,
        endDate
      );
      res.json(entries);
    } catch (error) {
      console.error("Error fetching symptom entries by date range:", error);
      res.status(500).json({ message: "Failed to fetch symptom entries" });
    }
  });
  app2.post("/api/symptom-entries", async (req, res) => {
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
  app2.patch("/api/symptom-entries/:id", async (req, res) => {
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
  app2.delete("/api/symptom-entries/:id", async (req, res) => {
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
  app2.get("/api/personal-resources", async (req, res) => {
    try {
      const userId = 1;
      const { category } = req.query;
      let resources;
      if (category && typeof category === "string") {
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
  app2.post("/api/personal-resources", async (req, res) => {
    try {
      const userId = 1;
      const resourceData = insertPersonalResourceSchema.parse({ ...req.body, userId });
      const resource = await storage.createPersonalResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating personal resource:", error);
      res.status(500).json({ message: "Failed to create personal resource" });
    }
  });
  app2.patch("/api/personal-resources/:id", async (req, res) => {
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
  app2.delete("/api/personal-resources/:id", async (req, res) => {
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
  app2.patch("/api/personal-resources/:id/access", async (req, res) => {
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
  app2.get("/api/bus-schedules", async (req, res) => {
    try {
      const userId = 1;
      const schedules = await storage.getBusSchedulesByUser(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching bus schedules:", error);
      res.status(500).json({ message: "Failed to fetch bus schedules" });
    }
  });
  app2.get("/api/bus-schedules/day/:day", async (req, res) => {
    try {
      const userId = 1;
      const { day } = req.params;
      const schedules = await storage.getBusSchedulesByDay(userId, day);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching bus schedules by day:", error);
      res.status(500).json({ message: "Failed to fetch bus schedules by day" });
    }
  });
  app2.get("/api/bus-schedules/frequent", async (req, res) => {
    try {
      const userId = 1;
      const schedules = await storage.getFrequentBusRoutes(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching frequent bus routes:", error);
      res.status(500).json({ message: "Failed to fetch frequent bus routes" });
    }
  });
  app2.post("/api/bus-schedules", async (req, res) => {
    try {
      const userId = 1;
      const data = insertBusScheduleSchema.parse({ ...req.body, userId });
      const schedule = await storage.createBusSchedule(data);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating bus schedule:", error);
      res.status(500).json({ message: "Failed to create bus schedule" });
    }
  });
  app2.put("/api/bus-schedules/:id", async (req, res) => {
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
  app2.delete("/api/bus-schedules/:id", async (req, res) => {
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
  app2.get("/api/emergency-treatment-plans", async (req, res) => {
    try {
      const userId = 1;
      const plans = await storage.getEmergencyTreatmentPlansByUser(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching emergency treatment plans:", error);
      res.status(500).json({ message: "Failed to fetch emergency treatment plans" });
    }
  });
  app2.get("/api/emergency-treatment-plans/active", async (req, res) => {
    try {
      const userId = 1;
      const plans = await storage.getActiveEmergencyTreatmentPlans(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching active emergency treatment plans:", error);
      res.status(500).json({ message: "Failed to fetch active emergency treatment plans" });
    }
  });
  app2.post("/api/emergency-treatment-plans", async (req, res) => {
    try {
      const userId = 1;
      const data = insertEmergencyTreatmentPlanSchema.parse({ ...req.body, userId });
      const plan = await storage.createEmergencyTreatmentPlan(data);
      res.json(plan);
    } catch (error) {
      console.error("Error creating emergency treatment plan:", error);
      res.status(500).json({ message: "Failed to create emergency treatment plan" });
    }
  });
  app2.put("/api/emergency-treatment-plans/:id", async (req, res) => {
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
  app2.delete("/api/emergency-treatment-plans/:id", async (req, res) => {
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
  app2.get("/api/geofences", async (req, res) => {
    try {
      const geofences2 = await storage.getGeofencesByUser(1);
      res.json(geofences2);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({ message: "Failed to fetch geofences" });
    }
  });
  app2.get("/api/geofences/active", async (req, res) => {
    try {
      const geofences2 = await storage.getActiveGeofencesByUser(1);
      res.json(geofences2);
    } catch (error) {
      console.error("Error fetching active geofences:", error);
      res.status(500).json({ message: "Failed to fetch active geofences" });
    }
  });
  app2.post("/api/geofences", async (req, res) => {
    try {
      const geofenceData = { ...req.body, userId: 1 };
      const geofence = await storage.createGeofence(geofenceData);
      res.json(geofence);
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence" });
    }
  });
  app2.put("/api/geofences/:id", async (req, res) => {
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
  app2.delete("/api/geofences/:id", async (req, res) => {
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
  app2.get("/api/geofence-events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const events = await storage.getGeofenceEventsByUser(1, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofence events:", error);
      res.status(500).json({ message: "Failed to fetch geofence events" });
    }
  });
  app2.get("/api/geofences/:id/events", async (req, res) => {
    try {
      const geofenceId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit) || 50;
      const events = await storage.getGeofenceEventsByGeofence(geofenceId, limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofence events:", error);
      res.status(500).json({ message: "Failed to fetch geofence events" });
    }
  });
  app2.post("/api/geofence-events", async (req, res) => {
    try {
      const eventData = { ...req.body, userId: 1 };
      const event = await storage.createGeofenceEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating geofence event:", error);
      res.status(500).json({ message: "Failed to create geofence event" });
    }
  });
  app2.put("/api/geofence-events/:id/notify", async (req, res) => {
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
  app2.get("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1;
      const preferences = await storage.getUserPreferences(userId);
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
  app2.post("/api/user-preferences", async (req, res) => {
    try {
      const userId = 1;
      const preferencesData = req.body;
      const preferences = await storage.upsertUserPreferences(userId, preferencesData);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(400).json({ message: "Failed to update user preferences" });
    }
  });
  app2.get("/api/wearable-devices", async (req, res) => {
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
          lastSync: (/* @__PURE__ */ new Date()).toISOString(),
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
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
          // 2 hours ago
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
          lastSync: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
          // 30 minutes ago
          features: ["heart_rate", "steps", "sleep", "workouts", "blood_oxygen", "body_composition", "ecg"]
        }
      ];
      res.json(demoDevices);
    } catch (error) {
      console.error("Error fetching wearable devices:", error);
      res.status(500).json({ message: "Failed to fetch wearable devices" });
    }
  });
  app2.get("/api/health-metrics", async (req, res) => {
    try {
      const demoMetrics = [
        {
          id: 1,
          metricType: "heart_rate",
          value: 72,
          unit: "bpm",
          recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
          context: "resting",
          deviceId: 1
          // Apple Watch
        },
        {
          id: 2,
          metricType: "steps",
          value: 7543,
          unit: "steps",
          recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
          context: "daily_total",
          deviceId: 1
          // Apple Watch
        },
        {
          id: 3,
          metricType: "blood_oxygen",
          value: 98,
          unit: "%",
          recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
          context: "resting",
          deviceId: 1
          // Apple Watch
        },
        {
          id: 4,
          metricType: "heart_rate",
          value: 68,
          unit: "bpm",
          recordedAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
          context: "resting",
          deviceId: 3
          // Galaxy Watch
        },
        {
          id: 5,
          metricType: "steps",
          value: 8124,
          unit: "steps",
          recordedAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
          context: "daily_total",
          deviceId: 3
          // Galaxy Watch
        },
        {
          id: 6,
          metricType: "blood_oxygen",
          value: 97,
          unit: "%",
          recordedAt: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
          context: "resting",
          deviceId: 3
          // Galaxy Watch
        }
      ];
      res.json(demoMetrics);
    } catch (error) {
      console.error("Error fetching health metrics:", error);
      res.status(500).json({ message: "Failed to fetch health metrics" });
    }
  });
  app2.get("/api/activity-sessions", async (req, res) => {
    try {
      const demoActivities = [
        {
          id: 1,
          activityType: "walking",
          duration: 45,
          caloriesBurned: 185,
          steps: 3200,
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1e3).toISOString(),
          // 3 hours ago
          deviceId: 1
          // Apple Watch
        },
        {
          id: 2,
          activityType: "cycling",
          duration: 30,
          caloriesBurned: 240,
          steps: 0,
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString(),
          // yesterday
          deviceId: 2
          // Fitbit
        },
        {
          id: 3,
          activityType: "strength_training",
          duration: 25,
          caloriesBurned: 120,
          steps: 150,
          startedAt: new Date(Date.now() - 48 * 60 * 60 * 1e3).toISOString(),
          // 2 days ago
          deviceId: 1
          // Apple Watch
        },
        {
          id: 4,
          activityType: "running",
          duration: 35,
          caloriesBurned: 320,
          steps: 4200,
          startedAt: new Date(Date.now() - 6 * 60 * 60 * 1e3).toISOString(),
          // 6 hours ago
          deviceId: 3
          // Galaxy Watch
        },
        {
          id: 5,
          activityType: "yoga",
          duration: 20,
          caloriesBurned: 95,
          steps: 50,
          startedAt: new Date(Date.now() - 12 * 60 * 60 * 1e3).toISOString(),
          // 12 hours ago
          deviceId: 3
          // Galaxy Watch
        }
      ];
      res.json(demoActivities);
    } catch (error) {
      console.error("Error fetching activity sessions:", error);
      res.status(500).json({ message: "Failed to fetch activity sessions" });
    }
  });
  app2.get("/api/sleep-sessions", async (req, res) => {
    try {
      const demoSleep = [
        {
          id: 1,
          sleepDate: new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
          // last night
          totalSleepDuration: 450,
          // 7.5 hours in minutes
          sleepScore: 85,
          quality: "good"
        },
        {
          id: 2,
          sleepDate: new Date(Date.now() - 48 * 60 * 60 * 1e3).toISOString().split("T")[0],
          // 2 nights ago
          totalSleepDuration: 420,
          // 7 hours
          sleepScore: 78,
          quality: "fair"
        },
        {
          id: 3,
          sleepDate: new Date(Date.now() - 72 * 60 * 60 * 1e3).toISOString().split("T")[0],
          // 3 nights ago
          totalSleepDuration: 480,
          // 8 hours
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
  app2.post("/api/wearable-devices/:id/sync", async (req, res) => {
    try {
      const deviceId = parseInt(req.params.id);
      setTimeout(() => {
        res.json({
          message: "Device synced successfully",
          deviceId,
          lastSync: (/* @__PURE__ */ new Date()).toISOString()
        });
      }, 1e3);
    } catch (error) {
      console.error("Error syncing device:", error);
      res.status(500).json({ message: "Failed to sync device" });
    }
  });
  app2.get("/api/subscription", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      const now = /* @__PURE__ */ new Date();
      const isAdmin = user.accountType === "admin" || user.username === "admin" || user.name?.toLowerCase().includes("admin");
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
      const trialEndDate = new Date(user.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      const trialDaysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1e3)));
      const isActiveSubscription = user.subscriptionStatus === "active" && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;
      const subscription = {
        id: user.id,
        planType: user.subscriptionTier || "free",
        status: isActiveSubscription ? "active" : trialDaysLeft > 0 ? "trialing" : "expired",
        billingCycle: "monthly",
        currentPeriodStart: user.createdAt,
        currentPeriodEnd: user.subscriptionExpiresAt || trialEndDate.toISOString(),
        trialDaysLeft: trialDaysLeft > 0 ? trialDaysLeft : null,
        usageStats: {
          tasks: { count: 0, limit: user.subscriptionTier === "family" ? null : user.subscriptionTier === "premium" ? 1e3 : 50 },
          caregivers: { count: 0, limit: user.subscriptionTier === "family" ? null : user.subscriptionTier === "premium" ? 5 : 1 },
          dataExports: { count: 0, limit: user.subscriptionTier === "free" ? 0 : null }
        },
        features: {
          wearableDevices: user.subscriptionTier !== "free",
          mealPlanning: user.subscriptionTier !== "free",
          medicationManagement: user.subscriptionTier !== "free",
          locationSafety: user.subscriptionTier === "family",
          advancedAnalytics: user.subscriptionTier === "family",
          prioritySupport: user.subscriptionTier !== "free"
        }
      };
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });
  app2.post("/api/subscription/upgrade", async (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { planType, billingCycle } = req.body;
      const user = req.session.user;
      const trialEndDate = /* @__PURE__ */ new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      req.session.user = {
        ...user,
        subscriptionTier: planType,
        subscriptionStatus: "trialing",
        subscriptionExpiresAt: trialEndDate.toISOString()
      };
      const upgradedSubscription = {
        id: user.id,
        planType,
        status: "trialing",
        billingCycle,
        currentPeriodStart: (/* @__PURE__ */ new Date()).toISOString(),
        currentPeriodEnd: trialEndDate.toISOString(),
        trialDaysLeft: 7,
        usageStats: {
          tasks: { count: 0, limit: planType === "family" ? null : 1e3 },
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
  app2.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { planType, billingCycle } = req.body;
      const currentStripe = getStripeInstance();
      if (!currentStripe) {
        console.log("Stripe not configured - using demo mode");
        return res.status(200).json({
          clientSecret: "pi_demo_" + Date.now() + "_secret_demo",
          demoMode: true,
          message: "Demo payment mode - Stripe configuration pending"
        });
      }
      const pricing = {
        basic: { monthly: 499, annual: 4900 },
        // $4.99, $49
        premium: { monthly: 1299, annual: 12900 },
        // $12.99, $129
        family: { monthly: 2499, annual: 24900 }
        // $24.99, $249
      };
      const amount = pricing[planType]?.[billingCycle] || 1299;
      const paymentIntent = await currentStripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          planType,
          billingCycle,
          userId: "1"
          // Replace with actual user ID
        }
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
        demoMode: false,
        message: "Live payment processing enabled"
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      if (error.type === "StripeAuthenticationError") {
        console.log("Stripe authentication failed - falling back to demo mode");
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
  app2.post("/api/upgrade-subscription", async (req, res) => {
    try {
      const { planType, billingCycle, paymentIntentId } = req.body;
      const user = storage.getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const currentStripe = getStripeInstance();
      if (currentStripe && paymentIntentId) {
        const paymentIntent = await currentStripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
          return res.status(400).json({ message: "Payment not confirmed" });
        }
      }
      const subscriptionTier = planType === "basic" ? "basic" : planType === "premium" ? "premium" : "family";
      const expiresAt = /* @__PURE__ */ new Date();
      if (billingCycle === "annual") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      await storage.updateUserSubscription(user.id, {
        subscriptionTier,
        subscriptionStatus: "active",
        subscriptionExpiresAt: expiresAt
      });
      res.json({
        message: "Subscription upgraded successfully",
        plan: planType,
        billing: billingCycle,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({
        message: "Failed to upgrade subscription",
        error: error.message || "Unknown error"
      });
    }
  });
  function requireActiveSubscription(req, res, next) {
    if (!req.session?.userId || !req.session?.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = req.session.user;
    const now = /* @__PURE__ */ new Date();
    if (user.subscriptionStatus === "active" && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now) {
      return next();
    }
    const trialEndDate = new Date(user.createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    if (now <= trialEndDate && user.subscriptionTier === "free") {
      return next();
    }
    return res.status(402).json({
      message: "Subscription required",
      trialExpired: true,
      requiresPayment: true
    });
  }
  app2.post("/api/create-subscription", async (req, res) => {
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
      let customer;
      if (user.stripeCustomerId) {
        customer = await currentStripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await currentStripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id.toString() }
        });
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }
      const pricing = {
        basic: { monthly: 499, annual: 4900 },
        // $4.99, $49
        premium: { monthly: 1299, annual: 12900 },
        // $12.99, $129
        family: { monthly: 2499, annual: 24900 }
        // $24.99, $249
      };
      const amount = pricing[planType]?.[billingCycle] || 1299;
      const product = await currentStripe.products.create({
        name: `Adaptalyfe ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        description: `${billingCycle} subscription to Adaptalyfe ${planType} features`
      });
      const price = await currentStripe.prices.create({
        currency: "usd",
        product: product.id,
        unit_amount: amount,
        recurring: {
          interval: billingCycle === "annual" ? "year" : "month"
        }
      });
      const subscription = await currentStripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"]
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          userId: user.id.toString(),
          planType,
          billingCycle
        }
      });
      let paymentIntent = null;
      const invoice = subscription.latest_invoice;
      if (invoice && invoice.payment_intent) {
        paymentIntent = invoice.payment_intent;
      } else if (invoice && !invoice.payment_intent) {
        console.log("Creating standalone payment intent for subscription payment");
        paymentIntent = await currentStripe.paymentIntents.create({
          amount: invoice.amount_due,
          currency: "usd",
          customer: customer.id,
          metadata: {
            userId: user.id.toString(),
            subscriptionId: subscription.id,
            invoiceId: invoice.id
          },
          automatic_payment_methods: {
            enabled: true
          }
        });
      }
      await storage.updateUser(user.id, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: planType,
        subscriptionStatus: "pending"
      });
      let clientSecret = null;
      if (paymentIntent) {
        clientSecret = paymentIntent.client_secret;
      }
      console.log("Final subscription setup:", {
        subscriptionId: subscription.id,
        hasClientSecret: !!clientSecret,
        subscriptionStatus: subscription.status,
        paymentIntentId: paymentIntent?.id
      });
      res.json({
        subscriptionId: subscription.id,
        clientSecret,
        status: subscription.status,
        requiresPayment: !!clientSecret
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({
        message: "Failed to create subscription",
        error: error.message
      });
    }
  });
  app2.post("/api/confirm-subscription", async (req, res) => {
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
      const subscription = await currentStripe.subscriptions.retrieve(subscriptionId);
      if (subscription.status === "active") {
        const expiresAt = /* @__PURE__ */ new Date();
        const metadata = subscription.metadata;
        if (metadata.billingCycle === "annual") {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }
        await storage.updateUser(user.id, {
          subscriptionTier: metadata.planType || "premium",
          subscriptionStatus: "active",
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
    } catch (error) {
      console.error("Error confirming subscription:", error);
      res.status(500).json({
        message: "Failed to confirm subscription",
        error: error.message
      });
    }
  });
  app2.get("/api/subscription/payment-history", async (req, res) => {
    try {
      const payments = await stripe.paymentIntents.list({
        limit: 10,
        metadata: { userId: "1" }
        // Replace with actual user ID
      });
      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description || "Adaptalyfe Subscription",
        paidAt: new Date(payment.created * 1e3).toISOString(),
        paymentMethod: payment.payment_method ? "\u2022\u2022\u2022\u2022 " + payment.payment_method.slice(-4) : "N/A"
      }));
      res.json(formattedPayments);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });
  app2.get("/api/caregiver-users", async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const userProgress = users2.map((user) => ({
        userId: user.id,
        userName: user.name || user.username,
        streakDays: user.streakDays || 12,
        lastActive: (/* @__PURE__ */ new Date()).toISOString(),
        completionRate: 85,
        moodTrend: "stable",
        alertsCount: 1
      }));
      res.json(userProgress);
    } catch (error) {
      console.error("Error fetching caregiver users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/user-summary/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      const tasks = await storage.getDailyTasks(userId);
      const moods = await storage.getMoodEntries(userId);
      const appointments2 = await storage.getAppointments(userId);
      const medications2 = await storage.getMedications(userId);
      const summary = {
        user,
        taskCompletion: {
          total: tasks.length,
          completed: tasks.filter((t) => t.isCompleted).length,
          rate: tasks.length > 0 ? Math.round(tasks.filter((t) => t.isCompleted).length / tasks.length * 100) : 0
        },
        moodData: {
          recent: moods.slice(-7),
          average: moods.length > 0 ? (moods.reduce((sum, m) => sum + m.mood, 0) / moods.length).toFixed(1) : 0
        },
        upcomingAppointments: appointments2.filter((a) => new Date(a.appointmentDate) > /* @__PURE__ */ new Date()).slice(0, 3),
        medications: medications2.filter((m) => !m.isDiscontinued)
      };
      res.json(summary);
    } catch (error) {
      console.error("Error fetching user summary:", error);
      res.status(500).json({ message: "Failed to fetch user summary" });
    }
  });
  app2.post("/api/bank-accounts/connect-plaid", (req, res) => {
    res.json({
      message: "Demo bank accounts connected successfully",
      demo_mode: true,
      linkToken: "demo-link-token-12345"
    });
  });
  app2.get("/api/bank-accounts", (req, res) => {
    res.json([
      {
        id: 1,
        accountName: "Demo Checking Account",
        accountType: "checking",
        bankName: "Demo Bank",
        accountNumber: "****1234",
        routingNumber: "****5678",
        balance: 2500,
        isActive: true,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: 2,
        accountName: "Demo Savings Account",
        accountType: "savings",
        bankName: "Demo Bank",
        accountNumber: "****9876",
        routingNumber: "****5678",
        balance: 8750,
        isActive: true,
        lastSynced: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
  });
  app2.get("/api/bill-payments", (req, res) => {
    res.json([
      {
        id: 1,
        billName: "Electric Bill",
        payeeWebsite: "demo-electric.com",
        accountNumber: "****1234",
        isAutoPay: true,
        paymentAmount: 85,
        paymentDate: 15,
        nextPayment: "2025-08-15",
        status: "active"
      }
    ]);
  });
  app2.post("/api/bill-payments", (req, res) => {
    try {
      const { billName, payeeWebsite, accountNumber, paymentAmount, paymentDate, isAutoPay } = req.body;
      const newPayment = {
        id: Date.now(),
        // Simple ID generation for demo
        billName,
        payeeWebsite: payeeWebsite || "demo-payee.com",
        accountNumber: accountNumber || "****1234",
        isAutoPay,
        paymentAmount,
        paymentDate,
        isActive: true,
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        // 30 days from now
        status: "active"
      };
      res.json(newPayment);
    } catch (error) {
      console.error("Error creating bill payment:", error);
      res.status(400).json({ message: "Failed to create bill payment" });
    }
  });
  app2.get("/api/payment-limits", (req, res) => {
    res.json([
      {
        id: 1,
        limitType: "daily",
        amount: 500,
        isActive: true
      },
      {
        id: 2,
        limitType: "monthly",
        amount: 2e3,
        isActive: true
      },
      {
        id: 3,
        limitType: "per_transaction",
        amount: 1e3,
        isActive: true
      }
    ]);
  });
  app2.post("/api/bank-accounts/:id/sync", (req, res) => {
    const accountId = parseInt(req.params.id);
    res.json({
      message: "Account balance synced successfully",
      accountId,
      lastSynced: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.patch("/api/bill-payments/:id/toggle", (req, res) => {
    const paymentId = parseInt(req.params.id);
    const { isActive } = req.body;
    res.json({
      message: "Auto pay setting updated",
      paymentId,
      isActive
    });
  });
  app2.get("/screenshot-capture", (_req, res) => {
    res.sendFile(path.resolve("screenshot-capture.html"));
  });
  app2.get("/screenshots", (_req, res) => {
    res.sendFile(path.resolve("public/screenshot-capture.html"));
  });
  app2.get("/screenshots-simple", (_req, res) => {
    res.sendFile(path.resolve("screenshot-simple.html"));
  });
  app2.get("/api/rewards", async (req, res) => {
    try {
      console.log("=== REWARDS: GET /api/rewards ===");
      console.log("Session data:", req.session);
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      let user = req.session.user;
      if (!user && req.session.userId) {
        user = await storage.getUser(req.session.userId);
        req.session.user = user;
      }
      console.log("Final user:", user?.id, user?.username);
      if (!user) {
        console.log("No user found after all attempts, returning 401");
        return res.status(401).json({ message: "Not authenticated" });
      }
      const rewards2 = await storage.getRewardsByUser(user.id);
      console.log("Found rewards count:", rewards2.length);
      res.json(rewards2);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });
  app2.get("/api/rewards/caregiver", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const rewards2 = await storage.getRewardsByCaregiver(user.id);
      res.json(rewards2);
    } catch (error) {
      console.error("Error fetching caregiver rewards:", error);
      res.status(500).json({ message: "Failed to fetch caregiver rewards" });
    }
  });
  app2.post("/api/rewards", async (req, res) => {
    try {
      console.log("=== REWARDS: POST /api/rewards ===");
      console.log("Session data:", req.session);
      console.log("Request body:", req.body);
      if (!req.session.userId || !req.session.user) {
        console.log("No authenticated user found, returning 401");
        return res.status(401).json({ message: "Authentication required" });
      }
      let user = req.session.user;
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
        caregiverId: user.id
        // Caregiver creating the reward
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
  app2.get("/api/points/balance", async (req, res) => {
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
  app2.get("/api/points/transactions", async (req, res) => {
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
  app2.post("/api/points/award", async (req, res) => {
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
  app2.post("/api/rewards/redeem", async (req, res) => {
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
  app2.get("/api/rewards/redemptions", async (req, res) => {
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
  app2.get("/api/personal-documents", async (req, res) => {
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
  app2.get("/api/personal-documents/category/:category", async (req, res) => {
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
  app2.post("/api/personal-documents", async (req, res) => {
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
  app2.put("/api/personal-documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.updatePersonalDocument(documentId, req.body);
      res.json(document);
    } catch (error) {
      console.error("Error updating personal document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  app2.delete("/api/personal-documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deletePersonalDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting personal document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  app2.post("/api/personal-documents/upload", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { ObjectStorageService: ObjectStorageService2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const objectStorageService = new ObjectStorageService2();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
  app2.put("/api/personal-documents/set-image", async (req, res) => {
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
        const { ObjectStorageService: ObjectStorageService2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
        const objectStorageService = new ObjectStorageService2();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          imageURL,
          {
            owner: userId.toString(),
            visibility: "private"
            // Personal documents should be private
          }
        );
        res.status(200).json({
          objectPath
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
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { ObjectStorageService: ObjectStorageService2, ObjectNotFoundError: ObjectNotFoundError2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const { ObjectPermission: ObjectPermission2 } = await Promise.resolve().then(() => (init_objectAcl(), objectAcl_exports));
      const objectStorageService = new ObjectStorageService2();
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(req.path);
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: req.session.user.id.toString(),
          requestedPermission: ObjectPermission2.READ
        });
        if (!canAccess) {
          return res.sendStatus(401);
        }
        objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error checking object access:", error);
        if (error instanceof ObjectNotFoundError2) {
          return res.sendStatus(404);
        }
        return res.sendStatus(500);
      }
    } catch (error) {
      console.error("Error in objects route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.use("/api/banking", banking_routes_default);
  registerAnalyticsRoutes(app2);
  registerBillPaymentRoutes(app2);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/production.ts
import path2 from "path";
import fs from "fs";

// server/task-reminder-service.ts
import { eq as eq4, and as and4, lte as lte4, gt as gt2 } from "drizzle-orm";
var TaskReminderService = class {
  intervalId = null;
  isRunning = false;
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("\u{1F514} Task Reminder Service started");
    this.intervalId = setInterval(() => {
      this.checkDueTasks().catch(console.error);
    }, 6e4);
    this.checkDueTasks().catch(console.error);
  }
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("\u{1F514} Task Reminder Service stopped");
  }
  async checkDueTasks() {
    try {
      const now = /* @__PURE__ */ new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = now.toISOString().split("T")[0];
      const dueTasks = await db.select().from(dailyTasks).where(
        and4(
          eq4(dailyTasks.isCompleted, false),
          eq4(dailyTasks.scheduledTime, currentTime)
        )
      );
      for (const task of dueTasks) {
        await this.sendTaskReminder(task);
      }
      const overdueTime = new Date(now.getTime() - 30 * 6e4);
      const overdueTimeStr = overdueTime.toTimeString().slice(0, 5);
      const overdueTasks = await db.select().from(dailyTasks).where(
        and4(
          eq4(dailyTasks.isCompleted, false),
          lte4(dailyTasks.scheduledTime, overdueTimeStr),
          gt2(dailyTasks.scheduledTime, "00:00")
          // Has a scheduled time
        )
      );
      for (const task of overdueTasks) {
        await this.sendOverdueReminder(task);
      }
    } catch (error) {
      console.error("Error checking due tasks:", error);
    }
  }
  async sendTaskReminder(task) {
    try {
      const reminderNotification = {
        userId: task.userId,
        type: "task_reminder",
        title: `\u23F0 Time for: ${task.title}`,
        message: `Your task "${task.title}" is scheduled for now. ${task.estimatedMinutes} minutes estimated.`,
        priority: "high",
        isRead: false,
        createdAt: /* @__PURE__ */ new Date(),
        metadata: {
          taskId: task.id,
          taskCategory: task.category,
          estimatedMinutes: task.estimatedMinutes,
          pointValue: task.pointValue
        }
      };
      await db.insert(notifications).values(reminderNotification);
      console.log(`\u{1F514} Task reminder sent: ${task.title} for user ${task.userId}`);
    } catch (error) {
      console.error("Error sending task reminder:", error);
    }
  }
  async sendOverdueReminder(task) {
    try {
      const overdueNotification = {
        userId: task.userId,
        type: "task_overdue",
        title: `\u26A0\uFE0F Overdue: ${task.title}`,
        message: `Your task "${task.title}" was scheduled for ${task.scheduledTime} and is now overdue. You can still complete it today!`,
        priority: "high",
        isRead: false,
        createdAt: /* @__PURE__ */ new Date(),
        metadata: {
          taskId: task.id,
          taskCategory: task.category,
          scheduledTime: task.scheduledTime,
          pointValue: task.pointValue
        }
      };
      await db.insert(notifications).values(overdueNotification);
      console.log(`\u26A0\uFE0F Overdue reminder sent: ${task.title} for user ${task.userId}`);
    } catch (error) {
      console.error("Error sending overdue reminder:", error);
    }
  }
  // Method to manually trigger reminder check (useful for testing)
  async checkNow() {
    await this.checkDueTasks();
  }
  // Reset reminders for a new day (called at midnight)
  async resetDailyReminders() {
    try {
      await db.update(dailyTasks).set({
        lastReminderSent: null,
        lastOverdueReminder: null
      });
      console.log("\u{1F504} Daily reminders reset for new day");
    } catch (error) {
      console.error("Error resetting daily reminders:", error);
    }
  }
};
var taskReminderService = new TaskReminderService();

// server/production.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "https://adaptalyfe-5a1d3.web.app",
    "https://adaptalyfe-5a1d3.firebaseapp.com",
    "https://f0feebb6-5db0-4265-92fd-0ed04d7aec9a-00-tpbqabot0m1.spock.replit.dev"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  // More restrictive for auth routes
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);
app.use("/api/auth", authLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  await initializeComprehensiveDemo();
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  console.log("Setting up production static file serving");
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }
  app.use("/assets", express.static(path2.join(distPath, "assets"), {
    maxAge: "365d",
    immutable: true,
    etag: true
  }));
  app.use(express.static(distPath, {
    maxAge: 0,
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith("/")) {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
      }
    }
  }));
  app.get("*", (_req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
  const port = process.env.PORT || 5e3;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    console.log(`\u{1F680} AdaptaLyfe server running on port ${port} in PRODUCTION mode`);
    log(`serving on port ${port}`);
    taskReminderService.start();
    console.log("\u{1F514} Task reminder service initialized");
  });
})();
