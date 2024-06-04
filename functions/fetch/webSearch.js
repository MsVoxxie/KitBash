const { getJson } = require('serpapi');
const { SERPAPI_KEY } = process.env;

async function serpapiImageSearch(query, limit = 25) {
	try {
		const results = await getJson({
			engine: 'google_images',
			api_key: SERPAPI_KEY,
			q: query,
			location: 'United States',
		});
		return results['images_results'].slice(0, limit);
	} catch (error) {
		console.error(error);
		return [];
	}
}

module.exports = {
	serpapiImageSearch,
};
