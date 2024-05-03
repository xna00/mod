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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/model/textModel", "vs/editor/common/languages/languageConfigurationRegistry", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/platform/theme/common/colorRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/css!./linkedEditing"], function (require, exports, arrays, async_1, cancellation_1, color_1, errors_1, event_1, lifecycle_1, strings, uri_1, editorExtensions_1, codeEditorService_1, position_1, range_1, editorContextKeys_1, textModel_1, languageConfigurationRegistry_1, nls, contextkey_1, languageFeatures_1, colorRegistry_1, languageFeatureDebounce_1, stopwatch_1) {
    "use strict";
    var LinkedEditingContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorLinkedEditingBackground = exports.LinkedEditingAction = exports.LinkedEditingContribution = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = void 0;
    exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('LinkedEditingInputVisible', false);
    const DECORATION_CLASS_NAME = 'linked-editing-decoration';
    let LinkedEditingContribution = class LinkedEditingContribution extends lifecycle_1.Disposable {
        static { LinkedEditingContribution_1 = this; }
        static { this.ID = 'editor.contrib.linkedEditing'; }
        static { this.DECORATION = textModel_1.ModelDecorationOptions.register({
            description: 'linked-editing',
            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
            className: DECORATION_CLASS_NAME
        }); }
        static get(editor) {
            return editor.getContribution(LinkedEditingContribution_1.ID);
        }
        constructor(editor, contextKeyService, languageFeaturesService, languageConfigurationService, languageFeatureDebounceService) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._syncRangesToken = 0;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._providers = languageFeaturesService.linkedEditingRangeProvider;
            this._enabled = false;
            this._visibleContextKey = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._debounceInformation = languageFeatureDebounceService.for(this._providers, 'Linked Editing', { max: 200 });
            this._currentDecorations = this._editor.createDecorationsCollection();
            this._languageWordPattern = null;
            this._currentWordPattern = null;
            this._ignoreChangeEvent = false;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._rangeUpdateTriggerPromise = null;
            this._rangeSyncTriggerPromise = null;
            this._currentRequestCts = null;
            this._currentRequestPosition = null;
            this._currentRequestModelVersion = null;
            this._register(this._editor.onDidChangeModel(() => this.reinitialize(true)));
            this._register(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(70 /* EditorOption.linkedEditing */) || e.hasChanged(93 /* EditorOption.renameOnType */)) {
                    this.reinitialize(false);
                }
            }));
            this._register(this._providers.onDidChange(() => this.reinitialize(false)));
            this._register(this._editor.onDidChangeModelLanguage(() => this.reinitialize(true)));
            this.reinitialize(true);
        }
        reinitialize(forceRefresh) {
            const model = this._editor.getModel();
            const isEnabled = model !== null && (this._editor.getOption(70 /* EditorOption.linkedEditing */) || this._editor.getOption(93 /* EditorOption.renameOnType */)) && this._providers.has(model);
            if (isEnabled === this._enabled && !forceRefresh) {
                return;
            }
            this._enabled = isEnabled;
            this.clearRanges();
            this._localToDispose.clear();
            if (!isEnabled || model === null) {
                return;
            }
            this._localToDispose.add(event_1.Event.runAndSubscribe(model.onDidChangeLanguageConfiguration, () => {
                this._languageWordPattern = this.languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getWordDefinition();
            }));
            const rangeUpdateScheduler = new async_1.Delayer(this._debounceInformation.get(model));
            const triggerRangeUpdate = () => {
                this._rangeUpdateTriggerPromise = rangeUpdateScheduler.trigger(() => this.updateRanges(), this._debounceDuration ?? this._debounceInformation.get(model));
            };
            const rangeSyncScheduler = new async_1.Delayer(0);
            const triggerRangeSync = (token) => {
                this._rangeSyncTriggerPromise = rangeSyncScheduler.trigger(() => this._syncRanges(token));
            };
            this._localToDispose.add(this._editor.onDidChangeCursorPosition(() => {
                triggerRangeUpdate();
            }));
            this._localToDispose.add(this._editor.onDidChangeModelContent((e) => {
                if (!this._ignoreChangeEvent) {
                    if (this._currentDecorations.length > 0) {
                        const referenceRange = this._currentDecorations.getRange(0);
                        if (referenceRange && e.changes.every(c => referenceRange.intersectRanges(c.range))) {
                            triggerRangeSync(this._syncRangesToken);
                            return;
                        }
                    }
                }
                triggerRangeUpdate();
            }));
            this._localToDispose.add({
                dispose: () => {
                    rangeUpdateScheduler.dispose();
                    rangeSyncScheduler.dispose();
                }
            });
            this.updateRanges();
        }
        _syncRanges(token) {
            // delayed invocation, make sure we're still on
            if (!this._editor.hasModel() || token !== this._syncRangesToken || this._currentDecorations.length === 0) {
                // nothing to do
                return;
            }
            const model = this._editor.getModel();
            const referenceRange = this._currentDecorations.getRange(0);
            if (!referenceRange || referenceRange.startLineNumber !== referenceRange.endLineNumber) {
                return this.clearRanges();
            }
            const referenceValue = model.getValueInRange(referenceRange);
            if (this._currentWordPattern) {
                const match = referenceValue.match(this._currentWordPattern);
                const matchLength = match ? match[0].length : 0;
                if (matchLength !== referenceValue.length) {
                    return this.clearRanges();
                }
            }
            const edits = [];
            for (let i = 1, len = this._currentDecorations.length; i < len; i++) {
                const mirrorRange = this._currentDecorations.getRange(i);
                if (!mirrorRange) {
                    continue;
                }
                if (mirrorRange.startLineNumber !== mirrorRange.endLineNumber) {
                    edits.push({
                        range: mirrorRange,
                        text: referenceValue
                    });
                }
                else {
                    let oldValue = model.getValueInRange(mirrorRange);
                    let newValue = referenceValue;
                    let rangeStartColumn = mirrorRange.startColumn;
                    let rangeEndColumn = mirrorRange.endColumn;
                    const commonPrefixLength = strings.commonPrefixLength(oldValue, newValue);
                    rangeStartColumn += commonPrefixLength;
                    oldValue = oldValue.substr(commonPrefixLength);
                    newValue = newValue.substr(commonPrefixLength);
                    const commonSuffixLength = strings.commonSuffixLength(oldValue, newValue);
                    rangeEndColumn -= commonSuffixLength;
                    oldValue = oldValue.substr(0, oldValue.length - commonSuffixLength);
                    newValue = newValue.substr(0, newValue.length - commonSuffixLength);
                    if (rangeStartColumn !== rangeEndColumn || newValue.length !== 0) {
                        edits.push({
                            range: new range_1.Range(mirrorRange.startLineNumber, rangeStartColumn, mirrorRange.endLineNumber, rangeEndColumn),
                            text: newValue
                        });
                    }
                }
            }
            if (edits.length === 0) {
                return;
            }
            try {
                this._editor.popUndoStop();
                this._ignoreChangeEvent = true;
                const prevEditOperationType = this._editor._getViewModel().getPrevEditOperationType();
                this._editor.executeEdits('linkedEditing', edits);
                this._editor._getViewModel().setPrevEditOperationType(prevEditOperationType);
            }
            finally {
                this._ignoreChangeEvent = false;
            }
        }
        dispose() {
            this.clearRanges();
            super.dispose();
        }
        clearRanges() {
            this._visibleContextKey.set(false);
            this._currentDecorations.clear();
            if (this._currentRequestCts) {
                this._currentRequestCts.cancel();
                this._currentRequestCts = null;
                this._currentRequestPosition = null;
            }
        }
        get currentUpdateTriggerPromise() {
            return this._rangeUpdateTriggerPromise || Promise.resolve();
        }
        get currentSyncTriggerPromise() {
            return this._rangeSyncTriggerPromise || Promise.resolve();
        }
        async updateRanges(force = false) {
            if (!this._editor.hasModel()) {
                this.clearRanges();
                return;
            }
            const position = this._editor.getPosition();
            if (!this._enabled && !force || this._editor.getSelections().length > 1) {
                // disabled or multicursor
                this.clearRanges();
                return;
            }
            const model = this._editor.getModel();
            const modelVersionId = model.getVersionId();
            if (this._currentRequestPosition && this._currentRequestModelVersion === modelVersionId) {
                if (position.equals(this._currentRequestPosition)) {
                    return; // same position
                }
                if (this._currentDecorations.length > 0) {
                    const range = this._currentDecorations.getRange(0);
                    if (range && range.containsPosition(position)) {
                        return; // just moving inside the existing primary range
                    }
                }
            }
            // Clear existing decorations while we compute new ones
            this.clearRanges();
            this._currentRequestPosition = position;
            this._currentRequestModelVersion = modelVersionId;
            const currentRequestCts = this._currentRequestCts = new cancellation_1.CancellationTokenSource();
            try {
                const sw = new stopwatch_1.StopWatch(false);
                const response = await getLinkedEditingRanges(this._providers, model, position, currentRequestCts.token);
                this._debounceInformation.update(model, sw.elapsed());
                if (currentRequestCts !== this._currentRequestCts) {
                    return;
                }
                this._currentRequestCts = null;
                if (modelVersionId !== model.getVersionId()) {
                    return;
                }
                let ranges = [];
                if (response?.ranges) {
                    ranges = response.ranges;
                }
                this._currentWordPattern = response?.wordPattern || this._languageWordPattern;
                let foundReferenceRange = false;
                for (let i = 0, len = ranges.length; i < len; i++) {
                    if (range_1.Range.containsPosition(ranges[i], position)) {
                        foundReferenceRange = true;
                        if (i !== 0) {
                            const referenceRange = ranges[i];
                            ranges.splice(i, 1);
                            ranges.unshift(referenceRange);
                        }
                        break;
                    }
                }
                if (!foundReferenceRange) {
                    // Cannot do linked editing if the ranges are not where the cursor is...
                    this.clearRanges();
                    return;
                }
                const decorations = ranges.map(range => ({ range: range, options: LinkedEditingContribution_1.DECORATION }));
                this._visibleContextKey.set(true);
                this._currentDecorations.set(decorations);
                this._syncRangesToken++; // cancel any pending syncRanges call
            }
            catch (err) {
                if (!(0, errors_1.isCancellationError)(err)) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                if (this._currentRequestCts === currentRequestCts || !this._currentRequestCts) {
                    // stop if we are still the latest request
                    this.clearRanges();
                }
            }
        }
        // for testing
        setDebounceDuration(timeInMS) {
            this._debounceDuration = timeInMS;
        }
    };
    exports.LinkedEditingContribution = LinkedEditingContribution;
    exports.LinkedEditingContribution = LinkedEditingContribution = LinkedEditingContribution_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], LinkedEditingContribution);
    class LinkedEditingAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.linkedEditing',
                label: nls.localize('linkedEditing.label', "Start Linked Editing"),
                alias: 'Start Linked Editing',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
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
        run(_accessor, editor) {
            const controller = LinkedEditingContribution.get(editor);
            if (controller) {
                return Promise.resolve(controller.updateRanges(true));
            }
            return Promise.resolve();
        }
    }
    exports.LinkedEditingAction = LinkedEditingAction;
    const LinkedEditingCommand = editorExtensions_1.EditorCommand.bindToContribution(LinkedEditingContribution.get);
    (0, editorExtensions_1.registerEditorCommand)(new LinkedEditingCommand({
        id: 'cancelLinkedEditingInput',
        precondition: exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE,
        handler: x => x.clearRanges(),
        kbOpts: {
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            weight: 100 /* KeybindingWeight.EditorContrib */ + 99,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    function getLinkedEditingRanges(providers, model, position, token) {
        const orderedByScore = providers.ordered(model);
        // in order of score ask the linked editing range provider
        // until someone response with a good result
        // (good = not null)
        return (0, async_1.first)(orderedByScore.map(provider => async () => {
            try {
                return await provider.provideLinkedEditingRanges(model, position, token);
            }
            catch (e) {
                (0, errors_1.onUnexpectedExternalError)(e);
                return undefined;
            }
        }), result => !!result && arrays.isNonEmptyArray(result?.ranges));
    }
    exports.editorLinkedEditingBackground = (0, colorRegistry_1.registerColor)('editor.linkedEditingBackground', { dark: color_1.Color.fromHex('#f00').transparent(0.3), light: color_1.Color.fromHex('#f00').transparent(0.3), hcDark: color_1.Color.fromHex('#f00').transparent(0.3), hcLight: color_1.Color.white }, nls.localize('editorLinkedEditingBackground', 'Background color when the editor auto renames on type.'));
    (0, editorExtensions_1.registerModelAndPositionCommand)('_executeLinkedEditingProvider', (_accessor, model, position) => {
        const { linkedEditingRangeProvider } = _accessor.get(languageFeatures_1.ILanguageFeaturesService);
        return getLinkedEditingRanges(linkedEditingRangeProvider, model, position, cancellation_1.CancellationToken.None);
    });
    (0, editorExtensions_1.registerEditorContribution)(LinkedEditingContribution.ID, LinkedEditingContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(LinkedEditingAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkRWRpdGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGlua2VkRWRpdGluZy9icm93c2VyL2xpbmtlZEVkaXRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DbkYsUUFBQSxtQ0FBbUMsR0FBRyxJQUFJLDBCQUFhLENBQVUsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFbEgsTUFBTSxxQkFBcUIsR0FBRywyQkFBMkIsQ0FBQztJQUVuRCxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHNCQUFVOztpQkFFakMsT0FBRSxHQUFHLDhCQUE4QixBQUFqQyxDQUFrQztpQkFFbkMsZUFBVSxHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUNwRSxXQUFXLEVBQUUsZ0JBQWdCO1lBQzdCLFVBQVUsNkRBQXFEO1lBQy9ELFNBQVMsRUFBRSxxQkFBcUI7U0FDaEMsQ0FBQyxBQUpnQyxDQUkvQjtRQUVILE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDN0IsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUE0QiwyQkFBeUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBMkJELFlBQ0MsTUFBbUIsRUFDQyxpQkFBcUMsRUFDL0IsdUJBQWlELEVBQzVDLDRCQUE0RSxFQUMxRSw4QkFBK0Q7WUFFaEcsS0FBSyxFQUFFLENBQUM7WUFId0MsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQVpwRyxxQkFBZ0IsR0FBVyxDQUFDLENBQUM7WUFNcEIsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFVeEUsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIs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