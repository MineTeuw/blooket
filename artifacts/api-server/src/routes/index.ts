import { Router, type IRouter } from "express";
import healthRouter from "./health";
import blooketRouter from "./blooket";

const router: IRouter = Router();

router.use(healthRouter);
router.use(blooketRouter);

export default router;
