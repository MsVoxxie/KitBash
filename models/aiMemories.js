const { Schema, model } = require('mongoose');

const aiMemoriesSchema = new Schema({
	memories: {
		type: Array,
		default: [
			{
				memoryType: {
					type: String,
					required: true,
				},
				memoryTopic: {
					type: String,
					required: true,
				},
				memoryData: {
					type: String,
					required: true,
				},
			},
		],
	},
});

module.exports = model('AiMemories', aiMemoriesSchema);
