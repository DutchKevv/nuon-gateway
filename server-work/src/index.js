// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
const fs = require('fs');
const path = require('path');
const request = require('requestretry');
const io = require('socket.io-client');
const HttpProxyAgent = require('http-proxy-agent');

const URL_DU1 = 'https://brandsmak:Halo33221!@sapdu1.corp.vattenfall.com';
const URL_PROXY = 'http://afn47:Halo33221!!!@proxy-nl.corp.vattenfall.com:8080';
const URL_GATEWAY = 'http://136.144.181.63:5111';
const URL_NUON_LOCAL = '10.208.0.10';

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
  console.log('got', data.url);

  const method = data.method;
  let body = data.body;
  let url = data.url;

  // console.log(data);

  try {
    try {
      body = JSON.stringify(data.body || {});
    } catch (error) {
      console.error(error);
    }
  
    if (!data.url.startsWith('http')) {
      url = URL_DU1 + data.url;
    }

    console.log(url);

    const options = {
      // proxy: URL_PROXY,
      timeout: 10000,
      method,
      // method: 'PROPFIND',
      body: body,
      // json: true,
      query: data.query,
      url,
      maxAttempts: 1,
      pool: {
        maxSocket: 200
      },
      strictSSL: false,
      headers: {
        ...data.headers,
        Cookie: cookies,
        // 'Accept-Encoding': 'gzip'
      },
      gzip: true
    };

    

    // if (Buffer.isBuffer(body)) {
    //   options.body = body.toString();
    //   // console.log(options.body)
    // }

    // if (body && Object.keys(body).length) {
    //   options.body = body;
    // }

    if (data.headers && data.headers.allow && data.headers.allow.includes('PROPFIND')) {
      // options.method = 'PROPFIND';
    }


    if (Buffer.isBuffer(body) || url.endsWith('.jar')) {
      // options.encoding = null;
      // options.decoding = false;
    }

    delete options.headers['accept-encoding'];

    // options.url = options.url.replace('subversion.nuon.local', 'afn47:Nuon88%23@subversion.nuon.local');
    // options.url = options.url.replace('151.156.236.19', 'afn47:Nuon88%23@151.156.236.19');

    request(options, function (err, response, body) {
      // console.log('done!', response);
      // console.log(err, response);


      if (err) {
        console.error(err);
        return;
      }

          // store SAP session cookies
      if (response.headers['set-cookie'] || response.headers['Set-Cookie']) {
        cookies = response.headers['set-cookie'] ? response.headers['set-cookie'] : response.headers['Set-Cookie'];
      }

      // console.log('asdfasdf',  response);
      // console.log(body);
      cb({
        headers: response.headers,
        statusCode: response.statusCode,
        body: response.body
      });
      // cb(response)
    });
  } catch (error) {
    console.log(error);
  } 
});

// request({url: 'http://afn47:Nuon88%23@151.156.236.19/svn/lmintegratie/Open_Integratie_Platform/Portal/Nuts/trunk', timeout: 2000}, function (err, response, body) {
//   // console.log('done!', response);
//   console.log(err, body);

//   if (err) {
//     console.error(err);
//     return;
//   }
// });
