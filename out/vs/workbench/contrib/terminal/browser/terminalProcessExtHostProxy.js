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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, event_1, lifecycle_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcessExtHostProxy = void 0;
    let TerminalProcessExtHostProxy = class TerminalProcessExtHostProxy extends lifecycle_1.Disposable {
        get onProcessReady() { return this._onProcessReady.event; }
        constructor(instanceId, _cols, _rows, _terminalService) {
            super();
            this.instanceId = instanceId;
            this._cols = _cols;
            this._rows = _rows;
            this._terminalService = _terminalService;
            this.id = 0;
            this.shouldPersist = false;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this._onStart = this._register(new event_1.Emitter());
            this.onStart = this._onStart.event;
            this._onInput = this._register(new event_1.Emitter());
            this.onInput = this._onInput.event;
            this._onBinary = this._register(new event_1.Emitter());
            this.onBinary = this._onBinary.event;
            this._onResize = this._register(new event_1.Emitter());
            this.onResize = this._onResize.event;
            this._onAcknowledgeDataEvent = this._register(new event_1.Emitter());
            this.onAcknowledgeDataEvent = this._onAcknowledgeDataEvent.event;
            this._onShutdown = this._register(new event_1.Emitter());
            this.onShutdown = this._onShutdown.event;
            this._onRequestInitialCwd = this._register(new event_1.Emitter());
            this.onRequestInitialCwd = this._onRequestInitialCwd.event;
            this._onRequestCwd = this._register(new event_1.Emitter());
            this.onRequestCwd = this._onRequestCwd.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._pendingInitialCwdRequests = [];
            this._pendingCwdRequests = [];
        }
        emitData(data) {
            this._onProcessData.fire(data);
        }
        emitTitle(title) {
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: title });
        }
        emitReady(pid, cwd) {
            this._onProcessReady.fire({ pid, cwd, windowsPty: undefined });
        }
        emitProcessProperty({ type, value }) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */:
                    this.emitCwd(value);
                    break;
                case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                    this.emitInitialCwd(value);
                    break;
                case "title" /* ProcessPropertyType.Title */:
                    this.emitTitle(value);
                    break;
                case "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */:
                    this.emitOverrideDimensions(value);
                    break;
                case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                    this.emitResolvedShellLaunchConfig(value);
                    break;
            }
        }
        emitExit(exitCode) {
            this._onProcessExit.fire(exitCode);
            this.dispose();
        }
        emitOverrideDimensions(dimensions) {
            this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: dimensions });
        }
        emitResolvedShellLaunchConfig(shellLaunchConfig) {
            this._onDidChangeProperty.fire({ type: "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */, value: shellLaunchConfig });
        }
        emitInitialCwd(initialCwd) {
            while (this._pendingInitialCwdRequests.length > 0) {
                this._pendingInitialCwdRequests.pop()(initialCwd);
            }
        }
        emitCwd(cwd) {
            while (this._pendingCwdRequests.length > 0) {
                this._pendingCwdRequests.pop()(cwd);
            }
        }
        async start() {
            return this._terminalService.requestStartExtensionTerminal(this, this._cols, this._rows);
        }
        shutdown(immediate) {
            this._onShutdown.fire(immediate);
        }
        input(data) {
            this._onInput.fire(data);
        }
        resize(cols, rows) {
            this._onResize.fire({ cols, rows });
        }
        clearBuffer() {
            // no-op
        }
        acknowledgeDataEvent() {
            // Flow control is disabled for extension terminals
        }
        async setUnicodeVersion(version) {
            // No-op
        }
        async processBinary(data) {
            // Disabled for extension terminals
            this._onBinary.fire(data);
        }
        getInitialCwd() {
            return new Promise(resolve => {
                this._onRequestInitialCwd.fire();
                this._pendingInitialCwdRequests.push(resolve);
            });
        }
        getCwd() {
            return new Promise(resolve => {
                this._onRequestCwd.fire();
                this._pendingCwdRequests.push(resolve);
            });
        }
        async refreshProperty(type) {
            // throws if called in extHostTerminalService
        }
        async updateProperty(type, value) {
            // throws if called in extHostTerminalService
        }
    };
    exports.TerminalProcessExtHostProxy = TerminalProcessExtHostProxy;
    exports.TerminalProcessExtHostProxy = TerminalProcessExtHostProxy = __decorate([
        __param(3, terminal_1.ITerminalService)
    ], TerminalProcessExtHostProxy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzRXh0SG9zdFByb3h5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsUHJvY2Vzc0V4dEhvc3RQcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQU8xRCxJQUFJLGNBQWMsS0FBZ0MsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUEwQnRGLFlBQ1EsVUFBa0IsRUFDakIsS0FBYSxFQUNiLEtBQWEsRUFDSCxnQkFBbUQ7WUFFckUsS0FBSyxFQUFFLENBQUM7WUFMRCxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2pCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQXBDN0QsT0FBRSxHQUFHLENBQUMsQ0FBQztZQUNQLGtCQUFhLEdBQUcsS0FBSyxDQUFDO1lBRWQsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFrQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUNqRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUdwRSxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdkQsWUFBTyxHQUFnQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUNuQyxhQUFRLEdBQUcs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