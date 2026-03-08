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
$name            = isset($_POST["name"])             ? trim($_POST["name"])             : "";
$phone           = isset($_POST["phone"])            ? trim($_POST["phone"])            : "";
$email           = isset($_POST["email"])            ? trim($_POST["email"])            : "";
$company         = isset($_POST["company"])          ? trim($_POST["company"])          : "";
$contract_number = isset($_POST["contract_number"])  ? trim($_POST["contract_number"])  : "";
$subject         = isset($_POST["subject"])          ? trim($_POST["subject"])          : "";
$affected_service= isset($_POST["affected_service"]) ? trim($_POST["affected_service"]) : "";
$severity        = isset($_POST["severity"])         ? trim($_POST["severity"])         : "";
$message         = isset($_POST["message"])          ? trim($_POST["message"])          : "";

// Basic cleanup
$name             = strip_tags($name);
$name             = str_replace(["\r", "\n"], " ", $name);
$company          = strip_tags($company);
$company          = str_replace(["\r", "\n"], " ", $company);
$contract_number  = strip_tags($contract_number);
$contract_number  = str_replace(["\r", "\n"], " ", $contract_number);
$subject          = strip_tags($subject);
$subject          = str_replace(["\r", "\n"], " ", $subject);
$affected_service = strip_tags($affected_service);
$affected_service = str_replace(["\r", "\n"], " ", $affected_service);
$severity         = strip_tags($severity);
$severity         = str_replace(["\r", "\n"], " ", $severity);
$phone            = strip_tags($phone);

// --- Validate required fields ---
if ($name === "" || $message === "" || $email === "" || $company === "") {
  respond(false, "Please complete your name, email, company, and message.", 422);
}
if ($subject === "") {
  respond(false, "Please select a Request Type.", 422);
}
if ($severity === "") {
  respond(false, "Please select a Severity level.", 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  respond(false, "Please enter a valid email address.", 422);
}

// Simple anti-header-injection for email field
if (preg_match("/[\r\n]/", $email)) {
  respond(false, "Invalid email address.", 422);
}

// --- Build email ---
$subjectLabel = $subject !== "" ? $subject : "General";
$emailSubject = "SimpSec Support [{$severity ?: 'No Severity'}]: {$subjectLabel} — {$name} ({$company})";

$emailBody  = "New support request\n";
$emailBody .= "----------------------------------------\n";
$emailBody .= "Name:             {$name}\n";
$emailBody .= "Email:            {$email}\n";
$emailBody .= "Phone:            " . ($phone !== "" ? $phone : "(not provided)") . "\n";
$emailBody .= "Company:          {$company}\n";
$emailBody .= "MSA Contract #:   " . ($contract_number !== "" ? $contract_number : "(not provided)") . "\n";
$emailBody .= "----------------------------------------\n";
$emailBody .= "Request Type:     " . ($subject !== "" ? $subject : "(not selected)") . "\n";
$emailBody .= "Affected Service: " . ($affected_service !== "" ? $affected_service : "(not provided)") . "\n";
$emailBody .= "Severity:         " . ($severity !== "" ? $severity : "(not selected)") . "\n";
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
