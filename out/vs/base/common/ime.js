/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IME = exports.IMEImpl = void 0;
    class IMEImpl {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._enabled = true;
        }
        get enabled() {
            return this._enabled;
        }
        /**
         * Enable IME
         */
        enable() {
            this._enabled = true;
            this._onDidChange.fire();
        }
        /**
         * Disable IME
         */
        disable() {
            this._enabled = false;
            this._onDidChange.fire();
        }
    }
    exports.IMEImpl = IMEImpl;
    exports.IME = new IMEImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9pbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBSWhHLE1BQWEsT0FBTztRQUFwQjtZQUVrQixpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDcEMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUU5QyxhQUFRLEdBQUcsSUFBSSxDQUFDO1FBcUJ6QixDQUFDO1FBbkJBLElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksTUFBTTtZQUNaLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksT0FBTztZQUNiLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNEO0lBMUJELDBCQTBCQztJQUVZLFFBQUEsR0FBRyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUMifQ==