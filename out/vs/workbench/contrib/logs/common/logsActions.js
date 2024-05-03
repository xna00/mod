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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/output/common/output", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/logs/common/defaultLogLevels", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/lifecycle"], function (require, exports, nls, actions_1, log_1, quickInput_1, uri_1, files_1, environmentService_1, resources_1, editorService_1, output_1, telemetryUtils_1, defaultLogLevels_1, codicons_1, themables_1, lifecycle_1) {
    "use strict";
    var SetLogLevelAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWindowSessionLogFileAction = exports.SetLogLevelAction = void 0;
    let SetLogLevelAction = class SetLogLevelAction extends actions_1.Action {
        static { SetLogLevelAction_1 = this; }
        static { this.ID = 'workbench.action.setLogLevel'; }
        static { this.TITLE = nls.localize2('setLogLevel', "Set Log Level..."); }
        constructor(id, label, quickInputService, loggerService, outputService, defaultLogLevelsService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.loggerService = loggerService;
            this.outputService = outputService;
            this.defaultLogLevelsService = defaultLogLevelsService;
        }
        async run() {
            const logLevelOrChannel = await this.selectLogLevelOrChannel();
            if (logLevelOrChannel !== null) {
                if ((0, log_1.isLogLevel)(logLevelOrChannel)) {
                    this.loggerService.setLogLevel(logLevelOrChannel);
                }
                else {
                    await this.setLogLevelForChannel(logLevelOrChannel);
                }
            }
        }
        async selectLogLevelOrChannel() {
            const defaultLogLevels = await this.defaultLogLevelsService.getDefaultLogLevels();
            const extensionLogs = [], logs = [];
            const logLevel = this.loggerService.getLogLevel();
            for (const channel of this.outputService.getChannelDescriptors()) {
                if (!SetLogLevelAction_1.isLevelSettable(channel) || !channel.file) {
                    continue;
                }
                const channelLogLevel = this.loggerService.getLogLevel(channel.file) ?? logLevel;
                const item = { id: channel.id, resource: channel.file, label: channel.label, description: channelLogLevel !== logLevel ? this.getLabel(channelLogLevel) : undefined, extensionId: channel.extensionId };
                if (channel.extensionId) {
                    extensionLogs.push(item);
                }
                else {
                    logs.push(item);
                }
            }
            const entries = [];
            entries.push({ type: 'separator', label: nls.localize('all', "All") });
            entries.push(...this.getLogLevelEntries(defaultLogLevels.default, this.loggerService.getLogLevel(), true));
            if (extensionLogs.length) {
                entries.push({ type: 'separator', label: nls.localize('extensionLogs', "Extension Logs") });
                entries.push(...extensionLogs.sort((a, b) => a.label.localeCompare(b.label)));
            }
            entries.push({ type: 'separator', label: nls.localize('loggers', "Logs") });
            entries.push(...logs.sort((a, b) => a.label.localeCompare(b.label)));
            return new Promise((resolve, reject) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = nls.localize('selectlog', "Set Log Level");
                quickPick.items = entries;
                let selectedItem;
                disposables.add(quickPick.onDidTriggerItemButton(e => {
                    quickPick.hide();
                    this.defaultLogLevelsService.setDefaultLogLevel(e.item.level);
                }));
                disposables.add(quickPick.onDidAccept(e => {
                    selectedItem = quickPick.selectedItems[0];
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    const result = selectedItem ? selectedItem.level ?? selectedItem : null;
                    disposables.dispose();
                    resolve(result);
                }));
                quickPick.show();
            });
        }
        static isLevelSettable(channel) {
            return channel.log && channel.file !== undefined && channel.id !== telemetryUtils_1.telemetryLogId && channel.id !== telemetryUtils_1.extensionTelemetryLogChannelId;
        }
        async setLogLevelForChannel(logChannel) {
            const defaultLogLevels = await this.defaultLogLevelsService.getDefaultLogLevels();
            const defaultLogLevel = defaultLogLevels.extensions.find(e => e[0] === logChannel.extensionId?.toLowerCase())?.[1] ?? defaultLogLevels.default;
            const currentLogLevel = this.loggerService.getLogLevel(logChannel.resource) ?? defaultLogLevel;
            const entries = this.getLogLevelEntries(defaultLogLevel, currentLogLevel, !!logChannel.extensionId);
            return new Promise((resolve, reject) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.placeholder = logChannel ? nls.localize('selectLogLevelFor', " {0}: Select log level", logChannel?.label) : nls.localize('selectLogLevel', "Select log level");
                quickPick.items = entries;
                quickPick.activeItems = entries.filter((entry) => entry.level === this.loggerService.getLogLevel());
                let selectedItem;
                disposables.add(quickPick.onDidTriggerItemButton(e => {
                    quickPick.hide();
                    this.defaultLogLevelsService.setDefaultLogLevel(e.item.level, logChannel.extensionId);
                }));
                disposables.add(quickPick.onDidAccept(e => {
                    selectedItem = quickPick.selectedItems[0];
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    if (selectedItem) {
                        this.loggerService.setLogLevel(logChannel.resource, selectedItem.level);
                    }
                    disposables.dispose();
                    resolve();
                }));
                quickPick.show();
            });
        }
        getLogLevelEntries(defaultLogLevel, currentLogLevel, canSetDefaultLogLevel) {
            const button = canSetDefaultLogLevel ? { iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.checkAll), tooltip: nls.localize('resetLogLevel', "Set as Default Log Level") } : undefined;
            return [
                { label: this.getLabel(log_1.LogLevel.Trace, currentLogLevel), level: log_1.LogLevel.Trace, description: this.getDescription(log_1.LogLevel.Trace, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Trace ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Debug, currentLogLevel), level: log_1.LogLevel.Debug, description: this.getDescription(log_1.LogLevel.Debug, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Debug ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Info, currentLogLevel), level: log_1.LogLevel.Info, description: this.getDescription(log_1.LogLevel.Info, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Info ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Warning, currentLogLevel), level: log_1.LogLevel.Warning, description: this.getDescription(log_1.LogLevel.Warning, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Warning ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Error, currentLogLevel), level: log_1.LogLevel.Error, description: this.getDescription(log_1.LogLevel.Error, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Error ? [button] : undefined },
                { label: this.getLabel(log_1.LogLevel.Off, currentLogLevel), level: log_1.LogLevel.Off, description: this.getDescription(log_1.LogLevel.Off, defaultLogLevel), buttons: button && defaultLogLevel !== log_1.LogLevel.Off ? [button] : undefined },
            ];
        }
        getLabel(level, current) {
            const label = (0, log_1.LogLevelToLocalizedString)(level).value;
            return level === current ? `$(check) ${label}` : label;
        }
        getDescription(level, defaultLogLevel) {
            return defaultLogLevel === level ? nls.localize('default', "Default") : undefined;
        }
    };
    exports.SetLogLevelAction = SetLogLevelAction;
    exports.SetLogLevelAction = SetLogLevelAction = SetLogLevelAction_1 = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, log_1.ILoggerService),
        __param(4, output_1.IOutputService),
        __param(5, defaultLogLevels_1.IDefaultLogLevelsService)
    ], SetLogLevelAction);
    let OpenWindowSessionLogFileAction = class OpenWindowSessionLogFileAction extends actions_1.Action {
        static { this.ID = 'workbench.action.openSessionLogFile'; }
        static { this.TITLE = nls.localize2('openSessionLogFile', "Open Window Log File (Session)..."); }
        constructor(id, label, environmentService, fileService, quickInputService, editorService) {
            super(id, label);
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.editorService = editorService;
        }
        async run() {
            const sessionResult = await this.quickInputService.pick(this.getSessions().then(sessions => sessions.map((s, index) => ({
                id: s.toString(),
                label: (0, resources_1.basename)(s),
                description: index === 0 ? nls.localize('current', "Current") : undefined
            }))), {
                canPickMany: false,
                placeHolder: nls.localize('sessions placeholder', "Select Session")
            });
            if (sessionResult) {
                const logFileResult = await this.quickInputService.pick(this.getLogFiles(uri_1.URI.parse(sessionResult.id)).then(logFiles => logFiles.map(s => ({
                    id: s.toString(),
                    label: (0, resources_1.basename)(s)
                }))), {
                    canPickMany: false,
                    placeHolder: nls.localize('log placeholder', "Select Log file")
                });
                if (logFileResult) {
                    return this.editorService.openEditor({ resource: uri_1.URI.parse(logFileResult.id), options: { pinned: true } }).then(() => undefined);
                }
            }
        }
        async getSessions() {
            const logsPath = this.environmentService.logsHome.with({ scheme: this.environmentService.logFile.scheme });
            const result = [logsPath];
            const stat = await this.fileService.resolve((0, resources_1.dirname)(logsPath));
            if (stat.children) {
                result.push(...stat.children
                    .filter(stat => !(0, resources_1.isEqual)(stat.resource, logsPath) && stat.isDirectory && /^\d{8}T\d{6}$/.test(stat.name))
                    .sort()
                    .reverse()
                    .map(d => d.resource));
            }
            return result;
        }
        async getLogFiles(session) {
            const stat = await this.fileService.resolve(session);
            if (stat.children) {
                return stat.children.filter(stat => !stat.isDirectory).map(stat => stat.resource);
            }
            return [];
        }
    };
    exports.OpenWindowSessionLogFileAction = OpenWindowSessionLogFileAction;
    exports.OpenWindowSessionLogFileAction = OpenWindowSessionLogFileAction = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, editorService_1.IEditorService)
    ], OpenWindowSessionLogFileAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvY29tbW9uL2xvZ3NBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQnpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsZ0JBQU07O2lCQUU1QixPQUFFLEdBQUcsOEJBQThCLEFBQWpDLENBQWtDO2lCQUNwQyxVQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQUFBbkQsQ0FBb0Q7UUFFekUsWUFBWSxFQUFVLEVBQUUsS0FBYSxFQUNDLGlCQUFxQyxFQUN6QyxhQUE2QixFQUM3QixhQUE2QixFQUNuQix1QkFBaUQ7WUFFNUYsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUxvQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3pDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM3QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDbkIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtRQUc3RixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQy9ELElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksSUFBQSxnQkFBVSxFQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDbkQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlC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