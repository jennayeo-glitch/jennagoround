/**
 * Apps Script 웹 앱 배포 후 URL을 넣어 주세요.
 * scripts/google-sheets-webhook.gs 를 시트에 붙여넣고 배포하면 URL을 받을 수 있습니다.
 */
window.APP_CONFIG = {
  googleSheetsWebhookUrl:
    "https://script.google.com/macros/s/AKfycbw2hNSs4OGQMZdFOqR7g5nilBALCJouUZk9gjMlLA92p0WE8rx9eJEAy6koNpiyhwp0/exec",
  /** scripts/google-sheets-webhook.gs 의 WEBHOOK_SECRET 과 동일하게 */
  googleSheetsWebhookSecret: "ppl-person-change-me",
  /** admin.html / backoffice.html 접근 허용 카카오 사용자 ID (문자열) */
  adminKakaoIds: ["4740187268"],
  /** 또는 카카오 닉네임으로 허용 (대소문자 무시) */
  adminKakaoNicknames: ["heeho2"],
  /** 콘텐츠 통계 Apps Script doGet URL (scripts/content-stats-api.gs) — 인스타 시트 연동 */
  contentStatsApiUrl: "",
};
