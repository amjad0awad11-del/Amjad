/**
 * Übersetzt Fehler der APIs in Sätze, mit denen man etwas anfangen kann.
 *
 * Die Rohmeldungen sind für Entwickler geschrieben („Could not resolve
 * authentication method…"). In der Oberfläche landen sie aber vor jemandem,
 * der nur wissen will, was jetzt zu tun ist.
 */

export function humanError(err) {
  const raw = String(err?.message ?? err ?? 'Unknown error');
  const status = err?.status ?? err?.statusCode;

  if (/could not resolve authentication|missing.*api.?key|api.?key.*(missing|empty)/i.test(raw)) {
    return 'No Anthropic key is configured. Put ANTHROPIC_API_KEY in server/.env and restart the service.';
  }
  if (status === 401 || status === 403 || /authentication_error|invalid.*api.?key|permission_error/i.test(raw)) {
    return 'The Anthropic key was rejected. Check it in server/.env — it may be revoked or copied incompletely.';
  }
  if (/credit balance|insufficient|billing|quota/i.test(raw)) {
    return 'The account is out of credit. Top it up at console.anthropic.com under Billing.';
  }
  if (status === 429 || /rate.?limit/i.test(raw)) {
    return 'Too many requests in a short time. Wait a moment and try again.';
  }
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|fetch failed/i.test(raw)) {
    return 'Cannot reach the API. Check the internet connection.';
  }
  // „Please run /login" ist ein Rat für die Kommandozeile von Claude Code.
  // Wer J.A.R.V.I.S. im Browser benutzt, hat kein solches Fenster - für ihn
  // heisst dieselbe Lage schlicht: der Schlüssel kommt nicht an.
  if (/not logged in|run \/login|login expired|oauth token revoked/i.test(raw)) {
    return 'The agent could not sign in. Your key did not reach it: check that '
      + 'ANTHROPIC_API_KEY is in server/.env and restart the service.';
  }
  if (/claude code|executable|spawn|ENOENT/i.test(raw)) {
    return `The agent could not start (${raw.slice(0, 120)}). Did "npm install --prefix server" complete?`;
  }
  return raw.slice(0, 300);
}
