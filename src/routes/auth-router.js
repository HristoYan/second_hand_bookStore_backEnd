const express = require('express');
const sendErrorResponse = require('./utils').sendErrorResponse;
const replaceId = require('./utils').replaceId;
const ObjectID = require('mongodb').ObjectID;
const indicative = require('indicative');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secret = require('../config/secret').secret;

const router = express.Router();

// Users API Feature
router.post('/api/login', async (req, res) => {
    const db = req.app.get('db');
    const credentials = req.body;
    try {
        await indicative.validator.validate(credentials, {
            username: 'required|string|min:2',
            password: 'required|string|min:6'
        });

        const user = await db.collection('users').findOne({ username: credentials.username });
        if (!user) {
            sendErrorResponse(req, res, 404, `User with Username=${credentials.username} does not exist.`);
            return;
        }
        const passIsValid = bcrypt.compareSync(credentials.password, user.password);
        console.log(bcrypt.hashSync(credentials.password));
        if (!passIsValid) {
            sendErrorResponse(req, res, 401, `Username or password is incorrect.`);
            return;
        }
        replaceId(user);
        const token = jwt.sign({ id: user.id }, secret, {
            expiresIn: 3600 //expires in 24 h
        });
        delete user.password;
        res.status(200).json({ auth: true, token, user });
    } catch (errors) {
        console.log(`Errors:`, errors);
        sendErrorResponse(req, res, 400, `Invalid user data: ${errors.message}`, errors);
    }



});

module.exports = router;