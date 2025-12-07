const { Schema, model } = require('mongoose');

// Cache top tweet results per user with a 24h TTL
const tweetCacheSchema = new Schema({
	userId: {
		type: String,
		required: true,
	},
	handle: {
		type: String,
		required: true,
	},
	topTweetId: {
		type: String,
		required: true,
	},
	topTweetUrl: {
		type: String,
		required: true,
	},
	topTweetText: {
		type: String,
		required: true,
	},
	stats: {
		likeCount: { type: Number, default: 0 },
		retweetCount: { type: Number, default: 0 },
		replyCount: { type: Number, default: 0 },
		quoteCount: { type: Number, default: 0 },
		score: { type: Number, default: 0 },
	},
	meta: {
		tweetsSeen: { type: Number, default: 0 },
		pagesFetched: { type: Number, default: 0 },
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

// TTL index to auto-clear after 24 hours
tweetCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
tweetCacheSchema.index({ userId: 1 }, { unique: true });

module.exports = model('TweetCache', tweetCacheSchema);
