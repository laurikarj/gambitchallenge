//defining some html elements
const table = document.querySelector("table");
const lastClientUpdateSpan = document.querySelector("#clientfeedlastupdated");
const lastServerUpdateSpan = document.querySelector("#serverfeedlastupdated");

//defining some other stuff
var modbusValues;
var clientLastUpdate;
var serverLastUpdate;

//this function updates modbusValues
async function fetchData(){
	//we'll hold the feed in feed
	let feed;
	//fetch the text feed from our local copy
	await fetch("./feed")
		.then(response => response.json())
		.then(data => {feed = data.feed});
	//split to arr by lines
	modbusValues = feed.split("\n");
	//store the date from first row
	serverLastUpdate = new Date(modbusValues[0]).toString();
	clientLastUpdate = new Date().toString();
	//remove an empty string from the end
	modbusValues.pop();
	//goes through whole array and separates the register values from strings
	modbusValues.forEach((item, index, arr) => {
		arr[index] = Number(item.split(":")[1]);
	});
}

//returns the value of long stored in registers reg and reg+1
function getLong(reg){
	//this was pretty hard to figure out
	//create 32bit arraybuffer to hold the value from the two registers
	let buffer = new ArrayBuffer(4);
	let view = new DataView(buffer);
	//set the first register's value as unsigned little-edian int to buffer's bytes 0 and 1 
	view.setUint16(0, modbusValues[reg], true);
	//same for second register but to bytes 2 and 3
	view.setUint16(2, modbusValues[reg+1], true);
	//read the buffer as signed little-edian 32bit int
	return view.getInt32(0, true);
}

//returns float stored in reg and reg+1
function getFloat(reg){
	//same stuff as in getLong()
	let buffer = new ArrayBuffer(4);
	let view = new DataView(buffer);
	view.setUint16(0, modbusValues[reg], true);
	view.setUint16(2, modbusValues[reg+1], true);
	//read the buffer as float
	return view.getFloat32(0, true).toPrecision(5);
}

//returns 8-bit int stored in byte byt in register reg 
function getInt8(reg, byt){
	let buffer = new ArrayBuffer(2);
	let view = new DataView(buffer);
	view.setUint16(0, modbusValues[reg], true);
	//byt should be 0 or 1
	return view.getUint8(byt, true);
}

function getInt16(reg){
	//not sure if these are already correct as is or if bits should be read in reverse order or something
	//registers 93 & 94 should have a range of 0-2047 but they have values higher than that so idk
}

//displays stuff in a table and refreshes the "last updated" -info on page
function displayData(){
	//define stuff to be displayed in table
	//this is a relatively messy way to do this
	let tableContents = [
		["Flow rate", getFloat(1) + " m³/h"],
		["Energy Flow Rate", getFloat(3) + " GJ/h"],
		["Velocity", getFloat(5) + " m/s"],
		["Fluid sound speed", getFloat(7) + " m/s"],
		["Positive accumulator", getLong(9)],
		["Negative accumulator", getLong(13)],
		["Positive energy accumulator", getLong(17)],
		["Negative energy accumulator", getLong(21)],
		["Net accumulator", getLong(25)],
		["Net energy accumulator", getLong(29)],
		["Temperature #1/inlet", getFloat(33) + " °C"],
		["Temperature #2/inlet", getFloat(35) + " °C"],
		["Analog input A13", getFloat(37)],
		["Analog input A14", getFloat(39)],
		["Analog input A15", getFloat(41)],
		["Current input at A13", getFloat(43) + " mA"],
		["Current input at A14", getFloat(45) + " mA"],
		["Current input at A15", getFloat(47) + " mA"],
		["PT100 resistance of inlet", getFloat(77) + " Ohm"],
		["PT100 resistance of outlet", getFloat(79) + " Ohm"],
		["Total travel time", getFloat(81) + " μs"],
		["Delta travel time", getFloat(83) + " nano-seconds"],
		["Upstream travel time", getFloat(85) + " μs"],
		["Downstream travel time", getFloat(87) + " μs"],
		["Output current", getFloat(89) + " mA"],
		["Working step", getInt8(92, 0)],
		["Signal quality", getInt8(92, 1)],
		["Measured travel time / calculated travel time", getFloat(97)],
		["Reynold's number", getFloat(99)]
	];
	
	//clear table from old values
	table.innerHTML = "";
	
	//for each array in tableContents
	tableContents.forEach(el => {
		//create a table row
		let row = document.createElement("tr");
		
		//add variable name to row
		let varname = document.createElement("td");
		varname.innerHTML = el[0];
		row.appendChild(varname);
		
		//add variable value to row
		let varvalue = document.createElement("td");
		varvalue.innerHTML = el[1];
		row.appendChild(varvalue);
		
		//add row to table
		table.appendChild(row);
	});
	
	lastServerUpdateSpan.innerHTML = serverLastUpdate;
	lastClientUpdateSpan.innerHTML = clientLastUpdate;
}

async function refresh(){
	await fetchData();
	await displayData();
}

refresh();