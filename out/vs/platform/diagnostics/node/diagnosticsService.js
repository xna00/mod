var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "os", "vs/base/common/async", "vs/base/common/json", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/id", "vs/base/node/pfs", "vs/base/node/ps", "vs/platform/diagnostics/common/diagnostics", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry"], function (require, exports, osLib, async_1, json_1, network_1, path_1, platform_1, uri_1, id_1, pfs_1, ps_1, diagnostics_1, files_1, productService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticsService = void 0;
    exports.collectWorkspaceStats = collectWorkspaceStats;
    exports.getMachineInfo = getMachineInfo;
    exports.collectLaunchConfigs = collectLaunchConfigs;
    const worksapceStatsCache = new Map();
    async function collectWorkspaceStats(folder, filter) {
        const cacheKey = `${folder}::${filter.join(':')}`;
        const cached = worksapceStatsCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const configFilePatterns = [
            { tag: 'grunt.js', filePattern: /^gruntfile\.js$/i },
            { tag: 'gulp.js', filePattern: /^gulpfile\.js$/i },
            { tag: 'tsconfig.json', filePattern: /^tsconfig\.json$/i },
            { tag: 'package.json', filePattern: /^package\.json$/i },
            { tag: 'jsconfig.json', filePattern: /^jsconfig\.json$/i },
            { tag: 'tslint.json', filePattern: /^tslint\.json$/i },
            { tag: 'eslint.json', filePattern: /^eslint\.json$/i },
            { tag: 'tasks.json', filePattern: /^tasks\.json$/i },
            { tag: 'launch.json', filePattern: /^launch\.json$/i },
            { tag: 'settings.json', filePattern: /^settings\.json$/i },
            { tag: 'webpack.config.js', filePattern: /^webpack\.config\.js$/i },
            { tag: 'project.json', filePattern: /^project\.json$/i },
            { tag: 'makefile', filePattern: /^makefile$/i },
            { tag: 'sln', filePattern: /^.+\.sln$/i },
            { tag: 'csproj', filePattern: /^.+\.csproj$/i },
            { tag: 'cmake', filePattern: /^.+\.cmake$/i },
            { tag: 'github-actions', filePattern: /^.+\.ya?ml$/i, relativePathPattern: /^\.github(?:\/|\\)workflows$/i },
            { tag: 'devcontainer.json', filePattern: /^devcontainer\.json$/i },
            { tag: 'dockerfile', filePattern: /^(dockerfile|docker\-compose\.ya?ml)$/i }
        ];
        const fileTypes = new Map();
        const configFiles = new Map();
        const MAX_FILES = 20000;
        function collect(root, dir, filter, token) {
            const relativePath = dir.substring(root.length + 1);
            return async_1.Promises.withAsyncBody(async (resolve) => {
                let files;
                try {
                    files = await pfs_1.Promises.readdir(dir, { withFileTypes: true });
                }
                catch (error) {
                    // Ignore folders that can't be read
                    resolve();
                    return;
                }
                if (token.count >= MAX_FILES) {
                    token.count += files.length;
                    token.maxReached = true;
                    resolve();
                    return;
                }
                let pending = files.length;
                if (pending === 0) {
                    resolve();
                    return;
                }
                let filesToRead = files;
                if (token.count + files.length > MAX_FILES) {
                    token.maxReached = true;
                    pending = MAX_FILES - token.count;
                    filesToRead = files.slice(0, pending);
                }
                token.count += files.length;
                for (const file of filesToRead) {
                    if (file.isDirectory()) {
                        if (!filter.includes(file.name)) {
                            await collect(root, (0, path_1.join)(dir, file.name), filter, token);
                        }
                        if (--pending === 0) {
                            resolve();
                            return;
                        }
                    }
                    else {
                        const index = file.name.lastIndexOf('.');
                        if (index >= 0) {
                            const fileType = file.name.substring(index + 1);
                            if (fileType) {
                                fileTypes.set(fileType, (fileTypes.get(fileType) ?? 0) + 1);
                            }
                        }
                        for (const configFile of configFilePatterns) {
                            if (configFile.relativePathPattern?.test(relativePath) !== false && configFile.filePattern.test(file.name)) {
                                configFiles.set(configFile.tag, (configFiles.get(configFile.tag) ?? 0) + 1);
                            }
                        }
                        if (--pending === 0) {
                            resolve();
                            return;
                        }
                    }
                }
            });
        }
        const statsPromise = async_1.Promises.withAsyncBody(async (resolve) => {
            const token = { count: 0, maxReached: false };
            await collect(folder, folder, filter, token);
            const launchConfigs = await collectLaunchConfigs(folder);
            resolve({
                configFiles: asSortedItems(configFiles),
                fileTypes: asSortedItems(fileTypes),
                fileCount: token.count,
                maxFilesReached: token.maxReached,
                launchConfigFiles: launchConfigs
            });
        });
        worksapceStatsCache.set(cacheKey, statsPromise);
        return statsPromise;
    }
    function asSortedItems(items) {
        return Array.from(items.entries(), ([name, count]) => ({ name: name, count: count }))
            .sort((a, b) => b.count - a.count);
    }
    function getMachineInfo() {
        const machineInfo = {
            os: `${osLib.type()} ${osLib.arch()} ${osLib.release()}`,
            memory: `${(osLib.totalmem() / files_1.ByteSize.GB).toFixed(2)}GB (${(osLib.freemem() / files_1.ByteSize.GB).toFixed(2)}GB free)`,
            vmHint: `${Math.round((id_1.virtualMachineHint.value() * 100))}%`,
        };
        const cpus = osLib.cpus();
        if (cpus && cpus.length > 0) {
            machineInfo.cpus = `${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`;
        }
        return machineInfo;
    }
    async function collectLaunchConfigs(folder) {
        try {
            const launchConfigs = new Map();
            const launchConfig = (0, path_1.join)(folder, '.vscode', 'launch.json');
            const contents = await pfs_1.Promises.readFile(launchConfig);
            const errors = [];
            const json = (0, json_1.parse)(contents.toString(), errors);
            if (errors.length) {
                console.log(`Unable to parse ${launchConfig}`);
                return [];
            }
            if ((0, json_1.getNodeType)(json) === 'object' && json['configurations']) {
                for (const each of json['configurations']) {
                    const type = each['type'];
                    if (type) {
                        if (launchConfigs.has(type)) {
                            launchConfigs.set(type, launchConfigs.get(type) + 1);
                        }
                        else {
                            launchConfigs.set(type, 1);
                        }
                    }
                }
            }
            return asSortedItems(launchConfigs);
        }
        catch (error) {
            return [];
        }
    }
    let DiagnosticsService = class DiagnosticsService {
        constructor(telemetryService, productService) {
            this.telemetryService = telemetryService;
            this.productService = productService;
        }
        formatMachineInfo(info) {
            const output = [];
            output.push(`OS Version:       ${info.os}`);
            output.push(`CPUs:             ${info.cpus}`);
            output.push(`Memory (System):  ${info.memory}`);
            output.push(`VM:               ${info.vmHint}`);
            return output.join('\n');
        }
        formatEnvironment(info) {
            const output = [];
            output.push(`Version:          ${this.productService.nameShort} ${this.productService.version} (${this.productService.commit || 'Commit unknown'}, ${this.productService.date || 'Date unknown'})`);
            output.push(`OS Version:       ${osLib.type()} ${osLib.arch()} ${osLib.release()}`);
            const cpus = osLib.cpus();
            if (cpus && cpus.length > 0) {
                output.push(`CPUs:             ${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`);
            }
            output.push(`Memory (System):  ${(osLib.totalmem() / files_1.ByteSize.GB).toFixed(2)}GB (${(osLib.freemem() / files_1.ByteSize.GB).toFixed(2)}GB free)`);
            if (!platform_1.isWindows) {
                output.push(`Load (avg):       ${osLib.loadavg().map(l => Math.round(l)).join(', ')}`); // only provided on Linux/macOS
            }
            output.push(`VM:               ${Math.round((id_1.virtualMachineHint.value() * 100))}%`);
            output.push(`Screen Reader:    ${info.screenReader ? 'yes' : 'no'}`);
            output.push(`Process Argv:     ${info.mainArguments.join(' ')}`);
            output.push(`GPU Status:       ${this.expandGPUFeatures(info.gpuFeatureStatus)}`);
            return output.join('\n');
        }
        async getPerformanceInfo(info, remoteData) {
            return Promise.all([(0, ps_1.listProcesses)(info.mainPID), this.formatWorkspaceMetadata(info)]).then(async (result) => {
                let [rootProcess, workspaceInfo] = result;
                let processInfo = this.formatProcessList(info, rootProcess);
                remoteData.forEach(diagnostics => {
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(diagnostics)) {
                        processInfo += `\n${diagnostics.errorMessage}`;
                        workspaceInfo += `\n${diagnostics.errorMessage}`;
                    }
                    else {
                        processInfo += `\n\nRemote: ${diagnostics.hostName}`;
                        if (diagnostics.processes) {
                            processInfo += `\n${this.formatProcessList(info, diagnostics.processes)}`;
                        }
                        if (diagnostics.workspaceMetadata) {
                            workspaceInfo += `\n|  Remote: ${diagnostics.hostName}`;
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                workspaceInfo += `|    Folder (${folder}): ${countMessage}`;
                                workspaceInfo += this.formatWorkspaceStats(metadata);
                            }
                        }
                    }
                });
                return {
                    processInfo,
                    workspaceInfo
                };
            });
        }
        async getSystemInfo(info, remoteData) {
            const { memory, vmHint, os, cpus } = getMachineInfo();
            const systemInfo = {
                os,
                memory,
                cpus,
                vmHint,
                processArgs: `${info.mainArguments.join(' ')}`,
                gpuStatus: info.gpuFeatureStatus,
                screenReader: `${info.screenReader ? 'yes' : 'no'}`,
                remoteData
            };
            if (!platform_1.isWindows) {
                systemInfo.load = `${osLib.loadavg().map(l => Math.round(l)).join(', ')}`;
            }
            if (platform_1.isLinux) {
                systemInfo.linuxEnv = {
                    desktopSession: process.env['DESKTOP_SESSION'],
                    xdgSessionDesktop: process.env['XDG_SESSION_DESKTOP'],
                    xdgCurrentDesktop: process.env['XDG_CURRENT_DESKTOP'],
                    xdgSessionType: process.env['XDG_SESSION_TYPE']
                };
            }
            return Promise.resolve(systemInfo);
        }
        async getDiagnostics(info, remoteDiagnostics) {
            const output = [];
            return (0, ps_1.listProcesses)(info.mainPID).then(async (rootProcess) => {
                // Environment Info
                output.push('');
                output.push(this.formatEnvironment(info));
                // Process List
                output.push('');
                output.push(this.formatProcessList(info, rootProcess));
                // Workspace Stats
                if (info.windows.some(window => window.folderURIs && window.folderURIs.length > 0 && !window.remoteAuthority)) {
                    output.push('');
                    output.push('Workspace Stats: ');
                    output.push(await this.formatWorkspaceMetadata(info));
                }
                remoteDiagnostics.forEach(diagnostics => {
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(diagnostics)) {
                        output.push(`\n${diagnostics.errorMessage}`);
                    }
                    else {
                        output.push('\n\n');
                        output.push(`Remote:           ${diagnostics.hostName}`);
                        output.push(this.formatMachineInfo(diagnostics.machineInfo));
                        if (diagnostics.processes) {
                            output.push(this.formatProcessList(info, diagnostics.processes));
                        }
                        if (diagnostics.workspaceMetadata) {
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                output.push(`Folder (${folder}): ${countMessage}`);
                                output.push(this.formatWorkspaceStats(metadata));
                            }
                        }
                    }
                });
                output.push('');
                output.push('');
                return output.join('\n');
            });
        }
        formatWorkspaceStats(workspaceStats) {
            const output = [];
            const lineLength = 60;
            let col = 0;
            const appendAndWrap = (name, count) => {
                const item = ` ${name}(${count})`;
                if (col + item.length > lineLength) {
                    output.push(line);
                    line = '|                 ';
                    col = line.length;
                }
                else {
                    col += item.length;
                }
                line += item;
            };
            // File Types
            let line = '|      File types:';
            const maxShown = 10;
            const max = workspaceStats.fileTypes.length > maxShown ? maxShown : workspaceStats.fileTypes.length;
            for (let i = 0; i < max; i++) {
                const item = workspaceStats.fileTypes[i];
                appendAndWrap(item.name, item.count);
            }
            output.push(line);
            // Conf Files
            if (workspaceStats.configFiles.length >= 0) {
                line = '|      Conf files:';
                col = 0;
                workspaceStats.configFiles.forEach((item) => {
                    appendAndWrap(item.name, item.count);
                });
                output.push(line);
            }
            if (workspaceStats.launchConfigFiles.length > 0) {
                let line = '|      Launch Configs:';
                workspaceStats.launchConfigFiles.forEach(each => {
                    const item = each.count > 1 ? ` ${each.name}(${each.count})` : ` ${each.name}`;
                    line += item;
                });
                output.push(line);
            }
            return output.join('\n');
        }
        expandGPUFeatures(gpuFeatures) {
            const longestFeatureName = Math.max(...Object.keys(gpuFeatures).map(feature => feature.length));
            // Make columns aligned by adding spaces after feature name
            return Object.keys(gpuFeatures).map(feature => `${feature}:  ${' '.repeat(longestFeatureName - feature.length)}  ${gpuFeatures[feature]}`).join('\n                  ');
        }
        formatWorkspaceMetadata(info) {
            const output = [];
            const workspaceStatPromises = [];
            info.windows.forEach(window => {
                if (window.folderURIs.length === 0 || !!window.remoteAuthority) {
                    return;
                }
                output.push(`|  Window (${window.title})`);
                window.folderURIs.forEach(uriComponents => {
                    const folderUri = uri_1.URI.revive(uriComponents);
                    if (folderUri.scheme === network_1.Schemas.file) {
                        const folder = folderUri.fsPath;
                        workspaceStatPromises.push(collectWorkspaceStats(folder, ['node_modules', '.git']).then(stats => {
                            let countMessage = `${stats.fileCount} files`;
                            if (stats.maxFilesReached) {
                                countMessage = `more than ${countMessage}`;
                            }
                            output.push(`|    Folder (${(0, path_1.basename)(folder)}): ${countMessage}`);
                            output.push(this.formatWorkspaceStats(stats));
                        }).catch(error => {
                            output.push(`|      Error: Unable to collect workspace stats for folder ${folder} (${error.toString()})`);
                        }));
                    }
                    else {
                        output.push(`|    Folder (${folderUri.toString()}): Workspace stats not available.`);
                    }
                });
            });
            return Promise.all(workspaceStatPromises)
                .then(_ => output.join('\n'))
                .catch(e => `Unable to collect workspace stats: ${e}`);
        }
        formatProcessList(info, rootProcess) {
            const mapProcessToName = new Map();
            info.windows.forEach(window => mapProcessToName.set(window.pid, `window [${window.id}] (${window.title})`));
            info.pidToNames.forEach(({ pid, name }) => mapProcessToName.set(pid, name));
            const output = [];
            output.push('CPU %\tMem MB\t   PID\tProcess');
            if (rootProcess) {
                this.formatProcessItem(info.mainPID, mapProcessToName, output, rootProcess, 0);
            }
            return output.join('\n');
        }
        formatProcessItem(mainPid, mapProcessToName, output, item, indent) {
            const isRoot = (indent === 0);
            // Format name with indent
            let name;
            if (isRoot) {
                name = item.pid === mainPid ? `${this.productService.applicationName} main` : 'remote agent';
            }
            else {
                if (mapProcessToName.has(item.pid)) {
                    name = mapProcessToName.get(item.pid);
                }
                else {
                    name = `${'  '.repeat(indent)} ${item.name}`;
                }
            }
            const memory = process.platform === 'win32' ? item.mem : (osLib.totalmem() * (item.mem / 100));
            output.push(`${item.load.toFixed(0).padStart(5, ' ')}\t${(memory / files_1.ByteSize.MB).toFixed(0).padStart(6, ' ')}\t${item.pid.toFixed(0).padStart(6, ' ')}\t${name}`);
            // Recurse into children if any
            if (Array.isArray(item.children)) {
                item.children.forEach(child => this.formatProcessItem(mainPid, mapProcessToName, output, child, indent + 1));
            }
        }
        async getWorkspaceFileExtensions(workspace) {
            const items = new Set();
            for (const { uri } of workspace.folders) {
                const folderUri = uri_1.URI.revive(uri);
                if (folderUri.scheme !== network_1.Schemas.file) {
                    continue;
                }
                const folder = folderUri.fsPath;
                try {
                    const stats = await collectWorkspaceStats(folder, ['node_modules', '.git']);
                    stats.fileTypes.forEach(item => items.add(item.name));
                }
                catch { }
            }
            return { extensions: [...items] };
        }
        async reportWorkspaceStats(workspace) {
            for (const { uri } of workspace.folders) {
                const folderUri = uri_1.URI.revive(uri);
                if (folderUri.scheme !== network_1.Schemas.file) {
                    continue;
                }
                const folder = folderUri.fsPath;
                try {
                    const stats = await collectWorkspaceStats(folder, ['node_modules', '.git']);
                    this.telemetryService.publicLog2('workspace.stats', {
                        'workspace.id': workspace.telemetryId,
                        rendererSessionId: workspace.rendererSessionId
                    });
                    stats.fileTypes.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.file', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                    stats.launchConfigFiles.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.launchConfigFile', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                    stats.configFiles.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.configFiles', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                }
                catch {
                    // Report nothing if collecting metadata fails.
                }
            }
        }
    };
    exports.DiagnosticsService = DiagnosticsService;
    exports.DiagnosticsService = DiagnosticsService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, productService_1.IProductService)
    ], DiagnosticsService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kaWFnbm9zdGljcy9ub2RlL2RpYWdub3N0aWNzU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBNEJBLHNEQXVIQztJQU9ELHdDQWNDO0lBRUQsb0RBK0JDO0lBOUtELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQW1DLENBQUM7SUFDaEUsS0FBSyxVQUFVLHFCQUFxQixDQUFDLE1BQWMsRUFBRSxNQUFnQjtRQUMzRSxNQUFNLFFBQVEsR0FBRyxHQUFHLE1BQU0sS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDbEQsTUFBTSxNQUFNLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELElBQUksTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxNQUFNLGtCQUFrQixHQUF5QjtZQUNoRCxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFO1lBQ3BELEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLEVBQUU7WUFDbEQsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRTtZQUMxRCxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFO1lBQ3hELEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUU7WUFDMUQsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRTtZQUN0RCxFQUFFLEdBQUcsRUFBRSxhQUFhLEVB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