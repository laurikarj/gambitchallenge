//importing thingies
const http = require("http");
const fs = require("fs");

//this one is a static file server library
const nstatic = require('node-static');

//create static file server serving stuff from /public, caching disabled for testing purposes
var file = new(nstatic.Server)("./public", {cache: 0});

//runs on localhost port 3000
const hostname = "127.0.0.1";
const port = 3000;

//where live text feed locates
const liveTextFeedUrl = "http://tuftuf.gambitlabs.fi/feed.txt";

//this var will hold a copy of the live text feed
var sensorData = "";

//how often data is fetched from the live text feed and copied to sensorData (milliseconds)
const updateInterval = 1000 * 60 * 60 * 24; //24h

//makes a http get request to provided url and copies the response to sensorData
function updateSensorData(url){
	let dataTemp = "";
	http.get(url, (resp) => {
		//a chunk of data has been received, store it in dataTemp
		resp.on("data", (chunk) => {
			dataTemp += chunk;
		});
		//the whole response has been received, update sensorData
		resp.on("end", () => {
			console.log("Got the good stuff from " + url);
			sensorData = dataTemp;
		});
	});
}

//this is an important part
updateSensorData(liveTextFeedUrl);

//and this also
setInterval(()=>{
	updateSensorData(liveTextFeedUrl);
}, updateInterval);

//creates a server
const server = http.createServer((req, res) => {
	
	//200 means ok
	res.statusCode = 200;

	//serve the feed as json if it is requested
	if(req.url == "/feed"){
		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({"feed": sensorData}));
	//otherwise serve stuff from /public
	}else{
		file.serve(req, res);
	}
});

//start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});