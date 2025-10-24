import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get interventions for student
export const getForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interventions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});

// Get interventions by teacher
export const getByTeacher = query({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interventions")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .order("desc")
      .collect();
  },
});

// Create intervention
export const create = mutation({
  args: {
    studentId: v.id("students"),
    teacherId: v.id("teachers"),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    priority: v.string(),
    dueDate: v.optional(v.number()),
    initialRiskScore: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("interventions", {
      ...args,
      status: "planned",
    });
  },
});

// Update intervention status
export const updateStatus = mutation({
  args: {
    interventionId: v.id("interventions"),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status,
    };
    
    if (args.notes) updates.notes = args.notes;
    if (args.status === "completed") updates.completedDate = Date.now();
    
    await ctx.db.patch(args.interventionId, updates);
  },
});

// Complete intervention with effectiveness
export const complete = mutation({
  args: {
    interventionId: v.id("interventions"),
    finalRiskScore: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const intervention = await ctx.db.get(args.interventionId);
    if (!intervention) throw new Error("Intervention not found");
    
    const improvement = intervention.initialRiskScore - args.finalRiskScore;
    const effectiveness = Math.max(0, Math.min(100, (improvement / intervention.initialRiskScore) * 100));
    
    await ctx.db.patch(args.interventionId, {
      status: "completed",
      completedDate: Date.now(),
      finalRiskScore: args.finalRiskScore,
      effectiveness,
      notes: args.notes,
    });
    
    // Update teacher stats
    const teacher = await ctx.db.get(intervention.teacherId);
    if (teacher) {
      await ctx.db.patch(intervention.teacherId, {
        interventionsCompleted: teacher.interventionsCompleted + 1,
        successfulInterventions: effectiveness > 50 ? teacher.successfulInterventions + 1 : teacher.successfulInterventions,
      });
    }
    
    return effectiveness;
  },
});
