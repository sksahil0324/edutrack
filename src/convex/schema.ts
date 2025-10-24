import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles
export const ROLES = {
  ADMIN: "admin",
  STUDENT: "student",
  TEACHER: "teacher",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.TEACHER),
);
export type Role = Infer<typeof roleValidator>;

// Risk levels
export const RISK_LEVELS = {
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
} as const;

export const riskLevelValidator = v.union(
  v.literal(RISK_LEVELS.LOW),
  v.literal(RISK_LEVELS.MODERATE),
  v.literal(RISK_LEVELS.HIGH),
);
export type RiskLevel = Infer<typeof riskLevelValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Student profiles with academic data
    students: defineTable({
      userId: v.id("users"),
      fullName: v.string(),
      studentId: v.string(),
      grade: v.string(),
      section: v.optional(v.string()),
      
      // Academic metrics
      currentGPA: v.number(),
      assignmentCompletionRate: v.number(), // 0-100
      testScoreAverage: v.number(), // 0-100
      
      // Attendance metrics
      attendanceRate: v.number(), // 0-100
      totalAbsences: v.number(),
      tardinessCount: v.number(),
      
      // Engagement metrics
      loginFrequency: v.number(), // logins per week
      classParticipationScore: v.number(), // 0-100
      challengeCompletionRate: v.number(), // 0-100
      
      // Financial indicators
      hasScholarship: v.boolean(),
      feePaymentStatus: v.string(), // "current", "delayed", "overdue"
      
      // Gamification
      xp: v.number(),
      level: v.number(),
      currentStreak: v.number(), // days
      longestStreak: v.number(),
      badges: v.array(v.string()),
      
      // Teacher assignment
      assignedTeacherId: v.optional(v.id("users")),
    })
      .index("by_user", ["userId"])
      .index("by_teacher", ["assignedTeacherId"])
      .index("by_student_id", ["studentId"]),

    // Teacher profiles
    teachers: defineTable({
      userId: v.id("users"),
      fullName: v.string(),
      teacherId: v.string(),
      department: v.string(),
      subjects: v.array(v.string()),
      
      // Gamification for teachers
      xp: v.number(),
      level: v.number(),
      interventionsCompleted: v.number(),
      successfulInterventions: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_teacher_id", ["teacherId"]),

    // AI Risk Assessments
    riskAssessments: defineTable({
      studentId: v.id("students"),
      riskLevel: riskLevelValidator,
      riskScore: v.number(), // 0-100
      
      // Contributing factors
      academicRisk: v.number(),
      attendanceRisk: v.number(),
      engagementRisk: v.number(),
      financialRisk: v.number(),
      socialRisk: v.number(),
      
      // AI recommendations
      recommendations: v.array(v.string()),
      predictedDropoutProbability: v.number(), // 0-100
      
      // Trend data
      trendDirection: v.string(), // "improving", "stable", "declining"
      previousScore: v.optional(v.number()),
    })
      .index("by_student", ["studentId"])
      .index("by_risk_level", ["riskLevel"]),

    // Interventions by teachers
    interventions: defineTable({
      studentId: v.id("students"),
      teacherId: v.id("teachers"),
      title: v.string(),
      description: v.string(),
      type: v.string(), // "mentoring", "tutoring", "counseling", "assignment"
      status: v.string(), // "planned", "in-progress", "completed", "cancelled"
      priority: v.string(), // "low", "medium", "high"
      
      dueDate: v.optional(v.number()),
      completedDate: v.optional(v.number()),
      
      // Effectiveness tracking
      initialRiskScore: v.number(),
      finalRiskScore: v.optional(v.number()),
      effectiveness: v.optional(v.number()), // 0-100
      
      notes: v.optional(v.string()),
    })
      .index("by_student", ["studentId"])
      .index("by_teacher", ["teacherId"])
      .index("by_status", ["status"]),

    // Challenges and Quests
    challenges: defineTable({
      title: v.string(),
      description: v.string(),
      type: v.string(), // "daily", "weekly", "monthly", "special"
      category: v.string(), // "academic", "attendance", "engagement", "social"
      
      xpReward: v.number(),
      badgeReward: v.optional(v.string()),
      
      targetMetric: v.string(), // "attendance", "assignment_completion", etc.
      targetValue: v.number(),
      
      isActive: v.boolean(),
      startDate: v.number(),
      endDate: v.number(),
    })
      .index("by_type", ["type"])
      .index("by_active", ["isActive"]),

    // Student Challenge Progress
    studentChallenges: defineTable({
      studentId: v.id("students"),
      challengeId: v.id("challenges"),
      status: v.string(), // "active", "completed", "failed", "expired"
      progress: v.number(), // 0-100
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      xpEarned: v.optional(v.number()),
    })
      .index("by_student", ["studentId"])
      .index("by_challenge", ["challengeId"])
      .index("by_student_and_status", ["studentId", "status"]),

    // Notifications
    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      message: v.string(),
      type: v.string(), // "alert", "achievement", "reminder", "intervention"
      isRead: v.boolean(),
      link: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_user_and_read", ["userId", "isRead"]),

    // Activity Log
    activityLog: defineTable({
      userId: v.id("users"),
      action: v.string(),
      description: v.string(),
      metadata: v.optional(v.string()), // JSON string
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;