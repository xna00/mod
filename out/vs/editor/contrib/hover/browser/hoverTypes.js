/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverParticipantRegistry = exports.HoverForeignElementAnchor = exports.HoverRangeAnchor = exports.HoverAnchorType = void 0;
    var HoverAnchorType;
    (function (HoverAnchorType) {
        HoverAnchorType[HoverAnchorType["Range"] = 1] = "Range";
        HoverAnchorType[HoverAnchorType["ForeignElement"] = 2] = "ForeignElement";
    })(HoverAnchorType || (exports.HoverAnchorType = HoverAnchorType = {}));
    class HoverRangeAnchor {
        constructor(priority, range, initialMousePosX, initialMousePosY) {
            this.priority = priority;
            this.range = range;
            this.initialMousePosX = initialMousePosX;
            this.initialMousePosY = initialMousePosY;
            this.type = 1 /* HoverAnchorType.Range */;
        }
        equals(other) {
            return (other.type === 1 /* HoverAnchorType.Range */ && this.range.equalsRange(other.range));
        }
        canAdoptVisibleHover(lastAnchor, showAtPosition) {
            return (lastAnchor.type === 1 /* HoverAnchorType.Range */ && showAtPosition.lineNumber === this.range.startLineNumber);
        }
    }
    exports.HoverRangeAnchor = HoverRangeAnchor;
    class HoverForeignElementAnchor {
        constructor(priority, owner, range, initialMousePosX, initialMousePosY, supportsMarkerHover) {
            this.priority = priority;
            this.owner = owner;
            this.range = range;
            this.initialMousePosX = initialMousePosX;
            this.initialMousePosY = initialMousePosY;
            this.supportsMarkerHover = supportsMarkerHover;
            this.type = 2 /* HoverAnchorType.ForeignElement */;
        }
        equals(other) {
            return (other.type === 2 /* HoverAnchorType.ForeignElement */ && this.owner === other.owner);
        }
        canAdoptVisibleHover(lastAnchor, showAtPosition) {
            return (lastAnchor.type === 2 /* HoverAnchorType.ForeignElement */ && this.owner === lastAnchor.owner);
        }
    }
    exports.HoverForeignElementAnchor = HoverForeignElementAnchor;
    exports.HoverParticipantRegistry = (new class HoverParticipantRegistry {
        constructor() {
            this._participants = [];
        }
        register(ctor) {
            this._participants.push(ctor);
        }
        getAll() {
            return this._participants;
        }
    }());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJUeXBlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9ob3ZlclR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFDaEcsSUFBa0IsZUFHakI7SUFIRCxXQUFrQixlQUFlO1FBQ2hDLHVEQUFTLENBQUE7UUFDVCx5RUFBa0IsQ0FBQTtJQUNuQixDQUFDLEVBSGlCLGVBQWUsK0JBQWYsZUFBZSxRQUdoQztJQUVELE1BQWEsZ0JBQWdCO1FBRTVCLFlBQ2lCLFFBQWdCLEVBQ2hCLEtBQVksRUFDWixnQkFBb0MsRUFDcEMsZ0JBQW9DO1lBSHBDLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDaEIsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBb0I7WUFDcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFvQjtZQUxyQyxTQUFJLGlDQUF5QjtRQU83QyxDQUFDO1FBQ00sTUFBTSxDQUFDLEtBQWtCO1lBQy9CLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxrQ0FBMEIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBQ00sb0JBQW9CLENBQUMsVUFBdUIsRUFBRSxjQUF3QjtZQUM1RSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksa0NBQTBCLElBQUksY0FBYyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2hILENBQUM7S0FDRDtJQWZELDRDQWVDO0lBRUQsTUFBYSx5QkFBeUI7UUFFckMsWUFDaUIsUUFBZ0IsRUFDaEIsS0FBOEIsRUFDOUIsS0FBWSxFQUNaLGdCQUFvQyxFQUNwQyxnQkFBb0MsRUFDcEMsbUJBQXdDO1lBTHhDLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDaEIsVUFBSyxHQUFMLEtBQUssQ0FBeUI7WUFDOUIsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBb0I7WUFDcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFvQjtZQUNwQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBUHpDLFNBQUksMENBQWtDO1FBU3RELENBQUM7UUFDTSxNQUFNLENBQUMsS0FBa0I7WUFDL0IsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLDJDQUFtQyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFDTSxvQkFBb0IsQ0FBQyxVQUF1QixFQUFFLGNBQXdCO1lBQzVFLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSwyQ0FBbUMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRyxDQUFDO0tBQ0Q7SUFqQkQsOERBaUJDO0lBdURZLFFBQUEsd0JBQXdCLEdBQUcsQ0FBQyxJQUFJLE1BQU0sd0JBQXdCO1FBQTlCO1lBRTVDLGtCQUFhLEdBQWtDLEVBQUUsQ0FBQztRQVVuRCxDQUFDO1FBUk8sUUFBUSxDQUFvQyxJQUFrRjtZQUNwSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFtQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVNLE1BQU07WUFDWixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztLQUVELEVBQUUsQ0FBQyxDQUFDIn0=