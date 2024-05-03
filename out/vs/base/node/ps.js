/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "vs/base/common/network"], function (require, exports, child_process_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.listProcesses = listProcesses;
    function listProcesses(rootPid) {
        return new Promise((resolve, reject) => {
            let rootItem;
            const map = new Map();
            function addToTree(pid, ppid, cmd, load, mem) {
                const parent = map.get(ppid);
                if (pid === rootPid || parent) {
                    const item = {
                        name: findName(cmd),
                        cmd,
                        pid,
                        ppid,
                        load,
                        mem
                    };
                    map.set(pid, item);
                    if (pid === rootPid) {
                        rootItem = item;
                    }
                    if (parent) {
                        if (!parent.children) {
                            parent.children = [];
                        }
                        parent.children.push(item);
                        if (parent.children.length > 1) {
                            parent.children = parent.children.sort((a, b) => a.pid - b.pid);
                        }
                    }
                }
            }
            function findName(cmd) {
                const UTILITY_NETWORK_HINT = /--utility-sub-type=network/i;
                const WINDOWS_CRASH_REPORTER = /--crashes-directory/i;
                const WINPTY = /\\pipe\\winpty-control/i;
                const CONPTY = /conhost\.exe.+--headless/i;
                const TYPE = /--type=([a-zA-Z-]+)/;
                // find windows crash reporter
                if (WINDOWS_CRASH_REPORTER.exec(cmd)) {
                    return 'electron-crash-reporter';
                }
                // find winpty process
                if (WINPTY.exec(cmd)) {
                    return 'winpty-agent';
                }
                // find conpty process
                if (CONPTY.exec(cmd)) {
                    return 'conpty-agent';
                }
                // find "--type=xxxx"
                let matches = TYPE.exec(cmd);
                if (matches && matches.length === 2) {
                    if (matches[1] === 'renderer') {
                        return `window`;
                    }
                    else if (matches[1] === 'utility') {
                        if (UTILITY_NETWORK_HINT.exec(cmd)) {
                            return 'utility-network-service';
                        }
                        return 'utility-process';
                    }
                    else if (matches[1] === 'extensionHost') {
                        return 'extension-host'; // normalize remote extension host type
                    }
                    return matches[1];
                }
                // find all xxxx.js
                const JS = /[a-zA-Z-]+\.js/g;
                let result = '';
                do {
                    matches = JS.exec(cmd);
                    if (matches) {
                        result += matches + ' ';
                    }
                } while (matches);
                if (result) {
                    if (cmd.indexOf('node ') < 0 && cmd.indexOf('node.exe') < 0) {
                        return `electron-nodejs (${result})`;
                    }
                }
                return cmd;
            }
            if (process.platform === 'win32') {
                const cleanUNCPrefix = (value) => {
                    if (value.indexOf('\\\\?\\') === 0) {
                        return value.substring(4);
                    }
                    else if (value.indexOf('\\??\\') === 0) {
                        return value.substring(4);
                    }
                    else if (value.indexOf('"\\\\?\\') === 0) {
                        return '"' + value.substring(5);
                    }
                    else if (value.indexOf('"\\??\\') === 0) {
                        return '"' + value.substring(5);
                    }
                    else {
                        return value;
                    }
                };
                (new Promise((resolve_1, reject_1) => { require(['@vscode/windows-process-tree'], resolve_1, reject_1); })).then(windowsProcessTree => {
                    windowsProcessTree.getProcessList(rootPid, (processList) => {
                        if (!processList) {
                            reject(new Error(`Root process ${rootPid} not found`));
                            return;
                        }
                        windowsProcessTree.getProcessCpuUsage(processList, (completeProcessList) => {
                            const processItems = new Map();
                            completeProcessList.forEach(process => {
                                const commandLine = cleanUNCPrefix(process.commandLine || '');
                                processItems.set(process.pid, {
                                    name: findName(commandLine),
                                    cmd: commandLine,
                                    pid: process.pid,
                                    ppid: process.ppid,
                                    load: process.cpu || 0,
                                    mem: process.memory || 0
                                });
                            });
                            rootItem = processItems.get(rootPid);
                            if (rootItem) {
                                processItems.forEach(item => {
                                    const parent = processItems.get(item.ppid);
                                    if (parent) {
                                        if (!parent.children) {
                                            parent.children = [];
                                        }
                                        parent.children.push(item);
                                    }
                                });
                                processItems.forEach(item => {
                                    if (item.children) {
                                        item.children = item.children.sort((a, b) => a.pid - b.pid);
                                    }
                                });
                                resolve(rootItem);
                            }
                            else {
                                reject(new Error(`Root process ${rootPid} not found`));
                            }
                        });
                    }, windowsProcessTree.ProcessDataFlag.CommandLine | windowsProcessTree.ProcessDataFlag.Memory);
                });
            }
            else { // OS X & Linux
                function calculateLinuxCpuUsage() {
                    // Flatten rootItem to get a list of all VSCode processes
                    let processes = [rootItem];
                    const pids = [];
                    while (processes.length) {
                        const process = processes.shift();
                        if (process) {
                            pids.push(process.pid);
                            if (process.children) {
                                processes = processes.concat(process.children);
                            }
                        }
                    }
                    // The cpu usage value reported on Linux is the average over the process lifetime,
                    // recalculate the usage over a one second interval
                    // JSON.stringify is needed to escape spaces, https://github.com/nodejs/node/issues/6803
                    let cmd = JSON.stringify(network_1.FileAccess.asFileUri('vs/base/node/cpuUsage.sh').fsPath);
                    cmd += ' ' + pids.join(' ');
                    (0, child_process_1.exec)(cmd, {}, (err, stdout, stderr) => {
                        if (err || stderr) {
                            reject(err || new Error(stderr.toString()));
                        }
                        else {
                            const cpuUsage = stdout.toString().split('\n');
                            for (let i = 0; i < pids.length; i++) {
                                const processInfo = map.get(pids[i]);
                                processInfo.load = parseFloat(cpuUsage[i]);
                            }
                            if (!rootItem) {
                                reject(new Error(`Root process ${rootPid} not found`));
                                return;
                            }
                            resolve(rootItem);
                        }
                    });
                }
                (0, child_process_1.exec)('which ps', {}, (err, stdout, stderr) => {
                    if (err || stderr) {
                        if (process.platform !== 'linux') {
                            reject(err || new Error(stderr.toString()));
                        }
                        else {
                            const cmd = JSON.stringify(network_1.FileAccess.asFileUri('vs/base/node/ps.sh').fsPath);
                            (0, child_process_1.exec)(cmd, {}, (err, stdout, stderr) => {
                                if (err || stderr) {
                                    reject(err || new Error(stderr.toString()));
                                }
                                else {
                                    parsePsOutput(stdout, addToTree);
                                    calculateLinuxCpuUsage();
                                }
                            });
                        }
                    }
                    else {
                        const ps = stdout.toString().trim();
                        const args = '-ax -o pid=,ppid=,pcpu=,pmem=,command=';
                        // Set numeric locale to ensure '.' is used as the decimal separator
                        (0, child_process_1.exec)(`${ps} ${args}`, { maxBuffer: 1000 * 1024, env: { LC_NUMERIC: 'en_US.UTF-8' } }, (err, stdout, stderr) => {
                            // Silently ignoring the screen size is bogus error. See https://github.com/microsoft/vscode/issues/98590
                            if (err || (stderr && !stderr.includes('screen size is bogus'))) {
                                reject(err || new Error(stderr.toString()));
                            }
                            else {
                                parsePsOutput(stdout, addToTree);
                                if (process.platform === 'linux') {
                                    calculateLinuxCpuUsage();
                                }
                                else {
                                    if (!rootItem) {
                                        reject(new Error(`Root process ${rootPid} not found`));
                                    }
                                    else {
                                        resolve(rootItem);
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    function parsePsOutput(stdout, addToTree) {
        const PID_CMD = /^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s+(.+)$/;
        const lines = stdout.toString().split('\n');
        for (const line of lines) {
            const matches = PID_CMD.exec(line.trim());
            if (matches && matches.length === 6) {
                addToTree(parseInt(matches[1]), parseInt(matches[2]), matches[5], parseFloat(matches[3]), parseFloat(matches[4]));
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2Uvbm9kZS9wcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxzQ0FpUEM7SUFqUEQsU0FBZ0IsYUFBYSxDQUFDLE9BQWU7UUFFNUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUV0QyxJQUFJLFFBQWlDLENBQUM7WUFDdEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFHM0MsU0FBUyxTQUFTLENBQUMsR0FBVyxFQUFFLElBQVksRUFBRSxHQUFXLEVBQUUsSUFBWSxFQUFFLEdBQVc7Z0JBRW5GLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdCLElBQUksR0FBRyxLQUFLLE9BQU8sSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFFL0IsTUFBTSxJQUFJLEdBQWdCO3dCQUN6QixJQUFJLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQzt3QkFDbkIsR0FBRzt3QkFDSCxHQUFHO3dCQUNILElBQUk7d0JBQ0osSUFBSTt3QkFDSixHQUFHO3FCQUNILENBQUM7b0JBQ0YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBRW5CLElBQUksR0FBRyxLQUFLLE9BQU8sRUFBRSxDQUFDO3dCQUNyQixRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNqQixDQUFDO29CQUVELElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDdEIsTUFBTSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7d0JBQ3RCLENBQUM7d0JBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJ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