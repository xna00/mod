/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BufferMarkCapability = void 0;
    /**
     * Manages "marks" in the buffer which are lines that are tracked when lines are added to or removed
     * from the buffer.
     */
    class BufferMarkCapability extends lifecycle_1.Disposable {
        constructor(_terminal) {
            super();
            this._terminal = _terminal;
            this.type = 4 /* TerminalCapability.BufferMarkDetection */;
            this._idToMarkerMap = new Map();
            this._anonymousMarkers = new Map();
            this._onMarkAdded = this._register(new event_1.Emitter());
            this.onMarkAdded = this._onMarkAdded.event;
        }
        *markers() {
            for (const m of this._idToMarkerMap.values()) {
                yield m;
            }
            for (const m of this._anonymousMarkers.values()) {
                yield m;
            }
        }
        addMark(properties) {
            const marker = properties?.marker || this._terminal.registerMarker();
            const id = properties?.id;
            if (!marker) {
                return;
            }
            if (id) {
                this._idToMarkerMap.set(id, marker);
                marker.onDispose(() => this._idToMarkerMap.delete(id));
            }
            else {
                this._anonymousMarkers.set(marker.id, marker);
                marker.onDispose(() => this._anonymousMarkers.delete(marker.id));
            }
            this._onMarkAdded.fire({ marker, id, hidden: properties?.hidden, hoverMessage: properties?.hoverMessage });
        }
        getMark(id) {
            return this._idToMarkerMap.get(id);
        }
    }
    exports.BufferMarkCapability = BufferMarkCapability;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyTWFya0NhcGFiaWxpdHkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL2NvbW1vbi9jYXBhYmlsaXRpZXMvYnVmZmVyTWFya0NhcGFiaWxpdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHOzs7T0FHRztJQUNILE1BQWEsb0JBQXFCLFNBQVEsc0JBQVU7UUFVbkQsWUFDa0IsU0FBbUI7WUFFcEMsS0FBSyxFQUFFLENBQUM7WUFGUyxjQUFTLEdBQVQsU0FBUyxDQUFVO1lBVDVCLFNBQUksa0RBQTBDO1lBRS9DLG1CQUFjLEdBQXlCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDakQsc0JBQWlCLEdBQXlCLElBQUksR0FBRyxFQUFFLENBQUM7WUFFM0MsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFtQixDQUFDLENBQUM7WUFDdEUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQU0vQyxDQUFDO1FBRUQsQ0FBQyxPQUFPO1lBQ1AsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztZQUNELEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsVUFBNEI7WUFDbkMsTUFBTSxNQUFNLEdBQUcsVUFBVSxFQUFFLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3JFLE1BQU0sRUFBRSxHQUFHLFVBQVUsRUFBRSxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDUixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUVELE9BQU8sQ0FBQyxFQUFVO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNEO0lBNUNELG9EQTRDQyJ9