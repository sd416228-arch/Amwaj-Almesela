const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { rateLimit } = require('express-rate-limit');

// Load environment variables
dotenv.config();

const { sequelize } = require('./models');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ── Middlewares ──
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false // Allows loading local assets easily
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ── Swagger Documentation Setup ──
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Amwaj Almesela E-commerce API',
            version: '1.0.0',
            description: 'Comprehensive backend REST API documentation for the Amwaj Almesela catalog and checkout.'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`
            }
        ]
    },
    apis: [path.join(__dirname, 'routes', '*.js')]
};
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// ── Mount Routes ──
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/brands', require('./routes/brand.routes'));
app.use('/api/v1/inventory', require('./routes/inventory.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/wishlist', require('./routes/wishlist.routes'));
app.use('/api/v1/orders', require('./routes/order.routes'));
app.use('/api/v1/payments', require('./routes/payment.routes'));
app.use('/api/v1/shipping', require('./routes/shipping.routes'));
app.use('/api/v1/search', require('./routes/search.routes'));
app.use('/api/v1/reviews', require('./routes/review.routes'));
app.use('/api/v1/coupons', require('./routes/coupon.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/banners', require('./routes/banner.routes'));
app.use('/api/v1/blogs', require('./routes/blog.routes'));
app.use('/api/v1/admin/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/settings', require('./routes/settings.routes'));

// ── Serve Static Assets ──
app.use(express.static(path.join(__dirname, '..'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// ── Clean URL Front-End Routes ──
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'products.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'product-detail.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Root fallback redirects to /home
app.get('/', (req, res) => {
    res.redirect('/home');
});

// Error handling middleware
app.use(errorHandler);

// ── Server Start ──
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        console.log('✅ Database connection established successfully.');
        app.listen(PORT, () => {
            console.log(`🚀 Server running in development mode on port ${PORT}`);
            console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
        });
    })
    .catch(err => {
        console.error('❌ Unable to connect to the database:', err.message);
    });
