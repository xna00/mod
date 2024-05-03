/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/tree/dataTree", "vs/base/common/async", "vs/base/parts/contextmenu/electron-sandbox/contextmenu", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/diagnostics/common/diagnostics", "vs/platform/files/common/files", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/native/common/nativeHostService", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/window/electron-sandbox/window", "vs/base/browser/keyboardEvent", "vs/base/browser/window", "vs/css!./media/processExplorer", "vs/base/browser/ui/codicons/codiconStyles"], function (require, exports, nls_1, dom_1, dataTree_1, async_1, contextmenu_1, globals_1, diagnostics_1, files_1, mainProcessService_1, nativeHostService_1, iconsStyleSheet_1, window_1, keyboardEvent_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startup = startup;
    const DEBUG_FLAGS_PATTERN = /\s--inspect(?:-brk|port)?=(?<port>\d+)?/;
    const DEBUG_PORT_PATTERN = /\s--inspect-port=(?<port>\d+)/;
    class ProcessListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (isProcessItem(element)) {
                return 'process';
            }
            if (isMachineProcessInformation(element)) {
                return 'machine';
            }
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return 'error';
            }
            if (isProcessInformation(element)) {
                return 'header';
            }
            return '';
        }
    }
    class ProcessTreeDataSource {
        hasChildren(element) {
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return false;
            }
            if (isProcessItem(element)) {
                return !!element.children?.length;
            }
            else {
                return true;
            }
        }
        getChildren(element) {
            if (isProcessItem(element)) {
                return element.children ? element.children : [];
            }
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return [];
            }
            if (isProcessInformation(element)) {
                // If there are multiple process roots, return these, otherwise go directly to the root process
                if (element.processRoots.length > 1) {
                    return element.processRoots;
                }
                else {
                    return [element.processRoots[0].rootProcess];
                }
            }
            if (isMachineProcessInformation(element)) {
                return [element.rootProcess];
            }
            return [element.processes];
        }
    }
    class ProcessHeaderTreeRenderer {
        constructor() {
            this.templateId = 'header';
        }
        renderTemplate(container) {
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            const name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            const CPU = (0, dom_1.append)(row, (0, dom_1.$)('.cpu'));
            const memory = (0, dom_1.append)(row, (0, dom_1.$)('.memory'));
            const PID = (0, dom_1.append)(row, (0, dom_1.$)('.pid'));
            return { name, CPU, memory, PID };
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = (0, nls_1.localize)('name', "Process Name");
            templateData.CPU.textContent = (0, nls_1.localize)('cpu', "CPU (%)");
            templateData.PID.textContent = (0, nls_1.localize)('pid', "PID");
            templateData.memory.textContent = (0, nls_1.localize)('memory', "Memory (MB)");
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class MachineRenderer {
        constructor() {
            this.templateId = 'machine';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = node.element.name;
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class ErrorRenderer {
        constructor() {
            this.templateId = 'error';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = node.element.errorMessage;
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class ProcessRenderer {
        constructor(platform, totalMem, mapPidToName) {
            this.platform = platform;
            this.totalMem = totalMem;
            this.mapPidToName = mapPidToName;
            this.templateId = 'process';
        }
        renderTemplate(container) {
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            const name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            const CPU = (0, dom_1.append)(row, (0, dom_1.$)('.cpu'));
            const memory = (0, dom_1.append)(row, (0, dom_1.$)('.memory'));
            const PID = (0, dom_1.append)(row, (0, dom_1.$)('.pid'));
            return { name, CPU, PID, memory };
        }
        renderElement(node, index, templateData, height) {
            const { element } = node;
            const pid = element.pid.toFixed(0);
            let name = element.name;
            if (this.mapPidToName.has(element.pid)) {
                name = this.mapPidToName.get(element.pid);
            }
            templateData.name.textContent = name;
            templateData.name.title = element.cmd;
            templateData.CPU.textContent = element.load.toFixed(0);
            templateData.PID.textContent = pid;
            templateData.PID.parentElement.id = `pid-${pid}`;
            const memory = this.platform === 'win32' ? element.mem : (this.totalMem * (element.mem / 100));
            templateData.memory.textContent = (memory / files_1.ByteSize.MB).toFixed(0);
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    function isMachineProcessInformation(item) {
        return !!item.name && !!item.rootProcess;
    }
    function isProcessInformation(item) {
        return !!item.processRoots;
    }
    function isProcessItem(item) {
        return !!item.pid;
    }
    class ProcessExplorer {
        constructor(windowId, data) {
            this.data = data;
            this.mapPidToName = new Map();
            const mainProcessService = new mainProcessService_1.ElectronIPCMainProcessService(windowId);
            this.nativeHostService = new nativeHostService_1.NativeHostService(windowId, mainProcessService);
            this.applyStyles(data.styles);
            this.setEventHandlers(data);
            globals_1.ipcRenderer.on('vscode:pidToNameResponse', (event, pidToNames) => {
                this.mapPidToName.clear();
                for (const [pid, name] of pidToNames) {
                    this.mapPidToName.set(pid, name);
                }
            });
            globals_1.ipcRenderer.on('vscode:listProcessesResponse', async (event, processRoots) => {
                processRoots.forEach((info, index) => {
                    if (isProcessItem(info.rootProcess)) {
                        info.rootProcess.name = index === 0 ? `${this.data.applicationName} main` : 'remote agent';
                    }
                });
                if (!this.tree) {
                    await this.createProcessTree(processRoots);
                }
                else {
                    this.tree.setInput({ processes: { processRoots } });
                    this.tree.layout(window_2.mainWindow.innerHeight, window_2.mainWindow.innerWidth);
                }
                this.requestProcessList(0);
            });
            this.lastRequestTime = Date.now();
            globals_1.ipcRenderer.send('vscode:pidToNameRequest');
            globals_1.ipcRenderer.send('vscode:listProcesses');
        }
        setEventHandlers(data) {
            window_2.mainWindow.document.onkeydown = (e) => {
                const cmdOrCtrlKey = data.platform === 'darwin' ? e.metaKey : e.ctrlKey;
                // Cmd/Ctrl + w closes issue window
                if (cmdOrCtrlKey && e.keyCode === 87) {
                    e.stopPropagation();
                    e.preventDefault();
                    globals_1.ipcRenderer.send('vscode:closeProcessExplorer');
                }
                // Cmd/Ctrl + zooms in
                if (cmdOrCtrlKey && e.keyCode === 187) {
                    (0, window_1.zoomIn)(window_2.mainWindow);
                }
                // Cmd/Ctrl - zooms out
                if (cmdOrCtrlKey && e.keyCode === 189) {
                    (0, window_1.zoomOut)(window_2.mainWindow);
                }
            };
        }
        async createProcessTree(processRoots) {
            const container = window_2.mainWindow.document.getElementById('process-list');
            if (!container) {
                return;
            }
            const { totalmem } = await this.nativeHostService.getOSStatistics();
            const renderers = [
                new ProcessRenderer(this.data.platform, totalmem, this.mapPidToName),
                new ProcessHeaderTreeRenderer(),
                new MachineRenderer(),
                new ErrorRenderer()
            ];
            this.tree = new dataTree_1.DataTree('processExplorer', container, new ProcessListDelegate(), renderers, new ProcessTreeDataSource(), {
                identityProvider: {
                    getId: (element) => {
                        if (isProcessItem(element)) {
                            return element.pid.toString();
                        }
                        if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                            return element.hostName;
                        }
                        if (isProcessInformation(element)) {
                            return 'processes';
                        }
                        if (isMachineProcessInformation(element)) {
                            return element.name;
                        }
                        return 'header';
                    }
                }
            });
            this.tree.setInput({ processes: { processRoots } });
            this.tree.layout(window_2.mainWindow.innerHeight, window_2.mainWindow.innerWidth);
            this.tree.onKeyDown(e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.keyCode === 35 /* KeyCode.KeyE */ && event.altKey) {
                    const selectionPids = this.getSelectedPids();
                    void Promise.all(selectionPids.map((pid) => this.nativeHostService.killProcess(pid, 'SIGTERM'))).then(() => this.tree?.refresh());
                }
            });
            this.tree.onContextMenu(e => {
                if (isProcessItem(e.element)) {
                    this.showContextMenu(e.element, true);
                }
            });
            container.style.height = `${window_2.mainWindow.innerHeight}px`;
            window_2.mainWindow.addEventListener('resize', () => {
                container.style.height = `${window_2.mainWindow.innerHeight}px`;
                this.tree?.layout(window_2.mainWindow.innerHeight, window_2.mainWindow.innerWidth);
            });
        }
        isDebuggable(cmd) {
            const matches = DEBUG_FLAGS_PATTERN.exec(cmd);
            return (matches && matches.groups.port !== '0') || cmd.indexOf('node ') >= 0 || cmd.indexOf('node.exe') >= 0;
        }
        attachTo(item) {
            const config = {
                type: 'node',
                request: 'attach',
                name: `process ${item.pid}`
            };
            let matches = DEBUG_FLAGS_PATTERN.exec(item.cmd);
            if (matches) {
                config.port = Number(matches.groups.port);
            }
            else {
                // no port -> try to attach via pid (send SIGUSR1)
                config.processId = String(item.pid);
            }
            // a debug-port=n or inspect-port=n overrides the port
            matches = DEBUG_PORT_PATTERN.exec(item.cmd);
            if (matches) {
                // override port
                config.port = Number(matches.groups.port);
            }
            globals_1.ipcRenderer.send('vscode:workbenchCommand', { id: 'debug.startFromConfig', from: 'processExplorer', args: [config] });
        }
        applyStyles(styles) {
            const styleElement = (0, dom_1.createStyleSheet)();
            const content = [];
            if (styles.listFocusBackground) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list:focus .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`);
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list:focus .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list:focus .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`);
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list:focus .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list-row:hover:not(.selected):not(.focused) { background-color: ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list-row:hover:not(.selected):not(.focused) { color: ${styles.listHoverForeground}; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            // Scrollbars
            if (styles.scrollbarShadowColor) {
                content.push(`
				.monaco-scrollable-element > .shadow.top {
					box-shadow: ${styles.scrollbarShadowColor} 0 6px 6px -6px inset;
				}

				.monaco-scrollable-element > .shadow.left {
					box-shadow: ${styles.scrollbarShadowColor} 6px 0 6px -6px inset;
				}

				.monaco-scrollable-element > .shadow.top.left {
					box-shadow: ${styles.scrollbarShadowColor} 6px 6px 6px -6px inset;
				}
			`);
            }
            if (styles.scrollbarSliderBackgroundColor) {
                content.push(`
				.monaco-scrollable-element > .scrollbar > .slider {
					background: ${styles.scrollbarSliderBackgroundColor};
				}
			`);
            }
            if (styles.scrollbarSliderHoverBackgroundColor) {
                content.push(`
				.monaco-scrollable-element > .scrollbar > .slider:hover {
					background: ${styles.scrollbarSliderHoverBackgroundColor};
				}
			`);
            }
            if (styles.scrollbarSliderActiveBackgroundColor) {
                content.push(`
				.monaco-scrollable-element > .scrollbar > .slider.active {
					background: ${styles.scrollbarSliderActiveBackgroundColor};
				}
			`);
            }
            styleElement.textContent = content.join('\n');
            if (styles.color) {
                window_2.mainWindow.document.body.style.color = styles.color;
            }
        }
        showContextMenu(item, isLocal) {
            const items = [];
            const pid = Number(item.pid);
            if (isLocal) {
                items.push({
                    accelerator: 'Alt+E',
                    label: (0, nls_1.localize)('killProcess', "Kill Process"),
                    click: () => {
                        this.nativeHostService.killProcess(pid, 'SIGTERM');
                    }
                });
                items.push({
                    label: (0, nls_1.localize)('forceKillProcess', "Force Kill Process"),
                    click: () => {
                        this.nativeHostService.killProcess(pid, 'SIGKILL');
                    }
                });
                items.push({
                    type: 'separator'
                });
            }
            items.push({
                label: (0, nls_1.localize)('copy', "Copy"),
                click: () => {
                    // Collect the selected pids
                    const selectionPids = this.getSelectedPids();
                    // If the selection does not contain the right clicked item, copy the right clicked
                    // item only.
                    if (!selectionPids?.includes(pid)) {
                        selectionPids.length = 0;
                        selectionPids.push(pid);
                    }
                    const rows = selectionPids?.map(e => window_2.mainWindow.document.getElementById(`pid-${e}`)).filter(e => !!e);
                    if (rows) {
                        const text = rows.map(e => e.innerText).filter(e => !!e);
                        this.nativeHostService.writeClipboardText(text.join('\n'));
                    }
                }
            });
            items.push({
                label: (0, nls_1.localize)('copyAll', "Copy All"),
                click: () => {
                    const processList = window_2.mainWindow.document.getElementById('process-list');
                    if (processList) {
                        this.nativeHostService.writeClipboardText(processList.innerText);
                    }
                }
            });
            if (item && isLocal && this.isDebuggable(item.cmd)) {
                items.push({
                    type: 'separator'
                });
                items.push({
                    label: (0, nls_1.localize)('debug', "Debug"),
                    click: () => {
                        this.attachTo(item);
                    }
                });
            }
            (0, contextmenu_1.popup)(items);
        }
        requestProcessList(totalWaitTime) {
            setTimeout(() => {
                const nextRequestTime = Date.now();
                const waited = totalWaitTime + nextRequestTime - this.lastRequestTime;
                this.lastRequestTime = nextRequestTime;
                // Wait at least a second between requests.
                if (waited > 1000) {
                    globals_1.ipcRenderer.send('vscode:pidToNameRequest');
                    globals_1.ipcRenderer.send('vscode:listProcesses');
                }
                else {
                    this.requestProcessList(waited);
                }
            }, 200);
        }
        getSelectedPids() {
            return this.tree?.getSelection()?.map(e => {
                if (!e || !('pid' in e)) {
                    return undefined;
                }
                return e.pid;
            }).filter(e => !!e);
        }
    }
    function createCodiconStyleSheet() {
        const codiconStyleSheet = (0, dom_1.createStyleSheet)();
        codiconStyleSheet.id = 'codiconStyles';
        const iconsStyleSheet = (0, iconsStyleSheet_1.getIconsStyleSheet)(undefined);
        function updateAll() {
            codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
        }
        const delayer = new async_1.RunOnceScheduler(updateAll, 0);
        iconsStyleSheet.onDidChange(() => delayer.schedule());
        delayer.schedule();
    }
    function startup(configuration) {
        const platformClass = configuration.data.platform === 'win32' ? 'windows' : configuration.data.platform === 'linux' ? 'linux' : 'mac';
        window_2.mainWindow.document.body.classList.add(platformClass); // used by our fonts
        createCodiconStyleSheet();
        (0, window_1.applyZoom)(configuration.data.zoomLevel, window_2.mainWindow);
        new ProcessExplorer(configuration.windowId, configuration.data);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzc0V4cGxvcmVyTWFpbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvY29kZS9lbGVjdHJvbi1zYW5kYm94L3Byb2Nlc3NFeHBsb3Jlci9wcm9jZXNzRXhwbG9yZXJNYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBOGtCaEcsMEJBT0M7SUEzakJELE1BQU0sbUJBQW1CLEdBQUcseUNBQXlDLENBQUM7SUFDdEUsTUFBTSxrQkFBa0IsR0FBRywrQkFBK0IsQ0FBQztJQUUzRCxNQUFNLG1CQUFtQjtRQUN4QixTQUFTLENBQUMsT0FBeUU7WUFDbEYsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQThGO1lBQzNHLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzFDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLElBQUEscUNBQXVCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxPQUFPLENBQUM7WUFDaEIsQ0FBQztZQUVELElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsT0FBTyxRQUFRLENBQUM7WUFDakIsQ0FBQztZQUVELE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztLQUNEO0lBWUQsTUFBTSxxQkFBcUI7UUFDMUIsV0FBVyxDQUFDLE9BQTRHO1lBQ3ZILElBQUksSUFBQSxxQ0FBdUIsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMs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