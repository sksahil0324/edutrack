/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as challenges from "../challenges.js";
import type * as clearDatabase from "../clearDatabase.js";
import type * as fixStudentGrades from "../fixStudentGrades.js";
import type * as http from "../http.js";
import type * as idAuth from "../idAuth.js";
import type * as initData from "../initData.js";
import type * as interventions from "../interventions.js";
import type * as migrateGPAtoCGPA from "../migrateGPAtoCGPA.js";
import type * as notifications from "../notifications.js";
import type * as recalculateRisks from "../recalculateRisks.js";
import type * as riskAssessments from "../riskAssessments.js";
import type * as seedData from "../seedData.js";
import type * as students from "../students.js";
import type * as teachers from "../teachers.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  challenges: typeof challenges;
  clearDatabase: typeof clearDatabase;
  fixStudentGrades: typeof fixStudentGrades;
  http: typeof http;
  idAuth: typeof idAuth;
  initData: typeof initData;
  interventions: typeof interventions;
  migrateGPAtoCGPA: typeof migrateGPAtoCGPA;
  notifications: typeof notifications;
  recalculateRisks: typeof recalculateRisks;
  riskAssessments: typeof riskAssessments;
  seedData: typeof seedData;
  students: typeof students;
  teachers: typeof teachers;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
