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

    const teacherIds: Array<string> = [];

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
        const teacherId = await ctx.db.insert("teachers", {
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

        teacherIds.push(teacherId);
      } else {
        teacherIds.push(existingTeacher._id);
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

    const studentIds: Array<string> = [];

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

        studentIds.push(studentId);

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
      } else {
        studentIds.push(existingStudent._id);
      }
    }

    // Create interventions for each teacher (10-15 per teacher)
    const interventionTypes = ["mentoring", "tutoring", "counseling", "assignment"];
    const interventionStatuses = ["planned", "in-progress", "completed", "cancelled"];
    const priorities = ["low", "medium", "high"];
    
    const interventionTitles = [
      "One-on-One Tutoring Session",
      "Academic Performance Review",
      "Attendance Improvement Plan",
      "Study Skills Workshop",
      "Parent-Teacher Conference",
      "Peer Mentoring Assignment",
      "Extra Credit Opportunity",
      "Homework Support Session",
      "Test Preparation Workshop",
      "Career Counseling Session",
      "Time Management Training",
      "Group Study Facilitation",
      "Academic Goal Setting",
      "Behavioral Intervention Plan",
      "Learning Style Assessment",
    ];

    let totalInterventions = 0;

    for (const teacherId of teacherIds) {
      const numInterventions = Math.floor(Math.random() * 6) + 10; // 10-15 interventions
      
      for (let i = 0; i < numInterventions; i++) {
        const randomStudent = studentIds[Math.floor(Math.random() * studentIds.length)];
        const status = interventionStatuses[Math.floor(Math.random() * interventionStatuses.length)];
        const initialRiskScore = Math.random() * 100;
        
        const interventionData: any = {
          studentId: randomStudent,
          teacherId: teacherId,
          title: interventionTitles[Math.floor(Math.random() * interventionTitles.length)],
          description: `Intervention to address student performance and engagement issues. Focus on improving academic outcomes and reducing dropout risk.`,
          type: interventionTypes[Math.floor(Math.random() * interventionTypes.length)],
          status: status,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          initialRiskScore: initialRiskScore,
        };

        // Add due date for planned/in-progress
        if (status === "planned" || status === "in-progress") {
          interventionData.dueDate = Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000;
        }

        // Add completion data for completed interventions
        if (status === "completed") {
          const finalRiskScore = Math.max(0, initialRiskScore - Math.random() * 40);
          const improvement = initialRiskScore - finalRiskScore;
          const effectiveness = Math.max(0, Math.min(100, (improvement / initialRiskScore) * 100));
          
          interventionData.completedDate = Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000;
          interventionData.finalRiskScore = finalRiskScore;
          interventionData.effectiveness = effectiveness;
          interventionData.notes = `Intervention completed successfully. Student showed ${effectiveness > 70 ? "significant" : effectiveness > 40 ? "moderate" : "minimal"} improvement.`;
        }

        await ctx.db.insert("interventions", interventionData);
        totalInterventions++;
      }
    }

    return {
      message: "Database seeded successfully",
      teachers: 10,
      students: 100,
      interventions: totalInterventions,
    };
  },
});