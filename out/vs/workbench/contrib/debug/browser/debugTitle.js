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
define(["require", "exports", "vs/workbench/contrib/debug/common/debug", "vs/base/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/workbench/services/title/browser/titleService"], function (require, exports, debug_1, lifecycle_1, host_1, titleService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTitleContribution = void 0;
    let DebugTitleContribution = class DebugTitleContribution {
        constructor(debugService, hostService, titleService) {
            this.toDispose = [];
            const updateTitle = () => {
                if (debugService.state === 2 /* State.Stopped */ && !hostService.hasFocus) {
                    titleService.updateProperties({ prefix: '🔴' });
                }
                else {
                    titleService.updateProperties({ prefix: '' });
                }
            };
            this.toDispose.push(debugService.onDidChangeState(updateTitle));
            this.toDispose.push(hostService.onDidChangeFocus(updateTitle));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.DebugTitleContribution = DebugTitleContribution;
    exports.DebugTitleContribution = DebugTitleContribution = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, host_1.IHostService),
        __param(2, titleService_1.ITitleService)
    ], DebugTitleContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdUaXRsZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z1RpdGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUlsQyxZQUNnQixZQUEyQixFQUM1QixXQUF5QixFQUN4QixZQUEyQjtZQUxuQyxjQUFTLEdBQWtCLEVBQUUsQ0FBQztZQU9yQyxNQUFNLFdBQVcsR0FBRyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksWUFBWSxDQUFDLEtBQUssMEJBQWtCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ25FLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLENBQUM7WUFDRixDQUFDLENBQUM7WUFDRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsT0FBTztZQUNOLElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekIsQ0FBQztLQUNELENBQUE7SUF2Qlksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFLaEMsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxtQkFBWSxDQUFBO1FBQ1osV0FBQSw0QkFBYSxDQUFBO09BUEgsc0JBQXNCLENBdUJsQyJ9