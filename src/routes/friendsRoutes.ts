import { Router } from "express";
import { friendsController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(friendsController.getFriends));
router.post("/request", asyncHandler(friendsController.sendFriendRequest));
router.post("/:friendId/accept", asyncHandler(friendsController.acceptFriendRequest));
router.get("/stats", asyncHandler(friendsController.getFriendsStats));
router.get("/leaderboard", asyncHandler(friendsController.getLeaderboard));

export default router;

