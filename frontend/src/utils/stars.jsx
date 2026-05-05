import { FaStar } from 'react-icons/fa';

/**
 * N estrellas completas (p. ej. testimonios según rating 1–5).
 * @param {number} count
 * @param {number} [max]
 */
export function StarsFilled({ count, max = 5 }) {
  const n = Math.max(0, Math.min(max, Math.floor(Number(count) || 0)));
  return Array.from({ length: n }).map((_, i) => <FaStar key={i} />);
}
