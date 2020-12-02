const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const cors = require('cors')

const si = require('systeminformation');
const publicIp = require('public-ip');
var ping = require('jjg-ping');

var uptime;
setInterval(function() {
    var Client = require('uptime-robot');
    var cl = new Client('m786256651-e225405eb28585e77ee744d5');
    cl.getMonitors({customUptimeRatio: [24]}, function (err, res) {
    if (err) throw err;
    uptime = res[0].customuptimeratio[0];
    });
}, 1000);
const app = express();
app.use(cors());
const privateKey = fs.readFileSync('/home/admin/conf/web/ssl.blackfirehun.ddns.net.key', 'utf8');
const certificate = fs.readFileSync('/home/admin/conf/web/ssl.blackfirehun.ddns.net.crt', 'utf8');
const ca = fs.readFileSync('/home/admin/conf/web/ssl.blackfirehun.ddns.net.ca', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};


function formatBytes(bytes) {
    var marker = 1024;
    var decimal = 2;
    var kiloBytes = marker;
    var megaBytes = marker * marker;
    var gigaBytes = marker * marker * marker;
    if(bytes < kiloBytes) return bytes + " Byte";
    else if(bytes < megaBytes) return(bytes / kiloBytes).toFixed(decimal) + " KB";
    else if(bytes < gigaBytes) return(bytes / megaBytes).toFixed(decimal) + " MB";
    else return(bytes / gigaBytes).toFixed(decimal) + " GB";
}

function internetformat(bytes) {
    var decimal = 2;
    return(bytes * 0.00000095367432).toFixed(decimal);
}
function hddformat(bytes) {
    var decimal = 1;
    return(bytes * 0.00000095367432).toFixed(decimal);
}

    var america_ping;
    var german_ping;
    var budapest_ping;
    setInterval(function() {
        ping.system.ping('198.7.59.119', function(latency, status) {
            if (status) {
                america_ping = latency;
            }
            else {
                america_ping = "AMERIKA NEM ELÉRHETŐ"
            }
        });
        ping.system.ping('5.189.133.131', function(latency, status) {
            if (status) {
                german_ping = latency;
            }
            else {
                german_ping = "NÉMETORSZÁG NEM ELÉRHETŐ"
            }
        });
        ping.system.ping('193.239.149.210', function(latency, status) {
            if (status) {
                budapest_ping = latency;
            }
            else {
                budapest_ping = "BUDAPEST NEM ELÉRHETŐ"
            }
        });
    }, 1000);

        var internet;
        setInterval(function() {
            si.networkStats().then(data => {
            internet = internetformat(data[0].rx_sec + data[0].tx_sec);
            })
          }, 1000);

          var read;
          var write;

          setInterval(function() {
            si.fsStats().then(data => {
            read = hddformat(data.rx_sec);
            write = hddformat(data.wx_sec);
            })
          }, 1000);

          app.get("/", (req, resp)=>{
            stats();

        async function stats(){  
            const os = require("os"),
                osu = require("os-utils");
            var operating_system;

            await si.osInfo(function (data) {
                operating_system = data.distro;
            })
            
            osu.cpuUsage(function(v){
                si.fsSize(function(f){
                    var memdatatouse = Math.floor(os.totalmem() - os.freemem());
                    var data =  {
                        hostname: os.hostname(),
                        cpu_model: os.cpus()[0].model,
                        cpu_cores: os.cpus().length,
                        cpu_speed: (os.cpus()[0].speed / 1000).toFixed(2),
                        operating_system: operating_system,
                        memorymax: formatBytes(os.totalmem()),
                        ip: publicIp.v4(),
                        memoryused: formatBytes(Math.floor(os.totalmem() - os.freemem())),
                        hdd_max: formatBytes(f[1].size),
                        hdd_used: formatBytes(f[1].used),
                        hdd_free:  formatBytes(Math.floor(f[1].size - f[1].used)),
                        hdd_szazalek: f[1].use.toFixed(0),
                        hdd_read: read,
                        hdd_write: write,
                        sysUptime : p_uptime(os.uptime()),
                        cpuUsage : Math.round(v*1000)/10,
                        memUsage: Math.floor(memdatatouse/os.totalmem()*1000)/10,
                        internet: internet,
                        america_ping: america_ping,
                        german_ping: german_ping,
                        budapest_ping: budapest_ping,
                        uptime: uptime
                    }
                    resp.send(data);
                    });
            });
        }
    });

        // uptime parser
        function p_uptime(n){
            var t_d = 24*60**2,
                t_h = 60**2,
                d = (n-n%t_d)/t_d,
                h = (n%t_d - n%t_h)/t_h,
                m = (n%t_h - n%60)/60,
                s = Math.floor(n%60);

            return `${d? d+"d ":""}${(d||h)? h+"h ":""}${(h||m)? m+"m ":""}${(m||s)? s+"s":""}`
        }
        const httpServer = http.createServer(app);
        const httpsServer = https.createServer(credentials, app);

        httpServer.listen(7373, () => {
            console.log('HTTP port 7373');
        });
        
        httpsServer.listen(7474, () => {
            console.log('HTTPS port 7474');
        });