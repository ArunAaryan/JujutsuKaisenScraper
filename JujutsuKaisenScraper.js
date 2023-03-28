const puppeteer = require("puppeteer");
const request = require("request");
const fs = require("fs");
const path = require("path");

async function downloadImage(url, folder, fileName) {
  return new Promise((resolve, reject) => {
    // const fileName = path.basename(url);
    const filePath = path.join(folder, fileName);
    const stream = fs.createWriteStream(filePath);
    stream.on("finish", resolve);
    stream.on("error", reject);
    request(url).pipe(stream);
  });
}

async function writeLinksToFile() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://w9.jujmanga.com");

  // Find the ul element using XPath
  const aElements = await page.$x("//a");

  // Get the href attribute value of each a element
  let hrefs = [];
  for (let i = 0; i < aElements.length; i++) {
    const href = await page.evaluate(
      (el) => el.getAttribute("href"),
      aElements[i]
    );
    if (!href.includes("chapter")) {
      continue;
    }
    hrefs.push(href);
  }
  hrefs = JSON.stringify(hrefs);
  fs.writeFile("./links.json", hrefs, (err) => {
    if (err) throw err;
    console.log("Data written to file");
  });
  await browser.close();
}
async function downloadImagesFromLinks() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://w9.jujmanga.com");
  let hrefs = require("./links.json");

  for (const link of hrefs) {
    if (!link.includes("chapter")) {
      continue;
    }
    console.log(`Navigating to ${link}...`);

    // Navigate to the link
    await page.goto(link);

    // Get the images on the page
    const images = await page.$$eval("img", (els) => els.map((el) => el.src));

    const dirName = link
      .split("https://w9.jujmanga.com/manga/")[1]
      .slice(0, -1);
    fs.mkdirSync("./images/" + dirName);

    // Download each image
    let i = 1;
    for (const image of images) {
      console.log(`Downloading image ${image}...`);
      await downloadImage(image, "./images/" + dirName, i + ".jpg");
      i += 1;
    }
  }
  await browser.close();
}
// run this once and get all the links
// open the links file and delete the chapters that are not required
// run writeLinksToFile() to get all links back
writeLinksToFile();
// run this after updating links.json file
// downloadImagesFromLinks();
