const { Schema, model } = require('mongoose');

const pinSchema = new Schema({
	messageId: {
		type: String,
		required: true,
	},
	authorId: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},
	media: {
		type: Array,
		default: [],
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

module.exports = model('Pin', pinSchema);
