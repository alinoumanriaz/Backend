import mysql from 'mysql2/promise';
import env from 'dotenv'
env.config();

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    ssl: {
        ca: readFileSync(process.env.CA_CERTIFICATE)
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

export default db;