$(function() {

    const client_url = document.getElementById('client_url').value;
    const api_url = document.getElementById('api_url').value;
    const api_port = document.getElementById('api_port').value;
    const ws_port = document.getElementById('ws_port').value;
    const ip_address = document.getElementById('ip_address').value;
    const sorter_port = document.getElementById('sorter_port').value;
    const sorter_request_lapse = document.getElementById('sorter_request_lapse').value;

    const wsocket = io(`${api_url}:${ws_port}`);

    /*
     * Browser events
     */
    $('#socket-submission').submit(async function(event) {
        event.preventDefault();
        const query = await axios.get(`${client_url}:${api_port}/socket?message=`+document.getElementById('message').value);
        console.info(query);
    });

    $('#connect-to-sorter').click(function(e) {
        const data = {
          location: 'Capucas',
          ip_address: ip_address,
          port: sorter_port
        }
        
        wsocket.emit('check-device-status', data);
        return false;
    });

    // Sending request to sorter machine
    $('#sorter-pooling').change(function(e) {
        const data = {
            location: 'Capucas',
            ip_address: ip_address,
            port: sorter_port,
            process_id: $('#lot-id').val()
        }

        if($(this).is(':checked')){
            wsocket.emit('send-device-request', data);
            var trigger = setInterval(function(){
                if($('#sorter-pooling').is(':checked')){
                    wsocket.emit('send-device-request', data);
                } else {
                    clearInterval(trigger);
               }
            }, sorter_request_lapse);
        }
    });

    $('#get-ip-connection-button').click(function(e) {
        const data = {
          location: 'Capucas',
          ip_address: document.getElementById('ip_address_combo2').value
        }
        
        wsocket.emit('is-ip-connected', data);
        return false;
    });

    $('#filter-button').click(function() {
        const filters = {
          location: 'Capucas',
          deviceIPAddress: document.getElementById('ip_address_combo1').value
        }
        wsocket.emit('filtered-metrics', filters);
    });

    $('#reset-metrics').click(function() {
        //it triggers real-device-metrics event
        wsocket.emit('get-device-real-metrics', {
            location: 'Capucas', 
            ip_address, 
            process_id: $('#lot-id').val() 
        });
    });

    /*
     * Websocket initial messeges
     */
    const filters = { location: 'Capucas' }
    wsocket.emit('filtered-metrics', filters);
    wsocket.emit('pool-iot-connections', filters);
    wsocket.emit('pool-iot-list', filters);
    wsocket.emit('check-device-status', {
        location: 'Capucas',
        ip_address: ip_address,
        port: sorter_port
    });

    /*
     * Websocket events
     */
    wsocket.on('metrics', function(data) {
        if(Array.isArray(data) && data.length > 0)
        {
            metric = data.pop();
            const {date, device_type, ip_address} = metric;
            delete metric.date;
            delete metric.device_type;
            delete metric.ip_address;
        
            document.getElementById('metrics').innerHTML = `
                <div class="row">
                    <div class="col-md-5 col-5"><strong>Device Type:</strong></div>
                    <div class="col-md-7 col-7">
                        <p>${device_type}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-5 col-5"><strong>IP address:</strong></div>
                    <div class="col-md-7 col-7">
                        <p>${ip_address}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-5 col-5"><strong>Date:</strong></div>
                    <div class="col-md-7 col-7">
                        <p>${date}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-5 col-5"><strong>Payload:</strong></div>
                    <div class="col-md-7 col-7">
                        <pre><code>${JSON.stringify(metric,null,3)}</code></pre>
                    </div>
                </div>`;
        }
        
        wsocket.emit('pool-iot-connections', filters);
        wsocket.emit('pool-iot-list', filters);
    })
    
    wsocket.on('iot-connections', function(data) {
        document.getElementById('location').innerHTML = `<span>${data.name}</span>`;
        document.getElementById('connectedIPs').innerHTML = data.iotConnected.map(function(elem){
            return(`<span class="badge badge-pill badge-primary">${elem}</span>`)
        }).join(" ")
    });
    
    wsocket.on('iot-list', function(data) {
        document.getElementById('devicesCatalog').innerHTML = data.iotConnected.map(function(elem){
            return(`<span class="badge badge-pill badge-primary">${elem}</span>`)
        }).join(" ")
    
        const ids = ["#ip_address_combo1", "#ip_address_combo2"];
        ids.forEach(id => {
            var options = $(id);
            options.empty(); 
            options.append($("<option selected />").text('Open this select menu'));
            data.iotConnected.map(function(elem){
                options.append(new Option(elem, elem));
            });
        });
    });
    
    wsocket.on('ip-status', function(data) {
        document.getElementById('is-it-connected').innerHTML = `<span class="badge badge-pill badge-${data=='online'? 'success': 'danger'}">${data}</span>`;
    })

    wsocket.on('device-status', function(data) {
        document.getElementById('is-sorter-connected').innerHTML = `<span class="badge badge-pill badge-${data=='online'? 'success': 'danger'}">${data}</span>`;
    })

    wsocket.on('real-device-metrics', async function(data) {
        let total, bad = null;
        if(Array.isArray(data) && data.length > 0)
        {
            const firstMetric = data.reverse().pop();
            if('total' in firstMetric) total = firstMetric['total'];
            if('bad' in firstMetric) bad = firstMetric['bad'];
        }
        let url = `${client_url}:${api_port}/sorters/reset-metrics?process_id=${$('#lot-id').val()}`;
        if(total) url += `&total=${total}`;
        if(bad) url += `&bad=${bad}`;
        console.log('URL', url);

        await axios.delete(url);
    })
});