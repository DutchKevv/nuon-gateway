const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io-client');
const morgan = require('morgan');
const config = require('../../config');
const rq = require('requestretry');

const socket = io(`${config.server.cloud.protocol}${config.server.cloud.host}:${config.server.cloud.port}`);

socket.on('connect', () => {
    console.log('connect!')
});

socket.on('get:api', (data, cb) => {
    // const methodArr = [{GET: 'get', POST: 'post'}]

    rq.get('https://sapdu1.corp.vattenfall.com' + data.url, {
        // method: data.method,
        body: data.body,
        headers: data.headers,
        maxAttempts: 1,
        json: true,
        qs: data.query
    }, (err, result) => {
        cb(err, result);
    });
});

socket.emit('post:init', { type: 'work' })