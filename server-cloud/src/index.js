const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const morgan = require('morgan');
const bodyParser = require('body-parser');

const PORT = 5000;

const sockets = {
    work: null,
    clients: []
};

server.listen(PORT);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/sap/opu/odata/sap/Z_CRM_B2B_APP_SRV/*', function (req, res) {
    console.log('SAP!');

    if (!sockets.work) {
        console.warn('work socket not found');
        return res.status('404');
    }

    console.log(req.method, req);

    sockets.work.emit('get:api', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query
    }, (error, result) => {

        if (!error) {
            return res.send(result);
        }

        res.status(error.statusCode || 500).send(error.body);
    });
});

io.on('connection', (socket) => {
    console.log('connection!');

    socket.on('post:init', (data) => {
        socket.data = data;

        if (data.type === 'work') {
            sockets.work = socket;
        } else {
            sockets.clients.push(socket);
        }
    });

    socket.on('disconnect', () => {
        console.log('diconnect');

        if (socket.type === 'work') {
            sockets.work = null;
        } else {
            sockets.clients = sockets.clients.filter((client => client === socket));
        }
    });
});