export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export function couponCode(): string {
  const block = (n: number) =>
    Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${block(4)}-${digits}`;
}
