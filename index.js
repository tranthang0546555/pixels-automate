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
    defaultViewport: { width: 1100, height: 700 },
  });

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://play.pixels.xyz/");

  // Wait and select world
  const searchWorldsSelector = 'div[class*="clickable Intro_smalllink"]';
  await page.waitForSelector(searchWorldsSelector, { timeout: 60000 * 10 });
  await page.click(searchWorldsSelector);

  const _num = Number(process.env.CH_NUM_WORD || "30");
  const num = Math.round(Math.random() * 10 + _num);
  const searchWorldSelector = `div[class*="Intro_worldItem"]:nth-child(${num})`;
  await page.waitForSelector(searchWorldSelector, { timeout: 60000 });
  console.log("selectedWord: ", num);
  await page.click(searchWorldSelector);

  await page.waitForSelector('div[class*="RoomLayout"] canvas', {
    timeout: 60000 * 2,
  });
  const searchStoreBoxSelector = 'div[class*="Store_box"]';

  console.log("Starting...");
  await delay(10000);

  let controller = new AbortController();
  const questItem = [];

  async function setQuestItem(_newItem) {
    questItem.length = 0;
    questItem.concat(_newItem);
  }
  await page.exposeFunction("setQuestItem", setQuestItem);

  let auto = 10;

  async function setAuto(_num) {
    auto = _num;
    controller.abort();
    await delay(100);
    controller = new AbortController();
  }
  await page.exposeFunction("setAuto", setAuto);

  const closeBoard = async () => {
    await page.evaluate(() => {
      var container = document.getElementsByClassName("pixelfont").item(0);
      var element = document.getElementById("select-form");
      if (element) container.removeChild(element);
    });
  };
  await page.exposeFunction("closeBoard", closeBoard);

  page.evaluate(async () => {
    window.addEventListener("keydown", async (e) => {
      console.log("keydown", e.code);
      if (e.code == "Escape") await setAuto(10);
      if (e.code == "Tab") await setAuto(0);
    });

    async function myFunction(_num) {
      await setAuto(_num);
      await closeBoard();
    }
    document.myFunction = myFunction;
  });

  const orderAction = async () => {
    // go to task board
    console.log(
      "------------------------ Task Board --------------------------------"
    );

    await page.keyboard.down("s");
    await delay(4000);
    await page.keyboard.up("s");

    await page.mouse.click(770, 623);
    await delay(1000);

    console.log("Finding task board....");
    await page.waitForSelector(searchStoreBoxSelector, {
      timeout: 60000,
      signal: controller.signal,
    });

    const buySelector = 'button[class*="Store_buyButton"]:last-child';

    console.log("Click buy...");
    await page.waitForSelector(buySelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    await page.click(buySelector);

    await page.evaluate(async () => {
      const items = [];
      document
        .querySelectorAll(
          'div[class*="Store_card-content-wrapper"] div[class*="Store_card-content"]'
        )
        .forEach((item) => {
          const title = item.childNodes[3].childNodes[0].innerText;
          const quantity = Number(item.childNodes[2].innerText.substring(1));
          const itemId = item.childNodes[1].innerHTML.split("/")[5];
          items.push({ title, quantity, itemId });
        });
      await setQuestItem(items);
      console.log("-------Items in quest");
      console.table(items);
      console.log(
        "-------Items in quest----------------------------------------------------------"
      );
    });

    await delay(500);

    console.log("Click close...");
    const closeSelector = 'button[class*="commons_closeBtn"]';
    await page.waitForSelector(closeSelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    await page.click(closeSelector);

    console.log(
      "------------------------ Go to Market --------------------------------"
    );
    await page.keyboard.down("w");
    await delay(4000);
    await page.keyboard.up("w");

    await page.mouse.click(886, 282);
    await delay(1000);
    await page.waitForSelector(closeSelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    await page.click(closeSelector);
  };

  const boardAction = async () => {
    page.evaluate(() => {
      var container = document.getElementsByClassName("pixelfont").item(0);
      var element = document.getElementById("select-form");
      const html = `
      <div id="select-form" style="font-size: 15px; padding: 10px; background-color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
      <input type="radio" class="op" id="option1" name="options" value="1" onchange="document.myFunction(1)">
      <label for="option1">Order in task board</label><br>
      
      <input type="radio"  class="op" id="option2" name="options" value="2" onchange="document.myFunction(2)">
      <label for="option2">Craft</label><br>
      
      <input type="radio" class="op" id="option3" name="options" value="3" onchange="document.myFunction(3)">
      <label for="option3">Nothing</label><br>
      </div>
      `;
      if (!element) container.insertAdjacentHTML("beforeend", html);
    });
  };

  while (true) {
    console.log("_____ Action: ", auto);
    try {
      switch (auto) {
        case 0:
          await boardAction();
          break;
        case 1:
          await orderAction();
          break;
        case 10:
          await closeBoard();
          break;
        default:
          await delay(100);
      }
    } catch (error) {
      console.log("_____ Action: ACTION ABORTED");
    }
    await delay(1000);
  }
})();
