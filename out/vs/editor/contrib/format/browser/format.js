/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/linkedList", "vs/base/common/types", "vs/base/common/uri", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/browser/editorBrowser", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/formattingEdit", "vs/platform/commands/common/commands", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/languageFeatures", "vs/platform/log/common/log", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, arrays_1, cancellation_1, errors_1, iterator_1, linkedList_1, types_1, uri_1, editorState_1, editorBrowser_1, position_1, range_1, selection_1, editorWorker_1, resolverService_1, formattingEdit_1, commands_1, extensions_1, instantiation_1, languageFeatures_1, log_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormattingConflicts = exports.FormattingMode = exports.FormattingKind = void 0;
    exports.getRealAndSyntheticDocumentFormattersOrdered = getRealAndSyntheticDocumentFormattersOrdered;
    exports.formatDocumentRangesWithSelectedProvider = formatDocumentRangesWithSelectedProvider;
    exports.formatDocumentRangesWithProvider = formatDocumentRangesWithProvider;
    exports.formatDocumentWithSelectedProvider = formatDocumentWithSelectedProvider;
    exports.formatDocumentWithProvider = formatDocumentWithProvider;
    exports.getDocumentRangeFormattingEditsUntilResult = getDocumentRangeFormattingEditsUntilResult;
    exports.getDocumentFormattingEditsUntilResult = getDocumentFormattingEditsUntilResult;
    exports.getOnTypeFormattingEdits = getOnTypeFormattingEdits;
    function getRealAndSyntheticDocumentFormattersOrdered(documentFormattingEditProvider, documentRangeFormattingEditProvider, model) {
        const result = [];
        const seen = new extensions_1.ExtensionIdentifierSet();
        // (1) add all document formatter
        const docFormatter = documentFormattingEditProvider.ordered(model);
        for (const formatter of docFormatter) {
            result.push(formatter);
            if (formatter.extensionId) {
                seen.add(formatter.extensionId);
            }
        }
        // (2) add all range formatter as document formatter (unless the same extension already did that)
        const rangeFormatter = documentRangeFormattingEditProvider.ordered(model);
        for (const formatter of rangeFormatter) {
            if (formatter.extensionId) {
                if (seen.has(formatter.extensionId)) {
                    continue;
                }
                seen.add(formatter.extensionId);
            }
            result.push({
                displayName: formatter.displayName,
                extensionId: formatter.extensionId,
                provideDocumentFormattingEdits(model, options, token) {
                    return formatter.provideDocumentRangeFormattingEdits(model, model.getFullModelRange(), options, token);
                }
            });
        }
        return result;
    }
    var FormattingKind;
    (function (FormattingKind) {
        FormattingKind[FormattingKind["File"] = 1] = "File";
        FormattingKind[FormattingKind["Selection"] = 2] = "Selection";
    })(FormattingKind || (exports.FormattingKind = FormattingKind = {}));
    var FormattingMode;
    (function (FormattingMode) {
        FormattingMode[FormattingMode["Explicit"] = 1] = "Explicit";
        FormattingMode[FormattingMode["Silent"] = 2] = "Silent";
    })(FormattingMode || (exports.FormattingMode = FormattingMode = {}));
    class FormattingConflicts {
        static { this._selectors = new linkedList_1.LinkedList(); }
        static setFormatterSelector(selector) {
            const remove = FormattingConflicts._selectors.unshift(selector);
            return { dispose: remove };
        }
        static async select(formatter, document, mode, kind) {
            if (formatter.length === 0) {
                return undefined;
            }
            const selector = iterator_1.Iterable.first(FormattingConflicts._selectors);
            if (selector) {
                return await selector(formatter, document, mode, kind);
            }
            return undefined;
        }
    }
    exports.FormattingConflicts = FormattingConflicts;
    async function formatDocumentRangesWithSelectedProvider(accessor, editorOrModel, rangeOrRanges, mode, progress, token, userGesture) {
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const { documentRangeFormattingEditProvider: documentRangeFormattingEditProviderRegistry } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = (0, editorBrowser_1.isCodeEditor)(editorOrModel) ? editorOrModel.getModel() : editorOrModel;
        const provider = documentRangeFormattingEditProviderRegistry.ordered(model);
        const selected = await FormattingConflicts.select(provider, model, mode, 2 /* FormattingKind.Selection */);
        if (selected) {
            progress.report(selected);
            await instaService.invokeFunction(formatDocumentRangesWithProvider, selected, editorOrModel, rangeOrRanges, token, userGesture);
        }
    }
    async function formatDocumentRangesWithProvider(accessor, provider, editorOrModel, rangeOrRanges, token, userGesture) {
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const logService = accessor.get(log_1.ILogService);
        const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
        let model;
        let cts;
        if ((0, editorBrowser_1.isCodeEditor)(editorOrModel)) {
            model = editorOrModel.getModel();
            cts = new editorState_1.EditorStateCancellationTokenSource(editorOrModel, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */, undefined, token);
        }
        else {
            model = editorOrModel;
            cts = new editorState_1.TextModelCancellationTokenSource(editorOrModel, token);
        }
        // make sure that ranges don't overlap nor touch each other
        const ranges = [];
        let len = 0;
        for (const range of (0, arrays_1.asArray)(rangeOrRanges).sort(range_1.Range.compareRangesUsingStarts)) {
            if (len > 0 && range_1.Range.areIntersectingOrTouching(ranges[len - 1], range)) {
                ranges[len - 1] = range_1.Range.fromPositions(ranges[len - 1].getStartPosition(), range.getEndPosition());
            }
            else {
                len = ranges.push(range);
            }
        }
        const computeEdits = async (range) => {
            logService.trace(`[format][provideDocumentRangeFormattingEdits] (request)`, provider.extensionId?.value, range);
            const result = (await provider.provideDocumentRangeFormattingEdits(model, range, model.getFormattingOptions(), cts.token)) || [];
            logService.trace(`[format][provideDocumentRangeFormattingEdits] (response)`, provider.extensionId?.value, result);
            return result;
        };
        const hasIntersectingEdit = (a, b) => {
            if (!a.length || !b.length) {
                return false;
            }
            // quick exit if the list of ranges are completely unrelated [O(n)]
            const mergedA = a.reduce((acc, val) => { return range_1.Range.plusRange(acc, val.range); }, a[0].range);
            if (!b.some(x => { return range_1.Range.intersectRanges(mergedA, x.range); })) {
                return false;
            }
            // fallback to a complete check [O(n^2)]
            for (const edit of a) {
                for (const otherEdit of b) {
                    if (range_1.Range.intersectRanges(edit.range, otherEdit.range)) {
                        return true;
                    }
                }
            }
            return false;
        };
        const allEdits = [];
        const rawEditsList = [];
        try {
            if (typeof provider.provideDocumentRangesFormattingEdits === 'function') {
                logService.trace(`[format][provideDocumentRangeFormattingEdits] (request)`, provider.extensionId?.value, ranges);
                const result = (await provider.provideDocumentRangesFormattingEdits(model, ranges, model.getFormattingOptions(), cts.token)) || [];
                logService.trace(`[format][provideDocumentRangeFormattingEdits] (response)`, provider.extensionId?.value, result);
                rawEditsList.push(result);
            }
            else {
                for (const range of ranges) {
                    if (cts.token.isCancellationRequested) {
                        return true;
                    }
                    rawEditsList.push(await computeEdits(range));
                }
                for (let i = 0; i < ranges.length; ++i) {
                    for (let j = i + 1; j < ranges.length; ++j) {
                        if (cts.token.isCancellationRequested) {
                            return true;
                        }
                        if (hasIntersectingEdit(rawEditsList[i], rawEditsList[j])) {
                            // Merge ranges i and j into a single range, recompute the associated edits
                            const mergedRange = range_1.Range.plusRange(ranges[i], ranges[j]);
                            const edits = await computeEdits(mergedRange);
                            ranges.splice(j, 1);
                            ranges.splice(i, 1);
                            ranges.push(mergedRange);
                            rawEditsList.splice(j, 1);
                            rawEditsList.splice(i, 1);
                            rawEditsList.push(edits);
                            // Restart scanning
                            i = 0;
                            j = 0;
                        }
                    }
                }
            }
            for (const rawEdits of rawEditsList) {
                if (cts.token.isCancellationRequested) {
                    return true;
                }
                const minimalEdits = await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
                if (minimalEdits) {
                    allEdits.push(...minimalEdits);
                }
            }
        }
        finally {
            cts.dispose();
        }
        if (allEdits.length === 0) {
            return false;
        }
        if ((0, editorBrowser_1.isCodeEditor)(editorOrModel)) {
            // use editor to apply edits
            formattingEdit_1.FormattingEdit.execute(editorOrModel, allEdits, true);
            editorOrModel.revealPositionInCenterIfOutsideViewport(editorOrModel.getPosition(), 1 /* ScrollType.Immediate */);
        }
        else {
            // use model to apply edits
            const [{ range }] = allEdits;
            const initialSelection = new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
            model.pushEditOperations([initialSelection], allEdits.map(edit => {
                return {
                    text: edit.text,
                    range: range_1.Range.lift(edit.range),
                    forceMoveMarkers: true
                };
            }), undoEdits => {
                for (const { range } of undoEdits) {
                    if (range_1.Range.areIntersectingOrTouching(range, initialSelection)) {
                        return [new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)];
                    }
                }
                return null;
            });
        }
        accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.format, { userGesture });
        return true;
    }
    async function formatDocumentWithSelectedProvider(accessor, editorOrModel, mode, progress, token, userGesture) {
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = (0, editorBrowser_1.isCodeEditor)(editorOrModel) ? editorOrModel.getModel() : editorOrModel;
        const provider = getRealAndSyntheticDocumentFormattersOrdered(languageFeaturesService.documentFormattingEditProvider, languageFeaturesService.documentRangeFormattingEditProvider, model);
        const selected = await FormattingConflicts.select(provider, model, mode, 1 /* FormattingKind.File */);
        if (selected) {
            progress.report(selected);
            await instaService.invokeFunction(formatDocumentWithProvider, selected, editorOrModel, mode, token, userGesture);
        }
    }
    async function formatDocumentWithProvider(accessor, provider, editorOrModel, mode, token, userGesture) {
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
        let model;
        let cts;
        if ((0, editorBrowser_1.isCodeEditor)(editorOrModel)) {
            model = editorOrModel.getModel();
            cts = new editorState_1.EditorStateCancellationTokenSource(editorOrModel, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */, undefined, token);
        }
        else {
            model = editorOrModel;
            cts = new editorState_1.TextModelCancellationTokenSource(editorOrModel, token);
        }
        let edits;
        try {
            const rawEdits = await provider.provideDocumentFormattingEdits(model, model.getFormattingOptions(), cts.token);
            edits = await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            if (cts.token.isCancellationRequested) {
                return true;
            }
        }
        finally {
            cts.dispose();
        }
        if (!edits || edits.length === 0) {
            return false;
        }
        if ((0, editorBrowser_1.isCodeEditor)(editorOrModel)) {
            // use editor to apply edits
            formattingEdit_1.FormattingEdit.execute(editorOrModel, edits, mode !== 2 /* FormattingMode.Silent */);
            if (mode !== 2 /* FormattingMode.Silent */) {
                editorOrModel.revealPositionInCenterIfOutsideViewport(editorOrModel.getPosition(), 1 /* ScrollType.Immediate */);
            }
        }
        else {
            // use model to apply edits
            const [{ range }] = edits;
            const initialSelection = new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
            model.pushEditOperations([initialSelection], edits.map(edit => {
                return {
                    text: edit.text,
                    range: range_1.Range.lift(edit.range),
                    forceMoveMarkers: true
                };
            }), undoEdits => {
                for (const { range } of undoEdits) {
                    if (range_1.Range.areIntersectingOrTouching(range, initialSelection)) {
                        return [new selection_1.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn)];
                    }
                }
                return null;
            });
        }
        accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.format, { userGesture });
        return true;
    }
    async function getDocumentRangeFormattingEditsUntilResult(workerService, languageFeaturesService, model, range, options, token) {
        const providers = languageFeaturesService.documentRangeFormattingEditProvider.ordered(model);
        for (const provider of providers) {
            const rawEdits = await Promise.resolve(provider.provideDocumentRangeFormattingEdits(model, range, options, token)).catch(errors_1.onUnexpectedExternalError);
            if ((0, arrays_1.isNonEmptyArray)(rawEdits)) {
                return await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            }
        }
        return undefined;
    }
    async function getDocumentFormattingEditsUntilResult(workerService, languageFeaturesService, model, options, token) {
        const providers = getRealAndSyntheticDocumentFormattersOrdered(languageFeaturesService.documentFormattingEditProvider, languageFeaturesService.documentRangeFormattingEditProvider, model);
        for (const provider of providers) {
            const rawEdits = await Promise.resolve(provider.provideDocumentFormattingEdits(model, options, token)).catch(errors_1.onUnexpectedExternalError);
            if ((0, arrays_1.isNonEmptyArray)(rawEdits)) {
                return await workerService.computeMoreMinimalEdits(model.uri, rawEdits);
            }
        }
        return undefined;
    }
    function getOnTypeFormattingEdits(workerService, languageFeaturesService, model, position, ch, options, token) {
        const providers = languageFeaturesService.onTypeFormattingEditProvider.ordered(model);
        if (providers.length === 0) {
            return Promise.resolve(undefined);
        }
        if (providers[0].autoFormatTriggerCharacters.indexOf(ch) < 0) {
            return Promise.resolve(undefined);
        }
        return Promise.resolve(providers[0].provideOnTypeFormattingEdits(model, position, ch, options, token)).catch(errors_1.onUnexpectedExternalError).then(edits => {
            return workerService.computeMoreMinimalEdits(model.uri, edits);
        });
    }
    commands_1.CommandsRegistry.registerCommand('_executeFormatRangeProvider', async function (accessor, ...args) {
        const [resource, range, options] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const reference = await resolverService.createModelReference(resource);
        try {
            return getDocumentRangeFormattingEditsUntilResult(workerService, languageFeaturesService, reference.object.textEditorModel, range_1.Range.lift(range), options, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
    commands_1.CommandsRegistry.registerCommand('_executeFormatDocumentProvider', async function (accessor, ...args) {
        const [resource, options] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const reference = await resolverService.createModelReference(resource);
        try {
            return getDocumentFormattingEditsUntilResult(workerService, languageFeaturesService, reference.object.textEditorModel, options, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
    commands_1.CommandsRegistry.registerCommand('_executeFormatOnTypeProvider', async function (accessor, ...args) {
        const [resource, position, ch, options] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(resource));
        (0, types_1.assertType)(position_1.Position.isIPosition(position));
        (0, types_1.assertType)(typeof ch === 'string');
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const reference = await resolverService.createModelReference(resource);
        try {
            return getOnTypeFormattingEdits(workerService, languageFeaturesService, reference.object.textEditorModel, position_1.Position.lift(position), ch, options, cancellation_1.CancellationToken.None);
        }
        finally {
            reference.dispose();
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9mb3JtYXQvYnJvd3Nlci9mb3JtYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0JoRyxvR0FtQ0M7SUFxQ0QsNEZBbUJDO0lBRUQsNEVBNEpDO0lBRUQsZ0ZBa0JDO0lBRUQsZ0VBd0VDO0lBRUQsZ0dBaUJDO0lBRUQsc0ZBZ0JDO0lBRUQsNERBdUJDO0lBclpELFNBQWdCLDRDQUE0QyxDQUMzRCw4QkFBdUYsRUFDdkYsbUNBQWlHLEVBQ2pHLEtBQWlCO1FBRWpCLE1BQU0sTUFBTSxHQUFxQyxFQUFFLENBQUM7UUFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxtQ0FBc0IsRUFBRSxDQUFDO1FBRTFDLGlDQUFpQztRQUNqQyxNQUFNLFlBQVksR0FBRyw4QkFBOEIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkUsS0FBSyxNQUFNLFNBQVMsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUN0QyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVELGlHQUFpRztRQUNqRyxNQUFNLGNBQWMsR0FBRyxtQ0FBbUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUUsS0FBSyxNQUFNLFNBQVMsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUN4QyxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxD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