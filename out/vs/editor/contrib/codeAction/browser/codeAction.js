/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/model", "vs/editor/contrib/editorState/browser/editorState", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "../common/types", "vs/base/common/hierarchicalKind"], function (require, exports, arrays_1, cancellation_1, errors_1, lifecycle_1, uri_1, bulkEditService_1, range_1, selection_1, languageFeatures_1, model_1, editorState_1, nls, commands_1, notification_1, progress_1, telemetry_1, types_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplyCodeActionReason = exports.fixAllCommandId = exports.organizeImportsCommandId = exports.sourceActionCommandId = exports.refactorPreviewCommandId = exports.refactorCommandId = exports.autoFixCommandId = exports.quickFixCommandId = exports.codeActionCommandId = void 0;
    exports.getCodeActions = getCodeActions;
    exports.applyCodeAction = applyCodeAction;
    exports.codeActionCommandId = 'editor.action.codeAction';
    exports.quickFixCommandId = 'editor.action.quickFix';
    exports.autoFixCommandId = 'editor.action.autoFix';
    exports.refactorCommandId = 'editor.action.refactor';
    exports.refactorPreviewCommandId = 'editor.action.refactor.preview';
    exports.sourceActionCommandId = 'editor.action.sourceAction';
    exports.organizeImportsCommandId = 'editor.action.organizeImports';
    exports.fixAllCommandId = 'editor.action.fixAll';
    class ManagedCodeActionSet extends lifecycle_1.Disposable {
        static codeActionsPreferredComparator(a, b) {
            if (a.isPreferred && !b.isPreferred) {
                return -1;
            }
            else if (!a.isPreferred && b.isPreferred) {
                return 1;
            }
            else {
                return 0;
            }
        }
        static codeActionsComparator({ action: a }, { action: b }) {
            if (a.isAI && !b.isAI) {
                return 1;
            }
            else if (!a.isAI && b.isAI) {
                return -1;
            }
            if ((0, arrays_1.isNonEmptyArray)(a.diagnostics)) {
                return (0, arrays_1.isNonEmptyArray)(b.diagnostics) ? ManagedCodeActionSet.codeActionsPreferredComparator(a, b) : -1;
            }
            else if ((0, arrays_1.isNonEmptyArray)(b.diagnostics)) {
                return 1;
            }
            else {
                return ManagedCodeActionSet.codeActionsPreferredComparator(a, b); // both have no diagnostics
            }
        }
        constructor(actions, documentation, disposables) {
            super();
            this.documentation = documentation;
            this._register(disposables);
            this.allActions = [...actions].sort(ManagedCodeActionSet.codeActionsComparator);
            this.validActions = this.allActions.filter(({ action }) => !action.disabled);
        }
        get hasAutoFix() {
            return this.validActions.some(({ action: fix }) => !!fix.kind && types_1.CodeActionKind.QuickFix.contains(new hierarchicalKind_1.HierarchicalKind(fix.kind)) && !!fix.isPreferred);
        }
        get hasAIFix() {
            return this.validActions.some(({ action: fix }) => !!fix.isAI);
        }
        get allAIFixes() {
            return this.validActions.every(({ action: fix }) => !!fix.isAI);
        }
    }
    const emptyCodeActionsResponse = { actions: [], documentation: undefined };
    async function getCodeActions(registry, model, rangeOrSelection, trigger, progress, token) {
        const filter = trigger.filter || {};
        const notebookFilter = {
            ...filter,
            excludes: [...(filter.excludes || []), types_1.CodeActionKind.Notebook],
        };
        const codeActionContext = {
            only: filter.include?.value,
            trigger: trigger.type,
        };
        const cts = new editorState_1.TextModelCancellationTokenSource(model, token);
        // if the trigger is auto (autosave, lightbulb, etc), we should exclude notebook codeActions
        const excludeNotebookCodeActions = (trigger.type === 2 /* languages.CodeActionTriggerType.Auto */);
        const providers = getCodeActionProviders(registry, model, (excludeNotebookCodeActions) ? notebookFilter : filter);
        const disposables = new lifecycle_1.DisposableStore();
        const promises = providers.map(async (provider) => {
            try {
                progress.report(provider);
                const providedCodeActions = await provider.provideCodeActions(model, rangeOrSelection, codeActionContext, cts.token);
                if (providedCodeActions) {
                    disposables.add(providedCodeActions);
                }
                if (cts.token.isCancellationRequested) {
                    return emptyCodeActionsResponse;
                }
                const filteredActions = (providedCodeActions?.actions || []).filter(action => action && (0, types_1.filtersAction)(filter, action));
                const documentation = getDocumentationFromProvider(provider, filteredActions, filter.include);
                return {
                    actions: filteredActions.map(action => new types_1.CodeActionItem(action, provider)),
                    documentation
                };
            }
            catch (err) {
                if ((0, errors_1.isCancellationError)(err)) {
                    throw err;
                }
                (0, errors_1.onUnexpectedExternalError)(err);
                return emptyCodeActionsResponse;
            }
        });
        const listener = registry.onDidChange(() => {
            const newProviders = registry.all(model);
            if (!(0, arrays_1.equals)(newProviders, providers)) {
                cts.cancel();
            }
        });
        try {
            const actions = await Promise.all(promises);
            const allActions = actions.map(x => x.actions).flat();
            const allDocumentation = [
                ...(0, arrays_1.coalesce)(actions.map(x => x.documentation)),
                ...getAdditionalDocumentationForShowingActions(registry, model, trigger, allActions)
            ];
            return new ManagedCodeActionSet(allActions, allDocumentation, disposables);
        }
        finally {
            listener.dispose();
            cts.dispose();
        }
    }
    function getCodeActionProviders(registry, model, filter) {
        return registry.all(model)
            // Don't include providers that we know will not return code actions of interest
            .filter(provider => {
            if (!provider.providedCodeActionKinds) {
                // We don't know what type of actions this provider will return.
                return true;
            }
            return provider.providedCodeActionKinds.some(kind => (0, types_1.mayIncludeActionsOfKind)(filter, new hierarchicalKind_1.HierarchicalKind(kind)));
        });
    }
    function* getAdditionalDocumentationForShowingActions(registry, model, trigger, actionsToShow) {
        if (model && actionsToShow.length) {
            for (const provider of registry.all(model)) {
                if (provider._getAdditionalMenuItems) {
                    yield* provider._getAdditionalMenuItems?.({ trigger: trigger.type, only: trigger.filter?.include?.value }, actionsToShow.map(item => item.action));
                }
            }
        }
    }
    function getDocumentationFromProvider(provider, providedCodeActions, only) {
        if (!provider.documentation) {
            return undefined;
        }
        const documentation = provider.documentation.map(entry => ({ kind: new hierarchicalKind_1.HierarchicalKind(entry.kind), command: entry.command }));
        if (only) {
            let currentBest;
            for (const entry of documentation) {
                if (entry.kind.contains(only)) {
                    if (!currentBest) {
                        currentBest = entry;
                    }
                    else {
                        // Take best match
                        if (currentBest.kind.contains(entry.kind)) {
                            currentBest = entry;
                        }
                    }
                }
            }
            if (currentBest) {
                return currentBest?.command;
            }
        }
        // Otherwise, check to see if any of the provided actions match.
        for (const action of providedCodeActions) {
            if (!action.kind) {
                continue;
            }
            for (const entry of documentation) {
                if (entry.kind.contains(new hierarchicalKind_1.HierarchicalKind(action.kind))) {
                    return entry.command;
                }
            }
        }
        return undefined;
    }
    var ApplyCodeActionReason;
    (function (ApplyCodeActionReason) {
        ApplyCodeActionReason["OnSave"] = "onSave";
        ApplyCodeActionReason["FromProblemsView"] = "fromProblemsView";
        ApplyCodeActionReason["FromCodeActions"] = "fromCodeActions";
        ApplyCodeActionReason["FromAILightbulb"] = "fromAILightbulb"; // direct invocation when clicking on the AI lightbulb
    })(ApplyCodeActionReason || (exports.ApplyCodeActionReason = ApplyCodeActionReason = {}));
    async function applyCodeAction(accessor, item, codeActionReason, options, token = cancellation_1.CancellationToken.None) {
        const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
        const commandService = accessor.get(commands_1.ICommandService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const notificationService = accessor.get(notification_1.INotificationService);
        telemetryService.publicLog2('codeAction.applyCodeAction', {
            codeActionTitle: item.action.title,
            codeActionKind: item.action.kind,
            codeActionIsPreferred: !!item.action.isPreferred,
            reason: codeActionReason,
        });
        await item.resolve(token);
        if (token.isCancellationRequested) {
            return;
        }
        if (item.action.edit?.edits.length) {
            const result = await bulkEditService.apply(item.action.edit, {
                editor: options?.editor,
                label: item.action.title,
                quotableLabel: item.action.title,
                code: 'undoredo.codeAction',
                respectAutoSaveConfig: codeActionReason !== ApplyCodeActionReason.OnSave,
                showPreview: options?.preview,
            });
            if (!result.isApplied) {
                return;
            }
        }
        if (item.action.command) {
            try {
                await commandService.executeCommand(item.action.command.id, ...(item.action.command.arguments || []));
            }
            catch (err) {
                const message = asMessage(err);
                notificationService.error(typeof message === 'string'
                    ? message
                    : nls.localize('applyCodeActionFailed', "An unknown error occurred while applying the code action"));
            }
        }
    }
    function asMessage(err) {
        if (typeof err === 'string') {
            return err;
        }
        else if (err instanceof Error && typeof err.message === 'string') {
            return err.message;
        }
        else {
            return undefined;
        }
    }
    commands_1.CommandsRegistry.registerCommand('_executeCodeActionProvider', async function (accessor, resource, rangeOrSelection, kind, itemResolveCount) {
        if (!(resource instanceof uri_1.URI)) {
            throw (0, errors_1.illegalArgument)();
        }
        const { codeActionProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const model = accessor.get(model_1.IModelService).getModel(resource);
        if (!model) {
            throw (0, errors_1.illegalArgument)();
        }
        const validatedRangeOrSelection = selection_1.Selection.isISelection(rangeOrSelection)
            ? selection_1.Selection.liftSelection(rangeOrSelection)
            : range_1.Range.isIRange(rangeOrSelection)
                ? model.validateRange(rangeOrSelection)
                : undefined;
        if (!validatedRangeOrSelection) {
            throw (0, errors_1.illegalArgument)();
        }
        const include = typeof kind === 'string' ? new hierarchicalKind_1.HierarchicalKind(kind) : undefined;
        const codeActionSet = await getCodeActions(codeActionProvider, model, validatedRangeOrSelection, { type: 1 /* languages.CodeActionTriggerType.Invoke */, triggerAction: types_1.CodeActionTriggerSource.Default, filter: { includeSourceActions: true, include } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
        const resolving = [];
        const resolveCount = Math.min(codeActionSet.validActions.length, typeof itemResolveCount === 'number' ? itemResolveCount : 0);
        for (let i = 0; i < resolveCount; i++) {
            resolving.push(codeActionSet.validActions[i].resolve(cancellation_1.CancellationToken.None));
        }
        try {
            await Promise.all(resolving);
            return codeActionSet.validActions.map(item => item.action);
        }
        finally {
            setTimeout(() => codeActionSet.dispose(), 100);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29kZUFjdGlvbi9icm93c2VyL2NvZGVBY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkZoRyx3Q0F1RUM7SUFxRkQsMENBaUVDO0lBaFNZLFFBQUEsbUJBQW1CLEdBQUcsMEJBQTBCLENBQUM7SUFDakQsUUFBQSxpQkFBaUIsR0FBRyx3QkFBd0IsQ0FBQztJQUM3QyxRQUFBLGdCQUFnQixHQUFHLHVCQUF1QixDQUFDO0lBQzNDLFFBQUEsaUJBQWlCLEdBQUcsd0JBQXdCLENBQUM7SUFDN0MsUUFBQSx3QkFBd0IsR0FBRyxnQ0FBZ0MsQ0FBQztJQUM1RCxRQUFBLHFCQUFxQixHQUFHLDRCQUE0QixDQUFDO0lBQ3JELFFBQUEsd0JBQXdCLEdBQUcsK0JBQStCLENBQUM7SUFDM0QsUUFBQSxlQUFlLEdBQUcsc0JBQXNCLENBQUM7SUFFdEQsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQUVwQyxNQUFNLENBQUMsOEJBQThCLENBQUMsQ0FBdUIsRUFBRSxDQUF1QjtZQUM3RixJQUFJLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO2lCQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDNUMsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1FBQ0YsQ0FBQztRQUVPLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQWtCLEVBQUUsRUFBRSxN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