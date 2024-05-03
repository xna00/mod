/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/nls"], function (require, exports, event_1, async_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractDebugAdapter = void 0;
    /**
     * Abstract implementation of the low level API for a debug adapter.
     * Missing is how this API communicates with the debug adapter.
     */
    class AbstractDebugAdapter {
        constructor() {
            this.pendingRequests = new Map();
            this.queue = [];
            this._onError = new event_1.Emitter();
            this._onExit = new event_1.Emitter();
            this.sequence = 1;
        }
        get onError() {
            return this._onError.event;
        }
        get onExit() {
            return this._onExit.event;
        }
        onMessage(callback) {
            if (this.messageCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Message' callback`));
            }
            this.messageCallback = callback;
        }
        onEvent(callback) {
            if (this.eventCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Event' callback`));
            }
            this.eventCallback = callback;
        }
        onRequest(callback) {
            if (this.requestCallback) {
                this._onError.fire(new Error(`attempt to set more than one 'Request' callback`));
            }
            this.requestCallback = callback;
        }
        sendResponse(response) {
            if (response.seq > 0) {
                this._onError.fire(new Error(`attempt to send more than one response for command ${response.command}`));
            }
            else {
                this.internalSend('response', response);
            }
        }
        sendRequest(command, args, clb, timeout) {
            const request = {
                command: command
            };
            if (args && Object.keys(args).length > 0) {
                request.arguments = args;
            }
            this.internalSend('request', request);
            if (typeof timeout === 'number') {
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    const clb = this.pendingRequests.get(request.seq);
                    if (clb) {
                        this.pendingRequests.delete(request.seq);
                        const err = {
                            type: 'response',
                            seq: 0,
                            request_seq: request.seq,
                            success: false,
                            command,
                            message: (0, nls_1.localize)('timeout', "Timeout after {0} ms for '{1}'", timeout, command)
                        };
                        clb(err);
                    }
                }, timeout);
            }
            if (clb) {
                // store callback for this request
                this.pendingRequests.set(request.seq, clb);
            }
            return request.seq;
        }
        acceptMessage(message) {
            if (this.messageCallback) {
                this.messageCallback(message);
            }
            else {
                this.queue.push(message);
                if (this.queue.length === 1) {
                    // first item = need to start processing loop
                    this.processQueue();
                }
            }
        }
        /**
         * Returns whether we should insert a timeout between processing messageA
         * and messageB. Artificially queueing protocol messages guarantees that any
         * microtasks for previous message finish before next message is processed.
         * This is essential ordering when using promises anywhere along the call path.
         *
         * For example, take the following, where `chooseAndSendGreeting` returns
         * a person name and then emits a greeting event:
         *
         * ```
         * let person: string;
         * adapter.onGreeting(() => console.log('hello', person));
         * person = await adapter.chooseAndSendGreeting();
         * ```
         *
         * Because the event is dispatched synchronously, it may fire before person
         * is assigned if they're processed in the same task. Inserting a task
         * boundary avoids this issue.
         */
        needsTaskBoundaryBetween(messageA, messageB) {
            return messageA.type !== 'event' || messageB.type !== 'event';
        }
        /**
         * Reads and dispatches items from the queue until it is empty.
         */
        async processQueue() {
            let message;
            while (this.queue.length) {
                if (!message || this.needsTaskBoundaryBetween(this.queue[0], message)) {
                    await (0, async_1.timeout)(0);
                }
                message = this.queue.shift();
                if (!message) {
                    return; // may have been disposed of
                }
                switch (message.type) {
                    case 'event':
                        this.eventCallback?.(message);
                        break;
                    case 'request':
                        this.requestCallback?.(message);
                        break;
                    case 'response': {
                        const response = message;
                        const clb = this.pendingRequests.get(response.request_seq);
                        if (clb) {
                            this.pendingRequests.delete(response.request_seq);
                            clb(response);
                        }
                        break;
                    }
                }
            }
        }
        internalSend(typ, message) {
            message.type = typ;
            message.seq = this.sequence++;
            this.sendMessage(message);
        }
        async cancelPendingRequests() {
            if (this.pendingRequests.size === 0) {
                return Promise.resolve();
            }
            const pending = new Map();
            this.pendingRequests.forEach((value, key) => pending.set(key, value));
            await (0, async_1.timeout)(500);
            pending.forEach((callback, request_seq) => {
                const err = {
                    type: 'response',
                    seq: 0,
                    request_seq,
                    success: false,
                    command: 'canceled',
                    message: 'canceled'
                };
                callback(err);
                this.pendingRequests.delete(request_seq);
            });
        }
        getPendingRequestIds() {
            return Array.from(this.pendingRequests.keys());
        }
        dispose() {
            this.queue = [];
        }
    }
    exports.AbstractDebugAdapter = AbstractDebugAdapter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3REZWJ1Z0FkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9hYnN0cmFjdERlYnVnQWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEc7OztPQUdHO0lBQ0gsTUFBc0Isb0JBQW9CO1FBVXpDO1lBUlEsb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztZQUl6RSxVQUFLLEdBQW9DLEVBQUUsQ0FBQztZQUNqQyxhQUFRLEdBQUcsSUFBSSxlQUFPLEVBQVMsQ0FBQztZQUNoQyxZQUFPLEdBQUcsSUFBSSxlQUFPLEVBQWlCLENBQUM7WUFHekQsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQztRQVFELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUVELFNBQVMsQ0FBQyxRQUEwRDtZQUNuRSxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQyxDQUFDO1lBQ2xGLENBQUM7WUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQztRQUNqQyxDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQThDO1lBQ3JELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDLENB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