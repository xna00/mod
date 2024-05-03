/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "net"], function (require, exports, net) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BROWSER_RESTRICTED_PORTS = void 0;
    exports.findFreePort = findFreePort;
    exports.findFreePortFaster = findFreePortFaster;
    /**
     * Given a start point and a max number of retries, will find a port that
     * is openable. Will return 0 in case no free port can be found.
     */
    function findFreePort(startPort, giveUpAfter, timeout, stride = 1) {
        let done = false;
        return new Promise(resolve => {
            const timeoutHandle = setTimeout(() => {
                if (!done) {
                    done = true;
                    return resolve(0);
                }
            }, timeout);
            doFindFreePort(startPort, giveUpAfter, stride, (port) => {
                if (!done) {
                    done = true;
                    clearTimeout(timeoutHandle);
                    return resolve(port);
                }
            });
        });
    }
    function doFindFreePort(startPort, giveUpAfter, stride, clb) {
        if (giveUpAfter === 0) {
            return clb(0);
        }
        const client = new net.Socket();
        // If we can connect to the port it means the port is already taken so we continue searching
        client.once('connect', () => {
            dispose(client);
            return doFindFreePort(startPort + stride, giveUpAfter - 1, stride, clb);
        });
        client.once('data', () => {
            // this listener is required since node.js 8.x
        });
        client.once('error', (err) => {
            dispose(client);
            // If we receive any non ECONNREFUSED error, it means the port is used but we cannot connect
            if (err.code !== 'ECONNREFUSED') {
                return doFindFreePort(startPort + stride, giveUpAfter - 1, stride, clb);
            }
            // Otherwise it means the port is free to use!
            return clb(startPort);
        });
        client.connect(startPort, '127.0.0.1');
    }
    // Reference: https://chromium.googlesource.com/chromium/src.git/+/refs/heads/main/net/base/port_util.cc#56
    exports.BROWSER_RESTRICTED_PORTS = {
        1: true, // tcpmux
        7: true, // echo
        9: true, // discard
        11: true, // systat
        13: true, // daytime
        15: true, // netstat
        17: true, // qotd
        19: true, // chargen
        20: true, // ftp data
        21: true, // ftp access
        22: true, // ssh
        23: true, // telnet
        25: true, // smtp
        37: true, // time
        42: true, // name
        43: true, // nicname
        53: true, // domain
        69: true, // tftp
        77: true, // priv-rjs
        79: true, // finger
        87: true, // ttylink
        95: true, // supdup
        101: true, // hostriame
        102: true, // iso-tsap
        103: true, // gppitnp
        104: true, // acr-nema
        109: true, // pop2
        110: true, // pop3
        111: true, // sunrpc
        113: true, // auth
        115: true, // sftp
        117: true, // uucp-path
        119: true, // nntp
        123: true, // NTP
        135: true, // loc-srv /epmap
        137: true, // netbios
        139: true, // netbios
        143: true, // imap2
        161: true, // snmp
        179: true, // BGP
        389: true, // ldap
        427: true, // SLP (Also used by Apple Filing Protocol)
        465: true, // smtp+ssl
        512: true, // print / exec
        513: true, // login
        514: true, // shell
        515: true, // printer
        526: true, // tempo
        530: true, // courier
        531: true, // chat
        532: true, // netnews
        540: true, // uucp
        548: true, // AFP (Apple Filing Protocol)
        554: true, // rtsp
        556: true, // remotefs
        563: true, // nntp+ssl
        587: true, // smtp (rfc6409)
        601: true, // syslog-conn (rfc3195)
        636: true, // ldap+ssl
        989: true, // ftps-data
        990: true, // ftps
        993: true, // ldap+ssl
        995: true, // pop3+ssl
        1719: true, // h323gatestat
        1720: true, // h323hostcall
        1723: true, // pptp
        2049: true, // nfs
        3659: true, // apple-sasl / PasswordServer
        4045: true, // lockd
        5060: true, // sip
        5061: true, // sips
        6000: true, // X11
        6566: true, // sane-port
        6665: true, // Alternate IRC [Apple addition]
        6666: true, // Alternate IRC [Apple addition]
        6667: true, // Standard IRC [Apple addition]
        6668: true, // Alternate IRC [Apple addition]
        6669: true, // Alternate IRC [Apple addition]
        6697: true, // IRC + TLS
        10080: true // Amanda
    };
    /**
     * Uses listen instead of connect. Is faster, but if there is another listener on 0.0.0.0 then this will take 127.0.0.1 from that listener.
     */
    function findFreePortFaster(startPort, giveUpAfter, timeout, hostname = '127.0.0.1') {
        let resolved = false;
        let timeoutHandle = undefined;
        let countTried = 1;
        const server = net.createServer({ pauseOnConnect: true });
        function doResolve(port, resolve) {
            if (!resolved) {
                resolved = true;
                server.removeAllListeners();
                server.close();
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                resolve(port);
            }
        }
        return new Promise(resolve => {
            timeoutHandle = setTimeout(() => {
                doResolve(0, resolve);
            }, timeout);
            server.on('listening', () => {
                doResolve(startPort, resolve);
            });
            server.on('error', err => {
                if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES') && (countTried < giveUpAfter)) {
                    startPort++;
                    countTried++;
                    server.listen(startPort, hostname);
                }
                else {
                    doResolve(0, resolve);
                }
            });
            server.on('close', () => {
                doResolve(0, resolve);
            });
            server.listen(startPort, hostname);
        });
    }
    function dispose(socket) {
        try {
            socket.removeAllListeners('connect');
            socket.removeAllListeners('error');
            socket.end();
            socket.destroy();
            socket.unref();
        }
        catch (error) {
            console.error(error); // otherwise this error would get lost in the callback chain
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9ydHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9wb3J0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsb0NBbUJDO0lBMEhELGdEQXNDQztJQXZMRDs7O09BR0c7SUFDSCxTQUFnQixZQUFZLENBQUMsU0FBaUIsRUFBRSxXQUFtQixFQUFFLE9BQWUsRUFBRSxNQUFNLEdBQUcsQ0FBQztRQUMvRixJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7UUFFakIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUM1QixNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNyQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDWixPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztZQUNGLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVaLGNBQWMsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN2RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsSUFBSSxHQUFHLElBQUksQ0FBQztvQkFDWixZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzVCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFTLGNBQWMsQ0FBQyxTQUFpQixFQUFFLFdBQW1CLEVBQUUsTUFBYyxFQUFFLEdBQTJCO1FBQzFHLElBQUksV0FBVyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sR0FBRyxD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