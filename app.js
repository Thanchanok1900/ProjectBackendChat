const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// บรรทัดที่ 1: กำหนดตัวแปรสำหรับ router ของเพื่อน
const friendRouter = require('./friends/friend.controller');

// บรรทัดที่ 2: กำหนดตัวแปรสำหรับ Sequelize
const { sequelize } = require('./friends/friend.model');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Chat Application Backend!' });
});

app.use('/api/friends', friendRouter);

const PORT = process.env.PORT || 3000;

sequelize.sync()
    .then(() => {
        console.log('Synced db.');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch((err) => {
        console.log('Failed to sync db: ' + err.message);
    });