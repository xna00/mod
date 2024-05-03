/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal"], function (require, exports, event_1, lifecycle_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeartbeatService = void 0;
    class HeartbeatService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onBeat = this._register(new event_1.Emitter());
            this.onBeat = this._onBeat.event;
            const interval = setInterval(() => {
                this._onBeat.fire();
            }, terminal_1.HeartbeatConstants.BeatInterval);
            this._register((0, lifecycle_1.toDisposable)(() => clearInterval(interval)));
        }
    }
    exports.HeartbeatService = HeartbeatService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhcnRiZWF0U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS9oZWFydGJlYXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFhLGdCQUFpQixTQUFRLHNCQUFVO1FBSS9DO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFKUSxZQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDdEQsV0FBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBS3BDLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckIsQ0FBQyxFQUFFLDZCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztLQUNEO0lBWkQsNENBWUMifQ==