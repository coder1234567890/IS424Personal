// import puppeteer

const puppeteer = require("puppeteer");

async function go() {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 60,
  });

  //   access site
  const page = await browser.newPage();

  await page.goto(
    "http://127.0.0.1:5500/TermProject/IS424Personal/public/index.html"
  );

  // click on the login button
  await page.click("#loginPageclick");

  //   provide email and password to log in

  await page.type("#email1", "tested.user@gmail.com");
  await page.type("#password1", "mementomori21");

  // click on the login button

  await page.click("#login1");

  //   checkout a device

  // force a delay
  await new Promise((r) => setTimeout(r, 1000));
  // Enter dates and reason
  await page.type("#startDate", "5/6/2025");
  await page.type("#endDate", "5/7/2025");
  await page.type("#rentreason1", "Forgot my laptop at home.");
  // Dropdown
  await page.click("#deviceSelect");
  const firstDevice = await page.evaluate(() => {
    const dropdown = document.querySelector("#deviceSelect");
    return dropdown.options[1].value;
  });
  await page.select("#deviceSelect", firstDevice);
  // checkout device
  await page.click("#rentalSubmit");
  // force a delay
  await new Promise((r) => setTimeout(r, 2000));

  //   close the browser
  browser.close();
}

go();
