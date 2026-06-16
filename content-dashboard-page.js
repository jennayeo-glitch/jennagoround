/**
 * 콘텐츠 대시보드 — 3개 SNS 채널 통합 분석
 */
(function () {
    const gateEl = document.getElementById('admin-gate');
    const mainEl = document.getElementById('admin-main');
    const headerEl = document.getElementById('admin-header');

    let channels = [];
    let stats = { channels: {} };

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

        initDashboard();
    }

    async function initDashboard() {
        try {
            const [chRes, stRes] = await Promise.all([
                fetch('content-channels.json').then((r) => r.json()),
                loadStats()
            ]);
            channels = chRes;
            stats = stRes;
            renderDashboard();
        } catch (err) {
            console.error(err);
            mainEl.innerHTML += '<div class="content-setup-banner">데이터를 불러오지 못했습니다. content-channels.json / content-stats.json 을 확인하세요.</div>';
        }
    }

    async function loadStats() {
        let local = {};
        try {
            local = await fetch('content-stats.json').then((r) => r.json());
        } catch (e) {
            console.warn('[ContentDashboard] local stats missing', e);
        }

        const cfg = window.APP_CONFIG || {};
        if (cfg.contentStatsApiUrl) {
            try {
                const sep = cfg.contentStatsApiUrl.includes('?') ? '&' : '?';
                const secret = cfg.googleSheetsWebhookSecret || '';
                const url = `${cfg.contentStatsApiUrl}${sep}secret=${encodeURIComponent(secret)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const remote = await res.json();
                    return mergeStats(local, remote);
                }
            } catch (e) {
                console.warn('[ContentDashboard] API fallback to local JSON', e);
            }
        }
        return local;
    }

    function mergeStats(local, remote) {
        const out = { ...local, ...remote, channels: { ...(local.channels || {}) } };
        const remoteChannels = remote.channels || {};
        Object.keys(remoteChannels).forEach((id) => {
            out.channels[id] = {
                ...(local.channels?.[id] || {}),
                ...remoteChannels[id],
                history: mergeHistory(
                    local.channels?.[id]?.history,
                    remoteChannels[id]?.history
                ),
                recentContent: remoteChannels[id]?.recentContent?.length
                    ? remoteChannels[id].recentContent
                    : local.channels?.[id]?.recentContent || []
            };
        });
        return out;
    }

    function mergeHistory(a, b) {
        const map = new Map();
        [...(a || []), ...(b || [])].forEach((h) => {
            if (h?.month) map.set(h.month, { ...map.get(h.month), ...h });
        });
        return [...map.values()].sort((x, y) => String(x.month).localeCompare(String(y.month))).slice(-6);
    }

    function getChannelStats(id) {
        return stats.channels?.[id] || {};
    }

    function formatNumber(n, format) {
        if (n == null || n === '' || Number.isNaN(Number(n))) return '—';
        const num = Number(n);
        if (format === 'percent') return `${num.toFixed(1)}%`;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString('ko-KR');
    }

    function primaryMetricKey(channel) {
        if (channel.platform === 'youtube') return 'subscribers';
        return 'followers';
    }

    function historyMetricKey(channel) {
        if (channel.platform === 'youtube') return 'subscribers';
        return 'followers';
    }

    function calcDelta(history, key) {
        if (!history || history.length < 2) return null;
        const cur = history[history.length - 1][key];
        const prev = history[history.length - 2][key];
        if (cur == null || prev == null || prev === 0) return null;
        return ((cur - prev) / prev) * 100;
    }

    function renderDelta(delta) {
        if (delta == null) return '';
        const cls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
        const sign = delta > 0 ? '+' : '';
        return `<span class="content-delta ${cls}">${sign}${delta.toFixed(1)}%</span>`;
    }

    function renderSparkline(history, key, color) {
        if (!history || history.length < 2) {
            return '<div class="content-sparkline-empty">월별 데이터 없음</div>';
        }
        const values = history.map((h) => Number(h[key]) || 0);
        const w = 280;
        const h = 48;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const pts = values.map((v, i) => {
            const x = (i / (values.length - 1)) * w;
            const y = h - 4 - ((v - min) / range) * (h - 8);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        const area = `${pts[0].split(',')[0]},${h} ${pts.join(' ')} ${w},${h}`;
        return `
            <svg class="content-sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
                <polygon points="${area}" fill="${color}" opacity="0.12"/>
                <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    }

    function needsSetup() {
        return channels.some((ch) => {
            const s = getChannelStats(ch.id);
            const key = primaryMetricKey(ch);
            return s[key] == null && (!s.history || s.history.length === 0);
        });
    }

    function renderSetupBanner() {
        if (!needsSetup()) return '';
        return `
            <div class="content-setup-banner">
                <strong>📌 채널 데이터 연동 안내</strong>
                ① <code>content-channels.json</code>에 YouTube 채널 ID·인스타 핸들 수정<br>
                ② 터미널에서 <code>YOUTUBE_API_KEY=키 npm run fetch-content</code> 실행 (유튜브 자동 수집)<br>
                ③ 인스타그램은 Google Sheets 「콘텐츠통계」 탭에 수치 입력 후 Apps Script 배포 URL을 <code>config.js</code>의 <code>contentStatsApiUrl</code>에 연결
            </div>`;
    }

    function renderHero() {
        let totalAudience = 0;
        let totalViews = 0;
        let linked = 0;

        channels.forEach((ch) => {
            const s = getChannelStats(ch.id);
            const aud = s[primaryMetricKey(ch)];
            if (aud != null) {
                totalAudience += Number(aud);
                linked += 1;
            }
            if (ch.platform === 'youtube' && s.totalViews != null) {
                totalViews += Number(s.totalViews);
            }
            if (ch.platform === 'instagram' && s.reach != null) {
                totalViews += Number(s.reach);
            }
        });

        return `
            <div class="content-hero">
                <div class="content-hero-card">
                    <div class="content-hero-label">총 오디언스</div>
                    <div class="content-hero-value">${totalAudience ? formatNumber(totalAudience) : '—'}</div>
                    <div class="content-hero-sub">구독자 + 팔로워 합산</div>
                </div>
                <div class="content-hero-card accent-yt">
                    <div class="content-hero-label">누적 조회 / 도달</div>
                    <div class="content-hero-value">${totalViews ? formatNumber(totalViews) : '—'}</div>
                    <div class="content-hero-sub">유튜브 조회 + 인스타 월간 도달</div>
                </div>
                <div class="content-hero-card accent-ig">
                    <div class="content-hero-label">운영 채널</div>
                    <div class="content-hero-value">${channels.length}</div>
                    <div class="content-hero-sub">${linked}개 연동됨</div>
                </div>
                <div class="content-hero-card">
                    <div class="content-hero-label">마지막 업데이트</div>
                    <div class="content-hero-value" style="font-size:16px;padding-top:8px;">${formatUpdatedAt(stats.updatedAt)}</div>
                    <div class="content-hero-sub">${stats.source || 'local'}</div>
                </div>
            </div>`;
    }

    function formatUpdatedAt(iso) {
        if (!iso) return '미연동';
        try {
            return new Date(iso).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch {
            return iso;
        }
    }

    function renderChannelCards() {
        return channels.map((ch) => {
            const s = getChannelStats(ch.id);
            const histKey = historyMetricKey(ch);
            const delta = calcDelta(s.history, histKey);
            const metricEntries = Object.entries(ch.metrics || {});

            const metricsHtml = metricEntries.map(([key, meta]) => {
                const val = s[key];
                const showDelta = key === histKey ? renderDelta(delta) : '';
                return `
                    <div class="content-metric">
                        <div class="content-metric-label">${meta.label}</div>
                        <div class="content-metric-value">
                            ${val != null ? formatNumber(val, meta.format) : '<span class="content-unlinked">연동 필요</span>'}
                            ${showDelta}
                        </div>
                    </div>`;
            }).join('');

            return `
                <article class="content-channel-card" style="--channel-accent:${ch.accent}">
                    <div class="content-channel-head">
                        <div class="content-channel-platform">${ch.platform === 'youtube' ? 'YouTube' : 'Instagram'}</div>
                        <div class="content-channel-name">${escapeHtml(ch.name)}</div>
                        <div class="content-channel-sub">${escapeHtml(ch.subtitle)} · ${escapeHtml(ch.handle)}</div>
                        <a href="${escapeHtml(ch.url)}" target="_blank" rel="noopener" class="content-channel-link">채널 열기 →</a>
                    </div>
                    <div class="content-channel-body">
                        <div class="content-metric-row">${metricsHtml}</div>
                        <div class="content-sparkline-wrap">
                            <div class="content-sparkline-label">6개월 추이 (${ch.metrics[histKey]?.label || histKey})</div>
                            ${renderSparkline(s.history, histKey, ch.accent)}
                        </div>
                    </div>
                </article>`;
        }).join('');
    }

    function renderComparePanel() {
        const items = channels.map((ch) => {
            const s = getChannelStats(ch.id);
            const key = primaryMetricKey(ch);
            return { name: ch.name, value: Number(s[key]) || 0, color: ch.accent };
        }).filter((i) => i.value > 0);

        const max = Math.max(...items.map((i) => i.value), 1);

        if (items.length === 0) {
            return '<p class="admin-empty">비교할 데이터가 없습니다. 채널을 연동해 주세요.</p>';
        }

        return items.map((item) => `
            <div class="content-compare-bar">
                <div class="content-compare-label">
                    <span>${escapeHtml(item.name)}</span>
                    <span>${formatNumber(item.value)}</span>
                </div>
                <div class="content-compare-track">
                    <div class="content-compare-fill" style="width:${(item.value / max) * 100}%;background:${item.color}"></div>
                </div>
            </div>`).join('');
    }

    function renderFeedPanel() {
        const all = [];
        channels.forEach((ch) => {
            const s = getChannelStats(ch.id);
            (s.recentContent || []).forEach((item) => {
                all.push({ ...item, channelName: ch.name, accent: ch.accent, platform: ch.platform });
            });
        });
        all.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

        if (all.length === 0) {
            return '<p class="admin-empty">최근 콘텐츠 없음 — fetch-content 실행 후 표시됩니다.</p>';
        }

        return all.slice(0, 8).map((item) => `
            <div class="content-feed-item">
                <div class="content-feed-badge" style="background:${item.accent}">${item.platform === 'youtube' ? '▶' : '◎'}</div>
                <div class="content-feed-body">
                    <div class="content-feed-title">${escapeHtml(item.title || '제목 없음')}</div>
                    <div class="content-feed-meta">${escapeHtml(item.channelName)} · ${formatNumber(item.views || item.likes)} ${item.platform === 'youtube' ? '조회' : '좋아요'} · ${formatDate(item.publishedAt)}</div>
                </div>
                ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="content-feed-link">보기</a>` : ''}
            </div>`).join('');
    }

    function renderInsights() {
        const bullets = [];

        channels.forEach((ch) => {
            const s = getChannelStats(ch.id);
            const key = historyMetricKey(ch);
            const delta = calcDelta(s.history, key);
            if (delta != null) {
                const dir = delta >= 0 ? '증가' : '감소';
                bullets.push(`<strong>${escapeHtml(ch.name)}</strong>: ${ch.metrics[key]?.label} 전월 대비 ${Math.abs(delta).toFixed(1)}% ${dir}`);
            }
        });

        const best = channels
            .map((ch) => ({ ch, s: getChannelStats(ch.id) }))
            .filter(({ s, ch }) => s[primaryMetricKey(ch)] != null)
            .sort((a, b) => Number(b.s[primaryMetricKey(b.ch)]) - Number(a.s[primaryMetricKey(a.ch)]))[0];

        if (best) {
            bullets.push(`가장 큰 오디언스: <strong>${escapeHtml(best.ch.name)}</strong> (${formatNumber(best.s[primaryMetricKey(best.ch)])})`);
        }

        const nangman = getChannelStats('instagram-nangman');
        if (nangman.followers != null && nangman.engagementRate != null) {
            bullets.push(`FINDING NANGMAN 참여율 ${formatNumber(nangman.engagementRate, 'percent')} — 이벤트 홍보 효율 지표로 활용`);
        }

        if (bullets.length === 0) {
            bullets.push('데이터 연동 후 채널별 성장·참여 인사이트가 자동 생성됩니다.');
        }

        return `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
    }

    function formatDate(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString('ko-KR');
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

    function renderDashboard() {
        const root = document.getElementById('content-root');
        root.innerHTML = `
            ${renderSetupBanner()}
            ${renderHero()}
            <div class="admin-section-label">채널별 상세</div>
            <div class="content-grid">${renderChannelCards()}</div>
            <div class="content-insights">
                <div class="content-insights-title">💡 이번 달 인사이트</div>
                ${renderInsights()}
            </div>
            <div class="content-panels">
                <div class="content-panel">
                    <div class="content-panel-title">오디언스 비교</div>
                    ${renderComparePanel()}
                </div>
                <div class="content-panel">
                    <div class="content-panel-title">최근 콘텐츠</div>
                    ${renderFeedPanel()}
                </div>
            </div>
            <div class="content-footer-meta">데이터: content-stats.json · 유튜브 API · Google Sheets(인스타)</div>`;
    }

    AdminAuth.init({
        onLoginRequired: () => renderGate('login'),
        onDenied: (user) => renderGate('denied', user),
        onReady: showAdminUI
    });
})();
