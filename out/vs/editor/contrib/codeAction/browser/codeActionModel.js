/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "../common/types", "./codeAction", "vs/base/common/hierarchicalKind"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, resources_1, editorOptions_1, position_1, selection_1, contextkey_1, progress_1, types_1, codeAction_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionModel = exports.CodeActionsState = exports.APPLY_FIX_ALL_COMMAND_ID = exports.SUPPORTED_CODE_ACTIONS = void 0;
    exports.SUPPORTED_CODE_ACTIONS = new contextkey_1.RawContextKey('supportedCodeAction', '');
    exports.APPLY_FIX_ALL_COMMAND_ID = '_typescript.applyFixAllCodeAction';
    class CodeActionOracle extends lifecycle_1.Disposable {
        constructor(_editor, _markerService, _signalChange, _delay = 250) {
            super();
            this._editor = _editor;
            this._markerService = _markerService;
            this._signalChange = _signalChange;
            this._delay = _delay;
            this._autoTriggerTimer = this._register(new async_1.TimeoutTimer());
            this._register(this._markerService.onMarkerChanged(e => this._onMarkerChanges(e)));
            this._register(this._editor.onDidChangeCursorPosition(() => this._tryAutoTrigger()));
        }
        trigger(trigger) {
            const selection = this._getRangeOfSelectionUnlessWhitespaceEnclosed(trigger);
            this._signalChange(selection ? { trigger, selection } : undefined);
        }
        _onMarkerChanges(resources) {
            const model = this._editor.getModel();
            if (model && resources.some(resource => (0, resources_1.isEqual)(resource, model.uri))) {
                this._tryAutoTrigger();
            }
        }
        _tryAutoTrigger() {
            this._autoTriggerTimer.cancelAndSet(() => {
                this.trigger({ type: 2 /* CodeActionTriggerType.Auto */, triggerAction: types_1.CodeActionTriggerSource.Default });
            }, this._delay);
        }
        _getRangeOfSelectionUnlessWhitespaceEnclosed(trigger) {
            if (!this._editor.hasModel()) {
                return undefined;
            }
            const selection = this._editor.getSelection();
            if (trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                return selection;
            }
            const enabled = this._editor.getOption(65 /* EditorOption.lightbulb */).enabled;
            if (enabled === editorOptions_1.ShowLightbulbIconMode.Off) {
                return undefined;
            }
            else if (enabled === editorOptions_1.ShowLightbulbIconMode.On) {
                return selection;
            }
            else if (enabled === editorOptions_1.ShowLightbulbIconMode.OnCode) {
                const isSelectionEmpty = selection.isEmpty();
                if (!isSelectionEmpty) {
                    return selection;
                }
                const model = this._editor.getModel();
                const { lineNumber, column } = selection.getPosition();
                const line = model.getLineContent(lineNumber);
                if (line.length === 0) {
                    // empty line
                    return undefined;
                }
                else if (column === 1) {
                    // look only right
                    if (/\s/.test(line[0])) {
                        return undefined;
                    }
                }
                else if (column === model.getLineMaxColumn(lineNumber)) {
                    // look only left
                    if (/\s/.test(line[line.length - 1])) {
                        return undefined;
                    }
                }
                else {
                    // look left and right
                    if (/\s/.test(line[column - 2]) && /\s/.test(line[column - 1])) {
                        return undefined;
                    }
                }
            }
            return selection;
        }
    }
    var CodeActionsState;
    (function (CodeActionsState) {
        let Type;
        (function (Type) {
            Type[Type["Empty"] = 0] = "Empty";
            Type[Type["Triggered"] = 1] = "Triggered";
        })(Type = CodeActionsState.Type || (CodeActionsState.Type = {}));
        CodeActionsState.Empty = { type: 0 /* Type.Empty */ };
        class Triggered {
            constructor(trigger, position, _cancellablePromise) {
                this.trigger = trigger;
                this.position = position;
                this._cancellablePromise = _cancellablePromise;
                this.type = 1 /* Type.Triggered */;
                this.actions = _cancellablePromise.catch((e) => {
                    if ((0, errors_1.isCancellationError)(e)) {
                        return emptyCodeActionSet;
                    }
                    throw e;
                });
            }
            cancel() {
                this._cancellablePromise.cancel();
            }
        }
        CodeActionsState.Triggered = Triggered;
    })(CodeActionsState || (exports.CodeActionsState = CodeActionsState = {}));
    const emptyCodeActionSet = Object.freeze({
        allActions: [],
        validActions: [],
        dispose: () => { },
        documentation: [],
        hasAutoFix: false,
        hasAIFix: false,
        allAIFixes: false,
    });
    class CodeActionModel extends lifecycle_1.Disposable {
        constructor(_editor, _registry, _markerService, contextKeyService, _progressService, _configurationService) {
            super();
            this._editor = _editor;
            this._registry = _registry;
            this._markerService = _markerService;
            this._progressService = _progressService;
            this._configurationService = _configurationService;
            this._codeActionOracle = this._register(new lifecycle_1.MutableDisposable());
            this._state = CodeActionsState.Empty;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._disposed = false;
            this._supportedCodeActions = exports.SUPPORTED_CODE_ACTIONS.bindTo(contextKeyService);
            this._register(this._editor.onDidChangeModel(() => this._update()));
            this._register(this._editor.onDidChangeModelLanguage(() => this._update()));
            this._register(this._registry.onDidChange(() => this._update()));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(65 /* EditorOption.lightbulb */)) {
                    this._update();
                }
            }));
            this._update();
        }
        dispose() {
            if (this._disposed) {
                return;
            }
            this._disposed = true;
            super.dispose();
            this.setState(CodeActionsState.Empty, true);
        }
        _settingEnabledNearbyQuickfixes() {
            const model = this._editor?.getModel();
            return this._configurationService ? this._configurationService.getValue('editor.codeActionWidget.includeNearbyQuickFixes', { resource: model?.uri }) : false;
        }
        _update() {
            if (this._disposed) {
                return;
            }
            this._codeActionOracle.value = undefined;
            this.setState(CodeActionsState.Empty);
            const model = this._editor.getModel();
            if (model
                && this._registry.has(model)
                && !this._editor.getOption(91 /* EditorOption.readOnly */)) {
                const supportedActions = this._registry.all(model).flatMap(provider => provider.providedCodeActionKinds ?? []);
                this._supportedCodeActions.set(supportedActions.join(' '));
                this._codeActionOracle.value = new CodeActionOracle(this._editor, this._markerService, trigger => {
                    if (!trigger) {
                        this.setState(CodeActionsState.Empty);
                        return;
                    }
                    const startPosition = trigger.selection.getStartPosition();
                    const actions = (0, async_1.createCancelablePromise)(async (token) => {
                        if (this._settingEnabledNearbyQuickfixes() && trigger.trigger.type === 1 /* CodeActionTriggerType.Invoke */ && (trigger.trigger.triggerAction === types_1.CodeActionTriggerSource.QuickFix || trigger.trigger.filter?.include?.contains(types_1.CodeActionKind.QuickFix))) {
                            const codeActionSet = await (0, codeAction_1.getCodeActions)(this._registry, model, trigger.selection, trigger.trigger, progress_1.Progress.None, token);
                            const allCodeActions = [...codeActionSet.allActions];
                            if (token.isCancellationRequested) {
                                return emptyCodeActionSet;
                            }
                            // Search for quickfixes in the curret code action set.
                            const foundQuickfix = codeActionSet.validActions?.some(action => action.action.kind ? types_1.CodeActionKind.QuickFix.contains(new hierarchicalKind_1.HierarchicalKind(action.action.kind)) : false);
                            const allMarkers = this._markerService.read({ resource: model.uri });
                            if (foundQuickfix) {
                                for (const action of codeActionSet.validActions) {
                                    if (action.action.command?.arguments?.some(arg => typeof arg === 'string' && arg.includes(exports.APPLY_FIX_ALL_COMMAND_ID))) {
                                        action.action.diagnostics = [...allMarkers.filter(marker => marker.relatedInformation)];
                                    }
                                }
                                return { validActions: codeActionSet.validActions, allActions: allCodeActions, documentation: codeActionSet.documentation, hasAutoFix: codeActionSet.hasAutoFix, hasAIFix: codeActionSet.hasAIFix, allAIFixes: codeActionSet.allAIFixes, dispose: () => { codeActionSet.dispose(); } };
                            }
                            else if (!foundQuickfix) {
                                // If markers exists, and there are no quickfixes found or length is zero, check for quickfixes on that line.
                                if (allMarkers.length > 0) {
                                    const currPosition = trigger.selection.getPosition();
                                    let trackedPosition = currPosition;
                                    let distance = Number.MAX_VALUE;
                                    const currentActions = [...codeActionSet.validActions];
                                    for (const marker of allMarkers) {
                                        const col = marker.endColumn;
                                        const row = marker.endLineNumber;
                                        const startRow = marker.startLineNumber;
                                        // Found quickfix on the same line and check relative distance to other markers
                                        if ((row === currPosition.lineNumber || startRow === currPosition.lineNumber)) {
                                            trackedPosition = new position_1.Position(row, col);
                                            const newCodeActionTrigger = {
                                                type: trigger.trigger.type,
                                                triggerAction: trigger.trigger.triggerAction,
                                                filter: { include: trigger.trigger.filter?.include ? trigger.trigger.filter?.include : types_1.CodeActionKind.QuickFix },
                                                autoApply: trigger.trigger.autoApply,
                                                context: { notAvailableMessage: trigger.trigger.context?.notAvailableMessage || '', position: trackedPosition }
                                            };
                                            const selectionAsPosition = new selection_1.Selection(trackedPosition.lineNumber, trackedPosition.column, trackedPosition.lineNumber, trackedPosition.column);
                                            const actionsAtMarker = await (0, codeAction_1.getCodeActions)(this._registry, model, selectionAsPosition, newCodeActionTrigger, progress_1.Progress.None, token);
                                            if (actionsAtMarker.validActions.length !== 0) {
                                                for (const action of actionsAtMarker.validActions) {
                                                    if (action.action.command?.arguments?.some(arg => typeof arg === 'string' && arg.includes(exports.APPLY_FIX_ALL_COMMAND_ID))) {
                                                        action.action.diagnostics = [...allMarkers.filter(marker => marker.relatedInformation)];
                                                    }
                                                }
                                                if (codeActionSet.allActions.length === 0) {
                                                    allCodeActions.push(...actionsAtMarker.allActions);
                                                }
                                                // Already filtered through to only get quickfixes, so no need to filter again.
                                                if (Math.abs(currPosition.column - col) < distance) {
                                                    currentActions.unshift(...actionsAtMarker.validActions);
                                                }
                                                else {
                                                    currentActions.push(...actionsAtMarker.validActions);
                                                }
                                            }
                                            distance = Math.abs(currPosition.column - col);
                                        }
                                    }
                                    const filteredActions = currentActions.filter((action, index, self) => self.findIndex((a) => a.action.title === action.action.title) === index);
                                    filteredActions.sort((a, b) => {
                                        if (a.action.isPreferred && !b.action.isPreferred) {
                                            return -1;
                                        }
                                        else if (!a.action.isPreferred && b.action.isPreferred) {
                                            return 1;
                                        }
                                        else if (a.action.isAI && !b.action.isAI) {
                                            return 1;
                                        }
                                        else if (!a.action.isAI && b.action.isAI) {
                                            return -1;
                                        }
                                        else {
                                            return 0;
                                        }
                                    });
                                    // Only retriggers if actually found quickfix on the same line as cursor
                                    return { validActions: filteredActions, allActions: allCodeActions, documentation: codeActionSet.documentation, hasAutoFix: codeActionSet.hasAutoFix, hasAIFix: codeActionSet.hasAIFix, allAIFixes: codeActionSet.allAIFixes, dispose: () => { codeActionSet.dispose(); } };
                                }
                            }
                        }
                        // temporarilly hiding here as this is enabled/disabled behind a setting.
                        return (0, codeAction_1.getCodeActions)(this._registry, model, trigger.selection, trigger.trigger, progress_1.Progress.None, token);
                    });
                    if (trigger.trigger.type === 1 /* CodeActionTriggerType.Invoke */) {
                        this._progressService?.showWhile(actions, 250);
                    }
                    const newState = new CodeActionsState.Triggered(trigger.trigger, startPosition, actions);
                    let isManualToAutoTransition = false;
                    if (this._state.type === 1 /* CodeActionsState.Type.Triggered */) {
                        // Check if the current state is manual and the new state is automatic
                        isManualToAutoTransition = this._state.trigger.type === 1 /* CodeActionTriggerType.Invoke */ &&
                            newState.type === 1 /* CodeActionsState.Type.Triggered */ &&
                            newState.trigger.type === 2 /* CodeActionTriggerType.Auto */ &&
                            this._state.position !== newState.position;
                    }
                    // Do not trigger state if current state is manual and incoming state is automatic
                    if (!isManualToAutoTransition) {
                        this.setState(newState);
                    }
                }, undefined);
                this._codeActionOracle.value.trigger({ type: 2 /* CodeActionTriggerType.Auto */, triggerAction: types_1.CodeActionTriggerSource.Default });
            }
            else {
                this._supportedCodeActions.reset();
            }
        }
        trigger(trigger) {
            this._codeActionOracle.value?.trigger(trigger);
        }
        setState(newState, skipNotify) {
            if (newState === this._state) {
                return;
            }
            // Cancel old request
            if (this._state.type === 1 /* CodeActionsState.Type.Triggered */) {
                this._state.cancel();
            }
            this._state = newState;
            if (!skipNotify && !this._disposed) {
                this._onDidChangeState.fire(newState);
            }
        }
    }
    exports.CodeActionModel = CodeActionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2Jyb3dzZXIvY29kZUFjdGlvbk1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCbkYsUUFBQSxzQkFBc0IsR0FBRyxJQUFJLDBCQUFhLENBQVMscUJBQXFCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFOUUsUUFBQSx3QkFBd0IsR0FBRyxtQ0FBbUMsQ0FBQztJQU81RSxNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBSXhDLFlBQ2tCLE9BQW9CLEVBQ3BCLGNBQThCLEVBQzlCLGFBQW1FLEVBQ25FLFNBQWlCLEdBQUc7WUFFckMsS0FBSyxFQUFFLENBQUM7WUFMUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ3BCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM5QixrQkFBYSxHQUFiLGFBQWEsQ0FBc0Q7WUFDbkUsV0FBTSxHQUFOLE1BQU0sQ0FBYztZQU5yQixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksb0JBQVksRUFBRSxDQUFDLENBQUM7WUFTdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUVNLE9BQU8sQ0FBQyxPQUEwQjtZQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsNENBQTRDLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsU0FBeUI7WUFDakQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN0QyxJQUFJLEtBQUssSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBQSxtQkFBTyxFQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN2RSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDeEIsQ0FBQztRQUNGLENBQUM7UUFFTyxlQUFlO1lBQ3RCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFO2dCQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxvQ0FBNEIsRUFBRSxhQUFhLEVBQUUsK0JBQXVCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNwRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2pCLENBQUM7UUFFTyw0Q0FBNEMsQ0FBQyxPQUEwQjtZQUM5RSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUM5QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLHlDQUFpQyxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsaUNBQXdCLENBQUMsT0FBTyxDQUFDO1lBQ3ZFLElBQUksT0FBTyxLQUFLLHFDQUFxQixDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLElBQUksT0FBTyxLQUFLLHFDQUFxQixDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO2lCQUFNLElBQUksT0FBTyxLQUFLLHFDQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNyRCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQ3ZCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3ZCLGFBQWE7b0JBQ2IsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7cUJBQU0sSUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLGtCQUFrQjtvQkFDbEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ3hCLE9BQU8sU0FBUyxDQUFDO29CQUNsQixDQUFDO2dCQUNGLENBQUM7cUJBQU0sSUFBSSxNQUFNLEtBQUssS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQzFELGlCQUFpQjtvQkFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDdEMsT0FBTyxTQUFTLENBQUM7b0JBQ2xCLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLHNCQUFzQjtvQkFDdEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNoRSxPQUFPLFNBQVMsQ0FBQztvQkFDbEIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQUVELElBQWlCLGdCQUFnQixDQThCaEM7SUE5QkQsV0FBaUIsZ0JBQWdCO1FBRWhDLElBQWtCLElBQXlCO1FBQTNDLFdBQWtCLElBQUk7WUFBRyxpQ0FBSyxDQUFBO1lBQUUseUNBQVMsQ0FBQTtRQUFDLENBQUMsRUFBekIsSUFBSSxHQUFKLHFCQUFJLEtBQUoscUJBQUksUUFBcUI7UUFFOUIsc0JBQUssR0FBRyxFQUFFLElBQUksb0JBQVksRUFBVyxDQUFDO1FBRW5ELE1BQWEsU0FBUztZQUtyQixZQUNpQixPQUEwQixFQUMxQixRQUFrQixFQUNqQixtQkFBcUQ7Z0JBRnRELFlBQU8sR0FBUCxPQUFPLENBQW1CO2dCQUMxQixhQUFRLEdBQVIsUUFBUSxDQUFVO2dCQUNqQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQWtDO2dCQVA5RCxTQUFJLDBCQUFrQjtnQkFTOUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQWlCLEVBQUU7b0JBQzdELElBQUksSUFBQSw0QkFBbUIsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM1QixPQUFPLGtCQUFrQixDQUFDO29CQUMzQixDQUFDO29CQUNELE1BQU0sQ0FBQyxDQUFDO2dCQUNULENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVNLE1BQU07Z0JBQ1osSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ25DLENBQUM7U0FDRDtRQXJCWSwwQkFBUyxZQXFCckIsQ0FBQTtJQUdGLENBQUMsRUE5QmdCLGdCQUFnQixnQ0FBaEIsZ0JBQWdCLFFBOEJoQztJQUVELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBZ0I7UUFDdkQsVUFBVSxFQUFFLEVBQUU7UUFDZCxZQUFZLEVBQUUsRUFBRTtRQUNoQixPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztRQUNsQixhQUFhLEVBQUUsRUFBRTtRQUNqQixVQUFVLEVBQUUsS0FBSztRQUNqQixRQUFRLEVBQUUsS0FBSztRQUNmLFVBQVUsRUFBRSxLQUFLO0tBQ2pCLENBQUMsQ0FBQztJQUdILE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQVk5QyxZQUNrQixPQUFvQixFQUNwQixTQUFzRCxFQUN0RCxjQUE4QixFQUMvQyxpQkFBcUMsRUFDcEIsZ0JBQXlDLEVBQ3pDLHFCQUE2QztZQUU5RCxLQUFLLEVBQUUsQ0FBQztZQVBTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDcEIsY0FBUyxHQUFULFNBQVMsQ0FBNkM7WUFDdEQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBRTlCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBeUI7WUFDekMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQWhCOUMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFvQixDQUFDLENBQUM7WUFDdkYsV0FBTSxHQUEyQixnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFJL0Msc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQzNFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEQsY0FBUyxHQUFHLEtBQUssQ0FBQztZQVd6QixJQUFJLENBQUMscUJBQXFCLEdBQUcsOEJBQXNCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFOUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMxRCxJQUFJLENBQUMsQ0FBQyxVQUFVLGlDQUF3QixFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUV0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVPLCtCQUErQjtZQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLGlEQUFpRCxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUosQ0FBQztRQUVPLE9BQU87WUFDZCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUV6QyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXRDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEMsSUFBSSxLQUFLO21CQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQzttQkFDekIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsZ0NBQXVCLEVBQ2hELENBQUM7Z0JBQ0YsTUFBTSxnQkFBZ0IsR0FBYSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3pILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBRTNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLEVBQUU7b0JBQ2hHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUN0QyxPQUFPO29CQUNSLENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUUzRCxNQUFNLE9BQU8sR0FBRyxJQUFBLCtCQUF1QixFQUFDLEtBQUssRUFBQyxLQUFLLEVBQUMsRUFBRTt3QkFDckQsSUFBSSxJQUFJLENBQUMsK0JBQStCLEVBQUUsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUkseUNBQWlDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsS0FBSywrQkFBdUIsQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxzQkFBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDblAsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFBLDJCQUFjLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLG1CQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUM1SCxNQUFNLGNBQWMsR0FBRyxDQUFDLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUNyRCxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dDQUNuQyxPQUFPLGtCQUFrQixDQUFDOzRCQUMzQixDQUFDOzRCQUVELHVEQUF1RDs0QkFDdkQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksbUNBQWdCLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDMUssTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7NEJBQ3JFLElBQUksYUFBYSxFQUFFLENBQUM7Z0NBQ25CLEtBQUssTUFBTSxNQUFNLElBQUksYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO29DQUNqRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQ0FBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3Q0FDdEgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29DQUN6RixDQUFDO2dDQUNGLENBQUM7Z0NBQ0QsT0FBTyxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUN4UixDQUFDO2lDQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQ0FDM0IsNkdBQTZHO2dDQUM3RyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0NBQzNCLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7b0NBQ3JELElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQztvQ0FDbkMsSUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztvQ0FDaEMsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQ0FFdkQsS0FBSyxNQUFNLE1BQU0sSUFBSSxVQUFVLEVBQUUsQ0FBQzt3Q0FDakMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQzt3Q0FDN0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQzt3Q0FDakMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQzt3Q0FFeEMsK0VBQStFO3dDQUMvRSxJQUFJLENBQUMsR0FBRyxLQUFLLFlBQVksQ0FBQyxVQUFVLElBQUksUUFBUSxLQUFLLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDOzRDQUMvRSxlQUFlLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzs0Q0FDekMsTUFBTSxvQkFBb0IsR0FBc0I7Z0RBQy9DLElBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUk7Z0RBQzFCLGFBQWEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWE7Z0RBQzVDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsc0JBQWMsQ0FBQyxRQUFRLEVBQUU7Z0RBQ2hILFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVM7Z0RBQ3BDLE9BQU8sRUFBRSxFQUFFLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLG1CQUFtQixJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFOzZDQUMvRyxDQUFDOzRDQUVGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxxQkFBUyxDQUFDLGVBQWUsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0Q0FDbEosTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFBLDJCQUFjLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUUsbUJBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7NENBRXJJLElBQUksZUFBZSxDQUFDLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0RBQy9DLEtBQUssTUFBTSxNQUFNLElBQUksZUFBZSxDQUFDLFlBQVksRUFBRSxDQUFDO29EQUNuRCxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQ0FBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3REFDdEgsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO29EQUN6RixDQUFDO2dEQUNGLENBQUM7Z0RBRUQsSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvREFDM0MsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnREFDcEQsQ0FBQztnREFFRCwrRUFBK0U7Z0RBQy9FLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDO29EQUNwRCxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dEQUN6RCxDQUFDO3FEQUFNLENBQUM7b0RBQ1AsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztnREFDdEQsQ0FBQzs0Q0FDRixDQUFDOzRDQUNELFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7d0NBQ2hELENBQUM7b0NBQ0YsQ0FBQztvQ0FDRCxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUNyRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssS0FBSyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO29DQUUxRSxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO3dDQUM3QixJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQzs0Q0FDbkQsT0FBTyxDQUFDLENBQUMsQ0FBQzt3Q0FDWCxDQUFDOzZDQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDOzRDQUMxRCxPQUFPLENBQUMsQ0FBQzt3Q0FDVixDQUFDOzZDQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDOzRDQUM1QyxPQUFPLENBQUMsQ0FBQzt3Q0FDVixDQUFDOzZDQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDOzRDQUM1QyxPQUFPLENBQUMsQ0FBQyxDQUFDO3dDQUNYLENBQUM7NkNBQU0sQ0FBQzs0Q0FDUCxPQUFPLENBQUMsQ0FBQzt3Q0FDVixDQUFDO29DQUNGLENBQUMsQ0FBQyxDQUFDO29DQUVILHdFQUF3RTtvQ0FDeEUsT0FBTyxFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsYUFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0NBQzdRLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDO3dCQUNELHlFQUF5RTt3QkFDekUsT0FBTyxJQUFBLDJCQUFjLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLG1CQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUN4RyxDQUFDLENBQUMsQ0FBQztvQkFDSCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSx5Q0FBaUMsRUFBRSxDQUFDO3dCQUMzRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDaEQsQ0FBQztvQkFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDekYsSUFBSSx3QkFBd0IsR0FBRyxLQUFLLENBQUM7b0JBQ3JDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLDRDQUFvQyxFQUFFLENBQUM7d0JBQzFELHNFQUFzRTt3QkFDdEUsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSx5Q0FBaUM7NEJBQ25GLFFBQVEsQ0FBQyxJQUFJLDRDQUFvQzs0QkFDakQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLHVDQUErQjs0QkFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQztvQkFDN0MsQ0FBQztvQkFFRCxrRkFBa0Y7b0JBQ2xGLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO3dCQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6QixDQUFDO2dCQUNGLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDZCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksb0NBQTRCLEVBQUUsYUFBYSxFQUFFLCtCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDNUgsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVNLE9BQU8sQ0FBQyxPQUEwQjtZQUN4QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRU8sUUFBUSxDQUFDLFFBQWdDLEVBQUUsVUFBb0I7WUFDdEUsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixPQUFPO1lBQ1IsQ0FBQztZQUVELHFCQUFxQjtZQUNyQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSw0Q0FBb0MsRUFBRSxDQUFDO2dCQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQztZQUV2QixJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFqTkQsMENBaU5DIn0=