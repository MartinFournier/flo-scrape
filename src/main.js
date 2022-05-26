import { unlinkSync, readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import puppeteer from 'puppeteer';
import { read as readXlsx, utils } from 'xlsx/xlsx.mjs';
import { StationObservation } from './database.js';
import { cookiesFile, downloadPath, sessionHistoryFile } from './paths.js';
import { logger } from './logger.js';

async function headToUrl(browser, url) {
  const signInUrl = 'https://account.flo.ca/Account/Login';
  const page = await browser.newPage();

  try {
    const cookies = readFileSync(cookiesFile, 'utf8');
    const deserializedCookies = JSON.parse(cookies);
    await page.setCookie(...deserializedCookies);
  } catch (error) {
    logger.info('Could set the cookies file');
    // It's fine, we'll just log in instead
  }

  logger.debug(`Heading to ${url}`);
  await page.goto(url);

  if (page.url().startsWith(signInUrl)) {
    logger.info(`We've hit the log in page instead, let's sign in...`);
    await page.type('#Username', process.env.FLO_USERNAME);
    await page.type('#Password', process.env.FLO_PASSWORD);
    await page.click('button[type=submit]');
    logger.debug(`Persisting cookies for the next run`);
    const cookies = await page.cookies();
    const cookieJson = JSON.stringify(cookies);
    writeFileSync(cookiesFile, cookieJson);
    // ReturnUrl does not seem to work, so let's head back to the station data page
    logger.info(`And now let's go back to ${url}`);
    await page.goto(url);
  }

  return page;
}

async function getStationData(browser) {
  const stationDataUrl = `https://account.flo.ca/Station/StationStatus?friendlyDeviceId=${process.env.FLO_STATION_ID}&startFastUpdates=false`;
  logger.info('Fetching the station data');
  const page = await headToUrl(browser, stationDataUrl);
  const timestamp = new Date();
  const content = await page.evaluate(() =>
    JSON.parse(document.querySelector('body').innerText),
  );

  const entry = await StationObservation.create({
    timestamp,
    niceId: content.Id,
    name: content.Name,
    nickname: content.Nickname,
    status: content.Status,
    vehicleConnected: content.VehicleConnected,
    ledHexCode: content.LedHexCode,
    ledModulationState: content.CurrentLEDModulationState,
    current: content.Current,
    energy: content.Energy,
    energyUnit: content.EnergyUnits,
    voltage: content.Voltage,
    voltageUnit: content.VoltageUnits,
  });

  logger.info('Completed');
  logger.debug(JSON.stringify(entry, null, 4));
}

async function getSessionHistory(browser) {
  const dateOffset = 24 * 60 * 60 * 1000 * 14; // 14 days
  const now = new Date();
  const dateTo = now.toISOString().split('T')[0];
  const dateFrom = new Date(now.getTime() - dateOffset)
    .toISOString()
    .split('T')[0];

  logger.info(`Fetching session history from ${dateFrom} to ${dateTo}`);
  const page = await headToUrl(
    browser,
    'https://account.flo.ca/SessionHistory',
  );

  logger.debug(`File download path is ${downloadPath}`);

  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath,
  });

  await page.evaluate(
    (from, to) => {
      document.getElementById('DateRange_From').value = from;
      document.getElementById('DateRange_To').value = to;
      document.getElementById('SelectedDevice').value = 'AllStations';
    },
    dateFrom,
    dateTo,
  );

  logger.debug('Setting filters...');
  await Promise.all([
    page.click('#sessionhistory-filter button[type=submit]'),
    page.waitForNavigation(),
  ]);

  logger.debug('Deleting old session history file...');
  try {
    unlinkSync(sessionHistoryFile);
  } catch (error) {
    logger.debug('File did not exist');
  }

  logger.debug('Downloading new file...');
  const [response] = await Promise.all([
    page.waitForNavigation(),
    page.click('#sessionhistory-downloadlink-file'),
  ]);

  await page.waitForTimeout(1000);
  logger.info('Completed.');

  const entries = getHistoryFromExcelFile();
  logger.debug(JSON.stringify(entries, null, 2));
}

function getHistoryFromExcelFile() {
  const buffer = readFileSync(sessionHistoryFile);
  const workbook = readXlsx(buffer, { sheets: 0, raw: false, cellDates: true });
  const sheet = workbook.Sheets['Report'];

  const headers = [
    'startDate',
    'endDate',
    'cardNumber',
    'parkName',
    'stationName',
    'durationDays',
    'energyTransferredWh',
    'originalCost',
    'originalCurrency',
    'totalCost',
    'currency',
  ];

  // First item is headers description
  const [_, ...data] = utils.sheet_to_json(sheet, {
    header: headers,
  });

  const historyEntries = data.map(row => ({
    stationName: row.stationName,
    startDate: row.startDate,
    endData: row.endDate,
    durationMs:
      new Date(row.endDate).getTime() - new Date(row.startDate).getTime(),
    energyTransferredWh: row.energyTransferredWh,
  }));

  return historyEntries;
}

async function main() {
  logger.info('Starting puppeteer browser');
  const browser = await puppeteer.launch({
    headless: true,
  });

  // await getStationData(browser);
  await getSessionHistory(browser);
  await browser.close();
}

config();
main();
