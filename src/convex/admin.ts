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

// Get all teachers with their interventions
export const getAllTeachers = query({
  args: {},
  handler: async (ctx) => {
    const teachers = await ctx.db.query("teachers").collect();
    
    // Fetch interventions for each teacher
    const teachersWithInterventions = await Promise.all(
      teachers.map(async (teacher) => {
        const interventions = await ctx.db
          .query("interventions")
          .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
          .collect();
        
        // Get student details for each intervention
        const interventionsWithStudents = await Promise.all(
          interventions.map(async (intervention) => {
            const student = await ctx.db.get(intervention.studentId);
            return {
              ...intervention,
              student,
            };
          })
        );
        
        // Calculate statistics
        const totalInterventions = interventions.length;
        const completedInterventions = interventions.filter(i => i.status === "completed").length;
        const inProgressInterventions = interventions.filter(i => i.status === "in-progress").length;
        const plannedInterventions = interventions.filter(i => i.status === "planned").length;
        const highPriorityInterventions = interventions.filter(i => i.priority === "high").length;
        
        return {
          ...teacher,
          interventions: interventionsWithStudents,
          stats: {
            totalInterventions,
            completedInterventions,
            inProgressInterventions,
            plannedInterventions,
            highPriorityInterventions,
          },
        };
      })
    );
    
    return teachersWithInterventions;
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