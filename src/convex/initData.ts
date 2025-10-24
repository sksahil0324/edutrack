import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const initializeSampleData = action({
  args: {},
  handler: async (ctx) => {
    // This action creates sample challenges for testing
    // Run with: npx convex run initData:initializeSampleData
    
    console.log("Initializing sample data...");
    
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    
    // Sample challenges matching the schema
    const challenges = [
      {
        title: "Perfect Attendance Week",
        description: "Attend all classes for 5 consecutive days",
        type: "weekly",
        category: "attendance",
        xpReward: 100,
        targetMetric: "attendance",
        targetValue: 100,
        isActive: true,
        startDate: now,
        endDate: now + oneWeek,
      },
      {
        title: "Assignment Master",
        description: "Complete 10 assignments with 90% or higher",
        type: "monthly",
        category: "academic",
        xpReward: 200,
        badgeReward: "Assignment Master",
        targetMetric: "assignment_completion",
        targetValue: 10,
        isActive: true,
        startDate: now,
        endDate: now + oneMonth,
      },
      {
        title: "Participation Champion",
        description: "Actively participate in class discussions for 3 days",
        type: "weekly",
        category: "engagement",
        xpReward: 150,
        targetMetric: "participation",
        targetValue: 3,
        isActive: true,
        startDate: now,
        endDate: now + oneWeek,
      },
      {
        title: "Early Bird",
        description: "Log in before 8 AM for 7 consecutive days",
        type: "weekly",
        category: "engagement",
        xpReward: 75,
        badgeReward: "Early Bird",
        targetMetric: "login_frequency",
        targetValue: 7,
        isActive: true,
        startDate: now,
        endDate: now + oneWeek,
      },
      {
        title: "GPA Excellence",
        description: "Maintain a GPA of 3.5 or higher for the semester",
        type: "special",
        category: "academic",
        xpReward: 300,
        badgeReward: "GPA Excellence",
        targetMetric: "gpa",
        targetValue: 3.5,
        isActive: true,
        startDate: now,
        endDate: now + oneMonth * 3,
      },
    ];
    
    for (const challenge of challenges) {
      await ctx.runMutation(internal.challenges.createInternal, challenge);
    }
    
    console.log(`Created ${challenges.length} sample challenges`);
    
    return { success: true, message: `Initialized ${challenges.length} challenges` };
  },
});
