// src/services/storeIndent.service.js
import { getConnection } from "../config/db.js";
import oracledb from "oracledb";
import { getOrSetCache, deleteCache, cacheKeys, DEFAULT_TTL } from "./redisCache.js";

const DASHBOARD_FROM_DATE = "DATE '2025-04-01'";
const DASHBOARD_INDENT_WHERE = `
      t.entity_code = 'SR'
      AND t.vrdate >= ${DASHBOARD_FROM_DATE}
    `;
const DASHBOARD_PURCHASE_WHERE = `
      t.entity_code = 'SR'
      AND t.series = 'U3'
      AND t.qtycancelled IS NULL
      AND t.vrdate >= ${DASHBOARD_FROM_DATE}
      AND (
        (t.qtyorder - t.qtyexecute) = 0
        OR (t.qtyorder - t.qtyexecute) > t.qtyorder
      )
    `;
const DASHBOARD_ISSUE_WHERE = `
      t.entity_code = 'SR'
      AND t.vrdate >= ${DASHBOARD_FROM_DATE}
    `;
const DASHBOARD_STOCK_WHERE = `
      t.entity_code = 'SR'
      AND NVL(t.yrclqty_engine, 0) <= 0
      AND NVL(t.yropaqty, 0) > 0
      AND t.item_nature IN ('SI')
    `;

function toNumber(field) {
  const num = Number(field ?? 0);
  return Number.isFinite(num) ? num : 0;
}

/**
 * 🔹 Invalidate caches (call from controller after approve/create)
 */
export async function invalidateIndentCaches() {
  await Promise.all([
    deleteCache(cacheKeys.indentPending()),
    deleteCache(cacheKeys.indentHistory()),
    deleteCache(cacheKeys.indentDashboard()),
  ]);
}

/* ============================
   PENDING INDENTS (NO PAGINATION)
   ============================ */

export async function getPending() {
  return await getOrSetCache(
    cacheKeys.indentPending(),
    async () => {
      const conn = await getConnection();
      try {
        const baseWhere = `
          t.entity_code = 'SR'
          AND t.po_no IS NULL
          AND t.cancelleddate IS NULL
          AND t.vrdate >= DATE '2025-04-01'
        `;

        const sql = `
          SELECT
            t.lastupdate + INTERVAL '3' DAY AS plannedtimestamp,
            t.vrno AS indent_number,
            t.vrdate AS indent_date,
            t.indent_remark AS indenter_name,
            lhs_utility.get_name('div_code', t.div_code) AS division,
            UPPER(lhs_utility.get_name('dept_code', t.dept_code)) AS department,
            UPPER(t.item_name) AS item_name,
            t.um,
            t.qtyindent AS required_qty,
            t.purpose_remark AS remark,
            UPPER(t.remark) AS specification,
            lhs_utility.get_name('cost_code', t.cost_code) AS cost_project
          FROM view_indent_engine t
          WHERE ${baseWhere}
          ORDER BY t.vrdate ASC, t.vrno ASC
        `;

        const result = await conn.execute(sql, [], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        return result.rows || [];
      } finally {
        await conn.close();
      }
    },
    DEFAULT_TTL.INDENT
  );
}

/* ============================
   HISTORY INDENTS (NO PAGINATION)
   ============================ */

export async function getHistory() {
  return await getOrSetCache(
    cacheKeys.indentHistory(),
    async () => {
      const conn = await getConnection();
      try {
        const baseWhere = `
          t.entity_code = 'SR'
          AND t.po_no IS NOT NULL
          AND t.vrdate >= DATE '2025-04-01'
        `;

        const sql = `
          SELECT
            t.lastupdate + INTERVAL '3' DAY AS plannedtimestamp,
            t.vrno AS indent_number,
            t.vrdate AS indent_date,
            t.indent_remark AS indenter_name,
            lhs_utility.get_name('div_code', t.div_code) AS division,
            lhs_utility.get_name('dept_code', t.dept_code) AS department,
            UPPER(t.item_name) AS item_name,
            t.um,
            t.qtyindent AS required_qty,
            t.purpose_remark AS remark,
            UPPER(t.remark) AS specification,
            lhs_utility.get_name('cost_code', t.cost_code) AS cost_project,
            t.po_no,
            t.po_qty,
            t.cancelleddate,
            t.cancelled_remark
          FROM view_indent_engine t
          WHERE ${baseWhere}
          ORDER BY t.vrdate ASC, t.vrno ASC
        `;

        const result = await conn.execute(sql, [], {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        return result.rows || [];
      } finally {
        await conn.close();
      }
    },
    DEFAULT_TTL.INDENT
  );
}

export async function getDashboardMetrics() {
  return await getOrSetCache(
    cacheKeys.indentDashboard(),
    async () => {
      const conn = await getConnection();
  try {
    // Get status-based metrics (like housekeeping dashboard)
    const statusMetrics = await conn.execute(
      `
      SELECT
        COUNT(*) AS total_indents,
        COUNT(CASE WHEN t.po_no IS NOT NULL THEN 1 END) AS completed_indents,
        COUNT(CASE WHEN t.po_no IS NULL AND t.cancelleddate IS NULL THEN 1 END) AS pending_indents,
        COUNT(CASE WHEN t.po_no IS NULL AND t.cancelleddate IS NULL AND t.vrdate >= SYSDATE - 7 THEN 1 END) AS upcoming_indents,
        COUNT(CASE WHEN t.po_no IS NULL AND t.cancelleddate IS NULL AND t.vrdate < SYSDATE - 30 THEN 1 END) AS overdue_indents,
        NVL(SUM(NVL(t.qtyindent, 0)), 0) AS total_indented_qty
      FROM view_indent_engine t
      WHERE ${DASHBOARD_INDENT_WHERE}
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const statusData = statusMetrics.rows?.[0] || {};
    const totalIndents = toNumber(statusData.TOTAL_INDENTS);
    const completedIndents = toNumber(statusData.COMPLETED_INDENTS);
    const pendingIndents = toNumber(statusData.PENDING_INDENTS);
    const upcomingIndents = toNumber(statusData.UPCOMING_INDENTS);
    const overdueIndents = toNumber(statusData.OVERDUE_INDENTS);

    // Calculate overall progress percentages
    const overallProgress = totalIndents > 0 ? (completedIndents / totalIndents) * 100 : 0;
    const completedPercent = totalIndents > 0 ? (completedIndents / totalIndents) * 100 : 0;
    const pendingPercent = totalIndents > 0 ? (pendingIndents / totalIndents) * 100 : 0;
    const upcomingPercent = totalIndents > 0 ? (upcomingIndents / totalIndents) * 100 : 0;
    const overduePercent = totalIndents > 0 ? (overdueIndents / totalIndents) * 100 : 0;
    
    // Reuse statusMetrics for total_indented_qty, no need for separate query

    const purchaseSummary = await conn.execute(
      `
      SELECT
        COUNT(*) AS total_purchase_orders,
        NVL(SUM(NVL(t.qtyorder, 0)), 0) AS total_purchased_qty
      FROM view_order_engine t
      WHERE ${DASHBOARD_PURCHASE_WHERE}
    `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    let issuedTotal = 0;
    try {
      const issuedResult = await conn.execute(
        `
        SELECT
          NVL(SUM(NVL(t.qtyissue, 0)), 0) AS total_issued_qty
        FROM view_issue_engine t
        WHERE ${DASHBOARD_ISSUE_WHERE}
      `,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      issuedTotal = toNumber(issuedResult.rows?.[0]?.TOTAL_ISSUED_QTY);
    } catch (err) {
      console.warn("[getDashboardMetrics] issue summary failed:", err.message || err);
    }

    let outOfStockCount = 0;
    try {
      const stockResult = await conn.execute(
        `
        SELECT
          COUNT(*) AS out_of_stock_count
        FROM view_item_stock_engine t
        WHERE ${DASHBOARD_STOCK_WHERE}
      `,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      outOfStockCount = toNumber(stockResult.rows?.[0]?.OUT_OF_STOCK_COUNT);
    } catch (err) {
      console.warn("[getDashboardMetrics] stock summary failed:", err.message || err);
    }

    const topItemsResult = await conn.execute(
      `
      SELECT *
      FROM (
        SELECT
          UPPER(t.item_name) AS item_name,
          COUNT(*) AS order_count,
          NVL(SUM(NVL(t.qtyorder, 0)), 0) AS total_order_qty
        FROM view_order_engine t
        WHERE ${DASHBOARD_PURCHASE_WHERE}
        GROUP BY UPPER(t.item_name)
        ORDER BY total_order_qty DESC
      )
      WHERE ROWNUM <= 10
    `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const topVendorsResult = await conn.execute(
      `
      SELECT *
      FROM (
        SELECT
          lhs_utility.get_name('acc_code', t.acc_code) AS vendor_name,
      COUNT(DISTINCT t.vrno) AS unique_po_count,
          NVL(SUM(NVL(t.qtyorder, 0)), 0) AS total_items
        FROM view_order_engine t
        WHERE ${DASHBOARD_PURCHASE_WHERE}
        GROUP BY lhs_utility.get_name('acc_code', t.acc_code)
        ORDER BY unique_po_count DESC, total_items DESC
      )
      WHERE ROWNUM <= 10
    `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const purchaseRow = purchaseSummary.rows?.[0] ?? {};

    const metrics = {
      // Status-based metrics (like housekeeping dashboard)
      totalIndents: totalIndents,
      completedIndents: completedIndents,
      pendingIndents: pendingIndents,
      upcomingIndents: upcomingIndents,
      overdueIndents: overdueIndents,
      
      // Overall progress percentages
      overallProgress: Math.round(overallProgress * 10) / 10,
      completedPercent: Math.round(completedPercent * 10) / 10,
      pendingPercent: Math.round(pendingPercent * 10) / 10,
      upcomingPercent: Math.round(upcomingPercent * 10) / 10,
      overduePercent: Math.round(overduePercent * 10) / 10,
      
      // Quantity metrics
      totalIndentedQuantity: toNumber(statusData.TOTAL_INDENTED_QTY || 0),
      totalPurchaseOrders: toNumber(purchaseRow.TOTAL_PURCHASE_ORDERS),
      totalPurchasedQuantity: toNumber(purchaseRow.TOTAL_PURCHASED_QTY),
      totalIssuedQuantity: issuedTotal,
      outOfStockCount,
      topPurchasedItems: (topItemsResult.rows ?? []).map((row) => ({
        itemName: row.ITEM_NAME,
        orderCount: toNumber(row.ORDER_COUNT),
        totalOrderQty: toNumber(row.TOTAL_ORDER_QTY),
      })),
      topVendors: (topVendorsResult.rows ?? []).map((row) => ({
        vendorName: row.VENDOR_NAME,
        uniquePoCount: toNumber(row.UNIQUE_PO_COUNT),
        totalItems: toNumber(row.TOTAL_ITEMS),
      })),
    };

      return metrics;
    } finally {
      await conn.close();
    }
    },
    DEFAULT_TTL.DASHBOARD
  );
}
