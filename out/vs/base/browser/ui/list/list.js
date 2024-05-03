/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedListVirtualDelegate = exports.ListError = exports.ListDragOverReactions = exports.ListDragOverEffectPosition = exports.ListDragOverEffectType = void 0;
    var ListDragOverEffectType;
    (function (ListDragOverEffectType) {
        ListDragOverEffectType[ListDragOverEffectType["Copy"] = 0] = "Copy";
        ListDragOverEffectType[ListDragOverEffectType["Move"] = 1] = "Move";
    })(ListDragOverEffectType || (exports.ListDragOverEffectType = ListDragOverEffectType = {}));
    var ListDragOverEffectPosition;
    (function (ListDragOverEffectPosition) {
        ListDragOverEffectPosition["Over"] = "drop-target";
        ListDragOverEffectPosition["Before"] = "drop-target-before";
        ListDragOverEffectPosition["After"] = "drop-target-after";
    })(ListDragOverEffectPosition || (exports.ListDragOverEffectPosition = ListDragOverEffectPosition = {}));
    exports.ListDragOverReactions = {
        reject() { return { accept: false }; },
        accept() { return { accept: true }; },
    };
    class ListError extends Error {
        constructor(user, message) {
            super(`ListError [${user}] ${message}`);
        }
    }
    exports.ListError = ListError;
    class CachedListVirtualDelegate {
        constructor() {
            this.cache = new WeakMap();
        }
        getHeight(element) {
            return this.cache.get(element) ?? this.estimateHeight(element);
        }
        setDynamicHeight(element, height) {
            if (height > 0) {
                this.cache.set(element, height);
            }
        }
    }
    exports.CachedListVirtualDelegate = CachedListVirtualDelegate;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2xpc3QvbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRmhHLElBQWtCLHNCQUdqQjtJQUhELFdBQWtCLHNCQUFzQjtRQUN2QyxtRUFBSSxDQUFBO1FBQ0osbUVBQUksQ0FBQTtJQUNMLENBQUMsRUFIaUIsc0JBQXNCLHNDQUF0QixzQkFBc0IsUUFHdkM7SUFFRCxJQUFrQiwwQkFJakI7SUFKRCxXQUFrQiwwQkFBMEI7UUFDM0Msa0RBQW9CLENBQUE7UUFDcEIsMkRBQTZCLENBQUE7UUFDN0IseURBQTJCLENBQUE7SUFDNUIsQ0FBQyxFQUppQiwwQkFBMEIsMENBQTFCLDBCQUEwQixRQUkzQztJQWFZLFFBQUEscUJBQXFCLEdBQUc7UUFDcEMsTUFBTSxLQUE0QixPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3RCxNQUFNLEtBQTRCLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVELENBQUM7SUFnQkYsTUFBYSxTQUFVLFNBQVEsS0FBSztRQUVuQyxZQUFZLElBQVksRUFBRSxPQUFlO1lBQ3hDLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQUxELDhCQUtDO0lBRUQsTUFBc0IseUJBQXlCO1FBQS9DO1lBRVMsVUFBSyxHQUFHLElBQUksT0FBTyxFQUFhLENBQUM7UUFjMUMsQ0FBQztRQVpBLFNBQVMsQ0FBQyxPQUFVO1lBQ25CLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBS0QsZ0JBQWdCLENBQUMsT0FBVSxFQUFFLE1BQWM7WUFDMUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBaEJELDhEQWdCQyJ9