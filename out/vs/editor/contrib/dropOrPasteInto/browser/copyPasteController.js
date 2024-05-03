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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/dataTransfer", "vs/base/common/hierarchicalKind", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/platform", "vs/base/common/uuid", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/dnd", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/editor/contrib/dropOrPasteInto/browser/edit", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/inlineProgress/browser/inlineProgress", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "./postEditWidget"], function (require, exports, dom_1, arrays_1, async_1, dataTransfer_1, hierarchicalKind_1, lifecycle_1, mime_1, platform, uuid_1, textAreaInput_1, dnd_1, bulkEditService_1, range_1, languages_1, languageFeatures_1, defaultProviders_1, edit_1, editorState_1, inlineProgress_1, messageController_1, nls_1, clipboardService_1, contextkey_1, instantiation_1, progress_1, quickInput_1, postEditWidget_1) {
    "use strict";
    var CopyPasteController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyPasteController = exports.pasteWidgetVisibleCtx = exports.changePasteTypeCommandId = void 0;
    exports.changePasteTypeCommandId = 'editor.changePasteType';
    exports.pasteWidgetVisibleCtx = new contextkey_1.RawContextKey('pasteWidgetVisible', false, (0, nls_1.localize)('pasteWidgetVisible', "Whether the paste widget is showing"));
    const vscodeClipboardMime = 'application/vnd.code.copyMetadata';
    let CopyPasteController = class CopyPasteController extends lifecycle_1.Disposable {
        static { CopyPasteController_1 = this; }
        static { this.ID = 'editor.contrib.copyPasteActionController'; }
        static get(editor) {
            return editor.getContribution(CopyPasteController_1.ID);
        }
        constructor(editor, instantiationService, _bulkEditService, _clipboardService, _languageFeaturesService, _quickInputService, _progressService) {
            super();
            this._bulkEditService = _bulkEditService;
            this._clipboardService = _clipboardService;
            this._languageFeaturesService = _languageFeaturesService;
            this._quickInputService = _quickInputService;
            this._progressService = _progressService;
            this._editor = editor;
            const container = editor.getContainerDomNode();
            this._register((0, dom_1.addDisposableListener)(container, 'copy', e => this.handleCopy(e)));
            this._register((0, dom_1.addDisposableListener)(container, 'cut', e => this.handleCopy(e)));
            this._register((0, dom_1.addDisposableListener)(container, 'paste', e => this.handlePaste(e), true));
            this._pasteProgressManager = this._register(new inlineProgress_1.InlineProgressManager('pasteIntoEditor', editor, instantiationService));
            this._postPasteWidgetManager = this._register(instantiationService.createInstance(postEditWidget_1.PostEditWidgetManager, 'pasteIntoEditor', editor, exports.pasteWidgetVisibleCtx, { id: exports.changePasteTypeCommandId, label: (0, nls_1.localize)('postPasteWidgetTitle', "Show paste options...") }));
        }
        changePasteType() {
            this._postPasteWidgetManager.tryShowSelector();
        }
        pasteAs(preferred) {
            this._editor.focus();
            try {
                this._pasteAsActionContext = { preferred };
                (0, dom_1.getActiveDocument)().execCommand('paste');
            }
            finally {
                this._pasteAsActionContext = undefined;
            }
        }
        clearWidgets() {
            this._postPasteWidgetManager.clear();
        }
        isPasteAsEnabled() {
            return this._editor.getOption(85 /* EditorOption.pasteAs */).enabled
                && !this._editor.getOption(91 /* EditorOption.readOnly */);
        }
        async finishedPaste() {
            await this._currentPasteOperation;
        }
        handleCopy(e) {
            if (!this._editor.hasTextFocus()) {
                return;
            }
            if (platform.isWeb) {
                // Explicitly clear the web resources clipboard.
                // This is needed because on web, the browser clipboard is faked out using an in-memory store.
                // This means the resources clipboard is not properly updated when copying from the editor.
                this._clipboardService.writeResources([]);
            }
            if (!e.clipboardData || !this.isPasteAsEnabled()) {
                return;
            }
            const model = this._editor.getModel();
            const selections = this._editor.getSelections();
            if (!model || !selections?.length) {
                return;
            }
            const enableEmptySelectionClipboard = this._editor.getOption(37 /* EditorOption.emptySelectionClipboard */);
            let ranges = selections;
            const wasFromEmptySelection = selections.length === 1 && selections[0].isEmpty();
            if (wasFromEmptySelection) {
                if (!enableEmptySelectionClipboard) {
                    return;
                }
                ranges = [new range_1.Range(ranges[0].startLineNumber, 1, ranges[0].startLineNumber, 1 + model.getLineLength(ranges[0].startLineNumber))];
            }
            const toCopy = this._editor._getViewModel()?.getPlainTextToCopy(selections, enableEmptySelectionClipboard, platform.isWindows);
            const multicursorText = Array.isArray(toCopy) ? toCopy : null;
            const defaultPastePayload = {
                multicursorText,
                pasteOnNewLine: wasFromEmptySelection,
                mode: null
            };
            const providers = this._languageFeaturesService.documentPasteEditProvider
                .ordered(model)
                .filter(x => !!x.prepareDocumentPaste);
            if (!providers.length) {
                this.setCopyMetadata(e.clipboardData, { defaultPastePayload });
                return;
            }
            const dataTransfer = (0, dnd_1.toVSDataTransfer)(e.clipboardData);
            const providerCopyMimeTypes = providers.flatMap(x => x.copyMimeTypes ?? []);
            // Save off a handle pointing to data that VS Code maintains.
            const handle = (0, uuid_1.generateUuid)();
            this.setCopyMetadata(e.clipboardData, {
                id: handle,
                providerCopyMimeTypes,
                defaultPastePayload
            });
            const promise = (0, async_1.createCancelablePromise)(async (token) => {
                const results = (0, arrays_1.coalesce)(await Promise.all(providers.map(async (provider) => {
                    try {
                        return await provider.prepareDocumentPaste(model, ranges, dataTransfer, token);
                    }
                    catch (err) {
                        console.error(err);
                        return undefined;
                    }
                })));
                // Values from higher priority providers should overwrite values from lower priority ones.
                // Reverse the array to so that the calls to `replace` below will do this
                results.reverse();
                for (const result of results) {
                    for (const [mime, value] of result) {
                        dataTransfer.replace(mime, value);
                    }
                }
                return dataTransfer;
            });
            CopyPasteController_1._currentCopyOperation?.dataTransferPromise.cancel();
            CopyPasteController_1._currentCopyOperation = { handle: handle, dataTransferPromise: promise };
        }
        async handlePaste(e) {
            if (!e.clipboardData || !this._editor.hasTextFocus()) {
                return;
            }
            messageController_1.MessageController.get(this._editor)?.closeMessage();
            this._currentPasteOperation?.cancel();
            this._currentPasteOperation = undefined;
            const model = this._editor.getModel();
            const selections = this._editor.getSelections();
            if (!selections?.length || !model) {
                return;
            }
            if (!this.isPasteAsEnabled()
                && !this._pasteAsActionContext // Still enable if paste as was explicitly requested
            ) {
                return;
            }
            const metadata = this.fetchCopyMetadata(e);
            const dataTransfer = (0, dnd_1.toExternalVSDataTransfer)(e.clipboardData);
            dataTransfer.delete(vscodeClipboardMime);
            const allPotentialMimeTypes = [
                ...e.clipboardData.types,
                ...metadata?.providerCopyMimeTypes ?? [],
                // TODO: always adds `uri-list` because this get set if there are resources in the system clipboard.
                // However we can only check the system clipboard async. For this early check, just add it in.
                // We filter providers again once we have the final dataTransfer we will use.
                mime_1.Mimes.uriList,
            ];
            const allProviders = this._languageFeaturesService.documentPasteEditProvider
                .ordered(model)
                .filter(provider => {
                // Filter out providers that don't match the requested paste types
                const preference = this._pasteAsActionContext?.preferred;
                if (preference) {
                    if (provider.providedPasteEditKinds && !this.providerMatchesPreference(provider, preference)) {
                        return false;
                    }
                }
                // And providers that don't handle any of mime types in the clipboard
                return provider.pasteMimeTypes?.some(type => (0, dataTransfer_1.matchesMimeType)(type, allPotentialMimeTypes));
            });
            if (!allProviders.length) {
                if (this._pasteAsActionContext?.preferred) {
                    this.showPasteAsNoEditMessage(selections, this._pasteAsActionContext.preferred);
                }
                return;
            }
            // Prevent the editor's default paste handler from running.
            // Note that after this point, we are fully responsible for handling paste.
            // If we can't provider a paste for any reason, we need to explicitly delegate pasting back to the editor.
            e.preventDefault();
            e.stopImmediatePropagation();
            if (this._pasteAsActionContext) {
                this.showPasteAsPick(this._pasteAsActionContext.preferred, allProviders, selections, dataTransfer, metadata);
            }
            else {
                this.doPasteInline(allProviders, selections, dataTransfer, metadata, e);
            }
        }
        showPasteAsNoEditMessage(selections, preference) {
            messageController_1.MessageController.get(this._editor)?.showMessage((0, nls_1.localize)('pasteAsError', "No paste edits for '{0}' found", preference instanceof hierarchicalKind_1.HierarchicalKind ? preference.value : preference.providerId), selections[0].getStartPosition());
        }
        doPasteInline(allProviders, selections, dataTransfer, metadata, clipboardEvent) {
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const editor = this._editor;
                if (!editor.hasModel()) {
                    return;
                }
                const model = editor.getModel();
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */, undefined, token);
                try {
                    await this.mergeInDataFromCopy(dataTransfer, metadata, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    const supportedProviders = allProviders.filter(provider => this.isSupportedPasteProvider(provider, dataTransfer));
                    if (!supportedProviders.length
                        || (supportedProviders.length === 1 && supportedProviders[0] instanceof defaultProviders_1.DefaultTextPasteOrDropEditProvider) // Only our default text provider is active
                    ) {
                        return this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                    }
                    const context = {
                        triggerKind: languages_1.DocumentPasteTriggerKind.Automatic,
                    };
                    const providerEdits = await this.getPasteEdits(supportedProviders, dataTransfer, model, selections, context, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // If the only edit returned is our default text edit, use the default paste handler
                    if (providerEdits.length === 1 && providerEdits[0].provider instanceof defaultProviders_1.DefaultTextPasteOrDropEditProvider) {
                        return this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                    }
                    if (providerEdits.length) {
                        const canShowWidget = editor.getOption(85 /* EditorOption.pasteAs */).showPasteSelector === 'afterPaste';
                        return this._postPasteWidgetManager.applyEditAndShowIfNeeded(selections, { activeEditIndex: 0, allEdits: providerEdits }, canShowWidget, async (edit, token) => {
                            const resolved = await edit.provider.resolveDocumentPasteEdit?.(edit, token);
                            if (resolved) {
                                edit.additionalEdit = resolved.additionalEdit;
                            }
                            return edit;
                        }, tokenSource.token);
                    }
                    await this.applyDefaultPasteHandler(dataTransfer, metadata, tokenSource.token, clipboardEvent);
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentPasteOperation === p) {
                        this._currentPasteOperation = undefined;
                    }
                }
            });
            this._pasteProgressManager.showWhile(selections[0].getEndPosition(), (0, nls_1.localize)('pasteIntoEditorProgress', "Running paste handlers. Click to cancel"), p);
            this._currentPasteOperation = p;
        }
        showPasteAsPick(preference, allProviders, selections, dataTransfer, metadata) {
            const p = (0, async_1.createCancelablePromise)(async (token) => {
                const editor = this._editor;
                if (!editor.hasModel()) {
                    return;
                }
                const model = editor.getModel();
                const tokenSource = new editorState_1.EditorStateCancellationTokenSource(editor, 1 /* CodeEditorStateFlag.Value */ | 2 /* CodeEditorStateFlag.Selection */, undefined, token);
                try {
                    await this.mergeInDataFromCopy(dataTransfer, metadata, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // Filter out any providers the don't match the full data transfer we will send them.
                    let supportedProviders = allProviders.filter(provider => this.isSupportedPasteProvider(provider, dataTransfer, preference));
                    if (preference) {
                        // We are looking for a specific edit
                        supportedProviders = supportedProviders.filter(provider => this.providerMatchesPreference(provider, preference));
                    }
                    const context = {
                        triggerKind: languages_1.DocumentPasteTriggerKind.PasteAs,
                        only: preference && preference instanceof hierarchicalKind_1.HierarchicalKind ? preference : undefined,
                    };
                    let providerEdits = await this.getPasteEdits(supportedProviders, dataTransfer, model, selections, context, tokenSource.token);
                    if (tokenSource.token.isCancellationRequested) {
                        return;
                    }
                    // Filter out any edits that don't match the requested kind
                    if (preference) {
                        providerEdits = providerEdits.filter(edit => {
                            if (preference instanceof hierarchicalKind_1.HierarchicalKind) {
                                return preference.contains(edit.kind);
                            }
                            else {
                                return preference.providerId === edit.provider.id;
                            }
                        });
                    }
                    if (!providerEdits.length) {
                        if (context.only) {
                            this.showPasteAsNoEditMessage(selections, context.only);
                        }
                        return;
                    }
                    let pickedEdit;
                    if (preference) {
                        pickedEdit = providerEdits.at(0);
                    }
                    else {
                        const selected = await this._quickInputService.pick(providerEdits.map((edit) => ({
                            label: edit.title,
                            description: edit.kind?.value,
                            edit,
                        })), {
                            placeHolder: (0, nls_1.localize)('pasteAsPickerPlaceholder', "Select Paste Action"),
                        });
                        pickedEdit = selected?.edit;
                    }
                    if (!pickedEdit) {
                        return;
                    }
                    const combinedWorkspaceEdit = (0, edit_1.createCombinedWorkspaceEdit)(model.uri, selections, pickedEdit);
                    await this._bulkEditService.apply(combinedWorkspaceEdit, { editor: this._editor });
                }
                finally {
                    tokenSource.dispose();
                    if (this._currentPasteOperation === p) {
                        this._currentPasteOperation = undefined;
                    }
                }
            });
            this._progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                title: (0, nls_1.localize)('pasteAsProgress', "Running paste handlers"),
            }, () => p);
        }
        setCopyMetadata(dataTransfer, metadata) {
            dataTransfer.setData(vscodeClipboardMime, JSON.stringify(metadata));
        }
        fetchCopyMetadata(e) {
            if (!e.clipboardData) {
                return;
            }
            // Prefer using the clipboard data we saved off
            const rawMetadata = e.clipboardData.getData(vscodeClipboardMime);
            if (rawMetadata) {
                try {
                    return JSON.parse(rawMetadata);
                }
                catch {
                    return undefined;
                }
            }
            // Otherwise try to extract the generic text editor metadata
            const [_, metadata] = textAreaInput_1.ClipboardEventUtils.getTextData(e.clipboardData);
            if (metadata) {
                return {
                    defaultPastePayload: {
                        mode: metadata.mode,
                        multicursorText: metadata.multicursorText ?? null,
                        pasteOnNewLine: !!metadata.isFromEmptySelection,
                    },
                };
            }
            return undefined;
        }
        async mergeInDataFromCopy(dataTransfer, metadata, token) {
            if (metadata?.id && CopyPasteController_1._currentCopyOperation?.handle === metadata.id) {
                const toMergeDataTransfer = await CopyPasteController_1._currentCopyOperation.dataTransferPromise;
                if (token.isCancellationRequested) {
                    return;
                }
                for (const [key, value] of toMergeDataTransfer) {
                    dataTransfer.replace(key, value);
                }
            }
            if (!dataTransfer.has(mime_1.Mimes.uriList)) {
                const resources = await this._clipboardService.readResources();
                if (token.isCancellationRequested) {
                    return;
                }
                if (resources.length) {
                    dataTransfer.append(mime_1.Mimes.uriList, (0, dataTransfer_1.createStringDataTransferItem)(dataTransfer_1.UriList.create(resources)));
                }
            }
        }
        async getPasteEdits(providers, dataTransfer, model, selections, context, token) {
            const results = await (0, async_1.raceCancellation)(Promise.all(providers.map(async (provider) => {
                try {
                    const edits = await provider.provideDocumentPasteEdits?.(model, selections, dataTransfer, context, token);
                    // TODO: dispose of edits
                    return edits?.edits?.map(edit => ({ ...edit, provider }));
                }
                catch (err) {
                    console.error(err);
                }
                return undefined;
            })), token);
            const edits = (0, arrays_1.coalesce)(results ?? []).flat().filter(edit => {
                return !context.only || context.only.contains(edit.kind);
            });
            return (0, edit_1.sortEditsByYieldTo)(edits);
        }
        async applyDefaultPasteHandler(dataTransfer, metadata, token, clipboardEvent) {
            const textDataTransfer = dataTransfer.get(mime_1.Mimes.text) ?? dataTransfer.get('text');
            const text = (await textDataTransfer?.asString()) ?? '';
            if (token.isCancellationRequested) {
                return;
            }
            const payload = {
                clipboardEvent,
                text,
                pasteOnNewLine: metadata?.defaultPastePayload.pasteOnNewLine ?? false,
                multicursorText: metadata?.defaultPastePayload.multicursorText ?? null,
                mode: null,
            };
            this._editor.trigger('keyboard', "paste" /* Handler.Paste */, payload);
        }
        /**
         * Filter out providers if they:
         * - Don't handle any of the data transfer types we have
         * - Don't match the preferred paste kind
         */
        isSupportedPasteProvider(provider, dataTransfer, preference) {
            if (!provider.pasteMimeTypes?.some(type => dataTransfer.matches(type))) {
                return false;
            }
            return !preference || this.providerMatchesPreference(provider, preference);
        }
        providerMatchesPreference(provider, preference) {
            if (preference instanceof hierarchicalKind_1.HierarchicalKind) {
                if (!provider.providedPasteEditKinds) {
                    return true;
                }
                return provider.providedPasteEditKinds.some(providedKind => preference.contains(providedKind));
            }
            else {
                return provider.id === preference.providerId;
            }
        }
    };
    exports.CopyPasteController = CopyPasteController;
    exports.CopyPasteController = CopyPasteController = CopyPasteController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, bulkEditService_1.IBulkEditService),
        __param(3, clipboardService_1.IClipboardService),
        __param(4, languageFeatures_1.ILanguageFeaturesService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, progress_1.IProgressService)
    ], CopyPasteController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weVBhc3RlQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZHJvcE9yUGFzdGVJbnRvL2Jyb3dzZXIvY29weVBhc3RlQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0NuRixRQUFBLHdCQUF3QixHQUFHLHdCQUF3QixDQUFDO0lBRXBELFFBQUEscUJBQXFCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLG9CQUFvQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDLENBQUM7SUFFcEssTUFBTSxtQkFBbUIsR0FBRyxtQ0FBbUMsQ0FBQztJQWlCekQsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTs7aUJBRTNCLE9BQUUsR0FBRywwQ0FBMEMsQUFBN0MsQ0FBOEM7UUFFaEUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQXNCLHFCQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFzQkQsWUFDQyxNQUFtQixFQUNJLG9CQUEyQyxFQUMvQixnQkFBa0MsRUFDakMsaUJBQW9DLEVBQzdCLHdCQUFrRCxFQUN4RCxrQkFBc0MsRUFDeEMsZ0JBQWtDO1lBRXJFLEtBQUssRUFBRSxDQUFDO1lBTjJCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDakMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUM3Qiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3hELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDeEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUlyRSxJQUFJ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