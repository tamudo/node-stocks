const cheerio = require('cheerio')
const axios = require('axios')
const schedule = require('node-schedule');
const asciichart = require('asciichart');
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
let server = http.createServer(app);
let io = socketIO(server);

const CRON_1Min = '*/1 * * * *';
const CRON_5Min = '*/5 * * * *';
const CRON_10Min = '*/10 * * * *';

const publicPath = path.resolve(__dirname, 'public');
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

server.listen(port, (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);

});



console.log('-------- Start Cron ----------');

// cron each minute;*/1 * * * *
// cron five minute;*/5 * * * *
// cron ten minute;*/10 * * * *
let cron = schedule.scheduleJob(CRON_10Min, async function(fireDate) {
    // console.log('This job was supposed to run at ' + fireDate + ', actually ran at ' + new Date());
    await Promise.all([obtainMetdata(), obtainBS(), obtainALM()]);
    //paintPlot();
});


let obtainMetdata = () => {
    axios.get('http://www.infomet.am.ub.es/metdata/')
        .then((response) => {

            // Load the web page source code into a cheerio instance
            const $ = cheerio.load(response.data)

            let values = $('li').map(function(i, el) {
                return $(this).text();
            }).toArray();

            var PATTERN = /Temperatura/;
            filtered = values.filter(function(str) { return PATTERN.test(str); });

            //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
            let date = new Date().getTime();

            let regex = /(\d+)/g;
            let name = filtered[0];
            let valores = name.match(regex);
            let temp = parseFloat(valores.join("."));
            io.emit('temperatureUpdate', date, temp);


        })
        .catch(e => {
            console.log("Error al obtener temperatura :" + e);
        });
}

let obtainBS = () => {
    axios.get('https://es.investing.com/equities/bco-de-sabadell')
        .then((response) => {
            const $ = cheerio.load(response.data);
            const bsValue = $("#last_last").text();
            let date = new Date().getTime();
            //   console.log('BS:' + parseFloat(bsValue.replace(',', '.'))); //BSUpdate
            io.emit('BSUpdate', date, parseFloat(bsValue.replace(',', '.')));


        })
        .catch(e => {
            console.log("Error al obtener BS :" + e);
        });
}

let obtainALM = () => {
    axios.get('https://es.investing.com/equities/almirall-sa')
        .then((response) => {
            const $ = cheerio.load(response.data);
            const bsValue = $("#last_last").text();
            //            console.log('Almirall:' + bsValue);
            let date = new Date().getTime();
            //          console.log('BS:' + parseFloat(bsValue.replace(',', '.'))); //BSUpdate
            io.emit('ALMUpdate', date, parseFloat(bsValue.replace(',', '.')));

        })
        .catch(e => {
            console.log("Error al obtener Almirall :" + e);
        });
}

let paintPlot = () => {
    var s0 = new Array(20, 22, 23);
    //for (var i = 0; i < s0.length; i++)
    // s0[i] = 15 * Math.sin(i * ((Math.PI * 4) / s0.length))
    console.log(asciichart.plot(s0));
}