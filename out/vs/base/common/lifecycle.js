/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/collections", "./map", "vs/base/common/functional", "vs/base/common/iterator"], function (require, exports, arrays_1, collections_1, map_1, functional_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisposableMap = exports.ImmortalReference = exports.AsyncReferenceCollection = exports.ReferenceCollection = exports.SafeDisposable = exports.RefCountedDisposable = exports.MandatoryMutableDisposable = exports.MutableDisposable = exports.Disposable = exports.DisposableStore = exports.DisposableTracker = void 0;
    exports.setDisposableTracker = setDisposableTracker;
    exports.trackDisposable = trackDisposable;
    exports.markAsDisposed = markAsDisposed;
    exports.markAsSingleton = markAsSingleton;
    exports.isDisposable = isDisposable;
    exports.dispose = dispose;
    exports.disposeIfDisposable = disposeIfDisposable;
    exports.combinedDisposable = combinedDisposable;
    exports.toDisposable = toDisposable;
    exports.disposeOnReturn = disposeOnReturn;
    // #region Disposable Tracking
    /**
     * Enables logging of potentially leaked disposables.
     *
     * A disposable is considered leaked if it is not disposed or not registered as the child of
     * another disposable. This tracking is very simple an only works for classes that either
     * extend Disposable or use a DisposableStore. This means there are a lot of false positives.
     */
    const TRACK_DISPOSABLES = false;
    let disposableTracker = null;
    class DisposableTracker {
        constructor() {
            this.livingDisposables = new Map();
        }
        static { this.idx = 0; }
        getDisposableData(d) {
            let val = this.livingDisposables.get(d);
            if (!val) {
                val = { parent: null, source: null, isSingleton: false, value: d, idx: DisposableTracker.idx++ };
                this.livingDisposables.set(d, val);
            }
            return val;
        }
        trackDisposable(d) {
            const data = this.getDisposableData(d);
            if (!data.source) {
                data.source =
                    new Error().stack;
            }
        }
        setParent(child, parent) {
            const data = this.getDisposableData(child);
            data.parent = parent;
        }
        markAsDisposed(x) {
            this.livingDisposables.delete(x);
        }
        markAsSingleton(disposable) {
            this.getDisposableData(disposable).isSingleton = true;
        }
        getRootParent(data, cache) {
            const cacheValue = cache.get(data);
            if (cacheValue) {
                return cacheValue;
            }
            const result = data.parent ? this.getRootParent(this.getDisposableData(data.parent), cache) : data;
            cache.set(data, result);
            return result;
        }
        getTrackedDisposables() {
            const rootParentCache = new Map();
            const leaking = [...this.livingDisposables.entries()]
                .filter(([, v]) => v.source !== null && !this.getRootParent(v, rootParentCache).isSingleton)
                .flatMap(([k]) => k);
            return leaking;
        }
        computeLeakingDisposables(maxReported = 10, preComputedLeaks) {
            let uncoveredLeakingObjs;
            if (preComputedLeaks) {
                uncoveredLeakingObjs = preComputedLeaks;
            }
            else {
                const rootParentCache = new Map();
                const leakingObjects = [...this.livingDisposables.values()]
                    .filter((info) => info.source !== null && !this.getRootParent(info, rootParentCache).isSingleton);
                if (leakingObjects.length === 0) {
                    return;
                }
                const leakingObjsSet = new Set(leakingObjects.map(o => o.value));
                // Remove all objects that are a child of other leaking objects. Assumes there are no cycles.
                uncoveredLeakingObjs = leakingObjects.filter(l => {
                    return !(l.parent && leakingObjsSet.has(l.parent));
                });
                if (uncoveredLeakingObjs.length === 0) {
                    throw new Error('There are cyclic diposable chains!');
                }
            }
            if (!uncoveredLeakingObjs) {
                return undefined;
            }
            function getStackTracePath(leaking) {
                function removePrefix(array, linesToRemove) {
                    while (array.length > 0 && linesToRemove.some(regexp => typeof regexp === 'string' ? regexp === array[0] : array[0].match(regexp))) {
                        array.shift();
                    }
                }
                const lines = leaking.source.split('\n').map(p => p.trim().replace('at ', '')).filter(l => l !== '');
                removePrefix(lines, ['Error', /^trackDisposable \(.*\)$/, /^DisposableTracker.trackDisposable \(.*\)$/]);
                return lines.reverse();
            }
            const stackTraceStarts = new map_1.SetMap();
            for (const leaking of uncoveredLeakingObjs) {
                const stackTracePath = getStackTracePath(leaking);
                for (let i = 0; i <= stackTracePath.length; i++) {
                    stackTraceStarts.add(stackTracePath.slice(0, i).join('\n'), leaking);
                }
            }
            // Put earlier leaks first
            uncoveredLeakingObjs.sort((0, arrays_1.compareBy)(l => l.idx, arrays_1.numberComparator));
            let message = '';
            let i = 0;
            for (const leaking of uncoveredLeakingObjs.slice(0, maxReported)) {
                i++;
                const stackTracePath = getStackTracePath(leaking);
                const stackTraceFormattedLines = [];
                for (let i = 0; i < stackTracePath.length; i++) {
                    let line = stackTracePath[i];
                    const starts = stackTraceStarts.get(stackTracePath.slice(0, i + 1).join('\n'));
                    line = `(shared with ${starts.size}/${uncoveredLeakingObjs.length} leaks) at ${line}`;
                    const prevStarts = stackTraceStarts.get(stackTracePath.slice(0, i).join('\n'));
                    const continuations = (0, collections_1.groupBy)([...prevStarts].map(d => getStackTracePath(d)[i]), v => v);
                    delete continuations[stackTracePath[i]];
                    for (const [cont, set] of Object.entries(continuations)) {
                        stackTraceFormattedLines.unshift(`    - stacktraces of ${set.length} other leaks continue with ${cont}`);
                    }
                    stackTraceFormattedLines.unshift(line);
                }
                message += `\n\n\n==================== Leaking disposable ${i}/${uncoveredLeakingObjs.length}: ${leaking.value.constructor.name} ====================\n${stackTraceFormattedLines.join('\n')}\n============================================================\n\n`;
            }
            if (uncoveredLeakingObjs.length > maxReported) {
                message += `\n\n\n... and ${uncoveredLeakingObjs.length - maxReported} more leaking disposables\n\n`;
            }
            return { leaks: uncoveredLeakingObjs, details: message };
        }
    }
    exports.DisposableTracker = DisposableTracker;
    function setDisposableTracker(tracker) {
        disposableTracker = tracker;
    }
    if (TRACK_DISPOSABLES) {
        const __is_disposable_tracked__ = '__is_disposable_tracked__';
        setDisposableTracker(new class {
            trackDisposable(x) {
                const stack = new Error('Potentially leaked disposable').stack;
                setTimeout(() => {
                    if (!x[__is_disposable_tracked__]) {
                        console.log(stack);
                    }
                }, 3000);
            }
            setParent(child, parent) {
                if (child && child !== Disposable.None) {
                    try {
                        child[__is_disposable_tracked__] = true;
                    }
                    catch {
                        // noop
                    }
                }
            }
            markAsDisposed(disposable) {
                if (disposable && disposable !== Disposable.None) {
                    try {
                        disposable[__is_disposable_tracked__] = true;
                    }
                    catch {
                        // noop
                    }
                }
            }
            markAsSingleton(disposable) { }
        });
    }
    function trackDisposable(x) {
        disposableTracker?.trackDisposable(x);
        return x;
    }
    function markAsDisposed(disposable) {
        disposableTracker?.markAsDisposed(disposable);
    }
    function setParentOfDisposable(child, parent) {
        disposableTracker?.setParent(child, parent);
    }
    function setParentOfDisposables(children, parent) {
        if (!disposableTracker) {
            return;
        }
        for (const child of children) {
            disposableTracker.setParent(child, parent);
        }
    }
    /**
     * Indicates that the given object is a singleton which does not need to be disposed.
    */
    function markAsSingleton(singleton) {
        disposableTracker?.markAsSingleton(singleton);
        return singleton;
    }
    /**
     * Check if `thing` is {@link IDisposable disposable}.
     */
    function isDisposable(thing) {
        return typeof thing.dispose === 'function' && thing.dispose.length === 0;
    }
    function dispose(arg) {
        if (iterator_1.Iterable.is(arg)) {
            const errors = [];
            for (const d of arg) {
                if (d) {
                    try {
                        d.dispose();
                    }
                    catch (e) {
                        errors.push(e);
                    }
                }
            }
            if (errors.length === 1) {
                throw errors[0];
            }
            else if (errors.length > 1) {
                throw new AggregateError(errors, 'Encountered errors while disposing of store');
            }
            return Array.isArray(arg) ? [] : arg;
        }
        else if (arg) {
            arg.dispose();
            return arg;
        }
    }
    function disposeIfDisposable(disposables) {
        for (const d of disposables) {
            if (isDisposable(d)) {
                d.dispose();
            }
        }
        return [];
    }
    /**
     * Combine multiple disposable values into a single {@link IDisposable}.
     */
    function combinedDisposable(...disposables) {
        const parent = toDisposable(() => dispose(disposables));
        setParentOfDisposables(disposables, parent);
        return parent;
    }
    /**
     * Turn a function that implements dispose into an {@link IDisposable}.
     *
     * @param fn Clean up function, guaranteed to be called only **once**.
     */
    function toDisposable(fn) {
        const self = trackDisposable({
            dispose: (0, functional_1.createSingleCallFunction)(() => {
                markAsDisposed(self);
                fn();
            })
        });
        return self;
    }
    /**
     * Manages a collection of disposable values.
     *
     * This is the preferred way to manage multiple disposables. A `DisposableStore` is safer to work with than an
     * `IDisposable[]` as it considers edge cases, such as registering the same value multiple times or adding an item to a
     * store that has already been disposed of.
     */
    class DisposableStore {
        static { this.DISABLE_DISPOSED_WARNING = false; }
        constructor() {
            this._toDispose = new Set();
            this._isDisposed = false;
            trackDisposable(this);
        }
        /**
         * Dispose of all registered disposables and mark this object as disposed.
         *
         * Any future disposables added to this object will be disposed of on `add`.
         */
        dispose() {
            if (this._isDisposed) {
                return;
            }
            markAsDisposed(this);
            this._isDisposed = true;
            this.clear();
        }
        /**
         * @return `true` if this object has been disposed of.
         */
        get isDisposed() {
            return this._isDisposed;
        }
        /**
         * Dispose of all registered disposables but do not mark this object as disposed.
         */
        clear() {
            if (this._toDispose.size === 0) {
                return;
            }
            try {
                dispose(this._toDispose);
            }
            finally {
                this._toDispose.clear();
            }
        }
        /**
         * Add a new {@link IDisposable disposable} to the collection.
         */
        add(o) {
            if (!o) {
                return o;
            }
            if (o === this) {
                throw new Error('Cannot register a disposable on itself!');
            }
            setParentOfDisposable(o, this);
            if (this._isDisposed) {
                if (!DisposableStore.DISABLE_DISPOSED_WARNING) {
                    console.warn(new Error('Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!').stack);
                }
            }
            else {
                this._toDispose.add(o);
            }
            return o;
        }
        /**
         * Deletes a disposable from store and disposes of it. This will not throw or warn and proceed to dispose the
         * disposable even when the disposable is not part in the store.
         */
        delete(o) {
            if (!o) {
                return;
            }
            if (o === this) {
                throw new Error('Cannot dispose a disposable on itself!');
            }
            this._toDispose.delete(o);
            o.dispose();
        }
        /**
         * Deletes the value from the store, but does not dispose it.
         */
        deleteAndLeak(o) {
            if (!o) {
                return;
            }
            if (this._toDispose.has(o)) {
                this._toDispose.delete(o);
                setParentOfDisposable(o, null);
            }
        }
    }
    exports.DisposableStore = DisposableStore;
    /**
     * Abstract base class for a {@link IDisposable disposable} object.
     *
     * Subclasses can {@linkcode _register} disposables that will be automatically cleaned up when this object is disposed of.
     */
    class Disposable {
        /**
         * A disposable that does nothing when it is disposed of.
         *
         * TODO: This should not be a static property.
         */
        static { this.None = Object.freeze({ dispose() { } }); }
        constructor() {
            this._store = new DisposableStore();
            trackDisposable(this);
            setParentOfDisposable(this._store, this);
        }
        dispose() {
            markAsDisposed(this);
            this._store.dispose();
        }
        /**
         * Adds `o` to the collection of disposables managed by this object.
         */
        _register(o) {
            if (o === this) {
                throw new Error('Cannot register a disposable on itself!');
            }
            return this._store.add(o);
        }
    }
    exports.Disposable = Disposable;
    /**
     * Manages the lifecycle of a disposable value that may be changed.
     *
     * This ensures that when the disposable value is changed, the previously held disposable is disposed of. You can
     * also register a `MutableDisposable` on a `Disposable` to ensure it is automatically cleaned up.
     */
    class MutableDisposable {
        constructor() {
            this._isDisposed = false;
            trackDisposable(this);
        }
        get value() {
            return this._isDisposed ? undefined : this._value;
        }
        set value(value) {
            if (this._isDisposed || value === this._value) {
                return;
            }
            this._value?.dispose();
            if (value) {
                setParentOfDisposable(value, this);
            }
            this._value = value;
        }
        /**
         * Resets the stored value and disposed of the previously stored value.
         */
        clear() {
            this.value = undefined;
        }
        dispose() {
            this._isDisposed = true;
            markAsDisposed(this);
            this._value?.dispose();
            this._value = undefined;
        }
        /**
         * Clears the value, but does not dispose it.
         * The old value is returned.
        */
        clearAndLeak() {
            const oldValue = this._value;
            this._value = undefined;
            if (oldValue) {
                setParentOfDisposable(oldValue, null);
            }
            return oldValue;
        }
    }
    exports.MutableDisposable = MutableDisposable;
    /**
     * Manages the lifecycle of a disposable value that may be changed like {@link MutableDisposable}, but the value must
     * exist and cannot be undefined.
     */
    class MandatoryMutableDisposable {
        constructor(initialValue) {
            this._disposable = new MutableDisposable();
            this._isDisposed = false;
            this._disposable.value = initialValue;
        }
        get value() {
            return this._disposable.value;
        }
        set value(value) {
            if (this._isDisposed || value === this._disposable.value) {
                return;
            }
            this._disposable.value = value;
        }
        dispose() {
            this._isDisposed = true;
            this._disposable.dispose();
        }
    }
    exports.MandatoryMutableDisposable = MandatoryMutableDisposable;
    class RefCountedDisposable {
        constructor(_disposable) {
            this._disposable = _disposable;
            this._counter = 1;
        }
        acquire() {
            this._counter++;
            return this;
        }
        release() {
            if (--this._counter === 0) {
                this._disposable.dispose();
            }
            return this;
        }
    }
    exports.RefCountedDisposable = RefCountedDisposable;
    /**
     * A safe disposable can be `unset` so that a leaked reference (listener)
     * can be cut-off.
     */
    class SafeDisposable {
        constructor() {
            this.dispose = () => { };
            this.unset = () => { };
            this.isset = () => false;
            trackDisposable(this);
        }
        set(fn) {
            let callback = fn;
            this.unset = () => callback = undefined;
            this.isset = () => callback !== undefined;
            this.dispose = () => {
                if (callback) {
                    callback();
                    callback = undefined;
                    markAsDisposed(this);
                }
            };
            return this;
        }
    }
    exports.SafeDisposable = SafeDisposable;
    class ReferenceCollection {
        constructor() {
            this.references = new Map();
        }
        acquire(key, ...args) {
            let reference = this.references.get(key);
            if (!reference) {
                reference = { counter: 0, object: this.createReferencedObject(key, ...args) };
                this.references.set(key, reference);
            }
            const { object } = reference;
            const dispose = (0, functional_1.createSingleCallFunction)(() => {
                if (--reference.counter === 0) {
                    this.destroyReferencedObject(key, reference.object);
                    this.references.delete(key);
                }
            });
            reference.counter++;
            return { object, dispose };
        }
    }
    exports.ReferenceCollection = ReferenceCollection;
    /**
     * Unwraps a reference collection of promised values. Makes sure
     * references are disposed whenever promises get rejected.
     */
    class AsyncReferenceCollection {
        constructor(referenceCollection) {
            this.referenceCollection = referenceCollection;
        }
        async acquire(key, ...args) {
            const ref = this.referenceCollection.acquire(key, ...args);
            try {
                const object = await ref.object;
                return {
                    object,
                    dispose: () => ref.dispose()
                };
            }
            catch (error) {
                ref.dispose();
                throw error;
            }
        }
    }
    exports.AsyncReferenceCollection = AsyncReferenceCollection;
    class ImmortalReference {
        constructor(object) {
            this.object = object;
        }
        dispose() { }
    }
    exports.ImmortalReference = ImmortalReference;
    function disposeOnReturn(fn) {
        const store = new DisposableStore();
        try {
            fn(store);
        }
        finally {
            store.dispose();
        }
    }
    /**
     * A map the manages the lifecycle of the values that it stores.
     */
    class DisposableMap {
        constructor() {
            this._store = new Map();
            this._isDisposed = false;
            trackDisposable(this);
        }
        /**
         * Disposes of all stored values and mark this object as disposed.
         *
         * Trying to use this object after it has been disposed of is an error.
         */
        dispose() {
            markAsDisposed(this);
            this._isDisposed = true;
            this.clearAndDisposeAll();
        }
        /**
         * Disposes of all stored values and clear the map, but DO NOT mark this object as disposed.
         */
        clearAndDisposeAll() {
            if (!this._store.size) {
                return;
            }
            try {
                dispose(this._store.values());
            }
            finally {
                this._store.clear();
            }
        }
        has(key) {
            return this._store.has(key);
        }
        get size() {
            return this._store.size;
        }
        get(key) {
            return this._store.get(key);
        }
        set(key, value, skipDisposeOnOverwrite = false) {
            if (this._isDisposed) {
                console.warn(new Error('Trying to add a disposable to a DisposableMap that has already been disposed of. The added object will be leaked!').stack);
            }
            if (!skipDisposeOnOverwrite) {
                this._store.get(key)?.dispose();
            }
            this._store.set(key, value);
        }
        /**
         * Delete the value stored for `key` from this map and also dispose of it.
         */
        deleteAndDispose(key) {
            this._store.get(key)?.dispose();
            this._store.delete(key);
        }
        keys() {
            return this._store.keys();
        }
        values() {
            return this._store.values();
        }
        [Symbol.iterator]() {
            return this._store[Symbol.iterator]();
        }
    }
    exports.DisposableMap = DisposableMap;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi9saWZlY3ljbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaU1oRyxvREFFQztJQXFDRCwwQ0FHQztJQUVELHdDQUVDO0lBa0JELDBDQUdDO0lBb0JELG9DQUVDO0lBVUQsMEJBeUJDO0lBRUQsa0RBT0M7SUFLRCxnREFJQztJQU9ELG9DQVFDO0lBMlZELDBDQU9DO0lBeHJCRCw4QkFBOEI7SUFFOUI7Ozs7OztPQU1HO0lBQ0gsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDaEMsSUFBSSxpQkFBaUIsR0FBOEIsSUFBSSxDQUFDO0lBaUN4RCxNQUFhLGlCQUFpQjtRQUE5QjtZQUdrQixzQkFBaUIsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztRQXlJN0UsQ0FBQztpQkEzSWUsUUFBRyxHQUFHLENBQUMsQUFBSixDQUFLO1FBSWYsaUJBQWlCLENBQUMsQ0FBYztZQUN2QyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixHQUFHLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUNqRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRUQsZUFBZSxDQUFDLENBQWM7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