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
define(["require", "exports", "vs/workbench/common/contributions", "vs/editor/contrib/gotoError/browser/markerNavigationService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/markers/common/markers", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/base/common/decorators", "vs/platform/theme/common/colorRegistry", "vs/base/common/resources"], function (require, exports, contributions_1, markerNavigationService_1, notebookCommon_1, markers_1, configuration_1, lifecycle_1, notebookBrowser_1, notebookEditorExtensions_1, decorators_1, colorRegistry_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MarkerListProvider = class MarkerListProvider {
        static { this.ID = 'workbench.contrib.markerListProvider'; }
        constructor(_markerService, markerNavigation, _configService) {
            this._markerService = _markerService;
            this._configService = _configService;
            this._dispoables = markerNavigation.registerProvider(this);
        }
        dispose() {
            this._dispoables.dispose();
        }
        getMarkerList(resource) {
            if (!resource) {
                return undefined;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            if (!data) {
                return undefined;
            }
            return new markerNavigationService_1.MarkerList(uri => {
                const otherData = notebookCommon_1.CellUri.parse(uri);
                return otherData?.notebook.toString() === data.notebook.toString();
            }, this._markerService, this._configService);
        }
    };
    MarkerListProvider = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, markerNavigationService_1.IMarkerNavigationService),
        __param(2, configuration_1.IConfigurationService)
    ], MarkerListProvider);
    let NotebookMarkerDecorationContribution = class NotebookMarkerDecorationContribution extends lifecycle_1.Disposable {
        static { this.id = 'workbench.notebook.markerDecoration'; }
        constructor(_notebookEditor, _markerService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._markerService = _markerService;
            this._markersOverviewRulerDecorations = [];
            this._update();
            this._register(this._notebookEditor.onDidChangeModel(() => this._update()));
            this._register(this._markerService.onMarkerChanged(e => {
                if (e.some(uri => this._notebookEditor.getCellsInRange().some(cell => (0, resources_1.isEqual)(cell.uri, uri)))) {
                    this._update();
                }
            }));
        }
        _update() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const cellDecorations = [];
            this._notebookEditor.getCellsInRange().forEach(cell => {
                const marker = this._markerService.read({ resource: cell.uri, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning });
                marker.forEach(m => {
                    const color = m.severity === markers_1.MarkerSeverity.Error ? colorRegistry_1.editorErrorForeground : colorRegistry_1.editorWarningForeground;
                    const range = { startLineNumber: m.startLineNumber, startColumn: m.startColumn, endLineNumber: m.endLineNumber, endColumn: m.endColumn };
                    cellDecorations.push({
                        handle: cell.handle,
                        options: {
                            overviewRuler: {
                                color: color,
                                modelRanges: [range],
                                includeOutput: false,
                                position: notebookBrowser_1.NotebookOverviewRulerLane.Right
                            }
                        }
                    });
                });
            });
            this._markersOverviewRulerDecorations = this._notebookEditor.deltaCellDecorations(this._markersOverviewRulerDecorations, cellDecorations);
        }
    };
    __decorate([
        (0, decorators_1.throttle)(100)
    ], NotebookMarkerDecorationContribution.prototype, "_update", null);
    NotebookMarkerDecorationContribution = __decorate([
        __param(1, markers_1.IMarkerService)
    ], NotebookMarkerDecorationContribution);
    (0, contributions_1.registerWorkbenchContribution2)(MarkerListProvider.ID, MarkerListProvider, 2 /* WorkbenchPhase.BlockRestore */);
    (0, notebookEditorExtensions_1.registerNotebookContribution)(NotebookMarkerDecorationContribution.id, NotebookMarkerDecorationContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9tYXJrZXIvbWFya2VyUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFlaEcsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7aUJBRVAsT0FBRSxHQUFHLHNDQUFzQyxBQUF6QyxDQUEwQztRQUk1RCxZQUNrQyxjQUE4QixFQUNyQyxnQkFBMEMsRUFDNUIsY0FBcUM7WUFGNUMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBRXZCLG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQUU3RSxJQUFJLENBQUMsV0FBVyxHQUFHLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsYUFBYSxDQUFDLFFBQXlCO1lBQ3RDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxJQUFJLEdBQUcsd0JBQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLElBQUksb0NBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDM0IsTUFBTSxTQUFTLEdBQUcsd0JBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sU0FBUyxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsS0FB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