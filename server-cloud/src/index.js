const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const PORT = 5111;

const sockets = {
    work: null,
    clients: []
};

server.listen(PORT);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.all('/sap/opu/odata/sap/z_crm_b2b_app_srv/*', function (req, res) {
    console.log('SAP!', req.cookies);

    if (!sockets.work) {
        console.warn('work socket not found');
        return res.status('404');
    }

    sockets.work.emit('get:api', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        cookies: req.cookies
    }, (result) => {
        if (result.headers['x-csrf-token'] && result.headers['x-csrf-token'] !== 'Fetch')
            return res.set('x-csrf-token', result.headers['x-csrf-token']).status(result.statusCode).send(result.body);

        res.status(result.statusCode || 502).send(result.body);
    });
});

// middleware
io.use((socket, next) => {
    socket.data = socket.handshake.query;
    return next();
});

io.on('connection', (socket) => {
    console.log('connection!');

    if (socket.data.type === 'work') {
        sockets.work = socket;
    } else {
        sockets.clients.push(socket);
    }

    socket.on('disconnect', () => {
        console.log('diconnect');

        if (socket.type === 'work') {
            sockets.work = null;
        } else {
            sockets.clients = sockets.clients.filter((client => client === socket));
        }
    });
});