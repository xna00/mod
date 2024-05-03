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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/services/textfile/common/textfiles", "vs/platform/contextkey/common/contextkeys", "vs/base/common/event", "vs/nls"], function (require, exports, editor_1, files_1, contextkey_1, lifecycle_1, model_1, language_1, textfiles_1, contextkeys_1, event_1, nls_1) {
    "use strict";
    var TextFileContentProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditor = exports.TextFileContentProvider = exports.LexicographicOptions = exports.UndoConfirmLevel = exports.SortOrder = exports.BINARY_TEXT_FILE_MODE = exports.BINARY_FILE_EDITOR_ID = exports.FILE_EDITOR_INPUT_ID = exports.TEXT_FILE_EDITOR_ID = exports.ExplorerFocusCondition = exports.FilesExplorerFocusCondition = exports.ViewHasSomeCollapsibleRootItemContext = exports.ExplorerCompressedLastFocusContext = exports.ExplorerCompressedFirstFocusContext = exports.ExplorerCompressedFocusContext = exports.ExplorerFocusedContext = exports.OpenEditorsFocusedContext = exports.FilesExplorerFocusedContext = exports.ExplorerResourceMoveableToTrash = exports.ExplorerResourceCut = exports.ExplorerRootContext = exports.ExplorerResourceAvailableEditorIdsContext = exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext = exports.ExplorerFolderContext = exports.FoldersViewVisibleContext = exports.ExplorerViewletVisibleContext = exports.VIEW_ID = exports.VIEWLET_ID = void 0;
    /**
     * Explorer viewlet id.
     */
    exports.VIEWLET_ID = 'workbench.view.explorer';
    /**
     * Explorer file view id.
     */
    exports.VIEW_ID = 'workbench.explorer.fileView';
    /**
     * Context Keys to use with keybindings for the Explorer and Open Editors view
     */
    exports.ExplorerViewletVisibleContext = new contextkey_1.RawContextKey('explorerViewletVisible', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletVisible', "True when the EXPLORER viewlet is visible.") });
    exports.FoldersViewVisibleContext = new contextkey_1.RawContextKey('foldersViewVisible', true, { type: 'boolean', description: (0, nls_1.localize)('foldersViewVisible', "True when the FOLDERS view (the file tree within the explorer view container) is visible.") });
    exports.ExplorerFolderContext = new contextkey_1.RawContextKey('explorerResourceIsFolder', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceIsFolder', "True when the focused item in the EXPLORER is a folder.") });
    exports.ExplorerResourceReadonlyContext = new contextkey_1.RawContextKey('explorerResourceReadonly', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceReadonly', "True when the focused item in the EXPLORER is read-only.") });
    exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext.toNegated();
    /**
     * Comma separated list of editor ids that can be used for the selected explorer resource.
     */
    exports.ExplorerResourceAvailableEditorIdsContext = new contextkey_1.RawContextKey('explorerResourceAvailableEditorIds', '');
    exports.ExplorerRootContext = new contextkey_1.RawContextKey('explorerResourceIsRoot', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceIsRoot', "True when the focused item in the EXPLORER is a root folder.") });
    exports.ExplorerResourceCut = new contextkey_1.RawContextKey('explorerResourceCut', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceCut', "True when an item in the EXPLORER has been cut for cut and paste.") });
    exports.ExplorerResourceMoveableToTrash = new contextkey_1.RawContextKey('explorerResourceMoveableToTrash', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceMoveableToTrash', "True when the focused item in the EXPLORER can be moved to trash.") });
    exports.FilesExplorerFocusedContext = new contextkey_1.RawContextKey('filesExplorerFocus', true, { type: 'boolean', description: (0, nls_1.localize)('filesExplorerFocus', "True when the focus is inside the EXPLORER view.") });
    exports.OpenEditorsFocusedContext = new contextkey_1.RawContextKey('openEditorsFocus', true, { type: 'boolean', description: (0, nls_1.localize)('openEditorsFocus', "True when the focus is inside the OPEN EDITORS view.") });
    exports.ExplorerFocusedContext = new contextkey_1.RawContextKey('explorerViewletFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletFocus', "True when the focus is inside the EXPLORER viewlet.") });
    // compressed nodes
    exports.ExplorerCompressedFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedFocus', "True when the focused item in the EXPLORER view is a compact item.") });
    exports.ExplorerCompressedFirstFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedFirstFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedFirstFocus', "True when the focus is inside a compact item's first part in the EXPLORER view.") });
    exports.ExplorerCompressedLastFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedLastFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedLastFocus', "True when the focus is inside a compact item's last part in the EXPLORER view.") });
    exports.ViewHasSomeCollapsibleRootItemContext = new contextkey_1.RawContextKey('viewHasSomeCollapsibleItem', false, { type: 'boolean', description: (0, nls_1.localize)('viewHasSomeCollapsibleItem', "True when a workspace in the EXPLORER view has some collapsible root child.") });
    exports.FilesExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.FoldersViewVisibleContext, exports.FilesExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.ExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.FoldersViewVisibleContext, exports.ExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    /**
     * Text file editor id.
     */
    exports.TEXT_FILE_EDITOR_ID = 'workbench.editors.files.textFileEditor';
    /**
     * File editor input id.
     */
    exports.FILE_EDITOR_INPUT_ID = 'workbench.editors.files.fileEditorInput';
    /**
     * Binary file editor id.
     */
    exports.BINARY_FILE_EDITOR_ID = 'workbench.editors.files.binaryFileEditor';
    /**
     * Language identifier for binary files opened as text.
     */
    exports.BINARY_TEXT_FILE_MODE = 'code-text-binary';
    var SortOrder;
    (function (SortOrder) {
        SortOrder["Default"] = "default";
        SortOrder["Mixed"] = "mixed";
        SortOrder["FilesFirst"] = "filesFirst";
        SortOrder["Type"] = "type";
        SortOrder["Modified"] = "modified";
        SortOrder["FoldersNestsFiles"] = "foldersNestsFiles";
    })(SortOrder || (exports.SortOrder = SortOrder = {}));
    var UndoConfirmLevel;
    (function (UndoConfirmLevel) {
        UndoConfirmLevel["Verbose"] = "verbose";
        UndoConfirmLevel["Default"] = "default";
        UndoConfirmLevel["Light"] = "light";
    })(UndoConfirmLevel || (exports.UndoConfirmLevel = UndoConfirmLevel = {}));
    var LexicographicOptions;
    (function (LexicographicOptions) {
        LexicographicOptions["Default"] = "default";
        LexicographicOptions["Upper"] = "upper";
        LexicographicOptions["Lower"] = "lower";
        LexicographicOptions["Unicode"] = "unicode";
    })(LexicographicOptions || (exports.LexicographicOptions = LexicographicOptions = {}));
    let TextFileContentProvider = TextFileContentProvider_1 = class TextFileContentProvider extends lifecycle_1.Disposable {
        constructor(textFileService, fileService, languageService, modelService) {
            super();
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.fileWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        static async open(resource, scheme, label, editorService, options) {
            await editorService.openEditor({
                original: { resource: TextFileContentProvider_1.resourceToTextFile(scheme, resource) },
                modified: { resource },
                label,
                options
            });
        }
        static resourceToTextFile(scheme, resource) {
            return resource.with({ scheme, query: JSON.stringify({ scheme: resource.scheme, query: resource.query }) });
        }
        static textFileToResource(resource) {
            const { scheme, query } = JSON.parse(resource.query);
            return resource.with({ scheme, query });
        }
        async provideTextContent(resource) {
            if (!resource.query) {
                // We require the URI to use the `query` to transport the original scheme and query
                // as done by `resourceToTextFile`
                return null;
            }
            const savedFileResource = TextFileContentProvider_1.textFileToResource(resource);
            // Make sure our text file is resolved up to date
            const codeEditorModel = await this.resolveEditorModel(resource);
            // Make sure to keep contents up to date when it changes
            if (!this.fileWatcherDisposable.value) {
                const disposables = new lifecycle_1.DisposableStore();
                this.fileWatcherDisposable.value = disposables;
                disposables.add(this.fileService.onDidFilesChange(changes => {
                    if (changes.contains(savedFileResource, 0 /* FileChangeType.UPDATED */)) {
                        this.resolveEditorModel(resource, false /* do not create if missing */); // update model when resource changes
                    }
                }));
                if (codeEditorModel) {
                    disposables.add(event_1.Event.once(codeEditorModel.onWillDispose)(() => this.fileWatcherDisposable.clear()));
                }
            }
            return codeEditorModel;
        }
        async resolveEditorModel(resource, createAsNeeded = true) {
            const savedFileResource = TextFileContentProvider_1.textFileToResource(resource);
            const content = await this.textFileService.readStream(savedFileResource);
            let codeEditorModel = this.modelService.getModel(resource);
            if (codeEditorModel) {
                this.modelService.updateModel(codeEditorModel, content.value);
            }
            else if (createAsNeeded) {
                const textFileModel = this.modelService.getModel(savedFileResource);
                let languageSelector;
                if (textFileModel) {
                    languageSelector = this.languageService.createById(textFileModel.getLanguageId());
                }
                else {
                    languageSelector = this.languageService.createByFilepathOrFirstLine(savedFileResource);
                }
                codeEditorModel = this.modelService.createModel(content.value, languageSelector, resource);
            }
            return codeEditorModel;
        }
    };
    exports.TextFileContentProvider = TextFileContentProvider;
    exports.TextFileContentProvider = TextFileContentProvider = TextFileContentProvider_1 = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, files_1.IFileService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService)
    ], TextFileContentProvider);
    class OpenEditor {
        static { this.COUNTER = 0; }
        constructor(_editor, _group) {
            this._editor = _editor;
            this._group = _group;
            this.id = OpenEditor.COUNTER++;
        }
        get editor() {
            return this._editor;
        }
        get group() {
            return this._group;
        }
        get groupId() {
            return this._group.id;
        }
        getId() {
            return `openeditor:${this.groupId}:${this.id}`;
        }
        isPreview() {
            return !this._group.isPinned(this.editor);
        }
        isSticky() {
            return this._group.isSticky(this.editor);
        }
        getResource() {
            return editor_1.EditorResourceAccessor.getOriginalUri(this.editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
        }
    }
    exports.OpenEditor = OpenEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2NvbW1vbi9maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0JoRzs7T0FFRztJQUNVLFFBQUEsVUFBVSxHQUFHLHlCQUF5QixDQUFDO0lBRXBEOztPQUVHO0lBQ1UsUUFBQSxPQUFPLEdBQUcsNkJBQTZCLENBQUM7SUFFckQ7O09BRUc7SUFDVSxRQUFBLDZCQUE2QixHQUFHLElBQUksMEJBQWEsQ0FBVSx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSw0Q0FBNEMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvTSxRQUFBLHlCQUF5QixHQUFHLElBQUksMEJBQWEsQ0FBVSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSwyRkFBMkYsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsUCxRQUFBLHFCQUFxQixHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSx5REFBeUQsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN6TixRQUFBLCtCQUErQixHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSwwREFBMEQsQ0FBQyxFQUFF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