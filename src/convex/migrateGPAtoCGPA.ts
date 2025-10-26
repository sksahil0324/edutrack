import { mutation } from "./_generated/server";

export const migrateStudentGPAtoCGPA = mutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    let updated = 0;
    for (const student of students) {
      const studentData = student as any;
      
      // Check if student has currentGPA but not currentCGPA
      if ("currentGPA" in studentData && !("currentCGPA" in studentData)) {
        await ctx.db.patch(studentData._id, {
          currentCGPA: studentData.currentGPA,
        });
        updated++;
      } else if (!("currentCGPA" in studentData)) {
        // If neither exists, set a default value
        await ctx.db.patch(studentData._id, {
          currentCGPA: 5.0, // Default middle value
        });
        updated++;
      }
    }
    
    return {
      message: "Migration completed",
      studentsUpdated: updated,
      totalStudents: students.length,
    };
  },
});