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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/contrib/debug/common/debug"], function (require, exports, lifecycle_1, observable_1, accessibilitySignalService_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilitySignalLineDebuggerContribution = void 0;
    let AccessibilitySignalLineDebuggerContribution = class AccessibilitySignalLineDebuggerContribution extends lifecycle_1.Disposable {
        constructor(debugService, accessibilitySignalService) {
            super();
            this.accessibilitySignalService = accessibilitySignalService;
            const isEnabled = (0, observable_1.observableFromEvent)(accessibilitySignalService.onSoundEnabledChanged(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak), () => accessibilitySignalService.isSoundEnabled(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description subscribe to debug sessions */
                if (!isEnabled.read(reader)) {
                    return;
                }
                const sessionDisposables = new Map();
                store.add((0, lifecycle_1.toDisposable)(() => {
                    sessionDisposables.forEach(d => d.dispose());
                    sessionDisposables.clear();
                }));
                store.add(debugService.onDidNewSession((session) => sessionDisposables.set(session, this.handleSession(session))));
                store.add(debugService.onDidEndSession(({ session }) => {
                    sessionDisposables.get(session)?.dispose();
                    sessionDisposables.delete(session);
                }));
                debugService
                    .getModel()
                    .getSessions()
                    .forEach((session) => sessionDisposables.set(session, this.handleSession(session)));
            }));
        }
        handleSession(session) {
            return session.onDidChangeState(e => {
                const stoppedDetails = session.getStoppedDetails();
                const BREAKPOINT_STOP_REASON = 'breakpoint';
                if (stoppedDetails && stoppedDetails.reason === BREAKPOINT_STOP_REASON) {
                    this.accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.onDebugBreak);
                }
            });
        }
    };
    exports.AccessibilitySignalLineDebuggerContribution = AccessibilitySignalLineDebuggerContribution;
    exports.AccessibilitySignalLineDebuggerContribution = AccessibilitySignalLineDebuggerContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, accessibilitySignalService_1.IAccessibilitySignalService)
    ], AccessibilitySignalLineDebuggerContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVNpZ25hbERlYnVnZ2VyQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9hY2Nlc3NpYmlsaXR5U2lnbmFscy9icm93c2VyL2FjY2Vzc2liaWxpdHlTaWduYWxEZWJ1Z2dlckNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSwyQ0FBMkMsR0FBakQsTUFBTSwyQ0FDWixTQUFRLHNCQUFVO1FBR2xCLFlBQ2dCLFlBQTJCLEVBQ0ksMEJBQXNEO1lBRXBHLEtBQUssRUFBRSxDQUFDO1lBRnNDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNEI7WUFJcEcsTUFBTSxTQUFTLEdBQUcsSUFBQSxnQ0FBbUIsRUFDcEMsMEJBQTBCLENBQUMscUJBQXFCLENBQUMsZ0RBQW1CLENBQUMsWUFBWSxDQUFDLEVBQ2xGLEdBQUcsRUFBRSxDQUFDLDBCQUEwQixDQUFDLGNBQWMsQ0FBQyxnREFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FDakYsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSw2QkFBZ0IsRUFBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDakQsK0NBQStDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUM3QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztnQkFDakUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO29CQUMzQixrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDN0Msa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosS0FBSyxDQUFDLEdBQUcsQ0FDUixZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FDeEMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQzVELENBQ0QsQ0FBQztnQkFFRixLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7b0JBQ3RELGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDM0Msa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLFlBQVk7cUJBQ1YsUUFBUSxFQUFFO3FCQUNWLFdBQVcsRUFBRTtxQkFDYixPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUNwQixrQkFBa0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FDNUQsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sYUFBYSxDQUFDLE9BQXNCO1lBQzNDLE9BQU8sT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxzQkFBc0IsR0FBRyxZQUFZLENBQUM7Z0JBQzVDLElBQUksY0FBYyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssc0JBQXNCLEVBQUUsQ0FBQztvQkFDeEUsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxnREFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDOUUsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUosQ0FBQztLQUNELENBQUE7SUF4RFksa0dBQTJDOzBEQUEzQywyQ0FBMkM7UUFLckQsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSx3REFBMkIsQ0FBQTtPQU5qQiwyQ0FBMkMsQ0F3RHZEIn0=