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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/instantiation/common/instantiation"], function (require, exports, aria_1, async_1, lifecycle_1, accessibilitySignalService_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatAccessibilityService = void 0;
    let ChatAccessibilityService = class ChatAccessibilityService extends lifecycle_1.Disposable {
        constructor(_accessibilitySignalService, _instantiationService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._instantiationService = _instantiationService;
            this._pendingSignalMap = this._register(new lifecycle_1.DisposableMap());
            this._requestId = 0;
        }
        acceptRequest() {
            this._requestId++;
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.chatRequestSent, { allowManyInParallel: true });
            this._pendingSignalMap.set(this._requestId, this._instantiationService.createInstance(AccessibilitySignalScheduler));
            return this._requestId;
        }
        acceptResponse(response, requestId) {
            this._pendingSignalMap.deleteAndDispose(requestId);
            const isPanelChat = typeof response !== 'string';
            const responseContent = typeof response === 'string' ? response : response?.response.asString();
            this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.chatResponseReceived, { allowManyInParallel: true });
            if (!response) {
                return;
            }
            const errorDetails = isPanelChat && response.errorDetails ? ` ${response.errorDetails.message}` : '';
            (0, aria_1.status)(responseContent + errorDetails);
        }
    };
    exports.ChatAccessibilityService = ChatAccessibilityService;
    exports.ChatAccessibilityService = ChatAccessibilityService = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(1, instantiation_1.IInstantiationService)
    ], ChatAccessibilityService);
    const CHAT_RESPONSE_PENDING_AUDIO_CUE_LOOP_MS = 5000;
    const CHAT_RESPONSE_PENDING_ALLOWANCE_MS = 4000;
    /**
     * Schedules an audio cue to play when a chat response is pending for too long.
     */
    let AccessibilitySignalScheduler = class AccessibilitySignalScheduler extends lifecycle_1.Disposable {
        constructor(_accessibilitySignalService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._scheduler = new async_1.RunOnceScheduler(() => {
                this._signalLoop = this._accessibilitySignalService.playSignalLoop(accessibilitySignalService_1.AccessibilitySignal.chatResponsePending, CHAT_RESPONSE_PENDING_AUDIO_CUE_LOOP_MS);
            }, CHAT_RESPONSE_PENDING_ALLOWANCE_MS);
            this._scheduler.schedule();
        }
        dispose() {
            super.dispose();
            this._signalLoop?.dispose();
            this._scheduler.cancel();
            this._scheduler.dispose();
        }
    };
    AccessibilitySignalScheduler = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService)
    ], AccessibilitySignalScheduler);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjY2Vzc2liaWxpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdEFjY2Vzc2liaWxpdHlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBUXZELFlBQXlDLDJCQUF5RSxFQUF5QixxQkFBNkQ7WUFDdk0sS0FBSyxFQUFFLENBQUM7WUFEaUQsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE2QjtZQUEwQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBSmhNLHNCQUFpQixHQUF3RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBRSxDQUFDLENBQUM7WUFFN0csZUFBVSxHQUFXLENBQUMsQ0FBQztRQUkvQixDQUFDO1FBQ0QsYUFBYTtZQUNaLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLGVBQWUsRUFBRSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDaEgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO1lBQ3JILE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBQ0QsY0FBYyxDQUFDLFFBQXFELEVBQUUsU0FBaUI7WUFDdEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLE9BQU8sUUFBUSxLQUFLLFFBQVEsQ0FBQztZQUNqRCxNQUFNLGVBQWUsR0FBRyxPQUFPLFFBQVEsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLG9CQUFvQixFQUFFLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNySCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLFlBQVksR0FBRyxXQUFXLElBQUksUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDckcsSUFBQSxhQUFNLEVBQUMsZUFBZSxHQUFHLFlBQVksQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDRCxDQUFBO0lBNUJZLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBUXZCLFdBQUEsd0RBQTJCLENBQUE7UUFBNkUsV0FBQSxxQ0FBcUIsQ0FBQTtPQVI5SCx3QkFBd0IsQ0E0QnBDO0lBRUQsTUFBTSx1Q0FBdUMsR0FBRyxJQUFJLENBQUM7SUFDckQsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7SUFDaEQ7O09BRUc7SUFDSCxJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVO1FBR3BELFlBQTBELDJCQUF3RDtZQUNqSCxLQUFLLEVBQUUsQ0FBQztZQURpRCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBRWpILElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLGNBQWMsQ0FBQyxnREFBbUIsQ0FBQyxtQkFBbUIsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ3RKLENBQUMsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUNRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQztLQUNELENBQUE7SUFoQkssNEJBQTRCO1FBR3BCLFdBQUEsd0RBQTJCLENBQUE7T0FIbkMsNEJBQTRCLENBZ0JqQyJ9