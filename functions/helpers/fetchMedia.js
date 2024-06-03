const { Rettiwt } = require('rettiwt-api');
const { cleanDiscordMarkdown, removeUrl } = require('./stringFormatters');
const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

async function getMedia(message) {
	const media = [];
	let content = cleanDiscordMarkdown(message.content);

	// Twitter
	const twitId = /\/status\/(\d+)/s.exec(message.content);
	if (twitId) {
		await twitFetch.tweet.details(twitId[1]).then(async (res) => {
			if (!res) return;

			if (res.fullText) {
				content = cleanDiscordMarkdown(removeUrl(res.fullText));
			}

			if (!res.media) {
				for await (const attachment of res.media) {
					media.push(attachment.url);
				}
			}
		});
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
