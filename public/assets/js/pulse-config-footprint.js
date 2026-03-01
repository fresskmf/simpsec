/* =========================================================
   SimpSec Pulse Config — Digital Footprint Quiz (PLACEHOLDER)
   TODO: Replace placeholder questions with finalized copy before launch.
   Register this before pulse-overlay.js loads.
========================================================= */

window.PULSE_CONFIGS = window.PULSE_CONFIGS || {};

window.PULSE_CONFIGS['footprint'] = {
  storageKey: 'simpsec_pulse_footprint_v1',
  resultsUrl: '/pulse-results-footprint.html',
  axesOrder: ['Passwords', 'Social', 'Devices', 'Privacy', 'Identity', 'Data'],
  questions: [
    // TODO: Finalize question text and gap copy before launch
    {
      category: 'Passwords',
      axis: 'Passwords',
      text: '[PLACEHOLDER] Do you reuse passwords across multiple personal accounts?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Sometimes', score: 5, gap: 'Password reuse is occasional' },
        { label: 'Yes', score: 10, gap: 'Password reuse is common' },
      ],
    },
    {
      category: 'Social Media',
      axis: 'Social',
      text: '[PLACEHOLDER] Are your social media profiles set to public?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Some are', score: 5, gap: 'Social exposure is partial' },
        { label: 'Yes', score: 10, gap: 'Social profiles are fully public' },
      ],
    },
    {
      category: 'Devices',
      axis: 'Devices',
      text: '[PLACEHOLDER] Are your personal devices protected with a PIN or biometric lock?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Some of them', score: 5, gap: 'Device lock is inconsistent' },
        { label: 'No', score: 10, gap: 'Devices are unlocked and unprotected' },
      ],
    },
    {
      category: 'Privacy',
      axis: 'Privacy',
      text: '[PLACEHOLDER] Do apps on your phone have access to your location, contacts, or camera beyond what they need?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Not sure', score: 5, gap: 'App permissions are unclear' },
        { label: 'Probably yes', score: 10, gap: 'App permissions are overly broad' },
      ],
    },
    {
      category: 'Identity',
      axis: 'Identity',
      text: '[PLACEHOLDER] Have you checked whether your email or passwords have appeared in a data breach?',
      answers: [
        { label: 'Yes, and nothing found', score: 0, gap: null },
        { label: 'Not sure / never checked', score: 5, gap: 'Breach exposure is unknown' },
        { label: 'Yes, something was found', score: 10, gap: 'Credentials have been exposed in a breach' },
      ],
    },
    {
      category: 'Data',
      axis: 'Data',
      text: '[PLACEHOLDER] Do you regularly back up important personal files (photos, documents)?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Not consistently', score: 5, gap: 'Personal backups are inconsistent' },
        { label: 'No', score: 10, gap: 'Personal files have no backup' },
      ],
    },
  ],
};
