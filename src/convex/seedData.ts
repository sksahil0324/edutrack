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

    const grades = ["1", "2", "3"];
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
          currentCGPA: Math.random() * 10.0,
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

export const createDemoAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    const demoAccounts = {
      students: [
        { email: "student1@demo.com", name: "Alice Johnson", studentId: "DEMO001", grade: "2", section: "A" },
        { email: "student2@demo.com", name: "Bob Smith", studentId: "DEMO002", grade: "3", section: "B" },
        { email: "student3@demo.com", name: "Carol Davis", studentId: "DEMO003", grade: "4", section: "A" },
      ],
      teachers: [
        { email: "teacher1@demo.com", name: "Dr. Emma Wilson", teacherId: "TEACH001", department: "Mathematics", subjects: ["Algebra", "Calculus"] },
        { email: "teacher2@demo.com", name: "Prof. John Martinez", teacherId: "TEACH002", department: "Science", subjects: ["Physics", "Chemistry"] },
      ],
    };

    const createdAccounts: any = { students: [], teachers: [] };

    // Create student demo accounts
    for (const student of demoAccounts.students) {
      // Check if already exists
      const existingStudent = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", student.studentId))
        .first();

      if (!existingStudent) {
        const userId = await ctx.db.insert("users", {
          name: student.name,
          email: student.email,
          role: "student",
        });

        const studentId = await ctx.db.insert("students", {
          userId,
          fullName: student.name,
          studentId: student.studentId,
          grade: student.grade,
          section: student.section,
          currentCGPA: 8.5,
          assignmentCompletionRate: 85,
          testScoreAverage: 82,
          attendanceRate: 92,
          totalAbsences: 3,
          tardinessCount: 2,
          loginFrequency: 6,
          classParticipationScore: 80,
          challengeCompletionRate: 70,
          hasScholarship: false,
          feePaymentStatus: "current",
          xp: 2500,
          level: 3,
          currentStreak: 7,
          longestStreak: 15,
          badges: ["First Login", "Week Warrior"],
        });

        // Create risk assessment
        await ctx.db.insert("riskAssessments", {
          studentId,
          riskLevel: "low",
          riskScore: 25,
          academicRisk: 20,
          attendanceRisk: 15,
          engagementRisk: 30,
          financialRisk: 10,
          socialRisk: 25,
          recommendations: ["Keep up the good work", "Continue regular attendance"],
          predictedDropoutProbability: 25,
          trendDirection: "stable",
        });

        createdAccounts.students.push({ email: student.email, studentId: student.studentId });
      }
    }

    // Create teacher demo accounts
    for (const teacher of demoAccounts.teachers) {
      const existingTeacher = await ctx.db
        .query("teachers")
        .withIndex("by_teacher_id", (q) => q.eq("teacherId", teacher.teacherId))
        .first();

      if (!existingTeacher) {
        const userId = await ctx.db.insert("users", {
          name: teacher.name,
          email: teacher.email,
          role: "teacher",
        });

        await ctx.db.insert("teachers", {
          userId,
          fullName: teacher.name,
          teacherId: teacher.teacherId,
          department: teacher.department,
          subjects: teacher.subjects,
          xp: 5000,
          level: 5,
          interventionsCompleted: 12,
          successfulInterventions: 10,
        });

        createdAccounts.teachers.push({ email: teacher.email, teacherId: teacher.teacherId });
      }
    }

    return {
      message: "Demo accounts created successfully",
      credentials: {
        students: [
          { email: "student1@demo.com", studentId: "DEMO001", name: "Alice Johnson" },
          { email: "student2@demo.com", studentId: "DEMO002", name: "Bob Smith" },
          { email: "student3@demo.com", studentId: "DEMO003", name: "Carol Davis" },
        ],
        teachers: [
          { email: "teacher1@demo.com", teacherId: "TEACH001", name: "Dr. Emma Wilson" },
          { email: "teacher2@demo.com", teacherId: "TEACH002", name: "Prof. John Martinez" },
        ],
        instructions: "Use the email addresses to log in via email OTP. Check your email for the verification code.",
      },
    };
  },
});