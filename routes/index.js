var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const { JSDOM } = require("jsdom");

const URL = 'http://eservices.cipc.co.za/Search.aspx'

router.get('/enterpriseName/:name', async function(req, res, next) {
  req.setTimeout(300000);
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
      await page.goto(URL);
      console.log('page opened...')

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

      console.log('found search results box...');

      const html = await page.evaluate(el => el.innerHTML, await page.$('#ctl00_cntMain_pnlNameSearch'));

      console.log('got lookup results...');

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

router.get('/enterpriseNo/:number*', async function(req, res, next) {
  req.setTimeout(300000);
  const number = req.params['number'] || '';
  const trail = req.params[0] || '';
  const joined = number + trail;
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
      await page.goto(URL);
      console.log('page opened...')

      await page.waitForSelector("select[name='ctl00$cntMain$drpSearchOptions']");
      console.log('found search options component...')
      await page.select("select[name='ctl00$cntMain$drpSearchOptions']", "EntNo");

      console.log('selected query type...')

      await page.waitForTimeout(500);

      await page.focus("input[name='ctl00$cntMain$txtSearchCIPC']")
      await page.keyboard.type(joined);

      console.log('entered "'+joined+'"...')

      await page.click("#ctl00_cntMain_lnkSearchIcon");

      console.log('clicked search...')

      // TODO: Look for any errors

      console.log('waiting for search results box...');

      await page.waitForSelector("#ctl00_cntMain_pnlEntNoSearch", {
        timeout: 120000
      });

      console.log('found search results box...');

      const html = await page.evaluate(el => el.innerHTML, await page.$('#ctl00_cntMain_TabContainer1'));

      console.log('got lookup results...');

      await browser.close();

      console.log('closed browser...');

      const dom = new JSDOM(html);
      const enterpriseDetails = dom.window.document.querySelector("#ctl00_cntMain_TabContainer1_TabPanel1 tbody");

      const enterpriseRows = enterpriseDetails.rows;

      const companyDetails = {};

      for (let index = 0; index < enterpriseRows.length; index++) {
        if (index > 0) {
          const row = enterpriseRows[index];

          if (index > 0 && index < 7) {
            const cells = Array.prototype.slice.call(row.cells);
            const key = cells[0].innerHTML.replace(/(\r\n|\n|\r)/gm, "").trim();
            const value = cells[1].innerHTML.trim().replace(/(<([^>]+)>)/gi, "");
            companyDetails[camelize(key)] = value;
          }
          // Addresses
          if (index === 7) {
            const cells = Array.prototype.slice.call(row.cells);
            const addresses = new JSDOM(cells[0].innerHTML);
            const rows = addresses.window.document.querySelector("table tr");
            const physicalDOM = new JSDOM(rows.cells[0].innerHTML);
            const postalDOM = new JSDOM(rows.cells[1].innerHTML);
            const physical = physicalDOM.window.document.querySelector("span").innerHTML.split('<br>');
            const postal = postalDOM.window.document.querySelector("span").innerHTML.split('<br>');
            companyDetails['physicalAddress'] = physical;
            companyDetails['postalAddress'] = postal;
          }
        }
      }

      const directorDetailsTable = dom.window.document.querySelector("#ctl00_cntMain_TabContainer1_TabPanel2 tbody");

      const directorOuterRows = directorDetailsTable.rows[1];

      const cells = Array.prototype.slice.call(directorOuterRows.cells);

      const directorRows = Array.prototype.slice.call(cells[0].getElementsByTagName('tr'));

      const directors = [];

      for (let index = 0; index < directorRows.length; index++) {
        if (index > 0) {
          const element = directorRows[index];
          const cells = element.cells;
          const id = cells[0].innerHTML;
          const names = cells[1].innerHTML;
          const surname = cells[2].innerHTML;
          const type = cells[3].innerHTML;
          const status = cells[4].innerHTML;
          directors.push({
            id,
            names,
            surname,
            type,
            status,
          })
        }
      }

      companyDetails['directors'] = directors;
      
      res.send({
        ...companyDetails,
      });
    } catch (error) {
      console.log(error);
      return res.send({
        message: 'Failed to retrieve company details',
        error,
      });
    }
  })();
});

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

module.exports = router;
