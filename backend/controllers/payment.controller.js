const { Payment, Order } = require('../models');
const { successResponse } = require('../utils/helpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res, next) => {
    try {
        const { order_id } = req.body;
        const order = await Order.findOne({ where: { id: order_id } });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Stripe amount is in cents (e.g. QAR 100.00 = 10000 cents)
        const amountCents = Math.round(parseFloat(order.total) * 100);

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountCents,
                currency: 'qar',
                metadata: { order_id: String(order.id) },
            });

            successResponse(res, {
                clientSecret: paymentIntent.client_secret,
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
            }, 'Payment intent created successfully');
        } catch (stripeError) {
            console.warn('⚠️ Stripe API Error (falling back to Mock Intent for checkout preview):', stripeError.message);
            successResponse(res, {
                clientSecret: 'mock_secret_intent_' + Math.random().toString(36).substring(2, 10),
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key',
                is_mock: true
            }, 'Mock Payment intent created successfully (Stripe API key fallback)');
        }
    } catch (err) { next(err); }
};

const processPayment = async (req, res, next) => {
    try {
        const { order_id, method, transaction_id, status } = req.body;
        const order = await Order.findOne({ where: { id: order_id } });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const finalStatus = status || 'completed';

        const payment = await Payment.create({
            order_id,
            method: method || 'credit_card',
            transaction_id: transaction_id || ('TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase()),
            amount: order.total,
            status: finalStatus,
            paid_at: finalStatus === 'completed' ? new Date() : null
        });

        if (finalStatus === 'completed') {
            await order.update({ status: 'confirmed' });
        }

        successResponse(res, { data: payment }, finalStatus === 'completed' ? 'Payment processed successfully' : 'Payment failed', finalStatus === 'completed' ? 201 : 400);
    } catch (err) { next(err); }
};

const getPaymentStatus = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({
            where: { order_id: req.params.orderId },
            include: [{ model: Order, as: 'order', attributes: ['id', 'user_id', 'status'] }]
        });

        if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
        
        // Allow check if authorized
        if (req.user && payment.order.user_id !== req.user.id && req.user.role.name !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        successResponse(res, { data: payment });
    } catch (err) { next(err); }
};

const getAdminPayments = async (req, res, next) => {
    try {
        const payments = await Payment.findAll({
            include: [{ model: Order, as: 'order', attributes: ['id', 'order_number'] }],
            order: [['created_at', 'DESC']]
        });
        successResponse(res, { data: payments });
    } catch (err) { next(err); }
};

module.exports = { createPaymentIntent, processPayment, getPaymentStatus, getAdminPayments };
