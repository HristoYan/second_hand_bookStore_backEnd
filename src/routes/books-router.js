const express = require('express');
const indicative = require('indicative');
const sendErrorResponse = require('../utils/utils').sendErrorResponse;
const replace_id = require('../utils/utils').replace_id;
const ObjectId = require('mongodb').ObjectId;


const router = express.Router();

// books Router
router.get('/', async (req, res) => {
    try {
        const books = await req.app.get('db').collection('books').find().toArray();
        res.json(books.map(u => replace_id(u)))
    } catch (err) {
        sendErrorResponse(req, res, 500, 'Server error: ' + err.message, err);
    }
});

router.get('/:id', async (req, res) => {
    const params = req.params;
    try {
        await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
        const book = await req.app.get('db').collection('books').findOne({ _id: new ObjectId(req.params.id) });
        if (!book) {
            sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
            return;
        }
        replace_id(book);
        res.json(book);
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid book data: ${errors}`, errors);
    }
});

router.post('/', async (req, res) => {
    const book = req.body;
    try {
        await indicative.validator.validate(book, {
            seller: 'required|string|min:2',
            sellerId: 'required|string',
            condition: 'required|number',
            price: 'required|number',
            imgUrl: 'required|url',
            title: 'required|string',
            authors: 'required|array',
            publisher: 'required|string',
            year: 'required|string',
            categories: 'required|array',
            description: 'required|string',
            comments: 'required|array',
            date: 'required|string',
            lastModification: 'required|string'
        })

        try {
            const result = await req.app.get('db').collection('books').insertOne(book);
            if (result.acknowledged) {
                replace_id(book);
                res.status(201).location(`/books/${book.id}`).json(book);
            } else {
                sendErrorResponse(req, res, 500, `Unable to create book: ${book.id}: ${book.title}`);
            }
        } catch (err) {
            console.log(err);
            sendErrorResponse(req, res, 500, 'Server error: ' + err.message, err);
        }
    } catch (err) {
        sendErrorResponse(req, res, 400, 'Invalid book data: ' + err.message, err);
    }
});

router.put('/:id', async (req, res) => {
    const old = await req.app.get('db').collection('books').findOne({ _id: new ObjectId(req.params.id) });
    if (!old) {
        sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
        return;
    }
    const book = req.body;
    if (old._id.toString() !== book.id) {
        sendErrorResponse(req, res, 400, `Book ID=${book.id} does not match URL ID=${req.params.id}`);
        return;
    }
    try {
        await indicative.validator.validate(book, {
            id: 'required|regex:^[0-9a-f]{24}$',
            seller: 'required|string|min:2',
            sellerId: 'required|string',
            condition: 'required|number',
            price: 'required|number',
            imgUrl: 'required|url',
            title: 'required|string',
            authors: 'required|array',
            publisher: 'required|string',
            year: 'required|string',
            categories: 'required|array',
            description: 'required|string',
            comments: 'required|array',
            date: 'required|string',
            lastModification: 'required|string'
        });
        try {
            r = await req.app.get('db').collection('books').updateOne({ _id: new ObjectId(req.params.id) }, { $set: book });
            if (r.acknowledged) {
                replace_id(book)
                console.log(`Updated book: ${JSON.stringify(book)}`);
                res.json(book);
            } else {
                sendErrorResponse(req, res, 500, `Unable to update book: ${book.id}: ${book.title}`);
            }
        } catch (err) {
            console.log(`Unable to update book: ${book.id}: ${book.title}`);
            console.error(err);
            sendErrorResponse(req, res, 500, `Unable to update book: ${book.id}: ${book.title}`, err);
        }
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid book data: ${errors}`, errors);
    }
});

router.delete('/:id', async (req, res) => {
    const params = req.params;
    try {
        await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
        const old = await req.app.get('db').collection('books').findOne({ _id: new ObjectId(req.params.id) });
        if (!old) {
            sendErrorResponse(req, res, 404, `Book with ID=${req.params.id} does not exist`);
            return;
        }
        replace_id(old);
        const r = await req.app.get('db').collection('books').deleteOne({ _id: new ObjectId(req.params.id) });
        if (r.acknowledged) {
            res.json(old);
        } else {
            console.log(`Unable to delete book: ${old.id}: ${old.title}`);
            sendErrorResponse(req, res, 500, `Unable to delete book: ${old.id}: ${old.title}`);
        }
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid book data: ${errors}`, errors);
    }
});





module.exports = router // default export 
