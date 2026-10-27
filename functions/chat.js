export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Não repassa chave do cliente. Usa chave do servidor (env) quando disponível.
  const serverKey = process.env.OPENAI_API_KEY;
  const authHeader = serverKey ? `Bearer ${serverKey}` : (event.headers.authorization || event.headers.Authorization);

  if (!authHeader) {
    return { statusCode: 401, body: JSON.stringify({ error: { message: 'API Key ausente' } }) };
  }

  // Valida body JSON e limita tamanho
  let body = event.body;
  if (body && typeof body !== 'string') body = JSON.stringify(body);
  if (body && body.length > 50000) {
    return { statusCode: 413, body: JSON.stringify({ error: { message: 'Payload muito grande' } }) };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: body,
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/event-stream',
      },
      body: text,
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: 'Erro interno' } }) };
  }
};
