/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinePart = exports.LinePartMetadata = void 0;
    var LinePartMetadata;
    (function (LinePartMetadata) {
        LinePartMetadata[LinePartMetadata["IS_WHITESPACE"] = 1] = "IS_WHITESPACE";
        LinePartMetadata[LinePartMetadata["PSEUDO_BEFORE"] = 2] = "PSEUDO_BEFORE";
        LinePartMetadata[LinePartMetadata["PSEUDO_AFTER"] = 4] = "PSEUDO_AFTER";
        LinePartMetadata[LinePartMetadata["IS_WHITESPACE_MASK"] = 1] = "IS_WHITESPACE_MASK";
        LinePartMetadata[LinePartMetadata["PSEUDO_BEFORE_MASK"] = 2] = "PSEUDO_BEFORE_MASK";
        LinePartMetadata[LinePartMetadata["PSEUDO_AFTER_MASK"] = 4] = "PSEUDO_AFTER_MASK";
    })(LinePartMetadata || (exports.LinePartMetadata = LinePartMetadata = {}));
    class LinePart {
        constructor(
        /**
         * last char index of this token (not inclusive).
         */
        endIndex, type, metadata, containsRTL) {
            this.endIndex = endIndex;
            this.type = type;
            this.metadata = metadata;
            this.containsRTL = containsRTL;
            this._linePartBrand = undefined;
        }
        isWhitespace() {
            return (this.metadata & 1 /* LinePartMetadata.IS_WHITESPACE_MASK */ ? true : false);
        }
        isPseudoAfter() {
            return (this.metadata & 4 /* LinePartMetadata.PSEUDO_AFTER_MASK */ ? true : false);
        }
    }
    exports.LinePart = LinePart;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld0xheW91dC9saW5lUGFydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsSUFBa0IsZ0JBUWpCO0lBUkQsV0FBa0IsZ0JBQWdCO1FBQ2pDLHlFQUFpQixDQUFBO1FBQ2pCLHlFQUFpQixDQUFBO1FBQ2pCLHVFQUFnQixDQUFBO1FBRWhCLG1GQUEwQixDQUFBO1FBQzFCLG1GQUEwQixDQUFBO1FBQzFCLGlGQUF5QixDQUFBO0lBQzFCLENBQUMsRUFSaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFRakM7SUFFRCxNQUFhLFFBQVE7UUFHcEI7UUFDQzs7V0FFRztRQUNhLFFBQWdCLEVBQ2hCLElBQVksRUFDWixRQUFnQixFQUNoQixXQUFvQjtZQUhwQixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ2hCLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWixhQUFRLEdBQVIsUUFBUSxDQUFRO1lBQ2hCLGdCQUFXLEdBQVgsV0FBVyxDQUFTO1lBVHJDLG1CQUFjLEdBQVMsU0FBUyxDQUFDO1FBVTdCLENBQUM7UUFFRSxZQUFZO1lBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSw4Q0FBc0MsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRU0sYUFBYTtZQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsNkNBQXFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNEO0lBcEJELDRCQW9CQyJ9