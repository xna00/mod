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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/userActivity/common/userActivityRegistry"], function (require, exports, async_1, event_1, lifecycle_1, extensions_1, instantiation_1, userActivityRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserActivityService = exports.IUserActivityService = void 0;
    exports.IUserActivityService = (0, instantiation_1.createDecorator)('IUserActivityService');
    let UserActivityService = class UserActivityService extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.markInactive = this._register(new async_1.RunOnceScheduler(() => {
                this.isActive = false;
                this.changeEmitter.fire(false);
            }, 10_000));
            this.changeEmitter = this._register(new event_1.Emitter);
            this.active = 0;
            /**
             * @inheritdoc
             *
             * Note: initialized to true, since the user just did something to open the
             * window. The bundled DomActivityTracker will initially assume activity
             * as well in order to unset this if the window gets abandoned.
             */
            this.isActive = true;
            /** @inheritdoc */
            this.onDidChangeIsActive = this.changeEmitter.event;
            this._register((0, async_1.runWhenGlobalIdle)(() => userActivityRegistry_1.userActivityRegistry.take(this, instantiationService)));
        }
        /** @inheritdoc */
        markActive() {
            if (++this.active === 1) {
                this.isActive = true;
                this.changeEmitter.fire(true);
                this.markInactive.cancel();
            }
            return (0, lifecycle_1.toDisposable)(() => {
                if (--this.active === 0) {
                    this.markInactive.schedule();
                }
            });
        }
    };
    exports.UserActivityService = UserActivityService;
    exports.UserActivityService = UserActivityService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], UserActivityService);
    (0, extensions_1.registerSingleton)(exports.IUserActivityService, UserActivityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckFjdGl2aXR5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJBY3Rpdml0eS9jb21tb24vdXNlckFjdGl2aXR5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ25GLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixzQkFBc0IsQ0FBQyxDQUFDO0lBRTNGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFzQmxELFlBQW1DLG9CQUEyQztZQUM3RSxLQUFLLEVBQUUsQ0FBQztZQXJCUSxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3hFLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUVLLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQWdCLENBQUMsQ0FBQztZQUM5RCxXQUFNLEdBQUcsQ0FBQyxDQUFDO1lBRW5COzs7Ozs7ZUFNRztZQUNJLGFBQVEsR0FBRyxJQUFJLENBQUM7WUFFdkIsa0JBQWtCO1lBQ2xCLHdCQUFtQixHQUFtQixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUk5RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQWlCLEVBQUMsR0FBRyxFQUFFLENBQUMsMkNBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDO1FBRUQsa0JBQWtCO1FBQ2xCLFVBQVU7WUFDVCxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFFRCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQXpDWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQXNCbEIsV0FBQSxxQ0FBcUIsQ0FBQTtPQXRCdEIsbUJBQW1CLENBeUMvQjtJQUVELElBQUEsOEJBQWlCLEVBQUMsNEJBQW9CLEVBQUUsbUJBQW1CLG9DQUE0QixDQUFDIn0=