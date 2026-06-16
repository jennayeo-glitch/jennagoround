/**
 * 관리자 대시보드 — 이벤트별 참가 현황 요약
 */
(function () {
    const gateEl = document.getElementById('admin-gate');
    const mainEl = document.getElementById('admin-main');
    const headerEl = document.getElementById('admin-header');

    function renderGate(type, user) {
        AdminAuth.renderGate(gateEl, type, user);
    }

    function showAdminUI(user) {
        gateEl.innerHTML = '';
        headerEl.style.display = 'flex';
        mainEl.style.display = 'block';
        document.getElementById('admin-user-label').textContent = user.nickname || '관리자';
        document.getElementById('admin-logout-btn').addEventListener('click', logout);

        const banner = document.createElement('div');
        banner.innerHTML = AdminAuth.renderSetupBanner();
        if (banner.firstElementChild) {
            mainEl.insertBefore(banner.firstElementChild, mainEl.firstChild);
        }

        loadDashboard();
    }

    function isUpcoming(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(dateStr) >= today;
    }

    function getUniqueEvents() {
        const seen = new Set();
        return eventsData.filter((e) => {
            const key = `${e.id}-${e.date}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async function loadParticipantsForEvent(eventId) {
        try {
            return await EventParticipants.getParticipants(eventId);
        } catch {
            return EventParticipants.getParticipantsFromLocalStorage(eventId);
        }
    }

    async function loadDashboard() {
        const listEl = document.getElementById('event-list');
        const events = getUniqueEvents();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalApplicants = 0;
        let openCount = 0;
        let upcomingCount = 0;

        const rows = [];

        for (const event of events) {
            const participants = await loadParticipantsForEvent(event.id);
            const count = participants.length;
            totalApplicants += count;

            if (event.registrationOpen) openCount += 1;
            if (isUpcoming(event.date)) upcomingCount += 1;

            const total = event.capacity?.total || 0;
            const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
            const isFull = total > 0 && count >= total;

            rows.push({ event, count, pct, isFull });
        }

        document.getElementById('stat-total-events').textContent = events.length;
        document.getElementById('stat-open-events').textContent = openCount;
        document.getElementById('stat-total-applicants').textContent = totalApplicants;
        document.getElementById('stat-upcoming').textContent = upcomingCount;

        if (rows.length === 0) {
            listEl.innerHTML = '<div class="admin-empty">등록된 이벤트가 없습니다.</div>';
            return;
        }

        listEl.innerHTML = rows.map(({ event, count, pct, isFull }) => {
            const badges = [];
            if (event.registrationOpen) badges.push('<span class="admin-badge admin-badge-open">신청서</span>');
            if (isFull) badges.push('<span class="admin-badge admin-badge-full">마감</span>');

            return `
                <div class="admin-event-row">
                    <div class="admin-event-info">
                        <h3>${escapeHtml(event.title || '제목 없음')}</h3>
                        <div class="admin-event-meta">${escapeHtml(event.displayDate || '')} · ${escapeHtml(event.location || '')}</div>
                        <div class="admin-event-badges">${badges.join('')}</div>
                        <div class="admin-capacity-bar"><div class="admin-capacity-fill" style="width:${pct}%"></div></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:20px;font-weight:700;">${count}<span style="font-size:13px;color:var(--text-gray);font-weight:400;"> / ${event.capacity?.total || '—'}</span></div>
                        <a href="backoffice.html?eventId=${event.id}" class="admin-btn admin-btn-primary admin-btn-sm" style="margin-top:10px;text-decoration:none;">신청자 관리 →</a>
                    </div>
                </div>`;
        }).join('');
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    AdminAuth.init({
        onLoginRequired: () => renderGate('login'),
        onDenied: (user) => renderGate('denied', user),
        onReady: showAdminUI
    });
})();
