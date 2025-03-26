import mysql from 'mysql2/promise';
import env from 'dotenv'
env.config();

const db = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
})

export default db;