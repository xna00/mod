/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NaiveCwdDetectionCapability = void 0;
    class NaiveCwdDetectionCapability {
        constructor(_process) {
            this._process = _process;
            this.type = 1 /* TerminalCapability.NaiveCwdDetection */;
            this._cwd = '';
            this._onDidChangeCwd = new event_1.Emitter();
            this.onDidChangeCwd = this._onDidChangeCwd.event;
        }
        async getCwd() {
            if (!this._process) {
                return Promise.resolve('');
            }
            const newCwd = await this._process.getCwd();
            if (newCwd !== this._cwd) {
                this._onDidChangeCwd.fire(newCwd);
            }
            this._cwd = newCwd;
            return this._cwd;
        }
    }
    exports.NaiveCwdDetectionCapability = NaiveCwdDetectionCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFpdmVDd2REZXRlY3Rpb25DYXBhYmlsaXR5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZXJtaW5hbC9jb21tb24vY2FwYWJpbGl0aWVzL25haXZlQ3dkRGV0ZWN0aW9uQ2FwYWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSwyQkFBMkI7UUFDdkMsWUFBNkIsUUFBK0I7WUFBL0IsYUFBUSxHQUFSLFFBQVEsQ0FBdUI7WUFDbkQsU0FBSSxnREFBd0M7WUFDN0MsU0FBSSxHQUFHLEVBQUUsQ0FBQztZQUVELG9CQUFlLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUNoRCxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBTFcsQ0FBQztRQU9qRSxLQUFLLENBQUMsTUFBTTtZQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzVDLElBQUksTUFBTSxLQUFLLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDO1lBQ25CLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFuQkQsa0VBbUJDIn0=