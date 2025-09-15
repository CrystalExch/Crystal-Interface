export function toXUrl(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();
  if (s.startsWith('http')) {
    const u = new URL(s);
    if (/twitter\.com$/i.test(u.hostname)) u.hostname = 'x.com';
    return u.toString();
  }
  const user = s.startsWith('@') ? s.slice(1) : s;
  return `https://x.com/${user}`;
}
