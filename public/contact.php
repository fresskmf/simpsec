<?php
// contact.php

// Only process POST requests.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(403);
  echo "There was a problem with your submission, please try again.";
  exit;
}

// --- Config ---
$recipient = "support@simpsec.org"; // <-- change if needed
$siteDomain = $_SERVER['SERVER_NAME'] ?? 'simpsec.org';
$fromEmail  = "no-reply@" . preg_replace('/^www\./', '', $siteDomain);
$fromName   = "SimpSec Website";

// --- Helpers ---
function is_ajax_request(): bool {
  return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
         strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

function respond($ok, $message, $httpCode = 200) {
  http_response_code($httpCode);

  if (is_ajax_request()) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
      "ok" => (bool)$ok,
      "message" => (string)$message
    ]);
  } else {
    echo $message;
  }
  exit;
}

// --- Read & sanitize inputs ---
$name    = isset($_POST["name"]) ? trim($_POST["name"]) : "";
$phone   = isset($_POST["phone"]) ? trim($_POST["phone"]) : "";
$email   = isset($_POST["email"]) ? trim($_POST["email"]) : "";
$subject = isset($_POST["subject"]) ? trim($_POST["subject"]) : "General Inquiry";
$message = isset($_POST["message"]) ? trim($_POST["message"]) : "";

// Basic cleanup
$name = strip_tags($name);
$name = str_replace(["\r", "\n"], " ", $name);
$subject = strip_tags($subject);
$subject = str_replace(["\r", "\n"], " ", $subject);
$phone = strip_tags($phone);

// --- Validate required fields ---
if ($name === "" || $message === "" || $email === "") {
  respond(false, "Please complete your name, email, and message.", 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  respond(false, "Please enter a valid email address.", 422);
}

// Simple anti-header-injection for email field
if (preg_match("/[\r\n]/", $email)) {
  respond(false, "Invalid email address.", 422);
}

// --- Build email ---
$emailSubject = "SimpSec Contact: {$subject} — {$name}";

$emailBody  = "New contact form submission\n";
$emailBody .= "----------------------------------------\n";
$emailBody .= "Name:    {$name}\n";
$emailBody .= "Email:   {$email}\n";
$emailBody .= "Phone:   " . ($phone !== "" ? $phone : "(not provided)") . "\n";
$emailBody .= "Subject: {$subject}\n";
$emailBody .= "----------------------------------------\n\n";
$emailBody .= $message . "\n";

// Headers: use site email as From (better deliverability), user as Reply-To
$headers = [];
$headers[] = "From: {$fromName} <{$fromEmail}>";
$headers[] = "Reply-To: {$name} <{$email}>";
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-Type: text/plain; charset=utf-8";

$headersString = implode("\r\n", $headers);

// --- Send ---
$sent = @mail($recipient, $emailSubject, $emailBody, $headersString);

if ($sent) {
  respond(true, "Thank you! Your message has been sent.", 200);
}

respond(false, "Oops! Something went wrong and we couldn't send your message. Please try again later.", 500);
