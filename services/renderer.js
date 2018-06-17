const pug = require('pug')
const path = require('path')
const fs = require('fs')

const TEMPLATE_PATH = path.join(__dirname, '../templates')

module.exports = (options, template = 'stats') => {
	let templateFile = path.join(TEMPLATE_PATH, `${template}.pug`)

	fs.stat(templateFile, (err, stats) => {
		if (err) throw err
		if (!stats.isFile()) throw new Error('No such template file in templates folder.')
	})

	return pug.renderFile(templateFile, options)
}