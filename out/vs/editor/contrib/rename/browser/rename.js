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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/bulkEditService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/textResourceConfiguration", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "./renameWidget"], function (require, exports, aria_1, async_1, cancellation_1, errors_1, htmlContent_1, lifecycle_1, types_1, uri_1, editorExtensions_1, bulkEditService_1, codeEditorService_1, position_1, range_1, editorContextKeys_1, languageFeatures_1, textResourceConfiguration_1, editorState_1, messageController_1, nls, actions_1, configurationRegistry_1, contextkey_1, instantiation_1, log_1, notification_1, progress_1, platform_1, telemetry_1, renameWidget_1) {
    "use strict";
    var RenameController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameAction = void 0;
    exports.rename = rename;
    class RenameSkeleton {
        constructor(model, position, registry) {
            this.model = model;
            this.position = position;
            this._providerRenameIdx = 0;
            this._providers = registry.ordered(model);
        }
        hasProvider() {
            return this._providers.length > 0;
        }
        async resolveRenameLocation(token) {
            const rejects = [];
            for (this._providerRenameIdx = 0; this._providerRenameIdx < this._providers.length; this._providerRenameIdx++) {
                const provider = this._providers[this._providerRenameIdx];
                if (!provider.resolveRenameLocation) {
                    break;
                }
                const res = await provider.resolveRenameLocation(this.model, this.position, token);
                if (!res) {
                    continue;
                }
                if (res.rejectReason) {
                    rejects.push(res.rejectReason);
                    continue;
                }
                return res;
            }
            // we are here when no provider prepared a location which means we can
            // just rely on the word under cursor and start with the first provider
            this._providerRenameIdx = 0;
            const word = this.model.getWordAtPosition(this.position);
            if (!word) {
                return {
                    range: range_1.Range.fromPositions(this.position),
                    text: '',
                    rejectReason: rejects.length > 0 ? rejects.join('\n') : undefined
                };
            }
            return {
                range: new range_1.Range(this.position.lineNumber, word.startColumn, this.position.lineNumber, word.endColumn),
                text: word.word,
                rejectReason: rejects.length > 0 ? rejects.join('\n') : undefined
            };
        }
        async provideRenameEdits(newName, token) {
            return this._provideRenameEdits(newName, this._providerRenameIdx, [], token);
        }
        async _provideRenameEdits(newName, i, rejects, token) {
            const provider = this._providers[i];
            if (!provider) {
                return {
                    edits: [],
                    rejectReason: rejects.join('\n')
                };
            }
            const result = await provider.provideRenameEdits(this.model, this.position, newName, token);
            if (!result) {
                return this._provideRenameEdits(newName, i + 1, rejects.concat(nls.localize('no result', "No result.")), token);
            }
            else if (result.rejectReason) {
                return this._provideRenameEdits(newName, i + 1, rejects.concat(result.rejectReason), token);
            }
            return result;
        }
    }
    async function rename(registry, model, position, newName) {
        const skeleton = new RenameSkeleton(model, position, registry);
        const loc = await skeleton.resolveRenameLocation(cancellation_1.CancellationToken.None);
        if (loc?.rejectReason) {
            return { edits: [], rejectReason: loc.rejectReason };
        }
        return skeleton.provideRenameEdits(newName, cancellation_1.CancellationToken.None);
    }
    // ---  register actions and commands
    let RenameController = class RenameController {
        static { RenameController_1 = this; }
        static { this.ID = 'editor.contrib.renameController'; }
        static get(editor) {
            return editor.getContribution(RenameController_1.ID);
        }
        constructor(editor, _instaService, _notificationService, _bulkEditService, _progressService, _logService, _configService, _languageFeaturesService, _telemetryService) {
            this.editor = editor;
            this._instaService = _instaService;
            this._notificationService = _notificationService;
            this._bulkEditService = _bulkEditService;
            this._progressService = _progressService;
            this._logService = _logService;
            this._configService = _configService;
            this._languageFeaturesService = _languageFeaturesService;
            this._telemetryService = _telemetryService;
            this._disposableStore = new lifecycle_1.DisposableStore();
            this._cts = new cancellation_1.CancellationTokenSource();
            this._renameWidget = this._disposableStore.add(this._instaService.createInstance(renameWidget_1.RenameWidget, this.editor, ['acceptRenameInput', 'acceptRenameInputWithPreview']));
        }
        dispose() {
            this._disposableStore.dispose();
            this._cts.dispose(true);
        }
        async run() {
            const trace = this._logService.trace.bind(this._logService, '[rename]');
            // set up cancellation token to prevent reentrant rename, this
            // is the parent to the resolve- and rename-tokens
            this._cts.dispose(true);
            this._cts = new cancellation_1.CancellationTokenSource();
            if (!this.editor.hasModel()) {
                trace('editor has no model');
                return undefined;
            }
            const position = this.editor.getPosition();
            const skeleton = new RenameSkeleton(this.editor.getModel(), position, this._languageFeaturesService.renameProvider);
            if (!skeleton.hasProvider()) {
                trace('skeleton has no provider');
                return undefined;
            }
            // part 1 - resolve rename location
            const cts1 = new editorState_1.EditorStateCancellationTokenSource(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */, undefined, this._cts.token);
            let loc;
            try {
                trace('resolving rename location');
                const resolveLocationOperation = skeleton.resolveRenameLocation(cts1.token);
                this._progressService.showWhile(resolveLocationOperation, 250);
                loc = await resolveLocationOperation;
                trace('resolved rename location');
            }
            catch (e) {
                if (e instanceof errors_1.CancellationError) {
                    trace('resolve rename location cancelled', JSON.stringify(e, null, '\t'));
                }
                else {
                    trace('resolve rename location failed', e instanceof Error ? e : JSON.stringify(e, null, '\t'));
                    if (typeof e === 'string' || (0, htmlContent_1.isMarkdownString)(e)) {
                        messageController_1.MessageController.get(this.editor)?.showMessage(e || nls.localize('resolveRenameLocationFailed', "An unknown error occurred while resolving rename location"), position);
                    }
                }
                return undefined;
            }
            finally {
                cts1.dispose();
            }
            if (!loc) {
                trace('returning early - no loc');
                return undefined;
            }
            if (loc.rejectReason) {
                trace(`returning early - rejected with reason: ${loc.rejectReason}`, loc.rejectReason);
                messageController_1.MessageController.get(this.editor)?.showMessage(loc.rejectReason, position);
                return undefined;
            }
            if (cts1.token.isCancellationRequested) {
                trace('returning early - cts1 cancelled');
                return undefined;
            }
            // part 2 - do rename at location
            const cts2 = new editorState_1.EditorStateCancellationTokenSource(this.editor, 4 /* CodeEditorStateFlag.Position */ | 1 /* CodeEditorStateFlag.Value */, loc.range, this._cts.token);
            const model = this.editor.getModel(); // @ulugbekna: assumes editor still has a model, otherwise, cts1 should've been cancelled
            const newSymbolNamesProviders = this._languageFeaturesService.newSymbolNamesProvider.all(model);
            const requestRenameSuggestions = (cts) => newSymbolNamesProviders.map(p => p.provideNewSymbolNames(model, loc.range, cts));
            trace('creating rename input field and awaiting its result');
            const supportPreview = this._bulkEditService.hasPreviewHandler() && this._configService.getValue(this.editor.getModel().uri, 'editor.rename.enablePreview');
            const inputFieldResult = await this._renameWidget.getInput(loc.range, loc.text, supportPreview, requestRenameSuggestions, cts2);
            trace('received response from rename input field');
            if (newSymbolNamesProviders.length > 0) { // @ulugbekna: we're interested only in telemetry for rename suggestions currently
                this._reportTelemetry(newSymbolNamesProviders.length, model.getLanguageId(), inputFieldResult);
            }
            // no result, only hint to focus the editor or not
            if (typeof inputFieldResult === 'boolean') {
                trace(`returning early - rename input field response - ${inputFieldResult}`);
                if (inputFieldResult) {
                    this.editor.focus();
                }
                cts2.dispose();
                return undefined;
            }
            this.editor.focus();
            trace('requesting rename edits');
            const renameOperation = (0, async_1.raceCancellation)(skeleton.provideRenameEdits(inputFieldResult.newName, cts2.token), cts2.token).then(async (renameResult) => {
                if (!renameResult) {
                    trace('returning early - no rename edits result');
                    return;
                }
                if (!this.editor.hasModel()) {
                    trace('returning early - no model after rename edits are provided');
                    return;
                }
                if (renameResult.rejectReason) {
                    trace(`returning early - rejected with reason: ${renameResult.rejectReason}`);
                    this._notificationService.info(renameResult.rejectReason);
                    return;
                }
                // collapse selection to active end
                this.editor.setSelection(range_1.Range.fromPositions(this.editor.getSelection().getPosition()));
                trace('applying edits');
                this._bulkEditService.apply(renameResult, {
                    editor: this.editor,
                    showPreview: inputFieldResult.wantsPreview,
                    label: nls.localize('label', "Renaming '{0}' to '{1}'", loc?.text, inputFieldResult.newName),
                    code: 'undoredo.rename',
                    quotableLabel: nls.localize('quotableLabel', "Renaming {0} to {1}", loc?.text, inputFieldResult.newName),
                    respectAutoSaveConfig: true
                }).then(result => {
                    trace('edits applied');
                    if (result.ariaSummary) {
                        (0, aria_1.alert)(nls.localize('aria', "Successfully renamed '{0}' to '{1}'. Summary: {2}", loc.text, inputFieldResult.newName, result.ariaSummary));
                    }
                }).catch(err => {
                    trace(`error when applying edits ${JSON.stringify(err, null, '\t')}`);
                    this._notificationService.error(nls.localize('rename.failedApply', "Rename failed to apply edits"));
                    this._logService.error(err);
                });
            }, err => {
                trace('error when providing rename edits', JSON.stringify(err, null, '\t'));
                this._notificationService.error(nls.localize('rename.failed', "Rename failed to compute edits"));
                this._logService.error(err);
            }).finally(() => {
                cts2.dispose();
            });
            trace('returning rename operation');
            this._progressService.showWhile(renameOperation, 250);
            return renameOperation;
        }
        acceptRenameInput(wantsPreview) {
            this._renameWidget.acceptInput(wantsPreview);
        }
        cancelRenameInput() {
            this._renameWidget.cancelInput(true, 'cancelRenameInput command');
        }
        focusNextRenameSuggestion() {
            this._renameWidget.focusNextRenameSuggestion();
        }
        focusPreviousRenameSuggestion() {
            this._renameWidget.focusPreviousRenameSuggestion();
        }
        _reportTelemetry(nRenameSuggestionProviders, languageId, inputFieldResult) {
            const value = typeof inputFieldResult === 'boolean'
                ? {
                    kind: 'cancelled',
                    languageId,
                    nRenameSuggestionProviders,
                }
                : {
                    kind: 'accepted',
                    languageId,
                    nRenameSuggestionProviders,
                    source: inputFieldResult.stats.source.k,
                    nRenameSuggestions: inputFieldResult.stats.nRenameSuggestions,
                    timeBeforeFirstInputFieldEdit: inputFieldResult.stats.timeBeforeFirstInputFieldEdit,
                    wantsPreview: inputFieldResult.wantsPreview,
                };
            this._telemetryService.publicLog2('renameInvokedEvent', value);
        }
    };
    RenameController = RenameController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, bulkEditService_1.IBulkEditService),
        __param(4, progress_1.IEditorProgressService),
        __param(5, log_1.ILogService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, telemetry_1.ITelemetryService)
    ], RenameController);
    // ---- action implementation
    class RenameAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.rename',
                label: nls.localize('rename.label', "Rename Symbol"),
                alias: 'Rename Symbol',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.1
                }
            });
        }
        runCommand(accessor, args) {
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
            if (uri_1.URI.isUri(uri) && position_1.Position.isIPosition(pos)) {
                return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                    if (!editor) {
                        return;
                    }
                    editor.setPosition(pos);
                    editor.invokeWithinContext(accessor => {
                        this.reportTelemetry(accessor, editor);
                        return this.run(accessor, editor);
                    });
                }, errors_1.onUnexpectedError);
            }
            return super.runCommand(accessor, args);
        }
        run(accessor, editor) {
            const logService = accessor.get(log_1.ILogService);
            const controller = RenameController.get(editor);
            if (controller) {
                logService.trace('[RenameAction] got controller, running...');
                return controller.run();
            }
            logService.trace('[RenameAction] returning early - controller missing');
            return Promise.resolve();
        }
    }
    exports.RenameAction = RenameAction;
    (0, editorExtensions_1.registerEditorContribution)(RenameController.ID, RenameController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorAction)(RenameAction);
    const RenameCommand = editorExtensions_1.EditorCommand.bindToContribution(RenameController.get);
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'acceptRenameInput',
        precondition: renameWidget_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.acceptRenameInput(false),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, contextkey_1.ContextKeyExpr.not('isComposing')),
            primary: 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'acceptRenameInputWithPreview',
        precondition: contextkey_1.ContextKeyExpr.and(renameWidget_1.CONTEXT_RENAME_INPUT_VISIBLE, contextkey_1.ContextKeyExpr.has('config.editor.rename.enablePreview')),
        handler: x => x.acceptRenameInput(true),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, contextkey_1.ContextKeyExpr.not('isComposing')),
            primary: 2048 /* KeyMod.CtrlCmd */ + 3 /* KeyCode.Enter */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new RenameCommand({
        id: 'cancelRenameInput',
        precondition: renameWidget_1.CONTEXT_RENAME_INPUT_VISIBLE,
        handler: x => x.cancelRenameInput(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, actions_1.registerAction2)(class FocusNextRenameSuggestion extends actions_1.Action2 {
        constructor() {
            super({
                id: 'focusNextRenameSuggestion',
                title: {
                    ...nls.localize2('focusNextRenameSuggestion', "Focus Next Rename Suggestion"),
                },
                precondition: renameWidget_1.CONTEXT_RENAME_INPUT_VISIBLE,
                keybinding: [
                    {
                        primary: 2 /* KeyCode.Tab */,
                        secondary: [18 /* KeyCode.DownArrow */],
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
                    }
                ]
            });
        }
        run(accessor) {
            const currentEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!currentEditor) {
                return;
            }
            const controller = RenameController.get(currentEditor);
            if (!controller) {
                return;
            }
            controller.focusNextRenameSuggestion();
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousRenameSuggestion extends actions_1.Action2 {
        constructor() {
            super({
                id: 'focusPreviousRenameSuggestion',
                title: {
                    ...nls.localize2('focusPreviousRenameSuggestion', "Focus Previous Rename Suggestion"),
                },
                precondition: renameWidget_1.CONTEXT_RENAME_INPUT_VISIBLE,
                keybinding: [
                    {
                        primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
                        secondary: [16 /* KeyCode.UpArrow */],
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
                    }
                ]
            });
        }
        run(accessor) {
            const currentEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (!currentEditor) {
                return;
            }
            const controller = RenameController.get(currentEditor);
            if (!controller) {
                return;
            }
            controller.focusPreviousRenameSuggestion();
        }
    });
    // ---- api bridge command
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeDocumentRenameProvider', function (accessor, model, position, ...args) {
        const [newName] = args;
        (0, types_1.assertType)(typeof newName === 'string');
        const { renameProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return rename(renameProvider, model, position, newName);
    });
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executePrepareRename', async function (accessor, model, position) {
        const { renameProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const skeleton = new RenameSkeleton(model, position, renameProvider);
        const loc = await skeleton.resolveRenameLocation(cancellation_1.CancellationToken.None);
        if (loc?.rejectReason) {
            throw new Error(loc.rejectReason);
        }
        return loc;
    });
    //todo@jrieken use editor options world
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'editor',
        properties: {
            'editor.rename.enablePreview': {
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                description: nls.localize('enablePreview', "Enable/disable the ability to preview changes before renaming"),
                default: true,
                type: 'boolean'
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuYW1lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9yZW5hbWUvYnJvd3Nlci9yZW5hbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXNIaEcsd0JBT0M7SUF0RkQsTUFBTSxjQUFjO1FBS25CLFlBQ2tCLEtBQWlCLEVBQ2pCLFFBQWtCLEVBQ25DLFFBQWlEO1lBRmhDLFVBQUssR0FBTCxLQUFLLENBQVk7WUFDakIsYUFBUSxHQUFSLFFBQVEsQ0FBVTtZQUo1Qix1QkFBa0IsR0FBVyxDQUFDLENBQUM7WUFPdEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxXQUFXO1lBQ1YsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUF3QjtZQUVuRCxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUM7WUFFN0IsS0FBSyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxDQUFDO2dCQUMvRyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ3JDLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxNQUFNLEdBQUcsR0FBRyxNQUFNLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFF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