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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, event_1, lifecycle_1, model_1, configuration_1, contextkey_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibleBufferProvider = void 0;
    let TerminalAccessibleBufferProvider = class TerminalAccessibleBufferProvider extends lifecycle_1.DisposableStore {
        constructor(_instance, _bufferTracker, customHelp, _modelService, configurationService, _contextKeyService, _terminalService) {
            super();
            this._instance = _instance;
            this._bufferTracker = _bufferTracker;
            this.id = "terminal" /* AccessibleViewProviderId.Terminal */;
            this.options = { type: "view" /* AccessibleViewType.View */, language: 'terminal', id: "terminal" /* AccessibleViewProviderId.Terminal */ };
            this.verbositySettingKey = "accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */;
            this._onDidRequestClearProvider = new event_1.Emitter();
            this.onDidRequestClearLastProvider = this._onDidRequestClearProvider.event;
            this.options.customHelp = customHelp;
            this.options.position = configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? 'initial-bottom' : 'bottom';
            this.add(this._instance.onDisposed(() => this._onDidRequestClearProvider.fire("terminal" /* AccessibleViewProviderId.Terminal */)));
            this.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */)) {
                    this.options.position = configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? 'initial-bottom' : 'bottom';
                }
            }));
            this._focusedInstance = _terminalService.activeInstance;
            this.add(_terminalService.onDidChangeActiveInstance(() => {
                if (_terminalService.activeInstance && this._focusedInstance?.instanceId !== _terminalService.activeInstance?.instanceId) {
                    this._onDidRequestClearProvider.fire("terminal" /* AccessibleViewProviderId.Terminal */);
                    this._focusedInstance = _terminalService.activeInstance;
                }
            }));
        }
        onClose() {
            this._instance.focus();
        }
        provideContent() {
            this._bufferTracker.update();
            return this._bufferTracker.lines.join('\n');
        }
        getSymbols() {
            const commands = this._getCommandsWithEditorLine() ?? [];
            const symbols = [];
            for (const command of commands) {
                const label = command.command.command;
                if (label) {
                    symbols.push({
                        label,
                        lineNumber: command.lineNumber
                    });
                }
            }
            return symbols;
        }
        _getCommandsWithEditorLine() {
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const commands = capability?.commands;
            const currentCommand = capability?.currentCommand;
            if (!commands?.length) {
                return;
            }
            const result = [];
            for (const command of commands) {
                const lineNumber = this._getEditorLineForCommand(command);
                if (lineNumber === undefined) {
                    continue;
                }
                result.push({ command, lineNumber });
            }
            if (currentCommand) {
                const lineNumber = this._getEditorLineForCommand(currentCommand);
                if (lineNumber !== undefined) {
                    result.push({ command: currentCommand, lineNumber });
                }
            }
            return result;
        }
        _getEditorLineForCommand(command) {
            let line;
            if ('marker' in command) {
                line = command.marker?.line;
            }
            else if ('commandStartMarker' in command) {
                line = command.commandStartMarker?.line;
            }
            if (line === undefined || line < 0) {
                return;
            }
            line = this._bufferTracker.bufferToEditorLineMapping.get(line);
            if (line === undefined) {
                return;
            }
            return line + 1;
        }
    };
    exports.TerminalAccessibleBufferProvider = TerminalAccessibleBufferProvider;
    exports.TerminalAccessibleBufferProvider = TerminalAccessibleBufferProvider = __decorate([
        __param(3, model_1.IModelService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, terminal_1.ITerminalService)
    ], TerminalAccessibleBufferProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY2Nlc3NpYmxlQnVmZmVyUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvdGVybWluYWxBY2Nlc3NpYmxlQnVmZmVyUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZXpGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsMkJBQWU7UUFPcEUsWUFDa0IsU0FBaUosRUFDMUosY0FBb0MsRUFDNUMsVUFBd0IsRUFDVCxhQUE0QixFQUNwQixvQkFBMkMsRUFDOUMsa0JBQXNDLEVBQ3hDLGdCQUFrQztZQUVwRCxLQUFLLEVBQUUsQ0FBQztZQVJTLGNBQVMsR0FBVCxTQUFTLENBQXdJO1lBQzFKLG1CQUFjLEdBQWQsY0FBYyxDQUFzQjtZQVI3QyxPQUFFLHNEQUFxQztZQUN2QyxZQUFPLEdBQTJCLEVBQUUsSUFBSSxzQ0FBeUIsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0RBQW1DLEVBQUUsQ0FBQztZQUNqSSx3QkFBbUIscUZBQTRDO1lBQzlDLCtCQUEwQixHQUFHLElBQUksZUFBTyxFQUE0QixDQUFDO1lBQzdFLGtDQUE2QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFZOUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLG9CQUFvQixDQUFDLFFBQVEseUhBQXdELENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDNUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMs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