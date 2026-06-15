/**
 * 참가 신청 완료 시 Google Sheets(Apps Script)로 전송
 */
const GoogleSheetsSync = {
    getWebhookUrl(eventId) {
        if (typeof eventsData !== 'undefined') {
            const event = eventsData.find((e) => e.id === eventId);
            if (event && event.googleSheetsWebhook) {
                return event.googleSheetsWebhook.trim();
            }
        }
        const cfg = window.APP_CONFIG || {};
        return (cfg.googleSheetsWebhookUrl || '').trim();
    },

    buildPayload(eventId, user, application) {
        const event = typeof eventsData !== 'undefined'
            ? eventsData.find((e) => e.id === eventId)
            : null;
        const cfg = window.APP_CONFIG || {};

        return {
            secret: cfg.googleSheetsWebhookSecret || '',
            eventId,
            eventTitle: event ? event.title : '',
            eventDate: event ? event.displayDate : '',
            eventLocation: event ? event.location : '',
            kakaoId: user.id,
            nickname: user.nickname || '',
            gender: application.gender || '',
            realName: application.realName || '',
            birthYear: application.birthYear || '',
            phone: application.phone || '',
            companionName: application.companionName || '',
            message: application.message || '',
            submittedAt: application.submittedAt || new Date().toISOString()
        };
    },

    /** Firebase 저장 성공 후 호출 — 실패해도 신청은 유지 */
    pushRegistration(eventId, user, application) {
        if (!application) return;

        const url = this.getWebhookUrl(eventId);
        if (!url) {
            console.info('[GoogleSheetsSync] webhook URL 없음 — config.js 또는 events.js에 설정하세요.');
            return;
        }

        const payload = this.buildPayload(eventId, user, application);

        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).catch((err) => {
            console.warn('[GoogleSheetsSync] 전송 실패:', err);
        });
    }
};
