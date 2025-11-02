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

// Clear all risk assessments for fresh recalculation
export const clearAllRiskAssessments = mutation({
  args: {},
  handler: async (ctx) => {
    const assessments = await ctx.db.query("riskAssessments").collect();
    let deletedCount = 0;
    
    for (const assessment of assessments) {
      await ctx.db.delete(assessment._id);
      deletedCount++;
    }
    
    return { deletedCount, message: `Cleared ${deletedCount} old risk assessments` };
  },
});

// Calculate risk assessment - Uses ML + Holistic Combined algorithm as primary (most accurate)
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
    
    // ML-BASED COMPONENT: Non-linear with exponential penalties
    const cgpaScore = student.currentCGPA / 10.0;
    const mlAcademic = cgpaScore < 0.5 
      ? 90 + (0.5 - cgpaScore) * 20
      : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
    
    const mlAttendance = student.attendanceRate < 75 
      ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
      : 100 - student.attendanceRate;
    
    const mlEngagement = 100 - (
      Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
      student.classParticipationScore * 0.4 + 
      Math.sqrt(student.challengeCompletionRate) * 3
    );
    
    // HOLISTIC COMPONENT: Equal weighting with compound effects
    const holisticAcademic = 100 - (
      (student.currentCGPA / 10.0) * 33.33 + 
      student.assignmentCompletionRate * 0.33 + 
      student.testScoreAverage * 0.33
    );
    
    const holisticAttendance = 100 - (
      student.attendanceRate * 0.7 + 
      (100 - student.totalAbsences * 2) * 0.2 + 
      (100 - student.tardinessCount * 5) * 0.1
    );
    
    const holisticEngagement = 100 - (
      (student.loginFrequency / 7) * 25 + 
      student.classParticipationScore * 0.5 + 
      student.challengeCompletionRate * 0.25
    );
    
    const holisticFinancial = student.feePaymentStatus === "overdue" ? 75 : 
                             student.feePaymentStatus === "delayed" ? 45 : 
                             student.hasScholarship ? 10 : 20;
    
    const holisticSocial = 100 - (
      student.classParticipationScore * 0.6 + 
      (student.currentStreak / student.longestStreak || 0) * 40
    );
    
    // Compound multiplier for interaction effects
    const compoundMultiplier = 1 + (
      (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
      (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
      (holisticAttendance > 60 && holisticEngagement > 60 ? 0.10 : 0) +
      (holisticFinancial > 60 && holisticAcademic > 50 ? 0.10 : 0)
    );
    
    // COMBINED: 60% ML-Based (early detection) + 40% Holistic (compound effects) - MOST ACCURATE
    const mlFinancial = student.feePaymentStatus === "overdue" ? 85 : 
                       student.feePaymentStatus === "delayed" ? 55 : 15;
    const mlSocial = student.classParticipationScore < 50 
      ? 100 - student.classParticipationScore + 10
      : 100 - student.classParticipationScore;
    
    const academicRisk = mlAcademic * 0.60 + holisticAcademic * 0.40;
    const attendanceRisk = mlAttendance * 0.60 + holisticAttendance * 0.40;
    const engagementRisk = mlEngagement * 0.60 + holisticEngagement * 0.40;
    const financialRisk = mlFinancial * 0.60 + holisticFinancial * 0.40;
    const socialRisk = mlSocial * 0.60 + holisticSocial * 0.40;
    
    // Dynamic weighting based on severity
    const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
    const weights = {
      academic: maxRisk === academicRisk ? 0.40 : 0.30,
      attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
      engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
      financial: 0.10,
      social: 0.10,
    };
    
    const baseRiskScore = (
      academicRisk * weights.academic +
      attendanceRisk * weights.attendance +
      engagementRisk * weights.engagement +
      financialRisk * weights.financial +
      socialRisk * weights.social
    );
    
    const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
    
    // Determine risk level
    let riskLevel: "low" | "moderate" | "high";
    if (riskScore < 35) riskLevel = "low";
    else if (riskScore < 65) riskLevel = "moderate";
    else riskLevel = "high";
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (compoundMultiplier > 1.2) recommendations.push("Multiple risk factors detected - comprehensive intervention needed");
    if (academicRisk > 60) recommendations.push("Urgent: Intensive academic support required");
    if (academicRisk > 45 && academicRisk <= 60) recommendations.push("Schedule regular tutoring sessions");
    if (attendanceRisk > 50) recommendations.push("Critical: Address chronic absenteeism immediately");
    if (engagementRisk > 55) recommendations.push("Implement personalized engagement strategies");
    if (financialRisk > 50) recommendations.push("Priority: Connect with financial aid office");
    if (socialRisk > 65) recommendations.push("Refer to counseling for social integration support");
    if (riskScore > 70) recommendations.push("Assign dedicated counselor for holistic support");
    
    // Trend direction
    let trendDirection = "stable";
    if (previous) {
      if (riskScore < previous.riskScore - 7) trendDirection = "improving";
      else if (riskScore > previous.riskScore + 7) trendDirection = "declining";
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

// ALGORITHM 2: ML + Holistic Combined (Most Accurate)
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
    
    // ML-BASED COMPONENT: Non-linear with exponential penalties
    const cgpaScore = student.currentCGPA / 10.0;
    const mlBased = {
      academic: cgpaScore < 0.5 
        ? 90 + (0.5 - cgpaScore) * 20
        : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2),
      attendance: student.attendanceRate < 75 
        ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
        : 100 - student.attendanceRate,
      engagement: 100 - (
        Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
        student.classParticipationScore * 0.4 + 
        Math.sqrt(student.challengeCompletionRate) * 3
      ),
      financial: student.feePaymentStatus === "overdue" ? 85 : 
                 student.feePaymentStatus === "delayed" ? 55 : 15,
      social: student.classParticipationScore < 50 
        ? 100 - student.classParticipationScore + 10
        : 100 - student.classParticipationScore,
    };
    
    // HOLISTIC COMPONENT: Equal weighting with compound effects
    const holisticAcademic = 100 - (
      (student.currentCGPA / 10.0) * 33.33 + 
      student.assignmentCompletionRate * 0.33 + 
      student.testScoreAverage * 0.33
    );
    
    const holisticAttendance = 100 - (
      student.attendanceRate * 0.7 + 
      (100 - student.totalAbsences * 2) * 0.2 + 
      (100 - student.tardinessCount * 5) * 0.1
    );
    
    const holisticEngagement = 100 - (
      (student.loginFrequency / 7) * 25 + 
      student.classParticipationScore * 0.5 + 
      student.challengeCompletionRate * 0.25
    );
    
    const holisticFinancial = student.feePaymentStatus === "overdue" ? 75 : 
                             student.feePaymentStatus === "delayed" ? 45 : 
                             student.hasScholarship ? 10 : 20;
    
    const holisticSocial = 100 - (
      student.classParticipationScore * 0.6 + 
      (student.currentStreak / student.longestStreak || 0) * 40
    );
    
    // Compound multiplier for interaction effects
    const compoundMultiplier = 1 + (
      (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
      (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
      (holisticAttendance > 60 && holisticEngagement > 60 ? 0.10 : 0) +
      (holisticFinancial > 60 && holisticAcademic > 50 ? 0.10 : 0)
    );
    
    // COMBINED: 55% ML-Based (early detection) + 45% Holistic (compound effects)
    const academicRisk = mlBased.academic * 0.55 + holisticAcademic * 0.45;
    const attendanceRisk = mlBased.attendance * 0.55 + holisticAttendance * 0.45;
    const engagementRisk = mlBased.engagement * 0.55 + holisticEngagement * 0.45;
    const financialRisk = mlBased.financial * 0.55 + holisticFinancial * 0.45;
    const socialRisk = mlBased.social * 0.55 + holisticSocial * 0.45;
    
    // Dynamic weighting based on severity
    const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
    const weights = {
      academic: maxRisk === academicRisk ? 0.40 : 0.30,
      attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
      engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
      financial: 0.10,
      social: 0.10,
    };
    
    const baseRiskScore = (
      academicRisk * weights.academic +
      attendanceRisk * weights.attendance +
      engagementRisk * weights.engagement +
      financialRisk * weights.financial +
      socialRisk * weights.social
    );
    
    const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
    
    let riskLevel: "low" | "moderate" | "high";
    if (riskScore < 35) riskLevel = "low";
    else if (riskScore < 65) riskLevel = "moderate";
    else riskLevel = "high";
    
    const recommendations: string[] = [];
    if (compoundMultiplier > 1.2) recommendations.push("Multiple risk factors detected - comprehensive intervention needed");
    if (academicRisk > 60) recommendations.push("Urgent: Intensive academic support required");
    if (academicRisk > 45 && academicRisk <= 60) recommendations.push("Schedule regular tutoring sessions");
    if (attendanceRisk > 50) recommendations.push("Critical: Address chronic absenteeism immediately");
    if (engagementRisk > 55) recommendations.push("Implement personalized engagement strategies");
    if (financialRisk > 50) recommendations.push("Priority: Connect with financial aid office");
    if (socialRisk > 65) recommendations.push("Refer to counseling for social integration support");
    if (riskScore > 70) recommendations.push("Assign dedicated counselor for holistic support");
    
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
    
    return { riskLevel, riskScore, trendDirection, algorithm: "ML + Holistic (Most Accurate)" };
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

// Run all four algorithms and return comparison
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
    
    // ALGORITHM 1: Rule-Based (Original)
    const calculateRuleBased = () => {
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
      
      return { riskScore, riskLevel, algorithm: "Rule-Based" };
    };
    
    // ALGORITHM 2: ML-Based (Non-linear with exponential penalties)
    const calculateMLBased = () => {
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
      
      return { riskScore, riskLevel, algorithm: "ML-Based" };
    };
    
    // ALGORITHM 3: Holistic Balanced
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
    
    const ruleBased = calculateRuleBased();
    const mlBased = calculateMLBased();
    const holistic = calculateHolistic();
    
    // ALGORITHM 4: ML + Holistic Combined (Most Accurate)
    const calculateMLHolisticCombined = () => {
      // ML-BASED COMPONENT: Non-linear with exponential penalties
      const cgpaScore = student.currentCGPA / 10.0;
      const mlAcademic = cgpaScore < 0.5 
        ? 90 + (0.5 - cgpaScore) * 20
        : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
      
      const mlAttendance = student.attendanceRate < 75 
        ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
        : 100 - student.attendanceRate;
      
      const mlEngagement = 100 - (
        Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
        student.classParticipationScore * 0.4 + 
        Math.sqrt(student.challengeCompletionRate) * 3
      );
      
      // HOLISTIC COMPONENT: Equal weighting with compound effects
      const holisticAcademic = 100 - (
        (student.currentCGPA / 10.0) * 33.33 + 
        student.assignmentCompletionRate * 0.33 + 
        student.testScoreAverage * 0.33
      );
      
      const holisticAttendance = 100 - (
        student.attendanceRate * 0.7 + 
        (100 - student.totalAbsences * 2) * 0.2 + 
        (100 - student.tardinessCount * 5) * 0.1
      );
      
      const holisticEngagement = 100 - (
        (student.loginFrequency / 7) * 25 + 
        student.classParticipationScore * 0.5 + 
        student.challengeCompletionRate * 0.25
      );
      
      // Compound multiplier for interaction effects
      const compoundMultiplier = 1 + (
        (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
        (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
        (holisticAttendance > 60 && holisticEngagement > 60 ? 0.10 : 0) +
        (student.feePaymentStatus !== "current" && holisticAcademic > 50 ? 0.10 : 0)
      );
      
      // COMBINED: 60% ML-Based (early detection) + 40% Holistic (compound effects) - MOST ACCURATE
      const academicRisk = mlAcademic * 0.60 + holisticAcademic * 0.40;
      const attendanceRisk = mlAttendance * 0.60 + holisticAttendance * 0.40;
      const engagementRisk = mlEngagement * 0.60 + holisticEngagement * 0.40;
      const financialRisk = student.feePaymentStatus === "overdue" ? 85 : 
                           student.feePaymentStatus === "delayed" ? 55 : 15;
      const socialRisk = student.classParticipationScore < 50 
        ? 100 - student.classParticipationScore + 10
        : 100 - student.classParticipationScore;
      
      const mlFinancial = student.feePaymentStatus === "overdue" ? 85 : 
                         student.feePaymentStatus === "delayed" ? 55 : 15;
      const mlSocial = student.classParticipationScore < 50 
        ? 100 - student.classParticipationScore + 10
        : 100 - student.classParticipationScore;
      
      const holisticFinancial = student.feePaymentStatus === "overdue" ? 75 : 
                               student.feePaymentStatus === "delayed" ? 45 : 
                               student.hasScholarship ? 10 : 20;
      
      const holisticSocial = 100 - (
        student.classParticipationScore * 0.6 + 
        (student.currentStreak / student.longestStreak || 0) * 40
      );
      
      const finalFinancialRisk = mlFinancial * 0.60 + holisticFinancial * 0.40;
      const finalSocialRisk = mlSocial * 0.60 + holisticSocial * 0.40;
      
      const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
      const weights = {
        academic: maxRisk === academicRisk ? 0.40 : 0.30,
        attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
        engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
        financial: 0.10,
        social: 0.10,
      };
      
      const baseRiskScore = (
        academicRisk * weights.academic +
        attendanceRisk * weights.attendance +
        engagementRisk * weights.engagement +
        finalFinancialRisk * weights.financial +
        finalSocialRisk * weights.social
      );
      
      const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
      
      let riskLevel: "low" | "moderate" | "high";
      if (riskScore < 35) riskLevel = "low";
      else if (riskScore < 65) riskLevel = "moderate";
      else riskLevel = "high";
      
      return { riskScore, riskLevel, algorithm: "ML + Holistic Combined", compoundMultiplier };
    };
    
    const mlHolisticCombined = calculateMLHolisticCombined();
    
    // Calculate average and consensus
    const avgScore = (ruleBased.riskScore + mlBased.riskScore + holistic.riskScore + mlHolisticCombined.riskScore) / 4;
    const scores = [ruleBased.riskScore, mlBased.riskScore, holistic.riskScore, mlHolisticCombined.riskScore];
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / 4;
    const agreement = variance < 100 ? "high" : variance < 400 ? "moderate" : "low";
    
    return {
      ruleBased,
      mlBased,
      holistic,
      mlHolistic: mlHolisticCombined,
      comparison: {
        averageScore: avgScore,
        variance,
        agreement,
        recommendation: mlHolisticCombined.riskScore > 60 ? "ML + Holistic Combined flags urgent intervention needed" :
                       holistic.riskScore > 60 ? "Holistic indicates multiple risk factors" :
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

// Recalculate risk for all students
export const recalculateAllRisks = mutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    let calculatedCount = 0;
    
    for (const student of students) {
      try {
        // Get previous assessment
        const previous = await ctx.db
          .query("riskAssessments")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .order("desc")
          .first();
        
        // ML-BASED COMPONENT
        const cgpaScore = student.currentCGPA / 10.0;
        const mlAcademic = cgpaScore < 0.5 
          ? 90 + (0.5 - cgpaScore) * 20
          : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
        
        const mlAttendance = student.attendanceRate < 75 
          ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
          : 100 - student.attendanceRate;
        
        const mlEngagement = 100 - (
          Math.pow(student.loginFrequency / 7, 0.8) * 30 + 
          student.classParticipationScore * 0.4 + 
          Math.sqrt(student.challengeCompletionRate) * 3
        );
        
        // HOLISTIC COMPONENT
        const holisticAcademic = 100 - (
          (student.currentCGPA / 10.0) * 33.33 + 
          student.assignmentCompletionRate * 0.33 + 
          student.testScoreAverage * 0.33
        );
        
        const holisticAttendance = 100 - (
          student.attendanceRate * 0.7 + 
          (100 - student.totalAbsences * 2) * 0.2 + 
          (100 - student.tardinessCount * 5) * 0.1
        );
        
        const holisticEngagement = 100 - (
          (student.loginFrequency / 7) * 25 + 
          student.classParticipationScore * 0.5 + 
          student.challengeCompletionRate * 0.25
        );
        
        const holisticFinancial = student.feePaymentStatus === "overdue" ? 75 : 
                                 student.feePaymentStatus === "delayed" ? 45 : 
                                 student.hasScholarship ? 10 : 20;
        
        const holisticSocial = 100 - (
          student.classParticipationScore * 0.6 + 
          (student.currentStreak / student.longestStreak || 0) * 40
        );
        
        // Compound multiplier
        const compoundMultiplier = 1 + (
          (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
          (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
          (holisticAttendance > 60 && holisticEngagement > 60 ? 0.10 : 0) +
          (holisticFinancial > 60 && holisticAcademic > 50 ? 0.10 : 0)
        );
        
        // COMBINED: 60% ML + 40% Holistic
        const mlFinancial = student.feePaymentStatus === "overdue" ? 85 : 
                           student.feePaymentStatus === "delayed" ? 55 : 15;
        const mlSocial = student.classParticipationScore < 50 
          ? 100 - student.classParticipationScore + 10
          : 100 - student.classParticipationScore;
        
        const academicRisk = mlAcademic * 0.60 + holisticAcademic * 0.40;
        const attendanceRisk = mlAttendance * 0.60 + holisticAttendance * 0.40;
        const engagementRisk = mlEngagement * 0.60 + holisticEngagement * 0.40;
        const financialRisk = mlFinancial * 0.60 + holisticFinancial * 0.40;
        const socialRisk = mlSocial * 0.60 + holisticSocial * 0.40;
        
        const maxRisk = Math.max(academicRisk, attendanceRisk, engagementRisk);
        const weights = {
          academic: maxRisk === academicRisk ? 0.40 : 0.30,
          attendance: maxRisk === attendanceRisk ? 0.35 : 0.25,
          engagement: maxRisk === engagementRisk ? 0.25 : 0.20,
          financial: 0.10,
          social: 0.10,
        };
        
        const baseRiskScore = (
          academicRisk * weights.academic +
          attendanceRisk * weights.attendance +
          engagementRisk * weights.engagement +
          financialRisk * weights.financial +
          socialRisk * weights.social
        );
        
        const riskScore = Math.min(100, baseRiskScore * compoundMultiplier);
        
        let riskLevel: "low" | "moderate" | "high";
        if (riskScore < 35) riskLevel = "low";
        else if (riskScore < 65) riskLevel = "moderate";
        else riskLevel = "high";
        
        const recommendations: string[] = [];
        if (compoundMultiplier > 1.2) recommendations.push("Multiple risk factors detected - comprehensive intervention needed");
        if (academicRisk > 60) recommendations.push("Urgent: Intensive academic support required");
        if (academicRisk > 45 && academicRisk <= 60) recommendations.push("Schedule regular tutoring sessions");
        if (attendanceRisk > 50) recommendations.push("Critical: Address chronic absenteeism immediately");
        if (engagementRisk > 55) recommendations.push("Implement personalized engagement strategies");
        if (financialRisk > 50) recommendations.push("Priority: Connect with financial aid office");
        if (socialRisk > 65) recommendations.push("Refer to counseling for social integration support");
        if (riskScore > 70) recommendations.push("Assign dedicated counselor for holistic support");
        
        let trendDirection = "stable";
        if (previous) {
          if (riskScore < previous.riskScore - 7) trendDirection = "improving";
          else if (riskScore > previous.riskScore + 7) trendDirection = "declining";
        }
        
        await ctx.db.insert("riskAssessments", {
          studentId: student._id,
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
        
        calculatedCount++;
      } catch (error) {
        console.error(`Error calculating risk for student ${student._id}:`, error);
      }
    }
    
    return { calculatedCount, message: `Recalculated risk for ${calculatedCount} students using ML + Holistic Combined algorithm` };
  },
});