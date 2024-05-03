/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings"], function (require, exports, arrays_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TernarySearchTree = exports.UriIterator = exports.PathIterator = exports.ConfigKeysIterator = exports.StringIterator = void 0;
    class StringIterator {
        constructor() {
            this._value = '';
            this._pos = 0;
        }
        reset(key) {
            this._value = key;
            this._pos = 0;
            return this;
        }
        next() {
            this._pos += 1;
            return this;
        }
        hasNext() {
            return this._pos < this._value.length - 1;
        }
        cmp(a) {
            const aCode = a.charCodeAt(0);
            const thisCode = this._value.charCodeAt(this._pos);
            return aCode - thisCode;
        }
        value() {
            return this._value[this._pos];
        }
    }
    exports.StringIterator = StringIterator;
    class ConfigKeysIterator {
        constructor(_caseSensitive = true) {
            this._caseSensitive = _caseSensitive;
        }
        reset(key) {
            this._value = key;
            this._from = 0;
            this._to = 0;
            return this.next();
        }
        hasNext() {
            return this._to < this._value.length;
        }
        next() {
            // this._data = key.split(/[\\/]/).filter(s => !!s);
            this._from = this._to;
            let justSeps = true;
            for (; this._to < this._value.length; this._to++) {
                const ch = this._value.charCodeAt(this._to);
                if (ch === 46 /* CharCode.Period */) {
                    if (justSeps) {
                        this._from++;
                    }
                    else {
                        break;
                    }
                }
                else {
                    justSeps = false;
                }
            }
            return this;
        }
        cmp(a) {
            return this._caseSensitive
                ? (0, strings_1.compareSubstring)(a, this._value, 0, a.length, this._from, this._to)
                : (0, strings_1.compareSubstringIgnoreCase)(a, this._value, 0, a.length, this._from, this._to);
        }
        value() {
            return this._value.substring(this._from, this._to);
        }
    }
    exports.ConfigKeysIterator = ConfigKeysIterator;
    class PathIterator {
        constructor(_splitOnBackslash = true, _caseSensitive = true) {
            this._splitOnBackslash = _splitOnBackslash;
            this._caseSensitive = _caseSensitive;
        }
        reset(key) {
            this._from = 0;
            this._to = 0;
            this._value = key;
            this._valueLen = key.length;
            for (let pos = key.length - 1; pos >= 0; pos--, this._valueLen--) {
                const ch = this._value.charCodeAt(pos);
                if (!(ch === 47 /* CharCode.Slash */ || this._splitOnBackslash && ch === 92 /* CharCode.Backslash */)) {
                    break;
                }
            }
            return this.next();
        }
        hasNext() {
            return this._to < this._valueLen;
        }
        next() {
            // this._data = key.split(/[\\/]/).filter(s => !!s);
            this._from = this._to;
            let justSeps = true;
            for (; this._to < this._valueLen; this._to++) {
                const ch = this._value.charCodeAt(this._to);
                if (ch === 47 /* CharCode.Slash */ || this._splitOnBackslash && ch === 92 /* CharCode.Backslash */) {
                    if (justSeps) {
                        this._from++;
                    }
                    else {
                        break;
                    }
                }
                else {
                    justSeps = false;
                }
            }
            return this;
        }
        cmp(a) {
            return this._caseSensitive
                ? (0, strings_1.compareSubstring)(a, this._value, 0, a.length, this._from, this._to)
                : (0, strings_1.compareSubstringIgnoreCase)(a, this._value, 0, a.length, this._from, this._to);
        }
        value() {
            return this._value.substring(this._from, this._to);
        }
    }
    exports.PathIterator = PathIterator;
    var UriIteratorState;
    (function (UriIteratorState) {
        UriIteratorState[UriIteratorState["Scheme"] = 1] = "Scheme";
        UriIteratorState[UriIteratorState["Authority"] = 2] = "Authority";
        UriIteratorState[UriIteratorState["Path"] = 3] = "Path";
        UriIteratorState[UriIteratorState["Query"] = 4] = "Query";
        UriIteratorState[UriIteratorState["Fragment"] = 5] = "Fragment";
    })(UriIteratorState || (UriIteratorState = {}));
    class UriIterator {
        constructor(_ignorePathCasing, _ignoreQueryAndFragment) {
            this._ignorePathCasing = _ignorePathCasing;
            this._ignoreQueryAndFragment = _ignoreQueryAndFragment;
            this._states = [];
            this._stateIdx = 0;
        }
        reset(key) {
            this._value = key;
            this._states = [];
            if (this._value.scheme) {
                this._states.push(1 /* UriIteratorState.Scheme */);
            }
            if (this._value.authority) {
                this._states.push(2 /* UriIteratorState.Authority */);
            }
            if (this._value.path) {
                this._pathIterator = new PathIterator(false, !this._ignorePathCasing(key));
                this._pathIterator.reset(key.path);
                if (this._pathIterator.value()) {
                    this._states.push(3 /* UriIteratorState.Path */);
                }
            }
            if (!this._ignoreQueryAndFragment(key)) {
                if (this._value.query) {
                    this._states.push(4 /* UriIteratorState.Query */);
                }
                if (this._value.fragment) {
                    this._states.push(5 /* UriIteratorState.Fragment */);
                }
            }
            this._stateIdx = 0;
            return this;
        }
        next() {
            if (this._states[this._stateIdx] === 3 /* UriIteratorState.Path */ && this._pathIterator.hasNext()) {
                this._pathIterator.next();
            }
            else {
                this._stateIdx += 1;
            }
            return this;
        }
        hasNext() {
            return (this._states[this._stateIdx] === 3 /* UriIteratorState.Path */ && this._pathIterator.hasNext())
                || this._stateIdx < this._states.length - 1;
        }
        cmp(a) {
            if (this._states[this._stateIdx] === 1 /* UriIteratorState.Scheme */) {
                return (0, strings_1.compareIgnoreCase)(a, this._value.scheme);
            }
            else if (this._states[this._stateIdx] === 2 /* UriIteratorState.Authority */) {
                return (0, strings_1.compareIgnoreCase)(a, this._value.authority);
            }
            else if (this._states[this._stateIdx] === 3 /* UriIteratorState.Path */) {
                return this._pathIterator.cmp(a);
            }
            else if (this._states[this._stateIdx] === 4 /* UriIteratorState.Query */) {
                return (0, strings_1.compare)(a, this._value.query);
            }
            else if (this._states[this._stateIdx] === 5 /* UriIteratorState.Fragment */) {
                return (0, strings_1.compare)(a, this._value.fragment);
            }
            throw new Error();
        }
        value() {
            if (this._states[this._stateIdx] === 1 /* UriIteratorState.Scheme */) {
                return this._value.scheme;
            }
            else if (this._states[this._stateIdx] === 2 /* UriIteratorState.Authority */) {
                return this._value.authority;
            }
            else if (this._states[this._stateIdx] === 3 /* UriIteratorState.Path */) {
                return this._pathIterator.value();
            }
            else if (this._states[this._stateIdx] === 4 /* UriIteratorState.Query */) {
                return this._value.query;
            }
            else if (this._states[this._stateIdx] === 5 /* UriIteratorState.Fragment */) {
                return this._value.fragment;
            }
            throw new Error();
        }
    }
    exports.UriIterator = UriIterator;
    class TernarySearchTreeNode {
        constructor() {
            this.height = 1;
        }
        isEmpty() {
            return !this.left && !this.mid && !this.right && !this.value;
        }
        rotateLeft() {
            const tmp = this.right;
            this.right = tmp.left;
            tmp.left = this;
            this.updateHeight();
            tmp.updateHeight();
            return tmp;
        }
        rotateRight() {
            const tmp = this.left;
            this.left = tmp.right;
            tmp.right = this;
            this.updateHeight();
            tmp.updateHeight();
            return tmp;
        }
        updateHeight() {
            this.height = 1 + Math.max(this.heightLeft, this.heightRight);
        }
        balanceFactor() {
            return this.heightRight - this.heightLeft;
        }
        get heightLeft() {
            return this.left?.height ?? 0;
        }
        get heightRight() {
            return this.right?.height ?? 0;
        }
    }
    var Dir;
    (function (Dir) {
        Dir[Dir["Left"] = -1] = "Left";
        Dir[Dir["Mid"] = 0] = "Mid";
        Dir[Dir["Right"] = 1] = "Right";
    })(Dir || (Dir = {}));
    class TernarySearchTree {
        static forUris(ignorePathCasing = () => false, ignoreQueryAndFragment = () => false) {
            return new TernarySearchTree(new UriIterator(ignorePathCasing, ignoreQueryAndFragment));
        }
        static forPaths(ignorePathCasing = false) {
            return new TernarySearchTree(new PathIterator(undefined, !ignorePathCasing));
        }
        static forStrings() {
            return new TernarySearchTree(new StringIterator());
        }
        static forConfigKeys() {
            return new TernarySearchTree(new ConfigKeysIterator());
        }
        constructor(segments) {
            this._iter = segments;
        }
        clear() {
            this._root = undefined;
        }
        fill(values, keys) {
            if (keys) {
                const arr = keys.slice(0);
                (0, arrays_1.shuffle)(arr);
                for (const k of arr) {
                    this.set(k, values);
                }
            }
            else {
                const arr = values.slice(0);
                (0, arrays_1.shuffle)(arr);
                for (const entry of arr) {
                    this.set(entry[0], entry[1]);
                }
            }
        }
        set(key, element) {
            const iter = this._iter.reset(key);
            let node;
            if (!this._root) {
                this._root = new TernarySearchTreeNode();
                this._root.segment = iter.value();
            }
            const stack = [];
            // find insert_node
            node = this._root;
            while (true) {
                const val = iter.cmp(node.segment);
                if (val > 0) {
                    // left
                    if (!node.left) {
                        node.left = new TernarySearchTreeNode();
                        node.left.segment = iter.value();
                    }
                    stack.push([-1 /* Dir.Left */, node]);
                    node = node.left;
                }
                else if (val < 0) {
                    // right
                    if (!node.right) {
                        node.right = new TernarySearchTreeNode();
                        node.right.segment = iter.value();
                    }
                    stack.push([1 /* Dir.Right */, node]);
                    node = node.right;
                }
                else if (iter.hasNext()) {
                    // mid
                    iter.next();
                    if (!node.mid) {
                        node.mid = new TernarySearchTreeNode();
                        node.mid.segment = iter.value();
                    }
                    stack.push([0 /* Dir.Mid */, node]);
                    node = node.mid;
                }
                else {
                    break;
                }
            }
            // set value
            const oldElement = node.value;
            node.value = element;
            node.key = key;
            // balance
            for (let i = stack.length - 1; i >= 0; i--) {
                const node = stack[i][1];
                node.updateHeight();
                const bf = node.balanceFactor();
                if (bf < -1 || bf > 1) {
                    // needs rotate
                    const d1 = stack[i][0];
                    const d2 = stack[i + 1][0];
                    if (d1 === 1 /* Dir.Right */ && d2 === 1 /* Dir.Right */) {
                        //right, right -> rotate left
                        stack[i][1] = node.rotateLeft();
                    }
                    else if (d1 === -1 /* Dir.Left */ && d2 === -1 /* Dir.Left */) {
                        // left, left -> rotate right
                        stack[i][1] = node.rotateRight();
                    }
                    else if (d1 === 1 /* Dir.Right */ && d2 === -1 /* Dir.Left */) {
                        // right, left -> double rotate right, left
                        node.right = stack[i + 1][1] = stack[i + 1][1].rotateRight();
                        stack[i][1] = node.rotateLeft();
                    }
                    else if (d1 === -1 /* Dir.Left */ && d2 === 1 /* Dir.Right */) {
                        // left, right -> double rotate left, right
                        node.left = stack[i + 1][1] = stack[i + 1][1].rotateLeft();
                        stack[i][1] = node.rotateRight();
                    }
                    else {
                        throw new Error();
                    }
                    // patch path to parent
                    if (i > 0) {
                        switch (stack[i - 1][0]) {
                            case -1 /* Dir.Left */:
                                stack[i - 1][1].left = stack[i][1];
                                break;
                            case 1 /* Dir.Right */:
                                stack[i - 1][1].right = stack[i][1];
                                break;
                            case 0 /* Dir.Mid */:
                                stack[i - 1][1].mid = stack[i][1];
                                break;
                        }
                    }
                    else {
                        this._root = stack[0][1];
                    }
                }
            }
            return oldElement;
        }
        get(key) {
            return this._getNode(key)?.value;
        }
        _getNode(key) {
            const iter = this._iter.reset(key);
            let node = this._root;
            while (node) {
                const val = iter.cmp(node.segment);
                if (val > 0) {
                    // left
                    node = node.left;
                }
                else if (val < 0) {
                    // right
                    node = node.right;
                }
                else if (iter.hasNext()) {
                    // mid
                    iter.next();
                    node = node.mid;
                }
                else {
                    break;
                }
            }
            return node;
        }
        has(key) {
            const node = this._getNode(key);
            return !(node?.value === undefined && node?.mid === undefined);
        }
        delete(key) {
            return this._delete(key, false);
        }
        deleteSuperstr(key) {
            return this._delete(key, true);
        }
        _delete(key, superStr) {
            const iter = this._iter.reset(key);
            const stack = [];
            let node = this._root;
            // find node
            while (node) {
                const val = iter.cmp(node.segment);
                if (val > 0) {
                    // left
                    stack.push([-1 /* Dir.Left */, node]);
                    node = node.left;
                }
                else if (val < 0) {
                    // right
                    stack.push([1 /* Dir.Right */, node]);
                    node = node.right;
                }
                else if (iter.hasNext()) {
                    // mid
                    iter.next();
                    stack.push([0 /* Dir.Mid */, node]);
                    node = node.mid;
                }
                else {
                    break;
                }
            }
            if (!node) {
                // node not found
                return;
            }
            if (superStr) {
                // removing children, reset height
                node.left = undefined;
                node.mid = undefined;
                node.right = undefined;
                node.height = 1;
            }
            else {
                // removing element
                node.key = undefined;
                node.value = undefined;
            }
            // BST node removal
            if (!node.mid && !node.value) {
                if (node.left && node.right) {
                    // full node
                    // replace deleted-node with the min-node of the right branch.
                    // If there is no true min-node leave things as they are
                    const min = this._min(node.right);
                    if (min.key) {
                        const { key, value, segment } = min;
                        this._delete(min.key, false);
                        node.key = key;
                        node.value = value;
                        node.segment = segment;
                    }
                }
                else {
                    // empty or half empty
                    const newChild = node.left ?? node.right;
                    if (stack.length > 0) {
                        const [dir, parent] = stack[stack.length - 1];
                        switch (dir) {
                            case -1 /* Dir.Left */:
                                parent.left = newChild;
                                break;
                            case 0 /* Dir.Mid */:
                                parent.mid = newChild;
                                break;
                            case 1 /* Dir.Right */:
                                parent.right = newChild;
                                break;
                        }
                    }
                    else {
                        this._root = newChild;
                    }
                }
            }
            // AVL balance
            for (let i = stack.length - 1; i >= 0; i--) {
                const node = stack[i][1];
                node.updateHeight();
                const bf = node.balanceFactor();
                if (bf > 1) {
                    // right heavy
                    if (node.right.balanceFactor() >= 0) {
                        // right, right -> rotate left
                        stack[i][1] = node.rotateLeft();
                    }
                    else {
                        // right, left -> double rotate
                        node.right = node.right.rotateRight();
                        stack[i][1] = node.rotateLeft();
                    }
                }
                else if (bf < -1) {
                    // left heavy
                    if (node.left.balanceFactor() <= 0) {
                        // left, left -> rotate right
                        stack[i][1] = node.rotateRight();
                    }
                    else {
                        // left, right -> double rotate
                        node.left = node.left.rotateLeft();
                        stack[i][1] = node.rotateRight();
                    }
                }
                // patch path to parent
                if (i > 0) {
                    switch (stack[i - 1][0]) {
                        case -1 /* Dir.Left */:
                            stack[i - 1][1].left = stack[i][1];
                            break;
                        case 1 /* Dir.Right */:
                            stack[i - 1][1].right = stack[i][1];
                            break;
                        case 0 /* Dir.Mid */:
                            stack[i - 1][1].mid = stack[i][1];
                            break;
                    }
                }
                else {
                    this._root = stack[0][1];
                }
            }
        }
        _min(node) {
            while (node.left) {
                node = node.left;
            }
            return node;
        }
        findSubstr(key) {
            const iter = this._iter.reset(key);
            let node = this._root;
            let candidate = undefined;
            while (node) {
                const val = iter.cmp(node.segment);
                if (val > 0) {
                    // left
                    node = node.left;
                }
                else if (val < 0) {
                    // right
                    node = node.right;
                }
                else if (iter.hasNext()) {
                    // mid
                    iter.next();
                    candidate = node.value || candidate;
                    node = node.mid;
                }
                else {
                    break;
                }
            }
            return node && node.value || candidate;
        }
        findSuperstr(key) {
            return this._findSuperstrOrElement(key, false);
        }
        _findSuperstrOrElement(key, allowValue) {
            const iter = this._iter.reset(key);
            let node = this._root;
            while (node) {
                const val = iter.cmp(node.segment);
                if (val > 0) {
                    // left
                    node = node.left;
                }
                else if (val < 0) {
                    // right
                    node = node.right;
                }
                else if (iter.hasNext()) {
                    // mid
                    iter.next();
                    node = node.mid;
                }
                else {
                    // collect
                    if (!node.mid) {
                        if (allowValue) {
                            return node.value;
                        }
                        else {
                            return undefined;
                        }
                    }
                    else {
                        return this._entries(node.mid);
                    }
                }
            }
            return undefined;
        }
        hasElementOrSubtree(key) {
            return this._findSuperstrOrElement(key, true) !== undefined;
        }
        forEach(callback) {
            for (const [key, value] of this) {
                callback(value, key);
            }
        }
        *[Symbol.iterator]() {
            yield* this._entries(this._root);
        }
        _entries(node) {
            const result = [];
            this._dfsEntries(node, result);
            return result[Symbol.iterator]();
        }
        _dfsEntries(node, bucket) {
            // DFS
            if (!node) {
                return;
            }
            if (node.left) {
                this._dfsEntries(node.left, bucket);
            }
            if (node.value) {
                bucket.push([node.key, node.value]);
            }
            if (node.mid) {
                this._dfsEntries(node.mid, bucket);
            }
            if (node.right) {
                this._dfsEntries(node.right, bucket);
            }
        }
        // for debug/testing
        _isBalanced() {
            const nodeIsBalanced = (node) => {
                if (!node) {
                    return true;
                }
                const bf = node.balanceFactor();
                if (bf < -1 || bf > 1) {
                    return false;
                }
                return nodeIsBalanced(node.left) && nodeIsBalanced(node.right);
            };
            return nodeIsBalanced(this._root);
        }
    }
    exports.TernarySearchTree = TernarySearchTree;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybmFyeVNlYXJjaFRyZWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3Rlcm5hcnlTZWFyY2hUcmVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSxjQUFjO1FBQTNCO1lBRVMsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQUNwQixTQUFJLEdBQVcsQ0FBQyxDQUFDO1FBMEIxQixDQUFDO1FBeEJBLEtBQUssQ0FBQyxHQUFXO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2YsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsT0FBTztZQUNOLE9BQU8sSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFTO1lBQ1osTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsT0FBTyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO0tBQ0Q7SUE3QkQsd0NBNkJDO0lBRUQsTUFBYSxrQkFBa0I7UUFNOUIsWUFDa0IsaUJBQTBCLElBQUk7WUFBOUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzVDLENBQUM7UUFFTCxLQUFLLENBQUMsR0FBVztZQUNoQixJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUNsQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDdEMsQ0FBQztRQUVELElBQUk7WUFDSCxvREFBb0Q7WUFDcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQ3RCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztZQUNwQixPQUFPLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxFQUFFLDZCQUFvQixFQUFFLENBQUM7b0JBQzVCLElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNkLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFFBQVEsR0FBRyxLQUFLLENBQUM7Z0JBQ2xCLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsR0FBRyxDQUFDLENBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxjQUFjO2dCQUN6QixDQUFDLENBQUMsSUFBQSwwQkFBZ0IsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ3JFLENBQUMsQ0FBQyxJQUFBLG9DQUEwQixFQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFFRCxLQUFLO1lBQ0osT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwRCxDQUFDO0tBQ0Q7SUFqREQsZ0RBaURDO0lBRUQsTUFBYSxZQUFZO1FBT3hCLFlBQ2tCLG9CQUE2QixJQUFJLEVBQ2pDLGlCQUEwQixJQUFJO1lBRDlCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBZ0I7WUFDakMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzVDLENBQUM7UUFFTCxLQUFLLENBQUMsR0FBVztZQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQzVCLEtBQUssSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQztnQkFDbEUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxDQUFDLEVBQUUsNEJBQW1CLElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLEVBQUUsZ0NBQXVCLENBQUMsRUFBRSxDQUFDO29CQUNyRixNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsSUFBSTtZQUNILG9EQUFvRDtZQUNwRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDdEIsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVDLElBQUksRUFBRSw0QkFBbUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksRUFBRSxnQ0FBdUIsRUFBRSxDQUFDO29CQUNsRixJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUNkLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDZCxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsY0FBYztnQkFDekIsQ0FBQyxDQUFDLElBQUEsMEJBQWdCLEVBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNyRSxDQUFDLENBQUMsSUFBQSxvQ0FBMEIsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsS0FBSztZQUNKLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEQsQ0FBQztLQUNEO0lBM0RELG9DQTJEQztJQUVELElBQVcsZ0JBRVY7SUFGRCxXQUFXLGdCQUFnQjtRQUMxQiwyREFBVSxDQUFBO1FBQUUsaUVBQWEsQ0FBQTtRQUFFLHVEQUFRLENBQUE7UUFBRSx5REFBUyxDQUFBO1FBQUUsK0RBQVksQ0FBQTtJQUM3RCxDQUFDLEVBRlUsZ0JBQWdCLEtBQWhCLGdCQUFnQixRQUUxQjtJQUVELE1BQWEsV0FBVztRQU92QixZQUNrQixpQkFBd0MsRUFDeEMsdUJBQThDO1lBRDlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBdUI7WUFDeEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF1QjtZQUx4RCxZQUFPLEdBQXVCLEVBQUUsQ0FBQztZQUNqQyxjQUFTLEdBQVcsQ0FBQyxDQUFDO1FBSXNDLENBQUM7UUFFckUsS0FBSyxDQUFDLEdBQVE7WUFDYixJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztZQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxpQ0FBeUIsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksb0NBQTRCLENBQUM7WUFDL0MsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLCtCQUF1QixDQUFDO2dCQUMxQyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksZ0NBQXdCLENBQUM7Z0JBQzNDLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksbUNBQTJCLENBQUM7Z0JBQzlDLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsSUFBSTtZQUNILElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtDQUEwQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDNUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMzQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU87WUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtDQUEwQixJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7bUJBQzNGLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBUztZQUNaLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG9DQUE0QixFQUFFLENBQUM7Z0JBQzlELE9BQU8sSUFBQSwyQkFBaUIsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqRCxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHVDQUErQixFQUFFLENBQUM7Z0JBQ3hFLE9BQU8sSUFBQSwyQkFBaUIsRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwRCxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtDQUEwQixFQUFFLENBQUM7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQ0FBMkIsRUFBRSxDQUFDO2dCQUNwRSxPQUFPLElBQUEsaUJBQU8sRUFBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHNDQUE4QixFQUFFLENBQUM7Z0JBQ3ZFLE9BQU8sSUFBQSxpQkFBTyxFQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQ0FBNEIsRUFBRSxDQUFDO2dCQUM5RCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsdUNBQStCLEVBQUUsQ0FBQztnQkFDeEUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtDQUEwQixFQUFFLENBQUM7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNuQyxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLG1DQUEyQixFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDMUIsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQ0FBOEIsRUFBRSxDQUFDO2dCQUN2RSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQzdCLENBQUM7WUFDRCxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBbEZELGtDQWtGQztJQUNELE1BQU0scUJBQXFCO1FBQTNCO1lBQ0MsV0FBTSxHQUFXLENBQUMsQ0FBQztRQTZDcEIsQ0FBQztRQXJDQSxPQUFPO1lBQ04sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDOUQsQ0FBQztRQUVELFVBQVU7WUFDVCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBTSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUN0QixHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNoQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ25CLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELFdBQVc7WUFDVixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUN0QixHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ25CLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVELFlBQVk7WUFDWCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxhQUFhO1lBQ1osT0FBTyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDM0MsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDO0tBQ0Q7SUFFRCxJQUFXLEdBSVY7SUFKRCxXQUFXLEdBQUc7UUFDYiw4QkFBUyxDQUFBO1FBQ1QsMkJBQU8sQ0FBQTtRQUNQLCtCQUFTLENBQUE7SUFDVixDQUFDLEVBSlUsR0FBRyxLQUFILEdBQUcsUUFJYjtJQUVELE1BQWEsaUJBQWlCO1FBRTdCLE1BQU0sQ0FBQyxPQUFPLENBQUksbUJBQTBDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSx5QkFBZ0QsR0FBRyxFQUFFLENBQUMsS0FBSztZQUNuSSxPQUFPLElBQUksaUJBQWlCLENBQVMsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLENBQUM7UUFFRCxNQUFNLENBQUMsUUFBUSxDQUFJLGdCQUFnQixHQUFHLEtBQUs7WUFDMUMsT0FBTyxJQUFJLGlCQUFpQixDQUFZLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUN6RixDQUFDO1FBRUQsTUFBTSxDQUFDLFVBQVU7WUFDaEIsT0FBTyxJQUFJLGlCQUFpQixDQUFZLElBQUksY0FBYyxFQUFFLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsTUFBTSxDQUFDLGFBQWE7WUFDbkIsT0FBTyxJQUFJLGlCQUFpQixDQUFZLElBQUksa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFLRCxZQUFZLFFBQXlCO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7UUFDeEIsQ0FBQztRQVVELElBQUksQ0FBQyxNQUE2QixFQUFFLElBQW1CO1lBQ3RELElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsSUFBQSxnQkFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFNLE1BQU8sQ0FBQyxDQUFDO2dCQUMxQixDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sR0FBRyxHQUFjLE1BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLElBQUEsZ0JBQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztnQkFDYixLQUFLLE1BQU0sS0FBSyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsR0FBRyxDQUFDLEdBQU0sRUFBRSxPQUFVO1lBQ3JCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLElBQUksSUFBaUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUkscUJBQXFCLEVBQVEsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ25DLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBeUMsRUFBRSxDQUFDO1lBRXZELG1CQUFtQjtZQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNsQixPQUFPLElBQUksRUFBRSxDQUFDO2dCQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDYixPQUFPO29CQUNQLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxxQkFBcUIsRUFBUSxDQUFDO3dCQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2xDLENBQUM7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxvQkFBVyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFFbEIsQ0FBQztxQkFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDcEIsUUFBUTtvQkFDUixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUkscUJBQXFCLEVBQVEsQ0FBQzt3QkFDL0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNuQyxDQUFDO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQVksSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBRW5CLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsTUFBTTtvQkFDTixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDZixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUkscUJBQXFCLEVBQVEsQ0FBQzt3QkFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNqQyxDQUFDO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsa0JBQVUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ2pCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNO2dCQUNQLENBQUM7WUFDRixDQUFDO1lBRUQsWUFBWTtZQUNaLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDckIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFFZixVQUFVO1lBQ1YsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzVDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFekIsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNwQixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBRWhDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDdkIsZUFBZTtvQkFDZixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRTNCLElBQUksRUFBRSxzQkFBYyxJQUFJLEVBQUUsc0JBQWMsRUFBRSxDQUFDO3dCQUMxQyw2QkFBNkI7d0JBQzdCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBRWpDLENBQUM7eUJBQU0sSUFBSSxFQUFFLHNCQUFhLElBQUksRUFBRSxzQkFBYSxFQUFFLENBQUM7d0JBQy9DLDZCQUE2Qjt3QkFDN0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFFbEMsQ0FBQzt5QkFBTSxJQUFJLEVBQUUsc0JBQWMsSUFBSSxFQUFFLHNCQUFhLEVBQUUsQ0FBQzt3QkFDaEQsMkNBQTJDO3dCQUMzQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDN0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFFakMsQ0FBQzt5QkFBTSxJQUFJLEVBQUUsc0JBQWEsSUFBSSxFQUFFLHNCQUFjLEVBQUUsQ0FBQzt3QkFDaEQsMkNBQTJDO3dCQUMzQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDM0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFFbEMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDbkIsQ0FBQztvQkFFRCx1QkFBdUI7b0JBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNYLFFBQVEsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUN6QjtnQ0FDQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ25DLE1BQU07NEJBQ1A7Z0NBQ0MsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUNwQyxNQUFNOzRCQUNQO2dDQUNDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDbEMsTUFBTTt3QkFDUixDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDMUIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFRCxHQUFHLENBQUMsR0FBTTtZQUNULE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUM7UUFDbEMsQ0FBQztRQUVPLFFBQVEsQ0FBQyxHQUFNO1lBQ3RCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDdEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2IsT0FBTztvQkFDUCxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztnQkFDbEIsQ0FBQztxQkFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDcEIsUUFBUTtvQkFDUixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDbkIsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUMzQixNQUFNO29CQUNOLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDakIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxHQUFHLENBQUMsR0FBTTtZQUNULE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssS0FBSyxTQUFTLElBQUksSUFBSSxFQUFFLEdBQUcsS0FBSyxTQUFTLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQU07WUFDWixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxjQUFjLENBQUMsR0FBTTtZQUNwQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFTyxPQUFPLENBQUMsR0FBTSxFQUFFLFFBQWlCO1lBQ3hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25DLE1BQU0sS0FBSyxHQUF5QyxFQUFFLENBQUM7WUFDdkQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUV0QixZQUFZO1lBQ1osT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ2IsT0FBTztvQkFDUCxLQUFLLENBQUMsSUFBSSxDQUFDLG9CQUFXLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQzdCLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNsQixDQUFDO3FCQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQixRQUFRO29CQUNSLEtBQUssQ0FBQyxJQUFJLENBQUMsb0JBQVksSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsTUFBTTtvQkFDTixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1osS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBVSxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDakIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsaUJBQWlCO2dCQUNqQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2Qsa0NBQWtDO2dCQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO2dCQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNqQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsbUJBQW1CO2dCQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFDeEIsQ0FBQztZQUVELG1CQUFtQjtZQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDN0IsWUFBWTtvQkFDWiw4REFBOEQ7b0JBQzlELHdEQUF3RDtvQkFDeEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2xDLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNiLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQzt3QkFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUM3QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQzt3QkFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzt3QkFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7b0JBQ3hCLENBQUM7Z0JBRUYsQ0FBQztxQkFBTSxDQUFDO29CQUNQLHNCQUFzQjtvQkFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO29CQUN6QyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3RCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQzlDLFFBQVEsR0FBRyxFQUFFLENBQUM7NEJBQ2I7Z0NBQWUsTUFBTSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0NBQUMsTUFBTTs0QkFDN0M7Z0NBQWMsTUFBTSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUM7Z0NBQUMsTUFBTTs0QkFDM0M7Z0NBQWdCLE1BQU0sQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO2dDQUFDLE1BQU07d0JBQ2hELENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO29CQUN2QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsY0FBYztZQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXpCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDWixjQUFjO29CQUNkLElBQUksSUFBSSxDQUFDLEtBQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEMsOEJBQThCO3dCQUM5QixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsK0JBQStCO3dCQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ3ZDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pDLENBQUM7Z0JBRUYsQ0FBQztxQkFBTSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNwQixhQUFhO29CQUNiLElBQUksSUFBSSxDQUFDLElBQUssQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDckMsNkJBQTZCO3dCQUM3QixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsK0JBQStCO3dCQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7d0JBQ3BDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCx1QkFBdUI7Z0JBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNYLFFBQVEsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUN6Qjs0QkFDQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ25DLE1BQU07d0JBQ1A7NEJBQ0MsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUNwQyxNQUFNO3dCQUNQOzRCQUNDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDbEMsTUFBTTtvQkFDUixDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sSUFBSSxDQUFDLElBQWlDO1lBQzdDLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNsQixJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsVUFBVSxDQUFDLEdBQU07WUFDaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN0QixJQUFJLFNBQVMsR0FBa0IsU0FBUyxDQUFDO1lBQ3pDLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25DLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNiLE9BQU87b0JBQ1AsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ2xCLENBQUM7cUJBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3BCLFFBQVE7b0JBQ1IsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ25CLENBQUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDM0IsTUFBTTtvQkFDTixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1osU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksU0FBUyxDQUFDO29CQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDakIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQztRQUN4QyxDQUFDO1FBRUQsWUFBWSxDQUFDLEdBQU07WUFDbEIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFJTyxzQkFBc0IsQ0FBQyxHQUFNLEVBQUUsVUFBbUI7WUFDekQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN0QixPQUFPLElBQUksRUFBRSxDQUFDO2dCQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDYixPQUFPO29CQUNQLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNsQixDQUFDO3FCQUFNLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUNwQixRQUFRO29CQUNSLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNuQixDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUM7b0JBQzNCLE1BQU07b0JBQ04sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNaLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNqQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsVUFBVTtvQkFDVixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO3dCQUNmLElBQUksVUFBVSxFQUFFLENBQUM7NEJBQ2hCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQzt3QkFDbkIsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE9BQU8sU0FBUyxDQUFDO3dCQUNsQixDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELG1CQUFtQixDQUFDLEdBQU07WUFDekIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxLQUFLLFNBQVMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsT0FBTyxDQUFDLFFBQXFDO1lBQzVDLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDakMsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0YsQ0FBQztRQUVELENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1lBQ2pCLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFTyxRQUFRLENBQUMsSUFBNkM7WUFDN0QsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFTyxXQUFXLENBQUMsSUFBNkMsRUFBRSxNQUFnQjtZQUNsRixNQUFNO1lBQ04sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUVELG9CQUFvQjtRQUNwQixXQUFXO1lBQ1YsTUFBTSxjQUFjLEdBQUcsQ0FBQyxJQUFpRCxFQUFXLEVBQUU7Z0JBQ3JGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2dCQUNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN2QixPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQztZQUNGLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0Q7SUExYkQsOENBMGJDIn0=