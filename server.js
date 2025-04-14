import express, { urlencoded } from "express"
import cookieParser from 'cookie-parser'
import cors from 'cors'
import userRoutes from './api/user.js'
import categoryRoutes from "./api/category.js"
import productRoutes from "./api/products.js"
import wishlistRouter from "./api/wishlist.js"
import orderRouters from "./api/order.js"
import env from 'dotenv'
import reviewRoutes from "./api/review.js"
env.config();
const serverPort = process.env.SERVER_PORT || 8080;
const app = express()


const allowedOrigins = [
    'http://localhost:3000',
    'https://mirfah.com',
    'https://www.mirfah.com',
    'https://dashboard.mirfah.com',
    'http://localhost:3001',
    'http://192.168.0.117:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin); // Respond with the exact origin
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use((req, res, next) => {
    console.log('Origin:', req.headers.origin);
    next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', userRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/product', productRoutes)
app.use('/api/review', reviewRoutes)
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
