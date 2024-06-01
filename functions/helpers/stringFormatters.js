function trimString(str, max) {
	return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

function urlToMarkdown(string) {
	const urlRegex = new RegExp(/(https?:\/\/[^\s]+)/g);
	if (!urlRegex.test(string)) return string;
	return string.replace(urlRegex, `[LINK]($1)`);
}

function cleanDiscordMarkdown(string) {
	return string.replace(/([`~*_|])/g, '');
}

module.exports = {
	trimString,
	urlToMarkdown,
	cleanDiscordMarkdown,
};
