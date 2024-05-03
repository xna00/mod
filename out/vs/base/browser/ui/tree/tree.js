/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WeakMapper = exports.TreeError = exports.TreeDragOverReactions = exports.TreeDragOverBubble = exports.TreeMouseEventTarget = exports.ObjectTreeElementCollapseState = exports.TreeVisibility = void 0;
    var TreeVisibility;
    (function (TreeVisibility) {
        /**
         * The tree node should be hidden.
         */
        TreeVisibility[TreeVisibility["Hidden"] = 0] = "Hidden";
        /**
         * The tree node should be visible.
         */
        TreeVisibility[TreeVisibility["Visible"] = 1] = "Visible";
        /**
         * The tree node should be visible if any of its descendants is visible.
         */
        TreeVisibility[TreeVisibility["Recurse"] = 2] = "Recurse";
    })(TreeVisibility || (exports.TreeVisibility = TreeVisibility = {}));
    var ObjectTreeElementCollapseState;
    (function (ObjectTreeElementCollapseState) {
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["Expanded"] = 0] = "Expanded";
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["Collapsed"] = 1] = "Collapsed";
        /**
         * If the element is already in the tree, preserve its current state. Else, expand it.
         */
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["PreserveOrExpanded"] = 2] = "PreserveOrExpanded";
        /**
         * If the element is already in the tree, preserve its current state. Else, collapse it.
         */
        ObjectTreeElementCollapseState[ObjectTreeElementCollapseState["PreserveOrCollapsed"] = 3] = "PreserveOrCollapsed";
    })(ObjectTreeElementCollapseState || (exports.ObjectTreeElementCollapseState = ObjectTreeElementCollapseState = {}));
    var TreeMouseEventTarget;
    (function (TreeMouseEventTarget) {
        TreeMouseEventTarget[TreeMouseEventTarget["Unknown"] = 0] = "Unknown";
        TreeMouseEventTarget[TreeMouseEventTarget["Twistie"] = 1] = "Twistie";
        TreeMouseEventTarget[TreeMouseEventTarget["Element"] = 2] = "Element";
        TreeMouseEventTarget[TreeMouseEventTarget["Filter"] = 3] = "Filter";
    })(TreeMouseEventTarget || (exports.TreeMouseEventTarget = TreeMouseEventTarget = {}));
    var TreeDragOverBubble;
    (function (TreeDragOverBubble) {
        TreeDragOverBubble[TreeDragOverBubble["Down"] = 0] = "Down";
        TreeDragOverBubble[TreeDragOverBubble["Up"] = 1] = "Up";
    })(TreeDragOverBubble || (exports.TreeDragOverBubble = TreeDragOverBubble = {}));
    exports.TreeDragOverReactions = {
        acceptBubbleUp() { return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */ }; },
        acceptBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, autoExpand }; },
        acceptCopyBubbleUp() { return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */, effect: { type: 0 /* ListDragOverEffectType.Copy */, position: "drop-target" /* ListDragOverEffectPosition.Over */ } }; },
        acceptCopyBubbleDown(autoExpand = false) { return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect: { type: 0 /* ListDragOverEffectType.Copy */, position: "drop-target" /* ListDragOverEffectPosition.Over */ }, autoExpand }; }
    };
    class TreeError extends Error {
        constructor(user, message) {
            super(`TreeError [${user}] ${message}`);
        }
    }
    exports.TreeError = TreeError;
    class WeakMapper {
        constructor(fn) {
            this.fn = fn;
            this._map = new WeakMap();
        }
        map(key) {
            let result = this._map.get(key);
            if (!result) {
                result = this.fn(key);
                this._map.set(key, result);
            }
            return result;
        }
    }
    exports.WeakMapper = WeakMapper;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3RyZWUvdHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsSUFBa0IsY0FnQmpCO0lBaEJELFdBQWtCLGNBQWM7UUFFL0I7O1dBRUc7UUFDSCx1REFBTSxDQUFBO1FBRU47O1dBRUc7UUFDSCx5REFBTyxDQUFBO1FBRVA7O1dBRUc7UUFDSCx5REFBTyxDQUFBO0lBQ1IsQ0FBQyxFQWhCaUIsY0FBYyw4QkFBZCxjQUFjLFFBZ0IvQjtJQXVERCxJQUFZLDhCQWFYO0lBYkQsV0FBWSw4QkFBOEI7UUFDekMsMkZBQVEsQ0FBQTtRQUNSLDZGQUFTLENBQUE7UUFFVDs7V0FFRztRQUNILCtHQUFrQixDQUFBO1FBRWxCOztXQUVHO1FBQ0gsaUhBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQWJXLDhCQUE4Qiw4Q0FBOUIsOEJBQThCLFFBYXpDO0lBcUVELElBQVksb0JBS1g7SUFMRCxXQUFZLG9CQUFvQjtRQUMvQixxRUFBTyxDQUFBO1FBQ1AscUVBQU8sQ0FBQTtRQUNQLHFFQUFPLENBQUE7UUFDUCxtRUFBTSxDQUFBO0lBQ1AsQ0FBQyxFQUxXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSy9CO0lBa0NELElBQWtCLGtCQUdqQjtJQUhELFdBQWtCLGtCQUFrQjtRQUNuQywyREFBSSxDQUFBO1FBQ0osdURBQUUsQ0FBQTtJQUNILENBQUMsRUFIaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFHbkM7SUFPWSxRQUFBLHFCQUFxQixHQUFHO1FBQ3BDLGNBQWMsS0FBNEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSwrQkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNuRyxnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsS0FBSyxJQUEyQixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLGlDQUF5QixFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNySSxrQkFBa0IsS0FBNEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSwrQkFBdUIsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLHFDQUE2QixFQUFFLFFBQVEscURBQWlDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqTSxvQkFBb0IsQ0FBQyxVQUFVLEdBQUcsS0FBSyxJQUEyQixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLGlDQUF5QixFQUFFLE1BQU0sRUFBRSxFQUFFLElBQUkscUNBQTZCLEVBQUUsUUFBUSxxREFBaUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNuTyxDQUFDO0lBTUYsTUFBYSxTQUFVLFNBQVEsS0FBSztRQUVuQyxZQUFZLElBQVksRUFBRSxPQUFlO1lBQ3hDLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQUxELDhCQUtDO0lBRUQsTUFBYSxVQUFVO1FBRXRCLFlBQW9CLEVBQWU7WUFBZixPQUFFLEdBQUYsRUFBRSxDQUFhO1lBRTNCLFNBQUksR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO1FBRkksQ0FBQztRQUl4QyxHQUFHLENBQUMsR0FBTTtZQUNULElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWhDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7S0FDRDtJQWhCRCxnQ0FnQkMifQ==