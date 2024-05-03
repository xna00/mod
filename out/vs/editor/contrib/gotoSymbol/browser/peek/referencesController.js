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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "../referencesModel", "./referencesWidget", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkeys"], function (require, exports, async_1, errors_1, keyCodes_1, lifecycle_1, codeEditorService_1, position_1, range_1, peekView_1, nls, commands_1, configuration_1, contextkey_1, instantiation_1, keybindingsRegistry_1, listService_1, notification_1, storage_1, referencesModel_1, referencesWidget_1, editorContextKeys_1, contextkeys_1) {
    "use strict";
    var ReferencesController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferencesController = exports.ctxReferenceSearchVisible = void 0;
    exports.ctxReferenceSearchVisible = new contextkey_1.RawContextKey('referenceSearchVisible', false, nls.localize('referenceSearchVisible', "Whether reference peek is visible, like 'Peek References' or 'Peek Definition'"));
    let ReferencesController = class ReferencesController {
        static { ReferencesController_1 = this; }
        static { this.ID = 'editor.contrib.referencesController'; }
        static get(editor) {
            return editor.getContribution(ReferencesController_1.ID);
        }
        constructor(_defaultTreeKeyboardSupport, _editor, contextKeyService, _editorService, _notificationService, _instantiationService, _storageService, _configurationService) {
            this._defaultTreeKeyboardSupport = _defaultTreeKeyboardSupport;
            this._editor = _editor;
            this._editorService = _editorService;
            this._notificationService = _notificationService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._requestIdPool = 0;
            this._ignoreModelChangeEvent = false;
            this._referenceSearchVisible = exports.ctxReferenceSearchVisible.bindTo(contextKeyService);
        }
        dispose() {
            this._referenceSearchVisible.reset();
            this._disposables.dispose();
            this._widget?.dispose();
            this._model?.dispose();
            this._widget = undefined;
            this._model = undefined;
        }
        toggleWidget(range, modelPromise, peekMode) {
            // close current widget and return early is position didn't change
            let widgetPosition;
            if (this._widget) {
                widgetPosition = this._widget.position;
            }
            this.closeWidget();
            if (!!widgetPosition && range.containsPosition(widgetPosition)) {
                return;
            }
            this._peekMode = peekMode;
            this._referenceSearchVisible.set(true);
            // close the widget on model/mode changes
            this._disposables.add(this._editor.onDidChangeModelLanguage(() => { this.closeWidget(); }));
            this._disposables.add(this._editor.onDidChangeModel(() => {
                if (!this._ignoreModelChangeEvent) {
                    this.closeWidget();
                }
            }));
            const storageKey = 'peekViewLayout';
            const data = referencesWidget_1.LayoutData.fromJSON(this._storageService.get(storageKey, 0 /* StorageScope.PROFILE */, '{}'));
            this._widget = this._instantiationService.createInstance(referencesWidget_1.ReferenceWidget, this._editor, this._defaultTreeKeyboardSupport, data);
            this._widget.setTitle(nls.localize('labelLoading', "Loading..."));
            this._widget.show(range);
            this._disposables.add(this._widget.onDidClose(() => {
                modelPromise.cancel();
                if (this._widget) {
                    this._storageService.store(storageKey, JSON.stringify(this._widget.layoutData), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                    this._widget = undefined;
                }
                this.closeWidget();
            }));
            this._disposables.add(this._widget.onDidSelectReference(event => {
                const { element, kind } = event;
                if (!element) {
                    return;
                }
                switch (kind) {
                    case 'open':
                        if (event.source !== 'editor' || !this._configurationService.getValue('editor.stablePeek')) {
                            // when stable peek is configured we don't close
                            // the peek window on selecting the editor
                            this.openReference(element, false, false);
                        }
                        break;
                    case 'side':
                        this.openReference(element, true, false);
                        break;
                    case 'goto':
                        if (peekMode) {
                            this._gotoReference(element, true);
                        }
                        else {
                            this.openReference(element, false, true);
                        }
                        break;
                }
            }));
            const requestId = ++this._requestIdPool;
            modelPromise.then(model => {
                // still current request? widget still open?
                if (requestId !== this._requestIdPool || !this._widget) {
                    model.dispose();
                    return undefined;
                }
                this._model?.dispose();
                this._model = model;
                // show widget
                return this._widget.setModel(this._model).then(() => {
                    if (this._widget && this._model && this._editor.hasModel()) { // might have been closed
                        // set title
                        if (!this._model.isEmpty) {
                            this._widget.setMetaTitle(nls.localize('metaTitle.N', "{0} ({1})", this._model.title, this._model.references.length));
                        }
                        else {
                            this._widget.setMetaTitle('');
                        }
                        // set 'best' selection
                        const uri = this._editor.getModel().uri;
                        const pos = new position_1.Position(range.startLineNumber, range.startColumn);
                        const selection = this._model.nearestReference(uri, pos);
                        if (selection) {
                            return this._widget.setSelection(selection).then(() => {
                                if (this._widget && this._editor.getOption(87 /* EditorOption.peekWidgetDefaultFocus */) === 'editor') {
                                    this._widget.focusOnPreviewEditor();
                                }
                            });
                        }
                    }
                    return undefined;
                });
            }, error => {
                this._notificationService.error(error);
            });
        }
        changeFocusBetweenPreviewAndReferences() {
            if (!this._widget) {
                // can be called while still resolving...
                return;
            }
            if (this._widget.isPreviewEditorFocused()) {
                this._widget.focusOnReferenceTree();
            }
            else {
                this._widget.focusOnPreviewEditor();
            }
        }
        async goToNextOrPreviousReference(fwd) {
            if (!this._editor.hasModel() || !this._model || !this._widget) {
                // can be called while still resolving...
                return;
            }
            const currentPosition = this._widget.position;
            if (!currentPosition) {
                return;
            }
            const source = this._model.nearestReference(this._editor.getModel().uri, currentPosition);
            if (!source) {
                return;
            }
            const target = this._model.nextOrPreviousReference(source, fwd);
            const editorFocus = this._editor.hasTextFocus();
            const previewEditorFocus = this._widget.isPreviewEditorFocused();
            await this._widget.setSelection(target);
            await this._gotoReference(target, false);
            if (editorFocus) {
                this._editor.focus();
            }
            else if (this._widget && previewEditorFocus) {
                this._widget.focusOnPreviewEditor();
            }
        }
        async revealReference(reference) {
            if (!this._editor.hasModel() || !this._model || !this._widget) {
                // can be called while still resolving...
                return;
            }
            await this._widget.revealReference(reference);
        }
        closeWidget(focusEditor = true) {
            this._widget?.dispose();
            this._model?.dispose();
            this._referenceSearchVisible.reset();
            this._disposables.clear();
            this._widget = undefined;
            this._model = undefined;
            if (focusEditor) {
                this._editor.focus();
            }
            this._requestIdPool += 1; // Cancel pending requests
        }
        _gotoReference(ref, pinned) {
            this._widget?.hide();
            this._ignoreModelChangeEvent = true;
            const range = range_1.Range.lift(ref.range).collapseToStart();
            return this._editorService.openCodeEditor({
                resource: ref.uri,
                options: { selection: range, selectionSource: "code.jump" /* TextEditorSelectionSource.JUMP */, pinned }
            }, this._editor).then(openedEditor => {
                this._ignoreModelChangeEvent = false;
                if (!openedEditor || !this._widget) {
                    // something went wrong...
                    this.closeWidget();
                    return;
                }
                if (this._editor === openedEditor) {
                    //
                    this._widget.show(range);
                    this._widget.focusOnReferenceTree();
                }
                else {
                    // we opened a different editor instance which means a different controller instance.
                    // therefore we stop with this controller and continue with the other
                    const other = ReferencesController_1.get(openedEditor);
                    const model = this._model.clone();
                    this.closeWidget();
                    openedEditor.focus();
                    other?.toggleWidget(range, (0, async_1.createCancelablePromise)(_ => Promise.resolve(model)), this._peekMode ?? false);
                }
            }, (err) => {
                this._ignoreModelChangeEvent = false;
                (0, errors_1.onUnexpectedError)(err);
            });
        }
        openReference(ref, sideBySide, pinned) {
            // clear stage
            if (!sideBySide) {
                this.closeWidget();
            }
            const { uri, range } = ref;
            this._editorService.openCodeEditor({
                resource: uri,
                options: { selection: range, selectionSource: "code.jump" /* TextEditorSelectionSource.JUMP */, pinned }
            }, this._editor, sideBySide);
        }
    };
    exports.ReferencesController = ReferencesController;
    exports.ReferencesController = ReferencesController = ReferencesController_1 = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, notification_1.INotificationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, storage_1.IStorageService),
        __param(7, configuration_1.IConfigurationService)
    ], ReferencesController);
    function withController(accessor, fn) {
        const outerEditor = (0, peekView_1.getOuterEditor)(accessor);
        if (!outerEditor) {
            return;
        }
        const controller = ReferencesController.get(outerEditor);
        if (controller) {
            fn(controller);
        }
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'togglePeekWidgetFocus',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 60 /* KeyCode.F2 */),
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.changeFocusBetweenPreviewAndReferences();
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToNextReference',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
        primary: 62 /* KeyCode.F4 */,
        secondary: [70 /* KeyCode.F12 */],
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(true);
            });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'goToPreviousReference',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
        primary: 1024 /* KeyMod.Shift */ | 62 /* KeyCode.F4 */,
        secondary: [1024 /* KeyMod.Shift */ | 70 /* KeyCode.F12 */],
        when: contextkey_1.ContextKeyExpr.or(exports.ctxReferenceSearchVisible, peekView_1.PeekContext.inPeekEditor),
        handler(accessor) {
            withController(accessor, controller => {
                controller.goToNextOrPreviousReference(false);
            });
        }
    });
    // commands that aren't needed anymore because there is now ContextKeyExpr.OR
    commands_1.CommandsRegistry.registerCommandAlias('goToNextReferenceFromEmbeddedEditor', 'goToNextReference');
    commands_1.CommandsRegistry.registerCommandAlias('goToPreviousReferenceFromEmbeddedEditor', 'goToPreviousReference');
    // close
    commands_1.CommandsRegistry.registerCommandAlias('closeReferenceSearchEditor', 'closeReferenceSearch');
    commands_1.CommandsRegistry.registerCommand('closeReferenceSearch', accessor => withController(accessor, controller => controller.closeWidget()));
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'closeReferenceSearch',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 101,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(peekView_1.PeekContext.inPeekEditor, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'))
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: 'closeReferenceSearch',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'), contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.editorTextFocus, contextkeys_1.InputFocusedContext.negate()))
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'revealReference',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 3 /* KeyCode.Enter */,
        mac: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
        },
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchTreeElementCanCollapse.negate(), listService_1.WorkbenchTreeElementCanExpand.negate()),
        handler(accessor) {
            const listService = accessor.get(listService_1.IListService);
            const focus = listService.lastFocusedList?.getFocus();
            if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
                withController(accessor, controller => controller.revealReference(focus[0]));
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'openReferenceToSide',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        mac: {
            primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */
        },
        when: contextkey_1.ContextKeyExpr.and(exports.ctxReferenceSearchVisible, listService_1.WorkbenchListFocusContextKey, listService_1.WorkbenchTreeElementCanCollapse.negate(), listService_1.WorkbenchTreeElementCanExpand.negate()),
        handler(accessor) {
            const listService = accessor.get(listService_1.IListService);
            const focus = listService.lastFocusedList?.getFocus();
            if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
                withController(accessor, controller => controller.openReference(focus[0], true, true));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand('openReference', (accessor) => {
        const listService = accessor.get(listService_1.IListService);
        const focus = listService.lastFocusedList?.getFocus();
        if (Array.isArray(focus) && focus[0] instanceof referencesModel_1.OneReference) {
            withController(accessor, controller => controller.openReference(focus[0], false, true));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmZXJlbmNlc0NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2dvdG9TeW1ib2wvYnJvd3Nlci9wZWVrL3JlZmVyZW5jZXNDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE2Qm5GLFFBQUEseUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLGdGQUFnRixDQUFDLENBQUMsQ0FBQztJQUV4TixJQUFlLG9CQUFvQixHQUFuQyxNQUFlLG9CQUFvQjs7aUJBRXpCLE9BQUUsR0FBRyxxQ0FBcUMsQUFBeEMsQ0FBeUM7UUFZM0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUM3QixPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQXVCLHNCQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFFRCxZQUNrQiwyQkFBb0MsRUFDcEMsT0FBb0IsRUFDakIsaUJBQXFDLEVBQ3JDLGNBQW1ELEVBQ2pELG9CQUEyRCxFQUMxRCxxQkFBNkQsRUFDbkUsZUFBaUQsRUFDM0MscUJBQTZEO1lBUG5FLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBUztZQUNwQyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBRUEsbUJBQWMsR0FBZCxjQUFjLENBQW9CO1lBQ2hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDekMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDMUIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQXRCcEUsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUs5Qyxt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