/** Cabeceras CORS para API pública (Netlify, etc.). */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function corsOptionsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Respuesta JSON con CORS (equivalente a Response.json + cabeceras). */
export function corsJson(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
