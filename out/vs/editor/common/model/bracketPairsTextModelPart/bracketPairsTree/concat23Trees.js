/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./ast"], function (require, exports, ast_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.concat23Trees = concat23Trees;
    exports.concat23TreesOfSameHeight = concat23TreesOfSameHeight;
    /**
     * Concatenates a list of (2,3) AstNode's into a single (2,3) AstNode.
     * This mutates the items of the input array!
     * If all items have the same height, this method has runtime O(items.length).
     * Otherwise, it has runtime O(items.length * max(log(items.length), items.max(i => i.height))).
    */
    function concat23Trees(items) {
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return items[0];
        }
        let i = 0;
        /**
         * Reads nodes of same height and concatenates them to a single node.
        */
        function readNode() {
            if (i >= items.length) {
                return null;
            }
            const start = i;
            const height = items[start].listHeight;
            i++;
            while (i < items.length && items[i].listHeight === height) {
                i++;
            }
            if (i - start >= 2) {
                return concat23TreesOfSameHeight(start === 0 && i === items.length ? items : items.slice(start, i), false);
            }
            else {
                return items[start];
            }
        }
        // The items might not have the same height.
        // We merge all items by using a binary concat operator.
        let first = readNode(); // There must be a first item
        let second = readNode();
        if (!second) {
            return first;
        }
        for (let item = readNode(); item; item = readNode()) {
            // Prefer concatenating smaller trees, as the runtime of concat depends on the tree height.
            if (heightDiff(first, second) <= heightDiff(second, item)) {
                first = concat(first, second);
                second = item;
            }
            else {
                second = concat(second, item);
            }
        }
        const result = concat(first, second);
        return result;
    }
    function concat23TreesOfSameHeight(items, createImmutableLists = false) {
        if (items.length === 0) {
            return null;
        }
        if (items.length === 1) {
            return items[0];
        }
        let length = items.length;
        // All trees have same height, just create parent nodes.
        while (length > 3) {
            const newLength = length >> 1;
            for (let i = 0; i < newLength; i++) {
                const j = i << 1;
                items[i] = ast_1.ListAstNode.create23(items[j], items[j + 1], j + 3 === length ? items[j + 2] : null, createImmutableLists);
            }
            length = newLength;
        }
        return ast_1.ListAstNode.create23(items[0], items[1], length >= 3 ? items[2] : null, createImmutableLists);
    }
    function heightDiff(node1, node2) {
        return Math.abs(node1.listHeight - node2.listHeight);
    }
    function concat(node1, node2) {
        if (node1.listHeight === node2.listHeight) {
            return ast_1.ListAstNode.create23(node1, node2, null, false);
        }
        else if (node1.listHeight > node2.listHeight) {
            // node1 is the tree we want to insert into
            return append(node1, node2);
        }
        else {
            return prepend(node2, node1);
        }
    }
    /**
     * Appends the given node to the end of this (2,3) tree.
     * Returns the new root.
    */
    function append(list, nodeToAppend) {
        list = list.toMutable();
        let curNode = list;
        const parents = [];
        let nodeToAppendOfCorrectHeight;
        while (true) {
            // assert nodeToInsert.listHeight <= curNode.listHeight
            if (nodeToAppend.listHeight === curNode.listHeight) {
                nodeToAppendOfCorrectHeight = nodeToAppend;
                break;
            }
            // assert 0 <= nodeToInsert.listHeight < curNode.listHeight
            if (curNode.kind !== 4 /* AstNodeKind.List */) {
                throw new Error('unexpected');
            }
            parents.push(curNode);
            // assert 2 <= curNode.childrenLength <= 3
            curNode = curNode.makeLastElementMutable();
        }
        // assert nodeToAppendOfCorrectHeight!.listHeight === curNode.listHeight
        for (let i = parents.length - 1; i >= 0; i--) {
            const parent = parents[i];
            if (nodeToAppendOfCorrectHeight) {
                // Can we take the element?
                if (parent.childrenLength >= 3) {
                    // assert parent.childrenLength === 3 && parent.listHeight === nodeToAppendOfCorrectHeight.listHeight + 1
                    // we need to split to maintain (2,3)-tree property.
                    // Send the third element + the new element to the parent.
                    nodeToAppendOfCorrectHeight = ast_1.ListAstNode.create23(parent.unappendChild(), nodeToAppendOfCorrectHeight, null, false);
                }
                else {
                    parent.appendChildOfSameHeight(nodeToAppendOfCorrectHeight);
                    nodeToAppendOfCorrectHeight = undefined;
                }
            }
            else {
                parent.handleChildrenChanged();
            }
        }
        if (nodeToAppendOfCorrectHeight) {
            return ast_1.ListAstNode.create23(list, nodeToAppendOfCorrectHeight, null, false);
        }
        else {
            return list;
        }
    }
    /**
     * Prepends the given node to the end of this (2,3) tree.
     * Returns the new root.
    */
    function prepend(list, nodeToAppend) {
        list = list.toMutable();
        let curNode = list;
        const parents = [];
        // assert nodeToInsert.listHeight <= curNode.listHeight
        while (nodeToAppend.listHeight !== curNode.listHeight) {
            // assert 0 <= nodeToInsert.listHeight < curNode.listHeight
            if (curNode.kind !== 4 /* AstNodeKind.List */) {
                throw new Error('unexpected');
            }
            parents.push(curNode);
            // assert 2 <= curNode.childrenFast.length <= 3
            curNode = curNode.makeFirstElementMutable();
        }
        let nodeToPrependOfCorrectHeight = nodeToAppend;
        // assert nodeToAppendOfCorrectHeight!.listHeight === curNode.listHeight
        for (let i = parents.length - 1; i >= 0; i--) {
            const parent = parents[i];
            if (nodeToPrependOfCorrectHeight) {
                // Can we take the element?
                if (parent.childrenLength >= 3) {
                    // assert parent.childrenLength === 3 && parent.listHeight === nodeToAppendOfCorrectHeight.listHeight + 1
                    // we need to split to maintain (2,3)-tree property.
                    // Send the third element + the new element to the parent.
                    nodeToPrependOfCorrectHeight = ast_1.ListAstNode.create23(nodeToPrependOfCorrectHeight, parent.unprependChild(), null, false);
                }
                else {
                    parent.prependChildOfSameHeight(nodeToPrependOfCorrectHeight);
                    nodeToPrependOfCorrectHeight = undefined;
                }
            }
            else {
                parent.handleChildrenChanged();
            }
        }
        if (nodeToPrependOfCorrectHeight) {
            return ast_1.ListAstNode.create23(nodeToPrependOfCorrectHeight, list, null, false);
        }
        else {
            return list;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uY2F0MjNUcmVlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc1RyZWUvY29uY2F0MjNUcmVlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxzQ0FtREM7SUFFRCw4REFtQkM7SUE5RUQ7Ozs7O01BS0U7SUFDRixTQUFnQixhQUFhLENBQUMsS0FBZ0I7UUFDN0MsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN4QixPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQixDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1Y7O1VBRUU7UUFDRixTQUFTLFFBQVE7WUFDaEIsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDaEIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztZQUV2QyxDQUFDLEVBQUUsQ0FBQztZQUNKLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxNQUFNLEVBQUUsQ0FBQztnQkFDM0QsQ0FBQyxFQUFFLENBQUM7WUFDTCxDQUFDO1lBRUQsSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNwQixP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