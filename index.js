import puppeteer, { Page } from "puppeteer-core";

(async () => {
  const path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const dir = "C:\\Users\\trant\\AppData\\Local\\Google\\Chrome\\User Data";
  const profile = "Profile 6";

  const delay = (time) => {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  };

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: path,
    userDataDir: dir,
    args: [`--profile-directory=${profile}`],
    defaultViewport: { width: 1100, height: 700 },
  });

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://play.pixels.xyz/");

  // Wait and select world
  const searchWorldsSelector = 'div[class*="clickable Intro_smalllink"]';
  await page.waitForSelector(searchWorldsSelector, { timeout: 60000 });
  await page.click(searchWorldsSelector);

  const num = Math.round(Math.random() * 10 + 30);
  const searchWorldSelector = `div[class*="Intro_worldItem"]:nth-child(${num})`;
  await page.waitForSelector(searchWorldSelector, { timeout: 60000 });
  console.log("selectedWord: ", num);
  await page.click(searchWorldSelector);

  await page.waitForSelector('div[class*="RoomLayout"] canvas', { timeout: 60000 * 2 });
  const searchStoreBoxSelector = 'div[class*="Store_box"]';

  console.log('Waiting 5s to start');
  await delay(5000);
  console.log('Started');

  await page.evaluate
  while (true) {
    // go to task board
    console.log('------------------------ Task Board --------------------------------')
    await page.keyboard.down("s");
    await delay(4000);
    await page.keyboard.up("s");

    await page.mouse.click(770, 623);
    await delay(1000);

    console.log('Finding task board....')
    await page.waitForSelector(searchStoreBoxSelector, { timeout: 60000 });

    const buySelector = 'button[class*="Store_buyButton"]:last-child';

    console.log('Click buy...')
    await page.waitForSelector(buySelector, { timeout: 60000 });
    await page.click(buySelector);

    await delay(500);


    console.log('Click close...')
    const closeSelector = 'button[class*="commons_closeBtn"]';
    await page.waitForSelector(closeSelector, { timeout: 60000 });
    await page.click(closeSelector);


    console.log('------------------------ Go to Market --------------------------------')
    await page.keyboard.down("w");
    await delay(4000);
    await page.keyboard.up("w");


    await page.mouse.click(886, 282);
    await delay(1000);
    await page.waitForSelector(closeSelector, { timeout: 60000 });
    await page.click(closeSelector);
  }
})();
