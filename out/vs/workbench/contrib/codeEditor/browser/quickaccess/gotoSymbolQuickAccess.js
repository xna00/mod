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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/contrib/quickAccess/browser/gotoSymbolQuickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/actions/common/actions", "vs/base/common/fuzzyScorer", "vs/base/common/filters", "vs/base/common/errors", "vs/workbench/services/outline/browser/outline", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatures", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/base/common/iconLabels"], function (require, exports, nls_1, quickInput_1, editorService_1, platform_1, quickAccess_1, gotoSymbolQuickAccess_1, configuration_1, lifecycle_1, async_1, cancellation_1, actions_1, fuzzyScorer_1, filters_1, errors_1, outline_1, editorBrowser_1, editorGroupsService_1, outlineModel_1, languageFeatures_1, contextkey_1, accessibilityConfiguration_1, iconLabels_1) {
    "use strict";
    var GotoSymbolQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoSymbolQuickAccessProvider = void 0;
    let GotoSymbolQuickAccessProvider = class GotoSymbolQuickAccessProvider extends gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider {
        static { GotoSymbolQuickAccessProvider_1 = this; }
        constructor(editorService, editorGroupService, configurationService, languageFeaturesService, outlineService, outlineModelService) {
            super(languageFeaturesService, outlineModelService, {
                openSideBySideDirection: () => this.configuration.openSideBySideDirection
            });
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.outlineService = outlineService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        //#region DocumentSymbols (text editor required)
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench?.editor;
            return {
                openEditorPinned: !editorConfig?.enablePreviewFromQuickOpen || !editorConfig?.enablePreview,
                openSideBySideDirection: editorConfig?.openSideBySideDirection
            };
        }
        get activeTextEditorControl() {
            // TODO: this distinction should go away by adopting `IOutlineService`
            // for all editors (either text based ones or not). Currently text based
            // editors are not yet using the new outline service infrastructure but the
            // "classical" document symbols approach.
            if ((0, editorBrowser_1.isCompositeEditor)(this.editorService.activeEditorPane?.getControl())) {
                return undefined;
            }
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(context, options) {
            // Check for sideBySide use
            if ((options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options.forceSideBySide) && this.editorService.activeEditor) {
                context.restoreViewState?.(); // since we open to the side, restore view state in this editor
                const editorOptions = {
                    selection: options.range,
                    pinned: options.keyMods.ctrlCmd || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                };
                this.editorGroupService.sideGroup.openEditor(this.editorService.activeEditor, editorOptions);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(context, options);
            }
        }
        //#endregion
        //#region public methods to use this picker from other pickers
        static { this.SYMBOL_PICKS_TIMEOUT = 8000; }
        async getSymbolPicks(model, filter, options, disposables, token) {
            // If the registry does not know the model, we wait for as long as
            // the registry knows it. This helps in cases where a language
            // registry was not activated yet for providing any symbols.
            // To not wait forever, we eventually timeout though.
            const result = await Promise.race([
                this.waitForLanguageSymbolRegistry(model, disposables),
                (0, async_1.timeout)(GotoSymbolQuickAccessProvider_1.SYMBOL_PICKS_TIMEOUT)
            ]);
            if (!result || token.isCancellationRequested) {
                return [];
            }
            return this.doGetSymbolPicks(this.getDocumentSymbols(model, token), (0, fuzzyScorer_1.prepareQuery)(filter), options, token);
        }
        //#endregion
        provideWithoutTextEditor(picker) {
            if (this.canPickWithOutlineService()) {
                return this.doGetOutlinePicks(picker);
            }
            return super.provideWithoutTextEditor(picker);
        }
        canPickWithOutlineService() {
            return this.editorService.activeEditorPane ? this.outlineService.canCreateOutline(this.editorService.activeEditorPane) : false;
        }
        doGetOutlinePicks(picker) {
            const pane = this.editorService.activeEditorPane;
            if (!pane) {
                return lifecycle_1.Disposable.None;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            picker.busy = true;
            this.outlineService.createOutline(pane, 4 /* OutlineTarget.QuickPick */, cts.token).then(outline => {
                if (!outline) {
                    return;
                }
                if (cts.token.isCancellationRequested) {
                    outline.dispose();
                    return;
                }
                disposables.add(outline);
                const viewState = outline.captureViewState();
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    if (picker.selectedItems.length === 0) {
                        viewState.dispose();
                    }
                }));
                const entries = outline.config.quickPickDataSource.getQuickPickElements();
                const items = entries.map((entry, idx) => {
                    return {
                        kind: 0 /* SymbolKind.File */,
                        index: idx,
                        score: 0,
                        label: entry.label,
                        description: entry.description,
                        ariaLabel: entry.ariaLabel,
                        iconClasses: entry.iconClasses
                    };
                });
                disposables.add(picker.onDidAccept(() => {
                    picker.hide();
                    const [entry] = picker.selectedItems;
                    if (entry && entries[entry.index]) {
                        outline.reveal(entries[entry.index].element, {}, false, false);
                    }
                }));
                const updatePickerItems = () => {
                    const filteredItems = items.filter(item => {
                        if (picker.value === '@') {
                            // default, no filtering, scoring...
                            item.score = 0;
                            item.highlights = undefined;
                            return true;
                        }
                        const trimmedQuery = picker.value.substring(gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX.length).trim();
                        const parsedLabel = (0, iconLabels_1.parseLabelWithIcons)(item.label);
                        const score = (0, filters_1.fuzzyScore)(trimmedQuery, trimmedQuery.toLowerCase(), 0, parsedLabel.text, parsedLabel.text.toLowerCase(), 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
                        if (!score) {
                            return false;
                        }
                        item.score = score[1];
                        item.highlights = { label: (0, iconLabels_1.matchesFuzzyIconAware)(trimmedQuery, parsedLabel) ?? undefined };
                        return true;
                    });
                    if (filteredItems.length === 0) {
                        const label = (0, nls_1.localize)('empty', 'No matching entries');
                        picker.items = [{ label, index: -1, kind: 14 /* SymbolKind.String */ }];
                        picker.ariaLabel = label;
                    }
                    else {
                        picker.items = filteredItems;
                    }
                };
                updatePickerItems();
                disposables.add(picker.onDidChangeValue(updatePickerItems));
                const previewDisposable = new lifecycle_1.MutableDisposable();
                disposables.add(previewDisposable);
                disposables.add(picker.onDidChangeActive(() => {
                    const [entry] = picker.activeItems;
                    if (entry && entries[entry.index]) {
                        previewDisposable.value = outline.preview(entries[entry.index].element);
                    }
                    else {
                        previewDisposable.clear();
                    }
                }));
            }).catch(err => {
                (0, errors_1.onUnexpectedError)(err);
                picker.hide();
            }).finally(() => {
                picker.busy = false;
            });
            return disposables;
        }
    };
    exports.GotoSymbolQuickAccessProvider = GotoSymbolQuickAccessProvider;
    exports.GotoSymbolQuickAccessProvider = GotoSymbolQuickAccessProvider = GotoSymbolQuickAccessProvider_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, outline_1.IOutlineService),
        __param(5, outlineModel_1.IOutlineModelService)
    ], GotoSymbolQuickAccessProvider);
    class GotoSymbolAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.gotoSymbol'; }
        constructor() {
            super({
                id: GotoSymbolAction.ID,
                title: {
                    ...(0, nls_1.localize2)('gotoSymbol', "Go to Symbol in Editor..."),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miGotoSymbolInEditor', comment: ['&& denotes a mnemonic'] }, "Go to &&Symbol in Editor..."),
                },
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown.negate(), accessibilityConfiguration_1.accessibilityHelpIsShown.negate()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */
                },
                menu: [{
                        id: actions_1.MenuId.MenubarGoMenu,
                        group: '4_symbol_nav',
                        order: 1
                    }]
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(GotoSymbolQuickAccessProvider.PREFIX, { itemActivation: quickInput_1.ItemActivation.NONE });
        }
    }
    (0, actions_1.registerAction2)(GotoSymbolAction);
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoSymbolQuickAccessProvider,
        prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
        contextKey: 'inFileSymbolsPicker',
        placeholder: (0, nls_1.localize)('gotoSymbolQuickAccessPlaceholder', "Type the name of a symbol to go to."),
        helpEntries: [
            {
                description: (0, nls_1.localize)('gotoSymbolQuickAccess', "Go to Symbol in Editor"),
                prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
                commandId: GotoSymbolAction.ID,
                commandCenterOrder: 40
            },
            {
                description: (0, nls_1.localize)('gotoSymbolByCategoryQuickAccess', "Go to Symbol in Editor by Category"),
                prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY
            }
        ]
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290b1N5bWJvbFF1aWNrQWNjZXNzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2Jyb3dzZXIvcXVpY2thY2Nlc3MvZ290b1N5bWJvbFF1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQ3pGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsNkRBQXFDOztRQUl2RixZQUNpQixhQUE4QyxFQUN4QyxrQkFBeUQsRUFDeEQsb0JBQTRELEVBQ3pELHVCQUFpRCxFQUMxRCxjQUFnRCxFQUMzQyxtQkFBeUM7WUFFL0QsS0FBSyxDQUFDLHVCQUF1QixFQUFFLG1CQUFtQixFQUFFO2dCQUNuRCx1QkFBdUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QjthQUN6RSxDQUFDLENBQUM7WUFUOEIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFQL0MsdUNBQWtDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQztRQWFuRyxDQUFDO1FBRUQsZ0RBQWdEO1FBRWhELElBQVksYUFBYTtZQUN4QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFpQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUM7WUFFM0csT0FBTztnQkFDTixnQkFBZ0IsRUFBRSxDQUFDLFlBQVksRUFBRSwwQkFBMEIsSUFBSSxDQUFDLFlBQVksRUFBRSxhQUFhO2dCQUMzRix1QkFBdUIsRUFBRSxZQUFZLEVB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