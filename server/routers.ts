import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { characters } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  game: router({
    // Character operations
    createCharacter: protectedProcedure
      .input(z.object({
        name: z.string(),
        class: z.enum(["wizard", "warrior", "archer", "priest"]),
        difficulty: z.enum(["easy", "normal", "hard"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCharacter(ctx.user.id, input.name, input.class, input.difficulty);
        return { success: true };
      }),

    getCharacters: protectedProcedure.query(async ({ ctx }) => {
      return await db.getCharactersByUserId(ctx.user.id);
    }),

    getLeaderboard: publicProcedure.query(async () => {
      return await db.getLeaderboard();
    }),

    getCharacter: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCharacterById(input.characterId);
      }),

    // Pomodoro session
    completePomodoroSession: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        duration: z.number(),
      }))
      .mutation(async ({ input }) => {
        const character = await db.getCharacterById(input.characterId);
        if (!character) throw new Error("Character not found");

        // Calculate XP and gold based on difficulty
        const difficultyMultiplier = {
          easy: 1,
          normal: 1.5,
          hard: 2,
        };

        const multiplier = difficultyMultiplier[character.difficulty as keyof typeof difficultyMultiplier] || 1.5;
        const xpGained = Math.floor(10 * multiplier);
        const goldGained = Math.floor(5 * multiplier);

        // Create session record
        await db.createPomodoroSession(input.characterId, input.duration, xpGained, goldGained);

        // Update character stats
        const newExperience = character.experience + xpGained;
        const newGold = character.gold + goldGained;
        const newLevel = Math.floor(newExperience / 100) + 1;

        await db.updateCharacterStats(input.characterId, {
          experience: newExperience,
          gold: newGold,
          level: newLevel,
          totalSessions: character.totalSessions + 1,
          totalFocusHours: (Number(character.totalFocusHours) + input.duration / 60).toFixed(2),
        });

        return { xpGained, goldGained, newLevel };
      }),

    // Boss operations
    getBosses: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBossesByCharacter(input.characterId);
      }),

    attackBoss: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        bossId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const character = await db.getCharacterById(input.characterId);
        const boss = await db.getBossById(input.bossId);
        if (!character || !boss) throw new Error("Character or boss not found");

        // Calculate damage
        const damage = Math.floor(Number(character.attackPower) * (10 + Math.random() * 5));
        const newBossHealth = Math.max(0, boss.health - damage);

        // Update boss health
        await db.updateBossHealth(input.bossId, newBossHealth);

        // Check if boss is defeated
        if (newBossHealth <= 0) {
          await db.updateBossDefeated(input.bossId);
          // Add reward
          const newGold = character.gold + boss.reward;
          const xpGained = Math.floor(boss.reward / 2);
          const newExperience = character.experience + xpGained;
          const newLevel = Math.floor(newExperience / 100) + 1;
          await db.updateCharacterStats(input.characterId, {
            gold: newGold,
            experience: newExperience,
            level: newLevel,
          });
          return { defeated: true, damage, reward: boss.reward, xpGained };
        }

        return { defeated: false, damage, bossHealth: newBossHealth };
      }),

    // Equipment operations
    getEquipment: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEquipmentByCharacter(input.characterId);
      }),

    buyEquipment: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        equipmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const character = await db.getCharacterById(input.characterId);
        const equipment = await db.getEquipmentById(input.equipmentId);
        if (!character || !equipment) throw new Error("Character or equipment not found");
        if (character.gold < equipment.price) throw new Error("Not enough gold");

        // Deduct gold and equip
        const newGold = character.gold - equipment.price;
        await db.updateCharacterStats(input.characterId, { gold: newGold });
        await db.equipItem(input.equipmentId);

        // Update character stats
        const newAttack = Number(character.attackPower) + Number(equipment.attackBonus);
        const newDefense = Number(character.defense) + Number(equipment.defenseBonus);
        const newHealth = character.maxHealth + equipment.healthBonus;
        await db.updateCharacterStats(input.characterId, {
          attackPower: newAttack.toString(),
          defense: newDefense.toString(),
          maxHealth: newHealth,
          health: Math.min(character.health + equipment.healthBonus, newHealth),
        });

        return { success: true, newGold, newAttack, newDefense };
      }),

    // Quest operations
    getQuests: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return await db.getQuestsByCharacter(input.characterId);
      }),

    completeQuest: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        questId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const character = await db.getCharacterById(input.characterId);
        const quest = await db.getQuestById(input.questId);
        if (!character || !quest) throw new Error("Character or quest not found");

        // Mark quest as complete
        await db.completeQuest(input.questId);

        // Add reward
        const newGold = character.gold + quest.reward;
        const xpGained = Math.floor(quest.reward / 3);
        const newExperience = character.experience + xpGained;
        const newLevel = Math.floor(newExperience / 100) + 1;
        await db.updateCharacterStats(input.characterId, {
          gold: newGold,
          experience: newExperience,
          level: newLevel,
        });

        return { success: true, reward: quest.reward, xpGained };
      }),

    // Achievement operations
    getAchievements: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAchievementsByCharacter(input.characterId);
      }),

    unlockAchievement: protectedProcedure
      .input(z.object({
        characterId: z.number(),
        title: z.string(),
        description: z.string(),
        icon: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createAchievement(input.characterId, input.title, input.description, input.icon);
        return { success: true };
      }),

    deleteCharacter: protectedProcedure
      .input(z.object({ characterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        await database.delete(characters).where(
          and(eq(characters.id, input.characterId), eq(characters.userId, ctx.user.id))
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
