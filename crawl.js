import puppeteer from "puppeteer-core";
import "dotenv/config";

(async () => {
  const path =
    `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe` ||
    process.env.CH_PATH;
  const dir =
    `C:\Users\winn.tran\AppData\Local\Google\Chrome\User Data` ||
    process.env.CH_DIR;
  const profile = process.env.CH_PROFILE || "Default";

  if (!path || !dir) throw Error("Fill .env file");

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
    args: [`--profile-directory=${profile}`, "--enable-extension-apps"],
    defaultViewport: { width: 500, height: 500 },
  });

  const page = await browser.newPage();

  const items = [];
  async function setItems(_newItems) {
    items.push(..._newItems);
  }
  
  await page.exposeFunction("setItems", setItems);

  const fetch1 = async () => {
    await page.goto("https://www.pixels.tips/resources");
    await page.evaluate(async () => {
      const _items = [];
      document.querySelectorAll("tbody tr").forEach((item) => {
        const title = item.childNodes[4].childNodes[0].childNodes[0].innerText;
        const price = Number(item.childNodes[6].childNodes[0].innerText);
        _items.push({ title, price });
      });
      await setItems(_items);
    });
  }

  const fetch2 = async () => {
    await page.goto("https://www.pixels.tips/crafting");
    await page.evaluate(async () => {
      const _items = [];
      document.querySelectorAll("tbody tr").forEach((item) => {
        const title = item.childNodes[4].childNodes[0].childNodes[1].innerText;
        const price = Number(item.childNodes[8].childNodes[0].innerText);
        _items.push({ title, price });
      });
      await setItems(_items);
    });
  }
  while (true) {
    items.length = 0;
    await fetch1();
    await fetch2();
    console.table(items);
    await delay(60000);
  }
})();
