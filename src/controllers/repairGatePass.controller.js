// controllers/repairGatePass.controller.js
import {
  getPendingRepairGatePass,
  getReceivedRepairGatePass,
  getRepairGatePassCounts,
} from "../services/repairGatePass.service.js";

export async function getPending(req, res) {
  try {
    const rows = await getPendingRepairGatePass();
    return res.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("getPending error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch pending repair gate pass",
    });
  }
}

export async function getReceived(req, res) {
  try {
    const rows = await getReceivedRepairGatePass();
    return res.json({
      success: true,
      data: rows,
      total: rows.length,
    });
  } catch (error) {
    console.error("getReceived error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch received repair gate pass",
    });
  }
}

export async function getCounts(req, res) {
  try {
    const counts = await getRepairGatePassCounts();
    return res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("getCounts error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch repair gate pass counts",
    });
  }
}



