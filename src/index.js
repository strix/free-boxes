const puppeteer = require('puppeteer')
const selectors = require('./selectors')

const city = 'stgeorge'
const strictSearch = 'box'
const freeBoxUrl = `https://${city}.craigslist.org/search/zip?query=boxes`

;(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox'
    ]
  })
  const page = await browser.newPage()
  await page.goto(freeBoxUrl)
  try {
    const listings = []
    const boxUrls = await page.evaluate((selectors, city, strictSearch) => {
      return [...document.querySelectorAll(selectors.postings.links)].map(link => link.href).filter(link => link.includes(city) && link.includes(strictSearch))
    }, selectors, city, strictSearch)
    for (const boxUrl of boxUrls) {
      await page.goto(boxUrl)
      await page.click(selectors.postDetail.replyInfo.replyButton)
      await page.waitForSelector(selectors.postDetail.replyInfo.email)

      const [ title, description, posterName, posterEmail, posterPhone ] = await page.evaluate(async (selectors) => {
        const removeElements = document.querySelectorAll(selectors.postDetail.printInfoRemove)
        for (const rem of removeElements) {
          rem.remove()
        }
        const title = document.querySelector(selectors.postDetail.title)
        const description = document.querySelector(selectors.postDetail.description)
        const { replyInfo } = selectors.postDetail
        const posterName = document.querySelector(replyInfo.name)
        const posterEmail = document.querySelector(replyInfo.email)
        const posterPhone = document.querySelector(replyInfo.phone)
        return [
          title,
          description,
          posterName,
          posterEmail,
          posterPhone
        ].map(item => {
          console.log(item.innerHTML.trim())
          return item.innerHTML.trim()
        })
      }, selectors)
      const listing = {
        url: boxUrl,
        title,
        description,
        posterName,
        posterEmail,
        posterPhone
      }
      listings.push(listing)
    }
    console.log(listings)
  } catch (err) {
    console.log(err)
  }

  await browser.close()
})()
