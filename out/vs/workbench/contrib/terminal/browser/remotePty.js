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
define(["require", "exports", "vs/base/common/async", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/basePty", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, async_1, terminal_1, basePty_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemotePty = void 0;
    let RemotePty = class RemotePty extends basePty_1.BasePty {
        constructor(id, shouldPersist, _remoteTerminalChannel, _remoteAgentService, _logService) {
            super(id, shouldPersist);
            this._remoteTerminalChannel = _remoteTerminalChannel;
            this._remoteAgentService = _remoteAgentService;
            this._logService = _logService;
            this._startBarrier = new async_1.Barrier();
        }
        async start() {
            // Fetch the environment to check shell permissions
            const env = await this._remoteAgentService.getEnvironment();
            if (!env) {
                // Extension host processes are only allowed in remote extension hosts currently
                throw new Error('Could not fetch remote environment');
            }
            this._logService.trace('Spawning remote agent process', { terminalId: this.id });
            const startResult = await this._remoteTerminalChannel.start(this.id);
            if (startResult && 'message' in startResult) {
                // An error occurred
                return startResult;
            }
            this._startBarrier.open();
            return startResult;
        }
        async detach(forcePersist) {
            await this._startBarrier.wait();
            return this._remoteTerminalChannel.detachFromProcess(this.id, forcePersist);
        }
        shutdown(immediate) {
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.shutdown(this.id, immediate);
            });
        }
        input(data) {
            if (this._inReplay) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.input(this.id, data);
            });
        }
        processBinary(e) {
            return this._remoteTerminalChannel.processBinary(this.id, e);
        }
        resize(cols, rows) {
            if (this._inReplay || this._lastDimensions.cols === cols && this._lastDimensions.rows === rows) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._lastDimensions.cols = cols;
                this._lastDimensions.rows = rows;
                this._remoteTerminalChannel.resize(this.id, cols, rows);
            });
        }
        async clearBuffer() {
            await this._remoteTerminalChannel.clearBuffer(this.id);
        }
        freePortKillProcess(port) {
            if (!this._remoteTerminalChannel.freePortKillProcess) {
                throw new Error('freePortKillProcess does not exist on the local pty service');
            }
            return this._remoteTerminalChannel.freePortKillProcess(port);
        }
        acknowledgeDataEvent(charCount) {
            // Support flow control for server spawned processes
            if (this._inReplay) {
                return;
            }
            this._startBarrier.wait().then(_ => {
                this._remoteTerminalChannel.acknowledgeDataEvent(this.id, charCount);
            });
        }
        async setUnicodeVersion(version) {
            return this._remoteTerminalChannel.setUnicodeVersion(this.id, version);
        }
        async refreshProperty(type) {
            return this._remoteTerminalChannel.refreshProperty(this.id, type);
        }
        async updateProperty(type, value) {
            return this._remoteTerminalChannel.updateProperty(this.id, type, value);
        }
        handleOrphanQuestion() {
            this._remoteTerminalChannel.orphanQuestionReply(this.id);
        }
    };
    exports.RemotePty = RemotePty;
    exports.RemotePty = RemotePty = __decorate([
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, terminal_1.ITerminalLogService)
    ], RemotePty);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlUHR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3JlbW90ZVB0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFVLFNBQVEsaUJBQU87UUFHckMsWUFDQyxFQUFVLEVBQ1YsYUFBc0IsRUFDTCxzQkFBbUQsRUFDOUIsbUJBQXdDLEVBQ3hDLFdBQWdDO1lBRXRFLEtBQUssQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFKUiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQTZCO1lBQzlCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDeEMsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO1lBR3RFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUs7WUFDVixtREFBbUQ7WUFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDNUQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNWLGdGQUFnRjtnQkFDaEYsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVqRixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXJFLElBQUksV0FB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