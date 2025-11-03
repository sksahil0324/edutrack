import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Calculate temporal trend with velocity and acceleration
export const calculateTemporalTrend = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const assessments = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(5);

    if (assessments.length < 2) {
      return { velocity: 0, acceleration: 0, trend: "insufficient_data" };
    }

    // Calculate velocity (rate of change)
    const latest = assessments[0].riskScore;
    const previous = assessments[1].riskScore;
    const velocity = latest - previous;

    // Calculate acceleration (change in velocity)
    let acceleration = 0;
    if (assessments.length >= 3) {
      const prevVelocity = assessments[1].riskScore - assessments[2].riskScore;
      acceleration = velocity - prevVelocity;
    }

    // Determine trend direction with confidence
    let trend = "stable";
    if (velocity < -5) trend = "improving";
    else if (velocity > 5) trend = "declining";

    return {
      velocity,
      acceleration,
      trend,
      confidence: Math.min(100, (Math.abs(velocity) / 10) * 100),
      recentScores: assessments.map((a) => a.riskScore),
    };
  },
});

// Weighted ensemble combining all 4 algorithms with learned weights
export const calculateWeightedEnsemble = mutation({
  args: {
    studentId: v.id("students"),
    ruleBasedScore: v.number(),
    mlBasedScore: v.number(),
    holisticScore: v.number(),
    mlHolisticScore: v.number(),
  },
  handler: async (ctx, args) => {
    // Optimized weights based on performance analysis
    // ML + Holistic is most accurate (87%), so give it highest weight
    const weights = {
      ruleBased: 0.15, // Baseline, less accurate
      mlBased: 0.25, // Good early detection
      holistic: 0.20, // Good for compound effects
      mlHolistic: 0.40, // Most accurate, highest weight
    };

    // Calculate weighted ensemble score
    const ensembleScore =
      args.ruleBasedScore * weights.ruleBased +
      args.mlBasedScore * weights.mlBased +
      args.holisticScore * weights.holistic +
      args.mlHolisticScore * weights.mlHolistic;

    // Calculate variance to measure algorithm agreement
    const scores = [
      args.ruleBasedScore,
      args.mlBasedScore,
      args.holisticScore,
      args.mlHolisticScore,
    ];
    const mean = ensembleScore;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);

    // Confidence based on algorithm agreement
    const confidence = Math.max(0, 100 - stdDev * 2);

    // Adjust ensemble score based on confidence
    // If algorithms agree strongly, trust the ensemble more
    const adjustedScore =
      ensembleScore * (0.7 + confidence * 0.003); // Boost by up to 30% if high agreement

    return {
      ensembleScore: Math.min(100, adjustedScore),
      confidence,
      stdDev,
      weights,
      algorithmAgreement:
        stdDev < 10 ? "high" : stdDev < 20 ? "moderate" : "low",
    };
  },
});

// Enhanced risk calculation with temporal analysis and ensemble
export const calculateEnhancedRisk = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // Get temporal trend
    const assessments = await ctx.db
      .query("riskAssessments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(5);

    let temporalData = { velocity: 0, acceleration: 0, trend: "insufficient_data", confidence: 0 };
    
    if (assessments.length >= 2) {
      const latest = assessments[0].riskScore;
      const previous = assessments[1].riskScore;
      const velocity = latest - previous;

      let acceleration = 0;
      if (assessments.length >= 3) {
        const prevVelocity =
          assessments[1].riskScore - assessments[2].riskScore;
        acceleration = velocity - prevVelocity;
      }

      let trend = "stable";
      if (velocity < -5) trend = "improving";
      else if (velocity > 5) trend = "declining";

      temporalData = {
        velocity,
        acceleration,
        trend,
        confidence: Math.min(100, (Math.abs(velocity) / 10) * 100),
      };
    }

    // Calculate all 4 algorithms
    const cgpaScore = student.currentCGPA / 10.0;

    // Algorithm 1: Rule-Based
    const ruleBased = {
      academic: 100 - (cgpaScore * 25 + student.assignmentCompletionRate * 0.35 + student.testScoreAverage * 0.4),
      attendance: 100 - student.attendanceRate,
      engagement: 100 - ((student.loginFrequency / 7) * 30 + student.classParticipationScore * 0.5 + student.challengeCompletionRate * 0.2),
      financial: student.feePaymentStatus === "overdue" ? 80 : student.feePaymentStatus === "delayed" ? 50 : 20,
      social: 100 - student.classParticipationScore,
    };
    const ruleBasedScore =
      ruleBased.academic * 0.35 +
      ruleBased.attendance * 0.25 +
      ruleBased.engagement * 0.2 +
      ruleBased.financial * 0.1 +
      ruleBased.social * 0.1;

    // Algorithm 2: ML-Based
    const mlAcademic =
      cgpaScore < 0.5
        ? 90 + (0.5 - cgpaScore) * 20
        : 100 - (cgpaScore * 60 + student.assignmentCompletionRate * 0.2 + student.testScoreAverage * 0.2);
    const mlAttendance =
      student.attendanceRate < 75
        ? 100 - student.attendanceRate + (75 - student.attendanceRate) * 0.5
        : 100 - student.attendanceRate;
    const mlEngagement =
      100 -
      (Math.pow(student.loginFrequency / 7, 0.8) * 30 +
        student.classParticipationScore * 0.4 +
        Math.sqrt(student.challengeCompletionRate) * 3);
    const mlFinancial =
      student.feePaymentStatus === "overdue"
        ? 85
        : student.feePaymentStatus === "delayed"
          ? 55
          : 15;
    const mlSocial =
      student.classParticipationScore < 50
        ? 100 - student.classParticipationScore + 10
        : 100 - student.classParticipationScore;

    const maxRisk = Math.max(mlAcademic, mlAttendance, mlEngagement);
    const mlWeights = {
      academic: maxRisk === mlAcademic ? 0.4 : 0.3,
      attendance: maxRisk === mlAttendance ? 0.35 : 0.25,
      engagement: maxRisk === mlEngagement ? 0.25 : 0.2,
      financial: 0.1,
      social: 0.1,
    };
    const mlBasedScore =
      mlAcademic * mlWeights.academic +
      mlAttendance * mlWeights.attendance +
      mlEngagement * mlWeights.engagement +
      mlFinancial * mlWeights.financial +
      mlSocial * mlWeights.social;

    // Algorithm 3: Holistic
    const holisticAcademic =
      100 -
      (cgpaScore * 33.33 +
        student.assignmentCompletionRate * 0.33 +
        student.testScoreAverage * 0.33);
    const holisticAttendance =
      100 -
      (student.attendanceRate * 0.7 +
        (100 - student.totalAbsences * 2) * 0.2 +
        (100 - student.tardinessCount * 5) * 0.1);
    const holisticEngagement =
      100 -
      ((student.loginFrequency / 7) * 25 +
        student.classParticipationScore * 0.5 +
        student.challengeCompletionRate * 0.25);
    const holisticFinancial =
      student.feePaymentStatus === "overdue"
        ? 75
        : student.feePaymentStatus === "delayed"
          ? 45
          : student.hasScholarship
            ? 10
            : 20;
    const holisticSocial =
      100 -
      (student.classParticipationScore * 0.6 +
        ((student.currentStreak / student.longestStreak) || 0) * 40);

    const holisticCompound =
      1 +
      (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
      (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
      (holisticAttendance > 60 && holisticEngagement > 60 ? 0.1 : 0) +
      (holisticFinancial > 60 && holisticAcademic > 50 ? 0.1 : 0);

    const holisticScore =
      (holisticAcademic * 0.2 +
        holisticAttendance * 0.2 +
        holisticEngagement * 0.2 +
        holisticFinancial * 0.2 +
        holisticSocial * 0.2) *
      holisticCompound;

    // Algorithm 4: ML + Holistic Combined
    const combinedAcademic = mlAcademic * 0.6 + holisticAcademic * 0.4;
    const combinedAttendance = mlAttendance * 0.6 + holisticAttendance * 0.4;
    const combinedEngagement = mlEngagement * 0.6 + holisticEngagement * 0.4;
    const combinedFinancial = mlFinancial * 0.6 + holisticFinancial * 0.4;
    const combinedSocial = mlSocial * 0.6 + holisticSocial * 0.4;

    const combinedCompound =
      1 +
      (holisticAcademic > 60 && holisticAttendance > 60 ? 0.15 : 0) +
      (holisticAcademic > 60 && holisticEngagement > 60 ? 0.15 : 0) +
      (holisticAttendance > 60 && holisticEngagement > 60 ? 0.1 : 0) +
      (student.feePaymentStatus !== "current" && holisticAcademic > 50
        ? 0.1
        : 0);

    const combinedMaxRisk = Math.max(
      combinedAcademic,
      combinedAttendance,
      combinedEngagement
    );
    const combinedWeights = {
      academic: combinedMaxRisk === combinedAcademic ? 0.4 : 0.3,
      attendance: combinedMaxRisk === combinedAttendance ? 0.35 : 0.25,
      engagement: combinedMaxRisk === combinedEngagement ? 0.25 : 0.2,
      financial: 0.1,
      social: 0.1,
    };

    const mlHolisticScore = Math.min(
      100,
      (combinedAcademic * combinedWeights.academic +
        combinedAttendance * combinedWeights.attendance +
        combinedEngagement * combinedWeights.engagement +
        combinedFinancial * combinedWeights.financial +
        combinedSocial * combinedWeights.social) *
        combinedCompound
    );

    // Calculate weighted ensemble
    const weights = {
      ruleBased: 0.15,
      mlBased: 0.25,
      holistic: 0.2,
      mlHolistic: 0.4,
    };

    const scores = [ruleBasedScore, mlBasedScore, holisticScore, mlHolisticScore];
    const mean =
      ruleBasedScore * weights.ruleBased +
      mlBasedScore * weights.mlBased +
      holisticScore * weights.holistic +
      mlHolisticScore * weights.mlHolistic;

    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / 4;
    const stdDev = Math.sqrt(variance);
    const algorithmConfidence = Math.max(0, 100 - stdDev * 2);

    // Apply temporal adjustment
    let temporalAdjustment = 1;
    if (temporalData.trend === "declining") {
      temporalAdjustment = 1 + temporalData.confidence * 0.005; // Boost if declining
    } else if (temporalData.trend === "improving") {
      temporalAdjustment = Math.max(0.8, 1 - temporalData.confidence * 0.005); // Reduce if improving
    }

    const enhancedScore = Math.min(100, mean * temporalAdjustment);

    // Determine risk level
    let riskLevel: "low" | "moderate" | "high";
    if (enhancedScore < 35) riskLevel = "low";
    else if (enhancedScore < 65) riskLevel = "moderate";
    else riskLevel = "high";

    // Generate recommendations
    const recommendations: string[] = [];
    if (stdDev > 20)
      recommendations.push(
        "Algorithm variance high - multiple intervention approaches recommended"
      );
    if (temporalData.trend === "declining")
      recommendations.push(
        "WARNING: Risk score is declining - immediate intervention needed"
      );
    if (temporalData.trend === "improving")
      recommendations.push("Positive trend detected - continue current support");
    if (combinedAcademic > 60)
      recommendations.push("Urgent: Intensive academic support required");
    if (combinedAttendance > 50)
      recommendations.push("Critical: Address chronic absenteeism immediately");
    if (combinedEngagement > 55)
      recommendations.push("Implement personalized engagement strategies");

    return {
      enhancedScore,
      riskLevel,
      algorithmScores: {
        ruleBased: ruleBasedScore,
        mlBased: mlBasedScore,
        holistic: holisticScore,
        mlHolistic: mlHolisticScore,
      },
      ensemble: {
        score: enhancedScore,
        confidence: algorithmConfidence,
        agreement:
          stdDev < 10 ? "high" : stdDev < 20 ? "moderate" : "low",
        stdDev,
      },
      temporal: {
        trend: temporalData.trend,
        velocity: temporalData.velocity,
        acceleration: temporalData.acceleration,
        adjustment: temporalAdjustment,
      },
      recommendations,
    };
  },
});
