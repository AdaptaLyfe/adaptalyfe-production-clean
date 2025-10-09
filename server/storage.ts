import {
  users, dailyTasks, bills, bankAccounts, moodEntries, achievements, caregivers, messages, budgetEntries, appointments,
  mealPlans, shoppingLists, groceryStores, emergencyResources, pharmacies, userPharmacies, medications, refillOrders,
  allergies, medicalConditions, adverseMedications, emergencyContacts, primaryCareProviders, symptomEntries,
  personalResources, personalDocuments, busSchedules, emergencyTreatmentPlans, geofences, geofenceEvents,
  notifications, userPreferences, userAchievements, streakTracking, voiceInteractions, quickResponses,
  messageReactions, activityPatterns, caregiverPermissions, lockedUserSettings, userCaregiverConnections,
  caregiverInvitations, careRelationships, feedback, savingsGoals, savingsTransactions, budgetCategories,
  academicClasses, assignments, studySessions, campusLocations, campusTransport, studyGroups, transitionSkills,
  rewards, userPointsBalance, pointsTransactions, rewardRedemptions, sleepSessions, healthMetrics,
  type User, type InsertUser, type DailyTask, type InsertDailyTask, type Bill, type InsertBill,
  type BankAccount, type InsertBankAccount, type MoodEntry, type InsertMoodEntry, type Achievement, type InsertAchievement,
  type Caregiver, type InsertCaregiver, type Message, type InsertMessage, type Feedback, type InsertFeedback,
  type BudgetEntry, type InsertBudgetEntry, type Appointment, type InsertAppointment,
  type SavingsGoal, type InsertSavingsGoal, type SavingsTransaction, type InsertSavingsTransaction,
  type BudgetCategory, type InsertBudgetCategory,
  type MealPlan, type InsertMealPlan, type ShoppingList, type InsertShoppingList,
  type GroceryStore, type InsertGroceryStore,
  type EmergencyResource, type InsertEmergencyResource, type Pharmacy, type InsertPharmacy,
  type UserPharmacy, type InsertUserPharmacy, type Medication, type InsertMedication,
  type RefillOrder, type InsertRefillOrder, type Allergy, type InsertAllergy,
  type MedicalCondition, type InsertMedicalCondition, type AdverseMedication, type InsertAdverseMedication,
  type EmergencyContact, type InsertEmergencyContact, type PrimaryCareProvider, type InsertPrimaryCareProvider,
  type SymptomEntry, type InsertSymptomEntry, type PersonalResource, type InsertPersonalResource,
  type PersonalDocument, type InsertPersonalDocument,
  type BusSchedule, type InsertBusSchedule, type EmergencyTreatmentPlan, type InsertEmergencyTreatmentPlan,
  type Geofence, type InsertGeofence, type GeofenceEvent, type InsertGeofenceEvent,
  type Notification, type InsertNotification, type UserPreferences, type InsertUserPreferences,
  type UserAchievement, type InsertUserAchievement, type StreakTracking, type InsertStreakTracking,
  type VoiceInteraction, type InsertVoiceInteraction, type QuickResponse, type InsertQuickResponse,
  type MessageReaction, type InsertMessageReaction, type ActivityPattern, type InsertActivityPattern,
  type CaregiverPermission, type InsertCaregiverPermission, type LockedUserSetting, type InsertLockedUserSetting,
  type AcademicClass, type InsertAcademicClass, type Assignment, type InsertAssignment,
  type StudySession, type InsertStudySession, type CampusLocation, type InsertCampusLocation,
  type CampusTransport, type InsertCampusTransport,
  type StudyGroup, type InsertStudyGroup, type TransitionSkill, type InsertTransitionSkill,
  type CaregiverInvitation, type InsertCaregiverInvitation, type CareRelationship, type InsertCareRelationship,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent,
  type Reward, type InsertReward, type UserPointsBalance, type InsertUserPointsBalance,
  type PointsTransaction, type InsertPointsTransaction, type RewardRedemption, type InsertRewardRedemption,
  sleepSessions, type SleepSession, type InsertSleepSession, healthMetrics, type HealthMetric, type InsertHealthMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, gt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserStreak(userId: number, streakDays: number): Promise<User | undefined>;
  updateUserSubscription(userId: number, subscriptionData: Partial<User>): Promise<User | undefined>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  getCurrentUser(): User | null;
  setCurrentUser(user: User | null): void;

  // Daily Tasks
  getDailyTasksByUser(userId: number): Promise<DailyTask[]>;
  getTaskById(taskId: number): Promise<DailyTask | undefined>;
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  updateDailyTask(taskId: number, updates: Partial<DailyTask>): Promise<DailyTask | undefined>;
  updateTaskCompletion(taskId: number, isCompleted: boolean): Promise<DailyTask | undefined>;
  
  // Bills
  getBillsByUser(userId: number): Promise<Bill[]>;
  getBill(billId: number): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(billId: number, updates: Partial<Bill>): Promise<Bill | undefined>;
  updateBillPayment(billId: number, isPaid: boolean): Promise<Bill | undefined>;
  
  // Mood Entries
  getMoodEntriesByUser(userId: number): Promise<MoodEntry[]>;
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getTodayMoodEntry(userId: number): Promise<MoodEntry | undefined>;
  
  // Achievements
  getAchievementsByUser(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Feedback
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  
  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Caregivers
  getCaregiversByUser(userId: number): Promise<Caregiver[]>;
  createCaregiver(caregiver: InsertCaregiver): Promise<Caregiver>;
  
  // Messages
  getMessagesByUser(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Budget Entries
  getBudgetEntriesByUser(userId: number): Promise<BudgetEntry[]>;
  createBudgetEntry(entry: InsertBudgetEntry): Promise<BudgetEntry>;

  // Budget Categories
  getBudgetCategoriesByUser(userId: number): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(categoryId: number, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(categoryId: number): Promise<boolean>;

  // Savings Goals
  getSavingsGoalsByUser(userId: number): Promise<SavingsGoal[]>;
  getSavingsGoal(goalId: number): Promise<SavingsGoal | undefined>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(goalId: number, updates: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  updateSavingsGoalAmount(goalId: number, currentAmount: number): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(goalId: number): Promise<boolean>;

  // Savings Transactions
  getSavingsTransactionsByUser(userId: number): Promise<SavingsTransaction[]>;
  getSavingsTransactionsByGoal(goalId: number): Promise<SavingsTransaction[]>;
  createSavingsTransaction(transaction: InsertSavingsTransaction): Promise<SavingsTransaction>;
  
  // Appointments
  getAppointmentsByUser(userId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentCompletion(appointmentId: number, isCompleted: boolean): Promise<Appointment | undefined>;
  getUpcomingAppointments(userId: number): Promise<Appointment[]>;
  
  // Meal Plans
  getMealPlansByUser(userId: number): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlanCompletion(mealPlanId: number, isCompleted: boolean): Promise<MealPlan | undefined>;
  getMealPlansByDate(userId: number, date: string): Promise<MealPlan[]>;
  
  // Shopping Lists
  getShoppingListsByUser(userId: number): Promise<ShoppingList[]>;
  createShoppingListItem(item: InsertShoppingList): Promise<ShoppingList>;
  updateShoppingItemPurchased(itemId: number, isPurchased: boolean, actualCost?: number): Promise<ShoppingList | undefined>;
  getActiveShoppingItems(userId: number): Promise<ShoppingList[]>;
  
  // Emergency Resources
  getEmergencyResourcesByUser(userId: number): Promise<EmergencyResource[]>;
  createEmergencyResource(resource: InsertEmergencyResource): Promise<EmergencyResource>;
  updateEmergencyResource(resourceId: number, updates: Partial<InsertEmergencyResource>): Promise<EmergencyResource | undefined>;
  deleteEmergencyResource(resourceId: number): Promise<boolean>;
  
  // Pharmacy Integration
  getPharmacies(): Promise<Pharmacy[]>;
  createPharmacy(pharmacy: InsertPharmacy): Promise<Pharmacy>;
  getUserPharmacies(userId: number): Promise<UserPharmacy[]>;
  addUserPharmacy(userPharmacy: InsertUserPharmacy): Promise<UserPharmacy>;
  
  // Medications
  getMedicationsByUser(userId: number): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(medicationId: number, updates: Partial<InsertMedication>): Promise<Medication | undefined>;
  getMedicationsDueForRefill(userId: number): Promise<Medication[]>;
  
  // Refill Orders
  getRefillOrdersByUser(userId: number): Promise<RefillOrder[]>;
  createRefillOrder(refillOrder: InsertRefillOrder): Promise<RefillOrder>;
  updateRefillOrderStatus(orderId: number, status: string): Promise<RefillOrder | undefined>;
  
  // Medical Information
  getAllergiesByUser(userId: number): Promise<Allergy[]>;
  createAllergy(allergy: InsertAllergy): Promise<Allergy>;
  updateAllergy(allergyId: number, updates: Partial<InsertAllergy>): Promise<Allergy | undefined>;
  deleteAllergy(allergyId: number): Promise<boolean>;
  
  getMedicalConditionsByUser(userId: number): Promise<MedicalCondition[]>;
  createMedicalCondition(condition: InsertMedicalCondition): Promise<MedicalCondition>;
  updateMedicalCondition(conditionId: number, updates: Partial<InsertMedicalCondition>): Promise<MedicalCondition | undefined>;
  deleteMedicalCondition(conditionId: number): Promise<boolean>;
  
  getAdverseMedicationsByUser(userId: number): Promise<AdverseMedication[]>;
  createAdverseMedication(adverseMed: InsertAdverseMedication): Promise<AdverseMedication>;
  updateAdverseMedication(adverseMedId: number, updates: Partial<InsertAdverseMedication>): Promise<AdverseMedication | undefined>;
  deleteAdverseMedication(adverseMedId: number): Promise<boolean>;
  
  getEmergencyContactsByUser(userId: number): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  updateEmergencyContact(contactId: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined>;
  deleteEmergencyContact(contactId: number): Promise<boolean>;
  
  getPrimaryCareProvidersByUser(userId: number): Promise<PrimaryCareProvider[]>;
  createPrimaryCareProvider(provider: InsertPrimaryCareProvider): Promise<PrimaryCareProvider>;
  updatePrimaryCareProvider(providerId: number, updates: Partial<InsertPrimaryCareProvider>): Promise<PrimaryCareProvider | undefined>;
  deletePrimaryCareProvider(providerId: number): Promise<boolean>;
  
  // Symptom Tracking
  getSymptomEntriesByUser(userId: number): Promise<SymptomEntry[]>;
  getSymptomEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<SymptomEntry[]>;
  createSymptomEntry(entry: InsertSymptomEntry): Promise<SymptomEntry>;
  updateSymptomEntry(entryId: number, updates: Partial<InsertSymptomEntry>): Promise<SymptomEntry | undefined>;
  deleteSymptomEntry(entryId: number): Promise<boolean>;
  
  // Personal Resources
  getPersonalResourcesByUser(userId: number): Promise<PersonalResource[]>;
  getPersonalResourcesByCategory(userId: number, category: string): Promise<PersonalResource[]>;
  createPersonalResource(resource: InsertPersonalResource): Promise<PersonalResource>;
  updatePersonalResource(resourceId: number, updates: Partial<InsertPersonalResource>): Promise<PersonalResource | undefined>;
  deletePersonalResource(resourceId: number): Promise<boolean>;
  incrementResourceAccess(resourceId: number): Promise<PersonalResource | undefined>;
  
  // Bus Schedules
  getBusSchedulesByUser(userId: number): Promise<BusSchedule[]>;
  getBusSchedulesByDay(userId: number, dayOfWeek: string): Promise<BusSchedule[]>;
  getFrequentBusRoutes(userId: number): Promise<BusSchedule[]>;
  createBusSchedule(schedule: InsertBusSchedule): Promise<BusSchedule>;
  updateBusSchedule(scheduleId: number, updates: Partial<InsertBusSchedule>): Promise<BusSchedule | undefined>;
  deleteBusSchedule(scheduleId: number): Promise<boolean>;
  
  // Emergency Treatment Plans
  getEmergencyTreatmentPlansByUser(userId: number): Promise<EmergencyTreatmentPlan[]>;
  getActiveEmergencyTreatmentPlans(userId: number): Promise<EmergencyTreatmentPlan[]>;
  createEmergencyTreatmentPlan(plan: InsertEmergencyTreatmentPlan): Promise<EmergencyTreatmentPlan>;
  updateEmergencyTreatmentPlan(planId: number, updates: Partial<InsertEmergencyTreatmentPlan>): Promise<EmergencyTreatmentPlan | undefined>;
  deleteEmergencyTreatmentPlan(planId: number): Promise<boolean>;
  
  // Smart Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(notificationId: number): Promise<Notification | undefined>;
  scheduleNotification(notification: InsertNotification): Promise<Notification>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Enhanced Achievements
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  
  // Streak Tracking
  getStreaksByUser(userId: number): Promise<StreakTracking[]>;
  updateStreak(userId: number, streakType: string, increment: boolean): Promise<StreakTracking>;
  
  // Voice Interactions
  createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction>;
  getVoiceInteractionHistory(userId: number): Promise<VoiceInteraction[]>;
  
  // Communication Enhancements
  getQuickResponsesByUser(userId: number): Promise<QuickResponse[]>;
  createQuickResponse(response: InsertQuickResponse): Promise<QuickResponse>;
  incrementQuickResponseUsage(responseId: number): Promise<QuickResponse | undefined>;
  
  // Message Reactions
  getMessageReactions(messageId: number): Promise<MessageReaction[]>;
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<boolean>;
  
  // Activity Patterns
  recordActivityPattern(pattern: InsertActivityPattern): Promise<ActivityPattern>;
  getActivityPatterns(userId: number, activityType: string): Promise<ActivityPattern[]>;
  getUserBehaviorInsights(userId: number): Promise<any>;

  // Caregiver Permission Management
  getCaregiverPermissions(userId: number, caregiverId: number): Promise<CaregiverPermission[]>;
  setCaregiverPermission(permission: InsertCaregiverPermission): Promise<CaregiverPermission>;
  removeCaregiverPermission(userId: number, caregiverId: number, permissionType: string): Promise<boolean>;
  
  // Locked User Settings Management
  getLockedUserSettings(userId: number): Promise<LockedUserSetting[]>;
  getLockedUserSetting(userId: number, settingKey: string): Promise<LockedUserSetting | undefined>;
  lockUserSetting(setting: InsertLockedUserSetting): Promise<LockedUserSetting>;
  unlockUserSetting(userId: number, settingKey: string, caregiverId: number): Promise<boolean>;
  isSettingLocked(userId: number, settingKey: string): Promise<boolean>;
  canUserModifySetting(userId: number, settingKey: string): Promise<boolean>;

  // Caregiver Invitation Management
  createCaregiverInvitation(invitation: InsertCaregiverInvitation): Promise<CaregiverInvitation>;
  getCaregiverInvitation(invitationCode: string): Promise<CaregiverInvitation | undefined>;
  getCaregiverInvitationsByCaregiver(caregiverId: number): Promise<CaregiverInvitation[]>;
  acceptCaregiverInvitation(invitationCode: string, acceptedBy: number): Promise<CaregiverInvitation | undefined>;
  expireCaregiverInvitation(invitationCode: string): Promise<boolean>;
  
  // Care Relationship Management
  createCareRelationship(relationship: InsertCareRelationship): Promise<CareRelationship>;
  getCareRelationshipsByUser(userId: number): Promise<CareRelationship[]>;
  getCareRelationshipsByCaregiver(caregiverId: number): Promise<CareRelationship[]>;
  updateCareRelationship(id: number, updates: Partial<InsertCareRelationship>): Promise<CareRelationship | undefined>;
  removeCareRelationship(id: number): Promise<boolean>;

  // Academic features
  getAcademicClassesByUser(userId: number): Promise<AcademicClass[]>;
  createAcademicClass(classData: InsertAcademicClass): Promise<AcademicClass>;
  getAssignmentsByUser(userId: number): Promise<Assignment[]>;
  createAssignment(assignmentData: InsertAssignment): Promise<Assignment>;
  getStudySessionsByUser(userId: number): Promise<StudySession[]>;
  createStudySession(sessionData: InsertStudySession): Promise<StudySession>;
  getCampusLocationsByUser(userId: number): Promise<CampusLocation[]>;
  createCampusLocation(locationData: InsertCampusLocation): Promise<CampusLocation>;
  getStudyGroupsByUser(userId: number): Promise<StudyGroup[]>;
  createStudyGroup(groupData: InsertStudyGroup): Promise<StudyGroup>;
  getTransitionSkillsByUser(userId: number): Promise<TransitionSkill[]>;
  createTransitionSkill(skillData: InsertTransitionSkill): Promise<TransitionSkill>;
  updateTransitionSkill(skillId: number, updateData: Partial<TransitionSkill>): Promise<TransitionSkill>;
  deleteTransitionSkill(skillId: number): Promise<void>;

  // Calendar Events
  getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]>;
  createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, eventData: Partial<InsertCalendarEvent>): Promise<CalendarEvent>;
  deleteCalendarEvent(id: number): Promise<boolean>;

  // Sleep Tracking
  getSleepSessionsByUser(userId: number): Promise<SleepSession[]>;
  getSleepSessionByDate(userId: number, date: string): Promise<SleepSession | undefined>;
  createSleepSession(session: InsertSleepSession): Promise<SleepSession>;
  updateSleepSession(sessionId: number, updates: Partial<InsertSleepSession>): Promise<SleepSession | undefined>;
  deleteSleepSession(sessionId: number): Promise<boolean>;

  // Health Metrics
  getHealthMetricsByUser(userId: number, metricType?: string, startDate?: string, endDate?: string): Promise<HealthMetric[]>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
}

export class DatabaseStorage implements IStorage {
  private currentUser: User | null = null;

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserStreak(userId: number, streakDays: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ streakDays })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserSubscription(userId: number, subscriptionData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(subscriptionData)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.username, username), eq(users.password, password)));
    return user || null;
  }

  async getDailyTasksByUser(userId: number): Promise<DailyTask[]> {
    return await db.select().from(dailyTasks).where(eq(dailyTasks.userId, userId));
  }

  async getTaskById(taskId: number): Promise<DailyTask | undefined> {
    const [task] = await db.select().from(dailyTasks).where(eq(dailyTasks.id, taskId));
    return task || undefined;
  }

  async createDailyTask(insertTask: InsertDailyTask): Promise<DailyTask> {
    const [task] = await db
      .insert(dailyTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateDailyTask(taskId: number, updates: Partial<DailyTask>): Promise<DailyTask | undefined> {
    const [task] = await db
      .update(dailyTasks)
      .set(updates)
      .where(eq(dailyTasks.id, taskId))
      .returning();
    return task || undefined;
  }

  async updateTaskCompletion(taskId: number, isCompleted: boolean): Promise<DailyTask | undefined> {
    const [task] = await db
      .update(dailyTasks)
      .set({ 
        isCompleted, 
        completedAt: isCompleted ? new Date() : null 
      })
      .where(eq(dailyTasks.id, taskId))
      .returning();
    return task || undefined;
  }

  async getBillsByUser(userId: number): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.userId, userId));
  }

  async getBill(billId: number): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    return bill || undefined;
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const [bill] = await db
      .insert(bills)
      .values(insertBill)
      .returning();
    return bill;
  }

  async updateBill(billId: number, updates: Partial<Bill>): Promise<Bill | undefined> {
    const [bill] = await db
      .update(bills)
      .set(updates)
      .where(eq(bills.id, billId))
      .returning();
    return bill || undefined;
  }

  async updateBillPayment(billId: number, isPaid: boolean): Promise<Bill | undefined> {
    const [bill] = await db
      .update(bills)
      .set({ isPaid })
      .where(eq(bills.id, billId))
      .returning();
    return bill || undefined;
  }

  async getBankAccountsByUser(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(insertAccount: InsertBankAccount): Promise<BankAccount> {
    const accountData = {
      userId: insertAccount.userId,
      accountName: insertAccount.accountNickname || insertAccount.bankName,
      bankName: insertAccount.bankName,
      accountType: insertAccount.accountType,
      accountNickname: insertAccount.accountNickname,
      bankWebsite: insertAccount.bankWebsite,
      lastFour: insertAccount.lastFour,
      balance: 0.00,
      isActive: true,
    };
    
    const [account] = await db
      .insert(bankAccounts)
      .values(accountData)
      .returning();
    return account;
  }

  async updateBankAccount(accountId: number, updateData: Partial<InsertBankAccount>): Promise<BankAccount | undefined> {
    const accountData: any = {
      updatedAt: new Date(),
    };
    
    if (updateData.bankName !== undefined) {
      accountData.bankName = updateData.bankName;
      accountData.accountName = updateData.accountNickname || updateData.bankName;
    }
    if (updateData.accountType !== undefined) {
      accountData.accountType = updateData.accountType;
    }
    if (updateData.accountNickname !== undefined) {
      accountData.accountNickname = updateData.accountNickname;
      if (!accountData.accountName) {
        accountData.accountName = updateData.accountNickname;
      }
    }
    if (updateData.bankWebsite !== undefined) {
      accountData.bankWebsite = updateData.bankWebsite;
    }
    if (updateData.lastFour !== undefined) {
      accountData.lastFour = updateData.lastFour;
    }

    const [account] = await db
      .update(bankAccounts)
      .set(accountData)
      .where(eq(bankAccounts.id, accountId))
      .returning();
    return account || undefined;
  }

  async deleteBankAccount(accountId: number): Promise<boolean> {
    const result = await db
      .delete(bankAccounts)
      .where(eq(bankAccounts.id, accountId))
      .returning();
    return result.length > 0;
  }

  async getMoodEntriesByUser(userId: number): Promise<MoodEntry[]> {
    return await db.select().from(moodEntries).where(eq(moodEntries.userId, userId));
  }

  async createMoodEntry(insertEntry: InsertMoodEntry): Promise<MoodEntry> {
    // Ensure the entry date is set to the current server time if not provided
    const entryWithDate = {
      ...insertEntry,
      entryDate: insertEntry.entryDate || new Date()
    };
    
    console.log(`Creating mood entry for user ${entryWithDate.userId} at ${entryWithDate.entryDate?.toISOString()}`);
    
    const [entry] = await db
      .insert(moodEntries)
      .values(entryWithDate)
      .returning();
    return entry;
  }

  async getTodayMoodEntry(userId: number): Promise<MoodEntry | undefined> {
    // Get current date and create precise midnight boundaries
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    console.log(`Checking mood entry for user ${userId} between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);
    
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.entryDate, startOfDay),
          lte(moodEntries.entryDate, endOfDay)
        )
      )
      .orderBy(desc(moodEntries.entryDate))
      .limit(1);
    
    return entry || undefined;
  }

  async getAchievementsByUser(userId: number): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.userId, userId));
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(insertAchievement)
      .returning();
    return achievement;
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackEntry] = await db
      .insert(feedback)
      .values(insertFeedback)
      .returning();
    return feedbackEntry;
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [result] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result;
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    // Try to update existing preferences first
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      const [result] = await db.update(userPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return result;
    } else {
      // Create new preferences if none exist
      const [result] = await db.insert(userPreferences)
        .values({ userId, ...preferences })
        .returning();
      return result;
    }
  }

  async getCaregiversByUser(userId: number): Promise<Caregiver[]> {
    return await db.select().from(caregivers).where(eq(caregivers.userId, userId));
  }

  async createCaregiver(insertCaregiver: InsertCaregiver): Promise<Caregiver> {
    const [caregiver] = await db
      .insert(caregivers)
      .values(insertCaregiver)
      .returning();
    return caregiver;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.userId, userId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getBudgetEntriesByUser(userId: number): Promise<BudgetEntry[]> {
    try {
      return await db.select().from(budgetEntries).where(eq(budgetEntries.userId, userId));
    } catch (error) {
      console.error("Error in getBudgetEntriesByUser:", error);
      throw error;
    }
  }

  async createBudgetEntry(insertEntry: InsertBudgetEntry): Promise<BudgetEntry> {
    try {
      const [entry] = await db
        .insert(budgetEntries)
        .values(insertEntry)
        .returning();
      return entry;
    } catch (error) {
      console.error("Error in createBudgetEntry:", error);
      throw error;
    }
  }

  // Budget Categories
  async getBudgetCategoriesByUser(userId: number): Promise<BudgetCategory[]> {
    return await db.select().from(budgetCategories).where(eq(budgetCategories.userId, userId));
  }

  async createBudgetCategory(insertCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const [category] = await db
      .insert(budgetCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateBudgetCategory(categoryId: number, updates: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const [category] = await db
      .update(budgetCategories)
      .set(updates)
      .where(eq(budgetCategories.id, categoryId))
      .returning();
    return category || undefined;
  }

  async deleteBudgetCategory(categoryId: number): Promise<boolean> {
    const result = await db
      .delete(budgetCategories)
      .where(eq(budgetCategories.id, categoryId));
    return result.rowCount > 0;
  }

  // Savings Goals
  async getSavingsGoalsByUser(userId: number): Promise<SavingsGoal[]> {
    return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
  }

  async getSavingsGoal(goalId: number): Promise<SavingsGoal | undefined> {
    const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, goalId));
    return goal || undefined;
  }

  async createSavingsGoal(insertGoal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [goal] = await db
      .insert(savingsGoals)
      .values(insertGoal)
      .returning();
    return goal;
  }

  async updateSavingsGoal(goalId: number, updates: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .update(savingsGoals)
      .set(updates)
      .where(eq(savingsGoals.id, goalId))
      .returning();
    return goal || undefined;
  }

  async updateSavingsGoalAmount(goalId: number, currentAmount: number): Promise<SavingsGoal | undefined> {
    const [goal] = await db
      .update(savingsGoals)
      .set({ 
        currentAmount,
        isCompleted: currentAmount >= 0 ? undefined : false, // Only check if we have the target amount
        updatedAt: new Date()
      })
      .where(eq(savingsGoals.id, goalId))
      .returning();
    return goal || undefined;
  }

  async deleteSavingsGoal(goalId: number): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(eq(savingsGoals.id, goalId));
    return result.rowCount > 0;
  }

  // Savings Transactions
  async getSavingsTransactionsByUser(userId: number): Promise<SavingsTransaction[]> {
    return await db.select().from(savingsTransactions).where(eq(savingsTransactions.userId, userId));
  }

  async getSavingsTransactionsByGoal(goalId: number): Promise<SavingsTransaction[]> {
    return await db.select().from(savingsTransactions).where(eq(savingsTransactions.savingsGoalId, goalId));
  }

  async createSavingsTransaction(insertTransaction: InsertSavingsTransaction): Promise<SavingsTransaction> {
    const [transaction] = await db
      .insert(savingsTransactions)
      .values(insertTransaction)
      .returning();

    // Update the savings goal amount
    if (insertTransaction.savingsGoalId && insertTransaction.amount) {
      // Get current goal to calculate new amount
      const [currentGoal] = await db
        .select()
        .from(savingsGoals)
        .where(eq(savingsGoals.id, insertTransaction.savingsGoalId));
      
      if (currentGoal) {
        const newAmount = (currentGoal.currentAmount || 0) + insertTransaction.amount;
        const isCompleted = newAmount >= (currentGoal.targetAmount || 0);
        
        await db
          .update(savingsGoals)
          .set({
            currentAmount: newAmount,
            isCompleted,
            completedAt: isCompleted ? new Date() : null,
            updatedAt: new Date()
          })
          .where(eq(savingsGoals.id, insertTransaction.savingsGoalId));
      }
    }

    return transaction;
  }



  async getAppointmentsByUser(userId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.userId, userId));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointmentCompletion(appointmentId: number, isCompleted: boolean): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ isCompleted })
      .where(eq(appointments.id, appointmentId))
      .returning();
    return appointment || undefined;
  }

  async getUpcomingAppointments(userId: number): Promise<Appointment[]> {
    const now = new Date();
    return await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.userId, userId),
          eq(appointments.isCompleted, false),
          gte(appointments.appointmentDate, now.toISOString())
        )
      )
      .orderBy(appointments.appointmentDate);
  }

  async getMealPlansByUser(userId: number): Promise<MealPlan[]> {
    return await db.select().from(mealPlans).where(eq(mealPlans.userId, userId));
  }

  async createMealPlan(insertMealPlan: InsertMealPlan): Promise<MealPlan> {
    const [mealPlan] = await db
      .insert(mealPlans)
      .values(insertMealPlan)
      .returning();
    return mealPlan;
  }

  async updateMealPlanCompletion(mealPlanId: number, isCompleted: boolean): Promise<MealPlan | undefined> {
    const [mealPlan] = await db
      .update(mealPlans)
      .set({ isCompleted })
      .where(eq(mealPlans.id, mealPlanId))
      .returning();
    return mealPlan || undefined;
  }

  async getMealPlansByDate(userId: number, date: string): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          eq(mealPlans.plannedDate, date)
        )
      );
  }

  async getShoppingListsByUser(userId: number): Promise<ShoppingList[]> {
    return await db.select().from(shoppingLists).where(eq(shoppingLists.userId, userId));
  }

  async getGroceryStoresByUser(userId: number): Promise<GroceryStore[]> {
    return await db.select().from(groceryStores).where(eq(groceryStores.userId, userId));
  }

  async createGroceryStore(insertStore: InsertGroceryStore): Promise<GroceryStore> {
    const [store] = await db
      .insert(groceryStores)
      .values(insertStore)
      .returning();
    return store;
  }

  async updateGroceryStore(storeId: number, data: Partial<InsertGroceryStore>): Promise<GroceryStore | undefined> {
    const [store] = await db
      .update(groceryStores)
      .set(data)
      .where(eq(groceryStores.id, storeId))
      .returning();
    return store || undefined;
  }

  async deleteGroceryStore(storeId: number): Promise<boolean> {
    const result = await db
      .delete(groceryStores)
      .where(eq(groceryStores.id, storeId));
    return result.rowCount > 0;
  }

  async createShoppingListItem(insertItem: InsertShoppingList): Promise<ShoppingList> {
    const [item] = await db
      .insert(shoppingLists)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateShoppingItemPurchased(itemId: number, isPurchased: boolean, actualCost?: number): Promise<ShoppingList | undefined> {
    const updateData: any = { 
      isPurchased,
      purchasedDate: isPurchased ? new Date() : null 
    };
    
    if (actualCost !== undefined) {
      updateData.actualCost = actualCost;
    }

    const [item] = await db
      .update(shoppingLists)
      .set(updateData)
      .where(eq(shoppingLists.id, itemId))
      .returning();
    return item || undefined;
  }

  async getActiveShoppingItems(userId: number): Promise<ShoppingList[]> {
    return await db
      .select()
      .from(shoppingLists)
      .where(
        and(
          eq(shoppingLists.userId, userId),
          eq(shoppingLists.isPurchased, false)
        )
      );
  }

  async getEmergencyResourcesByUser(userId: number): Promise<EmergencyResource[]> {
    return await db
      .select()
      .from(emergencyResources)
      .where(eq(emergencyResources.userId, userId))
      .orderBy(emergencyResources.resourceType, emergencyResources.name);
  }

  async createEmergencyResource(insertResource: InsertEmergencyResource): Promise<EmergencyResource> {
    const [resource] = await db
      .insert(emergencyResources)
      .values(insertResource)
      .returning();
    return resource;
  }

  async updateEmergencyResource(resourceId: number, updates: Partial<InsertEmergencyResource>): Promise<EmergencyResource | undefined> {
    const [resource] = await db
      .update(emergencyResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emergencyResources.id, resourceId))
      .returning();
    return resource || undefined;
  }

  async deleteEmergencyResource(resourceId: number): Promise<boolean> {
    const result = await db
      .delete(emergencyResources)
      .where(eq(emergencyResources.id, resourceId));
    return (result.rowCount ?? 0) > 0;
  }

  // Pharmacy Integration Methods
  async getPharmacies(): Promise<Pharmacy[]> {
    return await db.select().from(pharmacies).where(eq(pharmacies.isActive, true));
  }

  async createCustomPharmacy(pharmacyData: InsertPharmacy): Promise<Pharmacy> {
    const [pharmacy] = await db
      .insert(pharmacies)
      .values({
        ...pharmacyData,
        isCustom: true,
        type: 'custom'
      })
      .returning();
    return pharmacy;
  }

  async createPharmacy(insertPharmacy: InsertPharmacy): Promise<Pharmacy> {
    const [pharmacy] = await db
      .insert(pharmacies)
      .values(insertPharmacy)
      .returning();
    return pharmacy;
  }

  async getUserPharmacies(userId: number): Promise<UserPharmacy[]> {
    return await db
      .select({
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
          refillUrl: pharmacies.refillUrl,
        }
      })
      .from(userPharmacies)
      .leftJoin(pharmacies, eq(userPharmacies.pharmacyId, pharmacies.id))
      .where(eq(userPharmacies.userId, userId));
  }

  async addUserPharmacy(insertUserPharmacy: InsertUserPharmacy): Promise<UserPharmacy> {
    const [userPharmacy] = await db
      .insert(userPharmacies)
      .values(insertUserPharmacy)
      .returning();
    return userPharmacy;
  }

  // Medication Methods
  async getMedicationsByUser(userId: number): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.isActive, true)))
      .orderBy(medications.medicationName);
  }

  async createMedication(insertMedication: InsertMedication): Promise<Medication> {
    const [medication] = await db
      .insert(medications)
      .values(insertMedication)
      .returning();
    return medication;
  }

  async updateMedication(medicationId: number, updates: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [medication] = await db
      .update(medications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(medications.id, medicationId))
      .returning();
    return medication || undefined;
  }

  async getMedicationsDueForRefill(userId: number): Promise<Medication[]> {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    return await db
      .select()
      .from(medications)
      .where(
        and(
          eq(medications.userId, userId),
          eq(medications.isActive, true),
          lte(medications.nextRefillDate, threeDaysFromNow),
          gt(medications.refillsRemaining, 0)
        )
      );
  }

  // Refill Order Methods
  async getRefillOrdersByUser(userId: number): Promise<RefillOrder[]> {
    return await db
      .select({
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
          prescriptionNumber: medications.prescriptionNumber,
        },
        pharmacy: {
          name: pharmacies.name,
          address: pharmacies.address,
          phoneNumber: pharmacies.phoneNumber,
        }
      })
      .from(refillOrders)
      .leftJoin(medications, eq(refillOrders.medicationId, medications.id))
      .leftJoin(pharmacies, eq(refillOrders.pharmacyId, pharmacies.id))
      .where(eq(refillOrders.userId, userId))
      .orderBy(desc(refillOrders.orderDate));
  }

  async createRefillOrder(insertRefillOrder: InsertRefillOrder): Promise<RefillOrder> {
    const [refillOrder] = await db
      .insert(refillOrders)
      .values(insertRefillOrder)
      .returning();
    return refillOrder;
  }

  async updateRefillOrderStatus(orderId: number, status: string): Promise<RefillOrder | undefined> {
    const [refillOrder] = await db
      .update(refillOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(refillOrders.id, orderId))
      .returning();
    return refillOrder || undefined;
  }

  // Medical Information Methods
  async getAllergiesByUser(userId: number): Promise<Allergy[]> {
    return await db.select().from(allergies).where(eq(allergies.userId, userId));
  }

  async createAllergy(insertAllergy: InsertAllergy): Promise<Allergy> {
    const [allergy] = await db.insert(allergies).values(insertAllergy).returning();
    return allergy;
  }

  async updateAllergy(allergyId: number, updates: Partial<InsertAllergy>): Promise<Allergy | undefined> {
    const [updated] = await db.update(allergies)
      .set(updates)
      .where(eq(allergies.id, allergyId))
      .returning();
    return updated;
  }

  async deleteAllergy(allergyId: number): Promise<boolean> {
    const result = await db.delete(allergies).where(eq(allergies.id, allergyId));
    return (result.rowCount ?? 0) > 0;
  }

  async getMedicalConditionsByUser(userId: number): Promise<MedicalCondition[]> {
    return await db.select().from(medicalConditions).where(eq(medicalConditions.userId, userId));
  }

  async createMedicalCondition(insertCondition: InsertMedicalCondition): Promise<MedicalCondition> {
    const [condition] = await db.insert(medicalConditions).values(insertCondition).returning();
    return condition;
  }

  async updateMedicalCondition(conditionId: number, updates: Partial<InsertMedicalCondition>): Promise<MedicalCondition | undefined> {
    const [updated] = await db.update(medicalConditions)
      .set(updates)
      .where(eq(medicalConditions.id, conditionId))
      .returning();
    return updated;
  }

  async deleteMedicalCondition(conditionId: number): Promise<boolean> {
    const result = await db.delete(medicalConditions).where(eq(medicalConditions.id, conditionId));
    return (result.rowCount ?? 0) > 0;
  }

  async getAdverseMedicationsByUser(userId: number): Promise<AdverseMedication[]> {
    return await db.select().from(adverseMedications).where(eq(adverseMedications.userId, userId));
  }

  async createAdverseMedication(insertAdverseMed: InsertAdverseMedication): Promise<AdverseMedication> {
    const [adverseMed] = await db.insert(adverseMedications).values(insertAdverseMed).returning();
    return adverseMed;
  }

  async updateAdverseMedication(adverseMedId: number, updates: Partial<InsertAdverseMedication>): Promise<AdverseMedication | undefined> {
    const [updated] = await db.update(adverseMedications)
      .set(updates)
      .where(eq(adverseMedications.id, adverseMedId))
      .returning();
    return updated;
  }

  async deleteAdverseMedication(adverseMedId: number): Promise<boolean> {
    const result = await db.delete(adverseMedications).where(eq(adverseMedications.id, adverseMedId));
    return (result.rowCount ?? 0) > 0;
  }

  async getEmergencyContactsByUser(userId: number): Promise<EmergencyContact[]> {
    return await db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId));
  }

  async createEmergencyContact(insertContact: InsertEmergencyContact): Promise<EmergencyContact> {
    const [contact] = await db.insert(emergencyContacts).values(insertContact).returning();
    return contact;
  }

  async updateEmergencyContact(contactId: number, updates: Partial<InsertEmergencyContact>): Promise<EmergencyContact | undefined> {
    const [updated] = await db.update(emergencyContacts)
      .set(updates)
      .where(eq(emergencyContacts.id, contactId))
      .returning();
    return updated;
  }

  async deleteEmergencyContact(contactId: number): Promise<boolean> {
    const result = await db.delete(emergencyContacts).where(eq(emergencyContacts.id, contactId));
    return (result.rowCount ?? 0) > 0;
  }

  async getPrimaryCareProvidersByUser(userId: number): Promise<PrimaryCareProvider[]> {
    return await db.select().from(primaryCareProviders).where(eq(primaryCareProviders.userId, userId));
  }

  async createPrimaryCareProvider(insertProvider: InsertPrimaryCareProvider): Promise<PrimaryCareProvider> {
    const [provider] = await db.insert(primaryCareProviders).values(insertProvider).returning();
    return provider;
  }

  async updatePrimaryCareProvider(providerId: number, updates: Partial<InsertPrimaryCareProvider>): Promise<PrimaryCareProvider | undefined> {
    const [updated] = await db.update(primaryCareProviders)
      .set(updates)
      .where(eq(primaryCareProviders.id, providerId))
      .returning();
    return updated;
  }

  async deletePrimaryCareProvider(providerId: number): Promise<boolean> {
    const result = await db.delete(primaryCareProviders).where(eq(primaryCareProviders.id, providerId));
    return (result.rowCount ?? 0) > 0;
  }

  // Symptom Tracking Methods
  async getSymptomEntriesByUser(userId: number): Promise<SymptomEntry[]> {
    return await db.select().from(symptomEntries)
      .where(eq(symptomEntries.userId, userId))
      .orderBy(desc(symptomEntries.startTime));
  }

  async getSymptomEntriesByDateRange(userId: number, startDate: string, endDate: string): Promise<SymptomEntry[]> {
    return await db.select().from(symptomEntries)
      .where(
        and(
          eq(symptomEntries.userId, userId),
          gte(symptomEntries.startTime, startDate),
          lte(symptomEntries.startTime, endDate)
        )
      )
      .orderBy(desc(symptomEntries.startTime));
  }

  async createSymptomEntry(insertEntry: InsertSymptomEntry): Promise<SymptomEntry> {
    const [entry] = await db.insert(symptomEntries).values(insertEntry).returning();
    return entry;
  }

  async updateSymptomEntry(entryId: number, updates: Partial<InsertSymptomEntry>): Promise<SymptomEntry | undefined> {
    const [updated] = await db.update(symptomEntries)
      .set(updates)
      .where(eq(symptomEntries.id, entryId))
      .returning();
    return updated;
  }

  async deleteSymptomEntry(entryId: number): Promise<boolean> {
    const result = await db.delete(symptomEntries).where(eq(symptomEntries.id, entryId));
    return (result.rowCount || 0) > 0;
  }

  // Personal Resources
  async getPersonalResourcesByUser(userId: number): Promise<PersonalResource[]> {
    return await db.select().from(personalResources)
      .where(eq(personalResources.userId, userId))
      .orderBy(desc(personalResources.createdAt));
  }

  async getPersonalResourcesByCategory(userId: number, category: string): Promise<PersonalResource[]> {
    return await db.select().from(personalResources)
      .where(
        and(
          eq(personalResources.userId, userId),
          eq(personalResources.category, category)
        )
      )
      .orderBy(desc(personalResources.createdAt));
  }

  async createPersonalResource(resource: InsertPersonalResource): Promise<PersonalResource> {
    const [created] = await db.insert(personalResources).values(resource).returning();
    return created;
  }

  async updatePersonalResource(resourceId: number, updates: Partial<InsertPersonalResource>): Promise<PersonalResource | undefined> {
    const [updated] = await db.update(personalResources)
      .set(updates)
      .where(eq(personalResources.id, resourceId))
      .returning();
    return updated;
  }

  async deletePersonalResource(resourceId: number): Promise<boolean> {
    const result = await db.delete(personalResources).where(eq(personalResources.id, resourceId));
    return (result.rowCount || 0) > 0;
  }

  async incrementResourceAccess(resourceId: number): Promise<PersonalResource | undefined> {
    // First get the current resource
    const [current] = await db.select().from(personalResources).where(eq(personalResources.id, resourceId));
    if (!current) return undefined;
    
    const [updated] = await db.update(personalResources)
      .set({
        accessCount: (current.accessCount || 0) + 1,
        lastAccessedAt: new Date()
      })
      .where(eq(personalResources.id, resourceId))
      .returning();
    return updated;
  }

  // Bus Schedules
  async getBusSchedulesByUser(userId: number): Promise<BusSchedule[]> {
    return await db.select().from(busSchedules)
      .where(eq(busSchedules.userId, userId))
      .orderBy(desc(busSchedules.createdAt));
  }

  async getBusSchedulesByDay(userId: number, dayOfWeek: string): Promise<BusSchedule[]> {
    return await db.select().from(busSchedules)
      .where(eq(busSchedules.userId, userId))
      .orderBy(busSchedules.departureTime);
  }

  async getFrequentBusRoutes(userId: number): Promise<BusSchedule[]> {
    return await db.select().from(busSchedules)
      .where(
        and(
          eq(busSchedules.userId, userId),
          eq(busSchedules.isFrequent, true)
        )
      )
      .orderBy(busSchedules.departureTime);
  }

  async createBusSchedule(schedule: InsertBusSchedule): Promise<BusSchedule> {
    const [created] = await db.insert(busSchedules).values(schedule).returning();
    return created;
  }

  async updateBusSchedule(scheduleId: number, updates: Partial<InsertBusSchedule>): Promise<BusSchedule | undefined> {
    const [updated] = await db.update(busSchedules)
      .set(updates)
      .where(eq(busSchedules.id, scheduleId))
      .returning();
    return updated;
  }

  async deleteBusSchedule(scheduleId: number): Promise<boolean> {
    const result = await db.delete(busSchedules).where(eq(busSchedules.id, scheduleId));
    return (result.rowCount || 0) > 0;
  }

  // Emergency Treatment Plans
  async getEmergencyTreatmentPlansByUser(userId: number): Promise<EmergencyTreatmentPlan[]> {
    return await db.select().from(emergencyTreatmentPlans)
      .where(eq(emergencyTreatmentPlans.userId, userId))
      .orderBy(desc(emergencyTreatmentPlans.createdAt));
  }

  async getActiveEmergencyTreatmentPlans(userId: number): Promise<EmergencyTreatmentPlan[]> {
    return await db.select().from(emergencyTreatmentPlans)
      .where(
        and(
          eq(emergencyTreatmentPlans.userId, userId),
          eq(emergencyTreatmentPlans.isActive, true)
        )
      )
      .orderBy(desc(emergencyTreatmentPlans.updatedAt));
  }

  async createEmergencyTreatmentPlan(plan: InsertEmergencyTreatmentPlan): Promise<EmergencyTreatmentPlan> {
    const [created] = await db.insert(emergencyTreatmentPlans).values(plan).returning();
    return created;
  }

  async updateEmergencyTreatmentPlan(planId: number, updates: Partial<InsertEmergencyTreatmentPlan>): Promise<EmergencyTreatmentPlan | undefined> {
    const [updated] = await db.update(emergencyTreatmentPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emergencyTreatmentPlans.id, planId))
      .returning();
    return updated;
  }

  async deleteEmergencyTreatmentPlan(planId: number): Promise<boolean> {
    const result = await db.delete(emergencyTreatmentPlans).where(eq(emergencyTreatmentPlans.id, planId));
    return (result.rowCount || 0) > 0;
  }

  // Geofences
  async getGeofencesByUser(userId: number): Promise<Geofence[]> {
    return await db.select().from(geofences)
      .where(eq(geofences.userId, userId))
      .orderBy(desc(geofences.createdAt));
  }

  async getActiveGeofencesByUser(userId: number): Promise<Geofence[]> {
    return await db.select().from(geofences)
      .where(
        and(
          eq(geofences.userId, userId),
          eq(geofences.isActive, true)
        )
      )
      .orderBy(desc(geofences.createdAt));
  }

  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const [created] = await db.insert(geofences).values(geofence).returning();
    return created;
  }

  async updateGeofence(geofenceId: number, updates: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const [updated] = await db.update(geofences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(geofences.id, geofenceId))
      .returning();
    return updated;
  }

  async deleteGeofence(geofenceId: number): Promise<boolean> {
    const result = await db.delete(geofences).where(eq(geofences.id, geofenceId));
    return (result.rowCount || 0) > 0;
  }

  // Geofence Events
  async getGeofenceEventsByUser(userId: number, limit: number = 50): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents)
      .where(eq(geofenceEvents.userId, userId))
      .orderBy(desc(geofenceEvents.timestamp))
      .limit(limit);
  }

  async getGeofenceEventsByGeofence(geofenceId: number, limit: number = 50): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents)
      .where(eq(geofenceEvents.geofenceId, geofenceId))
      .orderBy(desc(geofenceEvents.timestamp))
      .limit(limit);
  }

  async createGeofenceEvent(event: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const [created] = await db.insert(geofenceEvents).values(event).returning();
    return created;
  }

  async markGeofenceEventNotified(eventId: number): Promise<boolean> {
    const result = await db.update(geofenceEvents)
      .set({ notificationSent: true })
      .where(eq(geofenceEvents.id, eventId));
    return (result.rowCount || 0) > 0;
  }

  // Smart Notifications Implementation

  async markNotificationRead(notificationId: number): Promise<Notification | undefined> {
    const [updated] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  }

  async scheduleNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values({
      ...notification,
      scheduledFor: notification.scheduledFor || new Date()
    }).returning();
    return created;
  }

  // User Preferences Implementation

  async upsertUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const [upserted] = await db.insert(userPreferences)
      .values({ userId, ...preferences })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...preferences, updatedAt: new Date() }
      })
      .returning();
    return upserted;
  }

  // Enhanced Achievements Implementation
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [created] = await db.insert(userAchievements).values(achievement).returning();
    return created;
  }

  // Streak Tracking Implementation
  async getStreaksByUser(userId: number): Promise<StreakTracking[]> {
    return await db.select().from(streakTracking)
      .where(eq(streakTracking.userId, userId));
  }

  async updateStreak(userId: number, streakType: string, increment: boolean): Promise<StreakTracking> {
    const [existing] = await db.select().from(streakTracking)
      .where(and(eq(streakTracking.userId, userId), eq(streakTracking.streakType, streakType)));

    if (existing) {
      const newStreak = increment ? (existing.currentStreak || 0) + 1 : 0;
      const [updated] = await db.update(streakTracking)
        .set({
          currentStreak: newStreak,
          longestStreak: Math.max(existing.longestStreak || 0, newStreak),
          lastActivityDate: new Date().toISOString().split('T')[0]
        })
        .where(eq(streakTracking.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(streakTracking).values({
        userId,
        streakType,
        currentStreak: increment ? 1 : 0,
        longestStreak: increment ? 1 : 0,
        lastActivityDate: new Date().toISOString().split('T')[0]
      }).returning();
      return created;
    }
  }

  // Voice Interactions Implementation
  async createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction> {
    const [created] = await db.insert(voiceInteractions).values(interaction).returning();
    return created;
  }

  async getVoiceInteractionHistory(userId: number): Promise<VoiceInteraction[]> {
    return await db.select().from(voiceInteractions)
      .where(eq(voiceInteractions.userId, userId))
      .orderBy(desc(voiceInteractions.createdAt))
      .limit(50);
  }

  // Communication Enhancements Implementation
  async getQuickResponsesByUser(userId: number): Promise<QuickResponse[]> {
    return await db.select().from(quickResponses)
      .where(and(eq(quickResponses.userId, userId), eq(quickResponses.isActive, true)))
      .orderBy(desc(quickResponses.useCount));
  }

  async createQuickResponse(response: InsertQuickResponse): Promise<QuickResponse> {
    const [created] = await db.insert(quickResponses).values(response).returning();
    return created;
  }

  async incrementQuickResponseUsage(responseId: number): Promise<QuickResponse | undefined> {
    const [updated] = await db.update(quickResponses)
      .set({ useCount: (existing?.useCount || 0) + 1 })
      .where(eq(quickResponses.id, responseId))
      .returning();
    return updated;
  }

  // Message Reactions Implementation
  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return await db.select().from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(desc(messageReactions.createdAt));
  }

  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const [created] = await db.insert(messageReactions).values(reaction).returning();
    return created;
  }

  async removeMessageReaction(messageId: number, userId: number, emoji: string): Promise<boolean> {
    const result = await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      ));
    return (result.rowCount || 0) > 0;
  }

  // Activity Patterns Implementation
  async recordActivityPattern(pattern: InsertActivityPattern): Promise<ActivityPattern> {
    // Check if pattern already exists for this user, activity type, time, and day
    const [existing] = await db.select().from(activityPatterns)
      .where(and(
        eq(activityPatterns.userId, pattern.userId),
        eq(activityPatterns.activityType, pattern.activityType),
        eq(activityPatterns.timeOfDay, pattern.timeOfDay || '00:00:00'),
        eq(activityPatterns.dayOfWeek, pattern.dayOfWeek || 0)
      ));

    if (existing) {
      const [updated] = await db.update(activityPatterns)
        .set({ 
          frequency: existing.frequency + 1,
          lastUpdated: new Date()
        })
        .where(eq(activityPatterns.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(activityPatterns).values(pattern).returning();
      return created;
    }
  }

  async getActivityPatterns(userId: number, activityType: string): Promise<ActivityPattern[]> {
    return await db.select().from(activityPatterns)
      .where(and(eq(activityPatterns.userId, userId), eq(activityPatterns.activityType, activityType)))
      .orderBy(desc(activityPatterns.frequency));
  }

  async getUserBehaviorInsights(userId: number): Promise<any> {
    // Get activity patterns for personalization insights
    const patterns = await db.select().from(activityPatterns)
      .where(eq(activityPatterns.userId, userId));
    
    const insights = {
      mostActiveTimeOfDay: null,
      preferredDays: [],
      frequentActivities: [],
      suggestions: []
    };

    if (patterns.length > 0) {
      // Find most active time of day
      const timeFrequency = patterns.reduce((acc, pattern) => {
        const time = pattern.timeOfDay?.toString() || '00:00:00';
        acc[time] = (acc[time] || 0) + pattern.frequency;
        return acc;
      }, {} as Record<string, number>);
      
      insights.mostActiveTimeOfDay = Object.keys(timeFrequency)
        .reduce((a, b) => timeFrequency[a] > timeFrequency[b] ? a : b);

      // Get most frequent activities
      insights.frequentActivities = patterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map(p => ({ type: p.activityType, frequency: p.frequency }));
    }

    return insights;
  }

  // Caregiver Permission Management
  async getCaregiverPermissions(userId: number, caregiverId: number): Promise<CaregiverPermission[]> {
    return await db.select().from(caregiverPermissions)
      .where(and(
        eq(caregiverPermissions.userId, userId),
        eq(caregiverPermissions.caregiverId, caregiverId)
      ));
  }

  async setCaregiverPermission(permission: InsertCaregiverPermission): Promise<CaregiverPermission> {
    const [newPermission] = await db
      .insert(caregiverPermissions)
      .values(permission)
      .onConflictDoUpdate({
        target: [caregiverPermissions.userId, caregiverPermissions.caregiverId, caregiverPermissions.permissionType],
        set: {
          isGranted: permission.isGranted,
          isLocked: permission.isLocked,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newPermission;
  }

  async removeCaregiverPermission(userId: number, caregiverId: number, permissionType: string): Promise<boolean> {
    const result = await db.delete(caregiverPermissions)
      .where(and(
        eq(caregiverPermissions.userId, userId),
        eq(caregiverPermissions.caregiverId, caregiverId),
        eq(caregiverPermissions.permissionType, permissionType)
      ));
    return (result.rowCount || 0) > 0;
  }

  // Locked User Settings Management
  async getLockedUserSettings(userId: number): Promise<LockedUserSetting[]> {
    return await db.select().from(lockedUserSettings)
      .where(eq(lockedUserSettings.userId, userId));
  }

  async getLockedUserSetting(userId: number, settingKey: string): Promise<LockedUserSetting | undefined> {
    const [setting] = await db.select().from(lockedUserSettings)
      .where(and(
        eq(lockedUserSettings.userId, userId),
        eq(lockedUserSettings.settingKey, settingKey)
      ));
    return setting;
  }

  async lockUserSetting(setting: InsertLockedUserSetting): Promise<LockedUserSetting> {
    const [newSetting] = await db
      .insert(lockedUserSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: [lockedUserSettings.userId, lockedUserSettings.settingKey],
        set: {
          settingValue: setting.settingValue,
          isLocked: setting.isLocked,
          lockedBy: setting.lockedBy,
          lockReason: setting.lockReason,
          canUserView: setting.canUserView,
          updatedAt: new Date(),
        },
      })
      .returning();
    return newSetting;
  }

  async unlockUserSetting(userId: number, settingKey: string, caregiverId: number): Promise<boolean> {
    // Only allow unlocking if the caregiver who locked it (or a primary caregiver) is unlocking it
    const setting = await this.getLockedUserSetting(userId, settingKey);
    if (!setting) return false;

    // Check if current caregiver can unlock (either they locked it or they're primary)
    const connections = await db.select().from(userCaregiverConnections)
      .where(and(
        eq(userCaregiverConnections.userId, userId),
        eq(userCaregiverConnections.caregiverId, caregiverId),
        eq(userCaregiverConnections.connectionStatus, 'active')
      ));

    const connection = connections[0];
    const canUnlock = setting.lockedBy === caregiverId || 
                     (connection && connection.isPrimaryCaregiver);

    if (!canUnlock) return false;

    const result = await db.delete(lockedUserSettings)
      .where(and(
        eq(lockedUserSettings.userId, userId),
        eq(lockedUserSettings.settingKey, settingKey)
      ));
    return (result.rowCount || 0) > 0;
  }

  async isSettingLocked(userId: number, settingKey: string): Promise<boolean> {
    const setting = await this.getLockedUserSetting(userId, settingKey);
    return setting?.isLocked || false;
  }

  async canUserModifySetting(userId: number, settingKey: string): Promise<boolean> {
    const isLocked = await this.isSettingLocked(userId, settingKey);
    return !isLocked;
  }

  // Caregiver Invitation Management
  async createCaregiverInvitation(invitation: InsertCaregiverInvitation): Promise<CaregiverInvitation> {
    // Generate unique invitation code
    const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const [newInvitation] = await db
      .insert(caregiverInvitations)
      .values({
        ...invitation,
        invitationCode,
        expiresAt,
      })
      .returning();
    return newInvitation;
  }

  async getCaregiverInvitation(invitationCode: string): Promise<CaregiverInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(caregiverInvitations)
      .where(eq(caregiverInvitations.invitationCode, invitationCode));
    return invitation || undefined;
  }

  async getCaregiverInvitationsByCaregiver(caregiverId: number): Promise<CaregiverInvitation[]> {
    return await db
      .select()
      .from(caregiverInvitations)
      .where(eq(caregiverInvitations.caregiverId, caregiverId))
      .orderBy(desc(caregiverInvitations.createdAt));
  }

  async acceptCaregiverInvitation(invitationCode: string, acceptedBy: number): Promise<CaregiverInvitation | undefined> {
    const invitation = await this.getCaregiverInvitation(invitationCode);
    if (!invitation || invitation.status !== 'pending' || new Date() > new Date(invitation.expiresAt)) {
      return undefined;
    }

    const [updatedInvitation] = await db
      .update(caregiverInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy,
      })
      .where(eq(caregiverInvitations.invitationCode, invitationCode))
      .returning();

    // Create care relationship
    if (updatedInvitation) {
      await this.createCareRelationship({
        caregiverId: updatedInvitation.caregiverId,
        userId: acceptedBy,
        relationship: updatedInvitation.relationship,
        isPrimary: false,
        isActive: true,
        establishedVia: 'invitation',
      });
    }

    return updatedInvitation || undefined;
  }

  async expireCaregiverInvitation(invitationCode: string): Promise<boolean> {
    const result = await db
      .update(caregiverInvitations)
      .set({ status: 'expired' })
      .where(eq(caregiverInvitations.invitationCode, invitationCode));
    return (result.rowCount || 0) > 0;
  }

  // Care Relationship Management
  async createCareRelationship(relationship: InsertCareRelationship): Promise<CareRelationship> {
    const [newRelationship] = await db
      .insert(careRelationships)
      .values(relationship)
      .returning();
    return newRelationship;
  }

  async getCareRelationshipsByUser(userId: number): Promise<CareRelationship[]> {
    return await db
      .select()
      .from(careRelationships)
      .where(and(
        eq(careRelationships.userId, userId),
        eq(careRelationships.isActive, true)
      ));
  }

  async getCareRelationshipsByCaregiver(caregiverId: number): Promise<CareRelationship[]> {
    return await db
      .select()
      .from(careRelationships)
      .where(and(
        eq(careRelationships.caregiverId, caregiverId),
        eq(careRelationships.isActive, true)
      ));
  }

  async updateCareRelationship(id: number, updates: Partial<InsertCareRelationship>): Promise<CareRelationship | undefined> {
    const [updatedRelationship] = await db
      .update(careRelationships)
      .set(updates)
      .where(eq(careRelationships.id, id))
      .returning();
    return updatedRelationship || undefined;
  }

  async removeCareRelationship(id: number): Promise<boolean> {
    const result = await db
      .update(careRelationships)
      .set({ isActive: false })
      .where(eq(careRelationships.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Academic features implementation
  async getAcademicClassesByUser(userId: number): Promise<AcademicClass[]> {
    return await db.select().from(academicClasses).where(eq(academicClasses.userId, userId));
  }

  async createAcademicClass(classData: InsertAcademicClass): Promise<AcademicClass> {
    const [academicClass] = await db.insert(academicClasses).values(classData).returning();
    return academicClass;
  }

  async getAssignmentsByUser(userId: number): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.userId, userId));
  }

  async createAssignment(assignmentData: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db.insert(assignments).values(assignmentData).returning();
    return assignment;
  }

  async getStudySessionsByUser(userId: number): Promise<StudySession[]> {
    return await db.select().from(studySessions).where(eq(studySessions.userId, userId));
  }

  async createStudySession(sessionData: InsertStudySession): Promise<StudySession> {
    // Convert ISO strings to Date objects for timestamp fields
    const processedData = { ...sessionData };
    if (processedData.completedAt && typeof processedData.completedAt === 'string') {
      processedData.completedAt = new Date(processedData.completedAt);
    }
    if (processedData.startedAt && typeof processedData.startedAt === 'string') {
      processedData.startedAt = new Date(processedData.startedAt);
    }
    
    const [session] = await db.insert(studySessions).values(processedData).returning();
    return session;
  }

  async updateStudySession(sessionId: number, updateData: Partial<StudySession>): Promise<StudySession> {
    // Convert ISO strings to Date objects for timestamp fields
    const processedData = { ...updateData };
    if (processedData.completedAt && typeof processedData.completedAt === 'string') {
      processedData.completedAt = new Date(processedData.completedAt);
    }
    if (processedData.startedAt && typeof processedData.startedAt === 'string') {
      processedData.startedAt = new Date(processedData.startedAt);
    }
    
    const [session] = await db.update(studySessions)
      .set(processedData)
      .where(eq(studySessions.id, sessionId))
      .returning();
    return session;
  }

  async getCampusLocationsByUser(userId: number): Promise<CampusLocation[]> {
    return await db.select().from(campusLocations).where(eq(campusLocations.userId, userId));
  }

  async createCampusLocation(locationData: InsertCampusLocation): Promise<CampusLocation> {
    const [location] = await db.insert(campusLocations).values(locationData).returning();
    return location;
  }

  async getCampusTransportByUser(userId: number): Promise<CampusTransport[]> {
    return await db.select().from(campusTransport).where(eq(campusTransport.userId, userId));
  }

  async createCampusTransport(transportData: InsertCampusTransport): Promise<CampusTransport> {
    const [transport] = await db.insert(campusTransport).values(transportData).returning();
    return transport;
  }

  async getStudyGroupsByUser(userId: number): Promise<StudyGroup[]> {
    return await db.select().from(studyGroups).where(eq(studyGroups.userId, userId));
  }

  async createStudyGroup(groupData: InsertStudyGroup): Promise<StudyGroup> {
    const [group] = await db.insert(studyGroups).values(groupData).returning();
    return group;
  }

  async getTransitionSkillsByUser(userId: number): Promise<TransitionSkill[]> {
    return await db.select().from(transitionSkills).where(eq(transitionSkills.userId, userId));
  }

  async createTransitionSkill(skillData: InsertTransitionSkill): Promise<TransitionSkill> {
    const [skill] = await db.insert(transitionSkills).values(skillData).returning();
    return skill;
  }

  async updateTransitionSkill(skillId: number, updateData: Partial<TransitionSkill>): Promise<TransitionSkill> {
    const [skill] = await db.update(transitionSkills)
      .set(updateData)
      .where(eq(transitionSkills.id, skillId))
      .returning();
    return skill;
  }

  async deleteTransitionSkill(skillId: number): Promise<void> {
    await db.delete(transitionSkills).where(eq(transitionSkills.id, skillId));
  }

  // Calendar Events implementation
  async getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
  }

  async createCalendarEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }

  async updateCalendarEvent(id: number, eventData: Partial<InsertCalendarEvent>): Promise<CalendarEvent> {
    const [event] = await db.update(calendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: number): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Personal Documents methods
  async getPersonalDocuments(userId: number): Promise<PersonalDocument[]> {
    return await db.select().from(personalDocuments).where(eq(personalDocuments.userId, userId));
  }

  async createPersonalDocument(data: InsertPersonalDocument): Promise<PersonalDocument> {
    const [newDocument] = await db
      .insert(personalDocuments)
      .values(data)
      .returning();
    return newDocument;
  }

  async updatePersonalDocument(documentId: number, updates: Partial<InsertPersonalDocument>): Promise<PersonalDocument> {
    const [updatedDocument] = await db
      .update(personalDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(personalDocuments.id, documentId))
      .returning();
    
    if (!updatedDocument) throw new Error("Document not found");
    return updatedDocument;
  }

  async deletePersonalDocument(documentId: number): Promise<void> {
    await db
      .delete(personalDocuments)
      .where(eq(personalDocuments.id, documentId));
  }

  async getPersonalDocumentsByCategory(userId: number, category: string): Promise<PersonalDocument[]> {
    return await db.select().from(personalDocuments)
      .where(
        and(
          eq(personalDocuments.userId, userId),
          eq(personalDocuments.category, category)
        )
      );
  }

  // Sleep Tracking Methods
  async getSleepSessionsByUser(userId: number): Promise<SleepSession[]> {
    return await db.select().from(sleepSessions)
      .where(eq(sleepSessions.userId, userId))
      .orderBy(desc(sleepSessions.sleepDate));
  }

  async getSleepSessionByDate(userId: number, date: string): Promise<SleepSession | undefined> {
    const [session] = await db.select().from(sleepSessions)
      .where(
        and(
          eq(sleepSessions.userId, userId),
          eq(sleepSessions.sleepDate, date)
        )
      );
    return session || undefined;
  }

  async createSleepSession(session: InsertSleepSession): Promise<SleepSession> {
    const [newSession] = await db
      .insert(sleepSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateSleepSession(sessionId: number, updates: Partial<InsertSleepSession>): Promise<SleepSession | undefined> {
    const [updatedSession] = await db
      .update(sleepSessions)
      .set(updates)
      .where(eq(sleepSessions.id, sessionId))
      .returning();
    return updatedSession || undefined;
  }

  async deleteSleepSession(sessionId: number): Promise<boolean> {
    const result = await db.delete(sleepSessions).where(eq(sleepSessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  // Health Metrics Methods
  async getHealthMetricsByUser(userId: number, metricType?: string, startDate?: string, endDate?: string): Promise<HealthMetric[]> {
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
    
    return await db.select().from(healthMetrics)
      .where(and(...conditions))
      .orderBy(desc(healthMetrics.recordedAt));
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const [newMetric] = await db
      .insert(healthMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  // Rewards Program Methods
  async getRewardsByUser(userId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.userId, userId));
  }

  async getRewardsByCaregiver(caregiverId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.caregiverId, caregiverId));
  }

  async createReward(rewardData: InsertReward): Promise<Reward> {
    const [reward] = await db.insert(rewards).values(rewardData).returning();
    return reward;
  }

  async updateReward(id: number, updates: Partial<InsertReward>): Promise<Reward | undefined> {
    const [reward] = await db
      .update(rewards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rewards.id, id))
      .returning();
    return reward || undefined;
  }

  async deleteReward(id: number): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Points System Methods
  async getUserPointsBalance(userId: number): Promise<UserPointsBalance | undefined> {
    const [balance] = await db.select().from(userPointsBalance).where(eq(userPointsBalance.userId, userId));
    if (!balance) {
      // Create initial balance if it doesn't exist
      const [newBalance] = await db
        .insert(userPointsBalance)
        .values({ userId, totalPoints: 0, availablePoints: 0, lifetimeEarned: 0, lifetimeSpent: 0 })
        .returning();
      return newBalance;
    }
    return balance;
  }

  async updateUserPoints(userId: number, points: number, source: string, description: string, awardedBy?: number): Promise<UserPointsBalance> {
    // Create transaction record
    await db.insert(pointsTransactions).values({
      userId,
      points,
      transactionType: source,
      source: description,
      description,
      awardedBy
    });

    // Update user balance
    const balance = await this.getUserPointsBalance(userId);
    if (!balance) throw new Error("Could not get user balance");

    const newTotalPoints = balance.totalPoints + points;
    const newAvailablePoints = balance.availablePoints + points;
    const newLifetimeEarned = points > 0 ? balance.lifetimeEarned + points : balance.lifetimeEarned;
    const newLifetimeSpent = points < 0 ? balance.lifetimeSpent + Math.abs(points) : balance.lifetimeSpent;

    const [updatedBalance] = await db
      .update(userPointsBalance)
      .set({
        totalPoints: newTotalPoints,
        availablePoints: newAvailablePoints,
        lifetimeEarned: newLifetimeEarned,
        lifetimeSpent: newLifetimeSpent,
        updatedAt: new Date()
      })
      .where(eq(userPointsBalance.userId, userId))
      .returning();

    return updatedBalance;
  }

  async getPointsTransactions(userId: number): Promise<PointsTransaction[]> {
    return await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt));
  }

  async getPointsTransactionsByUser(userId: number): Promise<PointsTransaction[]> {
    return await this.getPointsTransactions(userId);
  }

  // Reward Redemptions Methods
  async getRewardRedemptions(userId: number): Promise<RewardRedemption[]> {
    return await db
      .select()
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, userId))
      .orderBy(desc(rewardRedemptions.redeemedAt));
  }

  async createRewardRedemption(redemptionData: InsertRewardRedemption): Promise<RewardRedemption> {
    const [redemption] = await db.insert(rewardRedemptions).values(redemptionData).returning();
    return redemption;
  }

  async updateRewardRedemptionStatus(redemptionId: number, status: string): Promise<RewardRedemption | undefined> {
    const updateData: any = { status };
    if (status === "completed") updateData.fulfilledAt = new Date();

    const [redemption] = await db
      .update(rewardRedemptions)
      .set(updateData)
      .where(eq(rewardRedemptions.id, redemptionId))
      .returning();
    return redemption || undefined;
  }
}

export const storage = new DatabaseStorage();

// Demo Mode Initialization
export async function initializeDemoMode() {
  try {
    console.log("🚀 Initializing comprehensive demo mode...");
    
    // Check if demo data already exists
    const existingContacts = await storage.getEmergencyContactsByUser(1);
    if (existingContacts.length > 0) {
      console.log("📝 Demo data already exists, skipping initialization");
      return;
    }
    
    // Demo Emergency Contacts
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

    // Add emergency contacts
    for (const contact of demoEmergencyContacts) {
      await storage.createEmergencyContact(contact);
    }

    // Demo Medications
    const demoMedications = [
      {
        userId: 1,
        medicationName: "Sertraline",
        dosage: "50mg",
        frequency: "Once daily",
        prescribedBy: "Dr. Johnson",
        startDate: new Date("2024-01-15"),
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
        startDate: new Date("2024-02-01"),
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

    // Demo Daily Tasks with various categories
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

    // Demo Appointments
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

    // Demo Meal Plans
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

    // Demo Shopping List
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
        estimatedCost: 4.50,
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

    // Demo Bills
    const demoBills = [
      {
        userId: 1,
        name: "Phone Bill",
        amount: 65.00,
        dueDate: new Date("2025-07-15").getTime(),
        category: "utilities",
        isPaid: false,
        isRecurring: true
      },
      {
        userId: 1,
        name: "Student Loan",
        amount: 150.00,
        dueDate: new Date("2025-07-10").getTime(),
        category: "education",
        isPaid: true,
        isRecurring: true
      }
    ];

    for (const bill of demoBills) {
      await storage.createBill(bill);
    }

    // Demo Mood Entry
    await storage.createMoodEntry({
      userId: 1,
      mood: 4,
      notes: "Feeling good today! Completed most of my tasks and had a nice chat with Jamie."
    });

    // Demo Personal Resources
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

    // Demo Rewards System
    // Initialize user points balance
    await storage.getUserPointsBalance(1); // Creates initial balance if doesn't exist
    
    // Award some initial points for demo
    await storage.updateUserPoints(1, 25, "daily_task", "Completed morning medication task", 2);
    await storage.updateUserPoints(1, 15, "mood_check", "Daily mood tracking completed", 2);
    await storage.updateUserPoints(1, 30, "appointment", "Attended therapy session", 2);
    await storage.updateUserPoints(1, 10, "caregiver_bonus", "Bonus points from caregiver", 2);

    // Demo Rewards
    const demoRewards = [
      {
        userId: 1,
        caregiverId: 2, // Caregiver who created the reward
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

    // Demo Personal Documents
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

    console.log("✅ Demo mode initialized successfully with comprehensive data!");
  } catch (error) {
    console.error("❌ Error initializing demo mode:", error);
  }
}

// Initialize demo mode when storage is imported
initializeDemoMode();