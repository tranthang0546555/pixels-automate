import puppeteer from "puppeteer-core";
// Zoom: 100%
// Get path + dir from chrome://version/
// profile-name: Default
// stove1 axis
// start: step -> open terminal -> node cook.js
// Press " ` " key to open panel
// Stop -> Spam -> Press Esc

async function delayWithAbort(delayInMs, controller, message) {
  try {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        resolve();
      }, delayInMs);

      // If abort signal is received, clear the timeout and reject the promise
      try {
        controller.signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          resolve("Delay aborted.");
          console.log("Delay aborted::" + message);
        });
      } catch (error) {
        resolve();
      }
    });
  } catch (error) {}
}

(async () => {
  const path = `C:\\Users\\winn.tran\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`;
  const dir = `C:\\Users\\winn.tran\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data`;
  const cakeName = `Blue Grumpkin Puree`;
  const profile = "Default";
  // const profile = "Profile 1";
  const stove1 = { x: 585, y: 335 };
  const stove2 = { x: 716, y: 354 };
  const loop = 7; // 4 stove = 2 loop ex: 10 stove -> loop = 5
  const timeDelay = 2 * 60 * 1000;
  const isDrink = false;

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: path,
    userDataDir: dir,
    args: [`--profile-directory=${profile}`],
    defaultViewport: { width: 1200, height: 800 },
    ignoreDefaultArgs: ["--disable-extensions", "--enable-automation"],
  });

  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto("https://play.pixels.xyz/");
  let controller = new AbortController();
  const delayWithController = (time, _controller, message) => {
    if (message) console.log("Delay::" + message);
    return delayWithAbort(time, _controller, message);
  };
  const delay = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
  };

  // Wait and select world
  const searchWorldsSelector = 'div[class*="clickable Intro_smalllink"]';
  await page.waitForSelector(searchWorldsSelector, { timeout: 60000 * 10 });
  await page.click(searchWorldsSelector);

  const num = Math.round(Math.random() * 10 + 30);
  const searchWorldSelector = `div[class*="Intro_worldItem"]:nth-child(${num})`;
  await page.waitForSelector(searchWorldSelector, { timeout: 60000 });
  console.log("selectedWorld");
  await page.click(searchWorldSelector);

  await page.waitForSelector('div[class*="RoomLayout"] canvas', {
    timeout: 60000 * 2,
  });

  console.log("Starting...");
  await delay(10000);

  //   setMaxListeners(15, controller.signal);

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
      <label for="option1">Cooking------</label><br>
      <input type="radio" class="op" id="option2" name="options" value="2" onchange="document.myFunction(2)">
      <label for="option2">Close------</label><br>
      </div>
      `;
      if (!element) container.insertAdjacentHTML("beforeend", html);
    });
  };

  const cookAction = async () => {
    console.log("Cooking started ----------");
    for (let i = 1; i <= loop; i++) {
      await move();
      if (auto == 10) break;
      await delay(1000);
      if (auto == 10) break;
      await openStove(stove1);
      if (auto == 10) break;
      await openStove(stove2);
      if (auto == 10) break;
    }
    await back();
    // await delay(timeDelay);
    await delayWithController(timeDelay, controller, "timeDelay:" + timeDelay);
  };

  const move = async () => {
    await page.keyboard.down("s");
    await delay(250);
    await page.keyboard.up("s");

    await page.keyboard.down("w");
    await page.keyboard.down("d");
    await delay(2000);
    await page.keyboard.up("w");
    await page.keyboard.up("d");
  };

  const back = async () => {
    console.log("Go back----------");
    await page.keyboard.down("s");
    await delay(250);
    await page.keyboard.up("s");

    await page.keyboard.down("a");
    // await delay(1500 * loop);
    await delayWithController(1500 * loop, controller, "Go back");
    await page.keyboard.up("a");
  };

  const fire = async () => {
    await page.keyboard.down("3");
    await delay(100);
    await page.keyboard.up("3");
    await delay(500);
    await page.mouse.click(stove1.x, stove1.y);
    await delay(500);
    await page.mouse.click(stove2.x, stove2.y);
    await delay(500);
    await page.keyboard.down("3");
    await delay(200);
    await page.keyboard.up("3");
  };

  const openStove = async (axis = stove1) => {
    console.log("Clicked on Stove");
    await page.mouse.click(axis.x, axis.y, {
      count: 2,
      button: "left",
      delay: 50,
    });
    await delay(2000);
    await page.mouse.click(axis.x, axis.y, {
      count: 2,
      button: "left",
      delay: 50,
    });
    await page.waitForSelector('span[class^="Crafting_craftingFontText"]', {
      timeout: 5000,
    });
    await delay(500);

    const itemSelect = async () => {
      await page.evaluate((cakeName) => {
        document
          .querySelectorAll('span[class^="Crafting_craftingFontText"]')
          .forEach((i, key) => {
            const text = i.childNodes[0].textContent;
            console.log(text, cakeName);
            if (text == cakeName) {
              i.click();
              i.click();
            }
          });
      }, cakeName);
    };
    await itemSelect();
    try {
      await page.waitForSelector(
        'button[class*="Crafting_craftingButton"]:not([disabled])',
        {
          timeout: 5000,
        }
      );

      await delay(500);
      console.log("Create button clicked");
      await page.click('button[class*="Crafting_craftingButton"]');
      await delay(500);
      console.log("Receive button clicked");
      await page.click('button[class*="Crafting_craftingButton"]');
      await page.click("button[class^=Crafting_craftingCloseButton]");
      await page.click("button[class^=InventoryWindow_closeBtn]");
      await delay(500);
    } catch (error) {}
  };

  while (true) {
    console.log("_____ Action: ", auto);
    try {
      switch (auto) {
        case 0:
          await boardAction();
          break;
        case 1:
          await cookAction();
          break;
        case 2:
          await closeBoard();
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
})();
