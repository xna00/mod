/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/common/iterator", "vs/css!./media/tree"], function (require, exports, abstractTree_1, indexTreeModel_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexTree = void 0;
    class IndexTree extends abstractTree_1.AbstractTree {
        constructor(user, container, delegate, renderers, rootElement, options = {}) {
            super(user, container, delegate, renderers, options);
            this.rootElement = rootElement;
        }
        splice(location, deleteCount, toInsert = iterator_1.Iterable.empty()) {
            this.model.splice(location, deleteCount, toInsert);
        }
        rerender(location) {
            if (location === undefined) {
                this.view.rerender();
                return;
            }
            this.model.rerender(location);
        }
        updateElementHeight(location, height) {
            this.model.updateElementHeight(location, height);
        }
        createModel(user, view, options) {
            return new indexTreeModel_1.IndexTreeModel(user, view, this.rootElement, options);
        }
    }
    exports.IndexTree = IndexTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS9pbmRleFRyZWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsU0FBaUMsU0FBUSwyQkFBc0M7UUFJM0YsWUFDQyxJQUFZLEVBQ1osU0FBc0IsRUFDdEIsUUFBaUMsRUFDakMsU0FBK0MsRUFDdkMsV0FBYyxFQUN0QixVQUE2QyxFQUFFO1lBRS9DLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFIN0MsZ0JBQVcsR0FBWCxXQUFXLENBQUc7UUFJdkIsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFrQixFQUFFLFdBQW1CLEVBQUUsV0FBc0MsbUJBQVEsQ0FBQyxLQUFLLEVBQUU7WUFDckcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsUUFBUSxDQUFDLFFBQW1CO1lBQzNCLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNyQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxRQUFrQixFQUFFLE1BQWM7WUFDckQsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVTLFdBQVcsQ0FBQyxJQUFZLEVBQUUsSUFBc0MsRUFBRSxPQUEwQztZQUNySCxPQUFPLElBQUksK0JBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEUsQ0FBQztLQUNEO0lBbkNELDhCQW1DQyJ9