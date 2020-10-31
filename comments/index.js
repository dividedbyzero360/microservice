const { randomBytes } = require('crypto');
const bodyParser = require('body-parser');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const commentsByPostID = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostID[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
    const commentID = randomBytes(4).toString('hex');
    const { content } = req.body;
    const comments = commentsByPostID[req.params.id] || [];
    comments.push({ id: commentID, content, status: 'pending' });
    commentsByPostID[req.params.id] = comments;
    await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentID,
            content,
            postId: req.params.id,
            status: 'pending',
        },
    });
    res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
    const { type, data } = req.body;
    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;
        const comments = commentsByPostID[postId];

        const comment = comments.find((comment) => {
            return comment.id === id;
        });
        comment.status = status;
        await axios.post('http://event-bus-srv:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                content,
                postId,
                status,
            },
        });
    }
    res.send({});
});

app.listen(4001, () => {
    console.log('comment service started on port 4001');
});
