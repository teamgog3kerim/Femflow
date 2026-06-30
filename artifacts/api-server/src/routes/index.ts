import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import cyclesRouter from "./cycles.js";
import healthLogsRouter from "./health-logs.js";
import aiChatRouter from "./ai-chat.js";
import educationRouter from "./education.js";
import subscriptionsRouter from "./subscriptions.js";
import analyticsRouter from "./analytics.js";
import notificationsRouter from "./notifications.js";
import adminRouter from "./admin.js";
import storageRouter from "./storage.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(cyclesRouter);
router.use(healthLogsRouter);
router.use(aiChatRouter);
router.use(educationRouter);
router.use(subscriptionsRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(adminRouter);

export default router;
