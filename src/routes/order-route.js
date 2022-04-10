const express = require('express');
const indicative = require('indicative');
const getCurrentDate = require('./utils').getCurrentDate;
const sendErrorResponse = require('../utils/utils').sendErrorResponse;

const router = express.Router();

router.get('/books/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        await indicative.validator.validate(orderId, { orderId: 'required|regex:^[0-9a-f]{24}$' });
        const booksByOrderId = await req.app.get('db').collection('ordered_books').find({ orderId }).toArray();
        console.log('+++result - ', JSON.stringify(booksByOrderId))
        if (booksByOrderId.length === 0) {
            sendErrorResponse(req, res, 404, `Books with Order ID=${orderId} don't exist`);
            return;
        }
        res.json({ ordered_books: booksByOrderId });
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid order data: ${errors}`, errors);
    }
});

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await indicative.validator.validate(userId, { userId: 'required|regex:^[0-9a-f]{24}$' });
        const userOrders = await req.app.get('db').collection('orders').find({ userId }).toArray();
        console.log('+++result - ', JSON.stringify(userOrders))
        if (userOrders.length === 0) {
            sendErrorResponse(req, res, 404, `Orders with User ID=${userId} don't exist`);
            return;
        }
        res.json({ orders: userOrders });
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid order data: ${errors}`, errors);
    }
});

router.post('/', async (req, res) => {
    const order = req.body;
    try {
        await indicative.validator.validate(order, {
            orderId: 'required|string',
            userId: 'required|string',
            total: 'required|number',
            books: 'required|array'
        });

        try {
            const result = await req.app.get('db').collection('orders').insertOne({
                orderId: order.orderId,
                userId: order.userId,
                orderTotal: order.total,
                createdDate: getCurrentDate(),
                status: 'In Progres'
            });

            if (!result.acknowledged) {
                sendErrorResponse(req, res, 500, `Unable to create order: ${order.orderId}`);
                return;
            }
            const booksWithOrderId = order.books.map(book => ({ ...book, orderId: order.orderId }));
            const resultOrderProducts = await req.app.get('db').collection('ordered_books').insertMany(booksWithOrderId);
            if (!resultOrderProducts.acknowledged) {
                sendErrorResponse(req, res, 500, `Unable to create ordered Books: ${order.orderId}`);
                return;
            }
            res.status(200).json({ status: "ok" });
        } catch (err) {
            console.log(err);
            sendErrorResponse(req, res, 500, 'Server error: ' + err.message, err);
        }
    } catch (error) {
        sendErrorResponse(req, res, 400, 'Invalid order data: ' + err.message, err);

    }
});





module.exports = router // default export 
