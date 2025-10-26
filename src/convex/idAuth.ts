import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Login with student or teacher ID
export const loginWithId = mutation({
  args: {
    id: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher")),
  },
  handler: async (ctx, args) => {
    if (args.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", args.id))
        .first();
      
      if (!student) {
        throw new Error("Student ID not found");
      }
      
      return {
        success: true,
        userId: student.userId,
        profileId: student._id,
        role: "student" as const,
        profile: student,
      };
    } else {
      const teacher = await ctx.db
        .query("teachers")
        .withIndex("by_teacher_id", (q) => q.eq("teacherId", args.id))
        .first();
      
      if (!teacher) {
        throw new Error("Teacher ID not found");
      }
      
      return {
        success: true,
        userId: teacher.userId,
        profileId: teacher._id,
        role: "teacher" as const,
        profile: teacher,
      };
    }
  },
});

// Get profile by ID for verification
export const verifyId = query({
  args: {
    id: v.string(),
    role: v.union(v.literal("student"), v.literal("teacher")),
  },
  handler: async (ctx, args) => {
    if (args.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", args.id))
        .first();
      return student ? { exists: true, name: student.fullName } : { exists: false };
    } else {
      const teacher = await ctx.db
        .query("teachers")
        .withIndex("by_teacher_id", (q) => q.eq("teacherId", args.id))
        .first();
      return teacher ? { exists: true, name: teacher.fullName } : { exists: false };
    }
  },
});
