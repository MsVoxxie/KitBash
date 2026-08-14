const { Rettiwt } = require('rettiwt-api');
const { cleanDiscordMarkdown, removeUrl } = require('./stringFormatters');
const { getTweetMediaFallback, pickBestDiscordMedia } = require('../fetch/tweetMediaFallback');
const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

async function getMedia(message) {
	const media = [];
	let content = cleanDiscordMarkdown(message.content);

	// Twitter
	const twitMatch = /(?:x|twitter)\.com\/([a-zA-Z0-9_]{1,15})\/status\/(\d+)/s.exec(message.content);
	const twitId = twitMatch ? twitMatch[2] : null;
	const twitUser = twitMatch ? twitMatch[1] : null;
	if (twitId) {
		let tweetMediaFound = false;
		try {
			const res = await twitFetch.tweet.details(twitId);
			if (!res) return;

			if (res.fullText) {
				content = cleanDiscordMarkdown(removeUrl(res.fullText));
			}

			if (Array.isArray(res.media) && res.media.length) {
				const candidateMedia = res.media.map((m) => m?.url).filter(Boolean);
				const bestMedia = pickBestDiscordMedia(candidateMedia);
				if (bestMedia) {
					media.push(bestMedia);
					tweetMediaFound = true;
				}
			}
		} catch (e) {
			const fallback = await getTweetMediaFallback(twitUser, twitId);
			if (fallback.fullText) {
				content = cleanDiscordMarkdown(removeUrl(fallback.fullText));
			}
			const bestMedia = pickBestDiscordMedia(fallback.media);
			if (bestMedia) {
				media.push(bestMedia);
				tweetMediaFound = true;
			}
		}

		if (tweetMediaFound) return { content: content, media: media };
	}

	// Attachments
	if (message.attachments.size) {
		for await (const attachment of message.attachments) {
			media.push(attachment[1].url);
		}
	}

	// Embeds
	if (message.embeds.length) {
		for await (const embed of message.embeds) {
			if (embed.image) media.push(embed.image.url);
			if (embed.thumbnail) media.push(embed.thumbnail.url);
		}
	}

	return { content: content, media: media };
}

module.exports = getMedia;
