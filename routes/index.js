var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const { JSDOM } = require("jsdom");

const URL = 'https://bizportal.gov.za/user_login.aspx';

router.get('/enterpriseName/:name', async function(req, res, next) {
  req.setTimeout(300000);
  const LOGIN_USERNAME = req.query.loginUsername || process.env.LOGIN_USERNAME;
  const LOGIN_PASSWORD = req.query.loginPassword || process.env.LOGIN_PASSWORD;
  console.log({
    LOGIN_USERNAME,
    LOGIN_PASSWORD
  });
  const name = req.params.name || '';
  (async () => {
    try {

      const browser = await puppeteer.launch({
        headless: false
      });
      console.log('browser launched...')
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080});
      await page.goto(URL);
      console.log('page opened...');
    
      await page.waitForSelector("#cntMain_txtIdNo", {
        timeout: 120000
      });
      console.log('found login...');
    
      await page.focus("input[name='ctl00$cntMain$txtIdNo']")
      await page.keyboard.type(LOGIN_USERNAME);
    
      await page.focus("input[name='ctl00$cntMain$txtPassword']")
      await page.keyboard.type(LOGIN_PASSWORD);
    
      await page.waitForTimeout(1000);
      
      await page.click("input[name='ctl00$cntMain$btnLogin']");
      console.log('clicked login...');
    
      await page.waitForTimeout(1000);
    
      // Validate logged in
      await page.waitForSelector("#cntSidebar_lblSurname", {
        timeout: 120000
      });
    
      console.log('logged in...');
    
      await page.waitForTimeout(1000);

      await page.waitForSelector('input[name="ctl00$txtSearchHeader"]', {
        timeout: 120000
      });

      console.log('found search options component...');

      await page.select("select[name='ctl00$drpSearchOptionsHeader']", "EntName");

      console.log('selected query type...')

      await page.waitForTimeout(500);

      await page.focus('input[name="ctl00$txtSearchHeader"]')
      await page.keyboard.type(name);

      console.log('entered "'+name+'"...')

      await page.waitForTimeout(1000);

      await page.click("#btnSearchHeader");

      console.log('clicked search...')

      await page.waitForTimeout(1000);

      console.log('waiting for search results box...');

      await page.waitForSelector("#cntMain_gdvEnterprisesName", {
        timeout: 120000
      });

      console.log('found search results box...');

      // Calculate how many pages of results there are
      const pager = await page.evaluate(el => el.innerHTML, await page.$('.mGridPager'));

      const pagerDom = new JSDOM(pager);

      const pages = pagerDom.window.document.querySelector("table tr").cells.length;

      console.log({
        pages
      });

      const results = [];

      for (let index = 1; index < pages + 1; index++) {
        console.log('Page:', index);
        
        const html = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResultsName'));
        const dom = new JSDOM(html);
        const table = dom.window.document.querySelector("#cntMain_gdvEnterprisesName > tbody");
        const rows = table.rows;
  
        for (let index = 0; index < rows.length; index++) {
          if (index > 0) {
            const row = rows[index];
            const cells = Array.prototype.slice.call(row.cells);
            const item = cells[2];
            if (item) {
              results.push({
                name: cells[0].innerHTML,
                number: cells[1].innerHTML,
                status: cells[2].innerHTML,
              });
            }
          }
        }

        if (index !== pages) {
          await page.click(`.mGridPager table td:nth-of-type(${index + 1})`);
          await page.waitForTimeout(1000);
        }
      }

      console.log('got paged lookup results...');

      await browser.close();

      console.log('closed browser...');

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
  const LOGIN_USERNAME = req.query.loginUsername || process.env.LOGIN_USERNAME;
  const LOGIN_PASSWORD = req.query.loginPassword || process.env.LOGIN_PASSWORD;
  console.log({
    LOGIN_USERNAME,
    LOGIN_PASSWORD
  });
  const number = req.params['number'] || '';
  const trail = req.params[0] || '';
  const joined = number + trail;
  (async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true
      });
      console.log('browser launched...')
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080});
      await page.goto(URL);
      console.log('page opened...');

      await page.waitForSelector("input[name='ctl00$cntMain$txtIDNo']", {
        timeout: 120000
      });
      console.log('found login...');

      await page.waitForSelector("#cntMain_chkId_ToggleButton", {
        timeout: 120000
      });

      await page.waitForTimeout(2500);

      await page.click("#cntMain_chkId_ToggleButton");
      console.log('toggled...');

      await page.waitForTimeout(1000);

      await page.focus("input[name='ctl00$cntMain$txtCustCode']")
      await page.keyboard.type(LOGIN_USERNAME);

      await page.focus("input[name='ctl00$cntMain$txtPassword']")
      await page.keyboard.type(LOGIN_PASSWORD);
      
      await page.click("input[name='ctl00$cntMain$btnLogin']");
      console.log('clicked login...');

      await page.waitForTimeout(1000);

      // Validate logged in
      await page.waitForSelector("#cntMain_lblSurname", {
        timeout: 120000
      });

      console.log('logged in...');

      await page.waitForTimeout(1000);

      await page.goto('https://bizportal.gov.za/bizprofile.aspx');

      console.log('navigated to bizprofile...');

      await page.waitForSelector("#cntMain_pnlSearchBox", {
        timeout: 120000
      });

      console.log('found search options component...')

      await page.select("select[name='ctl00$cntMain$drpSearchOptions']", "EntNo");

      console.log('selected query type...')

      await page.waitForTimeout(500);

      await page.focus("input[name='ctl00$cntMain$txtSearchCIPC']")
      await page.keyboard.type(joined);

      console.log('entered "'+joined+'"...')

      await page.waitForTimeout(1000);

      await page.click("input[name='ctl00$cntMain$btnSearch']");

      console.log('clicked search...');

      await page.waitForTimeout(2500);

      await page.waitForSelector("#cntMain_lblError", {
        timeout: 120000
      });

      await page.waitForTimeout(1000);

      await page.click("input[name='ctl00$cntMain$btnSearch']");

      console.log('waiting for search results box...');

      await page.waitForTimeout(1000);

      await page.waitForSelector("#cntMain_pnlResults", {
        timeout: 120000
      });

      console.log('found search results box...');

      const companyDetailsTab = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(1) .tab-content'));
      const directorDetailsTab = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(2) .tab-content'));
      const annualReturnDetailsTable = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(3) .tab-content'));
      const outstandingAnnualReturnsTable = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(3) .tab-content div:nth-of-type(2)'));
      const enterpriseHistoryTab = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(4) .tab-content'));
      const beeDetailsTab = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(5) .tab-content'));
      const otherDetailsTab = await page.evaluate(el => el.innerHTML, await page.$('#cntMain_pnlResults > div:nth-child(6) .tab-content'));

      console.log('got lookup results...');

      await browser.close();

      console.log('closed browser...');

      const companyDetailsDom = new JSDOM(companyDetailsTab);
      const sections = companyDetailsDom.window.document.querySelectorAll("section");

      const companyDetails = {};

      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];

        const sectionArray = Array.prototype.slice.call(section.children)

        if (index < 6) {
          const key = sectionArray[0].innerHTML.replace(/(\r\n|\n|\r)/gm, "").trim();
          const value = sectionArray[1].innerHTML.trim().replace(/(<([^>]+)>)/gi, "");
          companyDetails[camelize(key)] = value;
        }
        if (index === 6) {
          const physicalDom = new JSDOM(sectionArray[1].innerHTML);
          const physical = physicalDom.window.document.querySelector("span").innerHTML.split('<br>');
          companyDetails['physicalAddress'] = physical;
        }
        if (index === 7) {
          const postalDom = new JSDOM(sectionArray[1].innerHTML);
          const postal = postalDom.window.document.querySelector("span").innerHTML.split('<br>');
          companyDetails['postalAddress'] = postal;
        }
      }

      const directorDetailsDom = new JSDOM(directorDetailsTab);
      const directorDetailsTableRows = directorDetailsDom.window.document.querySelectorAll("tbody tr");

      const directors = [];

      for (let index = 0; index < directorDetailsTableRows.length; index++) {
        if (index > 0) {
          const element = directorDetailsTableRows[index];
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

      const annualReturnDetailsDom = new JSDOM(annualReturnDetailsTable);
      const annualReturnDetailsTableRows = annualReturnDetailsDom.window.document.querySelector("tbody");

      const filedAnnualReturns = [];

      for (let index = 0; index < annualReturnDetailsTableRows.rows.length; index++) {
        if (index > 0) {
          const element = annualReturnDetailsTableRows.rows[index];
          const cells = element.cells;
          if (cells && cells.length > 1) {
            const arYear = cells[0].innerHTML;
            const amountPaid = cells[1].innerHTML;
            const dateFiled = cells[2].innerHTML;
            filedAnnualReturns.push({
              arYear,
              amountPaid,
              dateFiled
            })
          }
        }
      }

      companyDetails['filedAnnualReturns'] = filedAnnualReturns;

      const outstandingAnnualReturnsDom = new JSDOM(outstandingAnnualReturnsTable);
      const outstandingAnnualReturnsTableRows = outstandingAnnualReturnsDom.window.document.querySelector("tbody");

      const outstandingAnnualReturns = [];

      for (let index = 0; index < outstandingAnnualReturnsTableRows.rows.length; index++) {
        if (index > 0) {
          const element = outstandingAnnualReturnsTableRows.rows[index];
          const cells = element.cells;
          const arYear = cells[0].innerHTML;
          if (arYear !== 'This enterprise does not have any outstanding annual returns at the moment') {
            const arMonth = cells[1].innerHTML;
            const arNonComplianceDate = cells[2].innerHTML;
            outstandingAnnualReturns.push({
              arYear,
              arMonth,
              arNonComplianceDate
            });
          }
        }
      }

      companyDetails['outstandingAnnualReturns'] = outstandingAnnualReturns;

      const enterpriseHistoryDom = new JSDOM(enterpriseHistoryTab);
      const enterpriseHistoryTableRows = enterpriseHistoryDom.window.document.querySelectorAll("tbody tr");

      const enterpriseHistory = [];

      for (let index = 0; index < enterpriseHistoryTableRows.length; index++) {
        if (index > 0) {
          const element = enterpriseHistoryTableRows[index];
          const cells = element.cells;
          const date = cells[0].innerHTML;
          const details = cells[1].innerHTML;
          enterpriseHistory.push({
            date,
            details
          });
        }
      }

      companyDetails['enterpriseHistory'] = enterpriseHistory;

      try {
        const beeDetailsDom = new JSDOM(beeDetailsTab);
        const beeDetailsParagraph = beeDetailsDom.window.document.querySelector("#cntMain_pnlNoBEE p");

        if (beeDetailsParagraph && beeDetailsParagraph.innerHTML) {
          companyDetails['BEEDetails'] = {
            response: beeDetailsParagraph.innerHTML
          };
        }
      } catch (error) {
        console.log({
          error
        });
      }

      const otherDetailsTabDom = new JSDOM(otherDetailsTab);
      const otherDetailsTabSections = otherDetailsTabDom.window.document.querySelectorAll("section");

      companyDetails['otherDetails'] = []

      if (otherDetailsTabSections && otherDetailsTabSections.length > 0) {
        for (let index = 0; index < otherDetailsTabSections.length; index++) {
          const elements = otherDetailsTabSections[index].querySelectorAll('div');
          const key = elements[0].innerHTML;
          const value = elements[1].querySelector('span').innerHTML;
          companyDetails['otherDetails'].push({
            key,
            value
          });
        }
      }

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
