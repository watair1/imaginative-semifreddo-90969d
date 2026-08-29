import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, characters, pomodoroSessions, equipment, quests, bosses, achievements } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;



export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== GAME QUERIES =====

export async function createCharacter(userId: number, name: string, characterClass: string, difficulty: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(characters).values({
    userId,
    name,
    class: characterClass as any,
    difficulty: difficulty as any,
  });

  return result;
}

export async function getCharactersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(characters).where(eq(characters.userId, userId));
}

export async function getCharacterById(characterId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(characters).where(eq(characters.id, characterId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateCharacterStats(characterId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(characters).set(updates).where(eq(characters.id, characterId));
}

export async function createPomodoroSession(characterId: number, duration: number, xpGained: number, goldGained: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(pomodoroSessions).values({
    characterId,
    duration,
    experienceGained: xpGained,
    goldGained,
  });
}

export async function getEquipmentByCharacter(characterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(equipment).where(eq(equipment.characterId, characterId));
}

export async function getQuestsByCharacter(characterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(quests).where(eq(quests.characterId, characterId));
}

export async function getBossesByCharacter(characterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bosses).where(eq(bosses.characterId, characterId));
}

export async function getAchievementsByCharacter(characterId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(achievements).where(eq(achievements.characterId, characterId));
}

export async function getBossById(bossId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(bosses).where(eq(bosses.id, bossId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateBossHealth(bossId: number, health: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(bosses).set({ health }).where(eq(bosses.id, bossId));
}

export async function updateBossDefeated(bossId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(bosses).set({ defeated: 1, defeatedAt: new Date() }).where(eq(bosses.id, bossId));
}

export async function getEquipmentById(equipmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(equipment).where(eq(equipment.id, equipmentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function equipItem(equipmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(equipment).set({ equipped: 1 }).where(eq(equipment.id, equipmentId));
}

export async function getQuestById(questId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(quests).where(eq(quests.id, questId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function completeQuest(questId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(quests).set({ completed: 1, completedAt: new Date() }).where(eq(quests.id, questId));
}

export async function createAchievement(characterId: number, title: string, description: string, icon: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(achievements).values({
    characterId,
    title,
    description,
    icon,
  });
}

export async function getLeaderboard() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(characters).orderBy(desc(characters.level), desc(characters.experience)).limit(10);
}
