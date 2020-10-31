const { randomBytes } = require('crypto');
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const posts = {
    '1093bb80': {
        id: '1093bb80',
        title: 'first post',
    },
};

app.get('/posts', (req, res) => {
    res.send(posts);
});

app.post('/posts/create', async (req, res) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;
    posts[id] = {
        id,
        title,
    };
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'PostCreated',
        data: posts[id],
    });
    res.status(201).send(posts[id]);
});

app.post('/events', (req, res) => {
    console.log('Received Event', req.body.type);
    res.send({});
});

app.listen(4000, () => {
    console.log('Test V2');
    console.log('post service started on port 4000');
});
