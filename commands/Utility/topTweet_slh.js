const { SlashCommandBuilder, InteractionContextType, ApplicationIntegrationType, MessageFlags } = require('discord.js');
const TweetCache = require('../../models/tweetCache');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('toptweet')
		.setDescription("Find a user's top rated tweet")
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.UserInstall])
		.addStringOption((option) => option.setName('username').setDescription('Twitter username (without @)').setRequired(true))
		.addBooleanOption((bool) => bool.setName('ephemeral').setDescription('Should this message be hidden? (Default False)')),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const { Rettiwt } = require('rettiwt-api');
		const twitFetch = new Rettiwt({ apiKey: process.env.TWIT_TOKEN, delay: 350 });

		const usernameRaw = interaction.options.getString('username');
		const usernameFromUrl = (() => {
			try {
				const parsed = new URL(usernameRaw);
				const host = parsed.hostname.toLowerCase();
				const isX = host === 'x.com' || host === 'www.x.com' || host === 'twitter.com' || host === 'www.twitter.com';
				const match = isX ? parsed.pathname.split('/').filter(Boolean)[0] : null;
				return match || null;
			} catch (e) {
				return null;
			}
		})();

		const username = (usernameFromUrl || usernameRaw).replace('@', '').trim();
		if (!username || username.length > 15) {
			return interaction.reply({ content: 'Please provide a valid Twitter username (max 15 characters).', flags: MessageFlags.Ephemeral });
		}

		let userDetails;
		try {
			userDetails = await twitFetch.user.details(username);
		} catch (err) {
			console.log(err);
			return interaction.reply({ content: 'Could not fetch that user. Please try again later.', flags: MessageFlags.Ephemeral });
		}

		if (!userDetails || !userDetails.id) {
			return interaction.reply({ content: `No user found for @${username}.`, flags: MessageFlags.Ephemeral });
		}

		const targetId = userDetails.id;
		const targetHandle = userDetails.userName || username;

		const ephCheck = interaction.options.getBoolean('ephemeral');
		const ephemeralToggle = ephCheck !== null ? ephCheck : false;
		await interaction.deferReply({ ephemeral: ephemeralToggle });

		// Try cache first (24h TTL)
		const cached = await TweetCache.findOne({ userId: targetId }).lean();
		if (cached) {
			const scannedInfo = `Scanned ${cached.meta.tweetsSeen} tweets across ${cached.meta.pagesFetched} page${cached.meta.pagesFetched === 1 ? '' : 's'} (max 50). (cached)`;
			return interaction.editReply({
				content: `Top tweet for @${cached.handle}\n${scannedInfo}\n${cached.topTweetUrl}`,
			});
		}

		await interaction.editReply({ content: `Scanning @${targetHandle} for top tweets...` });

		const PAGE_SIZE = 20; // API limit per docs
		const MAX_PAGES = 50; // Cap at ~1000 tweets to keep latency reasonable
		const PER_PAGE_DELAY_MS = 1500; // soft throttle to reduce 429s
		const TEXT_LIMIT = 1500; // keep message safe for Discord

		let cursor;
		let pagesFetched = 0;
		let tweetsSeen = 0;
		let best = null;

		const PROGRESS_PAGE_INTERVAL = 5; // avoid spamming Discord rate limits
		while (pagesFetched < MAX_PAGES) {
			let page;
			try {
				page = await twitFetch.user.timeline(targetId, PAGE_SIZE, cursor);
			} catch (err) {
				console.log(err);
				if (err?.status === 429) {
					return interaction.editReply({ content: 'Twitter rate limited this request. Please wait a bit and try again.' });
				}
				return interaction.editReply({ content: 'Twitter rejected the request. Please try again later or with a smaller account.' });
			}

			if (!page || !page.list || !page.list.length) break;

			for (const tweet of page.list) {
				// Skip retweets; keep original content and quotes
				const raw = typeof tweet.raw === 'function' ? tweet.raw() : tweet.raw;
				const isRtText = typeof tweet.fullText === 'string' && tweet.fullText.trim().toLowerCase().startsWith('rt @');
				const isLegacyRt = raw?.legacy?.retweeted_status_id_str || raw?.legacy?.retweeted_status_id;
				const isRetweet = Boolean(tweet.retweetedTweet || isLegacyRt || isRtText);
				if (isRetweet) continue;
				if (tweet.tweetBy && tweet.tweetBy.id && tweet.tweetBy.id !== targetId) continue;

				tweetsSeen += 1;
				const likeCount = tweet.likeCount ?? 0;
				const retweetCount = tweet.retweetCount ?? 0;
				const replyCount = tweet.replyCount ?? 0;
				const quoteCount = tweet.quoteCount ?? 0;

				// Weighted score to approximate engagement
				const score = likeCount * 2 + retweetCount * 1.5 + replyCount + quoteCount;

				if (!best || score > best.score) {
					best = {
						score,
						likeCount,
						retweetCount,
						replyCount,
						quoteCount,
						tweet,
					};
				}
			}

			pagesFetched += 1;
			if (!page.next || !page.next.value) break;
			cursor = page.next.value;

			// Throttled progress logs to respect Discord rate limits
			if (pagesFetched % PROGRESS_PAGE_INTERVAL === 0) {
				await interaction.editReply({ content: `Scanning @${targetHandle}... checked ${tweetsSeen} tweets so far.` });
			}

			// Apply a small delay to reduce API rate pressure
			if (PER_PAGE_DELAY_MS > 0) {
				await new Promise((resolve) => setTimeout(resolve, PER_PAGE_DELAY_MS));
			}
		}

		if (!best) {
			return interaction.editReply({ content: `Could not find any original tweets for @${targetHandle}.` });
		}

		const topTweet = best.tweet;
		const url = topTweet.url || `https://x.com/${targetHandle}/status/${topTweet.id}`;
		const rawText = typeof topTweet.fullText === 'string' ? topTweet.fullText.trim() : '(No text)';
		const clippedText = rawText.length > TEXT_LIMIT ? `${rawText.slice(0, TEXT_LIMIT)}…` : rawText;

		// Save to cache (upsert, refresh createdAt for TTL)
		try {
			await TweetCache.findOneAndUpdate(
				{ userId: targetId },
				{
					handle: targetHandle,
					topTweetId: topTweet.id,
					topTweetUrl: url,
					topTweetText: clippedText,
					stats: {
						likeCount: best.likeCount,
						retweetCount: best.retweetCount,
						replyCount: best.replyCount,
						quoteCount: best.quoteCount,
						score: best.score,
					},
					meta: {
						tweetsSeen,
						pagesFetched,
					},
					createdAt: new Date(),
				},
				{ upsert: true, new: true, setDefaultsOnInsert: true }
			);
		} catch (err) {
			console.log('Tweet cache upsert failed', err);
		}

		return interaction.editReply({
			content: `Top tweet for @${targetHandle}\n${url}`,
		});
	},
};
