import pg from "pg";
import { retentionDays } from "../lib/retention.mjs";
const days = retentionDays(process.env.GLOBESECURE_POSITION_RETENTION_DAYS || "");
if (process.env.GLOBESECURE_PRUNE_ENABLED !== "true" || !days || !process.env.DATABASE_URL) {
  console.error("Purge refusée : DATABASE_URL, GLOBESECURE_PRUNE_ENABLED=true et rétention approuvée (1-365 jours) requis.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 5000 });
let removed = 0;
try {
  // Short bounded transactions prevent long locks during daily cleanup.
  for (let batch = 0; batch < 100; batch++) {
    const result = await pool.query(
      "DELETE FROM gs_positions WHERE id IN (SELECT id FROM gs_positions WHERE recorded_at < now() - ($1::integer * interval '1 day') ORDER BY recorded_at LIMIT 1000 FOR UPDATE SKIP LOCKED) RETURNING id",
      [days]);
    removed += result.rowCount;
    if (result.rowCount < 1000) break;
  }
  console.log("Positions supprimées selon la politique configurée : " + removed);
} catch (error) {
  console.error("Purge échouée. Examiner les migrations et les permissions DB.");
  process.exitCode = 1;
} finally { await pool.end(); }
