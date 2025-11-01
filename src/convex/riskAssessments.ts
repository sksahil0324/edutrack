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

// Calculate risk assessment (AI simulation) - ORIGINAL ALGORITHM
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
    const academicRisk = 100 - ((student.currentCGPA / 10.0) * 25 + student.assignmentCompletionRate * 0.35 + student.testScoreAverage * 0.4);
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

// ALGORITHM 2: Machine Learning-Inspired with Non-Linear Penalties
export const calculateRiskML = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    const previous = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .first();
    
    // Non-linear risk calculation with exponential penalties for critical thresholds
    const cgpaScore = student.currentCGPA / 10.0;
    const academicRisk = cgpaScore < 0.5 
      ? 90 + (0.5 - cgpaScore) * 20  // Exponential penalty below 5.0 CGPA
      : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
    
    const attendanceRisk = student.attendanceRate < 75 
      ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5  // Extra penalty below 75%
      : 100 - student.attendanceRate;
    
    const engagementRisk = 100 - (
      Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
      student.classParticipationScore * 0.4 + 
      Math.sqrt(student.challengeCompletionRate) * 3
    );
    
    const financialRisk = student.feePaymentStatus === "overdue" ? 85 : 
                         student.feePaymentStatus === "delayed" ? 55 : 15;
    
    const socialRisk = student.classParticipationScore < 50 
      ? 100 - student.classParticipationScore + 10  // Penalty for low participation
      : 100 - student.classParticipationScore;
    
    // Dynamic weighting based on severity
    const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
    const weights = {
      academic: maxRisk === academicRisk ? 0.40 : 0.30,
      attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
      engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
      financial: 0.10,
      social: 0.10,
    };
    
    const riskScore = (
      academicRisk * weights.academic +
      attendanceRisk * weights.attendance +
      engagementRisk * weights.engagement +
      financialRisk * weights.financial +
      socialRisk * weights.social
    );
    
    let riskLevel: "low" | "moderate" | "high";
    if (riskScore < 35) riskLevel = "low";
    else if (riskScore < 65) riskLevel = "moderate";
    else riskLevel = "high";
    
    const recommendations: string[] = [];
    if (academicRisk > 60) recommendations.push("Urgent: Intensive academic support required");
    if (academicRisk > 45 && academicRisk <= 60) recommendations.push("Schedule regular tutoring sessions");
    if (attendanceRisk > 50) recommendations.push("Critical: Address chronic absenteeism immediately");
    if (engagementRisk > 55) recommendations.push("Implement personalized engagement strategies");
    if (financialRisk > 50) recommendations.push("Priority: Connect with financial aid office");
    if (socialRisk > 65) recommendations.push("Refer to counseling for social integration support");
    
    let trendDirection = "stable";
    if (previous) {
      if (riskScore < previous.riskScore - 7) trendDirection = "improving";
      else if (riskScore > previous.riskScore + 7) trendDirection = "declining";
    }
    
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
    
    return { riskLevel, riskScore, trendDirection, algorithm: "ML-Inspired" };
  },
});

// ALGORITHM 3: Holistic Balanced with Interaction Effects
export const calculateRiskHolistic = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    const previous = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .first();
    
    // Equal weighting approach with compound factors
    const academicRisk = 100 - (
      (student.currentCGPA / 10.0) * 33.33 + 
      student.assignmentCompletionRate * 0.33 + 
      student.testScoreAverage * 0.33
    );
    
    const attendanceRisk = 100 - (
      student.attendanceRate * 0.7 + 
      (100 - student.totalAbsences * 2) * 0.2 + 
      (100 - student.tardinessCount * 5) * 0.1
    );
    
    const engagementRisk = 100 - (
      (student.loginFrequency / 7) * 25 + 
      student.classParticipationScore * 0.5 + 
      student.challengeCompletionRate * 0.25
    );
    
    const financialRisk = student.feePaymentStatus === "overdue" ? 75 : 
                         student.feePaymentStatus === "delayed" ? 45 : 
                         student.hasScholarship ? 10 : 20;
    
    const socialRisk = 100 - (
      student.classParticipationScore * 0.6 + 
      (student.currentStreak / student.longestStreak || 0) * 40
    );
    
    // Interaction effects: compound risks when multiple factors are high
    const compoundMultiplier = 1 + (
      (academicRisk > 60 && attendanceRisk > 60 ? 0.15 : 0) +
      (academicRisk > 60 && engagementRisk > 60 ? 0.15 : 0) +
      (attendanceRisk > 60 && engagementRisk > 60 ? 0.10 : 0) +
      (financialRisk > 60 && academicRisk > 50 ? 0.10 : 0)
    );
    
    // Equal weighting (20% each)
    const baseRiskScore = (
      academicRisk * 0.20 +
      attendanceRisk * 0.20 +
      engagementRisk * 0.20 +
      financialRisk * 0.20 +
      socialRisk * 0.20
    );
    
    const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
    
    let riskLevel: "low" | "moderate" | "high";
    if (riskScore < 33) riskLevel = "low";
    else if (riskScore < 66) riskLevel = "moderate";
    else riskLevel = "high";
    
    const recommendations: string[] = [];
    if (compoundMultiplier > 1.2) recommendations.push("Multiple risk factors detected - comprehensive intervention needed");
    if (academicRisk > 50) recommendations.push("Provide academic mentoring and study skills training");
    if (attendanceRisk > 45) recommendations.push("Implement attendance monitoring and parent communication");
    if (engagementRisk > 50) recommendations.push("Create personalized learning pathways to boost engagement");
    if (financialRisk > 50) recommendations.push("Explore scholarship opportunities and payment plans");
    if (socialRisk > 55) recommendations.push("Foster peer connections through group projects and activities");
    if (riskScore > 70) recommendations.push("Assign dedicated counselor for holistic support");
    
    let trendDirection = "stable";
    if (previous) {
      const change = previous.riskScore - riskScore;
      if (change > 6) trendDirection = "improving";
      else if (change < -6) trendDirection = "declining";
    }
    
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
    
    return { riskLevel, riskScore, trendDirection, algorithm: "Holistic-Balanced", compoundMultiplier };
  },
});

// Run all three algorithms and return comparison
export const calculateAllAlgorithms = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    
    // Get previous assessment for trend calculation
    const previous = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .first();
    
    // Helper function to calculate each algorithm's metrics
    const calculateOriginal = () => {
      const academicRisk = 100 - ((student.currentCGPA / 10.0) * 25 + student.assignmentCompletionRate * 0.35 + student.testScoreAverage * 0.4);
      const attendanceRisk = 100 - student.attendanceRate;
      const engagementRisk = 100 - ((student.loginFrequency / 7) * 30 + student.classParticipationScore * 0.5 + student.challengeCompletionRate * 0.2);
      const financialRisk = student.feePaymentStatus === "overdue" ? 80 : student.feePaymentStatus === "delayed" ? 50 : 20;
      const socialRisk = 100 - student.classParticipationScore;
      
      const riskScore = (
        academicRisk * 0.35 +
        attendanceRisk * 0.25 +
        engagementRisk * 0.20 +
        financialRisk * 0.10 +
        socialRisk * 0.10
      );
      
      let riskLevel: "low" | "moderate" | "high";
      if (riskScore < 30) riskLevel = "low";
      else if (riskScore < 60) riskLevel = "moderate";
      else riskLevel = "high";
      
      return { riskScore, riskLevel, algorithm: "Original (Rule-Based)" };
    };
    
    const calculateML = () => {
      const cgpaScore = student.currentCGPA / 10.0;
      const academicRisk = cgpaScore < 0.5 
        ? 90 + (0.5 - cgpaScore) * 20
        : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
      
      const attendanceRisk = student.attendanceRate < 75 
        ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
        : 100 - student.attendanceRate;
      
      const engagementRisk = 100 - (
        Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
        student.classParticipationScore * 0.4 + 
        Math.sqrt(student.challengeCompletionRate) * 3
      );
      
      const financialRisk = student.feePaymentStatus === "overdue" ? 85 : 
                           student.feePaymentStatus === "delayed" ? 55 : 15;
      
      const socialRisk = student.classParticipationScore < 50 
        ? 100 - student.classParticipationScore + 10
        : 100 - student.classParticipationScore;
      
      const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
      const weights = {
        academic: maxRisk === academicRisk ? 0.40 : 0.30,
        attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
        engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
        financial: 0.10,
        social: 0.10,
      };
      
      const riskScore = (
        academicRisk * weights.academic +
        attendanceRisk * weights.attendance +
        engagementRisk * weights.engagement +
        financialRisk * weights.financial +
        socialRisk * weights.social
      );
      
      let riskLevel: "low" | "moderate" | "high";
      if (riskScore < 35) riskLevel = "low";
      else if (riskScore < 65) riskLevel = "moderate";
      else riskLevel = "high";
      
      return { riskScore, riskLevel, algorithm: "ML-Inspired" };
    };
    
    const calculateHolistic = () => {
      const academicRisk = 100 - (
        (student.currentCGPA / 10.0) * 33.33 + 
        student.assignmentCompletionRate * 0.33 + 
        student.testScoreAverage * 0.33
      );
      
      const attendanceRisk = 100 - (
        student.attendanceRate * 0.7 + 
        (100 - student.totalAbsences * 2) * 0.2 + 
        (100 - student.tardinessCount * 5) * 0.1
      );
      
      const engagementRisk = 100 - (
        (student.loginFrequency / 7) * 25 + 
        student.classParticipationScore * 0.5 + 
        student.challengeCompletionRate * 0.25
      );
      
      const financialRisk = student.feePaymentStatus === "overdue" ? 75 : 
                           student.feePaymentStatus === "delayed" ? 45 : 
                           student.hasScholarship ? 10 : 20;
      
      const socialRisk = 100 - (
        student.classParticipationScore * 0.6 + 
        (student.currentStreak / student.longestStreak || 0) * 40
      );
      
      const compoundMultiplier = 1 + (
        (academicRisk > 60 && attendanceRisk > 60 ? 0.15 : 0) +
        (academicRisk > 60 && engagementRisk > 60 ? 0.15 : 0) +
        (attendanceRisk > 60 && engagementRisk > 60 ? 0.10 : 0) +
        (financialRisk > 60 && academicRisk > 50 ? 0.10 : 0)
      );
      
      const baseRiskScore = (
        academicRisk * 0.20 +
        attendanceRisk * 0.20 +
        engagementRisk * 0.20 +
        financialRisk * 0.20 +
        socialRisk * 0.20
      );
      
      const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
      
      let riskLevel: "low" | "moderate" | "high";
      if (riskScore < 33) riskLevel = "low";
      else if (riskScore < 66) riskLevel = "moderate";
      else riskLevel = "high";
      
      return { riskScore, riskLevel, algorithm: "Holistic-Balanced", compoundMultiplier };
    };
    
    const original = calculateOriginal();
    const ml = calculateML();
    const holistic = calculateHolistic();
    
    // Calculate average and consensus
    const avgScore = (original.riskScore + ml.riskScore + holistic.riskScore) / 3;
    const scores = [original.riskScore, ml.riskScore, holistic.riskScore];
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / 3;
    const agreement = variance < 100 ? "high" : variance < 400 ? "moderate" : "low";
    
    return {
      original,
      ml,
      holistic,
      comparison: {
        averageScore: avgScore,
        variance,
        agreement,
        recommendation: ml.riskScore > 60 ? "ML-Inspired flags urgent intervention needed" :
                       holistic.riskScore > 60 ? "Holistic suggests comprehensive support" :
                       "All algorithms indicate manageable risk"
      }
    };
  },
});

// Get comparison data for a student
export const getAlgorithmComparison = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;
    
    // This would typically be cached or stored, but for now we'll calculate on demand
    // In production, you'd want to store comparison results
    return {
      studentId: args.studentId,
      note: "Run calculateAllAlgorithms mutation to generate comparison"
    };
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