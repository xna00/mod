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
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/services/model", "vs/editor/common/core/range", "vs/base/common/network", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/base/common/map", "vs/base/common/collections"], function (require, exports, markers_1, lifecycle_1, model_1, themeService_1, editorColorRegistry_1, model_2, range_1, network_1, event_1, colorRegistry_1, map_1, collections_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerDecorationsService = void 0;
    let MarkerDecorationsService = class MarkerDecorationsService extends lifecycle_1.Disposable {
        constructor(modelService, _markerService) {
            super();
            this._markerService = _markerService;
            this._onDidChangeMarker = this._register(new event_1.Emitter());
            this.onDidChangeMarker = this._onDidChangeMarker.event;
            this._markerDecorations = new map_1.ResourceMap();
            modelService.getModels().forEach(model => this._onModelAdded(model));
            this._register(modelService.onModelAdded(this._onModelAdded, this));
            this._register(modelService.onModelRemoved(this._onModelRemoved, this));
            this._register(this._markerService.onMarkerChanged(this._handleMarkerChange, this));
        }
        dispose() {
            super.dispose();
            this._markerDecorations.forEach(value => value.dispose());
            this._markerDecorations.clear();
        }
        getMarker(uri, decoration) {
            const markerDecorations = this._markerDecorations.get(uri);
            return markerDecorations ? (markerDecorations.getMarker(decoration) || null) : null;
        }
        getLiveMarkers(uri) {
            const markerDecorations = this._markerDecorations.get(uri);
            return markerDecorations ? markerDecorations.getMarkers() : [];
        }
        _handleMarkerChange(changedResources) {
            changedResources.forEach((resource) => {
                const markerDecorations = this._markerDecorations.get(resource);
                if (markerDecorations) {
                    this._updateDecorations(markerDecorations);
                }
            });
        }
        _onModelAdded(model) {
            const markerDecorations = new MarkerDecorations(model);
            this._markerDecorations.set(model.uri, markerDecorations);
            this._updateDecorations(markerDecorations);
        }
        _onModelRemoved(model) {
            const markerDecorations = this._markerDecorations.get(model.uri);
            if (markerDecorations) {
                markerDecorations.dispose();
                this._markerDecorations.delete(model.uri);
            }
            // clean up markers for internal, transient models
            if (model.uri.scheme === network_1.Schemas.inMemory
                || model.uri.scheme === network_1.Schemas.internal
                || model.uri.scheme === network_1.Schemas.vscode) {
                this._markerService?.read({ resource: model.uri }).map(marker => marker.owner).forEach(owner => this._markerService.remove(owner, [model.uri]));
            }
        }
        _updateDecorations(markerDecorations) {
            // Limit to the first 500 errors/warnings
            const markers = this._markerService.read({ resource: markerDecorations.model.uri, take: 500 });
            if (markerDecorations.update(markers)) {
                this._onDidChangeMarker.fire(markerDecorations.model);
            }
        }
    };
    exports.MarkerDecorationsService = MarkerDecorationsService;
    exports.MarkerDecorationsService = MarkerDecorationsService = __decorate([
        __param(0, model_2.IModelService),
        __param(1, markers_1.IMarkerService)
    ], MarkerDecorationsService);
    class MarkerDecorations extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._map = new map_1.BidirectionalMap();
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.model.deltaDecorations([...this._map.values()], []);
                this._map.clear();
            }));
        }
        update(markers) {
            // We use the fact that marker instances are not recreated when different owners
            // update. So we can compare references to find out what changed since the last update.
            const { added, removed } = (0, collections_1.diffSets)(new Set(this._map.keys()), new Set(markers));
            if (added.length === 0 && removed.length === 0) {
                return false;
            }
            const oldIds = removed.map(marker => this._map.get(marker));
            const newDecorations = added.map(marker => {
                return {
                    range: this._createDecorationRange(this.model, marker),
                    options: this._createDecorationOption(marker)
                };
            });
            const ids = this.model.deltaDecorations(oldIds, newDecorations);
            for (const removedMarker of removed) {
                this._map.delete(removedMarker);
            }
            for (let index = 0; index < ids.length; index++) {
                this._map.set(added[index], ids[index]);
            }
            return true;
        }
        getMarker(decoration) {
            return this._map.getKey(decoration.id);
        }
        getMarkers() {
            const res = [];
            this._map.forEach((id, marker) => {
                const range = this.model.getDecorationRange(id);
                if (range) {
                    res.push([range, marker]);
                }
            });
            return res;
        }
        _createDecorationRange(model, rawMarker) {
            let ret = range_1.Range.lift(rawMarker);
            if (rawMarker.severity === markers_1.MarkerSeverity.Hint && !this._hasMarkerTag(rawMarker, 1 /* MarkerTag.Unnecessary */) && !this._hasMarkerTag(rawMarker, 2 /* MarkerTag.Deprecated */)) {
                // * never render hints on multiple lines
                // * make enough space for three dots
                ret = ret.setEndPosition(ret.startLineNumber, ret.startColumn + 2);
            }
            ret = model.validateRange(ret);
            if (ret.isEmpty()) {
                const maxColumn = model.getLineLastNonWhitespaceColumn(ret.startLineNumber) ||
                    model.getLineMaxColumn(ret.startLineNumber);
                if (maxColumn === 1 || ret.endColumn >= maxColumn) {
                    // empty line or behind eol
                    // keep the range as is, it will be rendered 1ch wide
                    return ret;
                }
                const word = model.getWordAtPosition(ret.getStartPosition());
                if (word) {
                    ret = new range_1.Range(ret.startLineNumber, word.startColumn, ret.endLineNumber, word.endColumn);
                }
            }
            else if (rawMarker.endColumn === Number.MAX_VALUE && rawMarker.startColumn === 1 && ret.startLineNumber === ret.endLineNumber) {
                const minColumn = model.getLineFirstNonWhitespaceColumn(rawMarker.startLineNumber);
                if (minColumn < ret.endColumn) {
                    ret = new range_1.Range(ret.startLineNumber, minColumn, ret.endLineNumber, ret.endColumn);
                    rawMarker.startColumn = minColumn;
                }
            }
            return ret;
        }
        _createDecorationOption(marker) {
            let className;
            let color = undefined;
            let zIndex;
            let inlineClassName = undefined;
            let minimap;
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Hint:
                    if (this._hasMarkerTag(marker, 2 /* MarkerTag.Deprecated */)) {
                        className = undefined;
                    }
                    else if (this._hasMarkerTag(marker, 1 /* MarkerTag.Unnecessary */)) {
                        className = "squiggly-unnecessary" /* ClassName.EditorUnnecessaryDecoration */;
                    }
                    else {
                        className = "squiggly-hint" /* ClassName.EditorHintDecoration */;
                    }
                    zIndex = 0;
                    break;
                case markers_1.MarkerSeverity.Info:
                    className = "squiggly-info" /* ClassName.EditorInfoDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerInfo);
                    zIndex = 10;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapInfo),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
                case markers_1.MarkerSeverity.Warning:
                    className = "squiggly-warning" /* ClassName.EditorWarningDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerWarning);
                    zIndex = 20;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapWarning),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
                case markers_1.MarkerSeverity.Error:
                default:
                    className = "squiggly-error" /* ClassName.EditorErrorDecoration */;
                    color = (0, themeService_1.themeColorFromId)(editorColorRegistry_1.overviewRulerError);
                    zIndex = 30;
                    minimap = {
                        color: (0, themeService_1.themeColorFromId)(colorRegistry_1.minimapError),
                        position: 1 /* MinimapPosition.Inline */
                    };
                    break;
            }
            if (marker.tags) {
                if (marker.tags.indexOf(1 /* MarkerTag.Unnecessary */) !== -1) {
                    inlineClassName = "squiggly-inline-unnecessary" /* ClassName.EditorUnnecessaryInlineDecoration */;
                }
                if (marker.tags.indexOf(2 /* MarkerTag.Deprecated */) !== -1) {
                    inlineClassName = "squiggly-inline-deprecated" /* ClassName.EditorDeprecatedInlineDecoration */;
                }
            }
            return {
                description: 'marker-decoration',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                className,
                showIfCollapsed: true,
                overviewRuler: {
                    color,
                    position: model_1.OverviewRulerLane.Right
                },
                minimap,
                zIndex,
                inlineClassName,
            };
        }
        _hasMarkerTag(marker, tag) {
            if (marker.tags) {
                return marker.tags.indexOf(tag) >= 0;
            }
            return false;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyRGVjb3JhdGlvbnNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL21hcmtlckRlY29yYXRpb25zU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFTdkQsWUFDZ0IsWUFBMkIsRUFDMUIsY0FBK0M7WUFFL0QsS0FBSyxFQUFFLENBQUM7WUFGeUIsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBUC9DLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQ3ZFLHNCQUFpQixHQUFzQixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBRTdELHVCQUFrQixHQUFHLElBQUksaUJBQVcsRUFBcUIsQ0FBQztZQU8xRSxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENB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