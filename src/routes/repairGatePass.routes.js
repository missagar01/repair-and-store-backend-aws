// routes/repairGatePass.routes.js
import express from "express";
import {
  getPending,
  getReceived,
  getCounts,
} from "../controllers/repairGatePass.controller.js";

const router = express.Router();

router.get("/pending", getPending);
router.get("/received", getReceived);
router.get("/history", getReceived); // Alias for received
router.get("/counts", getCounts);

export default router;



