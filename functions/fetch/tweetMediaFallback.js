const MEDIA_EXT_REGEX = /\.(jpe?g|png|webp|gif|mp4|m3u8)(\?|$)/i;
const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;

function looksLikeMediaUrl(value) {
	if (typeof value !== 'string') return false;
	if (MEDIA_EXT_REGEX.test(value)) return true;
	if (value.includes('twimg.com/media/')) return true;
	if (value.includes('twimg.com/ext_tw_video/')) return true;
	if (value.includes('/video.twimg.com/')) return true;
	return false;
}

function normalizeUrl(url) {
	if (!url || typeof url !== 'string') return null;
	return url.replace(/&amp;/g, '&');
}

function collectMediaUrlsFromObject(input, bag) {
	if (!input) return;

	if (typeof input === 'string') {
		const maybeUrl = normalizeUrl(input.trim());
		if (looksLikeMediaUrl(maybeUrl)) bag.add(maybeUrl);
		return;
	}

	if (Array.isArray(input)) {
		for (const item of input) collectMediaUrlsFromObject(item, bag);
		return;
	}

	if (typeof input === 'object') {
		for (const value of Object.values(input)) {
			collectMediaUrlsFromObject(value, bag);
		}
	}
}

function parseMetaContent(html, metaName) {
	const re = new RegExp(`<meta[^>]+(?:property|name)=["']${metaName}["'][^>]+content=["']([^"']+)["']`, 'i');
	const match = re.exec(html);
	return match ? normalizeUrl(match[1]) : null;
}

function collectMediaUrlsFromHtml(html, bag) {
	if (!html || typeof html !== 'string') return;

	const ogImage = parseMetaContent(html, 'og:image');
	if (looksLikeMediaUrl(ogImage)) bag.add(ogImage);

	const ogVideo = parseMetaContent(html, 'og:video');
	if (looksLikeMediaUrl(ogVideo)) bag.add(ogVideo);

	const twitterImage = parseMetaContent(html, 'twitter:image');
	if (looksLikeMediaUrl(twitterImage)) bag.add(twitterImage);

	const urlMatches = html.match(URL_REGEX) || [];
	for (const url of urlMatches) {
		const normalized = normalizeUrl(url);
		if (looksLikeMediaUrl(normalized)) bag.add(normalized);
	}
}

function scoreMediaUrl(url) {
	if (typeof url !== 'string') return -Infinity;

	let score = 0;
	const lower = url.toLowerCase();

	if (lower.includes('.m3u8')) score -= 2000;
	if (lower.includes('.mp4')) score += 1200;
	if (lower.includes('/video.twimg.com/')) score += 400;
	if (lower.includes('twimg.com/ext_tw_video/')) score += 400;
	if (lower.includes('twimg.com/media/')) score += 150;

	const resMatch = lower.match(/\/(\d{2,5})x(\d{2,5})\//);
	if (resMatch) {
		const width = Number(resMatch[1]) || 0;
		const height = Number(resMatch[2]) || 0;
		score += Math.floor((width * height) / 5000);
	}

	const kbpsMatch = lower.match(/(\d{2,5})k(?:b)?ps/);
	if (kbpsMatch) {
		score += Number(kbpsMatch[1]) || 0;
	}

	return score;
}

function pickBestDiscordMedia(mediaUrls) {
	if (!Array.isArray(mediaUrls) || !mediaUrls.length) return null;

	const unique = [...new Set(mediaUrls.filter(Boolean).map((url) => normalizeUrl(url)))].filter(Boolean);
	if (!unique.length) return null;

	unique.sort((a, b) => scoreMediaUrl(b) - scoreMediaUrl(a));
	return unique[0];
}

async function tryEndpointJson(url, timeoutMs) {
	const response = await fetch(url, {
		headers: { 'user-agent': 'Mozilla/5.0 KitbashBot/1.0' },
		signal: AbortSignal.timeout(timeoutMs),
	});

	if (!response.ok) return { ok: false };

	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		return { ok: true, kind: 'json', data: await response.json() };
	}

	return { ok: true, kind: 'text', data: await response.text() };
}

async function getTweetMediaFallback(tweetUser, tweetId) {
	if (!tweetId) return { media: [], fullText: null };

	const userPart = tweetUser || 'i';
	const endpoints = [
		`https://api.fxtwitter.com/${userPart}/status/${tweetId}`,
		`https://api.vxtwitter.com/${userPart}/status/${tweetId}`,
		`https://fixupx.com/${userPart}/status/${tweetId}`,
	];

	const mediaBag = new Set();
	let fullText = null;

	for (const endpoint of endpoints) {
		try {
			const result = await tryEndpointJson(endpoint, 8000);
			if (!result.ok) continue;

			if (result.kind === 'json') {
				const body = result.data;
				fullText = fullText || body?.tweet?.text || body?.tweet?.full_text || body?.text || body?.full_text || null;
				collectMediaUrlsFromObject(body, mediaBag);
			}

			if (result.kind === 'text') {
				collectMediaUrlsFromHtml(result.data, mediaBag);
			}

			if (mediaBag.size) break;
		} catch (e) {
			// Continue trying other endpoints.
		}
	}

	return { media: [...mediaBag], fullText };
}

module.exports = { getTweetMediaFallback, pickBestDiscordMedia };