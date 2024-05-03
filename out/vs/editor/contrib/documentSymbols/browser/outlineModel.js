/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/map", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatureDebounce", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures"], function (require, exports, arrays_1, cancellation_1, errors_1, iterator_1, map_1, strings_1, position_1, range_1, languageFeatureDebounce_1, instantiation_1, extensions_1, model_1, lifecycle_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineModelService = exports.IOutlineModelService = exports.OutlineModel = exports.OutlineGroup = exports.OutlineElement = exports.TreeElement = void 0;
    class TreeElement {
        remove() {
            this.parent?.children.delete(this.id);
        }
        static findId(candidate, container) {
            // complex id-computation which contains the origin/extension,
            // the parent path, and some dedupe logic when names collide
            let candidateId;
            if (typeof candidate === 'string') {
                candidateId = `${container.id}/${candidate}`;
            }
            else {
                candidateId = `${container.id}/${candidate.name}`;
                if (container.children.get(candidateId) !== undefined) {
                    candidateId = `${container.id}/${candidate.name}_${candidate.range.startLineNumber}_${candidate.range.startColumn}`;
                }
            }
            let id = candidateId;
            for (let i = 0; container.children.get(id) !== undefined; i++) {
                id = `${candidateId}_${i}`;
            }
            return id;
        }
        static getElementById(id, element) {
            if (!id) {
                return undefined;
            }
            const len = (0, strings_1.commonPrefixLength)(id, element.id);
            if (len === id.length) {
                return element;
            }
            if (len < element.id.length) {
                return undefined;
            }
            for (const [, child] of element.children) {
                const candidate = TreeElement.getElementById(id, child);
                if (candidate) {
                    return candidate;
                }
            }
            return undefined;
        }
        static size(element) {
            let res = 1;
            for (const [, child] of element.children) {
                res += TreeElement.size(child);
            }
            return res;
        }
        static empty(element) {
            return element.children.size === 0;
        }
    }
    exports.TreeElement = TreeElement;
    class OutlineElement extends TreeElement {
        constructor(id, parent, symbol) {
            super();
            this.id = id;
            this.parent = parent;
            this.symbol = symbol;
            this.children = new Map();
        }
    }
    exports.OutlineElement = OutlineElement;
    class OutlineGroup extends TreeElement {
        constructor(id, parent, label, order) {
            super();
            this.id = id;
            this.parent = parent;
            this.label = label;
            this.order = order;
            this.children = new Map();
        }
        getItemEnclosingPosition(position) {
            return position ? this._getItemEnclosingPosition(position, this.children) : undefined;
        }
        _getItemEnclosingPosition(position, children) {
            for (const [, item] of children) {
                if (!item.symbol.range || !range_1.Range.containsPosition(item.symbol.range, position)) {
                    continue;
                }
                return this._getItemEnclosingPosition(position, item.children) || item;
            }
            return undefined;
        }
        updateMarker(marker) {
            for (const [, child] of this.children) {
                this._updateMarker(marker, child);
            }
        }
        _updateMarker(markers, item) {
            item.marker = undefined;
            // find the proper start index to check for item/marker overlap.
            const idx = (0, arrays_1.binarySearch)(markers, item.symbol.range, range_1.Range.compareRangesUsingStarts);
            let start;
            if (idx < 0) {
                start = ~idx;
                if (start > 0 && range_1.Range.areIntersecting(markers[start - 1], item.symbol.range)) {
                    start -= 1;
                }
            }
            else {
                start = idx;
            }
            const myMarkers = [];
            let myTopSev;
            for (; start < markers.length && range_1.Range.areIntersecting(item.symbol.range, markers[start]); start++) {
                // remove markers intersecting with this outline element
                // and store them in a 'private' array.
                const marker = markers[start];
                myMarkers.push(marker);
                markers[start] = undefined;
                if (!myTopSev || marker.severity > myTopSev) {
                    myTopSev = marker.severity;
                }
            }
            // Recurse into children and let them match markers that have matched
            // this outline element. This might remove markers from this element and
            // therefore we remember that we have had markers. That allows us to render
            // the dot, saying 'this element has children with markers'
            for (const [, child] of item.children) {
                this._updateMarker(myMarkers, child);
            }
            if (myTopSev) {
                item.marker = {
                    count: myMarkers.length,
                    topSev: myTopSev
                };
            }
            (0, arrays_1.coalesceInPlace)(markers);
        }
    }
    exports.OutlineGroup = OutlineGroup;
    class OutlineModel extends TreeElement {
        static create(registry, textModel, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const result = new OutlineModel(textModel.uri);
            const provider = registry.ordered(textModel);
            const promises = provider.map((provider, index) => {
                const id = TreeElement.findId(`provider_${index}`, result);
                const group = new OutlineGroup(id, result, provider.displayName ?? 'Unknown Outline Provider', index);
                return Promise.resolve(provider.provideDocumentSymbols(textModel, cts.token)).then(result => {
                    for (const info of result || []) {
                        OutlineModel._makeOutlineElement(info, group);
                    }
                    return group;
                }, err => {
                    (0, errors_1.onUnexpectedExternalError)(err);
                    return group;
                }).then(group => {
                    if (!TreeElement.empty(group)) {
                        result._groups.set(id, group);
                    }
                    else {
                        group.remove();
                    }
                });
            });
            const listener = registry.onDidChange(() => {
                const newProvider = registry.ordered(textModel);
                if (!(0, arrays_1.equals)(newProvider, provider)) {
                    cts.cancel();
                }
            });
            return Promise.all(promises).then(() => {
                if (cts.token.isCancellationRequested && !token.isCancellationRequested) {
                    return OutlineModel.create(registry, textModel, token);
                }
                else {
                    return result._compact();
                }
            }).finally(() => {
                cts.dispose();
                listener.dispose();
                cts.dispose();
            });
        }
        static _makeOutlineElement(info, container) {
            const id = TreeElement.findId(info, container);
            const res = new OutlineElement(id, container, info);
            if (info.children) {
                for (const childInfo of info.children) {
                    OutlineModel._makeOutlineElement(childInfo, res);
                }
            }
            container.children.set(res.id, res);
        }
        static get(element) {
            while (element) {
                if (element instanceof OutlineModel) {
                    return element;
                }
                element = element.parent;
            }
            return undefined;
        }
        constructor(uri) {
            super();
            this.uri = uri;
            this.id = 'root';
            this.parent = undefined;
            this._groups = new Map();
            this.children = new Map();
            this.id = 'root';
            this.parent = undefined;
        }
        _compact() {
            let count = 0;
            for (const [key, group] of this._groups) {
                if (group.children.size === 0) { // empty
                    this._groups.delete(key);
                }
                else {
                    count += 1;
                }
            }
            if (count !== 1) {
                //
                this.children = this._groups;
            }
            else {
                // adopt all elements of the first group
                const group = iterator_1.Iterable.first(this._groups.values());
                for (const [, child] of group.children) {
                    child.parent = this;
                    this.children.set(child.id, child);
                }
            }
            return this;
        }
        merge(other) {
            if (this.uri.toString() !== other.uri.toString()) {
                return false;
            }
            if (this._groups.size !== other._groups.size) {
                return false;
            }
            this._groups = other._groups;
            this.children = other.children;
            return true;
        }
        getItemEnclosingPosition(position, context) {
            let preferredGroup;
            if (context) {
                let candidate = context.parent;
                while (candidate && !preferredGroup) {
                    if (candidate instanceof OutlineGroup) {
                        preferredGroup = candidate;
                    }
                    candidate = candidate.parent;
                }
            }
            let result = undefined;
            for (const [, group] of this._groups) {
                result = group.getItemEnclosingPosition(position);
                if (result && (!preferredGroup || preferredGroup === group)) {
                    break;
                }
            }
            return result;
        }
        getItemById(id) {
            return TreeElement.getElementById(id, this);
        }
        updateMarker(marker) {
            // sort markers by start range so that we can use
            // outline element starts for quicker look up
            marker.sort(range_1.Range.compareRangesUsingStarts);
            for (const [, group] of this._groups) {
                group.updateMarker(marker.slice(0));
            }
        }
        getTopLevelSymbols() {
            const roots = [];
            for (const child of this.children.values()) {
                if (child instanceof OutlineElement) {
                    roots.push(child.symbol);
                }
                else {
                    roots.push(...iterator_1.Iterable.map(child.children.values(), child => child.symbol));
                }
            }
            return roots.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
        }
        asListOfDocumentSymbols() {
            const roots = this.getTopLevelSymbols();
            const bucket = [];
            OutlineModel._flattenDocumentSymbols(bucket, roots, '');
            return bucket.sort((a, b) => position_1.Position.compare(range_1.Range.getStartPosition(a.range), range_1.Range.getStartPosition(b.range)) || position_1.Position.compare(range_1.Range.getEndPosition(b.range), range_1.Range.getEndPosition(a.range)));
        }
        static _flattenDocumentSymbols(bucket, entries, overrideContainerLabel) {
            for (const entry of entries) {
                bucket.push({
                    kind: entry.kind,
                    tags: entry.tags,
                    name: entry.name,
                    detail: entry.detail,
                    containerName: entry.containerName || overrideContainerLabel,
                    range: entry.range,
                    selectionRange: entry.selectionRange,
                    children: undefined, // we flatten it...
                });
                // Recurse over children
                if (entry.children) {
                    OutlineModel._flattenDocumentSymbols(bucket, entry.children, entry.name);
                }
            }
        }
    }
    exports.OutlineModel = OutlineModel;
    exports.IOutlineModelService = (0, instantiation_1.createDecorator)('IOutlineModelService');
    let OutlineModelService = class OutlineModelService {
        constructor(_languageFeaturesService, debounces, modelService) {
            this._languageFeaturesService = _languageFeaturesService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._cache = new map_1.LRUCache(10, 0.7);
            this._debounceInformation = debounces.for(_languageFeaturesService.documentSymbolProvider, 'DocumentSymbols', { min: 350 });
            // don't cache outline models longer than their text model
            this._disposables.add(modelService.onModelRemoved(textModel => {
                this._cache.delete(textModel.id);
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        async getOrCreate(textModel, token) {
            const registry = this._languageFeaturesService.documentSymbolProvider;
            const provider = registry.ordered(textModel);
            let data = this._cache.get(textModel.id);
            if (!data || data.versionId !== textModel.getVersionId() || !(0, arrays_1.equals)(data.provider, provider)) {
                const source = new cancellation_1.CancellationTokenSource();
                data = {
                    versionId: textModel.getVersionId(),
                    provider,
                    promiseCnt: 0,
                    source,
                    promise: OutlineModel.create(registry, textModel, source.token),
                    model: undefined,
                };
                this._cache.set(textModel.id, data);
                const now = Date.now();
                data.promise.then(outlineModel => {
                    data.model = outlineModel;
                    this._debounceInformation.update(textModel, Date.now() - now);
                }).catch(_err => {
                    this._cache.delete(textModel.id);
                });
            }
            if (data.model) {
                // resolved -> return data
                return data.model;
            }
            // increase usage counter
            data.promiseCnt += 1;
            const listener = token.onCancellationRequested(() => {
                // last -> cancel provider request, remove cached promise
                if (--data.promiseCnt === 0) {
                    data.source.cancel();
                    this._cache.delete(textModel.id);
                }
            });
            try {
                return await data.promise;
            }
            finally {
                listener.dispose();
            }
        }
        getDebounceValue(textModel) {
            return this._debounceInformation.get(textModel);
        }
    };
    exports.OutlineModelService = OutlineModelService;
    exports.OutlineModelService = OutlineModelService = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(2, model_1.IModelService)
    ], OutlineModelService);
    (0, extensions_1.registerSingleton)(exports.IOutlineModelService, OutlineModelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZU1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kb2N1bWVudFN5bWJvbHMvYnJvd3Nlci9vdXRsaW5lTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFzQixXQUFXO1FBTWhDLE1BQU07WUFDTCxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWtDLEVBQUUsU0FBc0I7WUFDdkUsOERBQThEO1lBQzlELDREQUE0RDtZQUM1RCxJQUFJLFdBQW1CLENBQUM7WUFDeEIsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsV0FBVyxHQUFHLEdBQUcsU0FBUyxDQUFDLEVBQUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUM5QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsV0FBVyxHQUFHLEdBQUcsU0FBUyxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xELElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3ZELFdBQVcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLGVBQWUsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNySCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQztZQUNyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMs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