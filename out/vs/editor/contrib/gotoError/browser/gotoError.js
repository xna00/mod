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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/contrib/gotoError/browser/markerNavigationService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "./gotoErrorWidget"], function (require, exports, codicons_1, lifecycle_1, editorExtensions_1, codeEditorService_1, position_1, range_1, editorContextKeys_1, markerNavigationService_1, nls, actions_1, contextkey_1, instantiation_1, iconRegistry_1, gotoErrorWidget_1) {
    "use strict";
    var MarkerController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NextMarkerAction = exports.MarkerController = void 0;
    let MarkerController = class MarkerController {
        static { MarkerController_1 = this; }
        static { this.ID = 'editor.contrib.markerController'; }
        static get(editor) {
            return editor.getContribution(MarkerController_1.ID);
        }
        constructor(editor, _markerNavigationService, _contextKeyService, _editorService, _instantiationService) {
            this._markerNavigationService = _markerNavigationService;
            this._contextKeyService = _contextKeyService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._sessionDispoables = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._widgetVisible = CONTEXT_MARKERS_NAVIGATION_VISIBLE.bindTo(this._contextKeyService);
        }
        dispose() {
            this._cleanUp();
            this._sessionDispoables.dispose();
        }
        _cleanUp() {
            this._widgetVisible.reset();
            this._sessionDispoables.clear();
            this._widget = undefined;
            this._model = undefined;
        }
        _getOrCreateModel(uri) {
            if (this._model && this._model.matches(uri)) {
                return this._model;
            }
            let reusePosition = false;
            if (this._model) {
                reusePosition = true;
                this._cleanUp();
            }
            this._model = this._markerNavigationService.getMarkerList(uri);
            if (reusePosition) {
                this._model.move(true, this._editor.getModel(), this._editor.getPosition());
            }
            this._widget = this._instantiationService.createInstance(gotoErrorWidget_1.MarkerNavigationWidget, this._editor);
            this._widget.onDidClose(() => this.close(), this, this._sessionDispoables);
            this._widgetVisible.set(true);
            this._sessionDispoables.add(this._model);
            this._sessionDispoables.add(this._widget);
            // follow cursor
            this._sessionDispoables.add(this._editor.onDidChangeCursorPosition(e => {
                if (!this._model?.selected || !range_1.Range.containsPosition(this._model?.selected.marker, e.position)) {
                    this._model?.resetIndex();
                }
            }));
            // update markers
            this._sessionDispoables.add(this._model.onDidChange(() => {
                if (!this._widget || !this._widget.position || !this._model) {
                    return;
                }
                const info = this._model.find(this._editor.getModel().uri, this._widget.position);
                if (info) {
                    this._widget.updateMarker(info.marker);
                }
                else {
                    this._widget.showStale();
                }
            }));
            // open related
            this._sessionDispoables.add(this._widget.onDidSelectRelatedInformation(related => {
                this._editorService.openCodeEditor({
                    resource: related.resource,
                    options: { pinned: true, revealIfOpened: true, selection: range_1.Range.lift(related).collapseToStart() }
                }, this._editor);
                this.close(false);
            }));
            this._sessionDispoables.add(this._editor.onDidChangeModel(() => this._cleanUp()));
            return this._model;
        }
        close(focusEditor = true) {
            this._cleanUp();
            if (focusEditor) {
                this._editor.focus();
            }
        }
        showAtMarker(marker) {
            if (this._editor.hasModel()) {
                const model = this._getOrCreateModel(this._editor.getModel().uri);
                model.resetIndex();
                model.move(true, this._editor.getModel(), new position_1.Position(marker.startLineNumber, marker.startColumn));
                if (model.selected) {
                    this._widget.showAtMarker(model.selected.marker, model.selected.index, model.selected.total);
                }
            }
        }
        async nagivate(next, multiFile) {
            if (this._editor.hasModel()) {
                const model = this._getOrCreateModel(multiFile ? undefined : this._editor.getModel().uri);
                model.move(next, this._editor.getModel(), this._editor.getPosition());
                if (!model.selected) {
                    return;
                }
                if (model.selected.marker.resource.toString() !== this._editor.getModel().uri.toString()) {
                    // show in different editor
                    this._cleanUp();
                    const otherEditor = await this._editorService.openCodeEditor({
                        resource: model.selected.marker.resource,
                        options: { pinned: false, revealIfOpened: true, selectionRevealType: 2 /* TextEditorSelectionRevealType.NearTop */, selection: model.selected.marker }
                    }, this._editor);
                    if (otherEditor) {
                        MarkerController_1.get(otherEditor)?.close();
                        MarkerController_1.get(otherEditor)?.nagivate(next, multiFile);
                    }
                }
                else {
                    // show in this editor
                    this._widget.showAtMarker(model.selected.marker, model.selected.index, model.selected.total);
                }
            }
        }
    };
    exports.MarkerController = MarkerController;
    exports.MarkerController = MarkerController = MarkerController_1 = __decorate([
        __param(1, markerNavigationService_1.IMarkerNavigationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], MarkerController);
    class MarkerNavigationAction extends editorExtensions_1.EditorAction {
        constructor(_next, _multiFile, opts) {
            super(opts);
            this._next = _next;
            this._multiFile = _multiFile;
        }
        async run(_accessor, editor) {
            if (editor.hasModel()) {
                MarkerController.get(editor)?.nagivate(this._next, this._multiFile);
            }
        }
    }
    class NextMarkerAction extends MarkerNavigationAction {
        static { this.ID = 'editor.action.marker.next'; }
        static { this.LABEL = nls.localize('markerAction.next.label', "Go to Next Problem (Error, Warning, Info)"); }
        constructor() {
            super(true, false, {
                id: NextMarkerAction.ID,
                label: NextMarkerAction.LABEL,
                alias: 'Go to Next Problem (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: gotoErrorWidget_1.MarkerNavigationWidget.TitleMenu,
                    title: NextMarkerAction.LABEL,
                    icon: (0, iconRegistry_1.registerIcon)('marker-navigation-next', codicons_1.Codicon.arrowDown, nls.localize('nextMarkerIcon', 'Icon for goto next marker.')),
                    group: 'navigation',
                    order: 1
                }
            });
        }
    }
    exports.NextMarkerAction = NextMarkerAction;
    class PrevMarkerAction extends MarkerNavigationAction {
        static { this.ID = 'editor.action.marker.prev'; }
        static { this.LABEL = nls.localize('markerAction.previous.label', "Go to Previous Problem (Error, Warning, Info)"); }
        constructor() {
            super(false, false, {
                id: PrevMarkerAction.ID,
                label: PrevMarkerAction.LABEL,
                alias: 'Go to Previous Problem (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: gotoErrorWidget_1.MarkerNavigationWidget.TitleMenu,
                    title: PrevMarkerAction.LABEL,
                    icon: (0, iconRegistry_1.registerIcon)('marker-navigation-previous', codicons_1.Codicon.arrowUp, nls.localize('previousMarkerIcon', 'Icon for goto previous marker.')),
                    group: 'navigation',
                    order: 2
                }
            });
        }
    }
    class NextMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(true, true, {
                id: 'editor.action.marker.nextInFiles',
                label: nls.localize('markerAction.nextInFiles.label', "Go to Next Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Next Problem in Files (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarGoMenu,
                    title: nls.localize({ key: 'miGotoNextProblem', comment: ['&& denotes a mnemonic'] }, "Next &&Problem"),
                    group: '6_problem_nav',
                    order: 1
                }
            });
        }
    }
    class PrevMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(false, true, {
                id: 'editor.action.marker.prevInFiles',
                label: nls.localize('markerAction.previousInFiles.label', "Go to Previous Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Previous Problem in Files (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* KeyMod.Shift */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarGoMenu,
                    title: nls.localize({ key: 'miGotoPreviousProblem', comment: ['&& denotes a mnemonic'] }, "Previous &&Problem"),
                    group: '6_problem_nav',
                    order: 2
                }
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(MarkerController.ID, MarkerController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(NextMarkerAction);
    (0, editorExtensions_1.registerEditorAction)(PrevMarkerAction);
    (0, editorExtensions_1.registerEditorAction)(NextMarkerInFilesAction);
    (0, editorExtensions_1.registerEditorAction)(PrevMarkerInFilesAction);
    const CONTEXT_MARKERS_NAVIGATION_VISIBLE = new contextkey_1.RawContextKey('markersNavigationVisible', false);
    const MarkerCommand = editorExtensions_1.EditorCommand.bindToContribution(MarkerController.get);
    (0, editorExtensions_1.registerEditorCommand)(new MarkerCommand({
        id: 'closeMarkersNavigation',
        precondition: CONTEXT_MARKERS_NAVIGATION_VISIBLE,
        handler: x => x.close(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 50,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b0Vycm9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9nb3RvRXJyb3IvYnJvd3Nlci9nb3RvRXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXdCekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7O2lCQUVaLE9BQUUsR0FBRyxpQ0FBaUMsQUFBcEMsQ0FBcUM7UUFFdkQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQW1CLGtCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFVRCxZQUNDLE1BQW1CLEVBQ08sd0JBQW1FLEVBQ3pFLGtCQUF1RCxFQUN2RCxjQUFtRCxFQUNoRCxxQkFBNkQ7WUFIekMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUN4RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3RDLG1CQUFjLEdBQWQsY0FBYyxDQUFvQjtZQUMvQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBVnBFLHVCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBWTNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsa0NBQWtDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzFGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRU8sUUFBUTtZQUNmLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsSUFB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