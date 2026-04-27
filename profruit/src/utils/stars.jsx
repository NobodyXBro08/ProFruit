import { FaStar, FaRegStar } from 'react-icons/fa';

/** Valoración visual fija para tarjetas de catálogo (4 llenas + 1 vacía). */
export function CatalogProductStars() {
  return Array.from({ length: 5 }).map((_, idx) =>
    idx < 4 ? <FaStar key={idx} /> : <FaRegStar key={idx} />,
  );
}

/**
 * N estrellas completas (p. ej. testimonios según rating 1–5).
 * @param {number} count
 * @param {number} [max]
 */
export function StarsFilled({ count, max = 5 }) {
  const n = Math.max(0, Math.min(max, Math.floor(Number(count) || 0)));
  return Array.from({ length: n }).map((_, i) => <FaStar key={i} />);
}
