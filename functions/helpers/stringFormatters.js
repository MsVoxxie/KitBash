function trimString(str, max) {
	return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

module.exports = {
	trimString,
};
