/**
 * Übersetzt Fehler der APIs in Sätze, mit denen man etwas anfangen kann.
 *
 * Die Rohmeldungen sind für Entwickler geschrieben („Could not resolve
 * authentication method…"). In der Oberfläche landen sie aber vor jemandem,
 * der nur wissen will, was jetzt zu tun ist.
 */

export function humanError(err) {
  const raw = String(err?.message ?? err ?? 'Unbekannter Fehler');
  const status = err?.status ?? err?.statusCode;

  if (/could not resolve authentication|missing.*api.?key|api.?key.*(missing|empty)/i.test(raw)) {
    return 'Es ist kein Anthropic-Schlüssel hinterlegt. Trage ANTHROPIC_API_KEY in server/.env ein und starte den Dienst neu.';
  }
  if (status === 401 || status === 403 || /authentication_error|invalid.*api.?key|permission_error/i.test(raw)) {
    return 'Der Anthropic-Schlüssel wurde abgelehnt. Prüfe ihn in server/.env — vielleicht ist er widerrufen oder falsch kopiert.';
  }
  if (/credit balance|insufficient|billing|quota/i.test(raw)) {
    return 'Das Guthaben reicht nicht. Unter console.anthropic.com → Billing aufladen.';
  }
  if (status === 429 || /rate.?limit/i.test(raw)) {
    return 'Zu viele Anfragen in kurzer Zeit. Einen Moment warten und noch einmal versuchen.';
  }
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|network|fetch failed/i.test(raw)) {
    return 'Keine Verbindung zur API. Internetverbindung prüfen.';
  }
  if (/claude code|executable|spawn|ENOENT/i.test(raw)) {
    return `Der Agent konnte nicht starten (${raw.slice(0, 120)}). Läuft "npm install --prefix server" durch?`;
  }
  return raw.slice(0, 300);
}
