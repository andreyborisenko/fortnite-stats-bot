const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const readdir = util.promisify(fs.readdir)
const stat = util.promisify(fs.stat)

const SCREENSHOTS_PATH = path.join(__dirname, '../screenshots')
const GENERATED_PAGES_PATH = path.join(SCREENSHOTS_PATH, 'generated_pages')
const ERROR_SHOT = path.join(SCREENSHOTS_PATH, 'error.png')
const THREE_MINUTES = 1000*60*3 // 1000*60*3 = 180000 - 3 mins

let screenshots = [];

(async () => {
  screenshots = (await readdir(SCREENSHOTS_PATH)).filter(x => x.includes('.png') && !x.includes('error.png'))
})()

const getScreenshot = (username, platform) => {
  if (!screenshots.length) return false

  let found = screenshots.find(x => x.includes(`${username}-${platform}`))

  return found && (Date.now() - parseInt(found.split('_').pop()) || 0) <= THREE_MINUTES ? found : false
}

const takeScreenshot = async (pagePath, screenPath) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 600 })
  await page.goto(`file:///${pagePath.replace(/\\/g, '/')}`);
  await page.screenshot({path: screenPath});

  await browser.close();
}

module.exports.ERROR_SHOT = ERROR_SHOT

module.exports.default = async (html, {username, platform}) => {

  let existingShot = getScreenshot(username, platform)

  if (existingShot) {
    let p = path.join(SCREENSHOTS_PATH, existingShot), stats
    
    try {
      stats = await stat(p)
      if (stats.isFile()) return p
    } catch (e) {
    } 
  }

  let filename = `${username}-${platform}_${Date.now()}`,
      generatedPagePath = path.join(GENERATED_PAGES_PATH, `${filename}.html`)
      screenPath = path.join(SCREENSHOTS_PATH, `${filename}.png`)

  try {
    await writeFile(generatedPagePath, html)
  } catch (e) {
    console.error(e)
    return ERROR_SHOT
  }

  await takeScreenshot(generatedPagePath, screenPath)
  screenshots.push(`${filename}.png`)

  fs.unlink(generatedPagePath, (err) => {
    if (err) console.error(err)
  }) 

  return screenPath
}

const cleaner = async () => {
  let files;
  try {
    files = await readdir(SCREENSHOTS_PATH);
  } catch (e) {
    console.error(e)
  }

  if (files === undefined) return

  files = files.filter(x => x.includes('.png'))

  for (let f of files) {
    if ((Date.now() - parseInt(f.split('_').pop()) || 0) >= THREE_MINUTES) 
      fs.unlink(path.join(SCREENSHOTS_PATH, f), (err) => {
        if (err) console.error(err)
      }) 
  }

  screenshots = await readdir(SCREENSHOTS_PATH);
}

cleaner()
setInterval(cleaner, THREE_MINUTES) 