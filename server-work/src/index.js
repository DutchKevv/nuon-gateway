'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io-client');
const morgan = require('morgan');
const config = require('../../config');
const rq = require('requestretry');
const HttpsProxyAgent = require('https-proxy-agent');

const socket = io(config.server.cloud.url, {
    query: {
        type: 'work'
    },
    secure: false,
    agent: new HttpsProxyAgent(config.server.proxy.url),
    transports: ['polling']
});

socket.on('connect', () => {
    console.log('connect!');

    socket.emit('post:init', { type: 'work' })
});

socket.on('connect_error', (error) => {
    console.error('connection error:', error);
});

socket.on('get:api', (data, cb) => {
    console.log('forwading:', data.url);

    rq.get(config.server.du.url + data.url, {
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


// rq.get('http://www.google.nl', {maxAttempts: 1, timeout: 10000}, function() {
//     console.log(arguments)
// })