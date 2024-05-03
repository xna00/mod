/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/async"], function (require, exports, event_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManagementConnection = void 0;
    function printTime(ms) {
        let h = 0;
        let m = 0;
        let s = 0;
        if (ms >= 1000) {
            s = Math.floor(ms / 1000);
            ms -= s * 1000;
        }
        if (s >= 60) {
            m = Math.floor(s / 60);
            s -= m * 60;
        }
        if (m >= 60) {
            h = Math.floor(m / 60);
            m -= h * 60;
        }
        const _h = h ? `${h}h` : ``;
        const _m = m ? `${m}m` : ``;
        const _s = s ? `${s}s` : ``;
        const _ms = ms ? `${ms}ms` : ``;
        return `${_h}${_m}${_s}${_ms}`;
    }
    class ManagementConnection {
        constructor(_logService, _reconnectionToken, remoteAddress, protocol) {
            this._logService = _logService;
            this._reconnectionToken = _reconnectionToken;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._reconnectionGraceTime = 10800000 /* ProtocolConstants.ReconnectionGraceTime */;
            this._reconnectionShortGraceTime = 300000 /* ProtocolConstants.ReconnectionShortGraceTime */;
            this._remoteAddress = remoteAddress;
            this.protocol = protocol;
            this._disposed = false;
            this._disconnectRunner1 = new async_1.ProcessTimeRunOnceScheduler(() => {
                this._log(`The reconnection grace time of ${printTime(this._reconnectionGraceTime)} has expired, so the connection will be disposed.`);
                this._cleanResources();
            }, this._reconnectionGraceTime);
            this._disconnectRunner2 = new async_1.ProcessTimeRunOnceScheduler(() => {
                this._log(`The reconnection short grace time of ${printTime(this._reconnectionShortGraceTime)} has expired, so the connection will be disposed.`);
                this._cleanResources();
            }, this._reconnectionShortGraceTime);
            this.protocol.onDidDispose(() => {
                this._log(`The client has disconnected gracefully, so the connection will be disposed.`);
                this._cleanResources();
            });
            this.protocol.onSocketClose(() => {
                this._log(`The client has disconnected, will wait for reconnection ${printTime(this._reconnectionGraceTime)} before disposing...`);
                // The socket has closed, let's give the renderer a certain amount of time to reconnect
                this._disconnectRunner1.schedule();
            });
            this._log(`New connection established.`);
        }
        _log(_str) {
            this._logService.info(`[${this._remoteAddress}][${this._reconnectionToken.substr(0, 8)}][ManagementConnection] ${_str}`);
        }
        shortenReconnectionGraceTimeIfNecessary() {
            if (this._disconnectRunner2.isScheduled()) {
                // we are disconnected and already running the short reconnection timer
                return;
            }
            if (this._disconnectRunner1.isScheduled()) {
                this._log(`Another client has connected, will shorten the wait for reconnection ${printTime(this._reconnectionShortGraceTime)} before disposing...`);
                // we are disconnected and running the long reconnection timer
                this._disconnectRunner2.schedule();
            }
        }
        _cleanResources() {
            if (this._disposed) {
                // already called
                return;
            }
            this._disposed = true;
            this._disconnectRunner1.dispose();
            this._disconnectRunner2.dispose();
            const socket = this.protocol.getSocket();
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            socket.end();
            this._onClose.fire(undefined);
        }
        acceptReconnection(remoteAddress, socket, initialDataChunk) {
            this._remoteAddress = remoteAddress;
            this._log(`The client has reconnected.`);
            this._disconnectRunner1.cancel();
            this._disconnectRunner2.cancel();
            this.protocol.beginAcceptReconnection(socket, initialDataChunk);
            this.protocol.endAcceptReconnection();
        }
    }
    exports.ManagementConnection = ManagementConnection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvc2VydmVyL25vZGUvcmVtb3RlRXh0ZW5zaW9uTWFuYWdlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsU0FBUyxTQUFTLENBQUMsRUFBVTtRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNoQixDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDMUIsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcs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