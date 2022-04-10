const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const logger = require('morgan');
const MongoClient = require('mongodb').MongoClient;
const authRouter = require('./routes/auth-router');
const usersRouter = require('./routes/users-router');
const booksRouter = require('./routes/books-router');
const ordersRouter = require('./routes/order-route');
const sendErrorResponse = require('./utils/utils').sendErrorResponse;


const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'book_store';

const HOST = '127.0.0.1';
const PORT = 5000;

const app = express();
const server = http.createServer(app);


const corsOpts = {
    origin: 'http://localhost:3000'
}

// apply express middleware
app.use(cors(corsOpts))
app.use(logger('dev'));
app.use(express.json({ limit: '20mb' }))

// add feature routers
app.use(authRouter);
app.use('/api/users', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/orders', ordersRouter);

// add static resources
app.use(express.static(path.join(__dirname, '../public')));


// add index.html -> app only
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
})

// Connect to MongoDB and start server
// Create a new MongoClient
const client = new MongoClient(mongoUrl);
async function run() {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    const db = await client.db(dbName);
    db.command({ ping: 1 });
    console.log("Connected successfully to MongoDB server");
    return db;
}
run().then(db => {
    app.set('db', db);
    server.listen(PORT, HOST, () => {
        console.log(`HTTP Server running on http://${HOST}:${PORT}/`);
    });
}).catch(console.dir);

// handle server starting errors
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(port, host);
        }, 5000);
    } else {
        console.log('Error starting server:', err);
    }
});

server.on('close', async () => {
    // Ensures that the client will close when you finish/error
    await client.close();
})
