const { Schema, model } = require('mongoose');

const aiMemoriesSchema = new Schema({
	memories: {
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

module.exports = model('AiMemories', aiMemoriesSchema);
