// Shim ESM: @neondatabase/serverless sobre pg padrão (Postgres comum, não Neon).
// Mantém a API tagged-template `sql`... usada nas functions originais.
import pg from 'pg';

const { Pool } = pg;
let pool = null;

function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return pool;
}

function sql(strings, ...values) {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1];
  }
  return getPool().query({ text, values }).then((result) => result.rows);
}

export const neon = () => sql;
export { sql };
