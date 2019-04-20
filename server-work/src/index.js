// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
const fs = require('fs');
const path = require('path');
const request = require('requestretry');
const io = require('socket.io-client');
const HttpProxyAgent = require('http-proxy-agent');

const URL_DU1 = 'https://brandsmak:Halo33221!@sapdu1.corp.vattenfall.com';
const URL_PROXY = 'http://afn47:Halo33221!@proxy-nl.corp.vattenfall.com:8080';
const URL_GATEWAY = 'http://136.144.181.63:5111';

// needed to get valid CSRF tokens from SAP (hack)
let cookies = '';

const socket = io(URL_GATEWAY, {
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
  const method = data.method.toLowerCase();

  const options = {
    method,
    body: method === 'post'|| method === 'put' ? JSON.stringify(data.body || {}) : undefined,
    query: data.query,
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

  request(options, function (err, response, body) {
    // store SAP session cookies
    if (response.headers['set-cookie']) {
      cookies = response.headers['set-cookie'];
    }

    if (err) {
      console.error(err);
    }

    cb(response);
  });
});