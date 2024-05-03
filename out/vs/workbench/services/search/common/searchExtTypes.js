/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextSearchCompleteMessageType = exports.Range = exports.Position = void 0;
    class Position {
        constructor(line, character) {
            this.line = line;
            this.character = character;
        }
        isBefore(other) { return false; }
        isBeforeOrEqual(other) { return false; }
        isAfter(other) { return false; }
        isAfterOrEqual(other) { return false; }
        isEqual(other) { return false; }
        compareTo(other) { return 0; }
        translate(_, _2) { return new Position(0, 0); }
        with(_) { return new Position(0, 0); }
    }
    exports.Position = Position;
    class Range {
        constructor(startLine, startCol, endLine, endCol) {
            this.isEmpty = false;
            this.isSingleLine = false;
            this.start = new Position(startLine, startCol);
            this.end = new Position(endLine, endCol);
        }
        contains(positionOrRange) { return false; }
        isEqual(other) { return false; }
        intersection(range) { return undefined; }
        union(other) { return new Range(0, 0, 0, 0); }
        with(_) { return new Range(0, 0, 0, 0); }
    }
    exports.Range = Range;
    /**
     * Represents the severity of a TextSearchComplete message.
     */
    var TextSearchCompleteMessageType;
    (function (TextSearchCompleteMessageType) {
        TextSearchCompleteMessageType[TextSearchCompleteMessageType["Information"] = 1] = "Information";
        TextSearchCompleteMessageType[TextSearchCompleteMessageType["Warning"] = 2] = "Warning";
    })(TextSearchCompleteMessageType || (exports.TextSearchCompleteMessageType = TextSearchCompleteMessageType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRXh0VHlwZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvY29tbW9uL3NlYXJjaEV4dFR5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFhLFFBQVE7UUFDcEIsWUFBcUIsSUFBWSxFQUFXLFNBQWlCO1lBQXhDLFNBQUksR0FBSixJQUFJLENBQVE7WUFBVyxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQUksQ0FBQztRQUVsRSxRQUFRLENBQUMsS0FBZSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRCxlQUFlLENBQUMsS0FBZSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzRCxPQUFPLENBQUMsS0FBZSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNuRCxjQUFjLENBQUMsS0FBZSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMxRCxPQUFPLENBQUMsS0FBZSxJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNuRCxTQUFTLENBQUMsS0FBZSxJQUFZLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUdoRCxTQUFTLENBQUMsQ0FBTyxFQUFFLEVBQVEsSUFBYyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHckUsSUFBSSxDQUFDLENBQU0sSUFBYyxPQUFPLElBQUksUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDckQ7SUFmRCw0QkFlQztJQUVELE1BQWEsS0FBSztRQUlqQixZQUFZLFNBQWlCLEVBQUUsUUFBZ0IsRUFBRSxPQUFlLEVBQUUsTUFBYztZQUtoRixZQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ2hCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBTHBCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFJRCxRQUFRLENBQUMsZUFBaUMsSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDdEUsT0FBTyxDQUFDLEtBQVksSUFBYSxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEQsWUFBWSxDQUFDLEtBQVksSUFBdUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ25FLEtBQUssQ0FBQyxLQUFZLElBQVcsT0FBTyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJNUQsSUFBSSxDQUFDLENBQU0sSUFBVyxPQUFPLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNyRDtJQW5CRCxzQkFtQkM7SUFnTkQ7O09BRUc7SUFDSCxJQUFZLDZCQUdYO0lBSEQsV0FBWSw2QkFBNkI7UUFDeEMsK0ZBQWUsQ0FBQTtRQUNmLHVGQUFXLENBQUE7SUFDWixDQUFDLEVBSFcsNkJBQTZCLDZDQUE3Qiw2QkFBNkIsUUFHeEMifQ==