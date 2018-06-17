const TelegramBot = require('node-telegram-bot-api')
const config = require('config')

const TOKEN = config.get('token')
const bot = new TelegramBot(TOKEN, { polling: true })

const { renderer, screenshot, trnAPI, ERROR_SHOT }  = require('./services')
const fs = require('fs')

const getName = (msg) => {
	const {from: { first_name, last_name, username }} = msg
	return `${first_name} ${last_name}` || username
}

bot.onText(/^\/start$/, (msg) => {
	const {chat: { id }} = msg
	const name = getName(msg)

	bot.sendMessage(id, `
	Hello, <b>${name}</b>! We\`re glad to see you here :)
Look at the list of commands or type <b>/help</b> to get help about using this bot.
Type <b>/stats</b> <em>[platform]</em> <em>[nickname]</em> to get lifetime stats.
Example: <b>/stats</b> <em>pc</em> <em>Ninja</em> 
	`, {
		parse_mode: 'html'
	})
})

bot.onText(/^\/help$/, ({chat: { id }}) => {
	bot.sendMessage(id, `
	Available commans are:
- **/help** - List of available commands.
- **/stats** *[platform]* *[nickname]* - Lifetime stats for user.
- **/setMe** *[platform]* *[nickname]* - Set your acc credentials to easily get your stats using **/me** command.
- **/me** - Get you stats really fast.
	`, {
		parse_mode: 'markdown'
	})
})

bot.onText(/^\/stats$/, ({chat: { id }}) => {
	bot.sendMessage(id, `
	Usage <b>/stats</b> <em>[platform]</em> <em>[nickname]</em>
Example: <b>/stats</b> <em>pc</em> <em>Ninja</em>
	`, {
		parse_mode: 'html'
	})
})

const platforms = ['pc', 'ps4', 'xbox']

const sendLifetimeStats = async (chatId, username, platform) => {
	const userinfo = {username, platform}

	let renderedHTML
	try {
		renderedHTML = renderer({
			username: userinfo.username,
			platform: userinfo.platform,
			stats: (await trnAPI.lifetime(userinfo)).filter(x => !x.key.includes('Top'))
		});
	} catch (e) {
		if (e.message.includes('Request failed'))
			e.message = 'API server error, can`t get stats now. We`re sorry'

		return bot.sendMessage(chatId, `${e.message}. :(`)
	}
	
	let png = await screenshot(renderedHTML, userinfo)

	bot.sendPhoto(chatId, fs.createReadStream(png), {
		caption: `Lifetime stats for ${username} on ${new Date(Date.now()).toLocaleString()}`
	})
}

bot.onText(/\/stats (\w+)\s+(\w+)/, async (msg, [, platform, username]) => {
	const {chat: { id }} = msg
	bot.sendChatAction(id, 'upload_photo')

	if (!platform || !username) 
		return bot.sendMessage(id, `
		You missed platform or username parametrs.
Usage <b>/stats</b> <em>[platform]</em> <em>[nickname]</em>
		`, {
			parse_mode: 'html'
		})
	

	if (platforms.indexOf(platform) == -1) 
		return bot.sendMessage(id, `Available platforms are : ${platforms.map(x => `*${x}*`).join(' | ')}`, {
			parse_mode: 'markdown'
		})

	await sendLifetimeStats(id, username, platform)
})

const { db } = require('./db')

bot.onText(/\/setme (\w+)\s+(\w+)/, async (msg, [, platform, username]) => {
	const { from: { id: fromId }, chat: { id: chatId }} = msg
	const name = getName(msg)

	if (!platform || !username) 
		return bot.sendMessage(chatId, `
		You missed platform or username parametrs.
Usage <b>/setMe</b> <em>[platform]</em> <em>[nickname]</em>
		`, {
			parse_mode: 'html'
		})
	

	if (platforms.indexOf(platform) == -1) 
		return bot.sendMessage(chatId, `Available platforms are : ${platforms.map(x => `*${x}*`).join(' | ')}`, {
			parse_mode: 'markdown'
		})

	db.put({
		_id: '' + fromId,
		username: username,
		platform: platform
	})

	bot.sendMessage(chatId, `
	Saved settings for *${name}* with
*Username*: ${username}
*Platform*: ${platform}
	`, {
		parse_mode: 'markdown'
	})
})

bot.onText(/^\/me$/, async ({ from: { id: fromId },chat: { id: chatId }}) => {
	bot.sendChatAction(chatId, 'upload_photo')

	db.get('' + fromId)
		.then(async doc => {
			await sendLifetimeStats(chatId, doc.username, doc.platform)
		})
		.catch(e => {
			console.log(e)
			bot.sendMessage(chatId, `
			You have to specify your profile using command:
<b>/setMe</b> <em>[platform]</em> <em>[nickname]</em>
			`, {
				parse_mode: 'html'
			})
		})
})

const server = require('http').createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'text/markdown' });
  res.end('Fortnite stats bot telegram [@FortniteStatisticsBot](https://t.me/FortniteStatisticsBot)');
})

server.listen(process.env.PORT || 3000, () => `Server started`)