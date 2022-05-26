import { fileURLToPath } from 'url';
import { dirname, join, normalize } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const databaseFile = normalize(join(__dirname, '../data/db.sqlite'));
export const cookiesFile = normalize(join(__dirname, '../temp/cookies.json'));
export const downloadPath = normalize(join(__dirname, '../temp'));
export const sessionHistoryFile = join(downloadPath, 'SessionHistory.xlsx');
