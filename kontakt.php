<?php
/* =========================================================
   AMW — Kontaktformular
   ---------------------------------------------------------
   Versand über authentifiziertes SMTP (nicht über mail()).
   PHPs mail() meldet auf Shared Hosting oft Erfolg, ohne dass
   die Nachricht wirklich zugestellt wird — SMTP mit Login
   funktioniert zuverlässig.
   ========================================================= */

declare(strict_types=1);

/* ---------------------------------------------------------
   >>> HIER EINTRAGEN <<<
   Das Passwort ist dasselbe, mit dem Sie sich bei
   info@amwagence.de im Webmail anmelden.
   --------------------------------------------------------- */
const SMTP_PASS = 'HIER-IHR-E-MAIL-PASSWORT-EINTRAGEN';

/* --- Ab hier muss nichts mehr geändert werden ------------- */
const SMTP_HOST = 'smtp.hostinger.com';
const SMTP_PORT = 465;                    // 465 = SSL
const SMTP_USER = 'info@amwagence.de';    // Postfach = Absender
const MAIL_TO   = 'info@amwagence.de';    // hierhin gehen die Anfragen
const SITE_NAME = 'AMW';

/* ---------------------------------------------------------
   Antwortformat
   --------------------------------------------------------- */
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

/* ---------------------------------------------------------
   Minimaler SMTP-Client
   --------------------------------------------------------- */
function smtpLine($fp): string
{
    $data = '';
    while (($line = fgets($fp, 515)) !== false) {
        $data .= $line;
        // Mehrzeilige Antworten enden mit "250 " statt "250-"
        if (strlen($line) < 4 || $line[3] === ' ') break;
    }
    return $data;
}

function smtpCmd($fp, string $cmd, string $expect, ?string &$err): bool
{
    if ($cmd !== '') fwrite($fp, $cmd . "\r\n");
    $res = smtpLine($fp);
    if (strncmp($res, $expect, strlen($expect)) !== 0) {
        $err = trim($res) !== '' ? trim($res) : 'keine Antwort vom Mailserver';
        return false;
    }
    return true;
}

function smtpSend(string $subject, string $body, string $replyName, string $replyMail, ?string &$err): bool
{
    $fp = @stream_socket_client(
        'ssl://' . SMTP_HOST . ':' . SMTP_PORT,
        $errno, $errstr, 20,
        STREAM_CLIENT_CONNECT,
        stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]])
    );
    if (!$fp) {
        $err = 'Verbindung zu ' . SMTP_HOST . ' fehlgeschlagen (' . $errstr . ')';
        return false;
    }
    stream_set_timeout($fp, 20);

    $ok = smtpCmd($fp, '', '220', $err)
       && smtpCmd($fp, 'EHLO amwagence.de', '250', $err)
       && smtpCmd($fp, 'AUTH LOGIN', '334', $err)
       && smtpCmd($fp, base64_encode(SMTP_USER), '334', $err)
       && smtpCmd($fp, base64_encode(SMTP_PASS), '235', $err)
       && smtpCmd($fp, 'MAIL FROM:<' . SMTP_USER . '>', '250', $err)
       && smtpCmd($fp, 'RCPT TO:<' . MAIL_TO . '>', '250', $err)
       && smtpCmd($fp, 'DATA', '354', $err);

    if (!$ok) { @fclose($fp); return false; }

    $headers = 'From: ' . SITE_NAME . ' Website <' . SMTP_USER . ">\r\n"
             . 'To: <' . MAIL_TO . ">\r\n"
             . 'Reply-To: ' . $replyName . ' <' . $replyMail . ">\r\n"
             . 'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n"
             . 'Date: ' . date('r') . "\r\n"
             . "MIME-Version: 1.0\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n"
             . "Content-Transfer-Encoding: 8bit\r\n";

    // Zeilen, die mit einem Punkt beginnen, müssen verdoppelt werden
    $safeBody = preg_replace('/^\./m', '..', str_replace("\n", "\r\n", $body));

    fwrite($fp, $headers . "\r\n" . $safeBody . "\r\n.\r\n");
    $sent = smtpCmd($fp, '', '250', $err);

    @fwrite($fp, "QUIT\r\n");
    @fclose($fp);
    return $sent;
}

/* ---------------------------------------------------------
   Anfrage verarbeiten
   --------------------------------------------------------- */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Diese Seite nimmt nur Formularanfragen entgegen.');
}

/* Spam-Falle: unsichtbares Feld muss leer bleiben */
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(200, true, 'Danke! Ihre Anfrage ist eingegangen.');
}

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

$errors = [];
if ($name === '') { $errors[] = 'Bitte geben Sie Ihren Namen an.'; }
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse an.';
}
if ($budget === '') { $errors[] = 'Bitte wählen Sie ein Budget aus.'; }
if ($errors) { respond(422, false, implode(' ', $errors)); }

if (SMTP_PASS === 'HIER-IHR-E-MAIL-PASSWORT-EINTRAGEN' || SMTP_PASS === '') {
    respond(500, false, 'Der Mailversand ist noch nicht eingerichtet. '
        . 'Bitte schreiben Sie uns direkt an ' . MAIL_TO . '.');
}

$subject = 'Neue Anfrage über amwagence.de — ' . $name;
$body = "Neue Anfrage über das Kontaktformular\n"
      . str_repeat('=', 40) . "\n\n"
      . "Name:        {$name}\n"
      . "E-Mail:      {$email}\n"
      . 'Unternehmen: ' . ($company !== '' ? $company : '—') . "\n"
      . "Budget:      {$budget}\n\n"
      . "Nachricht:\n" . ($message !== '' ? $message : '—') . "\n\n"
      . str_repeat('-', 40) . "\n"
      . 'Gesendet: ' . date('d.m.Y H:i:s') . "\n"
      . 'IP:       ' . ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt') . "\n";

$err = null;
if (!smtpSend($subject, $body, $name, $email, $err)) {
    error_log('AMW Kontaktformular — SMTP: ' . (string)$err);
    respond(500, false, 'Die Anfrage konnte gerade nicht gesendet werden. '
        . 'Bitte schreiben Sie uns direkt an ' . MAIL_TO . '.');
}

respond(200, true, 'Danke! Ihre Anfrage ist eingegangen — wir melden uns in Kürze.');
