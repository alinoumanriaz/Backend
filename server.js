import express, { urlencoded } from "express";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './api/user.js';
import categoryRoutes from "./api/category.js";
import productRoutes from "./api/products.js";
import wishlistRouter from "./api/wishlist.js";
import orderRouters from "./api/order.js";
import reviewRoutes from "./api/review.js";
import env from 'dotenv';
import fabricRoutes from "./api/fabric.js";
env.config();

const app = express();
const serverPort = process.env.SERVER_PORT || 8080;

// ✅ Allowed frontend origins
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.0.110:3000',
    'https://dashboard.mirfah.com',
    'https://mirfah.com',
    'https://www.mirfah.com'
];

// ✅ CORS middleware
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// ✅ Preflight handler for file uploads, etc.
app.options('*', cors(corsOptions));

// ✅ Useful headers for caching and debugging
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'Origin');
    next();
});

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} from Origin: ${req.headers.origin || 'unknown'}`);
    next();
});

// ✅ Core middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API Routes
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/fabric', fabricRoutes);
app.use('/api/product', productRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/order', orderRouters);

// ✅ Health check route
app.get('/', (req, res) => res.json({ message: 'Backend Working fine' }));

// ✅ Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ Start the server
app.listen(serverPort, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${serverPort}`);
});
