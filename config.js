/**
 * Apps Script 웹 앱 배포 후 URL을 넣어 주세요.
 * scripts/google-sheets-webhook.gs 를 시트에 붙여넣고 배포하면 URL을 받을 수 있습니다.
 */
window.APP_CONFIG = {
  googleSheetsWebhookUrl:
    "https://script.google.com/macros/s/AKfycbw2hNSs4OGQMZdFOqR7g5nilBALCJouUZk9gjMlLA92p0WE8rx9eJEAy6koNpiyhwp0/exec",
  /** scripts/google-sheets-webhook.gs 의 WEBHOOK_SECRET 과 동일하게 */
  googleSheetsWebhookSecret: "ppl-person-change-me",
};
