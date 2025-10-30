import { mutation } from "./_generated/server";

export const fixStudentGrades = mutation({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("students").collect();
    
    const validGrades = ["1", "2", "3"];
    let updated = 0;
    
    for (const student of students) {
      // If grade is not in valid range (1-3), assign a random valid grade
      if (!validGrades.includes(student.grade)) {
        const randomGrade = validGrades[Math.floor(Math.random() * validGrades.length)];
        await ctx.db.patch(student._id, {
          grade: randomGrade,
        });
        updated++;
      }
    }
    
    return {
      message: "Student grades fixed successfully",
      studentsUpdated: updated,
      totalStudents: students.length,
    };
  },
});
