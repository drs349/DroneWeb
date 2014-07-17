var host = "192.168.1.174";
var shape;
var points;
var map;
var markerArray = new Array();
var circleArray = new Array();
var uavArray = new Array();
var dummyCoords = new Array();
var armReady = false;
var launchReady = true;
// var ws = new WebSocket('ws://' + host + ':1234', 'echo-protocol');
var host = location.origin.replace(/^http/, 'ws');
console.log(host, 'echo-protocol');
var ws = new WebSocket(host, 'echo-protocol');
var msg;
ws.addEventListener("message", function(e) {
    msg = e.data;
    console.log(msg);
});
// msg = "42.358730 -71.091906 42.358835 -71.091662 42.358730 -71.091731";


//Initializes the map with the option of creating a draggable polygon
function initialize(){
    var url = window.location.href;
    var qstring = url.split('?');
    var qs = qstring[1].split('&');
    var allq = new Array();
    for (var i=0; i<qs.length; i++)
    {
        allq[i] = qs[i].split('=');
    }
    var lat = allq[0][1];
    var lng = allq[1][1];
    var rad = allq[2][1];
    var zvalue = 19;
    
    //setting up the actual map
    var mapOptions = {
        center: new google.maps.LatLng(lat, lng),
        zoom: zvalue,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
        shape = new google.maps.Polygon
        ({
            strokeColor: '#ff0000',
            strokeOpacity: 0.8,
            strokeWeight: 10,
            fillColor: '#ff0000',
            fillOpacity: 0.35,
            editable:true,
            draggable:false,  
        });  
    shape.setMap(map);
    google.maps.event.addListener(map, 'click', addPoint);
    google.maps.event.addListener(shape, 'dblclick', removePoint);
    google.maps.event.addListener(shape, 'mousedown', function (event) {
    if (event.vertex || event.path || event.edge) {
     
        map.setOptions({draggable: false});
    }
    });
    google.maps.event.addListener(shape.getPath(),'mousedown',function(){map.setOptions({draggable:false});})
    google.maps.event.addListener(shape.getPath(),'set_at', function(){map.setOptions({draggable: true});});
    google.maps.event.addListener(shape.getPath(),'insert_at', function(){map.setOptions({draggable: true});});

   if (isTouchSupported())
   {
    map.setOptions({panControl:true});
   }
 
   
     
   //Creates the back button
    var backButton = document.createElement('DIV');
    backButton.className = 'backButton';
    backButton.innerHTML = '< Go Back';
    backButton.index = 1;
    google.maps.event.addDomListener(backButton, 'click', function() {
        window.location = 'inputs.html' +'?' + qstring[1];
    });
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(backButton); 
    
//Styling the various dialogs
    var height = document.body.clientHeight;
    var width = document.body.clientWidth; 
//Styles the drop points dialog popup    
    $( '.pointsDialog' ).dialog({
        autoOpen:false,
        closeText:"x",
        close: function(event,ui){
          $('.polyCommands').dialog("open");
        },
        
       draggable:false,
       clickable:false,
       height:400,
       width:300,
        position:{my: "right center", at:"right bottom", of:$('#map-canvas')},
       dialogClass: "ui-points",
       show:{effect:'fade', duration: 350},
       hide:{effect:'fade',duration:350}  
    });
    
//styles the UAV status popup  
   $( '.uavDialog').dialog({
       autoOpen:false,
       closeText:"x",
       close: function(event,ui){
            $('.polyCommands').dialog("open");
       },
       buttons:
       [{    
           text:"Launch UAVs",
           click:function()
           {   k=0;            
               setInterval(function(){ mark(k); moveUAV(k);k++;}, 100);
              
               $('.uavDialog').dialog('close');
           },
           class:"ui-button-3"
       }],
       draggable:true,
       resizable:true,
       height:70,
       width:700,
       dialogClass:"ui-uav",
       show:{effect:'fade', duration: 350},
       hide:{effect:'fade',duration:350},
       position:{ my: "center bottom", at: "center bottom", of:document} 
    });

//Styles the dialog that displays the animation for solving for drop points    
    $('.solvDialog').dialog({
        autoOpen:false,
        closeText:'',
        draggable:false,
        clickable:false,
        height:400,
        width:400,
        dialogClass:"ui-solv",
        show:{effect:'fade', duration: 450},
        hide:{effect:'fade',duration:350},     
    });
    
//Styles the initial instructions popup text
     $( '.initInfo').dialog({
        autoOpen:true,
        dialogClass:"ui-init",
        closeText:"",
        draggable:true,
        resizable:false,
        height:100,
        width:700,
        position:[((width/2) - 350), -550],
        show:{effect:'fade', duration: 350},
        hide:{effect:'fade',duration:350}    
    });
   
//styles the two buttons popup stuff
    $('.polyCommands').dialog({
        autoOpen:false,
        buttons:[
        {
          
           text:"Solve Drop Points",
           click:function()
           {
             //solve for drop points
               solvePoints();       
           },
           class:"ui-button-4"
        },
        {
          
           text:"View Bound Points",
           click:function()
           {    
               $('.polyCommands').dialog("close");
               getPoints();
                markDropPoints();
           },
           class:"ui-button-5"                                   
        }],
        dialogClass:"ui-poly",
        closeText:"",
        draggable:true,
        resizable:false,
        height:70,
        width:800,
        position:{ my: "center bottom", at: "center bottom", of: $("#map-canvas")},
        show:{effect:'fade', duration: 350},
        hide:{effect:'fade',duration:200},
       
    });    
   
    createDummyCoords();
   
}


function isTouchSupported() {
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
    var generalTouchEnabled = "ontouchstart" in document.createElement("div");
 
    if (msTouchEnabled || generalTouchEnabled) {
        return true;
    }
    return false;
}
//Solves for drop points 
//Sends the boundary points to the server
function sendPoints(){
   
    var vertices = shape.getPath();
    var verticesArray = vertices.getArray();
    var verticesString = '';
    for (var i = 0; i<verticesArray.length; i++)
    {
        var lat = Math.round(verticesArray[i].lat()*10000)/10000;
        var long = Math.round(verticesArray[i].lng()*10000)/10000;
        verticesString += lat.toString() + " " + long.toString() + " ";
    }       
    //ws.send(verticesString);
    $.ajax({
      url: location.origin + "/tryJson",
      type: 'POST',
      dataType: "text/plain",
     // jsonpCallback: "jsonSuccess",
      contentType: "text/plain",
      data: verticesString,
      cache: false,
      timeout: 5000,
      success: function(data, textStatus, jqXHR) {
        console.log("got a success");
        console.log(data);
        console.log(textStatus);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          alert('error ' + textStatus + " " + errorThrown);
      }
  });  
}

function jsonSuccess(data) {
  console.log("there was a jsonSucces");
  console.log(data);
}
//what happens when you click the solve for drop points button
function solvePoints(){
    //make it impossible to edit the polygon anymore
    shape.setEditable(false);
    shape.setDraggable(false);
    shape.setOptions({clickable:false});
    google.maps.event.clearListeners(map, 'click');
    $(".polyCommands").dialog("close");
    
    sendPoints();
    
    //once it finishes solving, new buttons popup
   setTimeout(function(){ $(".polyCommands").dialog
    ({
        autoOpen:false, 
        buttons: [{
            text:"View UAV Status",
            click:function(){
                $('.polyCommands').dialog("close");
                setTimeout(function(){
                $(".uavDialog").dialog("open");
                },500);
                if (armReady)
                {   
                }
                else if (launchReady)
                { 
                    $('.uavDialog').html("<div class = \"polyInner\" > Ready to </div>");
                    $( '.uavDialog').dialog({
                        buttons:
                        [{
                          //stuff here that sends to the server when you want to launch the UAVs
                            text:"Launch UAVs",
                            click:function()
                            {  // k=0;
                                //setInterval(function(){ mark(k); moveUAV(k);k++;}, 100);

                                ws.send("launch");
                                $('.uavDialog').dialog('close');
                            },
                            class:"ui-button-3"
                        }],
                    });
                }
             },
            class:"ui-button-6"
         },          
         {
            text:"View Drop Points",
            click:function(){
               getDropPoints();
               $('.polyCommands').dialog("close");
            },
            class:"ui-button-7"
        }
    ]});},200);
    setTimeout(function(){ $(".polyCommands").dialog("open");}, 200);
    var  u = 0;
    setInterval(function(){ 
      if (u < 14)
        {
          markDropPoints(); 
          u++;
        }}, 1000);
    //initUAV();    
}

//populates dialog with drop points
function getDropPoints(){
    if (typeof msg === 'undefined')
     { 
       setTimeout(function(){$(".pointsDialog").dialog("open");},300);
      $(".pointsDialog").html("<div class = \"innerPointsDialog\">" + "<h2>&nbsp;Drop Points</h2> " + "Drop Points not retrieved" + "</div>");
     }
     else
     {
      themsg = msg.toString();  
      msgparts = themsg.split(" ");
      msgstring = "";
    for (var i = 0; i <msgparts.length;i+=2)
    {
        var lat = Math.round(msgparts[i]*10000)/10000;
        var lng = Math.round(msgparts[i+1]*10000)/10000;
        msgstring += "&nbsp;&nbsp;&nbsp;(" + lat + ",&nbsp;" + lng + ")<br/>";

    }
     setTimeout(function(){$(".pointsDialog").dialog("open");},300);
       $(".pointsDialog").html("<div class = \"innerPointsDialog\">" + "<h2>&nbsp;Drop Points</h2> " + msgstring + "</div>");

     }
}

//populates dialog with boundary points 
function getPoints(){
    var vertices = shape.getPath();
    var verticesArray = vertices.getArray();
    var verticesString = '';
    for (var i = 0; i<verticesArray.length; i++)
    {
        var lat = Math.round(verticesArray[i].lat()*10000)/10000;
        var lng = Math.round(verticesArray[i].lng()*10000)/10000;
        verticesString += "&nbsp;&nbsp;&nbsp;(" + lat.toString() + ",&nbsp;" + lng.toString() + ")<br/>";
    }
    if (verticesArray.length > 2)
    {
        if ($(".pointsDialog").dialog("isOpen") == false)
        {
           setTimeout(function(){$(".pointsDialog").dialog("open");},300);
           
            $(".pointsDialog").html("<div class = \"innerPointsDialog\">" + "<h2>&nbsp;Boundary Points</h2> " + verticesString + "</div>");
        }
    }
    else
    {
        alert('Please enter at least three points.');
    }
}

//getting the drop points from the backend
function getCoords(){
  if (typeof msg === "undefined")
  {
      coords = new Array();
      return coords;
  }
  else
  {
    themsg = msg.toString();
    msgparts = themsg.split(" ");
    msgstring = "";
    var coords = new Array();
    for (var i = 0; i <msgparts.length;i+=2)
    {
//         var lat = Math.round(msgparts[i]*10000)/10000;
//         var lng = Math.round(msgparts[i+1]*10000)/10000;
		var lat  = msgparts[i];
		var lng = msgparts[i+1];
        coords.push({x:lat,y:lng});
    }
    return coords;
} 
}

function createDummyCoords(){
   var sampleLat = [42.3631,  42.3632, 42.3633,  42.3634, 42.3635];
    var sampleLng = [-71.0922, -71.09215, -71.0921,-71.09205, -71.0920, -71.09195, -71.0919, -71.09185,-71.0918];
    
    for (var i = 0; i<sampleLat.length;i++)
    {
        for (var j=0; j< sampleLng.length;j++)
        {
          dummyCoords.push({x:sampleLat[i], y:sampleLng[j]});          
        }
    }
}
//get current location of the drone from backend, right now will just return a dummy thingy
function getCurLoc(a)
{
    //random point from the drop coords
    //var temp = getCoords();
    //var i = Math.floor((Math.random()*temp.length));
   // var loc = new Array();
   // loc.push(temp[i].x);
   // loc.push(temp[i].y);
   // return loc;
    
    
    return dummyCoords[a];
}

function initUAV()
{  
    var aSymbol = {
    path: 'M -10,0 0,-10 10,0 0,10 z',
    strokeColor: '#336600',
    fillColor: '#336600',
    fillOpacity: 1
    };

    myLatLng = new google.maps.LatLng(42.3631,-71.0923);
    var marker = new google.maps.Marker({
    position: myLatLng,
    icon: aSymbol,
    map: map
    });
    uavArray.push(marker);
}
function moveUAV(x){
    var loc = getCurLoc(x);
    myLatLng = new google.maps.LatLng(loc.x,loc.y);
    uavArray[0].setOptions({position:myLatLng});
}
//Mrks a point as having had a device dropped on it
function mark(x){
    //refresh every half a second
    var curLoc = getCurLoc(x);
    //check to see if the position is equal to a drop point, look through all drop points
    var coords = getCoords();
    for (var i = 0; i<coords.length; i++)
    {
        if (curLoc.x == coords[i].x && curLoc.y == coords[i].y)
        {
            markerArray[i].setIcon({path: google.maps.SymbolPath.CIRCLE, scale: 3,strokeColor: '#000000'});
            circleArray[i].setOptions({ strokeColor: '#00CC00', fillColor: '#00CC00'});
        }
    }
}

//simulates the coverage area of the devices
function markDropPoints(){ 

    var coords = getCoords();
    for (var i = 0; i<coords.length; i++)
    {
        var myLatLng = new google.maps.LatLng(coords[i].x, coords[i].y);
        var theMarker = new google.maps.Marker({       
        position: myLatLng,
        map: map,
        icon:
            {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 3,
                strokeColor: '#808080'
            },  
        });
        markerArray[markerArray.length] = theMarker;   
    }
    //drawCircles();
}

function drawCircles()
{ 
    var coords = getCoords();
    for (var i = 0;i<coords.length; i++)
    {
        var myLatLng = new google.maps.LatLng(coords[i].x,coords[i].y);
        var circleOptions = {
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 10,
            fillColor: '#FF0000',    
            fillOpacity: 0.35,
            map: map,
            center: myLatLng,            
            radius: 5
        };
        theCircle = new google.maps.Circle(circleOptions);
        circleArray[circleArray.length] = theCircle;  
    }
}

//add point to map on click
function addPoint(e) {
  var vertices = shape.getPath();
  vertices.push(e.latLng);
  var varray = vertices.getArray(); 
  if (varray.length == 1)
  {
     $(".initInfo").dialog("close");
  }
  else if (varray.length == 3)
  {
   $(".polyCommands").dialog("open");
  }
}
//remove point from polygon with doubleclick on the point
           
var removePoint = function(mev) { 
  if (mev.vertex != null) {
    shape.getPath().removeAt(mev.vertex);
  }
    var vertices = shape.getPath();
    var varray = vertices.getArray();
    if (varray.length == 0)
    {
      $(".initInfo").dialog("open");
    }
    if (varray.length == 2)
    {
        $(".polyCommands").dialog("close");
        $(".pointsDialog").dialog("close");
    }
}

 google.maps.event.addDomListener(window, 'load', initialize);