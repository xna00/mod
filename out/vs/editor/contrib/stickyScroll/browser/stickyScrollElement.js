/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyModel = exports.StickyElement = exports.StickyRange = void 0;
    class StickyRange {
        constructor(startLineNumber, endLineNumber) {
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
        }
    }
    exports.StickyRange = StickyRange;
    class StickyElement {
        constructor(
        /**
         * Range of line numbers spanned by the current scope
         */
        range, 
        /**
         * Must be sorted by start line number
        */
        children, 
        /**
         * Parent sticky outline element
         */
        parent) {
            this.range = range;
            this.children = children;
            this.parent = parent;
        }
    }
    exports.StickyElement = StickyElement;
    class StickyModel {
        constructor(uri, version, element, outlineProviderId) {
            this.uri = uri;
            this.version = version;
            this.element = element;
            this.outlineProviderId = outlineProviderId;
        }
    }
    exports.StickyModel = StickyModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsRWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvc3RpY2t5U2Nyb2xsRWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSxXQUFXO1FBQ3ZCLFlBQ2lCLGVBQXVCLEVBQ3ZCLGFBQXFCO1lBRHJCLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ3ZCLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ2xDLENBQUM7S0FDTDtJQUxELGtDQUtDO0lBRUQsTUFBYSxhQUFhO1FBRXpCO1FBQ0M7O1dBRUc7UUFDYSxLQUE4QjtRQUM5Qzs7VUFFRTtRQUNjLFFBQXlCO1FBQ3pDOztXQUVHO1FBQ2EsTUFBaUM7WUFSakMsVUFBSyxHQUFMLEtBQUssQ0FBeUI7WUFJOUIsYUFBUSxHQUFSLFFBQVEsQ0FBaUI7WUFJekIsV0FBTSxHQUFOLE1BQU0sQ0FBMkI7UUFFbEQsQ0FBQztLQUNEO0lBakJELHNDQWlCQztJQUVELE1BQWEsV0FBVztRQUN2QixZQUNVLEdBQVEsRUFDUixPQUFlLEVBQ2YsT0FBa0MsRUFDbEMsaUJBQXFDO1lBSHJDLFFBQUcsR0FBSCxHQUFHLENBQUs7WUFDUixZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsWUFBTyxHQUFQLE9BQU8sQ0FBMkI7WUFDbEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQUMzQyxDQUFDO0tBQ0w7SUFQRCxrQ0FPQyJ9