/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.URLHandlerRouter = exports.URLHandlerChannelClient = exports.URLHandlerChannel = void 0;
    class URLHandlerChannel {
        constructor(handler) {
            this.handler = handler;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'handleURL': return this.handler.handleURL(uri_1.URI.revive(arg[0]), arg[1]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.URLHandlerChannel = URLHandlerChannel;
    class URLHandlerChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        handleURL(uri, options) {
            return this.channel.call('handleURL', [uri.toJSON(), options]);
        }
    }
    exports.URLHandlerChannelClient = URLHandlerChannelClient;
    class URLHandlerRouter {
        constructor(next, logService) {
            this.next = next;
            this.logService = logService;
        }
        async routeCall(hub, command, arg, cancellationToken) {
            if (command !== 'handleURL') {
                throw new Error(`Call not found: ${command}`);
            }
            if (Array.isArray(arg) && arg.length > 0) {
                const uri = uri_1.URI.revive(arg[0]);
                this.logService.trace('URLHandlerRouter#routeCall() with URI argument', uri.toString(true));
                if (uri.query) {
                    const match = /\bwindowId=(\d+)/.exec(uri.query);
                    if (match) {
                        const windowId = match[1];
                        this.logService.trace(`URLHandlerRouter#routeCall(): found windowId query parameter with value "${windowId}"`, uri.toString(true));
                        const regex = new RegExp(`window:${windowId}`);
                        const connection = hub.connections.find(c => {
                            this.logService.trace('URLHandlerRouter#routeCall(): testing connection', c.ctx);
                            return regex.test(c.ctx);
                        });
                        if (connection) {
                            this.logService.trace('URLHandlerRouter#routeCall(): found a connection to route', uri.toString(true));
                            return connection;
                        }
                        else {
                            this.logService.trace('URLHandlerRouter#routeCall(): did not find a connection to route', uri.toString(true));
                        }
                    }
                    else {
                        this.logService.trace('URLHandlerRouter#routeCall(): did not find windowId query parameter', uri.toString(true));
                    }
                }
            }
            else {
                this.logService.trace('URLHandlerRouter#routeCall() without URI argument');
            }
            return this.next.routeCall(hub, command, arg, cancellationToken);
        }
        routeEvent(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
    }
    exports.URLHandlerRouter = URLHandlerRouter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91cmwvY29tbW9uL3VybElwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxpQkFBaUI7UUFFN0IsWUFBb0IsT0FBb0I7WUFBcEIsWUFBTyxHQUFQLE9BQU8sQ0FBYTtRQUFJLENBQUM7UUFFN0MsTUFBTSxDQUFJLENBQVUsRUFBRSxLQUFhO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFVLEVBQUUsT0FBZSxFQUFFLEdBQVM7WUFDMUMsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxXQUFXLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztLQUNEO0lBZkQsOENBZUM7SUFFRCxNQUFhLHVCQUF1QjtRQUVuQyxZQUFvQixPQUFpQjtZQUFqQixZQUFPLEdBQVAsT0FBTyxDQUFVO1FBQUksQ0FBQztRQUUxQyxTQUFTLENBQUMsR0FBUSxFQUFFLE9BQXlCO1lBQzVDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDaEUsQ0FBQztLQUNEO0lBUEQsMERBT0M7SUFFRCxNQUFhLGdC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