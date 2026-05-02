import Link from "next/link";

/**
 * Raíz del servicio en producción (Railway, etc.): evita 404 en GET "/" y da un punto
 * de comprobación humana además de /api/health.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">ProFruit API</h1>
      <p className="text-neutral-600">
        Este despliegue expone la API bajo <code className="rounded bg-neutral-100 px-1">/api/*</code>. El sitio
        público vive en Netlify.
      </p>
      <p>
        <Link href="/api/health" className="text-blue-600 underline">
          GET /api/health
        </Link>
      </p>
    </div>
  );
}
