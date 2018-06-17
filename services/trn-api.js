const axios = require('axios')
const instance = axios.create({
	baseURL: 'https://api.fortnitetracker.com/v1/profile',
	timeout: 30000,
  headers: {'TRN-Api-Key': '2ee0bdc1-6075-4ca0-ba11-90d5fad6d6d7'}
})

module.exports.lifetime = async ({username, platform}) => {
	let { data: { error, lifeTimeStats }} = await instance.get(`/${platform}/${username}`)
	if (lifeTimeStats == undefined && error) throw new Error(error)
	return lifeTimeStats.map(x => x.key.toLowerCase().includes('played') ? { key: 'Matches', value: x.value} : x)
}

module.exports

