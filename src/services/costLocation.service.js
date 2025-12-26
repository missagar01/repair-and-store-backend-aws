// src/services/costLocation.service.js
import { getConnection } from "../config/db.js";
import oracledb from "../config/oracleClient.js";
import { getOrSetCache, cacheKeys, DEFAULT_TTL } from "./redisCache.js";

export async function getCostLocationsService(divCode = null) {
  try {
    // Default to SM if no divCode provided
    const divisionCode = divCode || 'SM';
    const cacheKey = `costlocation:${divisionCode}`;

    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const conn = await getConnection();
        try {
          // Build query based on division code (SM, RP, PM, or CO)
          // Query format: WHERE ENTITY_CODE = 'SR' AND (DIV_CODE IS NULL OR DIV_CODE = :divCode)
          // Supports: SM, RP, PM, CO divisions
          const sql = `
            SELECT DISTINCT t.COST_NAME
            FROM view_cost_mast t
            WHERE t.ENTITY_CODE = 'SR'
              AND (t.DIV_CODE IS NULL OR t.DIV_CODE = :divCode)
            ORDER BY t.COST_NAME
          `;
          
          const binds = { divCode: divisionCode };

          const result = await conn.execute(sql, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });

          return result.rows || [];
        } finally {
          if (conn) {
            try {
              await conn.close();
            } catch (closeErr) {
              console.error("Error closing Oracle connection:", closeErr);
            }
          }
        }
      },
      1800 // Cache for 30 minutes (cost locations don't change often)
    );

    return {
      ok: true,
      rows: result || [],
    };
  } catch (err) {
    console.error("getCostLocationsService error:", err);
    return {
      ok: false,
      error: err.message || "Oracle query failed",
    };
  }
}

// Get Cost Locations for RP Division
export async function getCostLocationsRP() {
  try {
    const cacheKey = "costlocation:RP";
    
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const conn = await getConnection();
        try {
          const sql = `
            SELECT DISTINCT t.COST_NAME
            FROM view_cost_mast t
            WHERE t.ENTITY_CODE = 'SR'
              AND (t.DIV_CODE IS NULL OR t.DIV_CODE = 'RP')
            ORDER BY t.COST_NAME
          `;

          const result = await conn.execute(sql, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });

          return result.rows || [];
        } finally {
          if (conn) {
            try {
              await conn.close();
            } catch (closeErr) {
              console.error("Error closing Oracle connection:", closeErr);
            }
          }
        }
      },
      1800 // Cache for 30 minutes
    );

    return {
      ok: true,
      rows: result || [],
    };
  } catch (err) {
    console.error("getCostLocationsRP error:", err);
    return {
      ok: false,
      error: err.message || "Oracle query failed",
    };
  }
}

// Get Cost Locations for PM Division
export async function getCostLocationsPM() {
  try {
    const cacheKey = "costlocation:PM";
    
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const conn = await getConnection();
        try {
          const sql = `
            SELECT DISTINCT t.COST_NAME
            FROM view_cost_mast t
            WHERE t.ENTITY_CODE = 'SR'
              AND (t.DIV_CODE IS NULL OR t.DIV_CODE = 'PM')
            ORDER BY t.COST_NAME
          `;

          const result = await conn.execute(sql, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });

          return result.rows || [];
        } finally {
          if (conn) {
            try {
              await conn.close();
            } catch (closeErr) {
              console.error("Error closing Oracle connection:", closeErr);
            }
          }
        }
      },
      1800 // Cache for 30 minutes
    );

    return {
      ok: true,
      rows: result || [],
    };
  } catch (err) {
    console.error("getCostLocationsPM error:", err);
    return {
      ok: false,
      error: err.message || "Oracle query failed",
    };
  }
}

// Get Cost Locations for CO Division (DIV_CODE IS NULL only)
export async function getCostLocationsCO() {
  try {
    const cacheKey = "costlocation:CO";
    
    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const conn = await getConnection();
        try {
          const sql = `
            SELECT DISTINCT t.COST_NAME
            FROM view_cost_mast t
            WHERE t.ENTITY_CODE = 'SR'
              AND t.DIV_CODE IS NULL
            ORDER BY t.COST_NAME
          `;

          const result = await conn.execute(sql, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
          });

          return result.rows || [];
        } finally {
          if (conn) {
            try {
              await conn.close();
            } catch (closeErr) {
              console.error("Error closing Oracle connection:", closeErr);
            }
          }
        }
      },
      1800 // Cache for 30 minutes
    );

    return {
      ok: true,
      rows: result || [],
    };
  } catch (err) {
    console.error("getCostLocationsCO error:", err);
    return {
      ok: false,
      error: err.message || "Oracle query failed",
    };
  }
}

