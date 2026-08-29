import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Characters table - stores RPG character data
 */
export const characters = mysqlTable("characters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  class: mysqlEnum("class", ["wizard", "warrior", "archer", "priest"]).notNull(),
  level: int("level").default(1).notNull(),
  experience: int("experience").default(0).notNull(),
  health: int("health").default(100).notNull(),
  maxHealth: int("maxHealth").default(100).notNull(),
  mana: int("mana").default(50).notNull(),
  maxMana: int("maxMana").default(50).notNull(),
  gold: int("gold").default(0).notNull(),
  attackPower: decimal("attackPower", { precision: 5, scale: 2 }).default("1.0").notNull(),
  defense: decimal("defense", { precision: 5, scale: 2 }).default("1.0").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "normal", "hard"]).default("normal").notNull(),
  focusTime: int("focusTime").default(25).notNull(),
  breakTime: int("breakTime").default(5).notNull(),
  totalSessions: int("totalSessions").default(0).notNull(),
  totalFocusHours: decimal("totalFocusHours", { precision: 8, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

/**
 * Pomodoro sessions table - tracks completed focus sessions
 */
export const pomodoroSessions = mysqlTable("pomodoroSessions", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  duration: int("duration").notNull(),
  experienceGained: int("experienceGained").notNull(),
  goldGained: int("goldGained").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = typeof pomodoroSessions.$inferInsert;

/**
 * Equipment table - stores weapons, armor, accessories
 */
export const equipment = mysqlTable("equipment", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["weapon", "armor", "accessory"]).notNull(),
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
  attackBonus: decimal("attackBonus", { precision: 5, scale: 2 }).default("0").notNull(),
  defenseBonus: decimal("defenseBonus", { precision: 5, scale: 2 }).default("0").notNull(),
  healthBonus: int("healthBonus").default(0).notNull(),
  level: int("level").default(1).notNull(),
  equipped: int("equipped").default(0).notNull(),
  price: int("price").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

/**
 * Quests table - daily/special quests
 */
export const quests = mysqlTable("quests", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  reward: int("reward").notNull(),
  completed: int("completed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = typeof quests.$inferInsert;

/**
 * Bosses table - boss monsters to defeat
 */
export const bosses = mysqlTable("bosses", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  health: int("health").notNull(),
  maxHealth: int("maxHealth").notNull(),
  defeated: int("defeated").default(0).notNull(),
  reward: int("reward").notNull(),
  requiredLevel: int("requiredLevel").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  defeatedAt: timestamp("defeatedAt"),
});

export type Boss = typeof bosses.$inferSelect;
export type InsertBoss = typeof bosses.$inferInsert;

/**
 * Achievements table - badges and achievements
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  characterId: int("characterId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("star").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
