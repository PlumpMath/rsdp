var rsdp = require('../lib/rsdp.js');

// create server

rsdp.createServer(function (connection) {
    connection.on('message', function (message) {
        console.log('Server received: type: ' + message.type + ', data: ' + message.data.toString('utf8'));
        connection.sendMessage({ type: 1, data: new Buffer('PONG at ' + new Date())});
    });
}).listen('\\\\.\\pipe\\rsdp');

// create client

var socket = rsdp.connect('\\\\.\\pipe\\rsdp');
socket.on('message', function (message) {
    console.log('Client received: type: ' + message.type + ', data:' + message.data.toString('utf8'));
});

// send message from client to server every 1 second

setInterval(function () {
    socket.sendMessage({ type: 2, data: new Buffer('PING at ' + new Date())});
}, 1000);
