import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import puppeteer from 'puppeteer';

config();

const cookiesPath = 'temp/cookies.json';
const signInUrl = 'https://account.flo.ca/Account/Login';
const stationData = `https://account.flo.ca/Station/StationStatus?friendlyDeviceId=${process.env.FLO_STATION_ID}&startFastUpdates=false`;

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  try {
    const cookies = readFileSync(cookiesPath, 'utf8');
    const deserializedCookies = JSON.parse(cookies);
    await page.setCookie(...deserializedCookies);
  } catch (error) {
    // It's fine, we'll just log in instead
  }

  await page.goto(stationData);

  if (page.url().startsWith(signInUrl)) {
    await page.type('#Username', process.env.FLO_USERNAME);
    await page.type('#Password', process.env.FLO_PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForTimeout(250);
    const cookies = await page.cookies();
    const cookieJson = JSON.stringify(cookies);
    writeFileSync(cookiesPath, cookieJson);
    // ReturnUrl does not seem to work, so let's head back to the station data page
    await page.goto(stationData);
  }

  const timestamp = new Date();
  const content = await page.evaluate(() =>
    JSON.parse(document.querySelector('body').innerText),
  );
  const data = {
    timestamp,
    id: content.Id,
    nickname: content.Nickname,
    status: content.Status,
    vehicleConnected: content.VehicleConnected,
    ledHexCode: content.LedHexCode,
    ledModulationState: content.CurrentLEDModulationState,
    energy: content.Energy,
    energyUnit: content.EnergyUnits,
    voltage: content.Voltage,
    voltageUnits: content.VoltageUnits,
    current: content.Current,
  };
  console.log(content);
  console.log();
  console.log('-'.repeat(20));
  console.log();
  const pretty = JSON.stringify(data, null, 2);
  console.log(pretty);
  await browser.close();
}

main();
