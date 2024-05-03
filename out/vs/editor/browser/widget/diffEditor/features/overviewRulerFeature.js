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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/scrollbar/scrollbarState", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/position", "vs/editor/common/viewModel/overviewZoneManager", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, fastDomNode_1, scrollbarState_1, lifecycle_1, observable_1, utils_1, position_1, overviewZoneManager_1, colorRegistry_1, themeService_1) {
    "use strict";
    var OverviewRulerFeature_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRulerFeature = void 0;
    let OverviewRulerFeature = class OverviewRulerFeature extends lifecycle_1.Disposable {
        static { OverviewRulerFeature_1 = this; }
        static { this.ONE_OVERVIEW_WIDTH = 15; }
        static { this.ENTIRE_DIFF_OVERVIEW_WIDTH = OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH * 2; }
        constructor(_editors, _rootElement, _diffModel, _rootWidth, _rootHeight, _modifiedEditorLayoutInfo, _themeService) {
            super();
            this._editors = _editors;
            this._rootElement = _rootElement;
            this._diffModel = _diffModel;
            this._rootWidth = _rootWidth;
            this._rootHeight = _rootHeight;
            this._modifiedEditorLayoutInfo = _modifiedEditorLayoutInfo;
            this._themeService = _themeService;
            this.width = OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH;
            const currentColorTheme = (0, observable_1.observableFromEvent)(this._themeService.onDidColorThemeChange, () => this._themeService.getColorTheme());
            const currentColors = (0, observable_1.derived)(reader => {
                /** @description colors */
                const theme = currentColorTheme.read(reader);
                const insertColor = theme.getColor(colorRegistry_1.diffOverviewRulerInserted) || (theme.getColor(colorRegistry_1.diffInserted) || colorRegistry_1.defaultInsertColor).transparent(2);
                const removeColor = theme.getColor(colorRegistry_1.diffOverviewRulerRemoved) || (theme.getColor(colorRegistry_1.diffRemoved) || colorRegistry_1.defaultRemoveColor).transparent(2);
                return { insertColor, removeColor };
            });
            const viewportDomElement = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewportDomElement.setClassName('diffViewport');
            viewportDomElement.setPosition('absolute');
            const diffOverviewRoot = (0, dom_1.h)('div.diffOverview', {
                style: { position: 'absolute', top: '0px', width: OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px' }
            }).root;
            this._register((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, viewportDomElement.domNode));
            this._register((0, dom_1.addStandardDisposableListener)(diffOverviewRoot, dom_1.EventType.POINTER_DOWN, (e) => {
                this._editors.modified.delegateVerticalScrollbarPointerDown(e);
            }));
            this._register((0, dom_1.addDisposableListener)(diffOverviewRoot, dom_1.EventType.MOUSE_WHEEL, (e) => {
                this._editors.modified.delegateScrollFromMouseWheelEvent(e);
            }, { passive: false }));
            this._register((0, utils_1.appendRemoveOnDispose)(this._rootElement, diffOverviewRoot));
            this._register((0, observable_1.autorunWithStore)((reader, store) => {
                /** @description recreate overview rules when model changes */
                const m = this._diffModel.read(reader);
                const originalOverviewRuler = this._editors.original.createOverviewRuler('original diffOverviewRuler');
                if (originalOverviewRuler) {
                    store.add(originalOverviewRuler);
                    store.add((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, originalOverviewRuler.getDomNode()));
                }
                const modifiedOverviewRuler = this._editors.modified.createOverviewRuler('modified diffOverviewRuler');
                if (modifiedOverviewRuler) {
                    store.add(modifiedOverviewRuler);
                    store.add((0, utils_1.appendRemoveOnDispose)(diffOverviewRoot, modifiedOverviewRuler.getDomNode()));
                }
                if (!originalOverviewRuler || !modifiedOverviewRuler) {
                    // probably no model
                    return;
                }
                const origViewZonesChanged = (0, observable_1.observableSignalFromEvent)('viewZoneChanged', this._editors.original.onDidChangeViewZones);
                const modViewZonesChanged = (0, observable_1.observableSignalFromEvent)('viewZoneChanged', this._editors.modified.onDidChangeViewZones);
                const origHiddenRangesChanged = (0, observable_1.observableSignalFromEvent)('hiddenRangesChanged', this._editors.original.onDidChangeHiddenAreas);
                const modHiddenRangesChanged = (0, observable_1.observableSignalFromEvent)('hiddenRangesChanged', this._editors.modified.onDidChangeHiddenAreas);
                store.add((0, observable_1.autorun)(reader => {
                    /** @description set overview ruler zones */
                    origViewZonesChanged.read(reader);
                    modViewZonesChanged.read(reader);
                    origHiddenRangesChanged.read(reader);
                    modHiddenRangesChanged.read(reader);
                    const colors = currentColors.read(reader);
                    const diff = m?.diff.read(reader)?.mappings;
                    function createZones(ranges, color, editor) {
                        const vm = editor._getViewModel();
                        if (!vm) {
                            return [];
                        }
                        return ranges
                            .filter(d => d.length > 0)
                            .map(r => {
                            const start = vm.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(r.startLineNumber, 1));
                            const end = vm.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(r.endLineNumberExclusive, 1));
                            // By computing the lineCount, we won't ask the view model later for the bottom vertical position.
                            // (The view model will take into account the alignment viewzones, which will give
                            // modifications and deletetions always the same height.)
                            const lineCount = end.lineNumber - start.lineNumber;
                            return new overviewZoneManager_1.OverviewRulerZone(start.lineNumber, end.lineNumber, lineCount, color.toString());
                        });
                    }
                    const originalZones = createZones((diff || []).map(d => d.lineRangeMapping.original), colors.removeColor, this._editors.original);
                    const modifiedZones = createZones((diff || []).map(d => d.lineRangeMapping.modified), colors.insertColor, this._editors.modified);
                    originalOverviewRuler?.setZones(originalZones);
                    modifiedOverviewRuler?.setZones(modifiedZones);
                }));
                store.add((0, observable_1.autorun)(reader => {
                    /** @description layout overview ruler */
                    const height = this._rootHeight.read(reader);
                    const width = this._rootWidth.read(reader);
                    const layoutInfo = this._modifiedEditorLayoutInfo.read(reader);
                    if (layoutInfo) {
                        const freeSpace = OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH - 2 * OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH;
                        originalOverviewRuler.setLayout({
                            top: 0,
                            height: height,
                            right: freeSpace + OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                            width: OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                        });
                        modifiedOverviewRuler.setLayout({
                            top: 0,
                            height: height,
                            right: 0,
                            width: OverviewRulerFeature_1.ONE_OVERVIEW_WIDTH,
                        });
                        const scrollTop = this._editors.modifiedScrollTop.read(reader);
                        const scrollHeight = this._editors.modifiedScrollHeight.read(reader);
                        const scrollBarOptions = this._editors.modified.getOption(103 /* EditorOption.scrollbar */);
                        const state = new scrollbarState_1.ScrollbarState(scrollBarOptions.verticalHasArrows ? scrollBarOptions.arrowSize : 0, scrollBarOptions.verticalScrollbarSize, 0, layoutInfo.height, scrollHeight, scrollTop);
                        viewportDomElement.setTop(state.getSliderPosition());
                        viewportDomElement.setHeight(state.getSliderSize());
                    }
                    else {
                        viewportDomElement.setTop(0);
                        viewportDomElement.setHeight(0);
                    }
                    diffOverviewRoot.style.height = height + 'px';
                    diffOverviewRoot.style.left = (width - OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH) + 'px';
                    viewportDomElement.setWidth(OverviewRulerFeature_1.ENTIRE_DIFF_OVERVIEW_WIDTH);
                }));
            }));
        }
    };
    exports.OverviewRulerFeature = OverviewRulerFeature;
    exports.OverviewRulerFeature = OverviewRulerFeature = OverviewRulerFeature_1 = __decorate([
        __param(6, themeService_1.IThemeService)
    ], OverviewRulerFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdSdWxlckZlYXR1cmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2ZlYXR1cmVzL292ZXJ2aWV3UnVsZXJGZWF0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7O2lCQUMzQix1QkFBa0IsR0FBRyxFQUFFLEFBQUwsQ0FBTTtpQkFDekIsK0JBQTBCLEdBQUcsc0JBQW9CLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxBQUE5QyxDQUErQztRQUdoRyxZQUNrQixRQUEyQixFQUMzQixZQUF5QixFQUN6QixVQUF3RCxFQUN4RCxVQUErQixFQUMvQixXQUFnQyxFQUNoQyx5QkFBK0QsRUFDakUsYUFBNkM7WUFFNUQsS0FBSyxFQUFFLENBQUM7WUFSUyxhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUMzQixpQkFBWSxHQUFaLFlBQVksQ0FBYTtZQUN6QixlQUFVLEdBQVYsVUFBVSxDQUE4QztZQUN4RCxlQUFVLEdBQVYsVUFBVSxDQUFxQjtZQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7WUFDaEMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFzQztZQUNoRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQVQ3QyxVQUFLLEdBQUcsc0JBQW9CLENBQUMsMEJBQTBCLENBQUM7WUFhdkUsTUFBTSxpQkFBaUIsR0FBRyxJQUFBLGdDQUFtQixFQUFDLElBQUksQ0FBQyxhQUFhLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBRWxJLE1BQU0sYUFBYSxHQUFHLElBQUEsb0JBQU8s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