export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // `exp` is in seconds, convert to milliseconds
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}