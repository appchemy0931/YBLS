const API_BASE = import.meta.env.VITE_API_URL || '/api';
const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function imageUrl(src?: string): string {
  if (!src) return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
  if (src.startsWith('/uploads/')) return `${SERVER_ORIGIN}${src}`;
  return src;
}
