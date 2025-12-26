// Unified routes index
import { Router } from "express";
import authRoutes from "./auth.routes.js";

// Store routes (Oracle-backed)
import storeIndentRoutes from "./storeIndent.routes.js";
import vendorRateUpdateRoutes from "./vendorRateUpdate.routes.js";
import threePartyApprovalRoutes from "./threePartyApproval.routes.js";
import poRoutes from "./po.routes.js";
import healthRoutes from "./health.routes.js";
import itemRoutes from "./item.routes.js";
import uomRoutes from "./uom.routes.js";
import costLocationRoutes from "./costLocation.routes.js";
import stockRoutes from "./stockRoutes.js";
import repairGatePassRoutes from "./repairGatePass.routes.js";

// Repair/PostgreSQL routes (require PG connection)
import indentRoutes from "./indent.routes.js";
import dashboardRoutes from "./dashboardRoutes.js";

const router = Router();

// Authentication routes (unified login)
router.use("/auth", authRoutes);

router.use("/store-indent", storeIndentRoutes);
router.use("/vendor-rate-update", vendorRateUpdateRoutes);
router.use("/three-party-approval", threePartyApprovalRoutes);
router.use("/po", poRoutes);
router.use("/health", healthRoutes);
router.use("/items", itemRoutes);
router.use("/uom", uomRoutes);
router.use("/cost-location", costLocationRoutes);
router.use("/stock", stockRoutes);
router.use("/repair-gate-pass", repairGatePassRoutes);

// Repair/PostgreSQL routes (require PG connection)
router.use("/indent", indentRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;





