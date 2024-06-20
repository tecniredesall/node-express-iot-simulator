var net = require('net');
var faker = require('faker');
var moment = require('moment');
require('dotenv').config();
const fs = require('fs');

// Create sorter server
var server = net.createServer();    
server.on('connection', socket);
server.on('close',function(){
    console.log('Server closed !');
});

// Set up sorter server
server.listen(process.env.SORTER_PORT, function() {    
    console.log('Sorter machine listening to %j', server.address());  
});

// Sockets management
async function socket(conn) {
    // Client connections handler
    const filepath = './servers/test-db.json';
    let total = faker.datatype.number({min: 1, max: 5, precision: 0.0001});
    let bad = faker.datatype.number({min: 1, max: total, precision: 0.0001});

    // Create initial DB
    await fs.access(filepath, fs.F_OK, async (err) => {
        if(err)
        {    
             // Write file if does not exist (SORTER)
             const randomData = JSON.stringify({
                total,
                bad
            },null, 3);
            console.log('SORTER WRITTEN', randomData);
            await fs.writeFileSync(filepath, randomData);
        }
    })
    
    // Logs service up
    var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;  
    console.log('New client connection from %s', remoteAddress);

    /*
     * Client events handler
     */
    conn.on('data', onConnData);  
    conn.once('close', onConnClose);  
    conn.on('error', onConnError);
    async function onConnData(d) {  
        var data = _parseMessage(d.toString().trim());
        if(typeof(data) == 'object' && 'code' in data && data['code'] == 600) {
            await fs.access(filepath, fs.F_OK, async (err) => {
                if(!err)
                {
                    let rawdata = await fs.readFileSync(filepath);
                    if(rawdata && rawdata != '')
                    {
                        let fileContent = JSON.parse(rawdata);
                        if('total' in fileContent) {
                            const total = faker.datatype.number({min: fileContent['total'], max: fileContent['total'] + 10, precision: 0.0001});
                            const bad = faker.datatype.number({min: fileContent['bad'], max: (fileContent['total'] - fileContent['bad']), precision: 0.0001});
                            let metric = JSON.stringify({
                                "code" : 600,
                                "total" : total,
                                "bad" : bad,
                                "DefectiveRatio" : faker.datatype.number({min: 1, max: bad, precision: 0.0001}),
                                "ImpurityRatio" : faker.datatype.number({min: 1, max: bad, precision: 0.0001}),
                                "ResetDate" : moment(faker.date.recent()).format('YYYY-MM-DD hh:mm:ss'),
                                "sorterNumber" : 5,
                                "speed" : faker.datatype.number({min: 1, max: 5, precision: 0.0001}),
                            }, null, 3);
                            await fs.writeFileSync(filepath, metric);
                            conn.write(metric);
                        }
                    }
                }
            });
        }
    }

    function onConnClose() {  
        console.log('Client connection from %s CLOSED', remoteAddress);  
    }

    function onConnError(err) {  
        console.log('Connection %s error: %s', remoteAddress, err.message);  
    }

    /*
     * Custom functions
     */
    function _parseMessage(message) {
        try {
            return JSON.parse(message);
        } catch (e) {
            return message;
        }
    }
}