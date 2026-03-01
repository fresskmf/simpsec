/* =========================================================
   SimpSec Pulse Config — Cybersecurity Quiz
   Register this before pulse-overlay.js loads.
========================================================= */

window.PULSE_CONFIGS = window.PULSE_CONFIGS || {};

window.PULSE_CONFIGS['cyber'] = {
  storageKey: 'simpsec_pulse_result_v2',
  resultsUrl: '/pulse-results.html',
  axesOrder: ['Email', 'Access', 'Backups', 'People', 'Devices', 'Vendors', 'Readiness'],
  questions: [
    {
      category: 'Email Security',
      axis: 'Email',
      text: 'Have you seen suspicious or fake emails recently?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'Phishing risk is unclear' },
        { label: 'Yes', score: 10, gap: 'Phishing incidents are happening' },
      ],
    },
    {
      category: 'Accounts & Logins',
      axis: 'Access',
      text: 'Do all important accounts require a login code from your phone?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Some', score: 5, gap: 'MFA is inconsistent' },
        { label: 'No', score: 10, gap: 'MFA is missing' },
      ],
    },
    {
      category: 'Backups & Recovery',
      axis: 'Backups',
      text: 'If files were lost today, could you recover them quickly?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'Backup/recovery confidence is low' },
        { label: 'No', score: 10, gap: "Backups aren\u2019t tested" },
      ],
    },
    {
      category: 'People',
      axis: 'People',
      text: 'Does everyone know what to do if something feels suspicious?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Somewhat', score: 5, gap: 'Team guidance is limited' },
        { label: 'No', score: 10, gap: 'Incident readiness is low' },
      ],
    },
    {
      category: 'Devices',
      axis: 'Devices',
      text: 'Are work devices consistently updated and protected?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: "Updates aren\u2019t consistent" },
        { label: 'No', score: 10, gap: "Updates aren\u2019t reliably happening" },
      ],
    },
    {
      category: 'Vendors',
      axis: 'Vendors',
      text: 'Do vendors or contractors still have access?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'Vendor access is unknown' },
        { label: 'Yes', score: 10, gap: "Vendor access isn\u2019t fully controlled" },
      ],
    },
    {
      category: 'Admin Access',
      axis: 'Access',
      text: 'Do you know who has admin-level access?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'Admin access is unknown' },
        { label: 'No', score: 10, gap: 'Admin access needs cleanup' },
      ],
    },
    {
      category: 'Devices',
      axis: 'Devices',
      text: 'Could a lost laptop be locked or wiped quickly?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'Device control is inconsistent' },
        { label: 'No', score: 10, gap: 'Lost-device response is weak' },
      ],
    },
    {
      category: 'Access',
      axis: 'Access',
      text: 'Are shared logins used to get work done?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Sometimes', score: 5, gap: 'Shared logins happen' },
        { label: 'Often', score: 10, gap: 'Shared accounts are common' },
      ],
    },
    {
      category: 'Readiness',
      axis: 'Readiness',
      text: 'Would everyone know what to do during a security issue?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: "Incident steps aren\u2019t clear" },
        { label: 'No', score: 10, gap: 'Incident readiness is low' },
      ],
    },
  ],
};
