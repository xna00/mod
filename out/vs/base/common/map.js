/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    var _a, _b, _c;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetMap = exports.BidirectionalMap = exports.CounterSet = exports.LRUCache = exports.LinkedMap = exports.Touch = exports.ResourceSet = exports.ResourceMap = void 0;
    exports.getOrSet = getOrSet;
    exports.mapToString = mapToString;
    exports.setToString = setToString;
    exports.mapsStrictEqualIgnoreOrder = mapsStrictEqualIgnoreOrder;
    function getOrSet(map, key, value) {
        let result = map.get(key);
        if (result === undefined) {
            result = value;
            map.set(key, result);
        }
        return result;
    }
    function mapToString(map) {
        const entries = [];
        map.forEach((value, key) => {
            entries.push(`${key} => ${value}`);
        });
        return `Map(${map.size}) {${entries.join(', ')}}`;
    }
    function setToString(set) {
        const entries = [];
        set.forEach(value => {
            entries.push(value);
        });
        return `Set(${set.size}) {${entries.join(', ')}}`;
    }
    class ResourceMapEntry {
        constructor(uri, value) {
            this.uri = uri;
            this.value = value;
        }
    }
    function isEntries(arg) {
        return Array.isArray(arg);
    }
    class ResourceMap {
        static { this.defaultToKey = (resource) => resource.toString(); }
        constructor(arg, toKey) {
            this[_a] = 'ResourceMap';
            if (arg instanceof ResourceMap) {
                this.map = new Map(arg.map);
                this.toKey = toKey ?? ResourceMap.defaultToKey;
            }
            else if (isEntries(arg)) {
                this.map = new Map();
                this.toKey = toKey ?? ResourceMap.defaultToKey;
                for (const [resource, value] of arg) {
                    this.set(resource, value);
                }
            }
            else {
                this.map = new Map();
                this.toKey = arg ?? ResourceMap.defaultToKey;
            }
        }
        set(resource, value) {
            this.map.set(this.toKey(resource), new ResourceMapEntry(resource, value));
            return this;
        }
        get(resource) {
            return this.map.get(this.toKey(resource))?.value;
        }
        has(resource) {
            return this.map.has(this.toKey(resource));
        }
        get size() {
            return this.map.size;
        }
        clear() {
            this.map.clear();
        }
        delete(resource) {
            return this.map.delete(this.toKey(resource));
        }
        forEach(clb, thisArg) {
            if (typeof thisArg !== 'undefined') {
                clb = clb.bind(thisArg);
            }
            for (const [_, entry] of this.map) {
                clb(entry.value, entry.uri, this);
            }
        }
        *values() {
            for (const entry of this.map.values()) {
                yield entry.value;
            }
        }
        *keys() {
            for (const entry of this.map.values()) {
                yield entry.uri;
            }
        }
        *entries() {
            for (const entry of this.map.values()) {
                yield [entry.uri, entry.value];
            }
        }
        *[(_a = Symbol.toStringTag, Symbol.iterator)]() {
            for (const [, entry] of this.map) {
                yield [entry.uri, entry.value];
            }
        }
    }
    exports.ResourceMap = ResourceMap;
    class ResourceSet {
        constructor(entriesOrKey, toKey) {
            this[_b] = 'ResourceSet';
            if (!entriesOrKey || typeof entriesOrKey === 'function') {
                this._map = new ResourceMap(entriesOrKey);
            }
            else {
                this._map = new ResourceMap(toKey);
                entriesOrKey.forEach(this.add, this);
            }
        }
        get size() {
            return this._map.size;
        }
        add(value) {
            this._map.set(value, value);
            return this;
        }
        clear() {
            this._map.clear();
        }
        delete(value) {
            return this._map.delete(value);
        }
        forEach(callbackfn, thisArg) {
            this._map.forEach((_value, key) => callbackfn.call(thisArg, key, key, this));
        }
        has(value) {
            return this._map.has(value);
        }
        entries() {
            return this._map.entries();
        }
        keys() {
            return this._map.keys();
        }
        values() {
            return this._map.keys();
        }
        [(_b = Symbol.toStringTag, Symbol.iterator)]() {
            return this.keys();
        }
    }
    exports.ResourceSet = ResourceSet;
    var Touch;
    (function (Touch) {
        Touch[Touch["None"] = 0] = "None";
        Touch[Touch["AsOld"] = 1] = "AsOld";
        Touch[Touch["AsNew"] = 2] = "AsNew";
    })(Touch || (exports.Touch = Touch = {}));
    class LinkedMap {
        constructor() {
            this[_c] = 'LinkedMap';
            this._map = new Map();
            this._head = undefined;
            this._tail = undefined;
            this._size = 0;
            this._state = 0;
        }
        clear() {
            this._map.clear();
            this._head = undefined;
            this._tail = undefined;
            this._size = 0;
            this._state++;
        }
        isEmpty() {
            return !this._head && !this._tail;
        }
        get size() {
            return this._size;
        }
        get first() {
            return this._head?.value;
        }
        get last() {
            return this._tail?.value;
        }
        has(key) {
            return this._map.has(key);
        }
        get(key, touch = 0 /* Touch.None */) {
            const item = this._map.get(key);
            if (!item) {
                return undefined;
            }
            if (touch !== 0 /* Touch.None */) {
                this.touch(item, touch);
            }
            return item.value;
        }
        set(key, value, touch = 0 /* Touch.None */) {
            let item = this._map.get(key);
            if (item) {
                item.value = value;
                if (touch !== 0 /* Touch.None */) {
                    this.touch(item, touch);
                }
            }
            else {
                item = { key, value, next: undefined, previous: undefined };
                switch (touch) {
                    case 0 /* Touch.None */:
                        this.addItemLast(item);
                        break;
                    case 1 /* Touch.AsOld */:
                        this.addItemFirst(item);
                        break;
                    case 2 /* Touch.AsNew */:
                        this.addItemLast(item);
                        break;
                    default:
                        this.addItemLast(item);
                        break;
                }
                this._map.set(key, item);
                this._size++;
            }
            return this;
        }
        delete(key) {
            return !!this.remove(key);
        }
        remove(key) {
            const item = this._map.get(key);
            if (!item) {
                return undefined;
            }
            this._map.delete(key);
            this.removeItem(item);
            this._size--;
            return item.value;
        }
        shift() {
            if (!this._head && !this._tail) {
                return undefined;
            }
            if (!this._head || !this._tail) {
                throw new Error('Invalid list');
            }
            const item = this._head;
            this._map.delete(item.key);
            this.removeItem(item);
            this._size--;
            return item.value;
        }
        forEach(callbackfn, thisArg) {
            const state = this._state;
            let current = this._head;
            while (current) {
                if (thisArg) {
                    callbackfn.bind(thisArg)(current.value, current.key, this);
                }
                else {
                    callbackfn(current.value, current.key, this);
                }
                if (this._state !== state) {
                    throw new Error(`LinkedMap got modified during iteration.`);
                }
                current = current.next;
            }
        }
        keys() {
            const map = this;
            const state = this._state;
            let current = this._head;
            const iterator = {
                [Symbol.iterator]() {
                    return iterator;
                },
                next() {
                    if (map._state !== state) {
                        throw new Error(`LinkedMap got modified during iteration.`);
                    }
                    if (current) {
                        const result = { value: current.key, done: false };
                        current = current.next;
                        return result;
                    }
                    else {
                        return { value: undefined, done: true };
                    }
                }
            };
            return iterator;
        }
        values() {
            const map = this;
            const state = this._state;
            let current = this._head;
            const iterator = {
                [Symbol.iterator]() {
                    return iterator;
                },
                next() {
                    if (map._state !== state) {
                        throw new Error(`LinkedMap got modified during iteration.`);
                    }
                    if (current) {
                        const result = { value: current.value, done: false };
                        current = current.next;
                        return result;
                    }
                    else {
                        return { value: undefined, done: true };
                    }
                }
            };
            return iterator;
        }
        entries() {
            const map = this;
            const state = this._state;
            let current = this._head;
            const iterator = {
                [Symbol.iterator]() {
                    return iterator;
                },
                next() {
                    if (map._state !== state) {
                        throw new Error(`LinkedMap got modified during iteration.`);
                    }
                    if (current) {
                        const result = { value: [current.key, current.value], done: false };
                        current = current.next;
                        return result;
                    }
                    else {
                        return { value: undefined, done: true };
                    }
                }
            };
            return iterator;
        }
        [(_c = Symbol.toStringTag, Symbol.iterator)]() {
            return this.entries();
        }
        trimOld(newSize) {
            if (newSize >= this.size) {
                return;
            }
            if (newSize === 0) {
                this.clear();
                return;
            }
            let current = this._head;
            let currentSize = this.size;
            while (current && currentSize > newSize) {
                this._map.delete(current.key);
                current = current.next;
                currentSize--;
            }
            this._head = current;
            this._size = currentSize;
            if (current) {
                current.previous = undefined;
            }
            this._state++;
        }
        addItemFirst(item) {
            // First time Insert
            if (!this._head && !this._tail) {
                this._tail = item;
            }
            else if (!this._head) {
                throw new Error('Invalid list');
            }
            else {
                item.next = this._head;
                this._head.previous = item;
            }
            this._head = item;
            this._state++;
        }
        addItemLast(item) {
            // First time Insert
            if (!this._head && !this._tail) {
                this._head = item;
            }
            else if (!this._tail) {
                throw new Error('Invalid list');
            }
            else {
                item.previous = this._tail;
                this._tail.next = item;
            }
            this._tail = item;
            this._state++;
        }
        removeItem(item) {
            if (item === this._head && item === this._tail) {
                this._head = undefined;
                this._tail = undefined;
            }
            else if (item === this._head) {
                // This can only happen if size === 1 which is handled
                // by the case above.
                if (!item.next) {
                    throw new Error('Invalid list');
                }
                item.next.previous = undefined;
                this._head = item.next;
            }
            else if (item === this._tail) {
                // This can only happen if size === 1 which is handled
                // by the case above.
                if (!item.previous) {
                    throw new Error('Invalid list');
                }
                item.previous.next = undefined;
                this._tail = item.previous;
            }
            else {
                const next = item.next;
                const previous = item.previous;
                if (!next || !previous) {
                    throw new Error('Invalid list');
                }
                next.previous = previous;
                previous.next = next;
            }
            item.next = undefined;
            item.previous = undefined;
            this._state++;
        }
        touch(item, touch) {
            if (!this._head || !this._tail) {
                throw new Error('Invalid list');
            }
            if ((touch !== 1 /* Touch.AsOld */ && touch !== 2 /* Touch.AsNew */)) {
                return;
            }
            if (touch === 1 /* Touch.AsOld */) {
                if (item === this._head) {
                    return;
                }
                const next = item.next;
                const previous = item.previous;
                // Unlink the item
                if (item === this._tail) {
                    // previous must be defined since item was not head but is tail
                    // So there are more than on item in the map
                    previous.next = undefined;
                    this._tail = previous;
                }
                else {
                    // Both next and previous are not undefined since item was neither head nor tail.
                    next.previous = previous;
                    previous.next = next;
                }
                // Insert the node at head
                item.previous = undefined;
                item.next = this._head;
                this._head.previous = item;
                this._head = item;
                this._state++;
            }
            else if (touch === 2 /* Touch.AsNew */) {
                if (item === this._tail) {
                    return;
                }
                const next = item.next;
                const previous = item.previous;
                // Unlink the item.
                if (item === this._head) {
                    // next must be defined since item was not tail but is head
                    // So there are more than on item in the map
                    next.previous = undefined;
                    this._head = next;
                }
                else {
                    // Both next and previous are not undefined since item was neither head nor tail.
                    next.previous = previous;
                    previous.next = next;
                }
                item.next = undefined;
                item.previous = this._tail;
                this._tail.next = item;
                this._tail = item;
                this._state++;
            }
        }
        toJSON() {
            const data = [];
            this.forEach((value, key) => {
                data.push([key, value]);
            });
            return data;
        }
        fromJSON(data) {
            this.clear();
            for (const [key, value] of data) {
                this.set(key, value);
            }
        }
    }
    exports.LinkedMap = LinkedMap;
    class LRUCache extends LinkedMap {
        constructor(limit, ratio = 1) {
            super();
            this._limit = limit;
            this._ratio = Math.min(Math.max(0, ratio), 1);
        }
        get limit() {
            return this._limit;
        }
        set limit(limit) {
            this._limit = limit;
            this.checkTrim();
        }
        get ratio() {
            return this._ratio;
        }
        set ratio(ratio) {
            this._ratio = Math.min(Math.max(0, ratio), 1);
            this.checkTrim();
        }
        get(key, touch = 2 /* Touch.AsNew */) {
            return super.get(key, touch);
        }
        peek(key) {
            return super.get(key, 0 /* Touch.None */);
        }
        set(key, value) {
            super.set(key, value, 2 /* Touch.AsNew */);
            this.checkTrim();
            return this;
        }
        checkTrim() {
            if (this.size > this._limit) {
                this.trimOld(Math.round(this._limit * this._ratio));
            }
        }
    }
    exports.LRUCache = LRUCache;
    class CounterSet {
        constructor() {
            this.map = new Map();
        }
        add(value) {
            this.map.set(value, (this.map.get(value) || 0) + 1);
            return this;
        }
        delete(value) {
            let counter = this.map.get(value) || 0;
            if (counter === 0) {
                return false;
            }
            counter--;
            if (counter === 0) {
                this.map.delete(value);
            }
            else {
                this.map.set(value, counter);
            }
            return true;
        }
        has(value) {
            return this.map.has(value);
        }
    }
    exports.CounterSet = CounterSet;
    /**
     * A map that allows access both by keys and values.
     * **NOTE**: values need to be unique.
     */
    class BidirectionalMap {
        constructor(entries) {
            this._m1 = new Map();
            this._m2 = new Map();
            if (entries) {
                for (const [key, value] of entries) {
                    this.set(key, value);
                }
            }
        }
        clear() {
            this._m1.clear();
            this._m2.clear();
        }
        set(key, value) {
            this._m1.set(key, value);
            this._m2.set(value, key);
        }
        get(key) {
            return this._m1.get(key);
        }
        getKey(value) {
            return this._m2.get(value);
        }
        delete(key) {
            const value = this._m1.get(key);
            if (value === undefined) {
                return false;
            }
            this._m1.delete(key);
            this._m2.delete(value);
            return true;
        }
        forEach(callbackfn, thisArg) {
            this._m1.forEach((value, key) => {
                callbackfn.call(thisArg, value, key, this);
            });
        }
        keys() {
            return this._m1.keys();
        }
        values() {
            return this._m1.values();
        }
    }
    exports.BidirectionalMap = BidirectionalMap;
    class SetMap {
        constructor() {
            this.map = new Map();
        }
        add(key, value) {
            let values = this.map.get(key);
            if (!values) {
                values = new Set();
                this.map.set(key, values);
            }
            values.add(value);
        }
        delete(key, value) {
            const values = this.map.get(key);
            if (!values) {
                return;
            }
            values.delete(value);
            if (values.size === 0) {
                this.map.delete(key);
            }
        }
        forEach(key, fn) {
            const values = this.map.get(key);
            if (!values) {
                return;
            }
            values.forEach(fn);
        }
        get(key) {
            const values = this.map.get(key);
            if (!values) {
                return new Set();
            }
            return values;
        }
    }
    exports.SetMap = SetMap;
    function mapsStrictEqualIgnoreOrder(a, b) {
        if (a === b) {
            return true;
        }
        if (a.size !== b.size) {
            return false;
        }
        for (const [key, value] of a) {
            if (!b.has(key) || b.get(key) !== value) {
                return false;
            }
        }
        for (const [key] of b) {
            if (!a.has(key)) {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7OztJQUloRyw0QkFRQztJQUVELGtDQU9DO0lBRUQsa0NBT0M7SUF3dkJELGdFQXNCQztJQXh5QkQsU0FBZ0IsUUFBUSxDQUFPLEdBQWMsRUFBRSxHQUFNLEVBQUUsS0FBUTtRQUM5RCxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzFCLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDZixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0QixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0IsV0FBVyxDQUFPLEdBQWM7UUFDL0MsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBQzdCLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLEdBQUcsQ0FBQyxJQUFJLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0lBQ25ELENBQUM7SUFFRCxTQUFnQixXQUFXLENBQUksR0FBVztRQUN6QyxNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDeEIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxD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