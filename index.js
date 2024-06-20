const express = require("express");
var ip = require("ip");
require('dotenv').config();

var socketRoutes = require("./routes/socket.js");
var sorterRoutes = require("./routes/sorter.js");

const app = express();
app.set("view engine", "pug");
app.use(express.static('public'));

app.use('/socket', socketRoutes);
app.use('/sorters', sorterRoutes);

app.get("/", async (req, res) => {
	res.render("index", {
		ip_address: ip.address(),
		socket_address: process.env.SOCKET_IP,
		socket_port: process.env.SOCKET_PORT,
		client_url: process.env.CLIENT_URL,
		api_url: process.env.API_URL,
		api_port: process.env.API_PORT,
		ws_port: process.env.WS_PORT,
		sorter_port: process.env.SORTER_PORT,
		sorter_request_lapse: process.env.SORTER_REQUEST_LAPSE,
	});
});

app.listen(process.env.API_PORT, () => {
	console.log(`Listening on port ${process.env.API_PORT}...`);
});