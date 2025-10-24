import { v } from "convex/values";
import { query } from "./_generated/server";

// Get all students with risk assessments
export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    // Fetch risk assessments for each student
    const studentsWithRisk = await Promise.all(
      students.map(async (student) => {
        const riskAssessment = await ctx.db
          .query("riskAssessments")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .order("desc")
          .first();
        
        return {
          ...student,
          riskAssessment: riskAssessment || null,
        };
      })
    );
    
    return studentsWithRisk;
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