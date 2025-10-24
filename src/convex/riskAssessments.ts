import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { riskLevelValidator } from "./schema";

// Get latest risk assessment for student
export const getLatestForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const assessments = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(1);
    
    return assessments[0] || null;
  },
});

// Get risk history for student
export const getHistoryForStudent = query({
  args: { studentId: v.id("students"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(limit);
  },
});

// Create risk assessment
export const create = mutation({
  args: {
    studentId: v.id("students"),
    riskLevel: riskLevelValidator,
    riskScore: v.number(),
    academicRisk: v.number(),
    attendanceRisk: v.number(),
    engagementRisk: v.number(),
    financialRisk: v.number(),
    socialRisk: v.number(),
    recommendations: v.array(v.string()),
    predictedDropoutProbability: v.number(),
    trendDirection: v.string(),
    previousScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("riskAssessments", args);
  },
});

// Calculate risk assessment (AI simulation)
export const calculateRisk = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    // Get previous assessment
    const previous = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .first();
    
    // Calculate risk factors (0-100, higher = more risk)
    const academicRisk = 100 - ((student.currentGPA / 4.0) * 25 + student.assignmentCompletionRate * 0.35 + student.testScoreAverage * 0.4);
    const attendanceRisk = 100 - student.attendanceRate;
    const engagementRisk = 100 - ((student.loginFrequency / 7) * 30 + student.classParticipationScore * 0.5 + student.challengeCompletionRate * 0.2);
    const financialRisk = student.feePaymentStatus === "overdue" ? 80 : student.feePaymentStatus === "delayed" ? 50 : 20;
    const socialRisk = 100 - student.classParticipationScore;
    
    // Weighted average
    const riskScore = (
      academicRisk * 0.35 +
      attendanceRisk * 0.25 +
      engagementRisk * 0.20 +
      financialRisk * 0.10 +
      socialRisk * 0.10
    );
    
    // Determine risk level
    let riskLevel: "low" | "moderate" | "high";
    if (riskScore < 30) riskLevel = "low";
    else if (riskScore < 60) riskLevel = "moderate";
    else riskLevel = "high";
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (academicRisk > 50) recommendations.push("Schedule tutoring sessions to improve grades");
    if (attendanceRisk > 40) recommendations.push("Address attendance issues - contact student/parents");
    if (engagementRisk > 50) recommendations.push("Increase engagement through interactive activities");
    if (financialRisk > 50) recommendations.push("Discuss financial aid options");
    if (socialRisk > 60) recommendations.push("Encourage peer interaction and group activities");
    
    // Trend direction
    let trendDirection = "stable";
    if (previous) {
      if (riskScore < previous.riskScore - 5) trendDirection = "improving";
      else if (riskScore > previous.riskScore + 5) trendDirection = "declining";
    }
    
    // Create assessment
    await ctx.db.insert("riskAssessments", {
      studentId: args.studentId,
      riskLevel,
      riskScore,
      academicRisk,
      attendanceRisk,
      engagementRisk,
      financialRisk,
      socialRisk,
      recommendations,
      predictedDropoutProbability: riskScore,
      trendDirection,
      previousScore: previous?.riskScore,
    });
    
    return { riskLevel, riskScore, trendDirection };
  },
});

// Get all high-risk students
export const getHighRiskStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("riskAssessments")
      .withIndex("by_risk_level", (q) => q.eq("riskLevel", "high"))
      .collect();
  },
});
