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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookRendererMessagingService = void 0;
    let NotebookRendererMessagingService = class NotebookRendererMessagingService extends lifecycle_1.Disposable {
        constructor(extensionService) {
            super();
            this.extensionService = extensionService;
            /**
             * Activation promises. Maps renderer IDs to a queue of messages that should
             * be sent once activation finishes, or undefined if activation is complete.
             */
            this.activations = new Map();
            this.scopedMessaging = new Map();
            this.postMessageEmitter = this._register(new event_1.Emitter());
            this.onShouldPostMessage = this.postMessageEmitter.event;
        }
        /** @inheritdoc */
        receiveMessage(editorId, rendererId, message) {
            if (editorId === undefined) {
                const sends = [...this.scopedMessaging.values()].map(e => e.receiveMessageHandler?.(rendererId, message));
                return Promise.all(sends).then(s => s.some(s => !!s));
            }
            return this.scopedMessaging.get(editorId)?.receiveMessageHandler?.(rendererId, message) ?? Promise.resolve(false);
        }
        /** @inheritdoc */
        prepare(rendererId) {
            if (this.activations.has(rendererId)) {
                return;
            }
            const queue = [];
            this.activations.set(rendererId, queue);
            this.extensionService.activateByEvent(`onRenderer:${rendererId}`).then(() => {
                for (const message of queue) {
                    this.postMessageEmitter.fire(message);
                }
                this.activations.set(rendererId, undefined);
            });
        }
        /** @inheritdoc */
        getScoped(editorId) {
            const existing = this.scopedMessaging.get(editorId);
            if (existing) {
                return existing;
            }
            const messaging = {
                postMessage: (rendererId, message) => this.postMessage(editorId, rendererId, message),
                dispose: () => this.scopedMessaging.delete(editorId),
            };
            this.scopedMessaging.set(editorId, messaging);
            return messaging;
        }
        postMessage(editorId, rendererId, message) {
            if (!this.activations.has(rendererId)) {
                this.prepare(rendererId);
            }
            const activation = this.activations.get(rendererId);
            const toSend = { rendererId, editorId, message };
            if (activation === undefined) {
                this.postMessageEmitter.fire(toSend);
            }
            else {
                activation.push(toSend);
            }
        }
    };
    exports.NotebookRendererMessagingService = NotebookRendererMessagingService;
    exports.NotebookRendererMessagingService = NotebookRendererMessagingService = __decorate([
        __param(0, extensions_1.IExtensionService)
    ], NotebookRendererMessagingService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tSZW5kZXJlck1lc3NhZ2luZ1NlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3NlcnZpY2VzL25vdGVib29rUmVuZGVyZXJNZXNzYWdpbmdTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQVcvRCxZQUNvQixnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFGNEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVZ4RTs7O2VBR0c7WUFDYyxnQkFBVyxHQUFHLElBQUksR0FBRyxFQUF3RCxDQUFDO1lBQzlFLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQW1ELENBQUM7WUFDN0UsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBaUIsQ0FBQyxDQUFDO1lBQ25FLHdCQUFtQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7UUFNcEUsQ0FBQztRQUVELGtCQUFrQjtRQUNYLGNBQWMsQ0FBQyxRQUE0QixFQUFFLFVBQWtCLEVBQUUsT0FBZ0I7WUFDdkYsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxL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