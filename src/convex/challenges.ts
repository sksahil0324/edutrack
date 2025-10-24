import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all active challenges
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("challenges")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get student's challenge progress
export const getStudentProgress = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentChallenges")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
  },
});

// Get student's challenges with full challenge details
export const getStudentChallenges = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const studentChallenges = await ctx.db
      .query("studentChallenges")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    
    // Fetch full challenge details for each
    const challengesWithDetails = await Promise.all(
      studentChallenges.map(async (sc) => {
        const challenge = await ctx.db.get(sc.challengeId);
        return {
          ...sc,
          challenge,
        };
      })
    );
    
    return challengesWithDetails;
  },
});

// Create challenge (internal for initialization)
export const createInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.string(),
    category: v.string(),
    xpReward: v.number(),
    targetMetric: v.string(),
    targetValue: v.number(),
    isActive: v.boolean(),
    startDate: v.number(),
    endDate: v.number(),
    badgeReward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("challenges", args);
  },
});

// Update challenge progress
export const updateProgress = mutation({
  args: {
    studentId: v.id("students"),
    challengeId: v.id("challenges"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studentChallenges")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("challengeId"), args.challengeId))
      .first();
    
    const isCompleted = args.progress >= 100;
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        progress: args.progress,
        status: isCompleted ? "completed" : existing.status,
        completedAt: isCompleted && !existing.completedAt ? Date.now() : existing.completedAt,
      });
    } else {
      await ctx.db.insert("studentChallenges", {
        studentId: args.studentId,
        challengeId: args.challengeId,
        progress: args.progress,
        status: isCompleted ? "completed" : "active",
        startedAt: Date.now(),
        completedAt: isCompleted ? Date.now() : undefined,
      });
    }
  },
});