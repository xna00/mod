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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/base/browser/dom", "vs/css!./media/developer"], function (require, exports, buffer_1, lifecycle_1, uri_1, nls_1, actionCommonCategories_1, configuration_1, contextkey_1, files_1, opener_1, quickInput_1, terminal_1, workspace_1, terminal_2, terminalActions_1, terminalExtensions_1, terminalContextKey_1, dom_1) {
    "use strict";
    var DevModeContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.showTextureAtlas" /* TerminalCommandId.ShowTextureAtlas */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showTextureAtlas', 'Show Terminal Texture Atlas'),
        category: actionCommonCategories_1.Categories.Developer,
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.isOpen),
        run: async (c, accessor) => {
            const fileService = accessor.get(files_1.IFileService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const bitmap = await c.service.activeInstance?.xterm?.textureAtlas;
            if (!bitmap) {
                return;
            }
            const cwdUri = workspaceContextService.getWorkspace().folders[0].uri;
            const fileUri = uri_1.URI.joinPath(cwdUri, 'textureAtlas.png');
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('bitmaprenderer');
            if (!ctx) {
                return;
            }
            ctx.transferFromImageBitmap(bitmap);
            const blob = await new Promise((res) => canvas.toBlob(res));
            if (!blob) {
                return;
            }
            await fileService.writeFile(fileUri, buffer_1.VSBuffer.wrap(new Uint8Array(await blob.arrayBuffer())));
            openerService.open(fileUri);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.writeDataToTerminal" /* TerminalCommandId.WriteDataToTerminal */,
        title: (0, nls_1.localize2)('workbench.action.terminal.writeDataToTerminal', 'Write Data to Terminal'),
        category: actionCommonCategories_1.Categories.Developer,
        run: async (c, accessor) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const instance = await c.service.getActiveOrCreateInstance();
            await c.service.revealActiveTerminal();
            await instance.processReady;
            if (!instance.xterm) {
                throw new Error('Cannot write data to terminal if xterm isn\'t initialized');
            }
            const data = await quickInputService.input({
                value: '',
                placeHolder: 'Enter data, use \\x to escape',
                prompt: (0, nls_1.localize)('workbench.action.terminal.writeDataToTerminal.prompt', "Enter data to write directly to the terminal, bypassing the pty"),
            });
            if (!data) {
                return;
            }
            let escapedData = data
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r');
            while (true) {
                const match = escapedData.match(/\\x([0-9a-fA-F]{2})/);
                if (match === null || match.index === undefined || match.length < 2) {
                    break;
                }
                escapedData = escapedData.slice(0, match.index) + String.fromCharCode(parseInt(match[1], 16)) + escapedData.slice(match.index + 4);
            }
            const xterm = instance.xterm;
            xterm._writeText(escapedData);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.restartPtyHost" /* TerminalCommandId.RestartPtyHost */,
        title: (0, nls_1.localize2)('workbench.action.terminal.restartPtyHost', 'Restart Pty Host'),
        category: actionCommonCategories_1.Categories.Developer,
        run: async (c, accessor) => {
            const logService = accessor.get(terminal_1.ITerminalLogService);
            const backends = Array.from(c.instanceService.getRegisteredBackends());
            const unresponsiveBackends = backends.filter(e => !e.isResponsive);
            // Restart only unresponsive backends if there are any
            const restartCandidates = unresponsiveBackends.length > 0 ? unresponsiveBackends : backends;
            for (const backend of restartCandidates) {
                logService.warn(`Restarting pty host for authority "${backend.remoteAuthority}"`);
                backend.restartPtyHost();
            }
        }
    });
    let DevModeContribution = class DevModeContribution extends lifecycle_1.Disposable {
        static { DevModeContribution_1 = this; }
        static { this.ID = 'terminal.devMode'; }
        static get(instance) {
            return instance.getContribution(DevModeContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _configurationService, _terminalService) {
            super();
            this._instance = _instance;
            this._configurationService = _configurationService;
            this._terminalService = _terminalService;
            this._activeDevModeDisposables = new lifecycle_1.MutableDisposable();
            this._currentColor = 0;
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */)) {
                    this._updateDevMode();
                }
            }));
        }
        xtermReady(xterm) {
            this._xterm = xterm;
            this._updateDevMode();
        }
        _updateDevMode() {
            const devMode = this._isEnabled();
            this._xterm?.raw.element?.classList.toggle('dev-mode', devMode);
            // Text area syncing
            if (this._xterm?.raw.textarea) {
                const font = this._terminalService.configHelper.getFont((0, dom_1.getWindow)(this._xterm.raw.textarea));
                this._xterm.raw.textarea.style.fontFamily = font.fontFamily;
                this._xterm.raw.textarea.style.fontSize = `${font.fontSize}px`;
            }
            // Sequence markers
            const commandDetection = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (devMode) {
                if (commandDetection) {
                    const commandDecorations = new Map();
                    this._activeDevModeDisposables.value = (0, lifecycle_1.combinedDisposable)(commandDetection.onCommandFinished(command => {
                        const colorClass = `color-${this._currentColor}`;
                        const decorations = [];
                        commandDecorations.set(command, decorations);
                        if (command.promptStartMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.promptStartMarker
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'A';
                                    e.classList.add('xterm-sequence-decoration', 'top', 'left', colorClass);
                                });
                            }
                        }
                        if (command.marker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.marker,
                                x: command.startX
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'B';
                                    e.classList.add('xterm-sequence-decoration', 'top', 'right', colorClass);
                                });
                            }
                        }
                        if (command.executedMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.executedMarker,
                                x: command.executedX
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'C';
                                    e.classList.add('xterm-sequence-decoration', 'bottom', 'left', colorClass);
                                });
                            }
                        }
                        if (command.endMarker) {
                            const d = this._instance.xterm.raw?.registerDecoration({
                                marker: command.endMarker
                            });
                            if (d) {
                                decorations.push(d);
                                d.onRender(e => {
                                    e.textContent = 'D';
                                    e.classList.add('xterm-sequence-decoration', 'bottom', 'right', colorClass);
                                });
                            }
                        }
                        this._currentColor = (this._currentColor + 1) % 2;
                    }), commandDetection.onCommandInvalidated(commands => {
                        for (const c of commands) {
                            const decorations = commandDecorations.get(c);
                            if (decorations) {
                                (0, lifecycle_1.dispose)(decorations);
                            }
                            commandDecorations.delete(c);
                        }
                    }));
                }
                else {
                    this._activeDevModeDisposables.value = this._instance.capabilities.onDidAddCapabilityType(e => {
                        if (e === 2 /* TerminalCapability.CommandDetection */) {
                            this._updateDevMode();
                        }
                    });
                }
            }
            else {
                this._activeDevModeDisposables.clear();
            }
        }
        _isEnabled() {
            return this._configurationService.getValue("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */) || false;
        }
    };
    DevModeContribution = DevModeContribution_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, terminal_2.ITerminalService)
    ], DevModeContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(DevModeContribution.ID, DevModeContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZGV2ZWxvcGVyLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2RldmVsb3Blci9icm93c2VyL3Rlcm1pbmFsLmRldmVsb3Blci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxJQUFBLHdDQUFzQixFQUFDO1FBQ3RCLEVBQUUsdUZBQW9DO1FBQ3RDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw0Q0FBNEMsRUFBRSw2QkFBNkIsQ0FBQztRQUM3RixRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO1FBQzlCLFlBQVksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxNQUFNLENBQUM7UUFDM0QsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDMUIsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7WUFDL0MsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9DQUF3QixDQUFDLENBQUM7WUFDdkUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDO1lBQ25FLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFH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