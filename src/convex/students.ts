import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current student profile
export const getCurrentStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get student by ID
export const getById = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.studentId);
  },
});

// Create student profile
export const create = mutation({
  args: {
    fullName: v.string(),
    studentId: v.string(),
    grade: v.string(),
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Check if student profile already exists
    const existing = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      throw new Error("Student profile already exists");
    }
    
    return await ctx.db.insert("students", {
      userId,
      fullName: args.fullName,
      studentId: args.studentId,
      grade: args.grade,
      section: args.section,
      currentGPA: 3.0,
      assignmentCompletionRate: 80,
      testScoreAverage: 75,
      attendanceRate: 90,
      totalAbsences: 0,
      tardinessCount: 0,
      loginFrequency: 5,
      classParticipationScore: 70,
      challengeCompletionRate: 0,
      hasScholarship: false,
      feePaymentStatus: "current",
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
    });
  },
});

// Update student metrics
export const updateMetrics = mutation({
  args: {
    studentId: v.id("students"),
    currentGPA: v.optional(v.number()),
    assignmentCompletionRate: v.optional(v.number()),
    testScoreAverage: v.optional(v.number()),
    attendanceRate: v.optional(v.number()),
    totalAbsences: v.optional(v.number()),
    tardinessCount: v.optional(v.number()),
    loginFrequency: v.optional(v.number()),
    classParticipationScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { studentId, ...updates } = args;
    await ctx.db.patch(studentId, updates);
  },
});

// Add XP and update level
export const addXP = mutation({
  args: {
    studentId: v.id("students"),
    xp: v.number(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    const newXP = student.xp + args.xp;
    const newLevel = Math.floor(newXP / 1000) + 1;
    
    await ctx.db.patch(args.studentId, {
      xp: newXP,
      level: newLevel,
    });
    
    return { newXP, newLevel, leveledUp: newLevel > student.level };
  },
});

// Update streak
export const updateStreak = mutation({
  args: {
    studentId: v.id("students"),
    increment: v.boolean(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    const newStreak = args.increment ? student.currentStreak + 1 : 0;
    const longestStreak = Math.max(student.longestStreak, newStreak);
    
    await ctx.db.patch(args.studentId, {
      currentStreak: newStreak,
      longestStreak,
    });
    
    return { currentStreak: newStreak, longestStreak };
  },
});

// Add badge
export const addBadge = mutation({
  args: {
    studentId: v.id("students"),
    badge: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    if (!student.badges.includes(args.badge)) {
      await ctx.db.patch(args.studentId, {
        badges: [...student.badges, args.badge],
      });
    }
  },
});

// Get all students (for teachers)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

// Get students by teacher
export const getByTeacher = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_teacher", (q) => q.eq("assignedTeacherId", args.teacherId))
      .collect();
  },
});
