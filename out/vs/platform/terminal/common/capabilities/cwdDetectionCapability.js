/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CwdDetectionCapability = void 0;
    class CwdDetectionCapability extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 0 /* TerminalCapability.CwdDetection */;
            this._cwd = '';
            this._cwds = new Map();
            this._onDidChangeCwd = this._register(new event_1.Emitter());
            this.onDidChangeCwd = this._onDidChangeCwd.event;
        }
        /**
         * Gets the list of cwds seen in this session in order of last accessed.
         */
        get cwds() {
            return Array.from(this._cwds.keys());
        }
        getCwd() {
            return this._cwd;
        }
        updateCwd(cwd) {
            const didChange = this._cwd !== cwd;
            this._cwd = cwd;
            const count = this._cwds.get(this._cwd) || 0;
            this._cwds.delete(this._cwd); // Delete to put it at the bottom of the iterable
            this._cwds.set(this._cwd, count + 1);
            if (didChange) {
                this._onDidChangeCwd.fire(cwd);
            }
        }
    }
    exports.CwdDetectionCapability = CwdDetectionCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3dkRGV0ZWN0aW9uQ2FwYWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvY29tbW9uL2NhcGFiaWxpdGllcy9jd2REZXRlY3Rpb25DYXBhYmlsaXR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFhLHNCQUF1QixTQUFRLHNCQUFVO1FBQXREOztZQUNVLFNBQUksMkNBQW1DO1lBQ3hDLFNBQUksR0FBRyxFQUFFLENBQUM7WUFDVixVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQXNDLENBQUM7WUFTN0Msb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUNoRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBZ0J0RCxDQUFDO1FBeEJBOztXQUVHO1FBQ0gsSUFBSSxJQUFJO1lBQ1AsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBS0QsTUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRUQsU0FBUyxDQUFDLEdBQVc7WUFDcEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7WUFDaEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpREFBaUQ7WUFDL0UsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDckMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBN0JELHdEQTZCQyJ9