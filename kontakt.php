<?php
/* =========================================================
   AMW — Kontaktformular
   Nimmt die Anfrage entgegen und schickt sie an das Postfach.
   Antwortet als JSON, wenn per fetch() aufgerufen, sonst als
   einfache HTML-Seite (Formular ohne JavaScript).
   ========================================================= */

declare(strict_types=1);

const MAIL_TO   = 'info@amwagence.de';
const MAIL_FROM = 'info@amwagence.de';   // muss eine Adresse dieser Domain sein
const SITE_NAME = 'AMW';

/* --- Wie soll geantwortet werden? ------------------------ */
$wantsJson = (
    (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'fetch')
    || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
);

function respond(int $status, bool $ok, string $message): void
{
    global $wantsJson;
    http_response_code($status);

    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<title>' . ($ok ? 'Danke' : 'Fehler') . ' — ' . SITE_NAME . '</title>'
       . '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;'
       . 'background:#05060c;color:#eef0f7;font:16px/1.6 system-ui,sans-serif;padding:24px}'
       . 'div{max-width:32rem;text-align:center}a{color:#22d3ee}</style></head><body><div>'
       . '<p>' . $safe . '</p><p><a href="index.html">Zurück zur Startseite</a></p>'
       . '</div></body></html>';
    exit;
}

/* --- Nur POST -------------------------------------------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Diese Seite nimmt nur Formularanfragen entgegen.');
}

/* --- Spam-Falle: unsichtbares Feld muss leer bleiben ------ */
if (trim((string)($_POST['website'] ?? '')) !== '') {
    // Bots füllen es aus. Freundlich abnicken, aber nichts senden.
    respond(200, true, 'Danke! Ihre Anfrage ist eingegangen.');
}

/* --- Eingaben einsammeln --------------------------------- */
$clean = static function (string $key, int $max = 500): string {
    $v = (string)($_POST[$key] ?? '');
    $v = str_replace(["\r", "\n", "\0"], ' ', trim($v));   // Header-Injection
    return mb_substr($v, 0, $max);
};

$name    = $clean('name', 120);
$email   = $clean('email', 200);
$company = $clean('company', 160);
$budget  = $clean('budget', 80);
$message = mb_substr(trim(str_replace("\0", '', (string)($_POST['message'] ?? ''))), 0, 5000);

/* --- Pflichtfelder prüfen -------------------------------- */
$errors = [];
if ($name === '')                                   { $errors[] = 'Bitte geben Sie Ihren Namen an.'; }
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                                                      $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.'; }
if ($budget === '')                                 { $errors[] = 'Bitte wählen Sie ein Budget aus.'; }

if ($errors) {
    respond(422, false, implode(' ', $errors));
}

/* --- Mail bauen ------------------------------------------ */
$subject = 'Neue Anfrage über amwagence.de — ' . $name;

$body = "Neue Anfrage über das Kontaktformular\n"
      . str_repeat('=', 40) . "\n\n"
      . "Name:       {$name}\n"
      . "E-Mail:     {$email}\n"
      . "Unternehmen:" . ($company !== '' ? " {$company}" : ' —') . "\n"
      . "Budget:     {$budget}\n\n"
      . "Nachricht:\n" . ($message !== '' ? $message : '—') . "\n\n"
      . str_repeat('-', 40) . "\n"
      . 'Gesendet: ' . date('d.m.Y H:i:s') . "\n"
      . 'IP:       ' . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n";

$headers = [
    'From: ' . SITE_NAME . ' Website <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',   // Antwort geht direkt an den Interessenten
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail(
    MAIL_TO,
    '=?UTF-8?B?' . base64_encode($subject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . MAIL_FROM
);

if (!$sent) {
    respond(500, false, 'Die Anfrage konnte gerade nicht gesendet werden. '
        . 'Bitte schreiben Sie uns direkt an ' . MAIL_TO . '.');
}

respond(200, true, 'Danke! Ihre Anfrage ist eingegangen — wir melden uns in Kürze.');
