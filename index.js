// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
// load file env
require('dotenv').config();

/**
 * HTTP server
 * HANDSHAKE: bắt tay đầu tiền dùng http connection bt 
 * request - responece 
 */
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200);
    response.end();
});
var PORT = process.env.PORT || 3000;

server.listen( PORT , function() {
  console.log(" Server is listening on port "+ PORT);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  httpServer: server
});

wsServer.getUniqueID = function () {
  function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4();
};

var clients = [];

wsServer.on('connect', function(connection) {
  connection.id = wsServer.getUniqueID();
  clients.push(connection);
  console.log("start connect: " + connection.remoteAddress);
  console.log("start id client: " + connection.id);
  
});
var dataSend = '';
var connecttemp;
wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin); 
  

  console.log(' Connection accepted. ' + request.requestedProtocols);
  // user sent some message
  connection.on('message', function(message) {
    console.log("client: " + message.utf8Data);
    if (message.type === 'utf8') { // accept only text
      var data = JSON.parse(message.utf8Data);
      if(data.name === 'client-node'){
        // notting
        dataSend = message.utf8Data;
        connection.sendUTF(dataSend); 
      }else{
        connecttemp = connection;
        connection.sendUTF(dataSend);    
      }
      // send for all client connected
      clients.forEach(function each(client) {
        if(client.id !== connection.id){
          client.sendUTF(dataSend);
        }
      });
      
    } else if (message.type === 'binary') { 
      // send data 
        //  connection.sendBytes(message.binaryData);
    }
  });

  connection.on('error', function (error) {
    console.log(" error with connection. " + error.message);
  });

  // user disconnected
  connection.on('close', function(connection) {
    var disconnectClient = removeClient(clients, connection);
    console.log(" disconnected. " + disconnectClient.id);
  });
});

function removeClient(arr, value) {

  return arr.filter(function(ele){
      return ele.id === value.id;
  });

}