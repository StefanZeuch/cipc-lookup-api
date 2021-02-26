var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const { JSDOM } = require("jsdom");

router.get('/enterpriseName/:name', async function(req, res, next) {
  req.setTimeout(600000);
  const name = req.params.name || '';
  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
        ],
      });
      console.log('browser launched...')
      const page = await browser.newPage();
      await page.goto('http://eservices.cipc.co.za/Search.aspx');
      console.log('page opened...')
      
      // EntName
      // EntNo
      // IDNo
      await page.waitForSelector("select[name='ctl00$cntMain$drpSearchOptions']");
      console.log('found search options component...')
      await page.select("select[name='ctl00$cntMain$drpSearchOptions']", "EntName");

      console.log('selected query type...')

      await page.waitForTimeout(500);

      await page.focus("input[name='ctl00$cntMain$txtSearchCIPC']")
      await page.keyboard.type(name);

      console.log('entered "'+name+'"...')

      await page.click("#ctl00_cntMain_lnkSearchIcon");

      console.log('clicked search...')

      console.log('waiting for search results box...');

      await page.waitForSelector("#ctl00_cntMain_pnlNameSearch", {
        timeout: 120000
      });

      console.log('waited for search results box...');

      const html = await page.evaluate(el => el.innerHTML, await page.$('#ctl00_cntMain_pnlNameSearch'));

      console.log('got search results...');

      await browser.close();

      console.log('closed browser...');

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

      res.send({
        count: results.length,
        results,
      });
    } catch (error) {
      console.log(error);
      return res.send({
        count: 0,
        results: [],
      });
    }
  })();
});

module.exports = router;
