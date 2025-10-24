import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all students
export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

// Get all teachers
export const getAllTeachers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

// Get system statistics
export const getStatistics = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    const teachers = await ctx.db.query("teachers").collect();
    const riskAssessments = await ctx.db.query("riskAssessments").collect();

    const atRiskStudents = riskAssessments.filter(
      (r) => r.riskLevel === "high" || r.riskLevel === "moderate"
    ).length;

    return {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      atRiskStudents,
      activeUsers: students.length + teachers.length,
    };
  },
});
