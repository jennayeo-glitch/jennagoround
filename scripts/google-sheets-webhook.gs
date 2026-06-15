/**
 * 참가 신청 → Google Sheets 연동
 *
 * [설정 방법]
 * 1. Google Sheets 새로 만들기 (또는 기존 폼 응답 시트 사용)
 * 2. 확장 프로그램 → Apps Script
 * 3. 이 파일 내용 전체 붙여넣기
 * 4. WEBHOOK_SECRET 원하는 값으로 변경 (config.js 와 동일하게)
 * 5. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행: 나
 *    - 액세스: 모든 사용자
 * 6. 배포 URL을 config.js 의 googleSheetsWebhookUrl 에 붙여넣기
 *
 * 시트 탭 이름: "참가신청" (없으면 자동 생성)
 */

var WEBHOOK_SECRET = 'ppl-person-change-me';
var SHEET_NAME = '참가신청';

var HEADERS = [
  '신청일시',
  '이벤트ID',
  '이벤트명',
  '날짜',
  '장소',
  '카카오ID',
  '닉네임',
  '성별',
  '실명',
  '출생년도',
  '전화번호',
  '동반자',
  '메시지'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (WEBHOOK_SECRET && data.secret !== WEBHOOK_SECRET) {
      return jsonResponse({ success: false, error: 'Unauthorized' });
    }

    var sheet = getOrCreateSheet_();
    ensureHeaders_(sheet);

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.eventId || '',
      data.eventTitle || '',
      data.eventDate || '',
      data.eventLocation || '',
      data.kakaoId || '',
      data.nickname || '',
      formatGender_(data.gender),
      data.realName || '',
      data.birthYear || '',
      data.phone || '',
      data.companionName || '',
      data.message || ''
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function formatGender_(gender) {
  if (gender === 'female') return '여성';
  if (gender === 'male') return '남성';
  return gender || '';
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Apps Script 편집기에서 한 번 실행 — 헤더 행만 미리 만들기 */
function setupSheet() {
  var sheet = getOrCreateSheet_();
  ensureHeaders_(sheet);
}
