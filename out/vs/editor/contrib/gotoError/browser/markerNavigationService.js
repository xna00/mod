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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/common/core/range", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/configuration/common/configuration"], function (require, exports, arrays_1, event_1, lifecycle_1, linkedList_1, strings_1, uri_1, range_1, extensions_1, instantiation_1, markers_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMarkerNavigationService = exports.MarkerList = exports.MarkerCoordinate = void 0;
    class MarkerCoordinate {
        constructor(marker, index, total) {
            this.marker = marker;
            this.index = index;
            this.total = total;
        }
    }
    exports.MarkerCoordinate = MarkerCoordinate;
    let MarkerList = class MarkerList {
        constructor(resourceFilter, _markerService, _configService) {
            this._markerService = _markerService;
            this._configService = _configService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._markers = [];
            this._nextIdx = -1;
            if (uri_1.URI.isUri(resourceFilter)) {
                this._resourceFilter = uri => uri.toString() === resourceFilter.toString();
            }
            else if (resourceFilter) {
                this._resourceFilter = resourceFilter;
            }
            const compareOrder = this._configService.getValue('problems.sortOrder');
            const compareMarker = (a, b) => {
                let res = (0, strings_1.compare)(a.resource.toString(), b.resource.toString());
                if (res === 0) {
                    if (compareOrder === 'position') {
                        res = range_1.Range.compareRangesUsingStarts(a, b) || markers_1.MarkerSeverity.compare(a.severity, b.severity);
                    }
                    else {
                        res = markers_1.MarkerSeverity.compare(a.severity, b.severity) || range_1.Range.compareRangesUsingStarts(a, b);
                    }
                }
                return res;
            };
            const updateMarker = () => {
                this._markers = this._markerService.read({
                    resource: uri_1.URI.isUri(resourceFilter) ? resourceFilter : undefined,
                    severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
                });
                if (typeof resourceFilter === 'function') {
                    this._markers = this._markers.filter(m => this._resourceFilter(m.resource));
                }
                this._markers.sort(compareMarker);
            };
            updateMarker();
            this._dispoables.add(_markerService.onMarkerChanged(uris => {
                if (!this._resourceFilter || uris.some(uri => this._resourceFilter(uri))) {
                    updateMarker();
                    this._nextIdx = -1;
                    this._onDidChange.fire();
                }
            }));
        }
        dispose() {
            this._dispoables.dispose();
            this._onDidChange.dispose();
        }
        matches(uri) {
            if (!this._resourceFilter && !uri) {
                return true;
            }
            if (!this._resourceFilter || !uri) {
                return false;
            }
            return this._resourceFilter(uri);
        }
        get selected() {
            const marker = this._markers[this._nextIdx];
            return marker && new MarkerCoordinate(marker, this._nextIdx + 1, this._markers.length);
        }
        _initIdx(model, position, fwd) {
            let found = false;
            let idx = this._markers.findIndex(marker => marker.resource.toString() === model.uri.toString());
            if (idx < 0) {
                idx = (0, arrays_1.binarySearch)(this._markers, { resource: model.uri }, (a, b) => (0, strings_1.compare)(a.resource.toString(), b.resource.toString()));
                if (idx < 0) {
                    idx = ~idx;
                }
            }
            for (let i = idx; i < this._markers.length; i++) {
                let range = range_1.Range.lift(this._markers[i]);
                if (range.isEmpty()) {
                    const word = model.getWordAtPosition(range.getStartPosition());
                    if (word) {
                        range = new range_1.Range(range.startLineNumber, word.startColumn, range.startLineNumber, word.endColumn);
                    }
                }
                if (position && (range.containsPosition(position) || position.isBeforeOrEqual(range.getStartPosition()))) {
                    this._nextIdx = i;
                    found = true;
                    break;
                }
                if (this._markers[i].resource.toString() !== model.uri.toString()) {
                    break;
                }
            }
            if (!found) {
                // after the last change
                this._nextIdx = fwd ? 0 : this._markers.length - 1;
            }
            if (this._nextIdx < 0) {
                this._nextIdx = this._markers.length - 1;
            }
        }
        resetIndex() {
            this._nextIdx = -1;
        }
        move(fwd, model, position) {
            if (this._markers.length === 0) {
                return false;
            }
            const oldIdx = this._nextIdx;
            if (this._nextIdx === -1) {
                this._initIdx(model, position, fwd);
            }
            else if (fwd) {
                this._nextIdx = (this._nextIdx + 1) % this._markers.length;
            }
            else if (!fwd) {
                this._nextIdx = (this._nextIdx - 1 + this._markers.length) % this._markers.length;
            }
            if (oldIdx !== this._nextIdx) {
                return true;
            }
            return false;
        }
        find(uri, position) {
            let idx = this._markers.findIndex(marker => marker.resource.toString() === uri.toString());
            if (idx < 0) {
                return undefined;
            }
            for (; idx < this._markers.length; idx++) {
                if (range_1.Range.containsPosition(this._markers[idx], position)) {
                    return new MarkerCoordinate(this._markers[idx], idx + 1, this._markers.length);
                }
            }
            return undefined;
        }
    };
    exports.MarkerList = MarkerList;
    exports.MarkerList = MarkerList = __decorate([
        __param(1, markers_1.IMarkerService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkerList);
    exports.IMarkerNavigationService = (0, instantiation_1.createDecorator)('IMarkerNavigationService');
    let MarkerNavigationService = class MarkerNavigationService {
        constructor(_markerService, _configService) {
            this._markerService = _markerService;
            this._configService = _configService;
            this._provider = new linkedList_1.LinkedList();
        }
        registerProvider(provider) {
            const remove = this._provider.unshift(provider);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        getMarkerList(resource) {
            for (const provider of this._provider) {
                const result = provider.getMarkerList(resource);
                if (result) {
                    return result;
                }
            }
            // default
            return new MarkerList(resource, this._markerService, this._configService);
        }
    };
    MarkerNavigationService = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, configuration_1.IConfigurationService)
    ], MarkerNavigationService);
    (0, extensions_1.registerSingleton)(exports.IMarkerNavigationService, MarkerNavigationService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyTmF2aWdhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2dvdG9FcnJvci9icm93c2VyL21hcmtlck5hdmlnYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCaEcsTUFBYSxnQkFBZ0I7UUFDNUIsWUFDVSxNQUFlLEVBQ2YsS0FBYSxFQUNiLEtBQWE7WUFGYixXQUFNLEdBQU4sTUFBTSxDQUFTO1lBQ2YsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFVBQUssR0FBTCxLQUFLLENBQVE7UUFDbkIsQ0FBQztLQUNMO0lBTkQsNENBTUM7SUFFTSxJQUFNLFVBQVUsR0FBaEIsTUFBTSxVQUFVO1FBV3RCLFlBQ0MsY0FBeUQsRUFDekMsY0FBK0MsRUFDeEMsY0FBc0Q7WUFENUMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQ3ZCLG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQVo3RCxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDM0MsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFHM0MsZ0JBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUU3QyxhQUFRLEdBQWMsRUFBRSxDQUFDO1lBQ3pCLGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQztZQU83QixJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDNUUsQ0FBQztpQkFBTSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dC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