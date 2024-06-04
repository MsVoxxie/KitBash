async function askKitbash(model = 'gpt-4o', aiPersonality, userQuestion, maxTokens) {
	const { default: OpenAI } = require('openai');
	const OpenAIConfig = new OpenAI({ apiKey: process.env.OPENAI_KEY });
	const AI = OpenAIConfig;

	const conversationStarter = [
		{ role: 'system', content: aiPersonality },
		{ role: 'user', content: userQuestion },
	];

	const aiResponse = await AI.chat.completions.create({
		model: model,
		messages: conversationStarter,
		max_tokens: maxTokens,
		temperature: 0.7,
		frequency_penalty: 0.3,
		presence_penalty: 0.9,
		n: 1,
	});

	return aiResponse.choices[0].message?.content;
}

module.exports = { askKitbash };
