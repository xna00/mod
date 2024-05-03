/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DenseKeyProvider = exports.identityKeyProvider = exports.SmallImmutableSet = void 0;
    const emptyArr = [];
    /**
     * Represents an immutable set that works best for a small number of elements (less than 32).
     * It uses bits to encode element membership efficiently.
    */
    class SmallImmutableSet {
        static { this.cache = new Array(129); }
        static create(items, additionalItems) {
            if (items <= 128 && additionalItems.length === 0) {
                // We create a cache of 128=2^7 elements to cover all sets with up to 7 (dense) elements.
                let cached = SmallImmutableSet.cache[items];
                if (!cached) {
                    cached = new SmallImmutableSet(items, additionalItems);
                    SmallImmutableSet.cache[items] = cached;
                }
                return cached;
            }
            return new SmallImmutableSet(items, additionalItems);
        }
        static { this.empty = SmallImmutableSet.create(0, emptyArr); }
        static getEmpty() {
            return this.empty;
        }
        constructor(items, additionalItems) {
            this.items = items;
            this.additionalItems = additionalItems;
        }
        add(value, keyProvider) {
            const key = keyProvider.getKey(value);
            let idx = key >> 5; // divided by 32
            if (idx === 0) {
                // fast path
                const newItem = (1 << key) | this.items;
                if (newItem === this.items) {
                    return this;
                }
                return SmallImmutableSet.create(newItem, this.additionalItems);
            }
            idx--;
            const newItems = this.additionalItems.slice(0);
            while (newItems.length < idx) {
                newItems.push(0);
            }
            newItems[idx] |= 1 << (key & 31);
            return SmallImmutableSet.create(this.items, newItems);
        }
        has(value, keyProvider) {
            const key = keyProvider.getKey(value);
            let idx = key >> 5; // divided by 32
            if (idx === 0) {
                // fast path
                return (this.items & (1 << key)) !== 0;
            }
            idx--;
            return ((this.additionalItems[idx] || 0) & (1 << (key & 31))) !== 0;
        }
        merge(other) {
            const merged = this.items | other.items;
            if (this.additionalItems === emptyArr && other.additionalItems === emptyArr) {
                // fast path
                if (merged === this.items) {
                    return this;
                }
                if (merged === other.items) {
                    return other;
                }
                return SmallImmutableSet.create(merged, emptyArr);
            }
            // This can be optimized, but it's not a common case
            const newItems = [];
            for (let i = 0; i < Math.max(this.additionalItems.length, other.additionalItems.length); i++) {
                const item1 = this.additionalItems[i] || 0;
                const item2 = other.additionalItems[i] || 0;
                newItems.push(item1 | item2);
            }
            return SmallImmutableSet.create(merged, newItems);
        }
        intersects(other) {
            if ((this.items & other.items) !== 0) {
                return true;
            }
            for (let i = 0; i < Math.min(this.additionalItems.length, other.additionalItems.length); i++) {
                if ((this.additionalItems[i] & other.additionalItems[i]) !== 0) {
                    return true;
                }
            }
            return false;
        }
        equals(other) {
            if (this.items !== other.items) {
                return false;
            }
            if (this.additionalItems.length !== other.additionalItems.length) {
                return false;
            }
            for (let i = 0; i < this.additionalItems.length; i++) {
                if (this.additionalItems[i] !== other.additionalItems[i]) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.SmallImmutableSet = SmallImmutableSet;
    exports.identityKeyProvider = {
        getKey(value) {
            return value;
        }
    };
    /**
     * Assigns values a unique incrementing key.
    */
    class DenseKeyProvider {
        constructor() {
            this.items = new Map();
        }
        getKey(value) {
            let existing = this.items.get(value);
            if (existing === undefined) {
                existing = this.items.size;
                this.items.set(value, existing);
            }
            return existing;
        }
        reverseLookup(value) {
            return [...this.items].find(([_key, v]) => v === value)?.[0];
        }
        reverseLookupSet(set) {
            const result = [];
            for (const [key] of this.items) {
                if (set.has(key, this)) {
                    result.push(key);
                }
            }
            return result;
        }
        keys() {
            return this.items.keys();
        }
    }
    exports.DenseKeyProvider = DenseKeyProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hbGxJbW11dGFibGVTZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL3NtYWxsSW1tdXRhYmxlU2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUVoRyxNQUFNLFFBQVEsR0FBYSxFQUFFLENBQUM7SUFFOUI7OztNQUdFO0lBQ0YsTUFBYSxpQkFBaUI7aUJBQ2QsVUFBSyxHQUFHLElBQUksS0FBSyxDQUF5QixHQUFHLENBQUMsQ0FBQztRQUV0RCxNQUFNLENBQUMsTUFBTSxDQUFJLEtBQWEsRUFBRSxlQUFrQztZQUN6RSxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksZUFBZSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEQseUZBQXlGO2dCQUN6RixJQUFJLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixNQUFNLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3ZELGlCQUFpQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7Z0JBQ3pDLENBQUM7Z0JBQ0QsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN0RCxDQUFDO2lCQUVjLFVBQUssR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzNELE1BQU0sQ0FBQyxRQUFRO1lBQ3JCLE9BQU8sSUFBSSxDQUFD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