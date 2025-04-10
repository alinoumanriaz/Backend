import express, { urlencoded } from "express"
import cookieParser from 'cookie-parser'
import cors from 'cors'
import userRoutes from './api/user.js'
import categoryRoutes from "./api/category.js"
import productRoutes from "./api/products.js"
import brandRouter from "./api/brand.js"
import wishlistRouter from "./api/wishlist.js"
import orderRouters from "./api/order.js"
import env from 'dotenv'
env.config();
const serverPort = process.env.SERVER_PORT || 8080;
const app = express()


app.use(cors({ origin: ['http://localhost:3000','https://mirfah.com' , 'https://dashboard.mirfah.com/', 'http://localhost:3001', 'http://192.168.0.117:3000'], origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)
app.use('/api/brand', brandRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/order', orderRouters)
app.use('/', (req, res, next) => res.json('Backend Working fine'))

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

if (process.env.NODE_ENV === 'localhost') {
    app.listen(serverPort, '0.0.0.0', () => console.log('server working on port 8080'));
}

export default app
