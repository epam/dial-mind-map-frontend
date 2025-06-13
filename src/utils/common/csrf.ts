export function getCsrfToken(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
