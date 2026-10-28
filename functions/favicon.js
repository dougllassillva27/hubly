import { neon } from '@neondatabase/serverless';

export const handler = async (event) => {
  const method = event.httpMethod;
  const token = event.headers['x-sync-token'];

  if (!token || token.length < 16) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Token obrigatório (min 16 chars)' }) };
  }

  if (!process.env.DATABASE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DATABASE_URL não configurada' }) };
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    if (method === 'GET') {
      const rows = await sql`SELECT domain, favicon_url FROM solhub_favicons`;
      const favicons = {};
      rows.forEach((row) => {
        favicons[row.domain] = row.favicon_url;
      });
      return { statusCode: 200, body: JSON.stringify({ favicons }) };
    }

    if (method === 'POST') {
      const raw = event.body || '';
      if (raw.length > 64 * 1024) {
        return { statusCode: 413, body: JSON.stringify({ error: 'Payload muito grande' }) };
      }
      const { domain, favicon_url } = JSON.parse(raw);
      if (!domain || !favicon_url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'domain e favicon_url obrigatórios' }) };
      }
      try {
        const u = new URL(favicon_url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad');
      } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'favicon_url inválida' }) };
      }
      await sql`
        INSERT INTO solhub_favicons (domain, favicon_url, updated_at)
        VALUES (${domain}, ${favicon_url}, NOW())
        ON CONFLICT (domain)
        DO UPDATE SET favicon_url = EXCLUDED.favicon_url, updated_at = NOW()
      `;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (method === 'DELETE') {
      const domain = event.queryStringParameters?.domain;
      if (!domain) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro domain obrigatório' }) };
      }
      await sql`DELETE FROM solhub_favicons WHERE domain = ${domain}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Método não permitido' };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno' }) };
  }
};
