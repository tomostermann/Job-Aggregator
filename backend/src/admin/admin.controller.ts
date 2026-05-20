import { Request, Response } from "express";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  deleteOffer,
  moderateOffer,
  getAdminStats,
} from "./admin.service";

export const getUsersController = async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRoleController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const user = await updateUserRole(req.params.id, req.body.role);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteUserController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const currentUserId = (req as any).user?.id as string | undefined;
    if (currentUserId && currentUserId === req.params.id) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
    }
    await deleteUser(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteOfferController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    await deleteOffer(req.params.id);
    res.status(200).json({ message: "Offer deleted" });
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const moderateOfferController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const offer = await moderateOffer(req.params.id, req.body.status);
    res.status(200).json(offer);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getStatsController = async (req: Request, res: Response) => {
  try {
    const monthsParam = req.query.months;
    const months =
      typeof monthsParam === "string" && /^\d+$/.test(monthsParam)
        ? parseInt(monthsParam, 10)
        : 12;
    const stats = await getAdminStats(months);
    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
