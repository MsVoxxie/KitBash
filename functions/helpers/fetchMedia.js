const { Rettiwt } = require('rettiwt-api');
const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN });

async function getMedia(message) {
	const media = [];

	// Twitter
	const twitId = /\/status\/(\d+)/s.exec(message.content);
	if (twitId) {
		await twitFetch.tweet.details(twitId[1]).then(async (res) => {
			if (!res) return;
			if (!res.media) return;
			for await (const attachment of res.media) {
				media.push(attachment.url);
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

	return media;
}

module.exports = getMedia;
