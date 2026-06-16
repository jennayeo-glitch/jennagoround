/**
 * 콘텐츠 통계 API — Google Sheets → JSON (인스타그램 수동 입력)
 *
 * [설정]
 * 1. 기존 스프레드시트에 탭 「콘텐츠통계」 생성
 * 2. 헤더: month | channelId | followers | posts | reach | engagementRate | notes
 * 3. 이 파일을 Apps Script에 추가하거나 별도 배포
 * 4. doGet URL → config.js contentStatsApiUrl
 *
 * 월별 행 예:
 * 2026-06 | instagram-nangman | 520 | 34 | 1200 | 4.5 | FINDING NANGMAN 6월
 */

var CONTENT_SHEET_NAME = '콘텐츠통계';
var CONTENT_WEBHOOK_SECRET = 'ppl-person-change-me';

function doGetContentStats(e) {
  try {
    var secret = (e && e.parameter && e.parameter.secret) || '';
    if (CONTENT_WEBHOOK_SECRET && secret !== CONTENT_WEBHOOK_SECRET) {
      return jsonContentResponse({ success: false, error: 'Unauthorized' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONTENT_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) {
      return jsonContentResponse(buildEmptyContentStats_());
    }

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(String);
    var rows = data.slice(1);

    var col = function(name) {
      return headers.indexOf(name);
    };

    var monthCol = col('month');
    var channelCol = col('channelId');
    if (monthCol < 0 || channelCol < 0) {
      return jsonContentResponse({ success: false, error: 'Missing columns: month, channelId' });
    }

    var channels = {};
    var channelIds = ['instagram-nangman', 'instagram-jennagoround', 'youtube-personal'];

    channelIds.forEach(function(id) {
      channels[id] = { history: [], recentContent: [] };
    });

    rows.forEach(function(row) {
      var channelId = String(row[channelCol] || '').trim();
      if (!channelId || !channels[channelId]) return;

      var month = String(row[monthCol] || '').trim();
      var entry = { month: month };

      if (col('followers') >= 0) entry.followers = num_(row[col('followers')]);
      if (col('subscribers') >= 0) entry.subscribers = num_(row[col('subscribers')]);
      if (col('posts') >= 0) channels[channelId].posts = num_(row[col('posts')]);
      if (col('reach') >= 0) channels[channelId].reach = num_(row[col('reach')]);
      if (col('engagementRate') >= 0) channels[channelId].engagementRate = num_(row[col('engagementRate')]);
      if (col('totalViews') >= 0) entry.totalViews = num_(row[col('totalViews')]);

      channels[channelId].history.push(entry);

      // 최신 행 = 현재 스냅샷
      Object.keys(entry).forEach(function(k) {
        if (k !== 'month') channels[channelId][k] = entry[k];
      });
    });

    Object.keys(channels).forEach(function(id) {
      channels[id].history.sort(function(a, b) {
        return String(a.month).localeCompare(String(b.month));
      });
      channels[id].history = channels[id].history.slice(-6);
    });

    return jsonContentResponse({
      updatedAt: new Date().toISOString(),
      source: 'google-sheets',
      channels: channels
    });
  } catch (err) {
    return jsonContentResponse({ success: false, error: String(err) });
  }
}

function buildEmptyContentStats_() {
  return {
    updatedAt: new Date().toISOString(),
    source: 'google-sheets-empty',
    channels: {
      'instagram-nangman': { history: [], recentContent: [] },
      'instagram-jennagoround': { history: [], recentContent: [] },
      'youtube-personal': { history: [], recentContent: [] }
    }
  };
}

function num_(v) {
  if (v === '' || v == null) return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

function jsonContentResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 편집기에서 1회 실행 — 콘텐츠통계 시트 헤더 생성 */
function setupContentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONTENT_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONTENT_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'month', 'channelId', 'followers', 'subscribers', 'posts',
      'reach', 'engagementRate', 'totalViews', 'notes'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }
}
