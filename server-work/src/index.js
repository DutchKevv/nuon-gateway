const fs = require('fs');
const path = require('path');
const request = require('requestretry');
const io = require('socket.io-client');
const HttpProxyAgent = require('http-proxy-agent');

const URL_DU1 = 'https://brandsmak:Halo33221!@sapdu1.corp.vattenfall.com';
const URL_PROXY = 'http://afn47:Halo33221!!@proxy-nl.corp.vattenfall.com:8080';
const URL_GATEWAY = 'http://136.144.181.63:5111';

// needed to get valid CSRF tokens from SAP (hack)
let cookies = '';

const socket = io(URL_GATEWAY, {
  secure: false,
  rejectUnauthorized: true,
  reconnect: true,
  agent: new HttpProxyAgent(URL_PROXY),
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
  const method = data.method.toLowerCase();
  let body = data.body;

  try {
    body = JSON.stringify(data.body || {});
  } catch (error) {
    console.error(error);
  }

  const options = {
    method,
    body,
    query: data.query,
    // url: 'http://google.nl',
    url: URL_DU1 + data.url,
    ca: fs.readFileSync(path.join(__dirname, '../certs/ca.cert.pem')),
    maxAttempts: 3,
    strictSSL: false,
    headers: {
      ...data.headers,
      Cookie: cookies
    },
  };

  delete options.headers['accept-encoding'];

  request(options, function (err, response) {
    if (err) {
      return cb(err);
    }

    // store SAP session cookies
    if (response.headers['set-cookie'] || response.headers['Set-Cookie']) {
      cookies = response.headers['set-cookie'] ? response.headers['set-cookie'] : response.headers['Set-Cookie'];
    }

    cb(response);
  });
});
