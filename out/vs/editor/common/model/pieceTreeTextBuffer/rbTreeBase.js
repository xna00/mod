/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SENTINEL = exports.NodeColor = exports.TreeNode = void 0;
    exports.leftest = leftest;
    exports.righttest = righttest;
    exports.leftRotate = leftRotate;
    exports.rightRotate = rightRotate;
    exports.rbDelete = rbDelete;
    exports.fixInsert = fixInsert;
    exports.updateTreeMetadata = updateTreeMetadata;
    exports.recomputeTreeMetadata = recomputeTreeMetadata;
    class TreeNode {
        constructor(piece, color) {
            this.piece = piece;
            this.color = color;
            this.size_left = 0;
            this.lf_left = 0;
            this.parent = this;
            this.left = this;
            this.right = this;
        }
        next() {
            if (this.right !== exports.SENTINEL) {
                return leftest(this.right);
            }
            let node = this;
            while (node.parent !== exports.SENTINEL) {
                if (node.parent.left === node) {
                    break;
                }
                node = node.parent;
            }
            if (node.parent === exports.SENTINEL) {
                return exports.SENTINEL;
            }
            else {
                return node.parent;
            }
        }
        prev() {
            if (this.left !== exports.SENTINEL) {
                return righttest(this.left);
            }
            let node = this;
            while (node.parent !== exports.SENTINEL) {
                if (node.parent.right === node) {
                    break;
                }
                node = node.parent;
            }
            if (node.parent === exports.SENTINEL) {
                return exports.SENTINEL;
            }
            else {
                return node.parent;
            }
        }
        detach() {
            this.parent = null;
            this.left = null;
            this.right = null;
        }
    }
    exports.TreeNode = TreeNode;
    var NodeColor;
    (function (NodeColor) {
        NodeColor[NodeColor["Black"] = 0] = "Black";
        NodeColor[NodeColor["Red"] = 1] = "Red";
    })(NodeColor || (exports.NodeColor = NodeColor = {}));
    exports.SENTINEL = new TreeNode(null, 0 /* NodeColor.Black */);
    exports.SENTINEL.parent = exports.SENTINEL;
    exports.SENTINEL.left = exports.SENTINEL;
    exports.SENTINEL.right = exports.SENTINEL;
    exports.SENTINEL.color = 0 /* NodeColor.Black */;
    function leftest(node) {
        while (node.left !== exports.SENTINEL) {
            node = node.left;
        }
        return node;
    }
    function righttest(node) {
        while (node.right !== exports.SENTINEL) {
            node = node.right;
        }
        return node;
    }
    function calculateSize(node) {
        if (node === exports.SENTINEL) {
            return 0;
        }
        return node.size_left + node.piece.length + calculateSize(node.right);
    }
    function calculateLF(node) {
        if (node === exports.SENTINEL) {
            return 0;
        }
        return node.lf_left + node.piece.lineFeedCnt + calculateLF(node.right);
    }
    function resetSentinel() {
        exports.SENTINEL.parent = exports.SENTINEL;
    }
    function leftRotate(tree, x) {
        const y = x.right;
        // fix size_left
        y.size_left += x.size_left + (x.piece ? x.piece.length : 0);
        y.lf_left += x.lf_left + (x.piece ? x.piece.lineFeedCnt : 0);
        x.right = y.left;
        if (y.left !== exports.SENTINEL) {
            y.left.parent = x;
        }
        y.parent = x.parent;
        if (x.parent === exports.SENTINEL) {
            tree.root = y;
        }
        else if (x.parent.left === x) {
            x.parent.left = y;
        }
        else {
            x.parent.right = y;
        }
        y.left = x;
        x.parent = y;
    }
    function rightRotate(tree, y) {
        const x = y.left;
        y.left = x.right;
        if (x.right !== exports.SENTINEL) {
            x.right.parent = y;
        }
        x.parent = y.parent;
        // fix size_left
        y.size_left -= x.size_left + (x.piece ? x.piece.length : 0);
        y.lf_left -= x.lf_left + (x.piece ? x.piece.lineFeedCnt : 0);
        if (y.parent === exports.SENTINEL) {
            tree.root = x;
        }
        else if (y === y.parent.right) {
            y.parent.right = x;
        }
        else {
            y.parent.left = x;
        }
        x.right = y;
        y.parent = x;
    }
    function rbDelete(tree, z) {
        let x;
        let y;
        if (z.left === exports.SENTINEL) {
            y = z;
            x = y.right;
        }
        else if (z.right === exports.SENTINEL) {
            y = z;
            x = y.left;
        }
        else {
            y = leftest(z.right);
            x = y.right;
        }
        if (y === tree.root) {
            tree.root = x;
            // if x is null, we are removing the only node
            x.color = 0 /* NodeColor.Black */;
            z.detach();
            resetSentinel();
            tree.root.parent = exports.SENTINEL;
            return;
        }
        const yWasRed = (y.color === 1 /* NodeColor.Red */);
        if (y === y.parent.left) {
            y.parent.left = x;
        }
        else {
            y.parent.right = x;
        }
        if (y === z) {
            x.parent = y.parent;
            recomputeTreeMetadata(tree, x);
        }
        else {
            if (y.parent === z) {
                x.parent = y;
            }
            else {
                x.parent = y.parent;
            }
            // as we make changes to x's hierarchy, update size_left of subtree first
            recomputeTreeMetadata(tree, x);
            y.left = z.left;
            y.right = z.right;
            y.parent = z.parent;
            y.color = z.color;
            if (z === tree.root) {
                tree.root = y;
            }
            else {
                if (z === z.parent.left) {
                    z.parent.left = y;
                }
                else {
                    z.parent.right = y;
                }
            }
            if (y.left !== exports.SENTINEL) {
                y.left.parent = y;
            }
            if (y.right !== exports.SENTINEL) {
                y.right.parent = y;
            }
            // update metadata
            // we replace z with y, so in this sub tree, the length change is z.item.length
            y.size_left = z.size_left;
            y.lf_left = z.lf_left;
            recomputeTreeMetadata(tree, y);
        }
        z.detach();
        if (x.parent.left === x) {
            const newSizeLeft = calculateSize(x);
            const newLFLeft = calculateLF(x);
            if (newSizeLeft !== x.parent.size_left || newLFLeft !== x.parent.lf_left) {
                const delta = newSizeLeft - x.parent.size_left;
                const lf_delta = newLFLeft - x.parent.lf_left;
                x.parent.size_left = newSizeLeft;
                x.parent.lf_left = newLFLeft;
                updateTreeMetadata(tree, x.parent, delta, lf_delta);
            }
        }
        recomputeTreeMetadata(tree, x.parent);
        if (yWasRed) {
            resetSentinel();
            return;
        }
        // RB-DELETE-FIXUP
        let w;
        while (x !== tree.root && x.color === 0 /* NodeColor.Black */) {
            if (x === x.parent.left) {
                w = x.parent.right;
                if (w.color === 1 /* NodeColor.Red */) {
                    w.color = 0 /* NodeColor.Black */;
                    x.parent.color = 1 /* NodeColor.Red */;
                    leftRotate(tree, x.parent);
                    w = x.parent.right;
                }
                if (w.left.color === 0 /* NodeColor.Black */ && w.right.color === 0 /* NodeColor.Black */) {
                    w.color = 1 /* NodeColor.Red */;
                    x = x.parent;
                }
                else {
                    if (w.right.color === 0 /* NodeColor.Black */) {
                        w.left.color = 0 /* NodeColor.Black */;
                        w.color = 1 /* NodeColor.Red */;
                        rightRotate(tree, w);
                        w = x.parent.right;
                    }
                    w.color = x.parent.color;
                    x.parent.color = 0 /* NodeColor.Black */;
                    w.right.color = 0 /* NodeColor.Black */;
                    leftRotate(tree, x.parent);
                    x = tree.root;
                }
            }
            else {
                w = x.parent.left;
                if (w.color === 1 /* NodeColor.Red */) {
                    w.color = 0 /* NodeColor.Black */;
                    x.parent.color = 1 /* NodeColor.Red */;
                    rightRotate(tree, x.parent);
                    w = x.parent.left;
                }
                if (w.left.color === 0 /* NodeColor.Black */ && w.right.color === 0 /* NodeColor.Black */) {
                    w.color = 1 /* NodeColor.Red */;
                    x = x.parent;
                }
                else {
                    if (w.left.color === 0 /* NodeColor.Black */) {
                        w.right.color = 0 /* NodeColor.Black */;
                        w.color = 1 /* NodeColor.Red */;
                        leftRotate(tree, w);
                        w = x.parent.left;
                    }
                    w.color = x.parent.color;
                    x.parent.color = 0 /* NodeColor.Black */;
                    w.left.color = 0 /* NodeColor.Black */;
                    rightRotate(tree, x.parent);
                    x = tree.root;
                }
            }
        }
        x.color = 0 /* NodeColor.Black */;
        resetSentinel();
    }
    function fixInsert(tree, x) {
        recomputeTreeMetadata(tree, x);
        while (x !== tree.root && x.parent.color === 1 /* NodeColor.Red */) {
            if (x.parent === x.parent.parent.left) {
                const y = x.parent.parent.right;
                if (y.color === 1 /* NodeColor.Red */) {
                    x.parent.color = 0 /* NodeColor.Black */;
                    y.color = 0 /* NodeColor.Black */;
                    x.parent.parent.color = 1 /* NodeColor.Red */;
                    x = x.parent.parent;
                }
                else {
                    if (x === x.parent.right) {
                        x = x.parent;
                        leftRotate(tree, x);
                    }
                    x.parent.color = 0 /* NodeColor.Black */;
                    x.parent.parent.color = 1 /* NodeColor.Red */;
                    rightRotate(tree, x.parent.parent);
                }
            }
            else {
                const y = x.parent.parent.left;
                if (y.color === 1 /* NodeColor.Red */) {
                    x.parent.color = 0 /* NodeColor.Black */;
                    y.color = 0 /* NodeColor.Black */;
                    x.parent.parent.color = 1 /* NodeColor.Red */;
                    x = x.parent.parent;
                }
                else {
                    if (x === x.parent.left) {
                        x = x.parent;
                        rightRotate(tree, x);
                    }
                    x.parent.color = 0 /* NodeColor.Black */;
                    x.parent.parent.color = 1 /* NodeColor.Red */;
                    leftRotate(tree, x.parent.parent);
                }
            }
        }
        tree.root.color = 0 /* NodeColor.Black */;
    }
    function updateTreeMetadata(tree, x, delta, lineFeedCntDelta) {
        // node length change or line feed count change
        while (x !== tree.root && x !== exports.SENTINEL) {
            if (x.parent.left === x) {
                x.parent.size_left += delta;
                x.parent.lf_left += lineFeedCntDelta;
            }
            x = x.parent;
        }
    }
    function recomputeTreeMetadata(tree, x) {
        let delta = 0;
        let lf_delta = 0;
        if (x === tree.root) {
            return;
        }
        // go upwards till the node whose left subtree is changed.
        while (x !== tree.root && x === x.parent.right) {
            x = x.parent;
        }
        if (x === tree.root) {
            // well, it means we add a node to the end (inorder)
            return;
        }
        // x is the node whose right subtree is changed.
        x = x.parent;
        delta = calculateSize(x.left) - x.size_left;
        lf_delta = calculateLF(x.left) - x.lf_left;
        x.size_left += delta;
        x.lf_left += lf_delta;
        // go upwards till root. O(logN)
        while (x !== tree.root && (delta !== 0 || lf_delta !== 0)) {
            if (x.parent.left === x) {
                x.parent.size_left += delta;
                x.parent.lf_left += lf_delta;
            }
            x = x.parent;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmJUcmVlQmFzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9waWVjZVRyZWVUZXh0QnVmZmVyL3JiVHJlZUJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUZoRywwQkFLQztJQUVELDhCQUtDO0lBc0JELGdDQXFCQztJQUVELGtDQXNCQztJQUVELDRCQStKQztJQUVELDhCQTJDQztJQUVELGdEQVVDO0lBRUQsc0RBbUNDO0lBamFELE1BQWEsUUFBUTtRQVdwQixZQUFZLEtBQVksRUFBRSxLQUFnQjtZQUN6QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixDQUFDO1FBRU0sSUFBSTtZQUNWLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxnQkFBUSxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFDO1lBRUQsSUFBSSxJQUFJLEdBQWEsSUFBSSxDQUFDO1lBRTFCLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxnQkFBUSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQy9CLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxJ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