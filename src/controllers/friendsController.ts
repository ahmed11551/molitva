import { Request, Response } from "express";
import { FriendsService } from "../services/friendsService";
import { asyncHandler } from "../utils/asyncHandler";
import { ValidationError } from "../errors/appError";

export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  extractUserId = (req: Request): string => {
    const userId = req.header("x-user-id") || (req.query.user_id as string);
    if (!userId) {
      throw new ValidationError("user_id required in header x-user-id or query param");
    }
    return userId;
  };

  /**
   * GET /api/friends
   * Получает список друзей пользователя
   */
  getFriends = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const friends = await this.friendsService.getFriends(userId);
    res.json({ friends });
  });

  /**
   * POST /api/friends/request
   * Отправляет запрос на дружбу
   */
  sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const { to_user_id, message } = req.body;

    if (!to_user_id) {
      throw new ValidationError("to_user_id is required");
    }

    const friend = await this.friendsService.sendFriendRequest(userId, {
      from_user_id: userId,
      to_user_id,
      message,
    });

    res.status(201).json(friend);
  });

  /**
   * POST /api/friends/:friendId/accept
   * Принимает запрос на дружбу
   */
  acceptFriendRequest = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const { friendId } = req.params;

    const friend = await this.friendsService.acceptFriendRequest(userId, friendId);
    res.json(friend);
  });

  /**
   * GET /api/friends/stats
   * Получает статистику друзей для сравнения
   */
  getFriendsStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const stats = await this.friendsService.getFriendsStats(userId);
    res.json({ stats });
  });

  /**
   * GET /api/friends/leaderboard
   * Получает лидерборд
   */
  getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await this.friendsService.getLeaderboard(limit);
    res.json({ leaderboard });
  });
}

