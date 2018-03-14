require('dotenv').config()
const puppeteer = require('puppeteer')
const selectors = require('./selectors')

const city = 'stgeorge'
const strictSearch = 'box'
const freeBoxUrl = `https://${city}.craigslist.org/search/zip?query=boxes`
const mailgun = require('mailgun.js')
const mg = mailgun.client({username: process.env.MAILGUN_USERNAME, key: process.env.MAILGUN_API_KEY})

const getMailString = listings => {
  let fullStr = ''
  for (const listing of listings) {
    fullStr += `Giver: ${listing.posterName}<br />Email: ${listing.posterEmail}<br />Phone Number: ${listing.posterPhone}<br />Title: ${listing.title}<br />Description: ${listing.description}<br />See full post: ${listing.url}`
    fullStr += '<br /><br />-------------------------------------<br /><br />'
  }
  return fullStr
}

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
    const mailResponse = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Free Boxes <${process.env.SENDER}>`,
      to: process.env.RECIPIENTS.split(';'),
      subject: 'Listings for Free Boxes',
      text: getMailString(listings),
      html: getMailString(listings)
    })
    console.log(mailResponse)
  } catch (err) {
    console.log(err)
  }

  await browser.close()
})()
