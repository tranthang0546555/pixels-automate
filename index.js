import puppeteer from "puppeteer-core";
import "dotenv/config";
import jsonfile from "jsonfile";
import { setMaxListeners } from "events";
const file = "./prices.json";

(async () => {
  const path = process.env.CH_PATH;
  const dir = process.env.CH_DIR;
  const profile = process.env.CH_PROFILE || "Default";

  if (!path || !dir) throw Error("Fill .env file");
  console.log("Profile", profile);

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
  // setMaxListeners(15, controller.signal);
  const questItem = [];
  const available = [];
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
      if (e.code == "Tab") await setAuto(0);
    });

    async function myFunction(_num) {
      await setAuto(_num);
      await closeBoard();
    }
    document.myFunction = myFunction;
  });

  const orderAction = async () => {
    questItem.length = 0;
    available.length = 0;
    // go to task board
    console.log(
      "------------------------ Task Board --------------------------------"
    );

    await page.keyboard.down("s");
    await delay(4000);
    await page.keyboard.up("s");

    await page.mouse.click(770, 623);
    await delay(1000);

    let _json;
    let limit;
    jsonfile.readFile(file, function (err, obj) {
      if (err) console.error(err);
      _json = obj;
      limit = obj.limit;
    });

    console.log("Finding task board....");
    await page.waitForSelector(searchStoreBoxSelector, {
      timeout: 60000,
      signal: controller.signal,
    });

    const orderSelector = 'button[class*="Store_buyButton"]:last-child';
    console.log("Click buy...");
    await page.waitForSelector(orderSelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    await page.click(orderSelector);

    await page.waitForSelector("div[class*=Store_card-content-wrapper]", {
      timeout: 60000,
      signal: controller.signal,
    });

    const _questItem = await page.evaluate(async () => {
      const items = [];
      document
        .querySelectorAll(
          'div[class*="Store_card-content-wrapper"] div[class*="Store_card-content"]'
        )
        .forEach((item) => {
          const title = item.childNodes[3].childNodes[0].innerText;
          const quantity = Number(item.childNodes[2].innerText.substring(1));
          const btn = item.childNodes[3].childNodes[1];
          const disabled = btn.disabled;
          const label = btn.innerText;
          items.push({ title, quantity, disabled, label });
        });
      return items;
    });

    questItem.push(..._questItem);

    const market = _json.market || [];

    questItem.forEach((i) => {
      const itemMarket = market.find((im) => im.title == i.title);
      if (itemMarket) {
        const total = i.quantity * itemMarket.price;
        if (total < limit && i.disabled == true && i.label == "DELIVER") {
          available.push({ ...i, price: itemMarket.price, total });
        }
      }
    });

    if (
      JSON.stringify(_json.available) != JSON.stringify(available) ||
      JSON.stringify(_json.orders) != JSON.stringify(questItem)
    ) {
      _json.orders = [...questItem];
      _json.available = [...available];
      jsonfile.writeFile(
        file,
        _json,
        { spaces: 2, EOL: "\r\n" },
        function (err) {
          console.log("write json");
          if (err) console.error(err);
        }
      );
    } else console.log("Not change json");
    console.table(available);
    console.log("Click close...");
    const closeSelector = 'button[class*="commons_closeBtn"]';
    await page.waitForSelector(closeSelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    auto = 0;
    await page.click(closeSelector);
  };

  const buyAction = async () => {
    console.log(
      "------------------------ Go to Market --------------------------------"
    );
    console.table(available);
    await page.keyboard.down("w");
    await delay(4000);
    await page.keyboard.up("w");

    const success = [];
    let index = 0;
    let debugIndex = 0;
    while (success.length < available.length) {
      const title = available[index].title;
      console.log(
        "Buying -------------------- item: ",
        index,
        " : ",
        title,
        " :: ",
        debugIndex
      );
      await page.mouse.click(886, 282);
      await page.waitForSelector("input[class*=Marketplace_filter]", {
        timeout: 60000,
        signal: controller.signal,
      });
      await page.evaluate(
        () =>
          (document.querySelector("input[class*=Marketplace_filter]").value =
            "")
      );
      console.log("clear");
      await page.type("input[class*=Marketplace_filter]", title);
      console.log("enter");
      await page.waitForSelector("div[class*=Marketplace_itemName]", {
        timeout: 60000,
        signal: controller.signal,
      });

      const itemSelect = async () => {
        await page.evaluate((availableItem) => {
          let selected;
          document
            .querySelectorAll(
              "div[class*=Marketplace_items] > div[class*=Marketplace_item]"
            )
            .forEach((i, key) => {
              const text = i.childNodes[1].innerText;
              console.log(text, availableItem.title);
              if (text == availableItem.title) {
                selected = key;
              }
            });

          document
            .querySelectorAll(`div[class*="Marketplace_items"] button`)[selected].click();
        }, available[index]);
      };

      let quantity = 0;
      const itemQuant = available[index].quantity;
      while (quantity < itemQuant) {
        if ((auto = 0)) break;
        console.log(`quantity: ${quantity} / ${itemQuant}`);
        await itemSelect();
        await page.waitForSelector(
          "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])",
          {
            timeout: 60000,
            signal: controller.signal,
          }
        );
        await delay(200);

        const itemIndex = await page.evaluate((remain) => {
          let quantityLarge = 0;
          let quantityLargeIndex = 0;
          document
            .querySelectorAll(
              "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])"
            )
            .forEach((item, idx) => {
              const count = Number(item.innerText.split(" ")[1]);
              if (count > quantityLarge) {
                quantityLargeIndex = idx;
                quantityLarge = count;
              }
            });
          if (quantityLarge >= remain * 2)
            return Promise.resolve(quantityLargeIndex);
          else return Promise.resolve(-1);
        }, itemQuant);
        
        if (itemIndex > 0) {
          await page.evaluate(() => {
            document
              .querySelectorAll(
                "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])"
              )[0]
              .click();
          });


          await page.waitForSelector('div[class*=MarketplaceItemListings_amount] input', {
            timeout: 60000,
            signal: controller.signal,
          });
          await page.evaluate(
            () =>
              (document.querySelector('div[class*=MarketplaceItemListings_amount] input').value =
                "")
          );
          console.log("clear");
          await delay(100);
          await page.type('div[class*=MarketplaceItemListings_amount] input', String(itemQuant));
          console.log("enter :", itemQuant);
          await page.click('div[class*=MarketplaceItemListings_buttons] button:first-child', {
            timeout: 60000,
            signal: controller.signal,
          })

          await page.waitForSelector('div[class*=Notifications_textContainer] span');

          const status = await page.evaluate(()=>{
            const noti = document.querySelector('div[class*=Notifications_textContainer] span').innerText;
            if(noti == 'marketplace-purchase-failed') return Promise.resolve(0);
            else return Promise.resolve(1);
          })

          console.log("Status buy: " + status == 1 ? "success" : "failed");
          if(status == 1) {
            quantity = itemQuant;
            await page.waitForSelector('div[class*=Marketplace_buyContent] button',
            {
              timeout: 60000,
              signal: controller.signal,
            });
            await page.click('div[class*=Marketplace_buyContent] button');
          }
        }

        console.log("close item panel");
        const closePanel = async () => {
          await page.evaluate(() => {
            document
              .querySelectorAll('button[class*="commons_closeBtn"]')[1]
              .click();
          });
        };
        await closePanel();
      }
      success.push(available[index]);
      index++;
      debugIndex++;
    }

    await delay(500);
    console.log("done ------------");
    await page.waitForSelector(closeSelector, {
      timeout: 60000,
      signal: controller.signal,
    });
    auto = 0;
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
      
      <input type="radio" class="op" id="option2" name="options" value="2" onchange="document.myFunction(2)">
      <label for="option2">Buy items</label><br>

      <input type="radio" class="op" id="option3" name="options" value="3" onchange="document.myFunction(3)">
      <label for="option3">Both</label><br>

      <input type="radio"  class="op" id="option4" name="options" value="4" onchange="document.myFunction(4)">
      <label for="option4">Craft</label><br>
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
        case 2:
          await buyAction();
          break;
        case 3: {
          await orderAction();
          await buyAction();
          break;
        }
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
