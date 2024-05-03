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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/linkedList", "vs/platform/contextkey/common/contextkey", "./inlineChat"], function (require, exports, lifecycle_1, event_1, linkedList_1, contextkey_1, inlineChat_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatServiceImpl = void 0;
    let InlineChatServiceImpl = class InlineChatServiceImpl {
        constructor(contextKeyService) {
            this._onDidChangeProviders = new event_1.Emitter();
            this._entries = new linkedList_1.LinkedList();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._ctxHasProvider = inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER.bindTo(contextKeyService);
        }
        addProvider(provider) {
            const rm = this._entries.push(provider);
            this._ctxHasProvider.set(true);
            this._onDidChangeProviders.fire({ added: provider });
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._ctxHasProvider.set(this._entries.size > 0);
                this._onDidChangeProviders.fire({ removed: provider });
            });
        }
        getAllProvider() {
            return [...this._entries].reverse();
        }
    };
    exports.InlineChatServiceImpl = InlineChatServiceImpl;
    exports.InlineChatServiceImpl = InlineChatServiceImpl = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], InlineChatServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9pbmxpbmVDaGF0L2NvbW1vbi9pbmxpbmVDaGF0U2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXFCO1FBVWpDLFlBQWdDLGlCQUFxQztZQU5wRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztZQUNyRSxhQUFRLEdBQUcsSUFBSSx1QkFBVSxFQUE4QixDQUFDO1lBR2hFLHlCQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFHaEUsSUFBSSxDQUFDLGVBQWUsR0FBRyx5Q0FBNEIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsV0FBVyxDQUFDLFFBQW9DO1lBRS9DLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUVyRCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLEVBQUUsRUFBRSxDQUFDO2dCQUNMLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsY0FBYztZQUNiLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQyxDQUFDO0tBQ0QsQ0FBQTtJQTlCWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQVVwQixXQUFBLCtCQUFrQixDQUFBO09BVm5CLHFCQUFxQixDQThCakMifQ==