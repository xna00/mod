/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/list/browser/listService", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/common/testId"], function (require, exports, listService_1, index_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingObjectTree = void 0;
    class TestingObjectTree extends listService_1.WorkbenchObjectTree {
        /**
         * Gets a serialized view state for the tree, optimized for storage.
         *
         * @param updatePreviousState Optional previous state to mutate and update
         * instead of creating a new one.
         */
        getOptimizedViewState(updatePreviousState) {
            const root = updatePreviousState || {};
            /**
             * Recursive builder function. Returns whether the subtree has any non-default
             * value. Adds itself to the parent children if it does.
             */
            const build = (node, parent) => {
                if (!(node.element instanceof index_1.TestItemTreeElement)) {
                    return false;
                }
                const localId = testId_1.TestId.localId(node.element.test.item.extId);
                const inTree = parent.children?.[localId] || {};
                // only saved collapsed state if it's not the default (not collapsed, or a root depth)
                inTree.collapsed = node.depth === 0 || !node.collapsed ? node.collapsed : undefined;
                let hasAnyNonDefaultValue = inTree.collapsed !== undefined;
                if (node.children.length) {
                    for (const child of node.children) {
                        hasAnyNonDefaultValue = build(child, inTree) || hasAnyNonDefaultValue;
                    }
                }
                if (hasAnyNonDefaultValue) {
                    parent.children ??= {};
                    parent.children[localId] = inTree;
                }
                else if (parent.children?.hasOwnProperty(localId)) {
                    delete parent.children[localId];
                }
                return hasAnyNonDefaultValue;
            };
            root.children ??= {};
            // Controller IDs are hidden if there's only a single test controller, but
            // make sure they're added when the tree is built if this is the case, so
            // that the later ID lookup works.
            for (const node of this.getNode().children) {
                if (node.element instanceof index_1.TestItemTreeElement) {
                    if (node.element.test.controllerId === node.element.test.item.extId) {
                        build(node, root);
                    }
                    else {
                        const ctrlNode = root.children[node.element.test.controllerId] ??= { children: {} };
                        build(node, ctrlNode);
                    }
                }
            }
            return root;
        }
    }
    exports.TestingObjectTree = TestingObjectTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ09iamVjdFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9leHBsb3JlclByb2plY3Rpb25zL3Rlc3RpbmdPYmplY3RUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLGlCQUFzQyxTQUFRLGlDQUF5RDtRQUVuSDs7Ozs7V0FLRztRQUNJLHFCQUFxQixDQUFDLG1CQUFzRDtZQUNsRixNQUFNLElBQUksR0FBcUMsbUJBQW1CLElBQUksRUFBRSxDQUFDO1lBRXpFOzs7ZUFHRztZQUNILE1BQU0sS0FBSyxHQUFHLENBQUMsSUFBd0QsRUFBRSxNQUF3QyxFQUFXLEVBQUU7Z0JBQzdILElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLFlBQVksMkJBQW1CLENBQUMsRUFBRSxDQUFDO29CQUNwRCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUVELE1BQU0sT0FBTyxHQUFHLGVBQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoRCxzRkFBc0Y7Z0JBQ3RGLE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBRXBGLElBQUkscUJBQXFCLEdBQUcsTUFBTSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7Z0JBQzNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDMUIsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ25DLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUkscUJBQXFCLENBQUM7b0JBQ3ZFLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLHFCQUFxQixFQUFFLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxRQUFRLEtBQUssRUFBRSxDQUFDO29CQUN2QixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQ3JELE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxPQUFPLHFCQUFxQixDQUFDO1lBQzlCLENBQUMsQ0FBQztZQUVGLElBQUksQ0FBQyxRQUFRLEtBQUssRUFBRSxDQUFDO1lBRXJCLDBFQUEwRTtZQUMxRSx5RUFBeUU7WUFDekUsa0NBQWtDO1lBQ2xDLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxPQUFPLFlBQVksMkJBQW1CLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNyRSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNuQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQzt3QkFDcEYsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDdkIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNEO0lBNURELDhDQTREQyJ9