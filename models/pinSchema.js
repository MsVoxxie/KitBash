const { Schema, model } = require('mongoose');

const pinSchema = new Schema({
	pinnedBy: {
		type: String,
		required: true,
	},
	pinnedIn: {
		type: String,
		required: true,
	},
	authorId: {
		type: String,
		required: true,
	},
	messageId: {
		type: String,
		required: true,
	},
	messageContent: {
		type: String,
		required: true,
	},
	messageMedia: {
		type: Array,
		default: [],
	},
	directLink: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	pinPosition: {
		type: Number,
		required: true,
	},
});

module.exports = model('Pin', pinSchema);
