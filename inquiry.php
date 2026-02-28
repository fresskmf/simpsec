<?php
// ==========================
// BASIC CONFIG
// ==========================
$to = "support@simpsec.org"; // 
$fromEmail = "no-reply@simpsec.org"; // should be a valid domain email
$fromName = "SimpSec Website";

// ==========================
// SANITIZE INPUT
// ==========================
function clean_input($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

$firstName  = clean_input($_POST['first_name'] ?? '');
$lastName   = clean_input($_POST['last_name'] ?? '');
$email      = clean_input($_POST['email'] ?? '');
$phone      = clean_input($_POST['phone'] ?? '');
$company    = clean_input($_POST['company'] ?? '');
$industry   = clean_input($_POST['industry'] ?? '');
$interests  = $_POST['interested_in'] ?? [];

$pulseSource = clean_input($_POST['pulse_source'] ?? '');
$pulseRisk   = clean_input($_POST['pulse_risk'] ?? '');
$pulseScore  = clean_input($_POST['pulse_score'] ?? '');
$pulseGaps   = clean_input($_POST['pulse_gaps'] ?? '');

$pulseAxisRiskJson  = $_POST['pulse_axis_risk_json'] ?? '';
$pulseAxesOrderJson = $_POST['pulse_axes_order_json'] ?? '';
$inquiry_uid = $_POST['inquiry_uid'] ?? '';

$pulseAxisRiskJson  = clean_input($pulseAxisRiskJson);
$pulseAxesOrderJson = clean_input($pulseAxesOrderJson);

// ==========================
// VALIDATION
// ==========================
if (
    empty($firstName) ||
    empty($lastName) ||
    empty($email) ||
    empty($phone) ||
    empty($company) ||
    empty($industry) ||
    empty($interests)
) {
    http_response_code(400);
    echo "Missing required fields.";
    exit;
}

// ==========================
// FORMAT INTERESTS
// ==========================
$interestList = implode(", ", array_map('clean_input', $interests));

// ==========================
// EMAIL SUBJECT
// ==========================
$subject = "New Lead Inquiry from {$company}";

// ==========================
// EMAIL BODY
// ==========================
$message = "
New Lead Inquiry Submitted
---------------------------------

First Name: {$firstName}
Last Name: {$lastName}
Email: {$email}
Phone: {$phone}
Company: {$company}
Industry: {$industry}

Interested In:
{$interestList}

Pulse Check (if provided)
---------------------------------
Source: {$pulseSource}
Risk: {$pulseRisk}
Score: {$pulseScore}
Top gaps: {$pulseGaps}
Axis risk JSON: {$pulseAxisRiskJson}
Axes order JSON: {$pulseAxesOrderJson}

---------------------------------
Submitted on: " . date("F j, Y, g:i a") . "
IP Address: " . $_SERVER['REMOTE_ADDR'] . "
";

// ==========================
// EMAIL HEADERS
// ==========================
$headers = "From: {$fromName} <{$fromEmail}>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// ==========================
// SEND EMAIL
// ==========================
if (mail($to, $subject, $message, $headers)) {
    // Success response (you can redirect instead)
    echo "Thank you. Your inquiry has been sent.";
} else {
    http_response_code(500);
    echo "Something went wrong. Please try again later.";
}

header('Location: inquiry-success.html');
exit;
?>
