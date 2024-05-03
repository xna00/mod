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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/editor/browser/dnd", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/treeViewsDnd", "vs/editor/common/services/treeViewsDndService", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/inlineProgress/browser/inlineProgress", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dnd/browser/dnd", "vs/platform/instantiation/common/instantiation", "./edit", "./postEditWidget"], function (require, exports, arrays_1, async_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, dnd_1, range_1, languageFeatures_1, treeViewsDnd_1, treeViewsDndService_1, editorState_1, inlineProgress_1, nls_1, configuration_1, contextkey_1, dnd_2, instantiation_1, edit_1, postEditWidget_1) {
    "use strict";
    var DropIntoEditorController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropIntoEditorController = exports.dropWidgetVisibleCtx = exports.changeDropTypeCommandId = exports.defaultProviderConfig = void 0;
    exports.defaultProviderConfig = 'editor.experimental.dropIntoEditor.defaultProvider';
    exports.changeDropTypeCommandId = 'editor.changeDropType';
    exports.dropWidgetVisibleCtx = new contextkey_1.RawContextKey('dropWidgetVisible', false, (0, nls_1.localize)('dropWidgetVisible', "Whether the drop widget is showing"));
    let DropIntoEditorController = class DropIntoEditorController extends lifecycle_1.Disposable {
        static { DropIntoEditorController_1 = this; }
        static { this.ID = 'editor.contrib.dropIntoEditorController'; }
        static get(editor) {
            return editor.getContribution(DropIntoEditorController_1.ID);
        }
        constructor(editor, instantiationService, _configService, _languageFeaturesService, _treeViewsDragAndDropService) {
            super();
            this._configService = _configService;
            this._languageFeaturesService = _languageFeaturesService;
            this._treeViewsDragAndDropService = _treeViewsDragAndDropService;
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this._dropProgressManager = this._register(instantiationService.createInstance(inlineProgress_1.InlineProgressManager, 'dropIntoEditor', editor));
            this._postDropWidgetManager = this._register(instantiationService.createInstance(postEditWidget_1.PostEditWidgetManager, 'dropIntoEditor', editor, exports.dropWidgetVisibleCtx, { id: exports.changeDropTypeCommandId, label: (0, nls_1.localize)('postDropWidgetTitle', "Show drop options...") }));
            this._register(editor.onDropIntoEditor(e => this.onDropIntoEditor(editor, e.position, e.event)));
        }
        clearWidgets() {
            this._postDropWidgetManager.clear();
        }
        changeDropType() {
            this._postDropWidgetManager.tryShowSelector();
        }
        async onDropIntoEditor(editor, position, dragEvent) {
            if (!dragEvent.dataTransfer || !editor.hasModel()) {
                return;
            }
            this._currentOperation?.cancel();
            editor.focus();
            editor.setPosition(position);
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */, undefined, token);
                try {
                    const ourDataTransfer = await this.extractDataTransferData(dragEvent);
                    if (ourDataTransfer.size === 0 || tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    const model = editor.getModel();
                    if (!model) {
                        return;
                    }
                    const providers = this._languageFeaturesService.documentOnDropEditProvider
                        .ordered(model)
                        .filter(provider => {
                        if (!provider.dropMimeTypes) {
                            // Keep all providers that don't specify mime types
                            return true;
                        }
                        return provider.dropMimeTypes.some(mime => ourDataTransfer.matches(mime));
                    });
                    const edits = await this.getDropEdits(providers, model, position, ourDataTransfer, tokenSource);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    if (edits.length) {
                        const activeEditIndex = this.getInitialActiveEditIndex(model, edits);
                        const canShowWidget = editor.getOption(36 /* EditorOption.dropIntoEditor */).showDropSelector === 'afterDrop';
                        // Pass in the parent token here as it tracks cancelling the entire drop operation
                        await this._postDropWidgetManager.applyEditAndShowIfNeeded([range_1.Range.fromPositions(position)], { activeEditIndex, allEdits: edits }, canShowWidget, async (edit) => edit, token);
                    }
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentOperation === p) {
                        this._currentOperation = undefined;
                    }
                }
            });
            this._dropProgressManager.showWhile(position, (0, nls_1.localize)('dropIntoEditorProgress', "Running drop handlers. Click to cancel"), p);
            this._currentOperation = p;
        }
        async getDropEdits(providers, model, position, dataTransfer, tokenSource) {
            const results = await (0, async_1.raceCancellation)(Promise.all(providers.map(async (provider) => {
                try {
                    const edits = await provider.provideDocumentOnDropEdits(model, position, dataTransfer, tokenSource.token);
                    return edits?.map(edit => ({ ...edit, providerId: provider.id }));
                }
                catch (err) {
                    console.error(err);
                }
                return undefined;
            })), tokenSource.token);
            const edits = (0, arrays_1.coalesce)(results ?? []).flat();
            return (0, edit_1.sortEditsByYieldTo)(edits);
        }
        getInitialActiveEditIndex(model, edits) {
            const preferredProviders = this._configService.getValue(exports.defaultProviderConfig, { resource: model.uri });
            for (const [configMime, desiredKindStr] of Object.entries(preferredProviders)) {
                const desiredKind = new hierarchicalKind_1.HierarchicalKind(desiredKindStr);
                const editIndex = edits.findIndex(edit => desiredKind.value === edit.providerId
                    && edit.handledMimeType && (0, dataTransfer_1.matchesMimeType)(configMime, [edit.handledMimeType]));
                if (editIndex >= 0) {
                    return editIndex;
                }
            }
            return 0;
        }
        async extractDataTransferData(dragEvent) {
            if (!dragEvent.dataTransfer) {
                return new dataTransfer_1.VSDataTransfer();
            }
            const dataTransfer = (0, dnd_1.toExternalVSDataTransfer)(dragEvent.dataTransfer);
            if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    for (const id of data) {
                        const treeDataTransfer = await this._treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (treeDataTransfer) {
                            for (const [type, value] of treeDataTransfer) {
                                dataTransfer.replace(type, value);
                            }
                        }
                    }
                }
            }
            return dataTransfer;
        }
    };
    exports.DropIntoEditorController = DropIntoEditorController;
    exports.DropIntoEditorController = DropIntoEditorController = DropIntoEditorController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, treeViewsDndService_1.ITreeViewsDnDService)
    ], DropIntoEditorController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcEludG9FZGl0b3JDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kcm9wT3JQYXN0ZUludG8vYnJvd3Nlci9kcm9wSW50b0VkaXRvckNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRCbkYsUUFBQSxxQkFBcUIsR0FBRyxvREFBb0QsQ0FBQztJQUU3RSxRQUFBLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBRWxELFFBQUEsb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG1CQUFtQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSxvQ0FBb0MsQ0FBQyxDQUFDLENBQUM7SUFFekosSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTs7aUJBRWhDLE9BQUUsR0FBRyx5Q0FBeUMsQUFBNUMsQ0FBNkM7UUFFL0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTJCLDBCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFTRCxZQUNDLE1BQW1CLEVBQ0ksb0JBQTJDLEVBQzNDLGNBQXNELEVBQ25ELHdCQUFtRSxFQUN2RSw0QkFBbUU7WUFFekYsS0FBSyxFQUFFLENBQUM7WUFKZ0MsbUJBQWMsR0FBZCxjQUFjLENBQXVCO1lBQ2xDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDdEQsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUFzQjtZQVB6RSxzQkFBaUIsR0FBRyw0QkFBc0IsQ0FBQyxXQUFXLEVBQThCLENBQUM7WUFXckcsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsb0JB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