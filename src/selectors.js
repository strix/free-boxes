module.exports = {
  postings: {
    links: '.result-row>a'
  },
  postDetail: {
    title: '#titletextonly',
    description: '#postingbody',
    printInfoRemove: '.print-information',
    replyInfo: {
      replyButton: '.reply_button',
      name: 'div.returnemail.js-only > aside > ul > li:nth-child(1) > p',
      email: 'li>p.reply-email-address>a',
      phone: 'li>p.reply-tel-number'
    }
  }
}
