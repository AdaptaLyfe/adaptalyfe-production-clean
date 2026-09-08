import { storage } from "./storage";

export async function initializeComprehensiveDemo() {
  try {
    console.log("🚀 Initializing comprehensive demo mode...");
    
    // Check if demo data already exists
    const existingUser = await storage.getUserByUsername("alex");
    const existingAdmin = await storage.getUserByUsername("admin");
    
    if (!existingAdmin) {
      // Always ensure admin user exists
      const adminUser = await storage.createUser({
        username: "admin",
        password: "demo2025",
        name: "Demo Administrator", 
        email: "admin@skillbridge.com"
      });
      console.log("🔑 Created admin user: Demo Administrator (username: admin, password: demo2025)");
    }
    
    if (existingUser) {
      console.log("📝 Demo data already exists, skipping initialization");
      return;
    }

    // Create demo user
    const user = await storage.createUser({
      username: "alex",
      password: "password", // In real app, this would be hashed
      name: "Alex Chen",
      email: "alex@skillbridge.demo"
    });

    // Create admin demo user with full access to all features
    const adminUser = await storage.createUser({
      username: "admin",
      password: "demo2025", // Strong demo password
      name: "Demo Administrator",
      email: "admin@skillbridge.com"
    });

    console.log("👤 Created demo user: Alex Chen");
    console.log("🔑 Created admin user: Demo Administrator (username: admin, password: demo2025)");

    // Initialize core demo data modules
    await createDemoTasks(user.id);
    await createDemoFinances(user.id);
    await createDemoMoodEntries(user.id);
    await createDemoAppointments(user.id);
    await createDemoMealsAndShopping(user.id);

    // Create comprehensive admin demo data
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

    console.log("✅ Comprehensive demo initialization complete!");
    
  } catch (error) {
    console.error("❌ Error initializing demo data:", error);
  }
}

async function createDemoTasks(userId: number) {
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
  console.log("📋 Created demo daily tasks");
}

async function createDemoFinances(userId: number) {
  const bills = [
    {
      userId,
      name: "Phone bill",
      amount: 45.99,
      dueDate: 15, // day of month
      isPaid: false,
      category: "utilities"
    },
    {
      userId,
      name: "Therapy session",
      amount: 120.00,
      dueDate: 10, // day of month
      isPaid: true,
      category: "healthcare"
    },
    {
      userId,
      name: "Grocery budget",
      amount: 200.00,
      dueDate: 20, // day of month
      isPaid: false,
      category: "food"
    }
  ];

  for (const bill of bills) {
    await storage.createBill(bill);
  }
  console.log("💰 Created demo bills");
}

async function createDemoMoodEntries(userId: number) {
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
  console.log("😊 Created demo mood entries");
}

async function createDemoAppointments(userId: number) {
  const appointments = [
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

  for (const appointment of appointments) {
    await storage.createAppointment(appointment);
  }
  console.log("📅 Created demo appointments");
}

async function createDemoMealsAndShopping(userId: number) {
  const mealPlans = [
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

  for (const meal of mealPlans) {
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
  console.log("🍽️ Created demo meals and shopping data");
}

async function createDemoMedicalData(userId: number) {
  // Emergency contacts
  const emergencyContacts = [
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

  for (const contact of emergencyContacts) {
    await storage.createEmergencyContact(contact);
  }

  // Allergies
  const allergies = [
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

  for (const allergy of allergies) {
    await storage.createAllergy(allergy);
  }

  // Medical conditions
  const conditions = [
    {
      userId,
      condition: "ADHD",
      diagnosedDate: new Date("2020-03-15"),
      status: "active",
      notes: "Managed with medication and therapy"
    },
    {
      userId,
      condition: "Anxiety",
      diagnosedDate: new Date("2021-06-10"),
      status: "active",
      notes: "Improving with counseling"
    }
  ];

  for (const condition of conditions) {
    await storage.createMedicalCondition(condition);
  }

  console.log("🏥 Created demo medical data");
}

async function createDemoPharmacyData(userId: number) {
  // Create pharmacy
  const pharmacy = await storage.createPharmacy({
    name: "Walgreens #1234",
    address: "123 Main St, City, State 12345",
    phoneNumber: "555-0789",
    type: "walgreens"
  });

  // Link user to pharmacy
  await storage.createUserPharmacy({
    userId,
    pharmacyId: pharmacy.id,
    isPrimary: true
  });

  // Create medications
  const medications = [
    {
      userId,
      prescriptionNumber: "RX123456",
      medicationName: "Adderall XR",
      dosage: "20mg",
      frequency: "daily",
      prescribedBy: "Dr. Smith",
      refillsRemaining: 2,
      lastRefillDate: new Date("2025-06-15"),
      nextRefillDate: new Date("2025-07-15"),
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
      lastRefillDate: new Date("2025-06-01"),
      nextRefillDate: new Date("2025-07-01"),
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

  for (const medication of medications) {
    await storage.createMedication(medication);
  }

  console.log("💊 Created demo pharmacy and medication data");
}

async function createDemoCaregiverData(userId: number) {
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

  const messages = [
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

  for (const message of messages) {
    await storage.createMessage(message);
  }

  console.log("👨‍👩‍👧‍👦 Created demo caregiver and communication data");
}

async function createDemoResourcesData(userId: number) {
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

  console.log("📚 Created demo resources data");
}

async function createDemoAchievements(userId: number) {
  const achievements = [
    {
      userId,
      title: "7-Day Streak Master",
      description: "Completed daily tasks for 7 days in a row",
      category: "streak",
      pointsEarned: 100,
      unlockedAt: new Date("2025-07-01")
    },
    {
      userId,
      title: "Mood Tracker Pro",
      description: "Logged mood for 30 consecutive days",
      category: "consistency",
      pointsEarned: 150,
      unlockedAt: new Date("2025-06-25")
    }
  ];

  for (const achievement of achievements) {
    await storage.createAchievement(achievement);
  }

  console.log("🏆 Created demo achievements");
}

async function createDemoPreferences(userId: number) {
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

  console.log("⚙️ Created demo user preferences");
}

async function createDemoCalendarEvents(userId: number) {
  const events = [
    {
      userId,
      title: "Doctor Appointment",
      description: "Annual check-up with primary care physician",
      startDate: new Date("2025-07-10T09:00:00.000Z"),
      endDate: new Date("2025-07-10T10:00:00.000Z"),
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
      startDate: new Date("2025-07-08T15:00:00.000Z"),
      endDate: new Date("2025-07-08T16:30:00.000Z"),
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
      startDate: new Date("2025-07-12T18:00:00.000Z"),
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
      startDate: new Date("2025-07-09T10:00:00.000Z"),
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
  console.log("📅 Created demo calendar events");
}

async function createDemoNotifications(userId: number) {
  const notifications = [
    {
      userId,
      title: "Medication Reminder",
      message: "Time to take your morning Adderall XR",
      type: "medication",
      priority: "high",
      isRead: false,
      scheduledFor: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    },
    {
      userId,
      title: "Appointment Tomorrow",
      message: "Don't forget your dental cleaning at 2:30 PM",
      type: "appointment",
      priority: "medium",
      isRead: true,
      scheduledFor: new Date("2025-07-19T14:30:00")
    }
  ];

  for (const notification of notifications) {
    await storage.createNotification(notification);
  }

  console.log("🔔 Created demo notifications");
}