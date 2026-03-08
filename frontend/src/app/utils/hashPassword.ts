export async function hashPassword(password: string): Promise<string> {
  const buffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-512', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}