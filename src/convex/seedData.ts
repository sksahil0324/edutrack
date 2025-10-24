import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Initialize admin
    const existingAdmin = await ctx.db
      .query("admins")
      .withIndex("by_admin_id", (q) => q.eq("adminId", "admin123"))
      .first();

    if (!existingAdmin) {
      await ctx.db.insert("admins", {
        adminId: "admin123",
        password: "1231",
        fullName: "System Administrator",
        email: "admin@edutrack.ai",
        isActive: true,
      });
    }

    // Seed 10 teachers
    const teacherNames = [
      "Dr. Sarah Johnson",
      "Prof. Michael Chen",
      "Ms. Emily Rodriguez",
      "Mr. James Wilson",
      "Dr. Priya Patel",
      "Prof. David Kim",
      "Ms. Lisa Anderson",
      "Mr. Robert Taylor",
      "Dr. Maria Garcia",
      "Prof. Thomas Brown",
    ];

    const departments = ["Mathematics", "Science", "English", "History", "Computer Science"];
    const subjects = [
      ["Algebra", "Geometry"],
      ["Physics", "Chemistry"],
      ["Literature", "Writing"],
      ["World History", "US History"],
      ["Programming", "Web Development"],
    ];

    for (let i = 0; i < 10; i++) {
      const existingTeacher = await ctx.db
        .query("teachers")
        .withIndex("by_teacher_id", (q) => q.eq("teacherId", `teacher${String(i + 1).padStart(3, "0")}`))
        .first();

      if (!existingTeacher) {
        // Create user first
        const userId = await ctx.db.insert("users", {
          name: teacherNames[i],
          email: `teacher${String(i + 1).padStart(3, "0")}@example.com`,
          role: "teacher",
        });

        // Create teacher profile
        await ctx.db.insert("teachers", {
          userId,
          fullName: teacherNames[i],
          teacherId: `teacher${String(i + 1).padStart(3, "0")}`,
          department: departments[i % departments.length],
          subjects: subjects[i % subjects.length],
          xp: Math.floor(Math.random() * 5000),
          level: Math.floor(Math.random() * 5) + 1,
          interventionsCompleted: Math.floor(Math.random() * 20),
          successfulInterventions: Math.floor(Math.random() * 15),
        });
      }
    }

    // Seed 100 students
    const firstNames = [
      "Alex", "Jordan", "Casey", "Morgan", "Riley", "Taylor", "Avery", "Quinn", "Skyler", "Dakota",
      "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas",
    ];

    const lastNames = [
      "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
      "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    ];

    const grades = ["9", "10", "11", "12"];
    const sections = ["A", "B", "C", "D"];

    for (let i = 0; i < 100; i++) {
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", `student${String(i + 1).padStart(3, "0")}`))
        .first();

      if (!existingStudent) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;

        // Create user first
        const userId = await ctx.db.insert("users", {
          name: fullName,
          email: `student${String(i + 1).padStart(3, "0")}@example.com`,
          role: "student",
        });

        // Create student profile
        const studentId = await ctx.db.insert("students", {
          userId,
          fullName,
          studentId: `student${String(i + 1).padStart(3, "0")}`,
          grade: grades[Math.floor(Math.random() * grades.length)],
          section: sections[Math.floor(Math.random() * sections.length)],
          currentGPA: Math.random() * 4.0,
          assignmentCompletionRate: Math.floor(Math.random() * 100),
          testScoreAverage: Math.floor(Math.random() * 100),
          attendanceRate: Math.floor(Math.random() * 100),
          totalAbsences: Math.floor(Math.random() * 20),
          tardinessCount: Math.floor(Math.random() * 10),
          loginFrequency: Math.floor(Math.random() * 10),
          classParticipationScore: Math.floor(Math.random() * 100),
          challengeCompletionRate: Math.floor(Math.random() * 100),
          hasScholarship: Math.random() > 0.7,
          feePaymentStatus: ["current", "delayed", "overdue"][Math.floor(Math.random() * 3)],
          xp: Math.floor(Math.random() * 10000),
          level: Math.floor(Math.random() * 10) + 1,
          currentStreak: Math.floor(Math.random() * 30),
          longestStreak: Math.floor(Math.random() * 60),
          badges: [],
        });

        // Create risk assessment
        const riskScore = Math.random() * 100;
        const riskLevel = riskScore > 70 ? "high" : riskScore > 40 ? "moderate" : "low";

        await ctx.db.insert("riskAssessments", {
          studentId,
          riskLevel,
          riskScore,
          academicRisk: Math.random() * 100,
          attendanceRisk: Math.random() * 100,
          engagementRisk: Math.random() * 100,
          financialRisk: Math.random() * 100,
          socialRisk: Math.random() * 100,
          recommendations: [
            "Increase study time",
            "Attend tutoring sessions",
            "Improve attendance",
            "Engage in class activities",
          ],
          predictedDropoutProbability: riskScore,
          trendDirection: ["improving", "stable", "declining"][Math.floor(Math.random() * 3)],
        });
      }
    }

    return {
      message: "Database seeded successfully",
      teachers: 10,
      students: 100,
    };
  },
});
