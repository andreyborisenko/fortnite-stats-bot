module.exports = {
	renderer: require('./renderer'),
	screenshot: require('./screenshot').default,
	ERROR_SHOT: require('./screenshot').ERROR_SHOT,
	trnAPI: require('./trn-api')
}