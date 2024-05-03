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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibility/common/accessibility", "vs/platform/terminal/common/terminal", "vs/base/common/decorators", "vs/base/browser/dom", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, accessibility_1, terminal_1, decorators_1, dom_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextAreaSyncAddon = void 0;
    let TextAreaSyncAddon = class TextAreaSyncAddon extends lifecycle_1.Disposable {
        activate(terminal) {
            this._terminal = terminal;
            if (this._shouldBeActive()) {
                this._registerSyncListeners();
            }
        }
        constructor(_capabilities, _accessibilityService, _configurationService, _logService) {
            super();
            this._capabilities = _capabilities;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._listeners = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                if (this._shouldBeActive()) {
                    this._syncTextArea();
                    this._registerSyncListeners();
                }
                else {
                    this._listeners.clear();
                }
            }));
        }
        _registerSyncListeners() {
            if (this._shouldBeActive() && this._terminal?.textarea) {
                this._listeners.value = new lifecycle_1.DisposableStore();
                this._listeners.value.add(this._terminal.onCursorMove(() => this._syncTextArea()));
                this._listeners.value.add(this._terminal.onData(() => this._syncTextArea()));
                this._listeners.value.add((0, dom_1.addDisposableListener)(this._terminal.textarea, 'focus', () => this._syncTextArea()));
            }
        }
        _shouldBeActive() {
            return this._accessibilityService.isScreenReaderOptimized() || this._configurationService.getValue("terminal.integrated.developer.devMode" /* TerminalSettingId.DevMode */);
        }
        _syncTextArea() {
            this._logService.debug('TextAreaSyncAddon#syncTextArea');
            const textArea = this._terminal?.textarea;
            if (!textArea) {
                this._logService.debug(`TextAreaSyncAddon#syncTextArea: no textarea`);
                return;
            }
            this._updateCommandAndCursor();
            if (this._currentCommand !== textArea.value) {
                textArea.value = this._currentCommand || '';
                this._logService.debug(`TextAreaSyncAddon#syncTextArea: text changed to "${this._currentCommand}"`);
            }
            else if (!this._currentCommand) {
                textArea.value = '';
                this._logService.debug(`TextAreaSyncAddon#syncTextArea: text cleared`);
            }
            if (this._cursorX !== textArea.selectionStart) {
                const selection = !this._cursorX || this._cursorX < 0 ? 0 : this._cursorX;
                textArea.selectionStart = selection;
                textArea.selectionEnd = selection;
                this._logService.debug(`TextAreaSyncAddon#syncTextArea: selection start/end changed to ${selection}`);
            }
        }
        _updateCommandAndCursor() {
            if (!this._terminal) {
                return;
            }
            const commandCapability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const currentCommand = commandCapability?.currentCommand;
            if (!currentCommand) {
                this._logService.debug(`TextAreaSyncAddon#updateCommandAndCursor: no current command`);
                return;
            }
            const buffer = this._terminal.buffer.active;
            const lineNumber = currentCommand.commandStartMarker?.line;
            if (!lineNumber) {
                return;
            }
            const commandLine = buffer.getLine(lineNumber)?.translateToString(true);
            if (!commandLine) {
                this._logService.debug(`TextAreaSyncAddon#updateCommandAndCursor: no line`);
                return;
            }
            if (currentCommand.commandStartX !== undefined) {
                this._currentCommand = commandLine.substring(currentCommand.commandStartX);
                const cursorPosition = buffer.cursorX - currentCommand.commandStartX;
                this._cursorX = cursorPosition >= 0 ? cursorPosition : 0;
            }
            else {
                this._currentCommand = undefined;
                this._cursorX = undefined;
                this._logService.debug(`TextAreaSyncAddon#updateCommandAndCursor: no commandStartX`);
            }
        }
    };
    exports.TextAreaSyncAddon = TextAreaSyncAddon;
    __decorate([
        (0, decorators_1.debounce)(50)
    ], TextAreaSyncAddon.prototype, "_syncTextArea", null);
    exports.TextAreaSyncAddon = TextAreaSyncAddon = __decorate([
        __param(1, accessibility_1.IAccessibilityService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, terminal_1.ITerminalLogService)
    ], TextAreaSyncAddon);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFTeW5jQWRkb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvdGV4dEFyZWFTeW5jQWRkb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBTWhELFFBQVEsQ0FBQyxRQUFrQjtZQUMxQixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQ2tCLGFBQXVDLEVBQ2pDLHFCQUE2RCxFQUM3RCxxQkFBNkQsRUFDL0QsV0FBaUQ7WUFFdEUsS0FBSyxFQUFFLENBQUM7WUFMUyxrQkFBYSxHQUFiLGFBQWEsQ0FBMEI7WUFDaEIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtZQWYvRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFtQixDQUFDLENBQUM7WUFrQjdFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdDQUFnQyxDQUFDLEdBQUcsRUFBRTtnQkFDL0UsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztn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