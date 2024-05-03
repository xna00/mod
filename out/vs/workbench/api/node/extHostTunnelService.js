/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "child_process", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/platform/remote/common/managedSocket", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/sign/common/sign", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/services/remote/common/tunnelModel"], function (require, exports, child_process_1, buffer_1, event_1, lifecycle_1, numbers_1, platform_1, resources, uri_1, pfs, log_1, managedSocket_1, remoteAuthorityResolver_1, sign_1, tunnel_1, tunnelService_1, extHostInitDataService_1, extHostRpcService_1, extHostTunnelService_1, tunnelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeExtHostTunnelService = void 0;
    exports.getSockets = getSockets;
    exports.loadListeningPorts = loadListeningPorts;
    exports.parseIpAddress = parseIpAddress;
    exports.loadConnectionTable = loadConnectionTable;
    exports.getRootProcesses = getRootProcesses;
    exports.findPorts = findPorts;
    exports.tryFindRootPorts = tryFindRootPorts;
    function getSockets(stdout) {
        const lines = stdout.trim().split('\n');
        const mapped = [];
        lines.forEach(line => {
            const match = /\/proc\/(\d+)\/fd\/\d+ -> socket:\[(\d+)\]/.exec(line);
            if (match && match.length >= 3) {
                mapped.push({
                    pid: parseInt(match[1], 10),
                    socket: parseInt(match[2], 10)
                });
            }
        });
        const socketMap = mapped.reduce((m, socket) => {
            m[socket.socket] = socket;
            return m;
        }, {});
        return socketMap;
    }
    function loadListeningPorts(...stdouts) {
        const table = [].concat(...stdouts.map(loadConnectionTable));
        return [
            ...new Map(table.filter(row => row.st === '0A')
                .map(row => {
                const address = row.local_address.split(':');
                return {
                    socket: parseInt(row.inode, 10),
                    ip: parseIpAddress(address[0]),
                    port: parseInt(address[1], 16)
                };
            }).map(port => [port.ip + ':' + port.port, port])).values()
        ];
    }
    function parseIpAddress(hex) {
        let result = '';
        if (hex.length === 8) {
            for (let i = hex.length - 2; i >= 0; i -= 2) {
                result += parseInt(hex.substr(i, 2), 16);
                if (i !== 0) {
                    result += '.';
                }
            }
        }
        else {
            // Nice explanation of host format in tcp6 file: https://serverfault.com/questions/592574/why-does-proc-net-tcp6-represents-1-as-1000
            for (let i = 0; i < hex.length; i += 8) {
                const word = hex.substring(i, i + 8);
                let subWord = '';
                for (let j = 8; j >= 2; j -= 2) {
                    subWord += word.substring(j - 2, j);
                    if ((j === 6) || (j === 2)) {
                        // Trim leading zeros
                        subWord = parseInt(subWord, 16).toString(16);
                        result += `${subWord}`;
                        subWord = '';
                        if (i + j !== hex.length - 6) {
                            result += ':';
                        }
                    }
                }
            }
        }
        return result;
    }
    function loadConnectionTable(stdout) {
        const lines = stdout.trim().split('\n');
        const names = lines.shift().trim().split(/\s+/)
            .filter(name => name !== 'rx_queue' && name !== 'tm->when');
        const table = lines.map(line => line.trim().split(/\s+/).reduce((obj, value, i) => {
            obj[names[i] || i] = value;
            return obj;
        }, {}));
        return table;
    }
    function knownExcludeCmdline(command) {
        return !!command.match(/.*\.vscode-server-[a-zA-Z]+\/bin.*/)
            || (command.indexOf('out/server-main.js') !== -1)
            || (command.indexOf('_productName=VSCode') !== -1);
    }
    function getRootProcesses(stdout) {
        const lines = stdout.trim().split('\n');
        const mapped = [];
        lines.forEach(line => {
            const match = /^\d+\s+\D+\s+root\s+(\d+)\s+(\d+).+\d+\:\d+\:\d+\s+(.+)$/.exec(line);
            if (match && match.length >= 4) {
                mapped.push({
                    pid: parseInt(match[1], 10),
                    ppid: parseInt(match[2]),
                    cmd: match[3]
                });
            }
        });
        return mapped;
    }
    async function findPorts(connections, socketMap, processes) {
        const processMap = processes.reduce((m, process) => {
            m[process.pid] = process;
            return m;
        }, {});
        const ports = [];
        connections.forEach(({ socket, ip, port }) => {
            const pid = socketMap[socket] ? socketMap[socket].pid : undefined;
            const command = pid ? processMap[pid]?.cmd : undefined;
            if (pid && command && !knownExcludeCmdline(command)) {
                ports.push({ host: ip, port, detail: command, pid });
            }
        });
        return ports;
    }
    function tryFindRootPorts(connections, rootProcessesStdout, previousPorts) {
        const ports = new Map();
        const rootProcesses = getRootProcesses(rootProcessesStdout);
        for (const connection of connections) {
            const previousPort = previousPorts.get(connection.port);
            if (previousPort) {
                ports.set(connection.port, previousPort);
                continue;
            }
            const rootProcessMatch = rootProcesses.find((value) => value.cmd.includes(`${connection.port}`));
            if (rootProcessMatch) {
                let bestMatch = rootProcessMatch;
                // There are often several processes that "look" like they could match the port.
                // The one we want is usually the child of the other. Find the most child process.
                let mostChild;
                do {
                    mostChild = rootProcesses.find(value => value.ppid === bestMatch.pid);
                    if (mostChild) {
                        bestMatch = mostChild;
                    }
                } while (mostChild);
                ports.set(connection.port, { host: connection.ip, port: connection.port, pid: bestMatch.pid, detail: bestMatch.cmd, ppid: bestMatch.ppid });
            }
            else {
                ports.set(connection.port, { host: connection.ip, port: connection.port, ppid: Number.MAX_VALUE });
            }
        }
        return ports;
    }
    let NodeExtHostTunnelService = class NodeExtHostTunnelService extends extHostTunnelService_1.ExtHostTunnelService {
        constructor(extHostRpc, initData, logService, signService) {
            super(extHostRpc, initData, logService);
            this.initData = initData;
            this.signService = signService;
            this._initialCandidates = undefined;
            this._foundRootPorts = new Map();
            this._candidateFindingEnabled = false;
            if (platform_1.isLinux && initData.remote.isRemote && initData.remote.authority) {
                this._proxy.$setRemoteTunnelService(process.pid);
                this.setInitialCandidates();
            }
        }
        async $registerCandidateFinder(enable) {
            if (enable && this._candidateFindingEnabled) {
                // already enabled
                return;
            }
            this._candidateFindingEnabled = enable;
            let oldPorts = undefined;
            // If we already have found initial candidates send those immediately.
            if (this._initialCandidates) {
                oldPorts = this._initialCandidates;
                await this._proxy.$onFoundNewCandidates(this._initialCandidates);
            }
            // Regularly scan to see if the candidate ports have changed.
            const movingAverage = new numbers_1.MovingAverage();
            let scanCount = 0;
            while (this._candidateFindingEnabled) {
                const startTime = new Date().getTime();
                const newPorts = (await this.findCandidatePorts()).filter(candidate => ((0, tunnel_1.isLocalhost)(candidate.host) || (0, tunnel_1.isAllInterfaces)(candidate.host)));
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) found candidate ports ${newPorts.map(port => port.port).join(', ')}`);
                const timeTaken = new Date().getTime() - startTime;
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) candidate port scan took ${timeTaken} ms.`);
                // Do not count the first few scans towards the moving average as they are likely to be slower.
                if (scanCount++ > 3) {
                    movingAverage.update(timeTaken);
                }
                if (!oldPorts || (JSON.stringify(oldPorts) !== JSON.stringify(newPorts))) {
                    oldPorts = newPorts;
                    await this._proxy.$onFoundNewCandidates(oldPorts);
                }
                const delay = this.calculateDelay(movingAverage.value);
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) next candidate port scan in ${delay} ms.`);
                await (new Promise(resolve => setTimeout(() => resolve(), delay)));
            }
        }
        calculateDelay(movingAverage) {
            // Some local testing indicated that the moving average might be between 50-100 ms.
            return Math.max(movingAverage * 20, 2000);
        }
        async setInitialCandidates() {
            this._initialCandidates = await this.findCandidatePorts();
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) Initial candidates found: ${this._initialCandidates.map(c => c.port).join(', ')}`);
        }
        async findCandidatePorts() {
            let tcp = '';
            let tcp6 = '';
            try {
                tcp = await pfs.Promises.readFile('/proc/net/tcp', 'utf8');
                tcp6 = await pfs.Promises.readFile('/proc/net/tcp6', 'utf8');
            }
            catch (e) {
                // File reading error. No additional handling needed.
            }
            const connections = loadListeningPorts(tcp, tcp6);
            const procSockets = await (new Promise(resolve => {
                (0, child_process_1.exec)('ls -l /proc/[0-9]*/fd/[0-9]* | grep socket:', (error, stdout, stderr) => {
                    resolve(stdout);
                });
            }));
            const socketMap = getSockets(procSockets);
            const procChildren = await pfs.Promises.readdir('/proc');
            const processes = [];
            for (const childName of procChildren) {
                try {
                    const pid = Number(childName);
                    const childUri = resources.joinPath(uri_1.URI.file('/proc'), childName);
                    const childStat = await pfs.Promises.stat(childUri.fsPath);
                    if (childStat.isDirectory() && !isNaN(pid)) {
                        const cwd = await pfs.Promises.readlink(resources.joinPath(childUri, 'cwd').fsPath);
                        const cmd = await pfs.Promises.readFile(resources.joinPath(childUri, 'cmdline').fsPath, 'utf8');
                        processes.push({ pid, cwd, cmd });
                    }
                }
                catch (e) {
                    //
                }
            }
            const unFoundConnections = [];
            const filteredConnections = connections.filter((connection => {
                const foundConnection = socketMap[connection.socket];
                if (!foundConnection) {
                    unFoundConnections.push(connection);
                }
                return foundConnection;
            }));
            const foundPorts = findPorts(filteredConnections, socketMap, processes);
            let heuristicPorts;
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) number of possible root ports ${unFoundConnections.length}`);
            if (unFoundConnections.length > 0) {
                const rootProcesses = await (new Promise(resolve => {
                    (0, child_process_1.exec)('ps -F -A -l | grep root', (error, stdout, stderr) => {
                        resolve(stdout);
                    });
                }));
                this._foundRootPorts = tryFindRootPorts(unFoundConnections, rootProcesses, this._foundRootPorts);
                heuristicPorts = Array.from(this._foundRootPorts.values());
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) heuristic ports ${heuristicPorts.map(heuristicPort => heuristicPort.port).join(', ')}`);
            }
            return foundPorts.then(foundCandidates => {
                if (heuristicPorts) {
                    return foundCandidates.concat(heuristicPorts);
                }
                else {
                    return foundCandidates;
                }
            });
        }
        makeManagedTunnelFactory(authority) {
            return async (tunnelOptions) => {
                const t = new tunnelService_1.NodeRemoteTunnel({
                    commit: this.initData.commit,
                    quality: this.initData.quality,
                    logService: this.logService,
                    ipcLogger: null,
                    // services and address providers have stubs since we don't need
                    // the connection identification that the renderer process uses
                    remoteSocketFactoryService: {
                        _serviceBrand: undefined,
                        async connect(_connectTo, path, query, debugLabel) {
                            const result = await authority.makeConnection();
                            return ExtHostManagedSocket.connect(result, path, query, debugLabel);
                        },
                        register() {
                            throw new Error('not implemented');
                        },
                    },
                    addressProvider: {
                        getAddress() {
                            return Promise.resolve({
                                connectTo: new remoteAuthorityResolver_1.ManagedRemoteConnection(0),
                                connectionToken: authority.connectionToken,
                            });
                        },
                    },
                    signService: this.signService,
                }, 'localhost', tunnelOptions.remoteAddress.host || 'localhost', tunnelOptions.remoteAddress.port, tunnelOptions.localAddressPort);
                await t.waitForReady();
                const disposeEmitter = new event_1.Emitter();
                return {
                    localAddress: (0, tunnelModel_1.parseAddress)(t.localAddress) ?? t.localAddress,
                    remoteAddress: { port: t.tunnelRemotePort, host: t.tunnelRemoteHost },
                    onDidDispose: disposeEmitter.event,
                    dispose: () => {
                        t.dispose();
                        disposeEmitter.fire();
                        disposeEmitter.dispose();
                    },
                };
            };
        }
    };
    exports.NodeExtHostTunnelService = NodeExtHostTunnelService;
    exports.NodeExtHostTunnelService = NodeExtHostTunnelService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, log_1.ILogService),
        __param(3, sign_1.ISignService)
    ], NodeExtHostTunnelService);
    class ExtHostManagedSocket extends managedSocket_1.ManagedSocket {
        static connect(passing, path, query, debugLabel) {
            const d = new lifecycle_1.DisposableStore();
            const half = {
                onClose: d.add(new event_1.Emitter()),
                onData: d.add(new event_1.Emitter()),
                onEnd: d.add(new event_1.Emitter()),
            };
            d.add(passing.onDidReceiveMessage(d => half.onData.fire(buffer_1.VSBuffer.wrap(d))));
            d.add(passing.onDidEnd(() => half.onEnd.fire()));
            d.add(passing.onDidClose(error => half.onClose.fire({
                type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                error,
                hadError: !!error
            })));
            const socket = new ExtHostManagedSocket(passing, debugLabel, half);
            socket._register(d);
            return (0, managedSocket_1.connectManagedSocket)(socket, path, query, debugLabel, half);
        }
        constructor(passing, debugLabel, half) {
            super(debugLabel, half);
            this.passing = passing;
        }
        write(buffer) {
            this.passing.send(buffer.buffer);
        }
        closeRemote() {
            this.passing.end();
        }
        async drain() {
            await this.passing.drain?.();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0VHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLGdDQWlCQztJQUVELGdEQWVDO0lBRUQsd0NBNkJDO0lBRUQsa0RBU0M7SUFRRCw0Q0FjQztJQUVELDhCQWVDO0lBRUQsNENBNkJDO0lBbEpELFNBQWdCLFVBQVUsQ0FBQyxNQUFjO1FBQ3hDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsTUFBTSxNQUFNLEdBQXNDLEVBQUUsQ0FBQztRQUNyRCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE1BQU0sS0FBSyxHQUFHLDRDQUE0QyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztZQUN2RSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNYLEdBQUcsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUM5QixDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzdDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdB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