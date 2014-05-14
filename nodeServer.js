//Set up for communication with the webpage over http
var http = require('http');
var server = http.createServer(function(request) {});

//Set up for communication with our matlab server
var net = require('net');

var socketToMatlab = net.createConnection('55000', '18.189.78.49', function() {
    console.log('Connected!');
});

//Set up MAVLink module to allow communication with UAVs
var mavlink = require('mavlink');
var SerialPort = require('serialport').SerialPort;

//var serialPort = new SerialPort("/dev/tty.usbmodemfd121", {baudrate: 115200});

var mav = new mavlink(1,1);

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  var ip = add;
});


//Waypoint sample. Actual processing will be similar. Retrieved from MATLAB and stored
// in a global var
var sampleWaypointMsg = "32.19643 -71.94730 32.9846 -72.11100 54.22009 -71.978900";
var waypointArray = sampleWaypointMsg.split(" ");
var points = {}
for (var i = 0; i < (waypointArray.length)*5 ; i ++) {
    points[i/2] = [waypointArray[i], waypointArray[i+1]];
    i++;
}
var numPoints = waypointArray.length/2;

//State machine for message sending. Runs through all the actions required
// for each waypoint
function messageSenderSM() {

    this.sendMessage = sendMessage;
    this.initialize = initialize;

    function sendMessage() {
        if (this.curnt == -1) {
            createWaypointMessage(this.seq, 22, 0, 0, 0, 0, 5);
            this.curnt++;
        }
        else {
            switch(this.msgType) {
                case 5:
                    this.msgType = 0;
                    this.curnt++
                case 0:
                    createWaypointMessage(this.seq, 16, 0, 0, points[this.curnt][0], points[this.curnt][1], 5);
                    break;
                case 1:
                    createWaypointMessage(this.seq, 16, 0, 0, points[this.curnt][0], points[this.curnt][1], 1);
                    break;
                case 2:
                    createWaypointMessage(this.seq, 183, 1, 1250, 0, 0, 0);
                    break;
                case 3:
                    createWaypointMessage(this.seq, 19, 5, 0, points[this.curnt][0], points[this.curnt][1], 1);
                    break;
                case 4:
                    createWaypointMessage(this.seq, 16, 0, 0, points[this.curnt][0], points[this.curnt][1], 5);
                    break;
            }
            this.msgType++;
        }
        this.seq++;
    }

    function initialize() {
        this.curnt = -1; //Current waypoint. -1 => takeoff
        this.msgType = 0; // Which type of action needs to be taken 
        this.seq = 0; // Current sequence number in flight plan
    };
};

var messageSender = new messageSenderSM();

//Actions to take on receipt of specific messages. Basically logging for all
// but MISSION_REQUEST

mav.on("ready", function() {
    //parse incoming serial data
   // serialPort.on('data', function(data) {
     //   mav.parse(data);
    //});

    //listen for messages
    mav.on('message', function(message) {
        console.log(message);
    });
});

mav.on("MISSION_ITEM", function(message, fields) {
    console.log(fields);
});

mav.on("MISSION_ACK", function(message, fields) {
    console.log(fields);
});

mav.on("messageReceived", function(msg) {
    console.log("Valid packet received from " + msg.sysid + ": " + msg.compid);
    console.log("Contents: " + msg.buffer);
});

mav.on("MISSION_REQUEST", function(message, fields) {
    console.log("GOT MISSION REQUEST \n \n \n ");
    messageSender.sendMessage();
    //createWaypointMessage(fields.seq);
});

mav.on("STATUSTEXT", function(message, fields) {
    console.log(fields);
});

//Functions we use to send various messages. Called by routes defined below, 
// or the listeners above

function createClearAllMessage() {
    mav.createMessage("MISSION_CLEAR_ALL", {
        'target_system'     :1,
        'target_component'  :1
    }, function(msg) {
     //   serialPort.write(msg.buffer);
        console.log("SENT CLEAR ALL MESSAGE \n \n \n");
    });
};

function createMissionCountMessage() {
    mav.createMessage("MISSION_COUNT", {
        'target_system'     :1,
        'target_component'  :1,
        'count'             :(numPoints*5)+1,
    }, function(msg) {
     //   serialPort.write(msg.buffer);
        console.log("WROTE MISSION COUNT TO SPORT \n \n \n");
    });
};

function createWaypointMessage(sequence, cmd, param1, param2, x, y, z) {
        mav.createMessage("MISSION_ITEM", {
        'target_system'     : 1,
        'target_component'  : 1,
        'seq'               : sequence,
        'frame'             : 3,
        'command'           : cmd,
        'current'           : 0,
        'autocontinue'      : 1,
        'param1'            : param1,
        'param2'            : param2,
        'param3'            : 0,
        'param4'            : 0,
        'x'                 : x,
        'y'                 : y,
        'z'                 : z
    }, function(msg) {
      //  serialPort.write(msg.buffer);
        console.log("DID WRITE WP MSG TO SERIAL PORT \n \n \n");
    });
};

function requestList() {
    mav.createMessage("MISSION_REQUEST_LIST", {
        'target_system'     :1,
        'target_component'  :1
    }, function(msg) {
    //    serialPort.write(msg.buffer);
        console.log("WRITING MISSION REQUESTLIST: " + msg.buffer);
    });
};

function requestWaypoint(wpId) {
    mav.createMessage("MISSION_REQUEST", {
        'target_system'     :1,
        'target_component'  :1,
        'seq'               :wpId
    }, function(msg) {
     //   serialPort.write(msg.buffer);
        console.log("SENT REQUEST FOR WP " + wpId+ "\n \n \n");
    });
};

//Set up expressjs to serve the webpage
var express = require("express");
var app = express();

 app.configure(function() {
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.static('images'));
    app.use(express.static('stylesheets'));
    return app.use(app.router);
  });

require('./routes.js')(app); //Load webpage routes

//Some GET actions for easy testing/debugging
app.get("/getMission", function(req, res) {
    for (var i = 0; i < numPoints; i++){
        requestWaypoint(i);
    };  
    res.end();
});

app.get("/clearAll", function(req, res) {
    createClearAllMessage();
    res.end();
});

app.get("/sendMissionCount", function(req, res) {
    messageSender.initialize();
    createMissionCountMessage();
    res.end();
}); 

//Start listening for connections from the web
server.listen(1234, function() {
    console.log((new Date()) + ' Server is listening on port 1234');
});

app.listen(process.env.PORT || 3000)

console.log("Express started on " + process.env.PORT);
//Initialize WebSocketServer to accept connections from js client-side
var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

//Keep track of connected clients
var count  = 0;
var clients = {};

//Accept new client connections
wsServer.on('request', function(request){
    console.log('got a request');
    var connection = request.accept('echo-protocol', request.origin);
    
    var id = count++;
    clients[id] = connection;
    connection.id = id;
    console.log((new Date()) + ' Connection accepted [' + id + ']');
    
    //Handle client input data
    connection.on('message', function(message) {
        var msgString = message.utf8Data;
        console.log('received message: %s', msgString);
        console.log('Client ID is %s', connection.id);
        socketToMatlab.write(msgString + " " + connection.id);
    });

    connection.on('close', function(reasonCode, description) {
        delete clients[id];
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});
var completeData = '';
//On receipt of result from server, send that message back to our clients
socketToMatlab.on('data', function(result) {
    console.log("ONE CHUNK INC \n \n");
    completeData += String(result);
    console.log(completeData);
    if (completeData.match(']')) {
        sendCompleteData();
    };
});

function sendCompleteData() {
    console.log(completeData.length);
    console.log('Received message: ' + completeData);
    completeData = String(completeData);
    //Format result string for parsing
    completeData = completeData.replace('[', "").replace(']', "").replace(/;/g," "); 
    resultAsArray = completeData.split(" ");
    var recipient = resultAsArray.pop();
    console.log("recipient is " + recipient);
    console.log(clients) //Pick off id of user this result belongs to
    resultToSend = resultAsArray.join(" ");
    console.log(resultToSend);
    clients[recipient].sendUTF(resultToSend);
    // formatWaypointMsg(resultToSend);
    completeData = '';
    console.log('Waypoints relayed successfully');
};

function handleMessage(msg) {
    if (msg == 'launch') {
        console.log('heyo');
    }
};