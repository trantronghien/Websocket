// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
var jwt = require('jsonwebtoken');

var StringUtil = require('./StringUtils');

// load file env
require('dotenv').config();

/**
 * HTTP server
 * HANDSHAKE: bắt tay đầu tiền dùng http connection bt
 * request - responece
 */
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200);
    response.end();
});

var wsServer = new webSocketServer({
    httpServer: server,
    // verify: function (info, cb) {
    //     var token = info.req.headers.token
    //     if (!token)
    //         cb(false, 401, 'Unauthorized')
    //     else {
    //         jwt.verify(token, 'secret-key', function (err, decoded) {
    //             if (err) {
    //                 cb(false, 401, 'Unauthorized')
    //             } else {
    //                 info.req.user = decoded //[1]
    //                 cb(true)
    //             }
    //         })
    //
    //     }
    // }
});

wsServer.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4();
};

var clients = [];
var chanel = 'echo-protocol';


var dataSend = '';
var connecttemp;

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('connect', function (connection) {
    connection.id = wsServer.getUniqueID();
    clients.push(connection);
    console.log("start connect: " + connection.remoteAddress);
    console.log("start id client: " + connection.id);
    console.log("number client connect: " + clients.length);

});

function sendToClientData(dataSend, idClientSend) {
    // send for all client connected
    clients.forEach(function each(client) {
        if (idClientSend !== client.id){
            client.sendUTF(dataSend);
            console.log("server send to: " + client.id);
        }
    });
}

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {  // check origin and reject
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    // 'echo-protocol'
    try {
        var connection = request.accept(null, request.origin);

        console.table(request.httpRequest.headers);
        // user sent some message
        // console.log(connection);
        connection.on('message', function (message) {
            console.log("client: " + this.id + "\tmessage: " + message.utf8Data);
            const clientIdSend = this.id;
            if (message.type === 'utf8') { // accept only text
                dataSend = message.utf8Data;
                if (!StringUtil.isJSON(message.utf8Data)) {
                    sendToClientData(dataSend ,clientIdSend)
                    console.log("send text normal data");
                } else {
                    console.log("send json data");
                    var data = JSON.parse(dataSend);
                    if (data.name === 'client-node') {
                        sendToClientData(dataSend , clientIdSend)
                    } else {
                        sendToClientData(dataSend, clientIdSend)
                    }
                }
            } else if (message.type === 'binary') {
                // send data
                clients.forEach(function each(client) {

                    client.sendBytes(message.binaryData);
                });
                console.log("send binary data");
            }
        });

        connection.on('error', function (error) {
            console.log(" error with connection. " + error.message);
        });

        // user disconnected
        connection.on('close', function (connection) {
            removeClient(clients,  this.id);
            console.log("client disconnected. " + this.id);
            console.log("number client connect: " + clients.length);
        });
    } catch (e) {
        console.log(e.message);
    }
});

function removeClient(arr, idClient) {
    arr.splice(arr.findIndex(e => e.id === idClient ),1);
}

var PORT = process.env.PORT || 3000;

server.listen(PORT, function () {
    console.log(" Server is listening on port " + PORT);
});
/**
 * WebSocket server
 */