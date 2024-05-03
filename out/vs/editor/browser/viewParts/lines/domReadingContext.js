/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomReadingContext = void 0;
    class DomReadingContext {
        get didDomLayout() {
            return this._didDomLayout;
        }
        readClientRect() {
            if (!this._clientRectRead) {
                this._clientRectRead = true;
                const rect = this._domNode.getBoundingClientRect();
                this.markDidDomLayout();
                this._clientRectDeltaLeft = rect.left;
                this._clientRectScale = rect.width / this._domNode.offsetWidth;
            }
        }
        get clientRectDeltaLeft() {
            if (!this._clientRectRead) {
                this.readClientRect();
            }
            return this._clientRectDeltaLeft;
        }
        get clientRectScale() {
            if (!this._clientRectRead) {
                this.readClientRect();
            }
            return this._clientRectScale;
        }
        constructor(_domNode, endNode) {
            this._domNode = _domNode;
            this.endNode = endNode;
            this._didDomLayout = false;
            this._clientRectDeltaLeft = 0;
            this._clientRectScale = 1;
            this._clientRectRead = false;
        }
        markDidDomLayout() {
            this._didDomLayout = true;
        }
    }
    exports.DomReadingContext = DomReadingContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tUmVhZGluZ0NvbnRleHQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9saW5lcy9kb21SZWFkaW5nQ29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsTUFBYSxpQkFBaUI7UUFPN0IsSUFBVyxZQUFZO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRU8sY0FBYztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztnQkFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDO1lBQ2hFLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBVyxtQkFBbUI7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBVyxlQUFlO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7UUFDOUIsQ0FBQztRQUVELFlBQ2tCLFFBQXFCLEVBQ3RCLE9BQW9CO1lBRG5CLGFBQVEsR0FBUixRQUFRLENBQWE7WUFDdEIsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQW5DN0Isa0JBQWEsR0FBWSxLQUFLLENBQUM7WUFDL0IseUJBQW9CLEdBQVcsQ0FBQyxDQUFDO1lBQ2pDLHFCQUFnQixHQUFXLENBQUMsQ0FBQztZQUM3QixvQkFBZSxHQUFZLEtBQUssQ0FBQztRQWtDekMsQ0FBQztRQUVNLGdCQUFnQjtZQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMzQixDQUFDO0tBQ0Q7SUE1Q0QsOENBNENDIn0=