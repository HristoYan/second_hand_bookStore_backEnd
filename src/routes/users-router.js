const bcrypt = require('bcryptjs');
const express = require('express');
const indicative = require('indicative');
const sendErrorResponse = require('../utils/utils').sendErrorResponse;
const replace_id = require('../utils/utils').replace_id;
const ObjectId = require('mongodb').ObjectId;


const router = express.Router();

// Users Router
router.get('/', async (req, res) => {
    try {
        const users = await req.app.get('db').collection('users').find().toArray();
        res.json(users.map(u => replace_id(u)))
    } catch (err) {
        sendErrorResponse(req, res, 500, 'Server error: ' + err.message, err);
    }
});

router.get('/:id', async (req, res) => {
    const params = req.params;
    try {
        await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
        const user = await req.app.get('db').collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (!user) {
            sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
            return;
        }
        replace_id(user);
        res.json(user);
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid user data: ${errors}`, errors);
    }
});

router.post('/', async (req, res) => {
    const user = req.body;
    try {
        await indicative.validator.validate(user, {
            name: 'required|string|min:2',
            username: 'required|string|min:2',
            password: 'required|string|min:6',
            gender: 'required|string|in:Male,Female',
            role: 'required|string|in:Reader,Seller,Admin',
            imgUrl: 'required|url',
            short_description: 'required|string',
            status: 'required|string|in:Active,Suspended,Deactivated',
            date: 'required|string',
            lastModification: 'required|string',
            favorite: 'required|array'
        })
        if (!user.role) {
            user.role = 'Reader';
        }
        if (user.active === undefined) {
            user.active = true;
        }

        user.password = bcrypt.hashSync(user.password);
        try {
            const result = await req.app.get('db').collection('users').insertOne(user);
            if (result.acknowledged) {
                replace_id(user);
                res.status(201).location(`/users/${user.id}`).json(user);
            } else {
                sendErrorResponse(req, res, 500, `Unable to create user: ${user.id}: ${user.firstName} ${user.lastName}`);
            }
        } catch (err) {
            console.log(err);
            sendErrorResponse(req, res, 500, 'Server error: ' + err.message, err);
        }
    } catch (err) {
        sendErrorResponse(req, res, 400, 'Invalid user data: ' + err.message, err);
    }
});

router.put('/:id', async (req, res) => {
    const old = await req.app.get('db').collection('users').findOne({ _id: new ObjectId(req.params.id) });
    if (!old) {
        sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
        return;
    }
    const user = req.body;
    console.log(old._id.toString());
    console.log(user.id);

    if (old._id.toString() !== user.id) {
        sendErrorResponse(req, res, 400, `User ID=${user.id} does not match URL ID=${req.params.id}`);
        return;
    }
    try {
        await indicative.validator.validate(user, {
            id: 'required|regex:^[0-9a-f]{24}$',
            name: 'required|string|min:2',
            username: 'required|string|min:2',
            // password: 'required|string|min:6',
            gender: 'required|string|in:Male,Female',
            role: 'required|string|in:Reader,Seller,Admin',
            imgUrl: 'required|url',
            short_description: 'required|string',
            status: 'required|string|in:Active,Suspended,Deactivated',
            date: 'required|string',
            lastModification: 'required|string',
            favorite: 'required|array'
        });
        // {
        //     name: 'kiro',
        //     username: 'kiroto',
        //     gender: 'Male',
        //     role: 'Seller',
        //     imgUrl: 'https://imgs.search.brave.com/9iEa5GKW7YlkzxhvK3uxShAZnMEyPmg_5Rxzp8y90E4/rs:fit:474:225:1/g:ce/aHR0cHM6Ly90c2Ux/Lm1tLmJpbmcubmV0/L3RoP2lkPU9JUC5Y/VlFodzN6V2tpenU2/TEdtRXZBbXF3SGFI/YSZwaWQ9QXBp',
        //     short_description: 'happy guy and poor',
        //     status: 'Active',
        //     date: '2022-3-29/11:52:29',
        //     lastModification: '2022-3-29/11:52:29',
        //     favorite: [ '624daa9c16b7eb7e5df53519', '624dab3416b7eb7e5df5351a' ],
        //     active: true,
        //     id: '624d996a158c5d5b0411a686'
        //   }
        // user.password = bcrypt.hashSync(user.password);


        try {
            r = await req.app.get('db').collection('users').updateOne({ _id: new ObjectId(req.params.id) }, { $set: user });
            if (r.acknowledged) {
                
                console.log(`Updated user: ${JSON.stringify(user)}`);
                
                // res.json({...user, id: old._id.toString()});
                res.json(user);
            } else {
                sendErrorResponse(req, res, 500, `Unable to update user: ${user.id}: ${user.name}`);
            }
        } catch (err) {
            console.log(`Unable to update user: ${user.id}: ${user.name}`);
            console.error(err);
            sendErrorResponse(req, res, 500, `Unable to update user: ${user.id}: ${user.name}`, err);
        }
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid user data: ${errors}`, errors);
    }
});

router.delete('/:id', async (req, res) => {
    const params = req.params;
    try {
        await indicative.validator.validate(params, { id: 'required|regex:^[0-9a-f]{24}$' });
        const old = await req.app.get('db').collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (!old) {
            sendErrorResponse(req, res, 404, `User with ID=${req.params.id} does not exist`);
            return;
        }
        replace_id(old);
        const r = await req.app.get('db').collection('users').deleteOne({ _id: new ObjectId(req.params.id) });
        if (r.acknowledged) {
            res.json(old);
        } else {
            console.log(`Unable to delete user: ${old.id}: ${old.firstName} ${old.lastName}`);
            sendErrorResponse(req, res, 500, `Unable to delete user: ${old.id}: ${old.firstName} ${old.lastName}`);
        }
    } catch (errors) {
        sendErrorResponse(req, res, 400, `Invalid user data: ${errors}`, errors);
    }
});





module.exports = router // default export 
