/**
 * In-memory user store for local/dev auth when backend returns 401 or is unavailable.
 * Use LOCAL_AUTH=true to enable.
 */

const users = new Map<string, string>(); // email -> hashed password (we store plain for demo only)

export function localAuthAdd(email: string, password: string): void {
  users.set(email.toLowerCase().trim(), password);
}

export function localAuthCheck(email: string, password: string): boolean {
  const stored = users.get(email.toLowerCase().trim());
  return stored === password;
}
