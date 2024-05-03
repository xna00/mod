/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SkipList = void 0;
    class Node {
        constructor(level, key, value) {
            this.level = level;
            this.key = key;
            this.value = value;
            this.forward = [];
        }
    }
    const NIL = undefined;
    class SkipList {
        /**
         *
         * @param capacity Capacity at which the list performs best
         */
        constructor(comparator, capacity = 2 ** 16) {
            this.comparator = comparator;
            this[_a] = 'SkipList';
            this._level = 0;
            this._size = 0;
            this._maxLevel = Math.max(1, Math.log2(capacity) | 0);
            this._header = new Node(this._maxLevel, NIL, NIL);
        }
        get size() {
            return this._size;
        }
        clear() {
            this._header = new Node(this._maxLevel, NIL, NIL);
            this._size = 0;
        }
        has(key) {
            return Boolean(SkipList._search(this, key, this.comparator));
        }
        get(key) {
            return SkipList._search(this, key, this.comparator)?.value;
        }
        set(key, value) {
            if (SkipList._insert(this, key, value, this.comparator)) {
                this._size += 1;
            }
            return this;
        }
        delete(key) {
            const didDelete = SkipList._delete(this, key, this.comparator);
            if (didDelete) {
                this._size -= 1;
            }
            return didDelete;
        }
        // --- iteration
        forEach(callbackfn, thisArg) {
            let node = this._header.forward[0];
            while (node) {
                callbackfn.call(thisArg, node.value, node.key, this);
                node = node.forward[0];
            }
        }
        [(_a = Symbol.toStringTag, Symbol.iterator)]() {
            return this.entries();
        }
        *entries() {
            let node = this._header.forward[0];
            while (node) {
                yield [node.key, node.value];
                node = node.forward[0];
            }
        }
        *keys() {
            let node = this._header.forward[0];
            while (node) {
                yield node.key;
                node = node.forward[0];
            }
        }
        *values() {
            let node = this._header.forward[0];
            while (node) {
                yield node.value;
                node = node.forward[0];
            }
        }
        toString() {
            // debug string...
            let result = '[SkipList]:';
            let node = this._header.forward[0];
            while (node) {
                result += `node(${node.key}, ${node.value}, lvl:${node.level})`;
                node = node.forward[0];
            }
            return result;
        }
        // from https://www.epaperpress.com/sortsearch/download/skiplist.pdf
        static _search(list, searchKey, comparator) {
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                return x;
            }
            return undefined;
        }
        static _insert(list, searchKey, value, comparator) {
            const update = [];
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (x && comparator(x.key, searchKey) === 0) {
                // update
                x.value = value;
                return false;
            }
            else {
                // insert
                const lvl = SkipList._randomLevel(list);
                if (lvl > list._level) {
                    for (let i = list._level; i < lvl; i++) {
                        update[i] = list._header;
                    }
                    list._level = lvl;
                }
                x = new Node(lvl, searchKey, value);
                for (let i = 0; i < lvl; i++) {
                    x.forward[i] = update[i].forward[i];
                    update[i].forward[i] = x;
                }
                return true;
            }
        }
        static _randomLevel(list, p = 0.5) {
            let lvl = 1;
            while (Math.random() < p && lvl < list._maxLevel) {
                lvl += 1;
            }
            return lvl;
        }
        static _delete(list, searchKey, comparator) {
            const update = [];
            let x = list._header;
            for (let i = list._level - 1; i >= 0; i--) {
                while (x.forward[i] && comparator(x.forward[i].key, searchKey) < 0) {
                    x = x.forward[i];
                }
                update[i] = x;
            }
            x = x.forward[0];
            if (!x || comparator(x.key, searchKey) !== 0) {
                // not found
                return false;
            }
            for (let i = 0; i < list._level; i++) {
                if (update[i].forward[i] !== x) {
                    break;
                }
                update[i].forward[i] = x.forward[i];
            }
            while (list._level > 0 && list._header.forward[list._level - 1] === NIL) {
                list._level -= 1;
            }
            return true;
        }
    }
    exports.SkipList = SkipList;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2tpcExpc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL3NraXBMaXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7SUFHaEcsTUFBTSxJQUFJO1FBRVQsWUFBcUIsS0FBYSxFQUFXLEdBQU0sRUFBUyxLQUFRO1lBQS9DLFVBQUssR0FBTCxLQUFLLENBQVE7WUFBVyxRQUFHLEdBQUgsR0FBRyxDQUFHO1lBQVMsVUFBSyxHQUFMLEtBQUssQ0FBRztZQUNuRSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNuQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLEdBQUcsR0FBYyxTQUFTLENBQUM7SUFNakMsTUFBYSxRQUFRO1FBU3BCOzs7V0FHRztRQUNILFlBQ1UsVUFBa0MsRUFDM0MsV0FBbUIsQ0FBQyxJQUFJLEVBQUU7WUFEakIsZUFBVSxHQUFWLFVBQVUsQ0FBd0I7WUFabkMsUUFBb0IsR0FBRyxVQUFVLENBQUM7WUFHbkMsV0FBTSxHQUFXLENBQUMsQ0FBQztZQUVuQixVQUFLLEdBQVcsQ0FBQyxDQUFDO1lBVXpCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsT0FBTyxHQUFRLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxJQUFJLElBQUk7WUFDUCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELEtBQUs7WUFDSixJQUFJLENBQUMsT0FBTyxHQUFRLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFT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