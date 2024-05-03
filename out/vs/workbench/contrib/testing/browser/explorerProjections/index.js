/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/tree", "vs/base/common/event", "vs/base/common/iterator", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, tree_1, event_1, iterator_1, testingViewState_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getChildrenForParent = exports.testIdentityProvider = exports.TestTreeErrorMessage = exports.TestItemTreeElement = void 0;
    let idCounter = 0;
    const getId = () => String(idCounter++);
    class TestItemTreeElement {
        constructor(test, 
        /**
         * Parent tree item. May not actually be the test item who owns this one
         * in a 'flat' projection.
         */
        parent = null) {
            this.test = test;
            this.parent = parent;
            this.changeEmitter = new event_1.Emitter();
            /**
             * Fired whenever the element or test properties change.
             */
            this.onChange = this.changeEmitter.event;
            /**
             * Tree children of this item.
             */
            this.children = new Set();
            /**
             * Unique ID of the element in the tree.
             */
            this.treeId = getId();
            /**
             * Depth of the element in the tree.
             */
            this.depth = this.parent ? this.parent.depth + 1 : 0;
            /**
             * Whether the node's test result is 'retired' -- from an outdated test run.
             */
            this.retired = false;
            /**
             * State to show on the item. This is generally the item's computed state
             * from its children.
             */
            this.state = 0 /* TestResultState.Unset */;
        }
        toJSON() {
            if (this.depth === 0) {
                return { controllerId: this.test.controllerId };
            }
            const context = {
                $mid: 16 /* MarshalledId.TestItemContext */,
                tests: [testTypes_1.InternalTestItem.serialize(this.test)],
            };
            for (let p = this.parent; p && p.depth > 0; p = p.parent) {
                context.tests.unshift(testTypes_1.InternalTestItem.serialize(p.test));
            }
            return context;
        }
    }
    exports.TestItemTreeElement = TestItemTreeElement;
    class TestTreeErrorMessage {
        get description() {
            return typeof this.message === 'string' ? this.message : this.message.value;
        }
        constructor(message, parent) {
            this.message = message;
            this.parent = parent;
            this.treeId = getId();
            this.children = new Set();
        }
    }
    exports.TestTreeErrorMessage = TestTreeErrorMessage;
    exports.testIdentityProvider = {
        getId(element) {
            // For "not expandable" elements, whether they have children is part of the
            // ID so they're rerendered if that changes (#204805)
            const expandComponent = element instanceof TestTreeErrorMessage
                ? 'error'
                : element.test.expand === 0 /* TestItemExpandState.NotExpandable */
                    ? !!element.children.size
                    : element.test.expand;
            return element.treeId + '\0' + expandComponent;
        }
    };
    const getChildrenForParent = (serialized, rootsWithChildren, node) => {
        let it;
        if (node === null) { // roots
            const rootsWithChildrenArr = [...rootsWithChildren];
            if (rootsWithChildrenArr.length === 1) {
                return (0, exports.getChildrenForParent)(serialized, rootsWithChildrenArr, rootsWithChildrenArr[0]);
            }
            it = rootsWithChildrenArr;
        }
        else {
            it = node.children;
        }
        return iterator_1.Iterable.map(it, element => (element instanceof TestTreeErrorMessage
            ? { element }
            : {
                element,
                collapsible: element.test.expand !== 0 /* TestItemExpandState.NotExpandable */,
                collapsed: element.test.item.error
                    ? tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded
                    : ((0, testingViewState_1.isCollapsedInSerializedTestTree)(serialized, element.test.item.extId) ?? element.depth > 0
                        ? tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed
                        : tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded),
                children: (0, exports.getChildrenForParent)(serialized, rootsWithChildren, element),
            }));
    };
    exports.getChildrenForParent = getChildrenForParent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9leHBsb3JlclByb2plY3Rpb25zL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdEaEcsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBRXhDLE1BQXNCLG1CQUFtQjtRQTRDeEMsWUFDaUIsSUFBc0I7UUFDdEM7OztXQUdHO1FBQ2EsU0FBcUMsSUFBSTtZQUx6QyxTQUFJLEdBQUosSUFBSSxDQUFrQjtZQUt0QixXQUFNLEdBQU4sTUFBTSxDQUFtQztZQWpEdkMsa0JBQWEsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBRXZEOztlQUVHO1lBQ2EsYUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1lBRXBEOztlQUVHO1lBQ2EsYUFBUSxHQUFHLElBQUksR0FBRyxFQUEyQixDQUFDO1lBRTlEOztlQUVHO1lBQ2EsV0FBTSxHQUFHLEtBQUssRUFBRSxDQUFDO1lBRWpDOztlQUVHO1lBQ0ksVUFBSyxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9EOztlQUVHO1lBQ0ksWUFBTyxHQUFHLEtBQUssQ0FBQztZQUV2Qjs7O2VBR0c7WUFDSSxVQUFLLGlDQUF5QjtRQW1CakMsQ0FBQztRQUVFLE1BQU07WUFDWixJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3RCLE9BQU8sRUFBRSxZQUFZ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