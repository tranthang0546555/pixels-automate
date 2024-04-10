function waitFor(selector) {
  console.log("waiting....", selector);
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function buyItem(
  name,
  quantity,
  buyManyTimes = false,
  _itemsPerTimes = 50
) {
  if (!name) return;
  let loop = 1;
  let last = 0;
  let itemsPerTimes = quantity;
  if (buyManyTimes) {
    loop = Math.round(quantity / _itemsPerTimes);
    last = quantity % _itemsPerTimes;
    itemsPerTimes = _itemsPerTimes;
  }

  console.log("Waiting for you: Open Marketplace.");
  await waitFor("input[class*=Marketplace_filter]");
  let itemIndex = -1;
  while (true) {
    await waitFor("div[class*=Marketplace_itemName]");
    document
      .querySelectorAll("div[class*=Marketplace_itemName]")
      .forEach((item, idx) => {
        if (item.innerHTML === name) itemIndex = idx;
      });
    if (itemIndex >= 0) break;
    await delay(100);
  }

  console.log("itemIndex", itemIndex);

  const openItem = () =>
    document
      .querySelectorAll("div[class*=Marketplace_item] button")
      [itemIndex].click();

  for (let l = 0; l < loop; l++) {
    openItem();
    await waitFor(
      "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])"
    );
    await delay(100);

    let quantityLarge = -1;
    let quantityLargeIndex = -1;

    document
      .querySelectorAll(
        "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])"
      )
      .forEach((item, idx) => {
        const count = Number(item.innerText.split(" ")[1]);
        if (count > quantityLarge && count >= itemsPerTimes * 2) {
          quantityLargeIndex = idx;
          quantityLarge = count;
        }
      });
    console.log(
      "Buy item have quantity: " +
        quantityLarge +
        " // index: " +
        quantityLargeIndex
    );
    await delay(100);

    if (quantityLargeIndex >= 0) {
      document
        .querySelectorAll(
          "div[class*=MarketplaceItemListings_listing] button[class*=commons_pushbutton]:not([disabled])"
        )
        [quantityLargeIndex].click();
        await waitFor("div[class*=MarketplaceItemListings_amount] input");
      const input = document.querySelector("div[class*=MarketplaceItemListings_amount] input");
      console.log("input", input);
      input.focus();

      input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: '1'  }));

      await delay(5000);
    }
    // document.querySelectorAll('button[class*="commons_closeBtn"]')[1].click();
  }
}
// buyItem(name, quantity, buyManyTimes = false, _itemsPerTimes = 50);
buyItem("Popberry", 1);
