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
define(["require", "exports", "vs/platform/list/browser/listService", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditTree", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/platform/label/common/label", "vs/editor/common/services/resolverService", "vs/base/common/uri", "vs/workbench/browser/parts/views/viewPane", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/labels", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/platform/storage/common/storage", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/button/button", "vs/platform/theme/browser/defaultStyles", "vs/base/common/cache", "vs/css!./bulkEdit"], function (require, exports, listService_1, bulkEditTree_1, instantiation_1, themeService_1, nls_1, lifecycle_1, editorService_1, bulkEditPreview_1, label_1, resolverService_1, uri_1, viewPane_1, keybinding_1, contextView_1, configuration_1, contextkey_1, labels_1, dialogs_1, actions_1, storage_1, views_1, opener_1, telemetry_1, button_1, defaultStyles_1, cache_1) {
    "use strict";
    var BulkEditPane_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditPane = void 0;
    var State;
    (function (State) {
        State["Data"] = "data";
        State["Message"] = "message";
    })(State || (State = {}));
    let BulkEditPane = class BulkEditPane extends viewPane_1.ViewPane {
        static { BulkEditPane_1 = this; }
        static { this.ID = 'refactorPreview'; }
        static { this.Schema = 'vscode-bulkeditpreview-multieditor'; }
        static { this.ctxHasCategories = new contextkey_1.RawContextKey('refactorPreview.hasCategories', false); }
        static { this.ctxGroupByFile = new contextkey_1.RawContextKey('refactorPreview.groupByFile', true); }
        static { this.ctxHasCheckedChanges = new contextkey_1.RawContextKey('refactorPreview.hasCheckedChanges', true); }
        static { this._memGroupByFile = `${BulkEditPane_1.ID}.groupByFile`; }
        constructor(options, _instaService, _editorService, _labelService, _textModelService, _dialogService, _contextMenuService, _storageService, contextKeyService, viewDescriptorService, keybindingService, contextMenuService, configurationService, openerService, themeService, telemetryService) {
            super({ ...options, titleMenuId: actions_1.MenuId.BulkEditTitle }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, _instaService, openerService, themeService, telemetryService);
            this._instaService = _instaService;
            this._editorService = _editorService;
            this._labelService = _labelService;
            this._textModelService = _textModelService;
            this._dialogService = _dialogService;
            this._contextMenuService = _contextMenuService;
            this._storageService = _storageService;
            this._treeViewStates = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._computeResourceDiffEditorInputs = new cache_1.LRUCachedFunction(async (fileOperations) => {
                const computeDiffEditorInput = new cache_1.CachedFunction(async (fileOperation) => {
                    const fileOperationUri = fileOperation.uri;
                    const previewUri = this._currentProvider.asPreviewUri(fileOperationUri);
                    // delete
                    if (fileOperation.type & 4 /* BulkFileOperationType.Delete */) {
                        return {
                            original: { resource: uri_1.URI.revive(previewUri) },
                            modified: { resource: undefined }
                        };
                    }
                    // rename, create, edits
                    else {
                        let leftResource;
                        try {
                            (await this._textModelService.createModelReference(fileOperationUri)).dispose();
                            leftResource = fileOperationUri;
                        }
                        catch {
                            leftResource = bulkEditPreview_1.BulkEditPreviewProvider.emptyPreview;
                        }
                        return {
                            original: { resource: uri_1.URI.revive(leftResource) },
                            modified: { resource: uri_1.URI.revive(previewUri) }
                        };
                    }
                });
                const sortedFileOperations = fileOperations.slice().sort(bulkEditTree_1.compareBulkFileOperations);
                const resources = [];
                for (const operation of sortedFileOperations) {
                    resources.push(await computeDiffEditorInput.get(operation));
                }
                const getResourceDiffEditorInputIdOfOperation = async (operation) => {
                    const resource = await computeDiffEditorInput.get(operation);
                    return { original: resource.original.resource, modified: resource.modified.resource };
                };
                return {
                    resources,
                    getResourceDiffEditorInputIdOfOperation
                };
            }, key => key);
            this.element.classList.add('bulk-edit-panel', 'show-file-icons');
            this._ctxHasCategories = BulkEditPane_1.ctxHasCategories.bindTo(contextKeyService);
            this._ctxGroupByFile = BulkEditPane_1.ctxGroupByFile.bindTo(contextKeyService);
            this._ctxHasCheckedChanges = BulkEditPane_1.ctxHasCheckedChanges.bindTo(contextKeyService);
            this.telemetryService.publicLog2('views.bulkEditPane');
        }
        dispose() {
            this._tree.dispose();
            this._disposables.dispose();
            super.dispose();
        }
        renderBody(parent) {
            super.renderBody(parent);
            const resourceLabels = this._instaService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._disposables.add(resourceLabels);
            const contentContainer = document.createElement('div');
            contentContainer.className = 'content';
            parent.appendChild(contentContainer);
            // tree
            const treeContainer = document.createElement('div');
            contentContainer.appendChild(treeContainer);
            this._treeDataSource = this._instaService.createInstance(bulkEditTree_1.BulkEditDataSource);
            this._treeDataSource.groupByFile = this._storageService.getBoolean(BulkEditPane_1._memGroupByFile, 0 /* StorageScope.PROFILE */, true);
            this._ctxGroupByFile.set(this._treeDataSource.groupByFile);
            this._tree = this._instaService.createInstance(listService_1.WorkbenchAsyncDataTree, this.id, treeContainer, new bulkEditTree_1.BulkEditDelegate(), [this._instaService.createInstance(bulkEditTree_1.TextEditElementRenderer), this._instaService.createInstance(bulkEditTree_1.FileElementRenderer, resourceLabels), this._instaService.createInstance(bulkEditTree_1.CategoryElementRenderer)], this._treeDataSource, {
                accessibilityProvider: this._instaService.createInstance(bulkEditTree_1.BulkEditAccessibilityProvider),
                identityProvider: new bulkEditTree_1.BulkEditIdentityProvider(),
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                keyboardNavigationLabelProvider: new bulkEditTree_1.BulkEditNaviLabelProvider(),
                sorter: new bulkEditTree_1.BulkEditSorter(),
                selectionNavigation: true
            });
            this._disposables.add(this._tree.onContextMenu(this._onContextMenu, this));
            this._disposables.add(this._tree.onDidOpen(e => this._openElementInMultiDiffEditor(e)));
            // buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'buttons';
            contentContainer.appendChild(buttonsContainer);
            const buttonBar = new button_1.ButtonBar(buttonsContainer);
            this._disposables.add(buttonBar);
            const btnConfirm = buttonBar.addButton({ supportIcons: true, ...defaultStyles_1.defaultButtonStyles });
            btnConfirm.label = (0, nls_1.localize)('ok', 'Apply');
            btnConfirm.onDidClick(() => this.accept(), this, this._disposables);
            const btnCancel = buttonBar.addButton({ ...defaultStyles_1.defaultButtonStyles, secondary: true });
            btnCancel.label = (0, nls_1.localize)('cancel', 'Discard');
            btnCancel.onDidClick(() => this.discard(), this, this._disposables);
            // message
            this._message = document.createElement('span');
            this._message.className = 'message';
            this._message.innerText = (0, nls_1.localize)('empty.msg', "Invoke a code action, like rename, to see a preview of its changes here.");
            parent.appendChild(this._message);
            //
            this._setState("message" /* State.Message */);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            const treeHeight = height - 50;
            this._tree.getHTMLElement().parentElement.style.height = `${treeHeight}px`;
            this._tree.layout(treeHeight, width);
        }
        _setState(state) {
            this.element.dataset['state'] = state;
        }
        async setInput(edit, token) {
            this._setState("data" /* State.Data */);
            this._sessionDisposables.clear();
            this._treeViewStates.clear();
            if (this._currentResolve) {
                this._currentResolve(undefined);
                this._currentResolve = undefined;
            }
            const input = await this._instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edit);
            this._currentProvider = this._instaService.createInstance(bulkEditPreview_1.BulkEditPreviewProvider, input);
            this._sessionDisposables.add(this._currentProvider);
            this._sessionDisposables.add(input);
            //
            const hasCategories = input.categories.length > 1;
            this._ctxHasCategories.set(hasCategories);
            this._treeDataSource.groupByFile = !hasCategories || this._treeDataSource.groupByFile;
            this._ctxHasCheckedChanges.set(input.checked.checkedCount > 0);
            this._currentInput = input;
            return new Promise(resolve => {
                token.onCancellationRequested(() => resolve(undefined));
                this._currentResolve = resolve;
                this._setTreeInput(input);
                // refresh when check state changes
                this._sessionDisposables.add(input.checked.onDidChange(() => {
                    this._tree.updateChildren();
                    this._ctxHasCheckedChanges.set(input.checked.checkedCount > 0);
                }));
            });
        }
        hasInput() {
            return Boolean(this._currentInput);
        }
        async _setTreeInput(input) {
            const viewState = this._treeViewStates.get(this._treeDataSource.groupByFile);
            await this._tree.setInput(input, viewState);
            this._tree.domFocus();
            if (viewState) {
                return;
            }
            // async expandAll (max=10) is the default when no view state is given
            const expand = [...this._tree.getNode(input).children].slice(0, 10);
            while (expand.length > 0) {
                const { element } = expand.shift();
                if (element instanceof bulkEditTree_1.FileElement) {
                    await this._tree.expand(element, true);
                }
                if (element instanceof bulkEditTree_1.CategoryElement) {
                    await this._tree.expand(element, true);
                    expand.push(...this._tree.getNode(element).children);
                }
            }
        }
        accept() {
            const conflicts = this._currentInput?.conflicts.list();
            if (!conflicts || conflicts.length === 0) {
                this._done(true);
                return;
            }
            let message;
            if (conflicts.length === 1) {
                message = (0, nls_1.localize)('conflict.1', "Cannot apply refactoring because '{0}' has changed in the meantime.", this._labelService.getUriLabel(conflicts[0], { relative: true }));
            }
            else {
                message = (0, nls_1.localize)('conflict.N', "Cannot apply refactoring because {0} other files have changed in the meantime.", conflicts.length);
            }
            this._dialogService.warn(message).finally(() => this._done(false));
        }
        discard() {
            this._done(false);
        }
        _done(accept) {
            this._currentResolve?.(accept ? this._currentInput?.getWorkspaceEdit() : undefined);
            this._currentInput = undefined;
            this._setState("message" /* State.Message */);
            this._sessionDisposables.clear();
        }
        toggleChecked() {
            const [first] = this._tree.getFocus();
            if ((first instanceof bulkEditTree_1.FileElement || first instanceof bulkEditTree_1.TextEditElement) && !first.isDisabled()) {
                first.setChecked(!first.isChecked());
            }
            else if (first instanceof bulkEditTree_1.CategoryElement) {
                first.setChecked(!first.isChecked());
            }
        }
        groupByFile() {
            if (!this._treeDataSource.groupByFile) {
                this.toggleGrouping();
            }
        }
        groupByType() {
            if (this._treeDataSource.groupByFile) {
                this.toggleGrouping();
            }
        }
        toggleGrouping() {
            const input = this._tree.getInput();
            if (input) {
                // (1) capture view state
                const oldViewState = this._tree.getViewState();
                this._treeViewStates.set(this._treeDataSource.groupByFile, oldViewState);
                // (2) toggle and update
                this._treeDataSource.groupByFile = !this._treeDataSource.groupByFile;
                this._setTreeInput(input);
                // (3) remember preference
                this._storageService.store(BulkEditPane_1._memGroupByFile, this._treeDataSource.groupByFile, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                this._ctxGroupByFile.set(this._treeDataSource.groupByFile);
            }
        }
        async _openElementInMultiDiffEditor(e) {
            const fileOperations = this._currentInput?.fileOperations;
            if (!fileOperations) {
                return;
            }
            let selection = undefined;
            let fileElement;
            if (e.element instanceof bulkEditTree_1.TextEditElement) {
                fileElement = e.element.parent;
                selection = e.element.edit.textEdit.textEdit.range;
            }
            else if (e.element instanceof bulkEditTree_1.FileElement) {
                fileElement = e.element;
                selection = e.element.edit.textEdits[0]?.textEdit.textEdit.range;
            }
            else {
                // invalid event
                return;
            }
            const result = await this._computeResourceDiffEditorInputs.get(fileOperations);
            const resourceId = await result.getResourceDiffEditorInputIdOfOperation(fileElement.edit);
            const options = {
                ...e.editorOptions,
                viewState: {
                    revealData: {
                        resource: resourceId,
                        range: selection,
                    }
                }
            };
            const multiDiffSource = uri_1.URI.from({ scheme: BulkEditPane_1.Schema });
            const label = 'Refactor Preview';
            this._editorService.openEditor({
                multiDiffSource,
                label,
                options,
                isTransient: true,
                description: label,
                resources: result.resources
            }, e.sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        _onContextMenu(e) {
            this._contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.BulkEditContext,
                contextKeyService: this.contextKeyService,
                getAnchor: () => e.anchor
            });
        }
    };
    exports.BulkEditPane = BulkEditPane;
    exports.BulkEditPane = BulkEditPane = BulkEditPane_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, editorService_1.IEditorService),
        __param(3, label_1.ILabelService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, dialogs_1.IDialogService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, storage_1.IStorageService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, opener_1.IOpenerService),
        __param(14, themeService_1.IThemeService),
        __param(15, telemetry_1.ITelemetryService)
    ], BulkEditPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRQYW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC9icm93c2VyL3ByZXZpZXcvYnVsa0VkaXRQYW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3Q2hHLElBQVcsS0FHVjtJQUhELFdBQVcsS0FBSztRQUNmLHNCQUFhLENBQUE7UUFDYiw0QkFBbUIsQ0FBQTtJQUNwQixDQUFDLEVBSFUsS0FBSyxLQUFMLEtBQUssUUFHZjtJQUVNLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxtQkFBUTs7aUJBRXpCLE9BQUUsR0FBRyxpQkFBaUIsQUFBcEIsQ0FBcUI7aUJBQ3ZCLFdBQU0sR0FBRyxvQ0FBb0MsQUFBdkMsQ0FBd0M7aUJBRTlDLHFCQUFnQixHQUFHLElBQUksMEJBQWEsQ0FBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQUFBNUQsQ0FBNkQ7aUJBQzdFLG1CQUFjLEdBQUcsSUFBSSwwQkFBYSxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxBQUF6RCxDQUEwRDtpQkFDeEUseUJBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFDLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxBQUEvRCxDQUFnRTtpQkFFNUUsb0JBQWUsR0FBRyxHQUFHLGNBQVksQ0FBQyxFQUFFLGNBQWMsQUFBbkMsQ0FBb0M7UUFpQjNFLFlBQ0MsT0FBNEIsRUFDTCxhQUFxRCxFQUM1RCxjQUErQyxFQUNoRCxhQUE2QyxFQUN6QyxpQkFBcUQsRUFDeEQsY0FBK0MsRUFDMUMsbUJBQXlELEVBQzdELGVBQWlELEVBQzlDLGlCQUFxQyxFQUNqQyxxQkFBNkMsRUFDakQsaUJBQXFDLEVBQ3BDLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDbEQsYUFBNkIsRUFDOUIs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