import { mutation } from "./_generated/server";

export const clearAllStudents = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all students
    const students = await ctx.db.query("students").collect();
    for (const student of students) {
      await ctx.db.delete(student._id);
    }
    
    // Delete all risk assessments
    const risks = await ctx.db.query("riskAssessments").collect();
    for (const risk of risks) {
      await ctx.db.delete(risk._id);
    }
    
    // Delete all interventions
    const interventions = await ctx.db.query("interventions").collect();
    for (const intervention of interventions) {
      await ctx.db.delete(intervention._id);
    }
    
    // Delete all student users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.role === "student") {
        await ctx.db.delete(user._id);
      }
    }
    
    return {
      message: "Database cleared successfully",
      studentsDeleted: students.length,
      risksDeleted: risks.length,
      interventionsDeleted: interventions.length,
    };
  },
});
