/**
 * 서울 이벤트 디스커버리 지도
 * Requires: Leaflet + city-events.js (CITY_EVENTS) — 임시로 OpenStreetMap 타일 사용
 */
(function () {
    'use strict';

    const CATS = {
        festival:   { label: '축제',   emoji: '🌸', color: '#f43f5e' },
        popup:      { label: '팝업',   emoji: '🛍',  color: '#8b5cf6' },
        concert:    { label: '콘서트', emoji: '🎵', color: '#3b82f6' },
        exhibition: { label: '전시',   emoji: '🎨', color: '#f59e0b' },
        market:     { label: '마켓',   emoji: '🛒', color: '#10b981' },
        party:      { label: '파티',   emoji: '🎉', color: '#ec4899' },
    };

    const SEOUL_LAT = 37.5665;
    const SEOUL_LNG = 126.978;

    const state = { category: 'all', time: 'all', search: '' };

    let map = null;
    let markerLayer = null;
    const markersById = {};
    let activeCardId = null;

    function today() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function endOfDay(d) {
        const e = new Date(d);
        e.setHours(23, 59, 59, 999);
        return e;
    }

    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function eventStart(e) { return parseDate(e.startDate); }
    function eventEnd(e)   { return endOfDay(parseDate(e.endDate)); }

    function isOngoing(event) {
        const now = today();
        return eventStart(event) <= now && now <= eventEnd(event);
    }

    function overlaps(event, from, to) {
        return eventStart(event) <= to && eventEnd(event) >= from;
    }

    function getWeekRange() {
        const t = today();
        const dow = t.getDay();
        const diffToMon = dow === 0 ? -6 : 1 - dow;
        const mon = new Date(t);
        mon.setDate(t.getDate() + diffToMon);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        return { from: mon, to: endOfDay(sun) };
    }

    function getMonthRange() {
        const t = today();
        const from = new Date(t.getFullYear(), t.getMonth(), 1);
        const to   = endOfDay(new Date(t.getFullYear(), t.getMonth() + 1, 0));
        return { from, to };
    }

    function getFiltered() {
        const week  = state.time === 'week'  ? getWeekRange()  : null;
        const month = state.time === 'month' ? getMonthRange() : null;
        const query = state.search.toLowerCase();

        return CITY_EVENTS.filter(ev => {
            if (state.category !== 'all' && ev.category !== state.category) return false;

            // 날짜 미확인 이벤트는 특정 날짜 필터에서 제외 (전체에서만 표시)
            if (isUnconfirmed(ev)) {
                if (state.time !== 'all') return false;
            } else {
                if (state.time === 'today' && !isOngoing(ev)) return false;
                if (state.time === 'week'  && !overlaps(ev, week.from, week.to))   return false;
                if (state.time === 'month' && !overlaps(ev, month.from, month.to)) return false;
            }

            if (query) {
                const hay = [ev.title, ev.venueName, ev.address, ev.description,
                             ...(ev.tags || [])].join(' ').toLowerCase();
                if (!hay.includes(query)) return false;
            }

            return true;
        });
    }

    function isUnconfirmed(ev) {
        return ev.dateConfidence === 'unconfirmed' || !ev.startDate || !ev.endDate;
    }

    function statusLabel(event) {
        if (isUnconfirmed(event)) {
            return '<span style="color:#f59e0b;font-weight:600;font-size:10px">날짜 미확인</span>';
        }
        if (isOngoing(event)) {
            return '<span style="color:#10b981;font-weight:600;font-size:10px">진행 중</span>';
        }
        const diff = Math.round((eventStart(event) - today()) / 86400000);
        if (diff > 0) {
            return `<span style="color:#9ca3af;font-size:10px">D-${diff}</span>`;
        }
        return '<span style="color:#d1d5db;font-size:10px">Ended</span>';
    }

    function fmtDate(str) {
        const d = parseDate(str);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    function dateRange(ev) {
        if (isUnconfirmed(ev)) return '날짜 미확인';
        return ev.startDate === ev.endDate
            ? fmtDate(ev.startDate)
            : `${fmtDate(ev.startDate)} ~ ${fmtDate(ev.endDate)}`;
    }

    function modalBodyHtml(ev) {
        const cfg = CATS[ev.category] || CATS.festival;
        const tags = (ev.tags || [])
            .map(t => `<span class="modal-tag">${t}</span>`)
            .join('');
        const mapsUrl = `https://map.kakao.com/link/search/${encodeURIComponent(ev.venueName || ev.title)}`;
        const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(ev.title)}`;

        // 이미지 목록 구성
        const imgs = ev.images && ev.images.length > 0 ? ev.images : (ev.image ? [ev.image] : []);

        let imageHtml = '';
        if (imgs.length === 0) {
            // 이미지 없는 경우 카테고리 플레이스홀더
            imageHtml = `
                <div class="modal-image modal-image-placeholder" style="background:linear-gradient(135deg,${cfg.color}22,${cfg.color}55)">
                    <div class="placeholder-inner">
                        <span class="placeholder-emoji">${cfg.emoji}</span>
                        <span class="placeholder-label">${cfg.label}</span>
                    </div>
                </div>`;
        } else if (imgs.length === 1) {
            imageHtml = `
                <div class="modal-carousel" data-current="0">
                    <div class="carousel-track">
                        <div class="carousel-slide active"><img src="${imgs[0]}" alt="${ev.title}" loading="eager" onerror="this.closest('.modal-carousel').replaceWith(document.createElement('div'))"></div>
                    </div>
                </div>`;
        } else {
            const slides = imgs.map((src, i) =>
                `<div class="carousel-slide ${i === 0 ? 'active' : ''}"><img src="${src}" alt="${ev.title} ${i+1}" loading="${i === 0 ? 'eager' : 'lazy'}" onerror="this.parentElement.style.display='none'"></div>`
            ).join('');
            const dots = imgs.map((_, i) =>
                `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="사진 ${i+1}"></button>`
            ).join('');
            imageHtml = `
                <div class="modal-carousel" data-current="0">
                    <div class="carousel-track">${slides}</div>
                    <button class="carousel-btn carousel-prev" aria-label="이전">‹</button>
                    <button class="carousel-btn carousel-next" aria-label="다음">›</button>
                    <div class="carousel-dots">${dots}</div>
                    <span class="carousel-counter">1 / ${imgs.length}</span>
                </div>`;
        }

        // 링크: 공식 홈페이지 우선, 없으면 네이버 검색
        const linkHtml = ev.homepage
            ? `<a class="modal-homepage-btn" href="${ev.homepage}" target="_blank" rel="noopener">🔗 공식 홈페이지</a>`
            : `<a class="modal-homepage-btn modal-search-btn" href="${naverUrl}" target="_blank" rel="noopener">🔍 네이버 검색</a>`;

        const unconfirmedBanner = isUnconfirmed(ev)
            ? `<div class="modal-unconfirmed-banner">
                ⚠️ 날짜 정보를 확인하지 못했습니다.
                ${ev.homepage
                    ? `<a href="${ev.homepage}" target="_blank" rel="noopener">공식 페이지에서 확인 →</a>`
                    : `<a href="${naverUrl}" target="_blank" rel="noopener">네이버에서 확인 →</a>`}
               </div>`
            : '';

        return `
            ${imageHtml}
            <div class="modal-body-inner">
                <div class="modal-header-row">
                    <span class="modal-cat-badge" style="background:${cfg.color}">${cfg.emoji} ${cfg.label}</span>
                    <span class="modal-status-text">${statusLabel(ev)}</span>
                </div>
                <h2 class="modal-title">${ev.title}</h2>
                ${unconfirmedBanner}
                <div class="modal-meta">
                    <div class="modal-meta-row">📍 ${ev.venueName}</div>
                    <div class="modal-meta-addr">${ev.address}</div>
                    ${!isUnconfirmed(ev) ? `<div class="modal-meta-row">📅 ${dateRange(ev)}</div>` : ''}
                </div>
                ${ev.description && ev.description !== ev.title ? `<p class="modal-desc">${ev.description}</p>` : ''}
                ${tags ? `<div class="modal-tags">${tags}</div>` : ''}
                <div class="modal-footer">
                    <div>
                        <div class="modal-price-label">입장료</div>
                        <div class="modal-price-value" style="color:${cfg.color}">${ev.price}</div>
                    </div>
                    <div class="modal-footer-btns">
                        ${linkHtml}
                        <a class="modal-map-btn" href="${mapsUrl}" target="_blank" rel="noopener">지도에서 보기</a>
                    </div>
                </div>
            </div>
        `.trim();
    }

    function openModal(ev) {
        const overlay = document.getElementById('modal-overlay');
        const body    = document.getElementById('modal-body');
        if (!overlay || !body) return;

        body.innerHTML = modalBodyHtml(ev);
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        initCarousel(body);
    }

    function initCarousel(container) {
        const carousel = container.querySelector('.modal-carousel');
        if (!carousel) return;

        const slides  = carousel.querySelectorAll('.carousel-slide');
        const dots    = carousel.querySelectorAll('.carousel-dot');
        const counter = carousel.querySelector('.carousel-counter');
        const total   = slides.length;
        let cur = 0;

        function goTo(idx) {
            slides[cur].classList.remove('active');
            dots[cur].classList.remove('active');
            cur = (idx + total) % total;
            slides[cur].classList.add('active');
            dots[cur].classList.add('active');
            if (counter) counter.textContent = `${cur + 1} / ${total}`;
        }

        carousel.querySelector('.carousel-prev')?.addEventListener('click', () => goTo(cur - 1));
        carousel.querySelector('.carousel-next')?.addEventListener('click', () => goTo(cur + 1));
        dots.forEach(dot => dot.addEventListener('click', () => goTo(+dot.dataset.idx)));

        // 터치 스와이프
        let touchX = 0;
        carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
        carousel.addEventListener('touchend', e => {
            const diff = touchX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) goTo(diff > 0 ? cur + 1 : cur - 1);
        });
    }

    function closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function cardHtml(ev) {
        const cfg = CATS[ev.category] || CATS.festival;
        return `
            <div class="event-item" data-id="${ev.id}">
                <div class="event-item-top">
                    <span class="event-cat-badge" style="background:${cfg.color}">
                        ${cfg.emoji} ${cfg.label}
                    </span>
                    <span class="event-status-badge">${statusLabel(ev)}</span>
                </div>
                <div class="event-item-title">${ev.title}</div>
                <div class="event-item-meta">
                    📍 ${ev.venueName}<br>
                    📅 ${dateRange(ev)}
                </div>
                <div class="event-item-price" style="color:${cfg.color}">${ev.price}</div>
            </div>
        `.trim();
    }

    function highlightCard(id) {
        document.querySelectorAll('.event-item').forEach(el => el.classList.remove('highlighted'));
        const card = document.querySelector(`.event-item[data-id="${id}"]`);
        if (card) {
            card.classList.add('highlighted');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        activeCardId = id;
    }

    function renderPanel() {
        const list = getFiltered();

        const countEl = document.getElementById('panel-count');
        if (countEl) countEl.textContent = `${list.length}개 이벤트`;

        const listEl = document.getElementById('panel-list');
        if (!listEl) return;

        if (list.length === 0) {
            listEl.innerHTML = '<div class="no-events-msg">조건에 맞는 이벤트가 없어요 🤔<br><small>필터를 바꿔 다시 찾아보세요</small></div>';
        } else {
            listEl.innerHTML = list.map(cardHtml).join('');
            listEl.querySelectorAll('.event-item').forEach(el => {
                el.addEventListener('click', () => onCardClick(el.getAttribute('data-id')));
            });
        }
    }

    function renderMarkers() {
        if (!map || !markerLayer) return;
        const list = getFiltered();

        markerLayer.clearLayers();
        Object.keys(markersById).forEach(k => delete markersById[k]);

        list.forEach(ev => {
            const cfg = CATS[ev.category] || CATS.festival;
            const icon = L.divIcon({
                className: 'map-marker-divicon',
                html: `<div class="map-pin" style="background:${cfg.color}"><span class="map-pin-inner">${cfg.emoji}</span></div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
            });
            const marker = L.marker([ev.lat, ev.lng], { icon });
            marker.on('click', () => {
                highlightCard(ev.id);
                openModal(ev);
            });
            marker.addTo(markerLayer);
            markersById[ev.id] = marker;
        });

        if (list.length > 1) {
            const bounds = L.latLngBounds(list.map(ev => [ev.lat, ev.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } else if (list.length === 1) {
            map.setView([list[0].lat, list[0].lng], 13);
        } else {
            map.setView([SEOUL_LAT, SEOUL_LNG], 11);
        }

        if (activeCardId && markersById[activeCardId]) {
            highlightCard(activeCardId);
        } else {
            activeCardId = null;
        }
    }

    function render() {
        renderPanel();
        renderMarkers();
    }

    function onCardClick(id) {
        const ev = CITY_EVENTS.find(e => e.id === id);
        if (!ev) return;

        highlightCard(id);
        openModal(ev);

        if (map) {
            map.setView([ev.lat, ev.lng], 14);
        }
    }

    function bindFilters() {
        document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('modal-overlay')?.addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });

        document.querySelectorAll('.chip[data-cat]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.chip[data-cat]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                state.category = this.getAttribute('data-cat');
                activeCardId = null;
                render();
            });
        });

        document.querySelectorAll('.time-chip[data-time]').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.time-chip[data-time]').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                state.time = this.getAttribute('data-time');
                activeCardId = null;
                render();
            });
        });

        const searchEl = document.getElementById('search-input');
        if (searchEl) {
            let timer;
            searchEl.addEventListener('input', function () {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    state.search = this.value.trim();
                    activeCardId = null;
                    render();
                }, 280);
            });
        }
    }

    function initMap() {
        const el = document.getElementById('map');
        if (!el) return;

        if (typeof L === 'undefined') {
            el.innerHTML = '<p style="padding:24px;color:#666;font-size:14px;line-height:1.6;text-align:center">Leaflet 지도를 불러오지 못했습니다.</p>';
            return;
        }

        map = L.map('map', { zoomControl: true }).setView([SEOUL_LAT, SEOUL_LNG], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);

        function invalidateAndMarkers() {
            if (!map) return;
            map.invalidateSize();
            renderMarkers();
        }

        requestAnimationFrame(invalidateAndMarkers);
        window.addEventListener('load', invalidateAndMarkers);
        window.addEventListener('resize', function () {
            requestAnimationFrame(function () {
                if (map) map.invalidateSize();
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderPanel();
        bindFilters();
        initMap();
    });
})();
