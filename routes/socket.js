var net = require('net');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    var client = new net.Socket();
	client.connect(process.env.SOCKET_PORT, process.env.SOCKET_IP, function() {
		console.log('Connected to Socket');
		client.write(req.query.message);
	});
	
	res.json(200, {
		message: req.query.message,
		status: 'ok'
	});
});
  
module.exports = router;