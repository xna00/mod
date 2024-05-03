/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostDebugChannelClient = exports.ExtensionHostDebugBroadcastChannel = void 0;
    class ExtensionHostDebugBroadcastChannel {
        constructor() {
            this._onCloseEmitter = new event_1.Emitter();
            this._onReloadEmitter = new event_1.Emitter();
            this._onTerminateEmitter = new event_1.Emitter();
            this._onAttachEmitter = new event_1.Emitter();
        }
        static { this.ChannelName = 'extensionhostdebugservice'; }
        call(ctx, command, arg) {
            switch (command) {
                case 'close':
                    return Promise.resolve(this._onCloseEmitter.fire({ sessionId: arg[0] }));
                case 'reload':
                    return Promise.resolve(this._onReloadEmitter.fire({ sessionId: arg[0] }));
                case 'terminate':
                    return Promise.resolve(this._onTerminateEmitter.fire({ sessionId: arg[0] }));
                case 'attach':
                    return Promise.resolve(this._onAttachEmitter.fire({ sessionId: arg[0], port: arg[1], subId: arg[2] }));
            }
            throw new Error('Method not implemented.');
        }
        listen(ctx, event, arg) {
            switch (event) {
                case 'close':
                    return this._onCloseEmitter.event;
                case 'reload':
                    return this._onReloadEmitter.event;
                case 'terminate':
                    return this._onTerminateEmitter.event;
                case 'attach':
                    return this._onAttachEmitter.event;
            }
            throw new Error('Method not implemented.');
        }
    }
    exports.ExtensionHostDebugBroadcastChannel = ExtensionHostDebugBroadcastChannel;
    class ExtensionHostDebugChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
        }
        reload(sessionId) {
            this.channel.call('reload', [sessionId]);
        }
        get onReload() {
            return this.channel.listen('reload');
        }
        close(sessionId) {
            this.channel.call('close', [sessionId]);
        }
        get onClose() {
            return this.channel.listen('close');
        }
        attachSession(sessionId, port, subId) {
            this.channel.call('attach', [sessionId, port, subId]);
        }
        get onAttachSession() {
            return this.channel.listen('attach');
        }
        terminateSession(sessionId, subId) {
            this.channel.call('terminate', [sessionId, subId]);
        }
        get onTerminateSession() {
            return this.channel.listen('terminate');
        }
        openExtensionDevelopmentHostWindow(args, debugRenderer) {
            return this.channel.call('openExtensionDevelopmentHostWindow', [args, debugRenderer]);
        }
    }
    exports.ExtensionHostDebugChannelClient = ExtensionHostDebugChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9kZWJ1Zy9jb21tb24vZXh0ZW5zaW9uSG9zdERlYnVnSXBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLGtDQUFrQztRQUEvQztZQUlrQixvQkFBZSxHQUFHLElBQUksZUFBTyxFQUFzQixDQUFDO1lBQ3BELHFCQUFnQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBQ3RELHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUEwQixDQUFDO1lBQzVELHFCQUFnQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1FBNkJ4RSxDQUFDO2lCQWxDZ0IsZ0JBQVcsR0FBRywyQkFBMkIsQUFBOUIsQ0FBK0I7UUFPMUQsSUFBSSxDQUFDLEdBQWEsRUFBRSxPQUFlLEVBQUUsR0FBUztZQUM3QyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLE9BQU87b0JBQ1gsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUUsS0FBSyxRQUFRO29CQUNaLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0UsS0FBSyxXQUFXO29CQUNmLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENB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