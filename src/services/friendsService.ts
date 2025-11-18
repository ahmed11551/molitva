import { v4 as uuid } from "uuid";
import { logger } from "../utils/logger";
import { getSupabase } from "../db/supabase";
import { nowUtc } from "../utils/dateUtils";
import type { Friend, FriendRequest, FriendStats, LeaderboardEntry } from "../types/friends";
import type { UserPrayerDebt } from "../types/prayerDebt";

export class FriendsService {
  private useSupabase: boolean;
  private friends: Map<string, Friend[]> = new Map(); // In-memory fallback

  constructor() {
    try {
      getSupabase();
      this.useSupabase = true;
      logger.info("FriendsService: Using Supabase");
    } catch {
      this.useSupabase = false;
      logger.warn("FriendsService: Using in-memory storage (Supabase not configured)");
    }
  }

  /**
   * Отправляет запрос на дружбу
   */
  async sendFriendRequest(userId: string, request: FriendRequest): Promise<Friend> {
    if (!this.useSupabase) {
      const friend: Friend = {
        id: uuid(),
        user_id: userId,
        friend_user_id: request.to_user_id,
        status: "pending",
        created_at: nowUtc().toISOString(),
        updated_at: nowUtc().toISOString(),
      };
      const userFriends = this.friends.get(userId) || [];
      userFriends.push(friend);
      this.friends.set(userId, userFriends);
      return friend;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("friends")
        .insert({
          user_id: userId,
          friend_user_id: request.to_user_id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Friend;
    } catch (error: any) {
      logger.error("Error sending friend request:", error);
      throw error;
    }
  }

  /**
   * Принимает запрос на дружбу
   */
  async acceptFriendRequest(userId: string, friendId: string): Promise<Friend> {
    if (!this.useSupabase) {
      const userFriends = this.friends.get(userId) || [];
      const friend = userFriends.find((f) => f.id === friendId);
      if (friend) {
        friend.status = "accepted";
        friend.updated_at = nowUtc().toISOString();
      }
      return friend!;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("friends")
        .update({ status: "accepted", updated_at: nowUtc().toISOString() })
        .eq("id", friendId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Friend;
    } catch (error: any) {
      logger.error("Error accepting friend request:", error);
      throw error;
    }
  }

  /**
   * Получает список друзей пользователя
   */
  async getFriends(userId: string): Promise<Friend[]> {
    if (!this.useSupabase) {
      return this.friends.get(userId)?.filter((f) => f.status === "accepted") || [];
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (error) throw error;
      return (data || []) as Friend[];
    } catch (error: any) {
      logger.error("Error getting friends:", error);
      return [];
    }
  }

  /**
   * Получает статистику друзей для сравнения
   */
  async getFriendsStats(userId: string): Promise<FriendStats[]> {
    const friends = await this.getFriends(userId);
    const stats: FriendStats[] = [];

    try {
      const supabase = getSupabase();
      
      for (const friend of friends) {
        const { data: debt } = await supabase
          .from("prayer_debts")
          .select("debt_calculation")
          .eq("user_id", friend.friend_user_id)
          .single();

        if (debt) {
          const calculation = debt.debt_calculation as UserPrayerDebt["debt_calculation"];
          const total = Object.values(calculation.missed_prayers).reduce((a, b) => a + b, 0);
          const completed = Object.values(calculation.completed_prayers).reduce((a, b) => a + b, 0);
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          stats.push({
            friend_user_id: friend.friend_user_id,
            total_completed: completed,
            total_debt: total,
            progress_percent: progress,
          });
        }
      }

      // Сортируем по прогрессу
      stats.sort((a, b) => b.progress_percent - a.progress_percent);
      stats.forEach((stat, index) => {
        stat.rank = index + 1;
      });

      return stats;
    } catch (error: any) {
      logger.error("Error getting friends stats:", error);
      return [];
    }
  }

  /**
   * Получает лидерборд (топ пользователей)
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.useSupabase) {
      return [];
    }

    try {
      const supabase = getSupabase();
      const { data: debts, error } = await supabase
        .from("prayer_debts")
        .select("user_id, debt_calculation")
        .limit(limit * 2); // Берем больше для фильтрации

      if (error) throw error;

      const leaderboard: LeaderboardEntry[] = [];

      for (const debt of debts || []) {
        const calculation = debt.debt_calculation as UserPrayerDebt["debt_calculation"];
        const total = Object.values(calculation.missed_prayers).reduce((a, b) => a + b, 0);
        const completed = Object.values(calculation.completed_prayers).reduce((a, b) => a + b, 0);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        leaderboard.push({
          user_id: debt.user_id,
          total_completed: completed,
          total_debt: total,
          progress_percent: progress,
          rank: 0, // Будет установлен после сортировки
        });
      }

      // Сортируем по прогрессу и ограничиваем
      leaderboard.sort((a, b) => b.progress_percent - a.progress_percent);
      leaderboard.slice(0, limit).forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return leaderboard.slice(0, limit);
    } catch (error: any) {
      logger.error("Error getting leaderboard:", error);
      return [];
    }
  }
}

