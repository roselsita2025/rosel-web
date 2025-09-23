import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..');

// Load environment variables from root .env file
dotenv.config({ path: path.join(rootDir, '.env') });

export default dotenv;
