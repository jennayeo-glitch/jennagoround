/**
 * YouTube Data API v3 → content-stats.json 갱신
 *
 * 사용법:
 *   YOUTUBE_API_KEY=your_key npm run fetch-content
 *
 * content-channels.json 의 youtubeChannelId 를 채워야 합니다.
 * (YouTube Studio → 설정 → 채널 → 고급 → 채널 ID)
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const API_KEY = process.env.YOUTUBE_API_KEY;
const channelsPath = resolve(root, 'content-channels.json');
const statsPath = resolve(root, 'content-stats.json');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function saveJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function upsertHistory(history, entry) {
  const list = Array.isArray(history) ? [...history] : [];
  const idx = list.findIndex((h) => h.month === entry.month);
  if (idx >= 0) list[idx] = { ...list[idx], ...entry };
  else list.push(entry);
  list.sort((a, b) => a.month.localeCompare(b.month));
  return list.slice(-6);
}

async function fetchYouTubeChannel(channelId) {
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'statistics,snippet');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error(`Channel not found: ${channelId}`);
  return item;
}

async function fetchRecentVideos(channelId, maxResults = 5) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('channelId', channelId);
  url.searchParams.set('order', 'date');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube search API ${res.status}`);
  const data = await res.json();
  const ids = (data.items || []).map((i) => i.id?.videoId).filter(Boolean);
  if (!ids.length) return [];

  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'statistics,snippet');
  statsUrl.searchParams.set('id', ids.join(','));
  statsUrl.searchParams.set('key', API_KEY);

  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json();

  return (statsData.items || []).map((v) => ({
    title: v.snippet?.title,
    views: Number(v.statistics?.viewCount || 0),
    likes: Number(v.statistics?.likeCount || 0),
    publishedAt: v.snippet?.publishedAt,
    url: `https://www.youtube.com/watch?v=${v.id}`
  }));
}

async function main() {
  const channels = loadJson(channelsPath);
  const stats = loadJson(statsPath);
  if (!stats.channels) stats.channels = {};

  let updated = false;

  for (const ch of channels) {
    if (ch.platform !== 'youtube' || !ch.youtubeChannelId) {
      console.info(`[skip] ${ch.id}: youtubeChannelId 없음`);
      continue;
    }
    if (!API_KEY) {
      console.warn('[skip] YOUTUBE_API_KEY 환경변수 없음');
      break;
    }

    console.info(`[fetch] ${ch.name} (${ch.youtubeChannelId})`);
    const item = await fetchYouTubeChannel(ch.youtubeChannelId);
    const st = item.statistics;
    const subs = Number(st.subscriberCount || 0);
    const views = Number(st.viewCount || 0);
    const videos = Number(st.videoCount || 0);
    const avgViews = videos > 0 ? Math.round(views / videos) : 0;

    const prev = stats.channels[ch.id] || {};
    const history = upsertHistory(prev.history, {
      month: monthKey(),
      subscribers: subs,
      totalViews: views
    });

    let recentContent = [];
    try {
      recentContent = await fetchRecentVideos(ch.youtubeChannelId);
    } catch (e) {
      console.warn('[warn] recent videos:', e.message);
    }

    stats.channels[ch.id] = {
      ...prev,
      subscribers: subs,
      totalViews: views,
      videoCount: videos,
      avgViews,
      history,
      recentContent
    };
    updated = true;
  }

  if (updated) {
    stats.updatedAt = new Date().toISOString();
    stats.source = 'youtube-api';
    saveJson(statsPath, stats);
    console.info(`✓ saved ${statsPath}`);
  } else {
    console.info('변경 없음 — content-channels.json 과 YOUTUBE_API_KEY 확인');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
