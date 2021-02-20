var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const { JSDOM } = require("jsdom");

router.get('/enterpriseName/:name', async function(req, res, next) {
  const name = req.params.name || '';
  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
        ],
      });
      const page = await browser.newPage();
      await page.goto('http://eservices.cipc.co.za/Search.aspx');
      
      // EntName
      // EntNo
      // IDNo
      await page.waitForSelector("select[name='ctl00$cntMain$drpSearchOptions']");
      await page.select("select[name='ctl00$cntMain$drpSearchOptions']", "EntName");

      await page.waitForTimeout(500);

      await page.focus("input[name='ctl00$cntMain$txtSearchCIPC']")
      await page.keyboard.type(name);

      await page.click("#ctl00_cntMain_lnkSearchIcon");

      await page.waitForSelector("#ctl00_cntMain_pnlNameSearch");

      const html = await page.evaluate(el => el.innerHTML, await page.$('#ctl00_cntMain_pnlNameSearch'));

      const dom = new JSDOM(html);
      const table = dom.window.document.querySelector("#ctl00_cntMain_gdvNames tbody");

      const rows = table.rows;

      const results = [];

      for (let index = 0; index < rows.length; index++) {
        if (index > 0) {
          const row = rows[index];
          const cells = Array.prototype.slice.call(row.cells) ;
          results.push({
              name: cells[0].innerHTML,
              number: cells[1].innerHTML,
              status: cells[2].innerHTML,
          });
        }
      }

      await browser.close();

      res.send(results);
    } catch (error) {
      console.log(error);
      return res.send([]);
    }
  })();
});

module.exports = router;
