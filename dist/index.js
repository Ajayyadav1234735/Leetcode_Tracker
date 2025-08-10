// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/routes/auth.ts
import { Router } from "express";

// server/services/auth.ts
import bcrypt from "bcrypt";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  // 'student' or 'admin'
  leetcodeUsername: varchar("leetcode_username", { length: 100 }),
  // Only for students
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  leetcodeUsername: text("leetcode_username").notNull().unique(),
  leetcodeProfileLink: text("leetcode_profile_link").notNull(),
  profilePhoto: text("profile_photo"),
  // URL to LeetCode profile photo
  batch: text("batch").notNull().default("2028"),
  // "2027" or "2028"
  createdAt: timestamp("created_at").defaultNow()
});
var dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  totalSolved: integer("total_solved").notNull().default(0),
  easySolved: integer("easy_solved").notNull().default(0),
  mediumSolved: integer("medium_solved").notNull().default(0),
  hardSolved: integer("hard_solved").notNull().default(0),
  dailyIncrement: integer("daily_increment").notNull().default(0),
  ranking: integer("ranking").default(0),
  acceptanceRate: integer("acceptance_rate").default(0),
  // Stored as percentage * 100
  totalSubmissions: integer("total_submissions").default(0),
  totalAccepted: integer("total_accepted").default(0),
  languageStats: jsonb("language_stats").default({}),
  // Store language-wise submission counts
  createdAt: timestamp("created_at").defaultNow()
});
var weeklyTrends = pgTable("weekly_trends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  weekStart: text("week_start").notNull(),
  // YYYY-MM-DD format
  weekEnd: text("week_end").notNull(),
  totalProblems: integer("total_problems").notNull().default(0),
  weeklyIncrement: integer("weekly_increment").notNull().default(0),
  ranking: integer("ranking").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  badgeType: text("badge_type").notNull(),
  // streak_master, century_coder, comeback_coder, weekly_topper
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earnedAt: timestamp("earned_at").defaultNow()
});
var appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastSyncTime: timestamp("last_sync_time"),
  isAutoSyncEnabled: boolean("is_auto_sync_enabled").default(true)
});
var weeklyProgressData = pgTable("weekly_progress_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  week1Score: integer("week1_score").default(0),
  week2Score: integer("week2_score").default(0),
  week3Score: integer("week3_score").default(0),
  week4Score: integer("week4_score").default(0),
  week5Score: integer("week5_score").default(0),
  currentWeekScore: integer("current_week_score").default(0),
  // Latest week score from CSV
  lastWeekToCurrentIncrement: integer("last_week_to_current_increment").default(0),
  // New increment column
  week2Progress: integer("week2_progress").default(0),
  // W2 - W1
  week3Progress: integer("week3_progress").default(0),
  // W3 - W2
  week4Progress: integer("week4_progress").default(0),
  // W4 - W3
  week5Progress: integer("week5_progress").default(0),
  // W5 - W4
  totalScore: integer("total_score").default(0),
  averageWeeklyGrowth: integer("average_weekly_growth").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var leetcodeRealTimeData = pgTable("leetcode_realtime_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => students.id).notNull(),
  submissionCalendar: text("submission_calendar").notNull().default("{}"),
  // JSON string from LeetCode
  currentStreak: integer("current_streak").notNull().default(0),
  maxStreak: integer("max_streak").notNull().default(0),
  totalActiveDays: integer("total_active_days").notNull().default(0),
  yearlyActivity: jsonb("yearly_activity").notNull().default([]),
  // Array of {date, count}
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true
}).extend({
  batch: z.enum(["2027", "2028"]).default("2028")
});
var insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
  createdAt: true
});
var insertWeeklyTrendSchema = createInsertSchema(weeklyTrends).omit({
  id: true,
  createdAt: true
});
var insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  earnedAt: true
});
var insertWeeklyProgressDataSchema = createInsertSchema(weeklyProgressData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertLeetcodeRealTimeDataSchema = createInsertSchema(leetcodeRealTimeData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in environment variables");
}
var databaseUrl = process.env.DATABASE_URL.trim();
if (databaseUrl.startsWith("psql '")) {
  databaseUrl = databaseUrl.substring(6);
}
if (databaseUrl.endsWith("'")) {
  databaseUrl = databaseUrl.slice(0, -1);
}
console.log("Connecting to database...");
var sql2 = neon(databaseUrl);
var db = drizzle(sql2);

// server/storage.ts
import { eq, desc, sql as sql3, and } from "drizzle-orm";
var PostgreSQLStorage = class {
  // Users
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
  // Students
  async getStudent(id) {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }
  async getStudentByUsername(username) {
    const result = await db.select().from(students).where(eq(students.leetcodeUsername, username)).limit(1);
    return result[0];
  }
  async getAllStudents() {
    return await db.select().from(students);
  }
  async createStudent(insertStudent) {
    const result = await db.insert(students).values(insertStudent).returning();
    return result[0];
  }
  async updateStudent(id, updates) {
    const result = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return result[0];
  }
  async deleteStudent(id) {
    try {
      await db.delete(badges).where(eq(badges.studentId, id));
      await db.delete(weeklyTrends).where(eq(weeklyTrends.studentId, id));
      await db.delete(dailyProgress).where(eq(dailyProgress.studentId, id));
      await db.delete(leetcodeRealTimeData).where(eq(leetcodeRealTimeData.studentId, id));
      await db.delete(weeklyProgressData).where(eq(weeklyProgressData.studentId, id));
      const result = await db.delete(students).where(eq(students.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting student:", error);
      return false;
    }
  }
  async deleteStudentByUsername(username) {
    try {
      const student = await this.getStudentByUsername(username);
      if (!student) return false;
      return await this.deleteStudent(student.id);
    } catch (error) {
      console.error("Error deleting student by username:", error);
      return false;
    }
  }
  // Daily Progress
  async getDailyProgress(studentId, date) {
    const result = await db.select().from(dailyProgress).where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date))).limit(1);
    return result[0];
  }
  async getStudentDailyProgress(studentId, days = 30) {
    return await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, studentId)).orderBy(desc(dailyProgress.date)).limit(days);
  }
  async createDailyProgress(insertProgress) {
    const result = await db.insert(dailyProgress).values(insertProgress).returning();
    return result[0];
  }
  async updateDailyProgress(studentId, date, updates) {
    const result = await db.update(dailyProgress).set(updates).where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date))).returning();
    return result[0];
  }
  // Weekly Trends
  async getWeeklyTrends(studentId, weeks = 12) {
    return await db.select().from(weeklyTrends).where(eq(weeklyTrends.studentId, studentId)).orderBy(desc(weeklyTrends.weekStart)).limit(weeks);
  }
  async createWeeklyTrend(insertTrend) {
    const result = await db.insert(weeklyTrends).values(insertTrend).returning();
    return result[0];
  }
  async getCurrentWeekTrend(studentId) {
    const now = /* @__PURE__ */ new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekStart = startOfWeek.toISOString().split("T")[0];
    const result = await db.select().from(weeklyTrends).where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart))).limit(1);
    return result[0];
  }
  async deleteWeeklyTrend(studentId, weekStart) {
    try {
      await db.delete(weeklyTrends).where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart)));
      return true;
    } catch (error) {
      console.error("Error deleting weekly trend:", error);
      return false;
    }
  }
  async deleteDailyProgress(studentId, date) {
    try {
      await db.delete(dailyProgress).where(and(eq(dailyProgress.studentId, studentId), eq(dailyProgress.date, date)));
      return true;
    } catch (error) {
      console.error("Error deleting daily progress:", error);
      return false;
    }
  }
  // Badges
  async getStudentBadges(studentId) {
    return await db.select().from(badges).where(eq(badges.studentId, studentId)).orderBy(desc(badges.earnedAt));
  }
  async createBadge(insertBadge) {
    const result = await db.insert(badges).values(insertBadge).returning();
    return result[0];
  }
  async getBadgeByType(studentId, badgeType) {
    const result = await db.select().from(badges).where(and(eq(badges.studentId, studentId), eq(badges.badgeType, badgeType))).limit(1);
    return result[0];
  }
  async getAllBadgesData() {
    const allBadges = await db.select({
      id: badges.id,
      studentId: badges.studentId,
      badgeType: badges.badgeType,
      title: badges.title,
      description: badges.description,
      icon: badges.icon,
      earnedAt: badges.earnedAt,
      studentName: students.name,
      studentUsername: students.leetcodeUsername
    }).from(badges).innerJoin(students, eq(badges.studentId, students.id)).orderBy(desc(badges.earnedAt));
    const badgesWithStudents = allBadges.map((badge) => ({
      id: badge.id,
      studentId: badge.studentId,
      badgeType: badge.badgeType,
      title: badge.title,
      description: badge.description,
      icon: badge.icon,
      earnedAt: badge.earnedAt,
      student: {
        id: badge.studentId,
        name: badge.studentName,
        leetcodeUsername: badge.studentUsername
      }
    }));
    const totalBadges = allBadges.length;
    const uniqueRecipients = new Set(allBadges.map((b) => b.studentId)).size;
    const badgeTypeCounts = allBadges.reduce((counts, badge) => {
      counts[badge.badgeType] = (counts[badge.badgeType] || 0) + 1;
      return counts;
    }, {});
    const mostPopularBadge = Object.keys(badgeTypeCounts).reduce(
      (a, b) => badgeTypeCounts[a] > badgeTypeCounts[b] ? a : b,
      Object.keys(badgeTypeCounts)[0] || ""
    );
    const recentBadges = badgesWithStudents.slice(0, 10);
    return {
      allBadges: badgesWithStudents,
      badgeStats: {
        totalBadges,
        totalRecipients: uniqueRecipients,
        mostPopularBadge,
        recentBadges
      }
    };
  }
  // App Settings
  async getAppSettings() {
    const result = await db.select().from(appSettings).limit(1);
    return result[0];
  }
  async updateAppSettings(updates) {
    const existing = await this.getAppSettings();
    if (existing) {
      const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, existing.id)).returning();
      return result[0];
    } else {
      const result = await db.insert(appSettings).values(updates).returning();
      return result[0];
    }
  }
  // Dashboard methods
  async getStudentDashboard(studentId) {
    const student = await this.getStudent(studentId);
    if (!student) return void 0;
    const [dailyProgress2, badges2, weeklyTrends2, realTimeData] = await Promise.all([
      this.getStudentDailyProgress(studentId, 30),
      this.getStudentBadges(studentId),
      this.getWeeklyTrends(studentId, 12),
      this.getLeetcodeRealTimeData(studentId)
    ]);
    const latestProgress = dailyProgress2[0];
    const stats = latestProgress ? {
      totalSolved: latestProgress.totalSolved,
      easySolved: latestProgress.easySolved,
      mediumSolved: latestProgress.mediumSolved,
      hardSolved: latestProgress.hardSolved,
      acceptanceRate: latestProgress.acceptanceRate || 0,
      ranking: latestProgress.ranking || 0,
      totalSubmissions: latestProgress.totalSubmissions || 0,
      totalAccepted: latestProgress.totalAccepted || 0,
      languageStats: latestProgress.languageStats || {}
    } : {
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      acceptanceRate: 0,
      ranking: 0,
      totalSubmissions: 0,
      totalAccepted: 0,
      languageStats: {}
    };
    const currentStreak = realTimeData?.currentStreak ?? this.calculateStreakFromProgress(dailyProgress2);
    const maxStreak = realTimeData?.maxStreak ?? await this.calculateMaxStreak(studentId);
    const totalActiveDays = realTimeData?.totalActiveDays ?? await this.calculateTotalActiveDays(studentId);
    const yearlyActivity = realTimeData?.yearlyActivity ? realTimeData.yearlyActivity : (await this.getStudentDailyProgress(studentId, 365)).map((p) => ({
      date: p.date,
      count: p.dailyIncrement
    }));
    const rankings = await this.calculateStudentRankings(studentId, stats.totalSolved);
    return {
      student,
      stats,
      currentStreak,
      maxStreak,
      totalActiveDays,
      weeklyRank: 1,
      batchRank: rankings.batchRank,
      universityRank: rankings.universityRank,
      batchSize: rankings.batchSize,
      universitySize: rankings.universitySize,
      badges: badges2,
      weeklyProgress: weeklyTrends2.map((t) => t.weeklyIncrement),
      dailyActivity: dailyProgress2.map((p) => ({
        date: p.date,
        count: p.dailyIncrement
      })),
      yearlyActivity
    };
  }
  async getAdminDashboard() {
    const students2 = await this.getAllStudents();
    const totalStudents = students2.length;
    const studentsWithStats = await Promise.all(
      students2.map(async (student) => {
        const [latestProgressResult, weeklyProgressResult, recentProgressResult] = await Promise.all([
          db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(1),
          db.select().from(weeklyProgressData).where(eq(weeklyProgressData.studentId, student.id)).limit(1),
          db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(7)
          // Get last 7 days for streak calculation
        ]);
        const latestProgress = latestProgressResult[0];
        const weeklyProgress = weeklyProgressResult[0];
        const stats = latestProgress ? {
          totalSolved: latestProgress.totalSolved,
          easySolved: latestProgress.easySolved,
          mediumSolved: latestProgress.mediumSolved,
          hardSolved: latestProgress.hardSolved,
          acceptanceRate: latestProgress.acceptanceRate || 0,
          ranking: latestProgress.ranking || 0,
          totalSubmissions: latestProgress.totalSubmissions || 0,
          totalAccepted: latestProgress.totalAccepted || 0,
          languageStats: latestProgress.languageStats || {}
        } : {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          acceptanceRate: 0,
          ranking: 0,
          totalSubmissions: 0,
          totalAccepted: 0,
          languageStats: {}
        };
        const currentWeeklyProgress = weeklyProgress ? (latestProgress?.totalSolved || 0) - (weeklyProgress.week4Score || 0) : 0;
        const streak = this.calculateStreakFromProgress(recentProgressResult);
        let status = "inactive";
        if (stats.totalSolved > 0) {
          if (currentWeeklyProgress >= 35) {
            status = "Excellent";
          } else if (currentWeeklyProgress >= 25) {
            status = "Good";
          } else if (currentWeeklyProgress >= 15) {
            status = "Active";
          } else {
            status = "Underperforming";
          }
        }
        const realTimeData = await this.getLeetcodeRealTimeData(student.id);
        const maxStreak = realTimeData?.maxStreak ?? await this.calculateMaxStreak(student.id);
        const totalActiveDays = realTimeData?.totalActiveDays ?? await this.calculateTotalActiveDays(student.id);
        const currentStreak = realTimeData?.currentStreak ?? this.calculateStreakFromProgress(recentProgressResult);
        return {
          ...student,
          stats,
          weeklyProgress: Math.max(0, currentWeeklyProgress),
          streak: currentStreak,
          maxStreak,
          totalActiveDays,
          status
        };
      })
    );
    const activeStudents = studentsWithStats.filter((s) => s.status !== "inactive").length;
    const avgProblems = studentsWithStats.reduce((sum, s) => sum + s.stats.totalSolved, 0) / totalStudents;
    const underperforming = studentsWithStats.filter((s) => s.stats.totalSolved < avgProblems * 0.7).length;
    const maxStreakOverall = Math.max(...studentsWithStats.map((s) => s.maxStreak), 0);
    const avgMaxStreak = studentsWithStats.reduce((sum, s) => sum + s.maxStreak, 0) / totalStudents;
    const leaderboard = studentsWithStats.sort((a, b) => b.stats.totalSolved - a.stats.totalSolved).slice(0, 10).map((student, index) => ({
      rank: index + 1,
      student: {
        id: student.id,
        name: student.name,
        leetcodeUsername: student.leetcodeUsername,
        leetcodeProfileLink: student.leetcodeProfileLink,
        profilePhoto: student.profilePhoto,
        batch: student.batch,
        createdAt: student.createdAt
      },
      weeklyScore: student.stats.totalSolved
    }));
    return {
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      maxStreakOverall,
      avgMaxStreak,
      students: studentsWithStats,
      leaderboard
    };
  }
  async getLeaderboard() {
    const students2 = await this.getAllStudents();
    const allWeeklyProgressData = await this.getAllWeeklyProgressData();
    const studentsWithScores = students2.map((student) => {
      const weeklyProgress = allWeeklyProgressData.find((wp) => wp.studentId === student.id);
      let weeklyScore = 0;
      if (weeklyProgress) {
        const week1 = weeklyProgress.week1Score || 0;
        const week2 = weeklyProgress.week2Score || 0;
        const week3 = weeklyProgress.week3Score || 0;
        const week4 = weeklyProgress.week4Score || 0;
        if (week4 > 0 && week3 > 0) {
          weeklyScore = Math.max(0, week4 - week3);
        } else if (week3 > 0 && week2 > 0) {
          weeklyScore = Math.max(0, week3 - week2);
        } else if (week2 > 0 && week1 > 0) {
          weeklyScore = Math.max(0, week2 - week1);
        } else {
          weeklyScore = week1;
        }
      }
      return {
        student,
        weeklyScore
      };
    });
    return studentsWithScores.sort((a, b) => b.weeklyScore - a.weeklyScore).map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  }
  // Helper methods
  async hasStudentEarnedBadge(studentId, badgeType) {
    const badge = await this.getBadgeByType(studentId, badgeType);
    return badge !== void 0;
  }
  async calculateStreak(studentId) {
    const progress = await this.getStudentDailyProgress(studentId, 30);
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
  async getWeeklyTrend(studentId, weekStart) {
    const result = await db.select().from(weeklyTrends).where(and(eq(weeklyTrends.studentId, studentId), eq(weeklyTrends.weekStart, weekStart))).limit(1);
    return result[0];
  }
  async getLatestDailyProgress(studentId) {
    const result = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, studentId)).orderBy(desc(dailyProgress.date)).limit(1);
    return result[0];
  }
  // Weekly Progress Data methods
  async getWeeklyProgressData(studentId) {
    const result = await db.select().from(weeklyProgressData).where(eq(weeklyProgressData.studentId, studentId)).limit(1);
    return result[0];
  }
  async getAllWeeklyProgressData() {
    return await db.select().from(weeklyProgressData);
  }
  async createWeeklyProgressData(data) {
    const result = await db.insert(weeklyProgressData).values(data).returning();
    return result[0];
  }
  async updateWeeklyProgressData(username, updates) {
    const student = await this.getStudentByUsername(username);
    if (!student) {
      console.log(`Student not found: ${username}`);
      return void 0;
    }
    const result = await db.update(weeklyProgressData).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(weeklyProgressData.studentId, student.id)).returning();
    return result[0];
  }
  async deleteWeeklyProgressData(studentId) {
    const result = await db.delete(weeklyProgressData).where(eq(weeklyProgressData.studentId, studentId));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // LeetCode Real-time Data methods
  async getLeetcodeRealTimeData(studentId) {
    const result = await db.select().from(leetcodeRealTimeData).where(eq(leetcodeRealTimeData.studentId, studentId)).limit(1);
    return result[0];
  }
  async createLeetcodeRealTimeData(data) {
    const result = await db.insert(leetcodeRealTimeData).values(data).returning();
    return result[0];
  }
  async updateLeetcodeRealTimeData(studentId, updates) {
    const result = await db.update(leetcodeRealTimeData).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leetcodeRealTimeData.studentId, studentId)).returning();
    return result[0];
  }
  async deleteLeetcodeRealTimeData(studentId) {
    const result = await db.delete(leetcodeRealTimeData).where(eq(leetcodeRealTimeData.studentId, studentId));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Enhanced badge awarding system ensuring minimum 3-4 badges per student
  async awardBadges(studentId) {
    const student = await this.getStudent(studentId);
    if (!student) return;
    const latestProgress = await this.getLatestDailyProgress(studentId);
    if (!latestProgress) return;
    const realTimeData = await this.getLeetcodeRealTimeData(studentId);
    const maxStreak = realTimeData?.maxStreak || await this.calculateMaxStreak(studentId);
    const totalActiveDays = realTimeData?.totalActiveDays || await this.calculateTotalActiveDays(studentId);
    const currentStreak = realTimeData?.currentStreak || await this.calculateStreak(studentId);
    const badgesToAward = [];
    const recentProgress = await this.getStudentDailyProgress(studentId, 30);
    const weeklyProgress = recentProgress.slice(0, 7);
    const weeklyTotal = weeklyProgress.reduce((sum, p) => sum + p.dailyIncrement, 0);
    if (latestProgress.totalSolved >= 1 && !await this.hasStudentEarnedBadge(studentId, "first_solver")) {
      badgesToAward.push({
        type: "first_solver",
        title: "\u{1F31F} First Solver",
        description: "Solved your first problem",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (totalActiveDays >= 1 && !await this.hasStudentEarnedBadge(studentId, "active_learner")) {
      badgesToAward.push({
        type: "active_learner",
        title: "\u{1F4DA} Active Learner",
        description: "Actively practicing problems",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.easySolved >= 1 && !await this.hasStudentEarnedBadge(studentId, "easy_starter")) {
      badgesToAward.push({
        type: "easy_starter",
        title: "\u{1F7E2} Easy Starter",
        description: "Started with easy problems",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.totalSolved >= 10 && !await this.hasStudentEarnedBadge(studentId, "problem_explorer")) {
      badgesToAward.push({
        type: "problem_explorer",
        title: "\u{1F5FA}\uFE0F Problem Explorer",
        description: "10+ problems solved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.totalSolved >= 25 && !await this.hasStudentEarnedBadge(studentId, "steady_solver")) {
      badgesToAward.push({
        type: "steady_solver",
        title: "\u2696\uFE0F Steady Solver",
        description: "25+ problems solved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.totalSolved >= 50 && !await this.hasStudentEarnedBadge(studentId, "half_century")) {
      badgesToAward.push({
        type: "half_century",
        title: "\u{1F3CF} Half Century",
        description: "50+ problems solved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.totalSolved >= 100 && !await this.hasStudentEarnedBadge(studentId, "century_coder")) {
      badgesToAward.push({
        type: "century_coder",
        title: "\u{1F4AF} Century Coder",
        description: "100+ total problems solved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (currentStreak >= 3 && !await this.hasStudentEarnedBadge(studentId, "streak_starter")) {
      badgesToAward.push({
        type: "streak_starter",
        title: "\u{1F525} Streak Starter",
        description: "3-day solving streak",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (currentStreak >= 7 && !await this.hasStudentEarnedBadge(studentId, "streak_master")) {
      badgesToAward.push({
        type: "streak_master",
        title: "\u{1F9D0} Streak Master",
        description: "7-day solving streak",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (maxStreak >= 10 && !await this.hasStudentEarnedBadge(studentId, "streak_legend")) {
      badgesToAward.push({
        type: "streak_legend",
        title: "\u{1F451} Streak Legend",
        description: "Maximum 10+ day streak achieved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (totalActiveDays >= 7 && !await this.hasStudentEarnedBadge(studentId, "weekly_warrior")) {
      badgesToAward.push({
        type: "weekly_warrior",
        title: "\u2694\uFE0F Weekly Warrior",
        description: "7+ active days of problem solving",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (totalActiveDays >= 30 && !await this.hasStudentEarnedBadge(studentId, "monthly_master")) {
      badgesToAward.push({
        type: "monthly_master",
        title: "\u{1F4C5} Monthly Master",
        description: "30+ active days of coding",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.easySolved >= 10 && !await this.hasStudentEarnedBadge(studentId, "easy_champion")) {
      badgesToAward.push({
        type: "easy_champion",
        title: "\u{1F949} Easy Champion",
        description: "10+ easy problems mastered",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.mediumSolved >= 5 && !await this.hasStudentEarnedBadge(studentId, "medium_challenger")) {
      badgesToAward.push({
        type: "medium_challenger",
        title: "\u{1F948} Medium Challenger",
        description: "5+ medium problems solved",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (latestProgress.hardSolved >= 1 && !await this.hasStudentEarnedBadge(studentId, "hard_hero")) {
      badgesToAward.push({
        type: "hard_hero",
        title: "\u{1F947} Hard Hero",
        description: "Conquered a hard problem",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    if (weeklyTotal >= 10 && !await this.hasStudentEarnedBadge(studentId, "weekly_achiever")) {
      badgesToAward.push({
        type: "weekly_achiever",
        title: "\u{1F4C8} Weekly Achiever",
        description: "10+ problems this week",
        earnedDate: /* @__PURE__ */ new Date()
      });
    }
    const currentBadgeCount = await this.getStudentBadges(studentId);
    const totalBadgesAfterAwarding = currentBadgeCount.length + badgesToAward.length;
    if (totalBadgesAfterAwarding < 3) {
      if (!await this.hasStudentEarnedBadge(studentId, "dedicated_student")) {
        badgesToAward.push({
          type: "dedicated_student",
          title: "\u{1F393} Dedicated Student",
          description: "Committed to learning",
          earnedDate: /* @__PURE__ */ new Date()
        });
      }
      if (!await this.hasStudentEarnedBadge(studentId, "coding_enthusiast")) {
        badgesToAward.push({
          type: "coding_enthusiast",
          title: "\u{1F4BB} Coding Enthusiast",
          description: "Passionate about coding",
          earnedDate: /* @__PURE__ */ new Date()
        });
      }
      if (!await this.hasStudentEarnedBadge(studentId, "progress_tracker")) {
        badgesToAward.push({
          type: "progress_tracker",
          title: "\u{1F4CA} Progress Tracker",
          description: "Tracking your coding journey",
          earnedDate: /* @__PURE__ */ new Date()
        });
      }
    }
    for (const badge of badgesToAward) {
      await this.createBadge({
        studentId,
        badgeType: badge.type,
        title: badge.title,
        description: badge.description,
        icon: "fas fa-trophy"
      });
    }
    if (badgesToAward.length > 0) {
      console.log(`Awarded ${badgesToAward.length} badges to student ${student.name}`);
    }
  }
  // Add method to update student profile photo
  async updateStudentProfilePhoto(studentId, profilePhotoUrl) {
    try {
      await db.update(students).set({ profilePhoto: profilePhotoUrl }).where(eq(students.id, studentId));
    } catch (error) {
      console.error("Failed to update student profile photo:", error);
    }
  }
  calculateStreakFromProgress(progress) {
    let streak = 0;
    for (const p of progress) {
      if (p.dailyIncrement > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
  async calculateStudentRankings(studentId, totalSolved) {
    const student = await this.getStudent(studentId);
    if (!student) {
      return { batchRank: 0, universityRank: 0, batchSize: 0, universitySize: 0 };
    }
    const batchStudents = await this.getStudentsByBatch(student.batch);
    const allStudents = await this.getAllStudents();
    const batchStudentsWithProgress = await Promise.all(
      batchStudents.map(async (s) => {
        const latestProgress = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, s.id)).orderBy(desc(dailyProgress.date)).limit(1);
        return {
          student: s,
          totalSolved: latestProgress[0]?.totalSolved || 0
        };
      })
    );
    const allStudentsWithProgress = await Promise.all(
      allStudents.map(async (s) => {
        const latestProgress = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, s.id)).orderBy(desc(dailyProgress.date)).limit(1);
        return {
          student: s,
          totalSolved: latestProgress[0]?.totalSolved || 0
        };
      })
    );
    batchStudentsWithProgress.sort((a, b) => b.totalSolved - a.totalSolved);
    allStudentsWithProgress.sort((a, b) => b.totalSolved - a.totalSolved);
    const batchRank = batchStudentsWithProgress.findIndex((s) => s.student.id === studentId) + 1;
    const universityRank = allStudentsWithProgress.findIndex((s) => s.student.id === studentId) + 1;
    return {
      batchRank: batchRank || batchStudentsWithProgress.length,
      universityRank: universityRank || allStudentsWithProgress.length,
      batchSize: batchStudentsWithProgress.length,
      universitySize: allStudentsWithProgress.length
    };
  }
  async calculateMaxStreak(studentId) {
    const allProgress = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, studentId)).orderBy(desc(dailyProgress.date));
    if (allProgress.length === 0) return 0;
    let maxStreak = 0;
    let currentStreak = 0;
    const reversedProgress = allProgress.reverse();
    for (const progress of reversedProgress) {
      if (progress.dailyIncrement > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }
  async calculateTotalActiveDays(studentId) {
    const result = await db.select({ count: sql3`count(*)` }).from(dailyProgress).where(and(
      eq(dailyProgress.studentId, studentId),
      sql3`${dailyProgress.dailyIncrement} > 0`
    ));
    return result[0]?.count || 0;
  }
  // Batch-specific methods
  async getStudentsByBatch(batch) {
    return await db.select().from(students).where(eq(students.batch, batch));
  }
  async getAllStudentsWithBatch() {
    return await db.select().from(students);
  }
  async getBatchDashboard(batch) {
    const batchStudents = await this.getStudentsByBatch(batch);
    const totalStudents = batchStudents.length;
    if (totalStudents === 0) {
      return {
        batch,
        totalStudents: 0,
        activeStudents: 0,
        avgProblems: 0,
        underperforming: 0,
        maxStreakOverall: 0,
        avgMaxStreak: 0,
        students: [],
        leaderboard: []
      };
    }
    const studentsWithStats = await Promise.all(
      batchStudents.map(async (student) => {
        const latestProgressResult = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(1);
        const latestProgress = latestProgressResult[0];
        const stats = {
          totalSolved: latestProgress?.totalSolved || 0,
          easySolved: latestProgress?.easySolved || 0,
          mediumSolved: latestProgress?.mediumSolved || 0,
          hardSolved: latestProgress?.hardSolved || 0,
          acceptanceRate: latestProgress?.acceptanceRate || 0,
          ranking: latestProgress?.ranking || 0,
          totalSubmissions: latestProgress?.totalSubmissions || 0,
          totalAccepted: latestProgress?.totalAccepted || 0,
          languageStats: latestProgress?.languageStats || {}
        };
        const oneWeekAgo = /* @__PURE__ */ new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];
        const weeklyProgressResult = await db.select().from(dailyProgress).where(and(
          eq(dailyProgress.studentId, student.id),
          sql3`${dailyProgress.date} >= ${oneWeekAgoStr}`
        )).orderBy(dailyProgress.date);
        const currentWeeklyProgress = weeklyProgressResult.length > 0 ? (latestProgress?.totalSolved || 0) - (weeklyProgressResult[0]?.totalSolved || 0) : 0;
        const recentProgressResult = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(30);
        const status = this.calculateStatus(stats.totalSolved, currentWeeklyProgress);
        const realTimeData = await this.getLeetcodeRealTimeData(student.id);
        let maxStreak = 0;
        let totalActiveDays = 0;
        let currentStreak = 0;
        if (realTimeData) {
          maxStreak = realTimeData.maxStreak || 0;
          totalActiveDays = realTimeData.totalActiveDays || 0;
          currentStreak = realTimeData.currentStreak || 0;
        }
        if (maxStreak === 0) {
          maxStreak = await this.calculateMaxStreak(student.id);
        }
        if (totalActiveDays === 0) {
          totalActiveDays = await this.calculateTotalActiveDays(student.id);
        }
        if (currentStreak === 0) {
          currentStreak = this.calculateStreakFromProgress(recentProgressResult);
        }
        return {
          ...student,
          stats,
          weeklyProgress: Math.max(0, currentWeeklyProgress),
          streak: currentStreak,
          maxStreak,
          totalActiveDays,
          status
        };
      })
    );
    const activeStudents = studentsWithStats.filter((s) => s.status !== "inactive").length;
    const avgProblems = studentsWithStats.reduce((sum, s) => sum + s.stats.totalSolved, 0) / totalStudents;
    const underperforming = studentsWithStats.filter((s) => s.stats.totalSolved < avgProblems * 0.7).length;
    const maxStreakOverall = Math.max(...studentsWithStats.map((s) => s.maxStreak), 0);
    const avgMaxStreak = studentsWithStats.reduce((sum, s) => sum + s.maxStreak, 0) / totalStudents;
    const leaderboard = studentsWithStats.sort((a, b) => b.stats.totalSolved - a.stats.totalSolved).slice(0, 10).map((student, index) => ({
      rank: index + 1,
      student: {
        id: student.id,
        name: student.name,
        leetcodeUsername: student.leetcodeUsername,
        leetcodeProfileLink: student.leetcodeProfileLink,
        profilePhoto: student.profilePhoto,
        batch: student.batch,
        createdAt: student.createdAt
      },
      weeklyScore: student.stats.totalSolved
    }));
    return {
      batch,
      totalStudents,
      activeStudents,
      avgProblems,
      underperforming,
      maxStreakOverall,
      avgMaxStreak,
      students: studentsWithStats,
      leaderboard
    };
  }
  async getBatchLeaderboard(batch) {
    const batchStudents = await this.getStudentsByBatch(batch);
    const studentsWithScores = await Promise.all(
      batchStudents.map(async (student) => {
        const latestProgressResult = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(1);
        const latestProgress = latestProgressResult[0];
        return {
          student,
          weeklyScore: latestProgress?.totalSolved || 0
          // Using weeklyScore field to store total solved
        };
      })
    );
    return studentsWithScores.sort((a, b) => b.weeklyScore - a.weeklyScore).map((item, index) => ({
      rank: index + 1,
      ...item
    }));
  }
  async getUniversityLeaderboard() {
    const allStudents = await this.getAllStudents();
    const studentsWithScores = await Promise.all(
      allStudents.map(async (student) => {
        const latestProgressResult = await db.select().from(dailyProgress).where(eq(dailyProgress.studentId, student.id)).orderBy(desc(dailyProgress.date)).limit(1);
        const latestProgress = latestProgressResult[0];
        return {
          student,
          weeklyScore: latestProgress?.totalSolved || 0,
          // Using weeklyScore to match interface
          batch: student.batch
        };
      })
    );
    return studentsWithScores.sort((a, b) => b.weeklyScore - a.weeklyScore).map((item, index) => ({
      rank: index + 1,
      student: {
        id: item.student.id,
        name: item.student.name,
        leetcodeUsername: item.student.leetcodeUsername,
        createdAt: item.student.createdAt,
        leetcodeProfileLink: item.student.leetcodeProfileLink,
        profilePhoto: item.student.profilePhoto,
        batch: item.student.batch
      },
      weeklyScore: item.weeklyScore,
      batch: item.batch
    }));
  }
  async getUniversityDashboard() {
    const [batch2027Data, batch2028Data] = await Promise.all([
      this.getBatchDashboard("2027"),
      this.getBatchDashboard("2028")
    ]);
    const universityLeaderboard = await this.getUniversityLeaderboard();
    const combined = {
      totalStudents: batch2027Data.totalStudents + batch2028Data.totalStudents,
      activeStudents: batch2027Data.activeStudents + batch2028Data.activeStudents,
      avgProblems: (batch2027Data.avgProblems * batch2027Data.totalStudents + batch2028Data.avgProblems * batch2028Data.totalStudents) / (batch2027Data.totalStudents + batch2028Data.totalStudents) || 0,
      underperforming: batch2027Data.underperforming + batch2028Data.underperforming,
      maxStreakOverall: Math.max(batch2027Data.maxStreakOverall, batch2028Data.maxStreakOverall),
      avgMaxStreak: (batch2027Data.avgMaxStreak * batch2027Data.totalStudents + batch2028Data.avgMaxStreak * batch2028Data.totalStudents) / (batch2027Data.totalStudents + batch2028Data.totalStudents) || 0,
      universityLeaderboard: universityLeaderboard.slice(0, 20)
      // Top 20 university-wide
    };
    return {
      batch2027: batch2027Data,
      batch2028: batch2028Data,
      combined
    };
  }
  calculateStatus(totalSolved, weeklyProgress) {
    if (totalSolved >= 100 && weeklyProgress >= 15) return "Excellent";
    if (totalSolved >= 50 && weeklyProgress >= 10) return "Good";
    if (weeklyProgress >= 5) return "Active";
    return "Underperforming";
  }
  // New method to get students with zero questions solved
  async getStudentsWithZeroQuestions() {
    const allStudents = await this.getAllStudents();
    const studentsWithZero = [];
    for (const student of allStudents) {
      const latestProgress = await this.getLatestDailyProgress(student.id);
      if (!latestProgress || latestProgress.totalSolved === 0) {
        studentsWithZero.push(student);
      }
    }
    return studentsWithZero;
  }
  // New method to remove students with zero questions solved
  async removeStudentsWithZeroQuestions() {
    const studentsWithZero = await this.getStudentsWithZeroQuestions();
    const removedStudents = [];
    for (const student of studentsWithZero) {
      const success = await this.deleteStudent(student.id);
      if (success) {
        removedStudents.push(student.name);
      }
    }
    return {
      removedCount: removedStudents.length,
      removedStudents
    };
  }
  // New CSV import method for weekly progress data
  async importWeeklyProgressFromCSVData(csvData) {
    const stats = { imported: 0, updated: 0, errors: [] };
    for (const record of csvData) {
      try {
        let student = await this.getStudentByUsername(record.leetcodeUsername);
        if (!student) {
          const allStudents = await this.getAllStudents();
          student = allStudents.find(
            (s) => s.name.toLowerCase().trim() === record.name.toLowerCase().trim()
          );
        }
        if (!student) {
          stats.errors.push(`Student not found: ${record.name} (${record.leetcodeUsername})`);
          continue;
        }
        const existingData = await this.getWeeklyProgressData(student.id);
        if (existingData) {
          const lastWeekScore = existingData.week4Score || 0;
          const increment = record.currentWeekScore - lastWeekScore;
          await this.updateWeeklyProgressData(student.id, {
            currentWeekScore: record.currentWeekScore,
            lastWeekToCurrentIncrement: increment,
            updatedAt: /* @__PURE__ */ new Date()
          });
          stats.updated++;
        } else {
          await this.createWeeklyProgressData({
            studentId: student.id,
            currentWeekScore: record.currentWeekScore,
            lastWeekToCurrentIncrement: record.currentWeekScore,
            // First time, so increment equals current score
            week1Score: 0,
            week2Score: 0,
            week3Score: 0,
            week4Score: 0,
            week2Progress: 0,
            week3Progress: 0,
            week4Progress: 0,
            totalScore: record.currentWeekScore,
            averageWeeklyGrowth: 0
          });
          stats.imported++;
        }
      } catch (error) {
        stats.errors.push(`Error processing ${record.name}: ${error}`);
      }
    }
    return stats;
  }
};
var storage = new PostgreSQLStorage();

// server/middleware/auth.ts
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
}
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
}
function requireAdminOrOwnData(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role === "admin") {
    return next();
  }
  const requestedUsername = req.params.username;
  if (req.user.role === "student" && req.user.leetcodeUsername === requestedUsername) {
    return next();
  }
  return res.status(403).json({ error: "Access denied" });
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// server/services/auth.ts
var AuthService = class {
  static SALT_ROUNDS = 10;
  static async hashPassword(password) {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
  static async registerUser(data) {
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      throw new Error("Username already exists");
    }
    if (data.role === "student" && data.leetcodeUsername) {
      const existingStudent = await storage.getStudentByUsername(data.leetcodeUsername);
      if (!existingStudent) {
        throw new Error("LeetCode username not found in our student database");
      }
    }
    const hashedPassword = await this.hashPassword(data.password);
    const user = await storage.createUser({
      username: data.username,
      password: hashedPassword,
      role: data.role,
      leetcodeUsername: data.leetcodeUsername
    });
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      leetcodeUsername: user.leetcodeUsername || void 0
    };
    const token = generateToken(tokenPayload);
    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        leetcodeUsername: user.leetcodeUsername
      },
      token
    };
  }
  static async loginUser(data) {
    if (data.username === "admin" && data.password === "leetpeer") {
      const tokenPayload2 = {
        userId: "admin-id",
        username: "admin",
        role: "admin"
      };
      const token2 = generateToken(tokenPayload2);
      return {
        user: {
          id: "admin-id",
          username: "admin",
          role: "admin"
        },
        token: token2
      };
    }
    const user = await storage.getUserByUsername(data.username);
    if (!user) {
      throw new Error("Invalid username or password");
    }
    const isPasswordValid = await this.comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      leetcodeUsername: user.leetcodeUsername || void 0
    };
    const token = generateToken(tokenPayload);
    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        leetcodeUsername: user.leetcodeUsername
      },
      token
    };
  }
};

// server/routes/auth.ts
var authRouter = Router();
authRouter.post("/register", async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const result = await AuthService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error instanceof Error ? error.message : "Login failed" });
  }
});
authRouter.get("/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      leetcodeUsername: req.user.leetcodeUsername
    }
  });
});
authRouter.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
var auth_default = authRouter;

// server/services/leetcode.ts
var LeetCodeService = class {
  GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";
  /**
   * Parse LeetCode's submission calendar JSON to calculate streaks and activity data
   */
  parseSubmissionCalendar(calendarJson) {
    try {
      const calendar = JSON.parse(calendarJson);
      const activityData = [];
      for (const [timestampStr, count] of Object.entries(calendar)) {
        const timestamp2 = parseInt(timestampStr);
        const date = new Date(timestamp2 * 1e3);
        const dateStr = date.toISOString().split("T")[0];
        activityData.push({
          date: dateStr,
          count,
          timestamp: timestamp2
        });
      }
      activityData.sort((a, b) => a.timestamp - b.timestamp);
      const today = /* @__PURE__ */ new Date();
      today.setHours(23, 59, 59, 999);
      const sortedByDateDesc = [...activityData].sort((a, b) => b.timestamp - a.timestamp);
      let currentStreak = 0;
      const todayStr = today.toISOString().split("T")[0];
      let checkDateStr = todayStr;
      let checkDate = new Date(todayStr);
      const activityMap = /* @__PURE__ */ new Map();
      activityData.forEach((activity) => {
        activityMap.set(activity.date, activity.count);
      });
      while (true) {
        const count = activityMap.get(checkDateStr) || 0;
        if (count > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
          checkDateStr = checkDate.toISOString().split("T")[0];
        } else {
          break;
        }
      }
      let maxStreak = 0;
      let tempStreak = 0;
      const sortedByDate = [...activityData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let previousDate = null;
      for (const activity of sortedByDate) {
        if (activity.count > 0) {
          const currentDate2 = new Date(activity.date);
          if (previousDate === null) {
            tempStreak = 1;
          } else {
            const daysDiff = Math.floor((currentDate2.getTime() - previousDate.getTime()) / (1e3 * 60 * 60 * 24));
            if (daysDiff === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          maxStreak = Math.max(maxStreak, tempStreak);
          previousDate = currentDate2;
        }
      }
      const totalActiveDays = activityData.filter((activity) => activity.count > 0).length;
      const oneYearAgo = /* @__PURE__ */ new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const yearlyActivity = [];
      const currentDate = new Date(oneYearAgo);
      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split("T")[0];
        yearlyActivity.push({
          date: dateStr,
          count: activityMap.get(dateStr) || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return {
        currentStreak,
        maxStreak,
        totalActiveDays,
        yearlyActivity
      };
    } catch (error) {
      console.error("Error parsing submission calendar:", error);
      return {
        currentStreak: 0,
        maxStreak: 0,
        totalActiveDays: 0,
        yearlyActivity: []
      };
    }
  }
  USER_PROFILE_QUERY = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          aboutMe
          school
          websites
          countryName
          company
          jobTitle
          skillTags
          postViewCount
          postViewCountDiff
          reputation
          reputationDiff
          solutionCount
          solutionCountDiff
          categoryDiscussCount
          categoryDiscussCountDiff
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        languageProblemCount {
          languageName
          problemsSolved
        }
        submissionCalendar
        problemsSolvedBeatsStats {
          difficulty
          percentage
        }
      }
    }
  `;
  async fetchUserStats(username) {
    try {
      const response = await fetch(this.GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: JSON.stringify({
          query: this.USER_PROFILE_QUERY,
          variables: { username }
        })
      });
      if (!response.ok) {
        console.error(`LeetCode API error for ${username}: ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (!data.data?.matchedUser) {
        console.error(`User not found: ${username}`);
        return null;
      }
      const acSubmissions = data.data.matchedUser.submitStats.acSubmissionNum;
      const totalSubmissions = data.data.matchedUser.submitStats.totalSubmissionNum;
      const languageStats = data.data.matchedUser.languageProblemCount || [];
      const totalSolved = acSubmissions.find((stat) => stat.difficulty === "All")?.count || 0;
      const easySolved = acSubmissions.find((stat) => stat.difficulty === "Easy")?.count || 0;
      const mediumSolved = acSubmissions.find((stat) => stat.difficulty === "Medium")?.count || 0;
      const hardSolved = acSubmissions.find((stat) => stat.difficulty === "Hard")?.count || 0;
      const totalSubmissionCount = totalSubmissions.find((stat) => stat.difficulty === "All")?.submissions || 0;
      const totalAcceptedCount = acSubmissions.find((stat) => stat.difficulty === "All")?.submissions || 0;
      const acceptanceRate = totalSubmissionCount > 0 ? totalAcceptedCount / totalSubmissionCount * 100 : 0;
      const ranking = data.data.matchedUser.profile?.ranking || 0;
      const profilePhoto = data.data.matchedUser.profile?.userAvatar || void 0;
      const languageStatsObj = languageStats.reduce((acc, lang) => {
        acc[lang.languageName] = lang.problemsSolved;
        return acc;
      }, {});
      const submissionCalendar = data.data.matchedUser.submissionCalendar || "{}";
      const { currentStreak, maxStreak, totalActiveDays, yearlyActivity } = this.parseSubmissionCalendar(submissionCalendar);
      return {
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        ranking,
        totalSubmissions: totalSubmissionCount,
        totalAccepted: totalAcceptedCount,
        languageStats: languageStatsObj,
        submissionCalendar,
        currentStreak,
        maxStreak,
        totalActiveDays,
        yearlyActivity,
        profilePhoto
      };
    } catch (error) {
      console.error(`Error fetching LeetCode data for ${username}:`, error);
      return null;
    }
  }
  async syncStudentData(studentId) {
    try {
      const student = await storage.getStudent(studentId);
      if (!student) return false;
      const stats = await this.fetchUserStats(student.leetcodeUsername);
      if (!stats) return false;
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const existingProgress = await storage.getDailyProgress(studentId, today);
      let dailyIncrement = 0;
      if (existingProgress) {
        dailyIncrement = stats.totalSolved - existingProgress.totalSolved;
        await storage.updateDailyProgress(studentId, today, {
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
          ranking: stats.ranking,
          acceptanceRate: Math.round(stats.acceptanceRate * 100),
          // Store as integer percentage * 100
          totalSubmissions: stats.totalSubmissions,
          totalAccepted: stats.totalAccepted,
          languageStats: stats.languageStats
        });
      } else {
        const yesterday = /* @__PURE__ */ new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const yesterdayProgress = await storage.getDailyProgress(studentId, yesterdayStr);
        dailyIncrement = yesterdayProgress ? stats.totalSolved - yesterdayProgress.totalSolved : stats.totalSolved;
        await storage.createDailyProgress({
          studentId,
          date: today,
          totalSolved: stats.totalSolved,
          easySolved: stats.easySolved,
          mediumSolved: stats.mediumSolved,
          hardSolved: stats.hardSolved,
          dailyIncrement,
          ranking: stats.ranking,
          acceptanceRate: Math.round(stats.acceptanceRate * 100),
          // Store as integer percentage * 100
          totalSubmissions: stats.totalSubmissions,
          totalAccepted: stats.totalAccepted,
          languageStats: stats.languageStats
        });
      }
      await this.updateWeeklyTrend(studentId, stats.totalSolved);
      await this.checkBadgeAchievements(studentId, stats, dailyIncrement);
      if (stats.profilePhoto && stats.profilePhoto !== student.profilePhoto) {
        await storage.updateStudent(studentId, { profilePhoto: stats.profilePhoto });
      }
      const existingRealTimeData = await storage.getLeetcodeRealTimeData(studentId);
      const realTimeDataToStore = {
        studentId,
        submissionCalendar: stats.submissionCalendar,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        totalActiveDays: stats.totalActiveDays,
        yearlyActivity: JSON.stringify(stats.yearlyActivity),
        profilePhoto: stats.profilePhoto || null
      };
      if (existingRealTimeData) {
        await storage.updateLeetcodeRealTimeData(studentId, realTimeDataToStore);
      } else {
        await storage.createLeetcodeRealTimeData(realTimeDataToStore);
      }
      await storage.awardBadges(studentId);
      return true;
    } catch (error) {
      console.error(`Error syncing student data for ${studentId}:`, error);
      return false;
    }
  }
  async syncAllStudents() {
    const students2 = await storage.getAllStudents();
    const results = await Promise.allSettled(
      students2.map((student) => this.syncStudentData(student.id))
    );
    const success = results.filter((result) => result.status === "fulfilled" && result.value).length;
    const failed = results.length - success;
    await storage.updateAppSettings({
      lastSyncTime: /* @__PURE__ */ new Date()
    });
    return { success, failed };
  }
  async syncAllProfilePhotos() {
    const students2 = await storage.getAllStudents();
    const results = await Promise.allSettled(
      students2.map(async (student) => {
        try {
          const stats = await this.fetchUserStats(student.leetcodeUsername);
          if (stats?.profilePhoto && stats.profilePhoto !== student.profilePhoto) {
            await storage.updateStudent(student.id, { profilePhoto: stats.profilePhoto });
            return true;
          }
          return true;
        } catch (error) {
          console.error(`Error updating profile photo for ${student.leetcodeUsername}:`, error);
          return false;
        }
      })
    );
    const success = results.filter((result) => result.status === "fulfilled" && result.value).length;
    const failed = results.length - success;
    return { success, failed };
  }
  async updateWeeklyTrend(studentId, totalSolved) {
    const now = /* @__PURE__ */ new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    const existingTrend = await storage.getCurrentWeekTrend(studentId);
    if (existingTrend) {
      const weeklyIncrement = totalSolved - (existingTrend.totalProblems - existingTrend.weeklyIncrement);
    } else {
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekTrends = await storage.getWeeklyTrends(studentId, 1);
      const lastWeekTotal = lastWeekTrends.length > 0 ? lastWeekTrends[0].totalProblems : 0;
      const weeklyIncrement = totalSolved - lastWeekTotal;
      await storage.createWeeklyTrend({
        studentId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        totalProblems: totalSolved,
        weeklyIncrement,
        ranking: 0
        // Will be calculated later
      });
    }
  }
  async checkBadgeAchievements(studentId, stats, dailyIncrement) {
    if (stats.totalSolved >= 100) {
      const hasCenturyBadge = await storage.hasStudentEarnedBadge(studentId, "century_coder");
      if (!hasCenturyBadge) {
        await storage.createBadge({
          studentId,
          badgeType: "century_coder",
          title: "\u{1F4AF} Century Coder",
          description: "100+ total problems solved",
          icon: "fas fa-code"
        });
      }
    }
    const streak = await storage.calculateStreak(studentId);
    if (streak >= 7) {
      const hasStreakBadge = await storage.hasStudentEarnedBadge(studentId, "streak_master");
      if (!hasStreakBadge) {
        await storage.createBadge({
          studentId,
          badgeType: "streak_master",
          title: "\u{1F9D0} Streak Master",
          description: "7-day streak of 5+ daily problems",
          icon: "fas fa-fire"
        });
      }
    }
    const weeklyTrends2 = await storage.getWeeklyTrends(studentId, 2);
    if (weeklyTrends2.length >= 2) {
      const thisWeek = weeklyTrends2[0];
      const lastWeek = weeklyTrends2[1];
      const weeklyImprovement = thisWeek.weeklyIncrement - lastWeek.weeklyIncrement;
      if (weeklyImprovement >= 15) {
        const hasComebackBadge = await storage.hasStudentEarnedBadge(studentId, "comeback_coder");
        if (!hasComebackBadge) {
          await storage.createBadge({
            studentId,
            badgeType: "comeback_coder",
            title: "\u{1F525} Comeback Coder",
            description: "Big week-over-week improvement",
            icon: "fas fa-chart-line"
          });
        }
      }
    }
    const dailyProgress2 = await storage.getStudentDailyProgress(studentId, 30);
    const activeDays = dailyProgress2.filter((p) => p.dailyIncrement > 0).length;
    if (activeDays >= 30) {
      const hasConsistencyBadge = await storage.hasStudentEarnedBadge(studentId, "consistency_champ");
      if (!hasConsistencyBadge) {
        await storage.createBadge({
          studentId,
          badgeType: "consistency_champ",
          title: "\u{1F9F1} Consistency Champ",
          description: "Completed 30-day challenge",
          icon: "fas fa-calendar-check"
        });
      }
    }
    await this.checkWeeklyTopperBadge(studentId);
  }
  async checkWeeklyTopperBadge(studentId) {
    const currentWeekTrend = await storage.getCurrentWeekTrend(studentId);
    if (currentWeekTrend && currentWeekTrend.ranking === 1) {
      const hasWeeklyTopperBadge = await storage.hasStudentEarnedBadge(studentId, "weekly_topper");
      if (!hasWeeklyTopperBadge) {
        await storage.createBadge({
          studentId,
          badgeType: "weekly_topper",
          title: "\u{1F3C6} Weekly Topper",
          description: "Top performer this week",
          icon: "fas fa-trophy"
        });
      }
    }
  }
};
var leetCodeService = new LeetCodeService();

// server/services/scheduler.ts
var SchedulerService = class {
  intervalId = null;
  startDailySync() {
    this.runDailySync();
    this.intervalId = setInterval(() => {
      this.runDailySync();
    }, 24 * 60 * 60 * 1e3);
    console.log("Daily sync scheduler started");
  }
  stopDailySync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Daily sync scheduler stopped");
    }
  }
  async runDailySync() {
    console.log("Starting daily sync at:", (/* @__PURE__ */ new Date()).toISOString());
    try {
      const result = await leetCodeService.syncAllStudents();
      console.log(`Daily sync completed - Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
      console.error("Daily sync failed:", error);
    }
  }
  async manualSync() {
    console.log("Starting manual sync at:", (/* @__PURE__ */ new Date()).toISOString());
    return await leetCodeService.syncAllStudents();
  }
};
var schedulerService = new SchedulerService();

// server/services/csv-import.ts
import fs from "fs/promises";
var CSVImportService = class {
  /**
   * Parse CSV content and extract student data
   */
  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  /**
   * Clean and parse numeric values from CSV
   */
  parseNumber(value) {
    if (!value || value === "#VALUE!" || value === "Went home" || value === "Leave") {
      return 0;
    }
    const cleaned = value.replace(/["',]/g, "");
    if (cleaned.includes("~") || cleaned.includes("+")) {
      return parseInt(cleaned.replace(/[~+]/g, "")) || 0;
    }
    const num = parseInt(cleaned) || 0;
    return isNaN(num) ? 0 : num;
  }
  /**
   * Parse rank improvement string
   */
  parseRankImprovement(value) {
    if (!value || value === "#VALUE!" || value === "0") {
      return 0;
    }
    const cleaned = value.replace(/["',]/g, "");
    return parseInt(cleaned) || 0;
  }
  /**
   * Import student data from CSV file
   */
  async importFromCSV(csvFilePath) {
    try {
      const csvContent = await fs.readFile(csvFilePath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);
      let imported = 0;
      let skipped = 0;
      const errors = [];
      for (const line of dataLines) {
        try {
          const fields = this.parseCSVLine(line);
          if (fields.length < 10 || !fields[0] || !fields[1] || !fields[2]) {
            skipped++;
            continue;
          }
          const studentData = {
            id: fields[0],
            name: fields[1],
            leetcodeUsername: fields[2],
            leetcodeProfileLink: fields[3],
            week1Solved: this.parseNumber(fields[4]),
            week1Rank: fields[5] || "5,000,000",
            week2Solved: this.parseNumber(fields[6]),
            week2Rank: fields[7] || "5,000,000",
            week2Increment: this.parseNumber(fields[8]),
            week2RankImprovement: fields[9] || "0",
            week3Solved: this.parseNumber(fields[10]),
            week3Rank: fields[11] || "5,000,000",
            week3Increment: this.parseNumber(fields[12]),
            week4Solved: this.parseNumber(fields[14]),
            week5Solved: this.parseNumber(fields[16])
          };
          await this.createOrUpdateStudent(studentData);
          imported++;
        } catch (error) {
          const errorMsg = `Error processing student at line ${dataLines.indexOf(line) + 2}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      return { imported, skipped, errors };
    } catch (error) {
      throw new Error(`Failed to import CSV: ${error}`);
    }
  }
  /**
   * Create or update student with historical data
   */
  async createOrUpdateStudent(data) {
    try {
      const existingStudents = await storage.getAllStudents();
      let student = existingStudents.find((s) => s.leetcodeUsername === data.leetcodeUsername);
      if (!student) {
        student = await storage.createStudent({
          name: data.name,
          leetcodeUsername: data.leetcodeUsername,
          leetcodeProfileLink: data.leetcodeProfileLink
        });
      }
      const currentDate = /* @__PURE__ */ new Date();
      const weeks = [
        {
          weekStart: this.getWeekStart(currentDate, 3),
          // 3 weeks ago (Week 1)
          weekEnd: this.getWeekEnd(currentDate, 3),
          totalProblems: data.week1Solved,
          weeklyIncrement: data.week1Solved,
          ranking: this.parseRankToNumber(data.week1Rank)
        },
        {
          weekStart: this.getWeekStart(currentDate, 2),
          // 2 weeks ago (Week 2) 
          weekEnd: this.getWeekEnd(currentDate, 2),
          totalProblems: data.week2Solved,
          weeklyIncrement: data.week2Increment,
          ranking: this.parseRankToNumber(data.week2Rank)
        },
        {
          weekStart: this.getWeekStart(currentDate, 1),
          // 1 week ago (Week 3)
          weekEnd: this.getWeekEnd(currentDate, 1),
          totalProblems: data.week3Solved,
          weeklyIncrement: data.week3Increment,
          ranking: this.parseRankToNumber(data.week3Rank)
        }
      ];
      for (const week of weeks) {
        const existingTrends = await storage.getWeeklyTrends(student.id, 1);
        const existingTrend = existingTrends.find((t) => t.weekStart === week.weekStart);
        if (!existingTrend) {
          await storage.createWeeklyTrend({
            studentId: student.id,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            totalProblems: week.totalProblems,
            weeklyIncrement: week.weeklyIncrement,
            ranking: week.ranking
          });
        }
      }
      for (let weekOffset = 3; weekOffset >= 1; weekOffset--) {
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(weekStartDate.getDate() - weekOffset * 7);
        const weekData = weeks[3 - weekOffset];
        for (let day = 0; day < 7; day++) {
          const date = new Date(weekStartDate);
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split("T")[0];
          const existingProgress = await storage.getDailyProgress(student.id, dateStr);
          if (!existingProgress) {
            const dailyIncrement = day === 6 ? weekData.weeklyIncrement : Math.floor(weekData.weeklyIncrement / 7);
            const totalSolved = weekData.totalProblems - weekData.weeklyIncrement + dailyIncrement * (day + 1);
            await storage.createDailyProgress({
              studentId: student.id,
              date: dateStr,
              totalSolved: Math.max(0, totalSolved),
              easySolved: Math.floor(totalSolved * 0.5),
              mediumSolved: Math.floor(totalSolved * 0.35),
              hardSolved: Math.floor(totalSolved * 0.15),
              dailyIncrement
            });
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to create/update student ${data.name}: ${error}`);
    }
  }
  /**
   * Parse rank string to number
   */
  parseRankToNumber(rankStr) {
    if (!rankStr || rankStr === "#VALUE!") return 5e6;
    const cleaned = rankStr.replace(/["',]/g, "");
    if (cleaned.includes("~") || cleaned.includes("+")) {
      return parseInt(cleaned.replace(/[~+]/g, "")) || 5e6;
    }
    return parseInt(cleaned) || 5e6;
  }
  /**
   * Get week start date (Monday) for given offset
   */
  getWeekStart(currentDate, weeksAgo) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - weeksAgo * 7);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().split("T")[0];
  }
  /**
   * Get week end date (Sunday) for given offset
   */
  getWeekEnd(currentDate, weeksAgo) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - weeksAgo * 7);
    const day = date.getDay();
    const diff = date.getDate() - day + 7;
    date.setDate(diff);
    return date.toISOString().split("T")[0];
  }
  /**
   * Get analytics data combining historical and current data
   */
  async getAnalyticsData() {
    const students2 = await storage.getAllStudents();
    const analyticsData = [];
    for (const student of students2) {
      const weeklyTrends2 = await storage.getWeeklyTrends(student.id, 4);
      const recentProgress = await storage.getStudentDailyProgress(student.id, 1);
      const currentProgress = recentProgress[0];
      const week3Data = weeklyTrends2.find((w) => w.weekStart === this.getWeekStart(/* @__PURE__ */ new Date(), 1));
      const currentSolved = currentProgress?.totalSolved || 0;
      const week3Solved = week3Data?.totalProblems || 0;
      const improvement = currentSolved - week3Solved;
      const improvementPercent = week3Solved > 0 ? (improvement / week3Solved * 100).toFixed(1) : "0.0";
      analyticsData.push({
        student,
        weeklyTrends: weeklyTrends2.reverse(),
        // Chronological order
        currentSolved,
        week3Solved,
        improvement,
        improvementPercent: parseFloat(improvementPercent),
        status: improvement > 0 ? "improved" : improvement < 0 ? "declined" : "same"
      });
    }
    return analyticsData;
  }
  /**
   * Import updated student data from the new CSV format
   */
  async importUpdatedCSV(csvFilePath) {
    try {
      const csvContent = await fs.readFile(csvFilePath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const dataLines = lines.slice(1);
      let updated = 0;
      let created = 0;
      let skipped = 0;
      const errors = [];
      for (const line of dataLines) {
        try {
          const fields = this.parseCSVLine(line);
          if (fields.length < 6 || !fields[1] || !fields[2]) {
            skipped++;
            continue;
          }
          const studentData = {
            name: fields[1],
            // Name
            leetcodeUsername: fields[2],
            // LeetCode Username
            leetcodeProfileLink: fields[3],
            // LeetcodeProfileLink
            week1Solved: this.parseNumber(fields[4]),
            // WEEK1
            week2Solved: this.parseNumber(fields[5]),
            // WEEK2
            week3Solved: this.parseNumber(fields[6])
            // WEEK3
          };
          if (studentData.leetcodeUsername.toLowerCase().includes("leave") || studentData.leetcodeUsername === "" || studentData.name.toLowerCase().includes("leave")) {
            skipped++;
            continue;
          }
          const wasCreated = await this.createOrUpdateStudentFromUpdated(studentData);
          if (wasCreated) {
            created++;
          } else {
            updated++;
          }
        } catch (error) {
          const errorMsg = `Error processing student at line ${dataLines.indexOf(line) + 2}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      return { updated, created, skipped, errors };
    } catch (error) {
      throw new Error(`Failed to import updated CSV: ${error}`);
    }
  }
  /**
   * Create or update student with updated weekly data
   */
  async createOrUpdateStudentFromUpdated(data) {
    try {
      const existingStudents = await storage.getAllStudents();
      let student = existingStudents.find((s) => s.leetcodeUsername === data.leetcodeUsername);
      let wasCreated = false;
      if (!student) {
        student = await storage.createStudent({
          name: data.name,
          leetcodeUsername: data.leetcodeUsername,
          leetcodeProfileLink: data.leetcodeProfileLink
        });
        wasCreated = true;
      }
      const currentDate = /* @__PURE__ */ new Date();
      const weeks = [
        {
          weekStart: this.getWeekStart(currentDate, 3),
          // 3 weeks ago (Week 1)
          weekEnd: this.getWeekEnd(currentDate, 3),
          totalProblems: data.week1Solved,
          weeklyIncrement: data.week1Solved,
          ranking: 5e6
        },
        {
          weekStart: this.getWeekStart(currentDate, 2),
          // 2 weeks ago (Week 2) 
          weekEnd: this.getWeekEnd(currentDate, 2),
          totalProblems: data.week2Solved,
          weeklyIncrement: Math.max(0, data.week2Solved - data.week1Solved),
          ranking: 5e6
        },
        {
          weekStart: this.getWeekStart(currentDate, 1),
          // 1 week ago (Week 3)
          weekEnd: this.getWeekEnd(currentDate, 1),
          totalProblems: data.week3Solved,
          weeklyIncrement: Math.max(0, data.week3Solved - data.week2Solved),
          ranking: 5e6
        }
      ];
      for (const week of weeks) {
        await this.deleteWeeklyTrend(student.id, week.weekStart);
        await storage.createWeeklyTrend({
          studentId: student.id,
          weekStart: week.weekStart,
          weekEnd: week.weekEnd,
          totalProblems: week.totalProblems,
          weeklyIncrement: week.weeklyIncrement,
          ranking: week.ranking
        });
      }
      for (let weekOffset = 3; weekOffset >= 1; weekOffset--) {
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(weekStartDate.getDate() - weekOffset * 7);
        const weekData = weeks[3 - weekOffset];
        for (let day = 0; day < 7; day++) {
          const date = new Date(weekStartDate);
          date.setDate(date.getDate() + day);
          const dateStr = date.toISOString().split("T")[0];
          await this.deleteDailyProgress(student.id, dateStr);
          const dailyIncrement = day === 6 ? weekData.weeklyIncrement : Math.floor(weekData.weeklyIncrement / 7);
          const totalSolved = weekData.totalProblems - weekData.weeklyIncrement + dailyIncrement * (day + 1);
          await storage.createDailyProgress({
            studentId: student.id,
            date: dateStr,
            totalSolved: Math.max(0, totalSolved),
            easySolved: Math.floor(totalSolved * 0.5),
            mediumSolved: Math.floor(totalSolved * 0.35),
            hardSolved: Math.floor(totalSolved * 0.15),
            dailyIncrement: Math.max(0, dailyIncrement)
          });
        }
      }
      return wasCreated;
    } catch (error) {
      throw new Error(`Failed to create/update student ${data.name}: ${error}`);
    }
  }
  /**
   * Delete weekly trend for specific student and week
   */
  async deleteWeeklyTrend(studentId, weekStart) {
    try {
      await storage.deleteWeeklyTrend(studentId, weekStart);
    } catch (error) {
      console.error("Error deleting weekly trend:", error);
    }
  }
  /**
   * Delete daily progress for specific student and date
   */
  async deleteDailyProgress(studentId, date) {
    try {
      await storage.deleteDailyProgress(studentId, date);
    } catch (error) {
      console.error("Error deleting daily progress:", error);
    }
  }
};
var csvImportService = new CSVImportService();

// server/services/weekly-progress-import.ts
import fs2 from "fs/promises";
var WeeklyProgressImportService = class {
  async importWeeklyProgressFromCSV(csvFilePath) {
    const stats = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
    try {
      const csvContent = await fs2.readFile(csvFilePath, "utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      if (lines.length === 0) {
        throw new Error("CSV file is empty");
      }
      const dataLines = lines.slice(1);
      console.log(`Processing ${dataLines.length} students from weekly progress CSV...`);
      for (const line of dataLines) {
        try {
          const record = this.parseCSVLine(line);
          await this.processStudentWeeklyProgress(record, stats);
        } catch (error) {
          const errorMsg = `Error processing line: ${error}`;
          console.error(errorMsg);
          stats.errors.push(errorMsg);
        }
      }
      console.log(`Weekly progress import completed: ${stats.imported} imported, ${stats.updated} updated, ${stats.skipped} skipped`);
      return stats;
    } catch (error) {
      console.error("Error importing weekly progress CSV:", error);
      throw new Error(`Failed to import weekly progress CSV: ${error}`);
    }
  }
  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }
  async processStudentWeeklyProgress(record, stats) {
    if (record.length < 8) {
      stats.skipped++;
      return;
    }
    const [name, leetcodeUsername, profileLink, week1Str, week2Str, week3Str, week4Str, week5Str] = record;
    if (!leetcodeUsername?.trim()) {
      stats.skipped++;
      return;
    }
    if (!leetcodeUsername) {
      stats.skipped++;
      return;
    }
    let student = await storage.getStudentByUsername(leetcodeUsername);
    if (!student) {
      const allStudents = await storage.getAllStudents();
      student = allStudents.find(
        (s) => s.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (!student) {
        const cleanUsername = leetcodeUsername.toLowerCase().replace(/[-_]/g, "");
        student = allStudents.find((s) => {
          const cleanDbUsername = s.leetcodeUsername.toLowerCase().replace(/[-_]/g, "");
          return cleanDbUsername.includes(cleanUsername) || cleanUsername.includes(cleanDbUsername) || // Check for partial matches without separators
          cleanDbUsername.startsWith(cleanUsername) || cleanUsername.startsWith(cleanDbUsername);
        });
      }
    }
    if (!student) {
      console.log(`Creating new student: ${name} (${leetcodeUsername})`);
      try {
        student = await storage.createStudent({
          name: name.trim(),
          leetcodeUsername: leetcodeUsername.trim(),
          leetcodeProfileLink: profileLink.trim(),
          batch: "2027"
          // Default batch for new students created via CSV import
        });
      } catch (error) {
        stats.errors.push(`Failed to create student ${name}: ${error}`);
        stats.skipped++;
        return;
      }
    }
    const week1Score = this.parseScore(week1Str);
    const week2Score = this.parseScore(week2Str);
    const week3Score = this.parseScore(week3Str);
    const week4Score = this.parseScore(week4Str);
    const week5Score = this.parseScore(week5Str);
    const week2Progress = week2Score - week1Score;
    const week3Progress = week3Score - week2Score;
    const week4Progress = week4Score - week3Score;
    const week5Progress = week5Score - week4Score;
    const totalScore = week1Score + week2Score + week3Score + week4Score + week5Score;
    const validWeeks = [week2Progress, week3Progress, week4Progress, week5Progress].filter((p) => !isNaN(p));
    const averageWeeklyGrowth = validWeeks.length > 0 ? Math.round(validWeeks.reduce((sum, p) => sum + p, 0) / validWeeks.length) : 0;
    const weeklyProgressData2 = {
      studentId: student.id,
      week1Score,
      week2Score,
      week3Score,
      week4Score,
      week5Score,
      week2Progress,
      week3Progress,
      week4Progress,
      week5Progress,
      totalScore,
      averageWeeklyGrowth
    };
    const existingData = await storage.getWeeklyProgressData(student.id);
    if (existingData) {
      await storage.updateWeeklyProgressData(student.id, weeklyProgressData2);
      stats.updated++;
    } else {
      await storage.createWeeklyProgressData(weeklyProgressData2);
      stats.imported++;
    }
  }
  parseScore(scoreStr) {
    if (!scoreStr || scoreStr.trim() === "") {
      return 0;
    }
    const parsed = parseInt(scoreStr.trim(), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  // Helper method to get enhanced weekly progress data with student details and real-time data
  async getEnhancedWeeklyProgressData() {
    const allProgressData = await storage.getAllWeeklyProgressData();
    const allStudents = await storage.getAllStudents();
    const enhancedData = await Promise.all(
      allProgressData.map(async (progressData) => {
        const student = allStudents.find((s) => s.id === progressData.studentId);
        if (!student) return null;
        const latestProgress = await storage.getLatestDailyProgress(student.id);
        const currentSolved = latestProgress?.totalSolved || 0;
        const newIncrement = currentSolved - (progressData.week5Score || progressData.week4Score || 0);
        return {
          student: {
            name: student.name,
            leetcodeUsername: student.leetcodeUsername,
            leetcodeProfileLink: student.leetcodeProfileLink
          },
          weeklyData: {
            week1: progressData.week1Score,
            week2: progressData.week2Score,
            week3: progressData.week3Score,
            week4: progressData.week4Score,
            week5: progressData.week5Score,
            currentWeekScore: progressData.currentWeekScore || progressData.week5Score || 0,
            lastWeekToCurrentIncrement: progressData.lastWeekToCurrentIncrement || progressData.week5Progress || 0
          },
          progressIncrements: {
            week2Progress: progressData.week2Progress,
            week3Progress: progressData.week3Progress,
            week4Progress: progressData.week4Progress,
            week5Progress: progressData.week5Progress
          },
          realTimeData: {
            currentSolved,
            newIncrement,
            lastUpdated: latestProgress?.date || "No data"
          },
          summary: {
            totalScore: progressData.totalScore,
            averageWeeklyGrowth: progressData.averageWeeklyGrowth
          }
        };
      })
    );
    return enhancedData.filter((item) => item !== null);
  }
  // Helper method to get specific student's weekly progress
  async getStudentWeeklyProgress(leetcodeUsername) {
    const student = await storage.getStudentByUsername(leetcodeUsername);
    if (!student) {
      return null;
    }
    const progressData = await storage.getWeeklyProgressData(student.id);
    if (!progressData) {
      return null;
    }
    return {
      student: {
        name: student.name,
        leetcodeUsername: student.leetcodeUsername,
        leetcodeProfileLink: student.leetcodeProfileLink
      },
      weeklyData: {
        week1: progressData.week1Score,
        week2: progressData.week2Score,
        week3: progressData.week3Score,
        week4: progressData.week4Score,
        week5: progressData.week5Score
      },
      progressIncrements: {
        week2Progress: progressData.week2Progress,
        week3Progress: progressData.week3Progress,
        week4Progress: progressData.week4Progress,
        week5Progress: progressData.week5Progress
      },
      summary: {
        totalScore: progressData.totalScore,
        averageWeeklyGrowth: progressData.averageWeeklyGrowth
      }
    };
  }
  // Import weekly progress from CSV data array
  async importFromCSVData(csvData) {
    const stats = { imported: 0, updated: 0, skipped: 0 };
    for (const row of csvData) {
      try {
        const name = row["Name"] || row["name"] || "";
        const leetcodeUsername = row["LeetCode Username"] || row["leetcode_username"] || row["username"] || "";
        const week1Score = this.parseScore(row["WEEK1"] || row["Week 1"] || row["week1"] || "0");
        const week2Score = this.parseScore(row["WEEK2"] || row["Week 2"] || row["week2"] || "0");
        const week3Score = this.parseScore(row["WEEK3"] || row["Week 3"] || row["week3"] || "0");
        const week4Score = this.parseScore(row["WEEK4"] || row["Week 4"] || row["week4"] || "0");
        const week5Score = this.parseScore(row["WEEK5"] || row["Week 5"] || row["week5"] || "0");
        const currentWeekScore = week5Score;
        if (!name || !leetcodeUsername) {
          console.log(`Skipping row: missing name (${name}) or username (${leetcodeUsername})`);
          stats.skipped++;
          continue;
        }
        const student = await storage.getStudentByUsername(leetcodeUsername);
        if (!student) {
          console.log(`Student not found: ${leetcodeUsername}`);
          stats.skipped++;
          continue;
        }
        const week2Progress = week2Score - week1Score;
        const week3Progress = week3Score - week2Score;
        const week4Progress = week4Score - week3Score;
        const week5Progress = week5Score - week4Score;
        const lastWeekToCurrentIncrement = week5Progress;
        const totalScore = week1Score + week2Score + week3Score + week4Score + week5Score;
        const averageWeeklyGrowth = Math.round((week2Progress + week3Progress + week4Progress + week5Progress) / 4 * 100) / 100;
        const weeklyProgressData2 = {
          studentId: student.id,
          week1Score,
          week2Score,
          week3Score,
          week4Score,
          week5Score,
          currentWeekScore,
          lastWeekToCurrentIncrement,
          week2Progress,
          week3Progress,
          week4Progress,
          week5Progress,
          totalScore,
          averageWeeklyGrowth
        };
        const existingData = await storage.getWeeklyProgressData(student.id);
        if (existingData) {
          await storage.updateWeeklyProgressData(student.id, weeklyProgressData2);
          stats.updated++;
        } else {
          await storage.createWeeklyProgressData(weeklyProgressData2);
          stats.imported++;
        }
      } catch (error) {
        console.error(`Error processing row for ${row["Name"] || "unknown"}:`, error);
        stats.skipped++;
      }
    }
    return { stats };
  }
};
var weeklyProgressImportService = new WeeklyProgressImportService();

// server/routes.ts
import path from "path";
import { eq as eq2, and as and2, sql as sql4 } from "drizzle-orm";

// attached_assets/students_1753783623487.json
var students_1753783623487_default = [
  {
    name: "Aaditya Raj",
    leetcodeUsername: "aadi2532",
    leetcodeProfileLink: "https://leetcode.com/u/aadi2532/"
  },
  {
    name: "Abhishek Singh",
    leetcodeUsername: "Abhishek_2008",
    leetcodeProfileLink: "https://leetcode.com/u/Abhishek_2008/"
  },
  {
    name: "Aditya",
    leetcodeUsername: "Aadi_Singh_28",
    leetcodeProfileLink: "https://leetcode.com/u/Aadi_Singh_28/"
  },
  {
    name: "Ajit Yadav",
    leetcodeUsername: "Ajit_Yadav_2908",
    leetcodeProfileLink: "https://leetcode.com/u/Ajit_Yadav_2908/"
  },
  {
    name: "Akanksha",
    leetcodeUsername: "Akanksha_kushwaha_a",
    leetcodeProfileLink: "https://leetcode.com/u/Akanksha_kushwaha_a/"
  },
  {
    name: "Alok Raj",
    leetcodeUsername: "alok-work23",
    leetcodeProfileLink: "https://leetcode.com/u/alok-work23/"
  },
  {
    name: "Aman Verma",
    leetcodeUsername: "aman1640",
    leetcodeProfileLink: "https://leetcode.com/u/aman1640/"
  },
  {
    name: "Aman Singh",
    leetcodeUsername: "Aman_Singh_Sitare",
    leetcodeProfileLink: "https://leetcode.com/u/Aman_Singh_Sitare/"
  },
  {
    name: "Aman Adarsh",
    leetcodeUsername: "amanadarsh1168",
    leetcodeProfileLink: "https://leetcode.com/u/amanadarsh1168/"
  },
  {
    name: "Amit Kumar",
    leetcodeUsername: "Amit_Kumar13",
    leetcodeProfileLink: "https://leetcode.com/u/Amit_Kumar13/"
  },
  {
    name: "Anamika Kumari",
    leetcodeUsername: "tanamika",
    leetcodeProfileLink: "https://leetcode.com/u/tanamika/"
  },
  {
    name: "Anand Singh",
    leetcodeUsername: "of0DUuvBjV",
    leetcodeProfileLink: "https://leetcode.com/u/of0DUuvBjV/"
  },
  {
    name: "Anand Kumar Pandey",
    leetcodeUsername: "Anand_Pandey123",
    leetcodeProfileLink: "https://leetcode.com/u/Anand_Pandey123/"
  },
  {
    name: "Anoop kumar",
    leetcodeUsername: "Anoop_kumar123",
    leetcodeProfileLink: "https://leetcode.com/u/Anoop_kumar123/"
  },
  {
    name: "Anshu Kumar",
    leetcodeUsername: "CodebyAnshu03",
    leetcodeProfileLink: "https://leetcode.com/u/CodebyAnshu03/"
  },
  {
    name: "Anuradha Tiwari",
    leetcodeUsername: "anuradha_24",
    leetcodeProfileLink: "https://leetcode.com/u/anuradha_24/"
  },
  {
    name: "Anushri Mishra",
    leetcodeUsername: "Anushri_Mishra",
    leetcodeProfileLink: "https://leetcode.com/u/Anushri_Mishra/"
  },
  {
    name: "Aradhya patel",
    leetcodeUsername: "aradhya789",
    leetcodeProfileLink: "https://leetcode.com/u/aradhya789/"
  },
  {
    name: "Arjun Kadam",
    leetcodeUsername: "arjunkadampatil",
    leetcodeProfileLink: "https://leetcode.com/u/arjunkadampatil/"
  },
  {
    name: "Arpita Tripathi",
    leetcodeUsername: "Uny60jPJeO",
    leetcodeProfileLink: "https://leetcode.com/u/Uny60jPJeO/"
  },
  {
    name: "Arun kumar",
    leetcodeUsername: "Arun_404notfound",
    leetcodeProfileLink: "https://leetcode.com/u/Arun_404notfound/"
  },
  {
    name: "Aryan Saini",
    leetcodeUsername: "aryan8773",
    leetcodeProfileLink: "https://leetcode.com/u/aryan8773/"
  },
  {
    name: "Ashwin yadav",
    leetcodeUsername: "ashwin-tech",
    leetcodeProfileLink: "https://leetcode.com/u/ashwin-tech/"
  },
  {
    name: "Ayush Kumar",
    leetcodeUsername: "Ayush4Sony",
    leetcodeProfileLink: "https://leetcode.com/u/Ayush4Sony/"
  },
  {
    name: "Ayush Kumar Yadav",
    leetcodeUsername: "Ayush_Yadav_029",
    leetcodeProfileLink: "https://leetcode.com/u/Ayush_Yadav_029/"
  },
  {
    name: "Bhagwati",
    leetcodeUsername: "Bhagwati323",
    leetcodeProfileLink: "https://leetcode.com/u/Bhagwati323/"
  },
  {
    name: "Bhaskar Mahato",
    leetcodeUsername: "bhaskarmahato03",
    leetcodeProfileLink: "https://leetcode.com/u/bhaskarmahato03/"
  },
  {
    name: "Byagari Praveen Kumar",
    leetcodeUsername: "Mr_bpk_4433",
    leetcodeProfileLink: "https://leetcode.com/u/Mr_bpk_4433/"
  },
  {
    name: "Challa Trivedh Kumar",
    leetcodeUsername: "TrivedhChalla",
    leetcodeProfileLink: "https://leetcode.com/u/TrivedhChalla/"
  },
  {
    name: "Chandan Giri",
    leetcodeUsername: "WelcomeGseries",
    leetcodeProfileLink: "https://leetcode.com/u/WelcomeGseries/"
  },
  {
    name: "Chiranjeet Biswas",
    leetcodeUsername: "Chiranjeet_Biswas",
    leetcodeProfileLink: "https://leetcode.com/u/Chiranjeet_Biswas/"
  },
  {
    name: "Debangsu Misra",
    leetcodeUsername: "debangsumisra",
    leetcodeProfileLink: "https://leetcode.com/u/debangsumisra/"
  },
  {
    name: "Deepak Mandal",
    leetcodeUsername: "AlgoMandal",
    leetcodeProfileLink: "https://leetcode.com/u/AlgoMandal/"
  },
  {
    name: "Dilip Vaishnav",
    leetcodeUsername: "Dilip_Vaishnav_07",
    leetcodeProfileLink: "https://leetcode.com/u/Dilip_Vaishnav_07/"
  },
  {
    name: "Dilip Suthar",
    leetcodeUsername: "Dilip0552",
    leetcodeProfileLink: "https://leetcode.com/u/Dilip0552/"
  },
  {
    name: "Disha Sahu",
    leetcodeUsername: "Disha-01-alt",
    leetcodeProfileLink: "https://leetcode.com/u/Disha-01-alt/"
  },
  {
    name: "Divyanshi Sahu",
    leetcodeUsername: "ADHIINSVY13",
    leetcodeProfileLink: "https://leetcode.com/u/ADHIINSVY13/"
  },
  {
    name: "Divyanshi Rathour",
    leetcodeUsername: "Divyanshirathour",
    leetcodeProfileLink: "https://leetcode.com/u/Divyanshirathour/"
  },
  {
    name: "Ekta kumari",
    leetcodeUsername: "EktaSaw1212",
    leetcodeProfileLink: "https://leetcode.com/u/EktaSaw1212/"
  },
  {
    name: "Gaurav Rathore",
    leetcodeUsername: "Gaurav_rathore96",
    leetcodeProfileLink: "https://leetcode.com/u/Gaurav_rathore96/"
  },
  {
    name: "Gaurav kumar",
    leetcodeUsername: "gaurav_vvv",
    leetcodeProfileLink: "https://leetcode.com/u/gaurav_vvv/"
  },
  {
    name: "Gaurav Tiwari",
    leetcodeUsername: "gauravtiwari_70",
    leetcodeProfileLink: "https://leetcode.com/u/gauravtiwari_70/"
  },
  {
    name: "Guman Singh Rajpoot",
    leetcodeUsername: "Guman_singh_rajpoot",
    leetcodeProfileLink: "https://leetcode.com/u/Guman_singh_rajpoot/"
  },
  {
    name: "Harisingh Rajpoot",
    leetcodeUsername: "HarisinghRaj",
    leetcodeProfileLink: "https://leetcode.com/u/HarisinghRaj/"
  },
  {
    name: "Harsh Chourasiya",
    leetcodeUsername: "harshchourasiya295",
    leetcodeProfileLink: "https://leetcode.com/u/harshchourasiya295/"
  },
  {
    name: "Harshit Chaturvedi",
    leetcodeUsername: "thisharshit",
    leetcodeProfileLink: "https://leetcode.com/u/thisharshit/"
  },
  {
    name: "Himanshu kumar",
    leetcodeUsername: "ansraaz86",
    leetcodeProfileLink: "https://leetcode.com/u/ansraaz86/"
  },
  {
    name: "Himanshu Srivastav",
    leetcodeUsername: "codeCrafter777",
    leetcodeProfileLink: "https://leetcode.com/u/codeCrafter777/"
  },
  {
    name: "Himanshu Kanwar Chundawat",
    leetcodeUsername: "himanshu_chundawat",
    leetcodeProfileLink: "https://leetcode.com/u/himanshu_chundawat/"
  },
  {
    name: "Hirak Nath",
    leetcodeUsername: "hirak__",
    leetcodeProfileLink: "https://leetcode.com/u/hirak__/"
  },
  {
    name: "Hiranya Patil",
    leetcodeUsername: "hiranya_patil",
    leetcodeProfileLink: "https://leetcode.com/u/hiranya_patil/"
  },
  {
    name: "Ishant Bhoyar",
    leetcodeUsername: "Ishant_57",
    leetcodeProfileLink: "https://leetcode.com/u/Ishant_57/"
  },
  {
    name: "Jagriti Pandey",
    leetcodeUsername: "jagriti_Pandey01",
    leetcodeProfileLink: "https://leetcode.com/u/jagriti_Pandey01/"
  },
  {
    name: "Jamal Akhtar",
    leetcodeUsername: "kKJ7y7Q9Ks",
    leetcodeProfileLink: "https://leetcode.com/u/kKJ7y7Q9Ks/"
  },
  {
    name: "Janu Chaudhary",
    leetcodeUsername: "Janu_Chaudhary",
    leetcodeProfileLink: "https://leetcode.com/u/Janu_Chaudhary/"
  },
  {
    name: "KARANPAL SINGH RANAWAT",
    leetcodeUsername: "krtechie",
    leetcodeProfileLink: "https://leetcode.com/u/krtechie/"
  },
  {
    name: "khushi Narwariya",
    leetcodeUsername: "khushi_narwariya",
    leetcodeProfileLink: "https://leetcode.com/u/khushi_narwariya/"
  },
  {
    name: "Lakhan Rathore",
    leetcodeUsername: "Lakhan_rathore",
    leetcodeProfileLink: "https://leetcode.com/u/Lakhan_rathore/"
  },
  {
    name: "Maneesh Sakhwar",
    leetcodeUsername: "Maneesh_Sakhwar",
    leetcodeProfileLink: "https://leetcode.com/u/Maneesh_Sakhwar/"
  },
  {
    name: "Mani Kumar",
    leetcodeUsername: "MANIKUMAR7109",
    leetcodeProfileLink: "https://leetcode.com/u/MANIKUMAR7109/"
  },
  {
    name: "Manish Chhaba",
    leetcodeUsername: "Chhaba_Manish",
    leetcodeProfileLink: "https://leetcode.com/u/Chhaba_Manish/"
  },
  {
    name: "Manish Kumar Tiwari",
    leetcodeUsername: "manish__45",
    leetcodeProfileLink: "https://leetcode.com/u/manish__45/"
  },
  {
    name: "Manoj Kharkar",
    leetcodeUsername: "manojk909",
    leetcodeProfileLink: "https://leetcode.com/u/manojk909/"
  },
  {
    name: "Manoj Dewda",
    leetcodeUsername: "Manoj_Dewda022",
    leetcodeProfileLink: "https://leetcode.com/u/Manoj_Dewda022/"
  },
  {
    name: "Mausam kumari",
    leetcodeUsername: "Mausam-kumari",
    leetcodeProfileLink: "https://leetcode.com/u/Mausam-kumari/"
  },
  {
    name: "Mayank Raj",
    leetcodeUsername: "mayankRajRay",
    leetcodeProfileLink: "https://leetcode.com/u/mayankRajRay/"
  },
  {
    name: "Mehtab Alam",
    leetcodeUsername: "alamehtab",
    leetcodeProfileLink: "https://leetcode.com/u/alamehtab/"
  },
  {
    name: "Mohammad Afzal Raza",
    leetcodeUsername: "Afzal_Raza",
    leetcodeProfileLink: "https://leetcode.com/u/Afzal_Raza/"
  },
  {
    name: "MOHD MONIS",
    leetcodeUsername: "codemon-07",
    leetcodeProfileLink: "https://leetcode.com/u/codemon-07/"
  },
  {
    name: "Mohit Sharma",
    leetcodeUsername: "sharma_Mohit_2005",
    leetcodeProfileLink: "https://leetcode.com/u/sharma_Mohit_2005/"
  },
  {
    name: "Moirangthem Joel Singh",
    leetcodeUsername: "JoelMoirangthem",
    leetcodeProfileLink: "https://leetcode.com/u/JoelMoirangthem/"
  },
  {
    name: "Monu Rajpoot",
    leetcodeUsername: "Monurajpoot",
    leetcodeProfileLink: "https://leetcode.com/u/Monurajpoot/"
  },
  {
    name: "N.Arun Kumar",
    leetcodeUsername: "Arunkumar087",
    leetcodeProfileLink: "https://leetcode.com/u/Arunkumar087/"
  },
  {
    name: "Neeraj Parmar",
    leetcodeUsername: "Neeru888",
    leetcodeProfileLink: "https://leetcode.com/u/Neeru888/"
  },
  {
    name: "Nidhi Kumari",
    leetcodeUsername: "Nid_Singh",
    leetcodeProfileLink: "https://leetcode.com/u/Nid_Singh/"
  },
  {
    name: "NIKHIL Chaurasiya",
    leetcodeUsername: "Rdxnikhil",
    leetcodeProfileLink: "https://leetcode.com/u/Rdxnikhil/"
  },
  {
    name: "Nikhil Kumar Mehta",
    leetcodeUsername: "Nikhil_KM_04",
    leetcodeProfileLink: "https://leetcode.com/u/Nikhil_KM_04/"
  },
  {
    name: "Nirmal Kumar",
    leetcodeUsername: "Bardx",
    leetcodeProfileLink: "https://leetcode.com/u/r2GUlBuyLZ/"
  },
  {
    name: "Nirmal Mewada",
    leetcodeUsername: "nirmal_M01",
    leetcodeProfileLink: "https://leetcode.com/u/nirmal_M01/"
  },
  {
    name: "Ompal Yadav",
    leetcodeUsername: "om_codes1",
    leetcodeProfileLink: "https://leetcode.com/u/om_codes1/"
  },
  {
    name: "Pawan Kushwah",
    leetcodeUsername: "pawankushwah",
    leetcodeProfileLink: "https://leetcode.com/u/pawankushwah/"
  },
  {
    name: "Pinky Rana",
    leetcodeUsername: "ranapink398",
    leetcodeProfileLink: "https://leetcode.com/u/ranapink398/"
  },
  {
    name: "Pooran Singh",
    leetcodeUsername: "pooransingh01",
    leetcodeProfileLink: "https://leetcode.com/u/pooransingh01/"
  },
  {
    name: "Prabhat Patidar",
    leetcodeUsername: "Prabhat7987",
    leetcodeProfileLink: "https://leetcode.com/u/Prabhat7987/"
  },
  {
    name: "Prachi Dhakad",
    leetcodeUsername: "prachiDhakad",
    leetcodeProfileLink: "https://leetcode.com/u/prachiDhakad/"
  },
  {
    name: "Pragati Chauhan",
    leetcodeUsername: "Chauhan_Pragati",
    leetcodeProfileLink: "https://leetcode.com/u/Chauhan_Pragati/"
  },
  {
    name: "Pranjal Dubey",
    leetcodeUsername: "Pranjal428",
    leetcodeProfileLink: "https://leetcode.com/u/Pranjal428/"
  },
  {
    name: "Prem Kumar",
    leetcodeUsername: "prem2450",
    leetcodeProfileLink: "https://leetcode.com/u/prem2450/"
  },
  {
    name: "Prem Shankar Kushwaha",
    leetcodeUsername: "PCodex9",
    leetcodeProfileLink: "https://leetcode.com/u/PCodex9/"
  },
  {
    name: "Prerana Rajnag",
    leetcodeUsername: "preranarajnag",
    leetcodeProfileLink: "https://leetcode.com/u/preranarajnag/"
  },
  {
    name: "Priya Saini",
    leetcodeUsername: "Priya_saini2004",
    leetcodeProfileLink: "https://leetcode.com/u/Priya_saini2004/"
  },
  {
    name: "Priyadarshi Kumar",
    leetcodeUsername: "iPriyadarshi",
    leetcodeProfileLink: "https://leetcode.com/u/iPriyadarshi/"
  },
  {
    name: "Pushpraj singh",
    leetcodeUsername: "Pushpraj_DSA",
    leetcodeProfileLink: "https://leetcode.com/u/Pushpraj_DSA/"
  },
  {
    name: "Rahul Kumar",
    leetcodeUsername: "rahu48",
    leetcodeProfileLink: "https://leetcode.com/u/rahu48/"
  },
  {
    name: "Rahul Kumar Verma",
    leetcodeUsername: "RahulVermaji",
    leetcodeProfileLink: "https://leetcode.com/u/RahulVermaji/"
  },
  {
    name: "Rajeev Yadav",
    leetcodeUsername: "kn1gh7t",
    leetcodeProfileLink: "https://leetcode.com/u/kn1gh7t/"
  },
  {
    name: "Rajiv Kumar",
    leetcodeUsername: "rajiv1478",
    leetcodeProfileLink: "https://leetcode.com/u/rajiv1478/"
  },
  {
    name: "Rakshita K Biradar",
    leetcodeUsername: "RakshitaKBiradar",
    leetcodeProfileLink: "https://leetcode.com/u/RakshitaKBiradar/"
  },
  {
    name: "Ramraj Nagar",
    leetcodeUsername: "Ramrajnagar",
    leetcodeProfileLink: "https://leetcode.com/u/Ramrajnagar/"
  },
  {
    name: "Rani Kumari",
    leetcodeUsername: "123_Rani",
    leetcodeProfileLink: "https://leetcode.com/u/123_Rani/"
  },
  {
    name: "Ranjeet kumar yadav",
    leetcodeUsername: "Ranjeet_kumar",
    leetcodeProfileLink: "https://leetcode.com/u/DL6FbStsPL/"
  },
  {
    name: "Ravi Mourya",
    leetcodeUsername: "MouryaRavi",
    leetcodeProfileLink: "https://leetcode.com/u/6G3TE2HiE0/"
  },
  {
    name: "Ravi Rajput",
    leetcodeUsername: "RAVI-RAJPUT-UMATH",
    leetcodeProfileLink: "https://leetcode.com/u/RAVI-RAJPUT-UMATH/"
  },
  {
    name: "Ritesh jha",
    leetcodeUsername: "RITESH12JHA24",
    leetcodeProfileLink: "https://leetcode.com/u/RITESH12JHA24/"
  },
  {
    name: "Ritik Singh",
    leetcodeUsername: "Ritik_Singh_2311",
    leetcodeProfileLink: "https://leetcode.com/u/Ritik_Singh_2311/"
  },
  {
    name: "Rohit Malviya",
    leetcodeUsername: "RohitMelasiya",
    leetcodeProfileLink: "https://leetcode.com/u/RohitMelasiya/"
  },
  {
    name: "Rohit Kumar",
    leetcodeUsername: "rkprasad90600",
    leetcodeProfileLink: "https://leetcode.com/u/rkprasad90600/"
  },
  {
    name: "Sajan Kumar",
    leetcodeUsername: "Sajan_kumar45",
    leetcodeProfileLink: "https://leetcode.com/u/Sajan_kumar45/"
  },
  {
    name: "Samina Sultana",
    leetcodeUsername: "Samina_Sultana",
    leetcodeProfileLink: "https://leetcode.com/u/Samina_Sultana/"
  },
  {
    name: "Sandeep Kumar",
    leetcodeUsername: "sandeepsinu79",
    leetcodeProfileLink: "https://leetcode.com/u/sandeepsinu79/"
  },
  {
    name: "Sandhya Kaushal",
    leetcodeUsername: "Sandhya_Kaushal",
    leetcodeProfileLink: "https://leetcode.com/u/Sandhya_Kaushal/"
  },
  {
    name: "Sandhya Parmar",
    leetcodeUsername: "Sandhya_Parmar",
    leetcodeProfileLink: "https://leetcode.com/u/Sandhya_Parmar/"
  },
  {
    name: "Sarthaksuman Mishra",
    leetcodeUsername: "sarthak-26",
    leetcodeProfileLink: "https://leetcode.com/u/sarthak-26/"
  },
  {
    name: "Satish Mahto",
    leetcodeUsername: "kr_satish",
    leetcodeProfileLink: "https://leetcode.com/u/kr_satish/"
  },
  {
    name: "Saurabh Bisht",
    leetcodeUsername: "bocchi_277",
    leetcodeProfileLink: "https://leetcode.com/u/bocchi_277/"
  },
  {
    name: "Shahid Ansari",
    leetcodeUsername: "shahidthisside",
    leetcodeProfileLink: "https://leetcode.com/u/shahidthisside/"
  },
  {
    name: "Shalini Priya",
    leetcodeUsername: "Shalini_Priya29",
    leetcodeProfileLink: "https://leetcode.com/u/Shalini_Priya29/"
  },
  {
    name: "Shilpi shaw",
    leetcodeUsername: "shilpishaw",
    leetcodeProfileLink: "https://leetcode.com/u/shilpishaw/"
  },
  {
    name: "Shivam Shukla",
    leetcodeUsername: "itz_shuklajii",
    leetcodeProfileLink: "https://leetcode.com/u/itz_shuklajii/"
  },
  {
    name: "Shivam Shukla",
    leetcodeUsername: "shivamm-shukla",
    leetcodeProfileLink: "https://leetcode.com/u/shivamm-shukla/"
  },
  {
    name: "Shivang Dubey",
    leetcodeUsername: "Shivangdubey9",
    leetcodeProfileLink: "https://leetcode.com/u/Shivangdubey9/"
  },
  {
    name: "Shlok Gupta",
    leetcodeUsername: "shlokg62",
    leetcodeProfileLink: "https://leetcode.com/u/shlokg62/"
  },
  {
    name: "Shreyank Sthavaramath",
    leetcodeUsername: "shreyank_s",
    leetcodeProfileLink: "https://leetcode.com/u/shreyank_s/"
  },
  {
    name: "Shubham Kang",
    leetcodeUsername: "Shubham_Kang",
    leetcodeProfileLink: "https://leetcode.com/u/Shubham_Kang/"
  },
  {
    name: "Sneha Shaw",
    leetcodeUsername: "Sneha6289",
    leetcodeProfileLink: "https://leetcode.com/u/Sneha6289/"
  },
  {
    name: "Sunny Kumar",
    leetcodeUsername: "sunny_kumar_1",
    leetcodeProfileLink: "https://leetcode.com/u/sunny_kumar_1/"
  },
  {
    name: "Surveer Singh Rao",
    leetcodeUsername: "Surveer686",
    leetcodeProfileLink: "https://leetcode.com/u/Surveer686/"
  },
  {
    name: "Swati Kumari",
    leetcodeUsername: "Swati_Kumari_142",
    leetcodeProfileLink: "https://leetcode.com/u/Swati_Kumari_142/"
  },
  {
    name: "Suyash Yadav",
    leetcodeUsername: "yadavsuyash723",
    leetcodeProfileLink: "https://leetcode.com/u/yadavsuyash723/"
  },
  {
    name: "Ujjval Baijal",
    leetcodeUsername: "Ujjwal_Baijal",
    leetcodeProfileLink: "https://leetcode.com/u/Ujjwal_Baijal/"
  },
  {
    name: "Uppara Sai Maithreyi",
    leetcodeUsername: "sai_maithri",
    leetcodeProfileLink: "https://leetcode.com/u/sai_maithri/"
  },
  {
    name: "Vinay Kumar",
    leetcodeUsername: "Vinay_Prajapati",
    leetcodeProfileLink: "https://leetcode.com/u/Vinay_Prajapati/"
  },
  {
    name: "Tamnna parveen",
    leetcodeUsername: "Tamnnaparveen",
    leetcodeProfileLink: "https://leetcode.com/u/Tamnnaparvreen/"
  },
  {
    name: "Vinay Kumar Gupta",
    leetcodeUsername: "vinay_gupta01",
    leetcodeProfileLink: "https://leetcode.com/u/vinay_gupta01/"
  },
  {
    name: "Vishal Bhardwaj",
    leetcodeUsername: "vishalbhardwaj123",
    leetcodeProfileLink: "https://leetcode.com/u/vishalbhardwaj123/"
  },
  {
    name: "Vishal Kumar",
    leetcodeUsername: "kumar_vishal_01",
    leetcodeProfileLink: "https://leetcode.com/u/kumar_vishal_01/"
  },
  {
    name: "Vivek Kumar",
    leetcodeUsername: "its_vivek_001",
    leetcodeProfileLink: "https://leetcode.com/u/its_vivek_001/"
  },
  {
    name: "Vivek kumar",
    leetcodeUsername: "vivek_75",
    leetcodeProfileLink: "https://leetcode.com/u/vivek_75/"
  },
  {
    name: "Yuvraj Chirag",
    leetcodeUsername: "Yuvraj_Chirag",
    leetcodeProfileLink: "https://leetcode.com/u/Yuvraj_Chirag/"
  },
  {
    name: "Yuvraj Singh Bhati",
    leetcodeUsername: "yuvrajsinghbhati01",
    leetcodeProfileLink: "https://leetcode.com/u/yuvrajsinghbhati01/"
  },
  {
    name: "Naman Damami",
    leetcodeUsername: "namandamami",
    leetcodeProfileLink: "https://leetcode.com/u/namandamami/"
  },
  {
    name: "Ajay jatav",
    leetcodeUsername: "Ajayjatav",
    leetcodeProfileLink: "https://leetcode.com/u/AjayJatav/"
  },
  {
    name: "Arjun Kadam",
    leetcodeUsername: "arjunkadampatil",
    leetcodeProfileLink: "https://leetcode.com/u/arjunkadampatil/"
  },
  {
    name: "Nirmal Kumar",
    leetcodeUsername: "r2GUlBuyLZ",
    leetcodeProfileLink: "https://leetcode.com/u/r2GUlBuyLZ/"
  },
  {
    name: "Ranjeet kumar yadav",
    leetcodeUsername: "Ranjeet_kumar",
    leetcodeProfileLink: "https://leetcode.com/u/DL6FbStsPL/"
  },
  {
    name: "Ravi Mourya",
    leetcodeUsername: "MouryaRavi",
    leetcodeProfileLink: "https://leetcode.com/u/6G3TE2HiE0/"
  },
  {
    name: "Tamnna parveen",
    leetcodeUsername: "Tamnnaparvreen",
    leetcodeProfileLink: "https://leetcode.com/u/Tamnnaparvreen/"
  }
];

// attached_assets/batch_2027_real_students.json
var batch_2027_real_students_default = [
  {
    name: "Saksham Bharti",
    leetcodeUsername: "8qr2ldT2db",
    leetcodeProfileLink: "https://leetcode.com/u/8qr2ldT2db/"
  },
  {
    name: "Ajay Kumar",
    leetcodeUsername: "ajay_navodayan",
    leetcodeProfileLink: "https://leetcode.com/u/ajay_navodayan/"
  },
  {
    name: "Mayank Singh Tomar",
    leetcodeUsername: "mayank_singh_tomar",
    leetcodeProfileLink: "https://leetcode.com/u/mayank_singh_tomar/"
  },
  {
    name: "Hemant Jangde",
    leetcodeUsername: "H_J_1415",
    leetcodeProfileLink: "https://leetcode.com/u/H_J_1415/"
  },
  {
    name: "Harsh Rawat",
    leetcodeUsername: "harzrawat",
    leetcodeProfileLink: "https://leetcode.com/u/harzrawat/"
  },
  {
    name: "Rashmi Kumari",
    leetcodeUsername: "rashu2377",
    leetcodeProfileLink: "https://leetcode.com/u/rashu2377/"
  },
  {
    name: "Nikhil Raj Soni",
    leetcodeUsername: "NikhilRajSoni",
    leetcodeProfileLink: "https://leetcode.com/u/NikhilRajSoni/"
  },
  {
    name: "Sanjay V P",
    leetcodeUsername: "SANJAY_V_P",
    leetcodeProfileLink: "https://leetcode.com/u/SANJAY_V_P/"
  },
  {
    name: "Saurabh Yadav",
    leetcodeUsername: "Saurabhrajesh23",
    leetcodeProfileLink: "https://leetcode.com/u/Saurabhrajesh23/"
  },
  {
    name: "Rijwith Mamidi",
    leetcodeUsername: "Rijwith",
    leetcodeProfileLink: "https://leetcode.com/u/Rijwith/"
  },
  {
    name: "Pradeep Kumar",
    leetcodeUsername: "Excited2Code",
    leetcodeProfileLink: "https://leetcode.com/u/Excited2Code/"
  },
  {
    name: "Jitendra Kumar",
    leetcodeUsername: "jeet_always",
    leetcodeProfileLink: "https://leetcode.com/u/jeet_always/"
  },
  {
    name: "Aakash Deep",
    leetcodeUsername: "Aakash_Deep_Sharma",
    leetcodeProfileLink: "https://leetcode.com/u/Aakash_Deep_Sharma/"
  },
  {
    name: "Anamika Kumari",
    leetcodeUsername: "e_anamika",
    leetcodeProfileLink: "https://leetcode.com/u/e_anamika/"
  },
  {
    name: "Yashwardhan Singh Chundawat",
    leetcodeUsername: "yashjnv",
    leetcodeProfileLink: "https://leetcode.com/u/yashjnv/"
  },
  {
    name: "Aakash Kumar",
    leetcodeUsername: "sherwaljiaakash110",
    leetcodeProfileLink: "https://leetcode.com/u/sherwaljiaakash110/"
  },
  {
    name: "Sandeep Kumar",
    leetcodeUsername: "saneeipk",
    leetcodeProfileLink: "https://leetcode.com/u/saneeipk/"
  },
  {
    name: "Satyam Kumar Pandey",
    leetcodeUsername: "satyamkumarpandey",
    leetcodeProfileLink: "https://leetcode.com/u/satyamkumarpandey/"
  },
  {
    name: "Pankaj Rishi",
    leetcodeUsername: "pankaj_rishi",
    leetcodeProfileLink: "https://leetcode.com/u/pankaj_rishi/"
  },
  {
    name: "Prakash Marandi",
    leetcodeUsername: "prak290",
    leetcodeProfileLink: "https://leetcode.com/u/prak290/"
  },
  {
    name: "Hemant Meena",
    leetcodeUsername: "Hevi954",
    leetcodeProfileLink: "https://leetcode.com/u/Hevi954/"
  },
  {
    name: "Deepali Tomar",
    leetcodeUsername: "deepalitomar",
    leetcodeProfileLink: "https://leetcode.com/u/deepalitomar/"
  },
  {
    name: "Nikhil Yadav",
    leetcodeUsername: "nikhilyadav09",
    leetcodeProfileLink: "https://leetcode.com/u/nikhilyadav09/"
  },
  {
    name: "Ritik Kumar",
    leetcodeUsername: "itsritik",
    leetcodeProfileLink: "https://leetcode.com/u/itsritik/"
  },
  {
    name: "Ram Bhanwar Bhadiyar",
    leetcodeUsername: "rb_bhadiyarz",
    leetcodeProfileLink: "https://leetcode.com/u/rb_bhadiyarz/"
  },
  {
    name: "Anshul Sharma",
    leetcodeUsername: "Anshul_Sharma2409",
    leetcodeProfileLink: "https://leetcode.com/u/Anshul_Sharma2409/"
  },
  {
    name: "Rajat Malviya",
    leetcodeUsername: "Rajat_Malviya",
    leetcodeProfileLink: "https://leetcode.com/u/Rajat_Malviya/"
  },
  {
    name: "Saurabh Agrahari",
    leetcodeUsername: "maxcoder143",
    leetcodeProfileLink: "https://leetcode.com/u/maxcoder143/"
  },
  {
    name: "Nikhil Verma",
    leetcodeUsername: "nikhil7618987598",
    leetcodeProfileLink: "https://leetcode.com/u/nikhil7618987598/"
  },
  {
    name: "Sahil Kumar",
    leetcodeUsername: "Sahil_Kumar2005",
    leetcodeProfileLink: "https://leetcode.com/u/Sahil_Kumar2005/"
  },
  {
    name: "Amit Diwakar",
    leetcodeUsername: "AmitDiwakar",
    leetcodeProfileLink: "https://leetcode.com/u/AmitDiwakar/"
  },
  {
    name: "Swarnali Saha",
    leetcodeUsername: "s_sneha_smiley",
    leetcodeProfileLink: "https://leetcode.com/u/s_sneha_smiley/"
  },
  {
    name: "Pallavi Maurya",
    leetcodeUsername: "Pallavi_M123",
    leetcodeProfileLink: "https://leetcode.com/u/Pallavi_M123/"
  },
  {
    name: "Yash Chittora",
    leetcodeUsername: "Yash_Chittora_",
    leetcodeProfileLink: "https://leetcode.com/u/Yash_Chittora_/"
  },
  {
    name: "Kajol Kashipuri",
    leetcodeUsername: "kajolkashipuri2005",
    leetcodeProfileLink: "https://leetcode.com/u/kajolkashipuri2005/"
  },
  {
    name: "Mayank Rai",
    leetcodeUsername: "Mayank_Rai1774",
    leetcodeProfileLink: "https://leetcode.com/u/Mayank_Rai1774/"
  },
  {
    name: "Mallesh Basvant Kamati",
    leetcodeUsername: "mallesh_kamati",
    leetcodeProfileLink: "https://leetcode.com/u/mallesh_kamati/"
  },
  {
    name: "Deepak Kumar",
    leetcodeUsername: "user1394Wj",
    leetcodeProfileLink: "https://leetcode.com/u/user1394Wj/"
  }
];

// server/routes.ts
async function registerRoutes(app2) {
  app2.use("/api/auth", auth_default);
  app2.post("/api/init-students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      let importedCount = 0;
      for (const studentData of students_1753783623487_default) {
        const existing = await storage.getStudentByUsername(studentData.leetcodeUsername);
        if (!existing) {
          await storage.createStudent({
            name: studentData.name,
            leetcodeUsername: studentData.leetcodeUsername,
            leetcodeProfileLink: studentData.leetcodeProfileLink,
            batch: "2028"
            // Explicitly set batch for existing data
          });
          importedCount++;
        }
      }
      res.json({
        message: `Imported ${importedCount} new students`,
        total: students_1753783623487_default.length
      });
    } catch (error) {
      console.error("Error importing students:", error);
      res.status(500).json({ error: "Failed to import students" });
    }
  });
  app2.post("/api/init-batch-2027", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      let importedCount = 0;
      for (const studentData of batch_2027_real_students_default) {
        const existing = await storage.getStudentByUsername(studentData.leetcodeUsername);
        if (!existing) {
          await storage.createStudent({
            name: studentData.name,
            leetcodeUsername: studentData.leetcodeUsername,
            leetcodeProfileLink: studentData.leetcodeProfileLink,
            batch: "2027"
          });
          importedCount++;
        }
      }
      res.json({
        message: `Imported ${importedCount} new Batch 2027 students`,
        total: batch_2027_real_students_default.length
      });
    } catch (error) {
      console.error("Error importing Batch 2027 students:", error);
      res.status(500).json({ error: "Failed to import Batch 2027 students" });
    }
  });
  app2.post("/api/replace-batch-2027", async (req, res) => {
    try {
      const existingStudents = await storage.getStudentsByBatch("2027");
      console.log(`Found ${existingStudents.length} existing Batch 2027 students to replace`);
      for (const student of existingStudents) {
        await storage.deleteStudentByUsername(student.leetcodeUsername);
      }
      let importedCount = 0;
      for (const studentData of batch_2027_real_students_default) {
        await storage.createStudent({
          name: studentData.name,
          leetcodeUsername: studentData.leetcodeUsername,
          leetcodeProfileLink: studentData.leetcodeProfileLink,
          batch: "2027"
        });
        importedCount++;
      }
      res.json({
        message: `Replaced Batch 2027 with ${importedCount} real students`,
        deleted: existingStudents.length,
        imported: importedCount
      });
    } catch (error) {
      console.error("Error replacing Batch 2027 students:", error);
      res.status(500).json({ error: "Failed to replace Batch 2027 students" });
    }
  });
  app2.get("/api/students", async (req, res) => {
    try {
      const students2 = await storage.getAllStudents();
      const enrichedStudents = await Promise.all(students2.map(async (student) => {
        const realTimeData = await storage.getLeetcodeRealTimeData(student.id);
        const weeklyData = await storage.getWeeklyProgressData(student.id);
        const latestProgress = await storage.getLatestDailyProgress(student.id);
        const currentStreak = realTimeData?.currentStreak ?? await storage.calculateStreak(student.id);
        const maxStreak = realTimeData?.maxStreak ?? await storage.calculateMaxStreak(student.id);
        const totalActiveDays = realTimeData?.totalActiveDays ?? await storage.calculateTotalActiveDays(student.id);
        const stats = latestProgress ? {
          totalSolved: latestProgress.totalSolved || 0,
          easySolved: latestProgress.easySolved || 0,
          mediumSolved: latestProgress.mediumSolved || 0,
          hardSolved: latestProgress.hardSolved || 0,
          ranking: latestProgress.ranking || 0,
          acceptanceRate: latestProgress.acceptanceRate || 0,
          totalSubmissions: latestProgress.totalSubmissions || 0,
          totalAccepted: latestProgress.totalAccepted || 0
        } : {
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          ranking: 0,
          acceptanceRate: 0,
          totalSubmissions: 0,
          totalAccepted: 0
        };
        return {
          ...student,
          stats,
          streak: currentStreak,
          maxStreak,
          totalActiveDays,
          weeklyProgress: Math.max(0, (weeklyData?.week5Score || weeklyData?.currentWeekScore || weeklyData?.week4Score || 0) - (weeklyData?.week4Score || 0)),
          lastSubmissionDate: latestProgress?.date,
          status: latestProgress ? "Synced" : "Pending"
        };
      }));
      res.json(enrichedStudents);
    } catch (error) {
      console.error("Error fetching enriched students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  app2.delete("/api/students/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const success = await storage.deleteStudentByUsername(username);
      if (success) {
        res.json({ message: `Student ${username} deleted successfully` });
      } else {
        res.status(404).json({ error: "Student not found or failed to delete" });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });
  app2.post("/api/students/bulk-delete", async (req, res) => {
    try {
      const { usernames } = req.body;
      if (!Array.isArray(usernames)) {
        return res.status(400).json({ error: "Usernames must be an array" });
      }
      const results = await Promise.allSettled(
        usernames.map((username) => storage.deleteStudentByUsername(username))
      );
      const successful = results.filter((result) => result.status === "fulfilled" && result.value).length;
      const failed = results.length - successful;
      res.json({
        message: `Bulk delete completed: ${successful} successful, ${failed} failed`,
        successful,
        failed,
        total: results.length
      });
    } catch (error) {
      console.error("Error bulk deleting students:", error);
      res.status(500).json({ error: "Failed to bulk delete students" });
    }
  });
  app2.get("/api/dashboard/student/:username", authenticateToken, requireAdminOrOwnData, async (req, res) => {
    try {
      const { username } = req.params;
      const student = await storage.getStudentByUsername(username);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const dashboardData = await storage.getStudentDashboard(student.id);
      if (!dashboardData) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching student dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/dashboard/admin", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const dashboardData = await storage.getAdminDashboard();
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ error: "Failed to fetch admin dashboard data" });
    }
  });
  app2.get("/api/dashboard/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const dashboardData = await storage.getBatchDashboard(batch);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching batch dashboard:", error);
      res.status(500).json({ error: "Failed to fetch batch dashboard data" });
    }
  });
  app2.get("/api/dashboard/university", async (req, res) => {
    try {
      const dashboardData = await storage.getUniversityDashboard();
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching university dashboard:", error);
      res.status(500).json({ error: "Failed to fetch university dashboard data" });
    }
  });
  app2.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
  app2.get("/api/leaderboard/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const leaderboard = await storage.getBatchLeaderboard(batch);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch leaderboard" });
    }
  });
  app2.get("/api/leaderboard/university", async (req, res) => {
    try {
      const leaderboard = await storage.getUniversityLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch university leaderboard" });
    }
  });
  app2.get("/api/students/all", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      res.json(adminData.students);
    } catch (error) {
      console.error("Error fetching all students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  app2.get("/api/students/batch/:batch", async (req, res) => {
    try {
      const { batch } = req.params;
      if (!["2027", "2028"].includes(batch)) {
        return res.status(400).json({ error: "Invalid batch. Must be 2027 or 2028" });
      }
      const batchData = await storage.getBatchDashboard(batch);
      res.json(batchData.students);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      res.status(500).json({ error: "Failed to fetch batch students" });
    }
  });
  app2.get("/api/rankings/all", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      const rankedStudents = adminData.students.sort((a, b) => b.stats.totalSolved - a.stats.totalSolved).map((student, index) => ({
        rank: index + 1,
        student: {
          id: student.id,
          name: student.name,
          leetcodeUsername: student.leetcodeUsername,
          leetcodeProfileLink: student.leetcodeProfileLink || `https://leetcode.com/u/${student.leetcodeUsername}/`
        },
        stats: student.stats,
        weeklyProgress: student.weeklyProgress,
        streak: student.streak,
        status: student.status,
        badges: student.badges?.length || 0
      }));
      res.json(rankedStudents);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      res.status(500).json({ error: "Failed to fetch rankings" });
    }
  });
  app2.post("/api/sync/student/:id", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await leetCodeService.syncStudentData(id);
      if (success) {
        res.json({ message: "Student data synced successfully" });
      } else {
        res.status(400).json({ error: "Failed to sync student data" });
      }
    } catch (error) {
      console.error("Error syncing student:", error);
      res.status(500).json({ error: "Failed to sync student data" });
    }
  });
  app2.post("/api/sync/profile-photos", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const result = await leetCodeService.syncAllProfilePhotos();
      res.json({
        message: `Profile photos sync completed`,
        success: result.success,
        failed: result.failed
      });
    } catch (error) {
      console.error("Error syncing profile photos:", error);
      res.status(500).json({ error: "Failed to sync profile photos" });
    }
  });
  app2.get("/api/export/csv", async (req, res) => {
    try {
      const adminData = await storage.getAdminDashboard();
      const headers = ["Name", "LeetCode Username", "Total Solved", "Weekly Progress", "Streak", "Status"];
      const csvContent = [
        headers.join(","),
        ...adminData.students.map((student) => [
          `"${student.name}"`,
          student.leetcodeUsername,
          student.stats.totalSolved,
          student.weeklyProgress,
          student.streak,
          `"${student.status}"`
        ].join(","))
      ].join("\n");
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="leetcode-progress-${date}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });
  app2.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  app2.get("/api/badges/all", async (req, res) => {
    try {
      const badgesData = await storage.getAllBadgesData();
      res.json(badgesData);
    } catch (error) {
      console.error("Error fetching badges data:", error);
      res.status(500).json({ error: "Failed to fetch badges data" });
    }
  });
  app2.post("/api/import/csv", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), "attached_assets", "LeetCode Details (2024-28) - Sheet1_1753877079641.csv");
      const result = await csvImportService.importFromCSV(csvFilePath);
      res.json({
        success: true,
        message: `Import completed: ${result.imported} students imported, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({ error: `Failed to import CSV: ${error}` });
    }
  });
  app2.post("/api/import/updated-csv", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), "attached_assets", "LEETCODE UPDATED DATA SHEET_1753968848855.csv");
      const result = await csvImportService.importUpdatedCSV(csvFilePath);
      res.json({
        success: true,
        message: `Update completed: ${result.updated} students updated, ${result.created} created, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error("CSV update error:", error);
      res.status(500).json({ error: `Failed to update from CSV: ${error}` });
    }
  });
  app2.post("/api/import/weekly-progress", async (req, res) => {
    try {
      const csvFilePath = path.join(process.cwd(), "attached_assets", "batch of 28 leetcode_2_AUGUST_1754130719740.csv");
      const result = await weeklyProgressImportService.importWeeklyProgressFromCSV(csvFilePath);
      res.json({
        success: true,
        message: `Weekly progress import completed: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped`,
        ...result
      });
    } catch (error) {
      console.error("Weekly progress import error:", error);
      res.status(500).json({ error: `Failed to import weekly progress data: ${error}` });
    }
  });
  app2.get("/api/weekly-progress", async (req, res) => {
    try {
      const weeklyProgressData2 = await weeklyProgressImportService.getEnhancedWeeklyProgressData();
      res.json(weeklyProgressData2);
    } catch (error) {
      console.error("Weekly progress fetch error:", error);
      res.status(500).json({ error: "Failed to fetch weekly progress data" });
    }
  });
  app2.get("/api/weekly-progress/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const studentProgress = await weeklyProgressImportService.getStudentWeeklyProgress(username);
      if (!studentProgress) {
        return res.status(404).json({ error: "Student not found or no weekly progress data available" });
      }
      res.json(studentProgress);
    } catch (error) {
      console.error("Student weekly progress fetch error:", error);
      res.status(500).json({ error: "Failed to fetch student weekly progress data" });
    }
  });
  app2.post("/api/import/weekly-progress-csv", async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "Invalid CSV data format" });
      }
      const result = await weeklyProgressImportService.importFromCSVData(csvData);
      res.json({
        success: true,
        message: `Weekly progress import completed: ${result.stats.imported} imported, ${result.stats.updated} updated`,
        stats: result.stats
      });
    } catch (error) {
      console.error("Weekly progress CSV import error:", error);
      res.status(500).json({ error: `Failed to import weekly progress CSV: ${error}` });
    }
  });
  app2.post("/api/cleanup/remove-zero-students", async (req, res) => {
    try {
      const result = await storage.removeStudentsWithZeroQuestions();
      res.json({
        success: true,
        message: `Removed ${result.removedCount} students with zero questions solved`,
        removedCount: result.removedCount
      });
    } catch (error) {
      console.error("Remove zero students error:", error);
      res.status(500).json({ error: "Failed to remove students with zero questions" });
    }
  });
  app2.post("/api/update/week5-data", async (req, res) => {
    try {
      const week5Data = [
        { name: "Aaditya Raj", username: "aadi2532", week1: 27, week2: 32, week3: 39, week4: 39, week5: 58 },
        { name: "Abhishek Singh", username: "Abhishek_2008", week1: 11, week2: 25, week3: 40, week4: 64, week5: 68 },
        { name: "Aditya", username: "Aadi_Singh_28", week1: 0, week2: 13, week3: 28, week4: 58, week5: 83 },
        { name: "Ajit Yadav", username: "Ajit_Yadav_2908", week1: 6, week2: 21, week3: 36, week4: 62, week5: 76 },
        { name: "Akanksha", username: "Akanksha_kushwaha_a", week1: 22, week2: 29, week3: 48, week4: 72, week5: 84 },
        { name: "Alok Raj", username: "alok-work23", week1: 3, week2: 9, week3: 29, week4: 53, week5: 61 },
        { name: "Aman Verma", username: "aman1640", week1: 0, week2: 4, week3: 15, week4: 15, week5: 51 },
        { name: "Aman Singh", username: "Aman_Singh_Sitare", week1: 123, week2: 140, week3: 176, week4: 217, week5: 243 },
        { name: "Aman Adarsh", username: "amanadarsh1168", week1: 0, week2: 9, week3: 26, week4: 52, week5: 69 },
        { name: "Amit Kumar", username: "Amit_Kumar13", week1: 3, week2: 16, week3: 31, week4: 54, week5: 65 },
        { name: "Anamika Kumari", username: "tanamika", week1: 4, week2: 17, week3: 42, week4: 42, week5: 55 },
        { name: "Anand Singh", username: "of0DUuvBjV", week1: 0, week2: 0, week3: 2, week4: 12, week5: 11 },
        { name: "Anand Kumar Pandey", username: "Anand_Pandey123", week1: 110, week2: 139, week3: 175, week4: 218, week5: 256 },
        { name: "Anoop kumar", username: "Anoop_kumar123", week1: 0, week2: 8, week3: 16, week4: 53, week5: 84 },
        { name: "Anshu Kumar", username: "CodebyAnshu03", week1: 4, week2: 11, week3: 19, week4: 40, week5: 61 },
        { name: "Anuradha Tiwari", username: "anuradha_24", week1: 52, week2: 61, week3: 94, week4: 122, week5: 134 },
        { name: "Anushri Mishra", username: "Anushri_Mishra", week1: 49, week2: 53, week3: 75, week4: 90, week5: 108 },
        { name: "Aradhya patel", username: "aradhya789", week1: 8, week2: 20, week3: 40, week4: 50, week5: 54 },
        { name: "Arjun Kadam", username: "arjunkadampatil", week1: 22, week2: 57, week3: 78, week4: 112, week5: 122 },
        { name: "Arpita Tripathi", username: "Uny60jPJeO", week1: 42, week2: 53, week3: 74, week4: 91, week5: 101 },
        { name: "Arun kumar", username: "Arun_404", week1: 0, week2: 5, week3: 12, week4: 41, week5: 41 },
        { name: "Aryan Saini", username: "aryan8773", week1: 15, week2: 31, week3: 57, week4: 120, week5: 160 },
        { name: "Ashwin yadav", username: "ashwin-tech", week1: 0, week2: 5, week3: 25, week4: 49, week5: 56 },
        { name: "Ayush Kumar", username: "Ayush4Sony", week1: 0, week2: 5, week3: 16, week4: 41, week5: 57 },
        { name: "Ayush Kumar Yadav", username: "Ayush_Yadav_029", week1: 9, week2: 26, week3: 42, week4: 54, week5: 63 },
        { name: "Bhagwati", username: "Bhagwati323", week1: 5, week2: 27, week3: 63, week4: 98, week5: 116 },
        { name: "Bhaskar Mahato", username: "bhaskarmahato03", week1: 1, week2: 11, week3: 27, week4: 52, week5: 67 },
        { name: "Byagari Praveen Kumar", username: "Mr_bpk_4433", week1: 0, week2: 9, week3: 24, week4: 44, week5: 55 },
        { name: "Challa Trivedh Kumar", username: "TrivedhChalla", week1: 27, week2: 41, week3: 61, week4: 87, week5: 103 },
        { name: "Chandan Giri", username: "WelcomeGseries", week1: 12, week2: 16, week3: 31, week4: 47, week5: 47 },
        { name: "Chiranjeet Biswas", username: "Chiranjeet_Biswas", week1: 4, week2: 5, week3: 24, week4: 60, week5: 75 },
        { name: "Debangsu Misra", username: "debangsumisra", week1: 18, week2: 25, week3: 40, week4: 65, week5: 90 },
        { name: "Deepak Mandal", username: "AlgoMandal", week1: 0, week2: 0, week3: 0, week4: 0, week5: 0 },
        { name: "Dilip Vaishnav", username: "Dilip_Vaishnav_07", week1: 4, week2: 8, week3: 21, week4: 56, week5: 56 },
        { name: "Dilip Suthar", username: "Dilip0552", week1: 5, week2: 15, week3: 25, week4: 49, week5: 64 },
        { name: "Disha Sahu", username: "Disha-01-alt", week1: 30, week2: 48, week3: 68, week4: 94, week5: 101 },
        { name: "Divyanshi Sahu", username: "ADHIINSVY13", week1: 0, week2: 8, week3: 22, week4: 54, week5: 58 },
        { name: "Divyanshi Rathour", username: "Divyanshirathour", week1: 15, week2: 21, week3: 42, week4: 62, week5: 66 },
        { name: "Ekta kumari", username: "EktaSaw1212", week1: 20, week2: 25, week3: 48, week4: 63, week5: 83 },
        { name: "Gaurav Rathore", username: "Gaurav_rathore96", week1: 25, week2: 35, week3: 62, week4: 87, week5: 102 },
        { name: "Gaurav kumar", username: "gaurav_vvv", week1: 12, week2: 14, week3: 20, week4: 51, week5: 86 },
        { name: "Gaurav Tiwari", username: "gauravtiwari_70", week1: 5, week2: 10, week3: 20, week4: 33, week5: 55 },
        { name: "Guman Singh Rajpoot", username: "Guman_singh_rajpoot", week1: 8, week2: 16, week3: 52, week4: 97, week5: 120 },
        { name: "Harisingh Rajpoot", username: "HarisinghRaj", week1: 5, week2: 25, week3: 54, week4: 98, week5: 144 },
        { name: "Harsh Chourasiya", username: "harshchourasiya295", week1: 1, week2: 30, week3: 55, week4: 120, week5: 129 },
        { name: "Harshit Chaturvedi", username: "thisharshit", week1: 2, week2: 18, week3: 30, week4: 65, week5: 67 },
        { name: "Himanshu kumar", username: "ansraaz86", week1: 1, week2: 14, week3: 20, week4: 55, week5: 69 },
        { name: "Himanshu Srivastav", username: "codeCrafter777", week1: 33, week2: 56, week3: 71, week4: 167, week5: 178 },
        { name: "Himanshu Kanwar Chundawat", username: "himanshu_chundawat", week1: 16, week2: 23, week3: 28, week4: 67, week5: 69 },
        { name: "Hirak Nath", username: "hirak__", week1: 12, week2: 21, week3: 51, week4: 78, week5: 101 },
        { name: "Hiranya Patil", username: "hiranya_patil", week1: 7, week2: 18, week3: 49, week4: 75, week5: 105 },
        { name: "Ishant Bhoyar", username: "Ishant_57", week1: 38, week2: 85, week3: 121, week4: 143, week5: 156 },
        { name: "Jagriti Pandey", username: "jagriti_Pandey01", week1: 1, week2: 5, week3: 15, week4: 22, week5: 30 },
        { name: "Jamal Akhtar", username: "kKJ7y7Q9Ks", week1: 19, week2: 30, week3: 40, week4: 60, week5: 66 },
        { name: "Janu Chaudhary", username: "Janu_Chaudhary", week1: 41, week2: 67, week3: 89, week4: 124, week5: 131 },
        { name: "KARANPAL SINGH RANAWAT", username: "krtechie", week1: 0, week2: 6, week3: 41, week4: 77, week5: 112 },
        { name: "khushi Narwariya", username: "khushi_narwariya", week1: 18, week2: 29, week3: 50, week4: 79, week5: 101 },
        { name: "Lakhan Rathore", username: "Lakhan_rathore", week1: 0, week2: 14, week3: 19, week4: 41, week5: 63 },
        { name: "Maneesh Sakhwar", username: "Maneesh_Sakhwar", week1: 0, week2: 4, week3: 16, week4: 21, week5: 54 },
        { name: "Mani Kumar", username: "MANIKUMAR7109", week1: 9, week2: 19, week3: 44, week4: 57, week5: 57 },
        { name: "Manish Chhaba", username: "Chhaba_Manish", week1: 0, week2: 10, week3: 21, week4: 36, week5: 50 },
        { name: "Manish Kumar Tiwari", username: "manish__45", week1: 156, week2: 179, week3: 211, week4: 262, week5: 301 },
        { name: "Manoj Kharkar", username: "manojk909", week1: 9, week2: 21, week3: 40, week4: 78, week5: 101 },
        { name: "Manoj Dewda", username: "Manoj_Dewda022", week1: 1, week2: 14, week3: 41, week4: 67, week5: 88 },
        { name: "Mausam kumari", username: "Mausam-kumari", week1: 23, week2: 33, week3: 68, week4: 103, week5: 116 },
        { name: "Mayank Raj", username: "mayankRajRay", week1: 0, week2: 7, week3: 19, week4: 54, week5: 74 },
        { name: "Mehtab Alam", username: "alamehtab", week1: 9, week2: 16, week3: 31, week4: 63, week5: 75 },
        { name: "Mohammad Afzal Raza", username: "Afzl_Raza", week1: 4, week2: 17, week3: 29, week4: 37, week5: 56 },
        { name: "MOHD MONIS", username: "codemon-07", week1: 15, week2: 19, week3: 32, week4: 50, week5: 50 },
        { name: "Mohit Sharma", username: "sharma_Mohit_2005", week1: 13, week2: 21, week3: 37, week4: 57, week5: 71 },
        { name: "Moirangthem Joel Singh", username: "JoelMoirangthem", week1: 1, week2: 10, week3: 33, week4: 68, week5: 120 },
        { name: "Monu Rajpoot", username: "Monurajpoot", week1: 1, week2: 15, week3: 40, week4: 78, week5: 106 },
        { name: "N.Arun Kumar", username: "Arunkumar087", week1: 4, week2: 12, week3: 32, week4: 53, week5: 57 },
        { name: "Neeraj Parmar", username: "Neeru888", week1: 30, week2: 35, week3: 50, week4: 70, week5: 81 },
        { name: "Nidhi Kumari", username: "Nid_Singh", week1: 105, week2: 120, week3: 130, week4: 153, week5: 153 },
        { name: "NIKHIL Chaurasiya", username: "Rdxnikhil", week1: 6, week2: 15, week3: 21, week4: 37, week5: 50 },
        { name: "Nikhil Kumar Mehta", username: "Nikhil_KM_04", week1: 9, week2: 41, week3: 60, week4: 93, week5: 104 },
        { name: "Nirmal Kumar", username: "r2GUlBuyLZ", week1: 18, week2: 27, week3: 39, week4: 46, week5: 46 },
        { name: "Nirmal Mewada", username: "nirmal_M01", week1: 2, week2: 8, week3: 11, week4: 39, week5: 65 },
        { name: "Ompal Yadav", username: "om_codes1", week1: 2, week2: 2, week3: 12, week4: 45, week5: 50 },
        { name: "Pawan Kushwah", username: "pawankushwah", week1: 12, week2: 26, week3: 50, week4: 84, week5: 90 },
        { name: "Pinky Rana", username: "ranapink398", week1: 0, week2: 4, week3: 14, week4: 48, week5: 58 },
        { name: "Pooran Singh", username: "pooransingh01", week1: 8, week2: 26, week3: 35, week4: 55, week5: 68 },
        { name: "Prabhat Patidar", username: "Prabhat7987", week1: 29, week2: 46, week3: 70, week4: 73, week5: 81 },
        { name: "Prachi Dhakad", username: "prachiDhakad", week1: 51, week2: 79, week3: 95, week4: 129, week5: 152 },
        { name: "Pragati Chauhan", username: "Chauhan_Pragati", week1: 31, week2: 51, week3: 87, week4: 116, week5: 116 },
        { name: "Pranjal Dubey", username: "Pranjal428", week1: 10, week2: 20, week3: 33, week4: 53, week5: 76 },
        { name: "Prem Kumar", username: "prem2450", week1: 6, week2: 21, week3: 41, week4: 59, week5: 86 },
        { name: "Prem Shankar Kushwaha", username: "PCodex9", week1: 2, week2: 11, week3: 25, week4: 57, week5: 67 },
        { name: "Prerana Rajnag", username: "preranarajnag", week1: 1, week2: 10, week3: 31, week4: 51, week5: 62 },
        { name: "Priya Saini", username: "Priya_saini2004", week1: 30, week2: 45, week3: 83, week4: 118, week5: 139 },
        { name: "Priyadarshi Kumar", username: "iPriyadarshi", week1: 78, week2: 87, week3: 122, week4: 142, week5: 179 },
        { name: "Pushpraj singh", username: "Pushpraj_DSA", week1: 0, week2: 10, week3: 26, week4: 57, week5: 57 },
        { name: "Rahul Kumar", username: "rahu48", week1: 0, week2: 16, week3: 24, week4: 59, week5: 62 },
        { name: "Rahul Kumar Verma", username: "RahulVermaji", week1: 7, week2: 23, week3: 43, week4: 43, week5: 70 },
        { name: "Rajeev Yadav", username: "kn1gh7t", week1: 7, week2: 10, week3: 32, week4: 62, week5: 67 },
        { name: "Rajiv Kumar", username: "rajiv1478", week1: 10, week2: 16, week3: 26, week4: 61, week5: 63 },
        { name: "Rakshita K Biradar", username: "RakshitaKBiradar", week1: 3, week2: 8, week3: 24, week4: 74, week5: 93 },
        { name: "Ramraj Nagar", username: "Ramrajnagar", week1: 37, week2: 48, week3: 85, week4: 109, week5: 110 },
        { name: "Rani Kumari", username: "123_Rani", week1: 110, week2: 130, week3: 168, week4: 207, week5: 219 },
        { name: "Ranjeet kumar yadav", username: "DL6FbStsPL", week1: 3, week2: 8, week3: 23, week4: 40, week5: 54 },
        { name: "Ravi Mourya", username: "MouryaRavi", week1: 0, week2: 14, week3: 21, week4: 46, week5: 60 },
        { name: "Ravi Rajput", username: "RAVI-RAJPUT-UMATH", week1: 1, week2: 8, week3: 25, week4: 62, week5: 85 },
        { name: "Ritesh jha", username: "RITESH12JHA24", week1: 1, week2: 6, week3: 19, week4: 41, week5: 60 },
        { name: "Ritik Singh", username: "Ritik_Singh_2311", week1: 61, week2: 68, week3: 101, week4: 125, week5: 141 },
        { name: "Rohit Malviya", username: "RohitMelasiya", week1: 7, week2: 10, week3: 35, week4: 59, week5: 59 },
        { name: "Rohit Kumar", username: "rkprasad90600", week1: 0, week2: 8, week3: 23, week4: 52, week5: 52 },
        { name: "Sajan Kumar", username: "Sajan_kumar45", week1: 5, week2: 5, week3: 5, week4: 5, week5: 5 },
        { name: "Samina Sultana", username: "Samina_Sultana", week1: 57, week2: 65, week3: 94, week4: 130, week5: 150 },
        { name: "Sandeep Kumar", username: "sandeepsinu79", week1: 0, week2: 9, week3: 17, week4: 45, week5: 45 },
        { name: "Sandhya Kaushal", username: "Sandhya_Kaushal", week1: 11, week2: 24, week3: 35, week4: 64, week5: 71 },
        { name: "Sandhya Parmar", username: "Sandhya_Parmar", week1: 80, week2: 90, week3: 100, week4: 112, week5: 120 },
        { name: "Sarthaksuman Mishra", username: "sarthak-26", week1: 0, week2: 12, week3: 18, week4: 64, week5: 73 },
        { name: "Satish Mahto", username: "kr_satish", week1: 8, week2: 23, week3: 40, week4: 68, week5: 79 },
        { name: "Saurabh Bisht", username: "bocchi_277", week1: 0, week2: 4, week3: 27, week4: 60, week5: 81 },
        { name: "Shahid Ansari", username: "shahidthisside", week1: 0, week2: 4, week3: 19, week4: 54, week5: 72 },
        { name: "Shalini Priya", username: "Shalini_Priya29", week1: 5, week2: 13, week3: 22, week4: 62, week5: 83 },
        { name: "Shilpi shaw", username: "shilpishaw", week1: 52, week2: 65, week3: 100, week4: 136, week5: 171 },
        { name: "Shivam Shukla", username: "itz_shuklajii", week1: 0, week2: 17, week3: 28, week4: 50, week5: 85 },
        { name: "Shivam Shukla", username: "shivamm-shukla", week1: 0, week2: 7, week3: 16, week4: 52, week5: 90 },
        { name: "Shivang Dubey", username: "Shivangdubey9", week1: 0, week2: 11, week3: 31, week4: 67, week5: 87 },
        { name: "Shlok Gupta", username: "shlokg62", week1: 69, week2: 86, week3: 103, week4: 124, week5: 154 },
        { name: "Shreyank Sthavaramath", username: "shreyank_s", week1: 84, week2: 95, week3: 102, week4: 129, week5: 144 },
        { name: "Shubham Kang", username: "Shubham_Kang", week1: 6, week2: 20, week3: 32, week4: 58, week5: 63 },
        { name: "Sneha Shaw", username: "Sneha6289", week1: 22, week2: 35, week3: 47, week4: 70, week5: 89 },
        { name: "Sunny Kumar", username: "sunny_kumar_1", week1: 38, week2: 47, week3: 59, week4: 94, week5: 97 },
        { name: "Surveer Singh Rao", username: "Surveer686", week1: 22, week2: 40, week3: 69, week4: 106, week5: 130 },
        { name: "Swati Kumari", username: "Swati_Kumari_142", week1: 112, week2: 137, week3: 162, week4: 204, week5: 228 },
        { name: "Suyash Yadav", username: "yadavsuyash723", week1: 83, week2: 91, week3: 102, week4: 123, week5: 132 },
        { name: "Ujjval Baijal", username: "Ujjwal_Baijal", week1: 4, week2: 11, week3: 24, week4: 49, week5: 62 },
        { name: "Uppara Sai Maithreyi", username: "sai_maithri", week1: 11, week2: 23, week3: 44, week4: 72, week5: 83 },
        { name: "Vinay Kumar", username: "Vinay_Prajapati", week1: 2, week2: 18, week3: 41, week4: 69, week5: 97 },
        { name: "Tamnna parveen", username: "Tamnnaparvreen", week1: 8, week2: 13, week3: 40, week4: 55, week5: 71 },
        { name: "Vinay Kumar Gupta", username: "vinay_gupta01", week1: 0, week2: 0, week3: 11, week4: 37, week5: 38 },
        { name: "Vishal Bhardwaj", username: "vishalbhardwaj123", week1: 0, week2: 7, week3: 18, week4: 35, week5: 51 },
        { name: "Vishal Kumar", username: "kumar_vishal_01", week1: 0, week2: 12, week3: 29, week4: 43, week5: 64 },
        { name: "Vivek Kumar", username: "its_vivek_001", week1: 0, week2: 5, week3: 15, week4: 20, week5: 20 },
        { name: "Vivek kumar", username: "vivek_75", week1: 3, week2: 12, week3: 30, week4: 46, week5: 63 },
        { name: "Yuvraj Chirag", username: "Yuvraj_Chirag", week1: 85, week2: 101, week3: 126, week4: 155, week5: 181 },
        { name: "Yuvraj Singh Bhati", username: "yuvrajsinghbhati01", week1: 15, week2: 24, week3: 44, week4: 66, week5: 90 },
        { name: "Naman Damami", username: "namandamami", week1: 0, week2: 7, week3: 14, week4: 51, week5: 84 },
        { name: "Ajay jatav", username: "Ajayjatav", week1: 0, week2: 15, week3: 37, week4: 73, week5: 93 },
        { name: "Kuldeep Saraswat", username: "Kuldeep_Saraswat", week1: 0, week2: 5, week3: 10, week4: 23, week5: 53 }
      ];
      let updated = 0;
      let skipped = 0;
      for (const studentData of week5Data) {
        try {
          const student = await storage.getStudentByUsername(studentData.username);
          if (!student) {
            console.log(`Student not found: ${studentData.username}`);
            skipped++;
            continue;
          }
          const week2Progress = studentData.week2 - studentData.week1;
          const week3Progress = studentData.week3 - studentData.week2;
          const week4Progress = studentData.week4 - studentData.week3;
          const week5Progress = studentData.week5 - studentData.week4;
          const totalScore = studentData.week5;
          const averageWeeklyGrowth = Math.round((studentData.week5 - studentData.week1) / 4);
          const existingProgress = await storage.getWeeklyProgressData(student.id);
          if (existingProgress) {
            const result = await storage.updateWeeklyProgressData(
              studentData.username,
              {
                week1Score: studentData.week1,
                week2Score: studentData.week2,
                week3Score: studentData.week3,
                week4Score: studentData.week4,
                week5Score: studentData.week5,
                currentWeekScore: studentData.week5,
                week2Progress,
                week3Progress,
                week4Progress,
                week5Progress,
                totalScore,
                averageWeeklyGrowth,
                updatedAt: /* @__PURE__ */ new Date()
              }
            );
            updated++;
          } else {
            await storage.createWeeklyProgressData({
              studentId: student.id,
              week1Score: studentData.week1,
              week2Score: studentData.week2,
              week3Score: studentData.week3,
              week4Score: studentData.week4,
              week5Score: studentData.week5,
              currentWeekScore: studentData.week5,
              week2Progress,
              week3Progress,
              week4Progress,
              week5Progress,
              totalScore,
              averageWeeklyGrowth
            });
            updated++;
          }
        } catch (error) {
          console.error(`Error updating ${studentData.username}:`, error);
          skipped++;
        }
      }
      res.json({
        success: true,
        message: `Week 5 data update completed: ${updated} students updated, ${skipped} skipped`,
        stats: { updated, skipped, total: week5Data.length }
      });
    } catch (error) {
      console.error("Week 5 data update error:", error);
      res.status(500).json({ error: "Failed to update Week 5 data" });
    }
  });
  app2.post("/api/update/week5-realtime", async (req, res) => {
    try {
      let updated = 0;
      let skipped = 0;
      const studentsNeedingUpdate = await db.select({
        studentId: students.id,
        name: students.name,
        username: students.leetcodeUsername,
        week5Score: weeklyProgressData.week5Score,
        currentTotal: dailyProgress.totalSolved
      }).from(students).leftJoin(weeklyProgressData, eq2(students.id, weeklyProgressData.studentId)).leftJoin(dailyProgress, eq2(students.id, dailyProgress.studentId)).where(
        and2(
          sql4`(${weeklyProgressData.week5Score} = 0 OR ${weeklyProgressData.week5Score} IS NULL)`,
          sql4`${dailyProgress.totalSolved} > 0`
        )
      ).orderBy(sql4`${dailyProgress.date} DESC`);
      const uniqueStudents = /* @__PURE__ */ new Map();
      for (const student of studentsNeedingUpdate) {
        if (!uniqueStudents.has(student.studentId) && student.currentTotal && student.currentTotal > 0) {
          uniqueStudents.set(student.studentId, student);
        }
      }
      console.log(`Found ${uniqueStudents.size} students needing Week 5 updates`);
      for (const studentEntry of uniqueStudents.entries()) {
        const [studentId, studentData] = studentEntry;
        try {
          const newWeek5Score = studentData.currentTotal;
          const existingProgress = await storage.getWeeklyProgressData(studentId);
          if (existingProgress) {
            await storage.updateWeeklyProgressData(studentData.username, {
              week5Score: newWeek5Score,
              currentWeekScore: newWeek5Score,
              totalScore: newWeek5Score,
              updatedAt: /* @__PURE__ */ new Date()
            });
            console.log(`Updated ${studentData.name} Week 5 score to ${newWeek5Score}`);
            updated++;
          } else {
            await storage.createWeeklyProgressData({
              studentId,
              week1Score: 0,
              week2Score: 0,
              week3Score: 0,
              week4Score: 0,
              week5Score: newWeek5Score,
              currentWeekScore: newWeek5Score,
              week2Progress: 0,
              week3Progress: 0,
              week4Progress: 0,
              week5Progress: newWeek5Score,
              totalScore: newWeek5Score,
              averageWeeklyGrowth: Math.round(newWeek5Score / 5)
            });
            console.log(`Created Week 5 data for ${studentData.name} with score ${newWeek5Score}`);
            updated++;
          }
        } catch (error) {
          console.error(`Error updating ${studentData.name}:`, error);
          skipped++;
        }
      }
      res.json({
        success: true,
        message: `Week 5 real-time update completed: ${updated} students updated, ${skipped} skipped`,
        stats: { updated, skipped, total: uniqueStudents.size }
      });
    } catch (error) {
      console.error("Week 5 real-time update error:", error);
      res.status(500).json({ error: "Failed to update Week 5 with real-time data" });
    }
  });
  app2.post("/api/update/weekly-increments", async (req, res) => {
    try {
      const result = await db.execute(sql4`
        UPDATE weekly_progress_data 
        SET 
          week2_progress = COALESCE(week2_score - week1_score, 0),
          week3_progress = COALESCE(week3_score - week2_score, 0),
          week4_progress = COALESCE(week4_score - week3_score, 0),
          week5_progress = COALESCE(week5_score - week4_score, 0),
          average_weekly_growth = ROUND((week5_score - week1_score) / 4.0),
          updated_at = NOW()
        WHERE id IS NOT NULL
      `);
      res.json({
        success: true,
        message: "Weekly increment calculations updated successfully",
        updatedCount: result.rowCount || 0
      });
    } catch (error) {
      console.error("Weekly increments update error:", error);
      res.status(500).json({ error: "Failed to update weekly increments" });
    }
  });
  app2.get("/api/analytics", async (req, res) => {
    try {
      const analyticsData = await csvImportService.getAnalyticsData();
      const totalStudents = analyticsData.length;
      const improved = analyticsData.filter((s) => s.status === "improved").length;
      const declined = analyticsData.filter((s) => s.status === "declined").length;
      const same = analyticsData.filter((s) => s.status === "same").length;
      const averageImprovement = analyticsData.reduce((sum, s) => sum + s.improvement, 0) / totalStudents;
      const top10Students = analyticsData.sort((a, b) => b.currentSolved - a.currentSolved).slice(0, 10);
      const top15Improvers = analyticsData.filter((s) => s.improvement > 0).sort((a, b) => b.improvement - a.improvement).slice(0, 15);
      const classAverageProgression = calculateClassAverageProgression(analyticsData);
      res.json({
        summaryStats: {
          totalStudents,
          improved,
          declined,
          same,
          averageImprovement: Math.round(averageImprovement * 100) / 100
        },
        top10Students,
        top15Improvers,
        progressCategories: {
          improved,
          declined,
          same
        },
        classAverageProgression,
        allStudentsData: analyticsData
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });
  app2.post("/api/export", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { type, format, batches } = req.body;
      if (!["students", "progress", "complete"].includes(type)) {
        return res.status(400).json({ error: "Invalid export type" });
      }
      if (!["csv", "excel"].includes(format)) {
        return res.status(400).json({ error: "Invalid export format" });
      }
      if (!Array.isArray(batches) || batches.some((b) => !["2027", "2028"].includes(b))) {
        return res.status(400).json({ error: "Invalid batches selection" });
      }
      let exportData = [];
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (type === "students" || type === "complete") {
        for (const batch of batches) {
          const batchData = await storage.getBatchDashboard(batch);
          const studentsData = batchData.students.map((student) => ({
            batch,
            name: student.name,
            leetcodeUsername: student.leetcodeUsername,
            profileLink: student.leetcodeProfileLink,
            totalProblems: student.stats.totalSolved,
            easyProblems: student.stats.easySolved,
            mediumProblems: student.stats.mediumSolved,
            hardProblems: student.stats.hardSolved,
            acceptanceRate: student.stats.acceptanceRate,
            currentStreak: student.currentStreak,
            maxStreak: student.maxStreak,
            activeDays: student.totalActiveDays,
            badgeCount: student.badges?.length || 0,
            lastSync: student.lastSync || "Never"
          }));
          exportData.push(...studentsData);
        }
      }
      if (exportData.length === 0) {
        return res.status(400).json({ error: "No data to export" });
      }
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map(
          (row) => headers.map(
            (header) => typeof row[header] === "string" && row[header].includes(",") ? `"${row[header]}"` : row[header]
          ).join(",")
        )
      ].join("\n");
      const filename = `leetcode_export_${type}_${timestamp2}.${format}`;
      res.setHeader("Content-Type", format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      if (format === "csv") {
        res.send(csvContent);
      } else {
        res.send(csvContent);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });
  app2.post("/api/cleanup/remove-zero-students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const result = await storage.removeStudentsWithZeroQuestions();
      res.json({
        message: `Successfully removed ${result.removedCount} students with zero questions solved`,
        removedStudents: result.removedStudents
      });
    } catch (error) {
      console.error("Error removing students with zero questions:", error);
      res.status(500).json({ error: "Failed to remove students" });
    }
  });
  app2.get("/api/cleanup/zero-students", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const students2 = await storage.getStudentsWithZeroQuestions();
      res.json(students2);
    } catch (error) {
      console.error("Error getting students with zero questions:", error);
      res.status(500).json({ error: "Failed to get students with zero questions" });
    }
  });
  app2.post("/api/import/weekly-progress-csv", authenticateToken, requireRole("admin"), async (req, res) => {
    try {
      const { csvData } = req.body;
      if (!csvData || !Array.isArray(csvData)) {
        return res.status(400).json({ error: "Invalid CSV data format" });
      }
      const result = await storage.importWeeklyProgressFromCSVData(csvData);
      res.json({
        message: `Successfully processed CSV data: ${result.imported} imported, ${result.updated} updated`,
        stats: result
      });
    } catch (error) {
      console.error("Error importing weekly progress CSV:", error);
      res.status(500).json({ error: "Failed to import CSV data" });
    }
  });
  schedulerService.startDailySync();
  const httpServer = createServer(app2);
  return httpServer;
}
function calculateClassAverageProgression(analyticsData) {
  const weeks = ["Week 1", "Week 2", "Week 3", "Current"];
  return weeks.map((week, index) => {
    let average = 0;
    if (index < 3) {
      const weekData = analyticsData.map((student) => {
        const weeklyTrend = student.weeklyTrends[index];
        return weeklyTrend?.totalProblems || 0;
      });
      average = weekData.reduce((sum, val) => sum + val, 0) / weekData.length;
    } else {
      const currentData = analyticsData.map((student) => student.currentSolved);
      average = currentData.reduce((sum, val) => sum + val, 0) / currentData.length;
    }
    return {
      week,
      average: Math.round(average * 100) / 100
    };
  });
}

// server/vite.ts
import express from "express";
import fs3 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await db.execute("SELECT 1");
    console.log("PostgreSQL connected successfully");
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
