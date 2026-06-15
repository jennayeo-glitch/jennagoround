/**
 * TourAPI 전국 행사 데이터 수집 스크립트
 * 실행: node scripts/fetch-events.js
 *
 * searchFestival2 사용 → 날짜 필터 + 날짜 포함 응답 → detailIntro2 호출 불필요
 * API 호출 수: 목록 페이지 수만큼 (30~50회) + 상세(선택)
 */

import 'dotenv/config';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const API_KEY     = process.env.TOUR_API_KEY;
const BASE_URL    = 'https://apis.data.go.kr/B551011/KorService2';
const CACHE_FILE  = resolve(__dirname, '.cache/details.json');
const OUT_FILE    = resolve(__dirname, '../city-events-api.js');
const BATCH_SIZE  = 10;
const BATCH_DELAY = 300;

if (!API_KEY) { console.error('❌  TOUR_API_KEY가 .env에 없음'); process.exit(1); }

// ── 캐시 ──────────────────────────────────────────────────────────────────
function loadCache() {
    if (!existsSync(CACHE_FILE)) return {};
    try { return JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { return {}; }
}
function saveCache(cache) {
    mkdirSync(resolve(__dirname, '.cache'), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8');
}

// ── 카테고리 ───────────────────────────────────────────────────────────────
const CAT_MAP  = { A0207:'festival', A0208:'party', A0210:'exhibition', A0502:'concert' };
const TYPE_MAP = { 14:'exhibition', 15:'festival' };
function guessCategory(item) { return CAT_MAP[item.cat2] || TYPE_MAP[item.contenttypeid] || 'festival'; }

// ── API 헬퍼 ───────────────────────────────────────────────────────────────
function qs(extra = {}) {
    return new URLSearchParams({ serviceKey: API_KEY, MobileOS:'ETC', MobileApp:'jennagoround', _type:'json', ...extra }).toString();
}

async function apiGet(endpoint, extra, retries = 2) {
    try {
        const res  = await fetch(`${BASE_URL}/${endpoint}?${qs(extra)}`);
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { return { quota: true }; }
        if (json?.response?.header?.resultCode !== '0000') return { items: [], error: json?.response?.header?.resultMsg };
        const items = json?.response?.body?.items?.item;
        return { items: items ? (Array.isArray(items) ? items : [items]) : [], total: json?.response?.body?.totalCount };
    } catch (e) {
        if (retries > 0) { await delay(500); return apiGet(endpoint, extra, retries - 1); }
        return { items: [], error: e.message };
    }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 오늘/3개월 후 날짜 ─────────────────────────────────────────────────────
function dateRange() {
    const fmt = d => d.toISOString().slice(0,10).replace(/-/g,'');
    const start = new Date();
    const end   = new Date(); end.setMonth(end.getMonth() + 3);
    return { stdate: fmt(start), eddate: fmt(end) };
}

// ── Step 1: searchFestival2로 날짜 포함 목록 수집 ──────────────────────────
// 날짜 필터 적용 → 오늘 이후 이벤트만, 날짜 응답에 포함됨
async function fetchFestivals() {
    const { stdate, eddate } = dateRange();
    const all = []; let page = 1;
    console.log(`   행사 기간: ${stdate} ~ ${eddate}`);

    while (true) {
        const r = await apiGet('searchFestival2', { eventStartDate: stdate, eventEndDate: eddate, numOfRows: 100, pageNo: page });
        if (r.quota) { console.warn('\n⚠️  API 한도 초과 (searchFestival2)'); break; }
        if (!r.items || r.items.length === 0) break;
        all.push(...r.items);
        process.stdout.write(`\r   축제/행사 수집: ${all.length}개`);
        if (r.items.length < 100) break;
        page++;
        if (page > 30) break;
        await delay(200);
    }
    console.log('');
    return all;
}

// ── Step 2: 일반 행사(contentTypeId=14) 도 수집 (문화시설 등) ─────────────
// areaBasedList2는 날짜 없으나 보완용으로 수집
async function fetchCultural() {
    const all = []; let page = 1;
    while (true) {
        const r = await apiGet('areaBasedList2', { contentTypeId: 14, numOfRows: 100, pageNo: page });
        if (r.quota) { console.warn('\n⚠️  API 한도 초과 (areaBasedList2)'); break; }
        if (!r.items || r.items.length === 0) break;
        all.push(...r.items);
        process.stdout.write(`\r   문화시설 수집: ${all.length}개`);
        if (r.items.length < 100) break;
        page++;
        if (page > 10) break;
        await delay(200);
    }
    console.log('');
    return all;
}

// ── Step 3: 상세 정보 (설명·홈페이지·이미지) — 캐시 활용 ─────────────────
async function fetchDetails(items, cache) {
    const uncached = items.filter(item => !cache[item.contentid]);
    if (uncached.length === 0) { console.log('   상세: 캐시 완전 히트'); return false; }
    console.log(`   상세 미캐시: ${uncached.length}개 (히트: ${items.length - uncached.length}개)`);

    let quotaHit = false;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        const batch = uncached.slice(i, i + BATCH_SIZE);
        const rows  = await Promise.all(batch.map(async item => {
            const [rCommon, rImages] = await Promise.all([
                apiGet('detailCommon2', { contentId: item.contentid }),
                apiGet('detailImage2',  { contentId: item.contentid, imageYN: 'Y' }),
            ]);
            if (rCommon.quota || rImages.quota) return { id: item.contentid, quota: true };

            const common = rCommon.items?.[0] || {};
            const imgs   = (rImages.items || []).map(i => i.originimgurl).filter(Boolean);

            let homepage = '';
            if (common.homepage) {
                const m = common.homepage.match(/href=["']([^"']+)["']/i);
                homepage = m ? m[1] : common.homepage.replace(/<[^>]+>/g,'').trim();
                if (homepage && !homepage.startsWith('http')) homepage = `https://${homepage}`;
            }
            const overview = (common.overview || '')
                .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g,'')
                .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
                .trim().slice(0, 300) || null;

            return { id: item.contentid, overview, homepage, images: [...new Set(imgs)].slice(0, 8) };
        }));

        for (const r of rows) {
            if (r?.quota) { quotaHit = true; break; }
            if (r?.id) cache[r.id] = r;
        }
        saveCache(cache);
        process.stdout.write(`\r   상세 수집: ${Math.min(i + BATCH_SIZE, uncached.length)}/${uncached.length}`);
        if (quotaHit) { console.warn('\n⚠️  한도 초과 — 캐시 저장 후 중단'); break; }
        if (i + BATCH_SIZE < uncached.length) await delay(BATCH_DELAY);
    }
    console.log('');
    return quotaHit;
}

// ── 날짜 변환 ──────────────────────────────────────────────────────────────
function toDateStr(s) {
    if (!s) return null;
    s = String(s).replace(/\./g,'-');
    if (s.length === 8 && !s.includes('-')) s = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    return s.slice(0,10).match(/^\d{4}-\d{2}-\d{2}$/) ? s.slice(0,10) : null;
}

// ── 정규화 ────────────────────────────────────────────────────────────────
function normalize(item, detail) {
    // searchFestival2 응답에 날짜 필드 포함
    const start = toDateStr(item.eventstartdate || item.startdate);
    const end   = toDateStr(item.eventenddate   || item.enddate);
    const dateConfidence = (start && end) ? 'confirmed' : 'unconfirmed';
    const imgs  = detail?.images || [];

    return {
        id:             `tour_${item.contentid}`,
        title:          item.title,
        category:       guessCategory(item),
        startDate:      start,
        endDate:        end,
        dateConfidence,
        venueName:      item.addr2 || item.addr1?.split(' ').slice(2).join(' ') || '장소 미정',
        address:        item.addr1 || '',
        lat:            parseFloat(item.mapy) || 36.5,
        lng:            parseFloat(item.mapx) || 127.5,
        description:    detail?.overview || null,
        price:          item.usetimefestival?.replace(/<[^>]+>/g,'').trim() || '무료',
        tags:           [],
        image:          item.firstimage || imgs[0] || '',
        images:         imgs.length > 0 ? imgs : (item.firstimage ? [item.firstimage] : []),
        homepage:       detail?.homepage || '',
        source:         'tourapi',
    };
}

// ── 유효성 ────────────────────────────────────────────────────────────────
function isValid(ev) {
    if (ev.lat < 33.0 || ev.lat > 38.7 || ev.lng < 124.5 || ev.lng > 132.0) return false;
    if (ev.dateConfidence === 'confirmed') {
        const end = new Date(ev.endDate); const now = new Date(); now.setHours(0,0,0,0);
        if (end < now) return false;
    } else {
        if (!ev.image && !ev.homepage) return false;
    }
    return true;
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔍  TourAPI 전국 행사 수집 (searchFestival2 기반)');
    const cache = loadCache();
    console.log(`   캐시: ${Object.keys(cache).length}개 로드`);

    // Step 1: 날짜 포함 축제/행사 목록
    const festivals = await fetchFestivals();
    if (festivals.length === 0) {
        console.error('❌  searchFestival2 실패 — API 한도 또는 엔드포인트 문제');
        console.log('   대안: areaBasedList2로 전환 시도...');
    }

    // Step 2: 문화시설 추가 (중복 제거)
    const cultural = festivals.length > 0 ? await fetchCultural() : [];
    const seen = new Set(festivals.map(i => i.contentid));
    const combined = [...festivals, ...cultural.filter(i => !seen.has(i.contentid))];
    console.log(`   합계: ${combined.length}개 (축제: ${festivals.length} + 문화: ${cultural.filter(i => !seen.has(i.contentid)).length})`);

    if (combined.length === 0) {
        console.error('❌  수집 실패 — API 한도 초과 상태. 잠시 후 재시도하세요.');
        process.exit(1);
    }

    // Step 3: 상세 (설명·이미지·홈페이지) — 선택적
    const quotaHit = await fetchDetails(combined, cache);

    // 정규화 + 필터
    const events = combined.map(item => normalize(item, cache[item.contentid]));
    const valid  = events.filter(isValid);
    const confirmed   = valid.filter(e => e.dateConfidence === 'confirmed').length;
    const unconfirmed = valid.filter(e => e.dateConfidence === 'unconfirmed').length;

    console.log(`\n✅  유효 이벤트: ${valid.length}개`);
    console.log(`   날짜 확인됨: ${confirmed}개 / 미확인: ${unconfirmed}개`);
    const rc = {};
    valid.forEach(ev => { const r=ev.address.split(' ')[0]||'기타'; rc[r]=(rc[r]||0)+1; });
    console.log('   지역별:', Object.entries(rc).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([r,c])=>`${r}(${c})`).join(', '));

    if (valid.length === 0) {
        console.error('❌  0개 — 기존 파일 유지'); process.exit(1);
    }

    writeFileSync(OUT_FILE, `// 자동 생성 — ${new Date().toISOString().slice(0,10)}\nconst TOUR_EVENTS = ${JSON.stringify(valid, null, 2)};\n`, 'utf8');
    console.log(`📄  저장: city-events-api.js (${valid.length}개)${quotaHit ? ' ⚠️ 상세 일부 미수집' : ''}`);
}

main().catch(err => { console.error('❌ ', err.message); process.exit(1); });
