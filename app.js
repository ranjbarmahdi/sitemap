const { getBrowser, getRandomElement, delay, checkMemoryCpu, downloadImages } = require('./utils')
const omitEmpty = require('omit-empty');
const { v4: uuidv4 } = require("uuid");
const cheerio = require("cheerio");
const db = require('./config.js');
const path = require("path");
const fs = require("fs");
const url = require('url');



// ============================================ existsUrl
async function existsProductId() {
     const existsQuery = `
        SELECT * FROM unvisited u 
        limit 1
    `
     try {
          const row = await db.oneOrNone(existsQuery);
          if (row) return true;
          return false;
     } catch (error) {
          console.log("error in existsUrl :", error);
     }
}


// ============================================ removeUrl
async function removeProductId() {
     const existsQuery = `
        SELECT * FROM unvisited u 
        limit 1
    `
     const deleteQuery = `
          DELETE FROM unvisited 
          WHERE id=$1
     `
     try {
          const row = await db.oneOrNone(existsQuery);
          if (row) {
               await db.query(deleteQuery, [row.id])
          }
          return row;
     } catch (error) {
          console.log("we have no url", error);
     }
}


// ============================================ insertProduct
async function insertSitemap(queryValues) {
     const query = `
          insert into sitemap ("product_id", "loc", "changefreq", "priority", "image_url")
          values ($1, $2, $3, $4, $5)
     `;

     try {
          const result = await db.oneOrNone(query, queryValues);
          return result;
     } catch (error) {
          console.log("Error in insertSitemap :", error.message);
     }
}


// ============================================ insertProductIdToProblem
async function insertProductIdToProblem(productid) {
     const existsQuery = `
        SELECT * FROM problem u 
        where "id"=$1
    `

     const insertQuery = `
        INSERT INTO problem ("id")
        VALUES ($1)
        RETURNING *;
    `
     const productIdInDb = await db.oneOrNone(existsQuery, [productid])
     if (!productIdInDb) {
          try {
               const result = await db.query(insertQuery, [productid]);
               return result;
          } catch (error) {
               console.log(`Error in insertProductIdToProblem function : ${productid}\nError:`, error.message);
          }
     }
}


// ============================================ insertUrlToVisited
async function insertProductIdToVisited(productid) {
     const existsQuery = `
        SELECT * FROM visited u 
        where "id"=$1
    `

     const insertQuery = `
        INSERT INTO visited ("id")
        VALUES ($1)
        RETURNING *;
    `
     const productIdInDb = await db.oneOrNone(existsQuery, [productid])
     if (!productIdInDb) {
          try {
               const result = await db.query(insertQuery, [productid]);
               return result;
          } catch (error) {
               console.log(`Error in insertProductIdToVisited function : ${productid}\nError:`, error.message);
          }
     }
}


// ============================================ scrapSingleProduct
async function scrap(page, productId) {
     try {
          const productURL = `https://vardast.com/product/${productId}`
          console.log(`======================== Start scraping : \n${productURL}\n`);
          await page.goto(productURL, { timeout: 180000 });

          await delay(Math.random(10000));

          await page.waitForSelector('#my-element', { timeout: 10000 });
          const html = await page.content();
          const $ = await cheerio.load(html);



          const imageUrl = $('.swiper-zoom-container > img:first').length ?
               'https://vardast.com' + $('.swiper-zoom-container > img:first').attr('src')
               : '';

          const productNewUrl = await page.url()

          // Returning Tehe Required Data For Excel
          const productExcelDataObject = {
               productId: productId,
               loc: productNewUrl,
               changefreq: 'monthly',
               priority: 0.8,
               imageUrl: imageUrl
          };

          return productExcelDataObject;
     } catch (error) {
          console.log("Error In scrap in ", error);
          await insertProductIdToProblem(productId);
          return null;
     }

}


// ============================================ Main
async function main() {
     let productIdRow;
     let browser;
     let page;
     try {

          // get product page url from db
          productIdRow = await removeProductId();

          if (productIdRow?.id) {

               // get random proxy
               const proxyList = [''];
               const randomProxy = getRandomElement(proxyList);

               // Lunch Browser
               await delay(Math.random() * 4000);
               browser = await getBrowser(randomProxy, true, false);
               page = await browser.newPage();
               await page.setViewport({
                    width: 1920,
                    height: 1080,
               });
               

               const productInfo = await scrap(page, productIdRow.id);
               console.log(productInfo)
               const insertQueryInput = [
                    productInfo.productId,
                    productInfo.loc,
                    productInfo.changefreq,
                    productInfo.priority,
                    productInfo.imageUrl
               ];

               // if exists productInfo insert it to products
               if (productInfo) {
                    await insertSitemap(insertQueryInput);
                    await insertProductIdToVisited(productIdRow.id);
               }

          }

     }
     catch (error) {
          console.log("Error In main Function", error);
          await insertProductIdToVisited(productIdRow.id);
     }
     finally {
          // Close page and browser
          console.log("End");
          
          if(page) await page.close();
          if(browser) await browser.close();
     }
}


// ============================================ run_1
async function run_1(memoryUsagePercentage, cpuUsagePercentage, usageMemory){
     if (checkMemoryCpu(memoryUsagePercentage, cpuUsagePercentage, usageMemory)) {
          await main();
     }
     else {
          const status = `status:
          memory usage = ${usageMemory}
          percentage of memory usage = ${memoryUsagePercentage}
          percentage of cpu usage = ${cpuUsagePercentage}\n`
     
          console.log("main function does not run.\n");
          console.log(status);
     }
}


// ============================================ run_2
async function run_2(memoryUsagePercentage, cpuUsagePercentage, usageMemory){
     let urlExists;

     do {
         
          urlExists = await existsProductId();
          if(urlExists){
               await run_1(memoryUsagePercentage, cpuUsagePercentage, usageMemory);
          }

     } while (urlExists);
}



run_1(80, 70, 24)

