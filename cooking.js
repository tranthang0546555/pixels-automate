import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
puppeteer.use(StealthPlugin());

const run = async (_profile) => {
  const delay = (time) => {
    return new Promise((resolve) => {
      setTimeout(resolve, time);
    });
  };

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    channel: "chrome",
    userDataDir: "/tmp/user-data-dir/" + _profile,
    args: [`--profile-directory=${_profile}`],
    defaultViewport: { width: 500, height: 600 },
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
  console.log("Starting...");
  await delay(10000);

  let controller = new AbortController();
  // setMaxListeners(15, controller.signal);
  let auto = 10;

  async function setAuto(_num) {
    auto = _num;
    controller.abort();
    await delay(100);
    controller = new AbortController();
    // setMaxListeners(15, controller.signal);
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
      if (e.code == "Backquote") await setAuto(0);
    });

    async function myFunction(_num) {
      await setAuto(_num);
      await closeBoard();
    }
    document.myFunction = myFunction;
  });

  const boardAction = async () => {
    page.evaluate(() => {
      var container = document.getElementsByClassName("pixelfont").item(0);
      var element = document.getElementById("select-form");
      const html = `
      <div id="select-form" style="font-size: 15px; padding: 10px; background-color: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
      <input type="radio" class="op" id="option1" name="options" value="1" onchange="document.myFunction(1)">
      <label for="option1">Cooking</label><br>
      
      <input type="radio" class="op" id="option2" name="options" value="2" onchange="document.myFunction(2)">
      <label for="option2">Craft</label><br>
      </div>
      `;
      if (!element) container.insertAdjacentHTML("beforeend", html);
    });
  };

  const cooking = async () => {
    while (true) {
      await page.waitForSelector(
        'div[class*="Crafting_PageDetails"] div[class*="Crafting_craftingFontSubtitle"]',
        {
          timeout: 60000,
          signal: controller.signal,
        }
      );
      await page.waitForSelector(
        '[class*="Crafting_craftingButton"]:not([disabled])'
      );
      const disabled = await page.evaluate(
        () =>
          document.querySelector(
            '[class*="Crafting_craftingButton"]:is([disabled])'
          ) !== null
      );

      if (disabled) {
      }
    }
  };

  while (true) {
    console.log("_____ Action: ", auto);
    try {
      switch (auto) {
        case 0:
          await boardAction();
          break;
        case 1:
          await cooking();
          break;
        case 10:
          await closeBoard();
          break;
        default:
          await delay(100);
      }
    } catch (error) {
      console.log("_____ Action: ACTION ABORTED", error);
    }
    await delay(1000);
  }
};
run("Profile 51");
