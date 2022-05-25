import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import { Sequelize } from 'sequelize';
import puppeteer from 'puppeteer';
import { db, StationObservation } from './database.js';

config();

const cookiesPath = 'temp/cookies.json';
const signInUrl = 'https://account.flo.ca/Account/Login';
const stationDataUrl = `https://account.flo.ca/Station/StationStatus?friendlyDeviceId=${process.env.FLO_STATION_ID}&startFastUpdates=false`;

async function headToUrl(browser, url) {
  const page = await browser.newPage();

  try {
    const cookies = readFileSync(cookiesPath, 'utf8');
    const deserializedCookies = JSON.parse(cookies);
    await page.setCookie(...deserializedCookies);
  } catch (error) {
    // It's fine, we'll just log in instead
  }

  await page.goto(url);

  if (page.url().startsWith(signInUrl)) {
    await page.type('#Username', process.env.FLO_USERNAME);
    await page.type('#Password', process.env.FLO_PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForTimeout(250);
    const cookies = await page.cookies();
    const cookieJson = JSON.stringify(cookies);
    writeFileSync(cookiesPath, cookieJson);
    // ReturnUrl does not seem to work, so let's head back to the station data page
    await page.goto(url);
  }

  return page;
}

async function getStationData(browser) {
  const page = await headToUrl(browser, stationDataUrl);
  const timestamp = new Date();
  const content = await page.evaluate(() =>
    JSON.parse(document.querySelector('body').innerText),
  );

  console.log(content);
  console.log();
  console.log('-'.repeat(20));

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

  console.log(JSON.stringify(entry, null, 4));
}

async function getSessionHistory(browser) {
  // https://account.flo.ca/SessionHistory/SessionHistoryFile?DateRange.From=2022-04-25&DateRange.To=2022-05-25&SelectedDevice=AllStations
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  await getStationData(browser);
  await browser.close();
}

main();
