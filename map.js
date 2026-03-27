/**
 * 서울 기준 모임 지도 — Leaflet + 구 단위 대략 좌표
 * 이벤트에 lat/lng 를 직접 넣으면 그 좌표를 우선 사용합니다.
 */
(function () {
    const MEETUP = {
        networking: { label: '네트워킹', color: '#2563eb' },
        gathering: { label: '게더링', color: '#059669' },
        'small-group': { label: '소모임', color: '#d97706' }
    };

    /** 서울 자치구 대략 중심 (표시용) */
    const DISTRICT_LATLNG = {
        강남구: [37.5172, 127.0473],
        강동구: [37.5301, 127.1238],
        강북구: [37.6396, 127.0257],
        강서구: [37.5509, 126.8495],
        관악구: [37.4784, 126.9516],
        광진구: [37.5384, 127.0822],
        구로구: [37.4954, 126.8878],
        금천구: [37.4519, 126.8959],
        노원구: [37.6542, 127.0568],
        도봉구: [37.6688, 127.0471],
        동대문구: [37.5744, 127.0396],
        동작구: [37.5124, 126.9393],
        마포구: [37.5663, 126.9019],
        서대문구: [37.5791, 126.9368],
        서초구: [37.4836, 127.0327],
        성동구: [37.5633, 127.0367],
        성북구: [37.5894, 127.0167],
        송파구: [37.5145, 127.1059],
        탄천: [37.5145, 127.08],
        양천구: [37.517, 126.8662],
        영등포구: [37.5264, 126.8962],
        용산구: [37.5384, 126.9654],
        은평구: [37.6028, 126.9291],
        종로구: [37.5735, 126.9788],
        중구: [37.564, 126.997],
        중랑구: [37.6063, 127.0926]
    };

    const SEOUL_CENTER = [37.5665, 126.978];

    function getMeetupType(event) {
        if (event.meetupType && MEETUP[event.meetupType]) return event.meetupType;
        if (event.category === 'regular gathering') return 'gathering';
        if (event.category === 'private party') return 'small-group';
        return 'networking';
    }

    function jitter(lat, lng, index) {
        const r = 0.0012 * (index + 1);
        const angle = (index * 137.5 * Math.PI) / 180;
        return [lat + r * Math.cos(angle), lng + r * Math.sin(angle)];
    }

    function coordsForEvent(event, index) {
        if (typeof event.lat === 'number' && typeof event.lng === 'number') {
            return jitter(event.lat, event.lng, index);
        }
        const base = DISTRICT_LATLNG[event.location] || SEOUL_CENTER;
        return jitter(base[0], base[1], index);
    }

    function eventDetailUrl(event) {
        if ([1, 9].includes(event.id)) return `event-detail.html?id=${event.id}`;
        return null;
    }

    let map = null;
    let markerLayer = null;

    function createMarkerIcon(typeKey) {
        const c = MEETUP[typeKey].color;
        return L.divIcon({
            className: 'map-marker-wrap',
            html: `<span class="map-marker-dot" style="background:${c}"></span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 22],
            popupAnchor: [0, -20]
        });
    }

    function buildPopupHtml(event) {
        const t = getMeetupType(event);
        const typeLabel = MEETUP[t].label;
        const title = event.title || event.alt || '모임';
        const link = eventDetailUrl(event);
        const linkHtml = link
            ? `<a href="${link}" class="map-popup-link">상세 보기</a>`
            : '<span class="map-popup-muted">상세 준비중</span>';
        return `
            <div class="map-popup-inner">
                <span class="map-popup-type" style="color:${MEETUP[t].color}">${typeLabel}</span>
                <strong class="map-popup-title">${title}</strong>
                <div class="map-popup-meta">${event.displayDate} · ${event.location}</div>
                ${linkHtml}
            </div>
        `;
    }

    function renderMarkers(filter) {
        if (!map || !markerLayer) return;
        markerLayer.clearLayers();

        const list = eventsData.filter((e) => {
            if (filter === 'all') return true;
            return getMeetupType(e) === filter;
        });

        list.forEach((event, i) => {
            const globalIndex = eventsData.indexOf(event);
            const t = getMeetupType(event);
            const [lat, lng] = coordsForEvent(event, globalIndex);
            const m = L.marker([lat, lng], { icon: createMarkerIcon(t) });
            m.bindPopup(buildPopupHtml(event), { maxWidth: 280 });
            markerLayer.addLayer(m);
        });

        if (list.length === 0) {
            map.setView(SEOUL_CENTER, 11);
            return;
        }

        const points = list.map((e) => coordsForEvent(e, eventsData.indexOf(e)));
        if (points.length === 1) {
            map.setView(points[0], 13);
            return;
        }

        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    }

    function initMap() {
        const el = document.getElementById('map');
        if (!el || typeof L === 'undefined') return;

        map = L.map('map', { scrollWheelZoom: true, zoomControl: true }).setView(SEOUL_CENTER, 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
        renderMarkers('all');

        document.querySelectorAll('.map-filter-btn').forEach((btn) => {
            btn.addEventListener('click', function () {
                const f = this.getAttribute('data-filter') || 'all';
                document.querySelectorAll('.map-filter-btn').forEach((b) => b.classList.remove('active'));
                this.classList.add('active');
                renderMarkers(f);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', initMap);
})();
