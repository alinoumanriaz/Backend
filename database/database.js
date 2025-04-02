import mysql from 'mysql2/promise';
import env from 'dotenv'
env.config();


const db = mysql.createPool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    ssl: {
        ca: Buffer.from(process.env.CA_PEM_BASE64, 'base64').toString('utf-8')
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

export default db;