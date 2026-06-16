/**
 * 백오피스 — 이벤트별 참가 신청자 상세 관리
 */
(function () {
    const gateEl = document.getElementById('admin-gate');
    const mainEl = document.getElementById('admin-main');
    const headerEl = document.getElementById('admin-header');
    const selectEl = document.getElementById('event-select');
    const searchEl = document.getElementById('search-input');
    const tbodyEl = document.getElementById('participants-body');
    const statsEl = document.getElementById('stats-mini');

    let currentEventId = null;
    let participants = [];

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

        populateEventSelect();
        loadParticipants();

        selectEl.addEventListener('change', () => {
            currentEventId = Number(selectEl.value);
            updateSubtitle();
            const url = new URL(location.href);
            url.searchParams.set('eventId', currentEventId);
            history.replaceState({}, '', url);
            loadParticipants();
        });

        searchEl.addEventListener('input', () => {
            renderTable(filterParticipants(participants, searchEl.value));
        });

        document.getElementById('refresh-btn').addEventListener('click', loadParticipants);
        document.getElementById('export-btn').addEventListener('click', exportCsv);
    }

    function getManageableEvents() {
        const seen = new Set();
        return eventsData.filter((e) => {
            const key = `${e.id}-${e.date}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function getEventById(id) {
        const num = Number(id);
        return eventsData.find((e) => e.id === num) || null;
    }

    function formatGender(g) {
        if (g === 'female') return '여성';
        if (g === 'male') return '남성';
        return g || '—';
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('ko-KR');
        } catch {
            return iso;
        }
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function populateEventSelect() {
        const events = getManageableEvents();
        const params = new URLSearchParams(location.search);
        const fromUrl = params.get('eventId');

        selectEl.innerHTML = events.map((e) =>
            `<option value="${e.id}">${escapeHtml(e.title)} (${escapeHtml(e.displayDate)})</option>`
        ).join('');

        if (fromUrl && events.some((e) => String(e.id) === fromUrl)) {
            selectEl.value = fromUrl;
        } else if (events.length) {
            selectEl.value = String(events[0].id);
        }

        currentEventId = Number(selectEl.value);
        updateSubtitle();
    }

    function updateSubtitle() {
        const event = getEventById(currentEventId);
        const sub = document.getElementById('event-subtitle');
        if (event && sub) {
            sub.textContent = `${event.title} · ${event.displayDate} · ${event.location || ''}`;
        }
    }

    function renderStats(list) {
        const total = list.length;
        const female = list.filter((p) => p.gender === 'female').length;
        const male = list.filter((p) => p.gender === 'male').length;
        const event = getEventById(currentEventId);
        const cap = event?.capacity?.total || '—';

        statsEl.innerHTML = `
            <div class="admin-stat-mini">
                <div class="admin-stat-mini-label">신청자</div>
                <div class="admin-stat-mini-value">${total} / ${cap}</div>
            </div>
            <div class="admin-stat-mini">
                <div class="admin-stat-mini-label">성별 (여 / 남)</div>
                <div class="admin-stat-mini-value">${female} / ${male}</div>
            </div>`;
    }

    function filterParticipants(list, query) {
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((p) => {
            const app = p.application || {};
            const hay = [
                p.nickname,
                app.realName,
                app.phone,
                app.companionName,
                app.message
            ].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    function renderTable(list) {
        if (list.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="10" class="admin-empty">신청자가 없습니다.</td></tr>';
            return;
        }

        tbodyEl.innerHTML = list.map((p, i) => {
            const app = p.application || {};
            return `
                <tr data-user-id="${escapeHtml(p.id)}">
                    <td>${i + 1}</td>
                    <td>${escapeHtml(p.nickname || '—')}</td>
                    <td>${escapeHtml(app.realName || '—')}</td>
                    <td>${formatGender(app.gender || p.gender)}</td>
                    <td>${escapeHtml(app.birthYear || '—')}</td>
                    <td>${escapeHtml(app.phone || '—')}</td>
                    <td>${escapeHtml(app.companionName || '—')}</td>
                    <td class="wrap">${escapeHtml(app.message || '—')}</td>
                    <td>${formatDate(app.submittedAt || p.timestamp)}</td>
                    <td><button type="button" class="admin-btn admin-btn-danger admin-btn-sm cancel-btn" data-id="${escapeHtml(p.id)}">취소</button></td>
                </tr>`;
        }).join('');

        tbodyEl.querySelectorAll('.cancel-btn').forEach((btn) => {
            btn.addEventListener('click', () => handleCancel(btn.dataset.id));
        });
    }

    async function loadParticipants() {
        tbodyEl.innerHTML = '<tr><td colspan="10" class="admin-empty">불러오는 중…</td></tr>';
        try {
            participants = await EventParticipants.getParticipants(currentEventId);
        } catch {
            participants = EventParticipants.getParticipantsFromLocalStorage(currentEventId);
        }
        const filtered = filterParticipants(participants, searchEl.value);
        renderStats(participants);
        renderTable(filtered);
    }

    async function handleCancel(userId) {
        const row = participants.find((p) => String(p.id) === String(userId));
        const name = row?.application?.realName || row?.nickname || userId;
        if (! confirm(`"${name}"님의 참가를 취소할까요?\n시트 비고에 "참여 취소"가 기록됩니다.`)) return;

        try {
            await EventParticipants.removeParticipant(currentEventId, userId);
            await loadParticipants();
        } catch (err) {
            alert(err.message || '취소 처리 중 오류가 발생했습니다.');
        }
    }

    function exportCsv() {
        const filtered = filterParticipants(participants, searchEl.value);
        if (!filtered.length) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const event = getEventById(currentEventId);
        const headers = ['닉네임', '실명', '성별', '출생년도', '전화번호', '동반자', '메시지', '신청일시', '카카오ID'];
        const rows = filtered.map((p) => {
            const app = p.application || {};
            return [
                p.nickname,
                app.realName,
                formatGender(app.gender || p.gender),
                app.birthYear,
                app.phone,
                app.companionName,
                app.message,
                app.submittedAt || p.timestamp,
                p.id
            ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
        });

        const bom = '\uFEFF';
        const csv = bom + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `participants_${currentEventId}_${event?.title || 'event'}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    AdminAuth.init({
        onLoginRequired: () => renderGate('login'),
        onDenied: (user) => renderGate('denied', user),
        onReady: showAdminUI
    });
})();
