import { mutation, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

export const recalculateAllRisks = mutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    let updated = 0;
    for (const student of students) {
      try {
        await ctx.runMutation(api.riskAssessments.calculateRisk, {
          studentId: student._id,
        });
        updated++;
      } catch (error) {
        console.error(`Failed to recalculate risk for student ${student._id}:`, error);
      }
    }
    
    return { message: `Recalculated risk scores for ${updated} students` };
  },
});
