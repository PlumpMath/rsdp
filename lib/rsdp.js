var net = require('net')
    , util = require('util');

function addRsdpFraming(socket) {
    socket.on('data', function (data) {
        socket._rsdpdata = socket._rsdpdata ? Buffer.concat([socket._rsdpdata, data]) : data;
        parseRsdpData(socket);
    });

    socket.sendMessage = function (message) {
        if (typeof message !== 'object' || typeof message.type !== 'number' ||
            !Buffer.isBuffer(message.data) || message.data.length > 65536) {
            throw new Error('Invalid RSDP message');
        }

        var header = new Buffer([
            message.type >> 8,
            message.type % 256,
            message.data.length >> 8,
            message.data.length % 256
        ]);

        socket.write(header);
        socket.write(message.data);
    }
}

function parseRsdpData(socket) {
    if (4 > socket._rsdpdata.length)
        return;

    var length = (socket._rsdpdata[2] << 8) + socket._rsdpdata[3]; 
    var message = {
        type: (socket._rsdpdata[0] << 8) + socket._rsdpdata[1]
    };

    if (length > 0 && (length + 4) > socket._rsdpdata.length)
        return;

    message.data = socket._rsdpdata.slice(4, length + 4);

    if ((length + 4) < socket._rsdpdata.length) {
        socket._rsdpdata = socket._rsdpdata.slice(length + 4);
    }
    else {
        delete socket._rsdpdata;
    }

    socket.emit('message', message);
}

exports.createServer = function (options) {
    var server = options;
    if (typeof server !== 'object' || typeof server.on !== 'function') {
        server = net.createServer(options);
    }

    server.on('connection', function (socket) {
        addRsdpFraming(socket);
    });

    return server;
};

exports.connect = function (options) {
    var socket = options;
    if (typeof socket !== 'object' || typeof socket.on !== 'function') {
        socket = net.connect.apply(this, arguments);
    }

    addRsdpFraming(socket);

    return socket;
};
