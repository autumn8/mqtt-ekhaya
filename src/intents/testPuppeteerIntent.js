// async function runPup() {
//   const puppeteer = require('puppeteer-core');
//   try {
//     const browser = await puppeteer.launch({ headless: false, executablePath: '/usr/bin/chromium-browser' });
//     const page = await browser.newPage();
//   } catch (e) {
//     console.log(e);
//   }
//   await page.goto(`https://google.com`);
//   //await page.screenshot({path: 'example.png'});
//   await browser.close();
// }

module.exports = async function onTestPuppeteerIntent(topic, message) {
  const slots = JSON.parse(message.toString()).slots;
  const [site, searchTerm] = slots;
  console.log(site.rawValue, searchTerm.rawValue);
  const puppeteer = require('puppeteer-core');

  // const browser = await puppeteer.launch({   executablePath: '/usr/bin/chromium-browser' });
  // const page = await browser.newPage();
  // await page.goto(`https://${site.rawValue}.com`);
  // await page.screenshot({ path: 'example.png' });
  // await browser.close();

  


 
}