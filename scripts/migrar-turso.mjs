import { createClient } from "@libsql/client";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, "../dev.db");

const TURSO_URL   = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("❌  Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN antes de rodar.");
  process.exit(1);
}

const local = new Database(DB_PATH, { readonly: true });
const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// Tabelas a migrar (ordem respeitando foreign keys)
const TABELAS = [
  "Estrategia", "Tema", "Microtema", "Conteudo",
  "Tendencia", "CampanhaTrafego", "ConfigIA", "LogIA",
];

let total = 0;
for (const tabela of TABELAS) {
  let rows;
  try {
    rows = local.prepare(`SELECT * FROM "${tabela}"`).all();
  } catch {
    console.log(`⚠️  ${tabela}: tabela não encontrada, pulando.`);
    continue;
  }

  if (rows.length === 0) {
    console.log(`   ${tabela}: vazia.`);
    continue;
  }

  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => "?").join(", ");
  const colsStr = cols.map((c) => `"${c}"`).join(", ");
  const sql = `INSERT OR IGNORE INTO "${tabela}" (${colsStr}) VALUES (${placeholders})`;

  let ok = 0;
  for (const row of rows) {
    const args = cols.map((c) => {
      const v = row[c];
      // boolean integers → mantém como número
      return v === null ? null : v;
    });
    try {
      await turso.execute({ sql, args });
      ok++;
    } catch (e) {
      console.error(`   ✗ ${tabela} id=${row.id}: ${e.message}`);
    }
  }
  console.log(`✅  ${tabela}: ${ok}/${rows.length} registros migrados.`);
  total += ok;
}

console.log(`\n🎉  Migração concluída — ${total} registros no total.`);
process.exit(0);
