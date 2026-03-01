/* =========================================================
   SimpSec Pulse Config — Digital Footprint Quiz
   Level 2 intensity. Clear, non-technical language.
   Register this before pulse-overlay.js loads.
========================================================= */

window.PULSE_CONFIGS = window.PULSE_CONFIGS || {};

window.PULSE_CONFIGS['footprint'] = {
  storageKey: 'simpsec_pulse_footprint_v2',
  resultsUrl: '/pulse-results-footprint.html',

  axesOrder: [
    'Search Visibility',
    'Who Has Your Information',
    'Account Security',
    'App and Device Tracking',
    'Location Exposure',
    'Digital Clutter',
  ],

  questions: [
    // 1
    {
      category: 'Search Visibility',
      axis: 'Search Visibility',
      text: 'Have you ever searched your full name online to see what comes up?',
      answers: [
        { label: 'Yes, and very little personal information shows', score: 0, gap: null },
        {
          label: 'Yes, and I found more than I expected',
          score: 5,
          gap: 'Personal details appear in search results',
        },
        { label: 'No, I have never searched myself', score: 10, gap: 'Search exposure is unknown' },
      ],
    },

    // 2
    {
      category: 'Public Listings',
      axis: 'Who Has Your Information',
      text: 'Have you ever seen your home address, phone number, or relatives listed on people search websites?',
      answers: [
        { label: 'No', score: 0, gap: null },
        {
          label: 'I have seen a listing or two',
          score: 5,
          gap: 'Personal details appear on public listing sites',
        },
        {
          label: 'Yes, on multiple sites',
          score: 10,
          gap: 'Personal information is widely listed online',
        },
      ],
    },

    // 3
    {
      category: 'Social Visibility',
      axis: 'Search Visibility',
      text: 'Are your social media profiles visible to people you do not personally know?',
      answers: [
        { label: 'Mostly private', score: 0, gap: null },
        { label: 'Some parts are public', score: 5, gap: 'Partial social profile visibility' },
        { label: 'Fully public', score: 10, gap: 'Social profiles are publicly visible' },
      ],
    },

    // 4
    {
      category: 'Account Exposure',
      axis: 'Account Security',
      text: 'Do you know whether your email address or passwords have ever been exposed in a data breach?',
      answers: [
        { label: 'Yes, and I secured every affected account', score: 0, gap: null },
        {
          label: 'I received notifications but did not change everything',
          score: 5,
          gap: 'Some exposed accounts may still be vulnerable',
        },
        {
          label: 'I am not sure or never checked',
          score: 10,
          gap: 'Possible breach exposure has not been reviewed',
        },
      ],
    },

    // 5
    {
      category: 'App Permissions',
      axis: 'App and Device Tracking',
      text: 'When you install new apps, do you review what information they collect beyond just camera or location?',
      answers: [
        { label: 'Yes, I usually review settings', score: 0, gap: null },
        { label: 'Sometimes', score: 5, gap: 'App data collection may not be fully reviewed' },
        {
          label: 'No, I usually accept everything',
          score: 10,
          gap: 'Apps may be collecting more personal data than expected',
        },
      ],
    },

    // 6
    {
      category: 'Usage Tracking',
      axis: 'Who Has Your Information',
      text: 'Some apps collect usage data even when you are not actively using them. Do you know what your most-used apps collect about you?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        {
          label: 'I have a general idea',
          score: 5,
          gap: 'App tracking may not be fully understood',
        },
        {
          label: 'Not really',
          score: 10,
          gap: 'Ongoing app tracking may be happening without awareness',
        },
      ],
    },

    // 7
    {
      category: 'Information Removal',
      axis: 'Who Has Your Information',
      text: 'Have you ever tried to remove your personal information from websites that list it publicly?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        {
          label: 'I have considered it but have not taken action',
          score: 5,
          gap: 'Personal information may still be shared publicly',
        },
        {
          label: 'I did not know that was possible',
          score: 10,
          gap: 'Public information listings have likely not been addressed',
        },
      ],
    },

    // 8
    {
      category: 'Location Exposure',
      axis: 'Location Exposure',
      text: 'Do your posts, photos, or apps ever share your location, even after the moment has passed?',
      answers: [
        { label: 'No', score: 0, gap: null },
        { label: 'Possibly', score: 5, gap: 'Location details may be attached to content' },
        {
          label: 'I am not sure',
          score: 10,
          gap: 'Location sharing settings have not been reviewed',
        },
      ],
    },

    // 9
    {
      category: 'Old Accounts',
      axis: 'Digital Clutter',
      text: 'Have you deleted old accounts you no longer use, such as shopping sites, apps, or forums?',
      answers: [
        { label: 'Yes, regularly', score: 0, gap: null },
        {
          label: 'A few, but not many',
          score: 5,
          gap: 'Inactive accounts may still hold personal data',
        },
        {
          label: 'No, they are probably still active',
          score: 10,
          gap: 'Old accounts may still be storing personal information',
        },
      ],
    },

    // 10
    {
      category: 'Awareness',
      axis: 'Search Visibility',
      text: 'If someone wanted to learn about you, do you feel confident you know what they could find online?',
      answers: [
        { label: 'Yes', score: 0, gap: null },
        { label: 'Somewhat', score: 5, gap: 'Online visibility may not be fully understood' },
        {
          label: 'Not really',
          score: 10,
          gap: 'Personal exposure online may be greater than expected',
        },
      ],
    },
  ],
};
