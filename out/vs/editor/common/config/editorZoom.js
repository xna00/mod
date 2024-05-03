/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorZoom = void 0;
    exports.EditorZoom = new class {
        constructor() {
            this._zoomLevel = 0;
            this._onDidChangeZoomLevel = new event_1.Emitter();
            this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event;
        }
        getZoomLevel() {
            return this._zoomLevel;
        }
        setZoomLevel(zoomLevel) {
            zoomLevel = Math.min(Math.max(-5, zoomLevel), 20);
            if (this._zoomLevel === zoomLevel) {
                return;
            }
            this._zoomLevel = zoomLevel;
            this._onDidChangeZoomLevel.fire(this._zoomLevel);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yWm9vbS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb25maWcvZWRpdG9yWm9vbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVbkYsUUFBQSxVQUFVLEdBQWdCLElBQUk7UUFBQTtZQUVsQyxlQUFVLEdBQVcsQ0FBQyxDQUFDO1lBRWQsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUMvQyx5QkFBb0IsR0FBa0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztRQWV4RixDQUFDO1FBYk8sWUFBWTtZQUNsQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztRQUVNLFlBQVksQ0FBQyxTQUFpQjtZQUNwQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztZQUM1QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNsRCxDQUFDO0tBQ0QsQ0FBQyJ9