export function readStored(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
  catch { return null; }
}

export function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Private browsing and full storage still allow in-memory use. */ }
}
