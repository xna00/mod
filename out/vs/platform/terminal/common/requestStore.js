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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/log/common/log"], function (require, exports, async_1, cancellation_1, event_1, lifecycle_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestStore = void 0;
    /**
     * A helper class to track requests that have replies. Using this it's easy to implement an event
     * that accepts a reply.
     */
    let RequestStore = class RequestStore extends lifecycle_1.Disposable {
        /**
         * @param timeout How long in ms to allow requests to go unanswered for, undefined will use the
         * default (15 seconds).
         */
        constructor(timeout, _logService) {
            super();
            this._logService = _logService;
            this._lastRequestId = 0;
            this._pendingRequests = new Map();
            this._pendingRequestDisposables = new Map();
            this._onCreateRequest = this._register(new event_1.Emitter());
            this.onCreateRequest = this._onCreateRequest.event;
            this._timeout = timeout === undefined ? 15000 : timeout;
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const d of this._pendingRequestDisposables.values()) {
                    (0, lifecycle_1.dispose)(d);
                }
            }));
        }
        /**
         * Creates a request.
         * @param args The arguments to pass to the onCreateRequest event.
         */
        createRequest(args) {
            return new Promise((resolve, reject) => {
                const requestId = ++this._lastRequestId;
                this._pendingRequests.set(requestId, resolve);
                this._onCreateRequest.fire({ requestId, ...args });
                const tokenSource = new cancellation_1.CancellationTokenSource();
                (0, async_1.timeout)(this._timeout, tokenSource.token).then(() => reject(`Request ${requestId} timed out (${this._timeout}ms)`));
                this._pendingRequestDisposables.set(requestId, [(0, lifecycle_1.toDisposable)(() => tokenSource.cancel())]);
            });
        }
        /**
         * Accept a reply to a request.
         * @param requestId The request ID originating from the onCreateRequest event.
         * @param data The reply data.
         */
        acceptReply(requestId, data) {
            const resolveRequest = this._pendingRequests.get(requestId);
            if (resolveRequest) {
                this._pendingRequests.delete(requestId);
                (0, lifecycle_1.dispose)(this._pendingRequestDisposables.get(requestId) || []);
                this._pendingRequestDisposables.delete(requestId);
                resolveRequest(data);
            }
            else {
                this._logService.warn(`RequestStore#acceptReply was called without receiving a matching request ${requestId}`);
            }
        }
    };
    exports.RequestStore = RequestStore;
    exports.RequestStore = RequestStore = __decorate([
        __param(1, log_1.ILogService)
    ], RequestStore);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFN0b3JlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vcmVxdWVzdFN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVFoRzs7O09BR0c7SUFDSSxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUE2QixTQUFRLHNCQUFVO1FBUzNEOzs7V0FHRztRQUNILFlBQ0MsT0FBMkIsRUFDZCxXQUF5QztZQUV0RCxLQUFLLEVBQUUsQ0FBQztZQUZzQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQWQvQyxtQkFBYyxHQUFHLENBQUMsQ0FBQztZQUVuQixxQkFBZ0IsR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNqRSwrQkFBMEIsR0FBK0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUUxRCxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF1QyxDQUFDLENBQUM7WUFDOUYsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBV3RELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUNoQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUMxRCxJQUFBLG1CQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1osQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsYUFBYSxDQUFDLElBQWlCO1lBQzlCLE9BQU8sSUFBSSxPQUFPLENBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sU0FBUyxHQUFHLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLFdBQVcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7Z0JBQ2xELElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxTQUFTLGVBQWUsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDcEgsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxXQUFXLENBQUMsU0FBaUIsRUFBRSxJQUFPO1lBQ3JDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsSUFBSSxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzlELElBQUksQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xELGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsNEVBQTRFLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDaEgsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBekRZLG9DQUFZOzJCQUFaLFlBQVk7UUFldEIsV0FBQSxpQkFBVyxDQUFBO09BZkQsWUFBWSxDQXlEeEIifQ==