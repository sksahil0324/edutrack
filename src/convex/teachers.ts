import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current teacher profile
export const getCurrentTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Create teacher profile
export const create = mutation({
  args: {
    fullName: v.string(),
    teacherId: v.string(),
    department: v.string(),
    subjects: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      throw new Error("Teacher profile already exists");
    }
    
    return await ctx.db.insert("teachers", {
      userId,
      fullName: args.fullName,
      teacherId: args.teacherId,
      department: args.department,
      subjects: args.subjects,
      xp: 0,
      level: 1,
      interventionsCompleted: 0,
      successfulInterventions: 0,
    });
  },
});

// Add XP for teacher
export const addXP = mutation({
  args: {
    teacherId: v.id("teachers"),
    xp: v.number(),
  },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) throw new Error("Teacher not found");
    
    const newXP = teacher.xp + args.xp;
    const newLevel = Math.floor(newXP / 2000) + 1;
    
    await ctx.db.patch(args.teacherId, {
      xp: newXP,
      level: newLevel,
    });
    
    return { newXP, newLevel };
  },
});
