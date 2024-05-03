/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/cancellation", "vs/base/common/hotReload", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/config/elementSizeObserver", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength"], function (require, exports, arraysFind_1, cancellation_1, hotReload_1, lifecycle_1, observable_1, elementSizeObserver_1, position_1, range_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisposableCancellationTokenSource = exports.ManagedOverlayWidget = exports.PlaceholderViewZone = exports.ViewZoneOverlayWidget = exports.ObservableElementSizeObserver = void 0;
    exports.joinCombine = joinCombine;
    exports.applyObservableDecorations = applyObservableDecorations;
    exports.appendRemoveOnDispose = appendRemoveOnDispose;
    exports.prependRemoveOnDispose = prependRemoveOnDispose;
    exports.observableConfigValue = observableConfigValue;
    exports.animatedObservable = animatedObservable;
    exports.deepMerge = deepMerge;
    exports.applyStyle = applyStyle;
    exports.readHotReloadableExport = readHotReloadableExport;
    exports.observeHotReloadableExports = observeHotReloadableExports;
    exports.applyViewZones = applyViewZones;
    exports.translatePosition = translatePosition;
    exports.bindContextKey = bindContextKey;
    exports.filterWithPrevious = filterWithPrevious;
    function joinCombine(arr1, arr2, keySelector, combine) {
        if (arr1.length === 0) {
            return arr2;
        }
        if (arr2.length === 0) {
            return arr1;
        }
        const result = [];
        let i = 0;
        let j = 0;
        while (i < arr1.length && j < arr2.length) {
            const val1 = arr1[i];
            const val2 = arr2[j];
            const key1 = keySelector(val1);
            const key2 = keySelector(val2);
            if (key1 < key2) {
                result.push(val1);
                i++;
            }
            else if (key1 > key2) {
                result.push(val2);
                j++;
            }
            else {
                result.push(combine(val1, val2));
                i++;
                j++;
            }
        }
        while (i < arr1.length) {
            result.push(arr1[i]);
            i++;
        }
        while (j < arr2.length) {
            result.push(arr2[j]);
            j++;
        }
        return result;
    }
    // TODO make utility
    function applyObservableDecorations(editor, decorations) {
        const d = new lifecycle_1.DisposableStore();
        const decorationsCollection = editor.createDecorationsCollection();
        d.add((0, observable_1.autorunOpts)({ debugName: () => `Apply decorations from ${decorations.debugName}` }, reader => {
            const d = decorations.read(reader);
            decorationsCollection.set(d);
        }));
        d.add({
            dispose: () => {
                decorationsCollection.clear();
            }
        });
        return d;
    }
    function appendRemoveOnDispose(parent, child) {
        parent.appendChild(child);
        return (0, lifecycle_1.toDisposable)(() => {
            parent.removeChild(child);
        });
    }
    function prependRemoveOnDispose(parent, child) {
        parent.prepend(child);
        return (0, lifecycle_1.toDisposable)(() => {
            parent.removeChild(child);
        });
    }
    function observableConfigValue(key, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key) ?? defaultValue);
    }
    class ObservableElementSizeObserver extends lifecycle_1.Disposable {
        get width() { return this._width; }
        get height() { return this._height; }
        constructor(element, dimension) {
            super();
            this.elementSizeObserver = this._register(new elementSizeObserver_1.ElementSizeObserver(element, dimension));
            this._width = (0, observable_1.observableValue)(this, this.elementSizeObserver.getWidth());
            this._height = (0, observable_1.observableValue)(this, this.elementSizeObserver.getHeight());
            this._register(this.elementSizeObserver.onDidChange(e => (0, observable_1.transaction)(tx => {
                /** @description Set width/height from elementSizeObserver */
                this._width.set(this.elementSizeObserver.getWidth(), tx);
                this._height.set(this.elementSizeObserver.getHeight(), tx);
            })));
        }
        observe(dimension) {
            this.elementSizeObserver.observe(dimension);
        }
        setAutomaticLayout(automaticLayout) {
            if (automaticLayout) {
                this.elementSizeObserver.startObserving();
            }
            else {
                this.elementSizeObserver.stopObserving();
            }
        }
    }
    exports.ObservableElementSizeObserver = ObservableElementSizeObserver;
    function animatedObservable(targetWindow, base, store) {
        let targetVal = base.get();
        let startVal = targetVal;
        let curVal = targetVal;
        const result = (0, observable_1.observableValue)('animatedValue', targetVal);
        let animationStartMs = -1;
        const durationMs = 300;
        let animationFrame = undefined;
        store.add((0, observable_1.autorunHandleChanges)({
            createEmptyChangeSummary: () => ({ animate: false }),
            handleChange: (ctx, s) => {
                if (ctx.didChange(base)) {
                    s.animate = s.animate || ctx.change;
                }
                return true;
            }
        }, (reader, s) => {
            /** @description update value */
            if (animationFrame !== undefined) {
                targetWindow.cancelAnimationFrame(animationFrame);
                animationFrame = undefined;
            }
            startVal = curVal;
            targetVal = base.read(reader);
            animationStartMs = Date.now() - (s.animate ? 0 : durationMs);
            update();
        }));
        function update() {
            const passedMs = Date.now() - animationStartMs;
            curVal = Math.floor(easeOutExpo(passedMs, startVal, targetVal - startVal, durationMs));
            if (passedMs < durationMs) {
                animationFrame = targetWindow.requestAnimationFrame(update);
            }
            else {
                curVal = targetVal;
            }
            result.set(curVal, undefined);
        }
        return result;
    }
    function easeOutExpo(t, b, c, d) {
        return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
    function deepMerge(source1, source2) {
        const result = {};
        for (const key in source1) {
            result[key] = source1[key];
        }
        for (const key in source2) {
            const source2Value = source2[key];
            if (typeof result[key] === 'object' && source2Value && typeof source2Value === 'object') {
                result[key] = deepMerge(result[key], source2Value);
            }
            else {
                result[key] = source2Value;
            }
        }
        return result;
    }
    class ViewZoneOverlayWidget extends lifecycle_1.Disposable {
        constructor(editor, viewZone, htmlElement) {
            super();
            this._register(new ManagedOverlayWidget(editor, htmlElement));
            this._register(applyStyle(htmlElement, {
                height: viewZone.actualHeight,
                top: viewZone.actualTop,
            }));
        }
    }
    exports.ViewZoneOverlayWidget = ViewZoneOverlayWidget;
    class PlaceholderViewZone {
        get afterLineNumber() { return this._afterLineNumber.get(); }
        constructor(_afterLineNumber, heightInPx) {
            this._afterLineNumber = _afterLineNumber;
            this.heightInPx = heightInPx;
            this.domNode = document.createElement('div');
            this._actualTop = (0, observable_1.observableValue)(this, undefined);
            this._actualHeight = (0, observable_1.observableValue)(this, undefined);
            this.actualTop = this._actualTop;
            this.actualHeight = this._actualHeight;
            this.showInHiddenAreas = true;
            this.onChange = this._afterLineNumber;
            this.onDomNodeTop = (top) => {
                this._actualTop.set(top, undefined);
            };
            this.onComputedHeight = (height) => {
                this._actualHeight.set(height, undefined);
            };
        }
    }
    exports.PlaceholderViewZone = PlaceholderViewZone;
    class ManagedOverlayWidget {
        static { this._counter = 0; }
        constructor(_editor, _domElement) {
            this._editor = _editor;
            this._domElement = _domElement;
            this._overlayWidgetId = `managedOverlayWidget-${ManagedOverlayWidget._counter++}`;
            this._overlayWidget = {
                getId: () => this._overlayWidgetId,
                getDomNode: () => this._domElement,
                getPosition: () => null
            };
            this._editor.addOverlayWidget(this._overlayWidget);
        }
        dispose() {
            this._editor.removeOverlayWidget(this._overlayWidget);
        }
    }
    exports.ManagedOverlayWidget = ManagedOverlayWidget;
    function applyStyle(domNode, style) {
        return (0, observable_1.autorun)(reader => {
            /** @description applyStyle */
            for (let [key, val] of Object.entries(style)) {
                if (val && typeof val === 'object' && 'read' in val) {
                    val = val.read(reader);
                }
                if (typeof val === 'number') {
                    val = `${val}px`;
                }
                key = key.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
                domNode.style[key] = val;
            }
        });
    }
    function readHotReloadableExport(value, reader) {
        observeHotReloadableExports([value], reader);
        return value;
    }
    function observeHotReloadableExports(values, reader) {
        if ((0, hotReload_1.isHotReloadEnabled)()) {
            const o = (0, observable_1.observableSignalFromEvent)('reload', event => (0, hotReload_1.registerHotReloadHandler)(({ oldExports }) => {
                if (![...Object.values(oldExports)].some(v => values.includes(v))) {
                    return undefined;
                }
                return (_newExports) => {
                    event(undefined);
                    return true;
                };
            }));
            o.read(reader);
        }
    }
    function applyViewZones(editor, viewZones, setIsUpdating, zoneIds) {
        const store = new lifecycle_1.DisposableStore();
        const lastViewZoneIds = [];
        store.add((0, observable_1.autorunWithStore)((reader, store) => {
            /** @description applyViewZones */
            const curViewZones = viewZones.read(reader);
            const viewZonIdsPerViewZone = new Map();
            const viewZoneIdPerOnChangeObservable = new Map();
            // Add/remove view zones
            if (setIsUpdating) {
                setIsUpdating(true);
            }
            editor.changeViewZones(a => {
                for (const id of lastViewZoneIds) {
                    a.removeZone(id);
                    zoneIds?.delete(id);
                }
                lastViewZoneIds.length = 0;
                for (const z of curViewZones) {
                    const id = a.addZone(z);
                    if (z.setZoneId) {
                        z.setZoneId(id);
                    }
                    lastViewZoneIds.push(id);
                    zoneIds?.add(id);
                    viewZonIdsPerViewZone.set(z, id);
                }
            });
            if (setIsUpdating) {
                setIsUpdating(false);
            }
            // Layout zone on change
            store.add((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary() {
                    return { zoneIds: [] };
                },
                handleChange(context, changeSummary) {
                    const id = viewZoneIdPerOnChangeObservable.get(context.changedObservable);
                    if (id !== undefined) {
                        changeSummary.zoneIds.push(id);
                    }
                    return true;
                },
            }, (reader, changeSummary) => {
                /** @description layoutZone on change */
                for (const vz of curViewZones) {
                    if (vz.onChange) {
                        viewZoneIdPerOnChangeObservable.set(vz.onChange, viewZonIdsPerViewZone.get(vz));
                        vz.onChange.read(reader);
                    }
                }
                if (setIsUpdating) {
                    setIsUpdating(true);
                }
                editor.changeViewZones(a => { for (const id of changeSummary.zoneIds) {
                    a.layoutZone(id);
                } });
                if (setIsUpdating) {
                    setIsUpdating(false);
                }
            }));
        }));
        store.add({
            dispose() {
                if (setIsUpdating) {
                    setIsUpdating(true);
                }
                editor.changeViewZones(a => { for (const id of lastViewZoneIds) {
                    a.removeZone(id);
                } });
                zoneIds?.clear();
                if (setIsUpdating) {
                    setIsUpdating(false);
                }
            }
        });
        return store;
    }
    class DisposableCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        dispose() {
            super.dispose(true);
        }
    }
    exports.DisposableCancellationTokenSource = DisposableCancellationTokenSource;
    function translatePosition(posInOriginal, mappings) {
        const mapping = (0, arraysFind_1.findLast)(mappings, m => m.original.startLineNumber <= posInOriginal.lineNumber);
        if (!mapping) {
            // No changes before the position
            return range_1.Range.fromPositions(posInOriginal);
        }
        if (mapping.original.endLineNumberExclusive <= posInOriginal.lineNumber) {
            const newLineNumber = posInOriginal.lineNumber - mapping.original.endLineNumberExclusive + mapping.modified.endLineNumberExclusive;
            return range_1.Range.fromPositions(new position_1.Position(newLineNumber, posInOriginal.column));
        }
        if (!mapping.innerChanges) {
            // Only for legacy algorithm
            return range_1.Range.fromPositions(new position_1.Position(mapping.modified.startLineNumber, 1));
        }
        const innerMapping = (0, arraysFind_1.findLast)(mapping.innerChanges, m => m.originalRange.getStartPosition().isBeforeOrEqual(posInOriginal));
        if (!innerMapping) {
            const newLineNumber = posInOriginal.lineNumber - mapping.original.startLineNumber + mapping.modified.startLineNumber;
            return range_1.Range.fromPositions(new position_1.Position(newLineNumber, posInOriginal.column));
        }
        if (innerMapping.originalRange.containsPosition(posInOriginal)) {
            return innerMapping.modifiedRange;
        }
        else {
            const l = lengthBetweenPositions(innerMapping.originalRange.getEndPosition(), posInOriginal);
            return range_1.Range.fromPositions(l.addToPosition(innerMapping.modifiedRange.getEndPosition()));
        }
    }
    function lengthBetweenPositions(position1, position2) {
        if (position1.lineNumber === position2.lineNumber) {
            return new textLength_1.TextLength(0, position2.column - position1.column);
        }
        else {
            return new textLength_1.TextLength(position2.lineNumber - position1.lineNumber, position2.column - 1);
        }
    }
    function bindContextKey(key, service, computeValue) {
        const boundKey = key.bindTo(service);
        return (0, observable_1.autorunOpts)({ debugName: () => `Set Context Key "${key.key}"` }, reader => {
            boundKey.set(computeValue(reader));
        });
    }
    function filterWithPrevious(arr, filter) {
        let prev;
        return arr.filter(cur => {
            const result = filter(cur, prev);
            prev = cur;
            return result;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsa0NBc0NDO0lBR0QsZ0VBYUM7SUFFRCxzREFLQztJQUVELHdEQUtDO0lBRUQsc0RBU0M7SUFzQ0QsZ0RBOENDO0lBTUQsOEJBY0M7SUF5RkQsZ0NBY0M7SUFFRCwwREFHQztJQUVELGtFQWdCQztJQUVELHdDQStEQztJQVFELDhDQTZCQztJQVVELHdDQUtDO0lBRUQsZ0RBT0M7SUFuYkQsU0FBZ0IsV0FBVyxDQUFJLElBQWtCLEVBQUUsSUFBa0IsRUFBRSxXQUErQixFQUFFLE9BQTRCO1FBQ25JLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDdkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUMzQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixNQUFNLElBQUks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