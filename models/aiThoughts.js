const { Schema, model } = require('mongoose');

const aiThoughtsSchema = new Schema({
	thoughts: {
		type: Array,
		default: [
			{
				topic: {
					type: String,
					required: true,
				},
				thought: {
					type: String,
					required: true,
				},
			},
		],
	},
});

module.exports = model('AiThoughts', aiThoughtsSchema);
