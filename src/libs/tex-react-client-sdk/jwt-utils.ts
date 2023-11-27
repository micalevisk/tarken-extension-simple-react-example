const atob = window.atob.bind(window);

/**
 * A utitlity to parse a JWT token and return the payload as a JSON object.
 * Note that this does not perform any validation of the token, just decodes it.
 */
export function parseJwt(token: string): Record<string, unknown> | undefined {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  try {
    return JSON.parse(jsonPayload);
  } catch {
    return undefined;
  }
}
