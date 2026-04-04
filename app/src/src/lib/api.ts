const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export function api(path: string) {
  return `${BASE}${path}`;
}
