/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sequence = void 0;
    class Sequence {
        constructor() {
            this.elements = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
        }
        splice(start, deleteCount, toInsert = []) {
            this.elements.splice(start, deleteCount, ...toInsert);
            this._onDidSplice.fire({ start, deleteCount, toInsert });
        }
    }
    exports.Sequence = Sequence;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VxdWVuY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3NlcXVlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSxRQUFRO1FBQXJCO1lBRVUsYUFBUSxHQUFRLEVBQUUsQ0FBQztZQUVYLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQWMsQ0FBQztZQUNqRCxnQkFBVyxHQUFzQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQU1uRSxDQUFDO1FBSkEsTUFBTSxDQUFDLEtBQWEsRUFBRSxXQUFtQixFQUFFLFdBQXlCLEVBQUU7WUFDckUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzFELENBQUM7S0FDRDtJQVhELDRCQVdDIn0=