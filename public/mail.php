<?php

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, bool $ok, string $message = ''): void {
    http_response_code($status);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $message]);
    exit;
}

function load_env_file(): array {
    $candidates = [__DIR__ . '/.env', dirname(__DIR__) . '/.env'];
    foreach ($candidates as $path) {
        if (!is_file($path)) continue;
        $values = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) continue;
            $position = strpos($line, '=');
            if ($position === false) continue;
            $key = trim(substr($line, 0, $position));
            $value = trim(substr($line, $position + 1));
            if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
                $value = substr($value, 1, -1);
            }
            $values[$key] = $value;
        }
        return $values;
    }
    respond(500, false, 'Server configuration error.');
}

function clean(string $value): string {
    return str_replace(["\r", "\n"], ' ', strip_tags(trim($value)));
}

function escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function valid_phone(string $phone): bool {
    return (bool) preg_match('/^\+?[\d\s()-]{8,20}$/', $phone);
}

function assert_same_site(array $env): void {
    $origin = trim($_SERVER['HTTP_ORIGIN'] ?? '');
    $referer = trim($_SERVER['HTTP_REFERER'] ?? '');
    $request_host = parse_url($origin ?: $referer, PHP_URL_HOST);
    $site_url = trim($env['NEXT_PUBLIC_SITE_URL'] ?? $env['SITE_URL'] ?? '');
    $allowed_host = parse_url($site_url, PHP_URL_HOST);
    if (!$allowed_host) {
        $allowed_host = explode(':', strtolower((string) ($_SERVER['HTTP_HOST'] ?? '')))[0];
    }
    if (!$request_host) respond(403, false, 'There was a problem with your submission.');
    $request_host = strtolower((string) $request_host);
    $allowed_host = strtolower((string) $allowed_host);
    $is_local = in_array($request_host, ['localhost', '127.0.0.1'], true);
    $is_allowed = $allowed_host !== '' && ($request_host === $allowed_host || $request_host === 'www.' . $allowed_host || 'www.' . $request_host === $allowed_host);
    if (!$is_local && !$is_allowed) respond(403, false, 'There was a problem with your submission.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Method not allowed.');
}

$env = load_env_file();
assert_same_site($env);

if (clean((string) ($_POST['website'] ?? '')) !== '') respond(200, true);

$name = clean((string) ($_POST['name'] ?? ''));
$phone = clean((string) ($_POST['phone'] ?? ''));
$email = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_SANITIZE_EMAIL);

if ($name === '' || $phone === '' || !valid_phone($phone)) {
    respond(400, false, 'Please enter a valid name and contact number.');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, false, 'Please enter a valid email address or leave it blank.');
}

$smtp_user = trim($env['SMTP_USER'] ?? '');
$smtp_pass = trim($env['SMTP_PASS'] ?? '');
$recipient = trim($env['MAIL_RECIPIENT'] ?? '');
$from_name = trim($env['MAIL_FROM_NAME'] ?? 'Sattva City');
if ($smtp_user === '' || $smtp_pass === '' || !filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    respond(500, false, 'Email is not configured on the server.');
}

require_once __DIR__ . '/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/SMTP.php';

function configure_mailer(array $env, string $from_name): PHPMailer\PHPMailer\PHPMailer {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->CharSet = 'UTF-8';
    $mail->isSMTP();
    $mail->Host = $env['SMTP_HOST'] ?? 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $env['SMTP_USER'];
    $mail->Password = $env['SMTP_PASS'];
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = (int) ($env['SMTP_PORT'] ?? 465);
    $mail->setFrom($env['SMTP_USER'], $from_name);
    $mail->isHTML(true);
    return $mail;
}

$safe_name = escape($name);
$safe_phone = escape($phone);
$safe_email = $email !== '' ? escape($email) : 'Not provided';
$owner_html = '<h2>New Sattva City enquiry</h2>'
    . '<p><strong>Full Name:</strong> ' . $safe_name . '</p>'
    . '<p><strong>Contact Number:</strong> ' . $safe_phone . '</p>'
    . '<p><strong>Email:</strong> ' . $safe_email . '</p>';
$owner_text = "New Sattva City enquiry\n\nFull Name: $name\nContact Number: $phone\nEmail: " . ($email ?: 'Not provided');

try {
    $owner = configure_mailer($env, $from_name);
    $owner->addAddress($recipient, $from_name . ' Team');
    if ($email !== '') $owner->addReplyTo($email, $name);
    $owner->Subject = 'New Sattva City Enquiry: ' . $name;
    $owner->Body = $owner_html;
    $owner->AltBody = $owner_text;
    $owner->send();
} catch (Throwable $error) {
    error_log('Sattva City owner email failed: ' . $error->getMessage());
    respond(500, false, 'Unable to send your enquiry. Please try again.');
}

if ($email !== '') {
    try {
        $confirmation = configure_mailer($env, $from_name);
        $confirmation->addAddress($email, $name);
        $confirmation->Subject = 'We received your Sattva City enquiry';
        $confirmation->Body = '<p>Hi ' . $safe_name . ',</p><p>Thank you for your interest in Sattva City. Our team will contact you shortly.</p><p>Regards,<br><strong>' . escape($from_name) . '</strong></p>';
        $confirmation->AltBody = "Hi $name,\n\nThank you for your interest in Sattva City. Our team will contact you shortly.\n\nRegards,\n$from_name";
        $confirmation->send();
    } catch (Throwable $error) {
        error_log('Sattva City confirmation email failed: ' . $error->getMessage());
    }
}

respond(200, true);
