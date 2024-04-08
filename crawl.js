import puppeteer from "puppeteer";
import "dotenv/config";
import jsonfile from 'jsonfile';
const file = './prices.json';

(async () => {
  const delay = (time) => {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  };

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 0, height: 0 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  const items = [];
  async function setItems(_newItems) {
    items.push(..._newItems);
  }

  await page.exposeFunction("setItems", setItems);

  const fetch1 = async () => {
    await page.goto("https://www.pixels.tips/resources");
    await delay(1000);
    await page.evaluate(async () => {
      const _items = [];
      document.querySelectorAll("tbody tr").forEach((item) => {
        const title = item.childNodes[4].childNodes[0].childNodes[0].innerText;
        const price = Number(item.childNodes[6].childNodes[0].innerText.split(",").join(""));
        _items.push({ title, price });
      });
      await setItems(_items);
    });
  }

  const fetch2 = async () => {
    await page.goto("https://www.pixels.tips/crafting");
    await delay(1000);
    await page.evaluate(async () => {
      const _items = [];
      document.querySelectorAll("tbody tr").forEach((item) => {
        const title = item.childNodes[4].childNodes[0].childNodes[2]?.innerText;
        const price = Number(item.childNodes[8].childNodes[0]?.innerText.split(",").join(""));
        _items.push({ title, price });
      });
      await setItems(_items);
    });
  }
  while (true) {
    try {
      items.length = 0;
      let _json;
      jsonfile.readFile(file, function (err, obj) {
        if (err) console.error(err);
        console.log('read json');
        _json = obj;
      })

      await fetch1();
      await fetch2();

      _json.market = [...items];

      jsonfile.writeFile(file, _json, { spaces: 2, EOL: '\r\n' }, function (err) {
        console.log('write json');
        if (err) console.error(err)
      })

      // console.table(items);
      await delay(60000);
    } catch (error) {
      console.error("ERROR");
    }
  }
})();
