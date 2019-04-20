// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const request = require('request');
const io = require('socket.io-client');
const HttpProxyAgent = require('http-proxy-agent');

const port = 3000;

const URL_DU1 = 'https://brandsmak:Halo33221!@sapdu1.corp.vattenfall.com';
const URL_PROXY = 'http://afn47:Halo33221!@proxy-nl.corp.vattenfall.com:8080';

// const r = request.defaults({ 'proxy': 'http://afn47:Halo33221!@proxy-nl.corp.vattenfall.com:8080' });

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const socket = io('http://136.144.181.63:5000', {
  secure: false,
  rejectUnauthorized: true,
  reconnect: true,
  agent:  new HttpProxyAgent(URL_PROXY),
  query: {
    type: 'work'
  }
});

socket.on('connect', () => {
  console.log('connect!');

  socket.emit('post:init', { type: 'work' })
});

socket.on('connect_error', (error) => {
  console.error('connection error:', error);
});

socket.on('get:api', (data, cb) => {
  console.log('\nforwading:', URL_DU1 + data.url, 'with headers: ', data.headers, '\n\n');

  request({
    method: data.method.toLowerCase(),
    json: true,
    // rejectUnauthorized: false,
    query: data.query,
    url: URL_DU1 + data.url,
    ca: fs.readFileSync(path.join(__dirname, '../certs/ca.cert.pem')),
    maxAttempts: 1,   // (default) try 5 times
    strictSSL: false,
    // headers: data.headers,
    // fullResponse: true
  }, function (err, response, body) {
    console.log(response.statusCode );

    if (err) {
      console.error(err);
      return cb(response);
    }

    if (typeof body === 'string') {
      fs.writeFileSync(path.join(__dirname, '../log.txt'), (body || '').toString());
    }
    else if (typeof body === 'object') {
      fs.writeFileSync(path.join(__dirname, '../log.txt'), JSON.stringify(body, null, 2));
    }

    cb(response);
  });

  // if (method === 'get' || method === 'delete') {
  //   httpClient[data.method.toLowerCase()](data.url, options).subscribe(cb, cb);
  // } else {
  //   httpClient[data.method.toLowerCase()](data.url, data.body, options).subscribe(cb, cb);
  // }
});