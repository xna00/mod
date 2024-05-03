/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/keyCodes", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/position", "vs/editor/common/editorContextKeys", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/message/browser/messageController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/contrib/debug/browser/disassemblyView", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom_1, actions_1, keyCodes_1, editorExtensions_1, codeEditorService_1, position_1, editorContextKeys_1, languageFeatures_1, messageController_1, nls, actions_2, configuration_1, contextkey_1, contextView_1, uriIdentity_1, contextkeys_1, viewsService_1, breakpointsView_1, disassemblyView_1, debug_1, debugUtils_1, disassemblyViewInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionToWatchExpressionsAction = exports.SelectionToReplAction = exports.RunToCursorAction = void 0;
    class ToggleBreakpointAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.debug.action.toggleBreakpoint',
                title: {
                    ...nls.localize2('toggleBreakpointAction', "Debug: Toggle Breakpoint"),
                    mnemonicTitle: nls.localize({ key: 'miToggleBreakpoint', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breakpoint"),
                },
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.editorTextFocus, debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS),
                    primary: 67 /* KeyCode.F9 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menu: {
                    id: actions_2.MenuId.MenubarDebugMenu,
                    when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                    group: '4_new_breakpoint',
                    order: 1
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const debugService = accessor.get(debug_1.IDebugService);
            const activePane = editorService.activeEditorPane;
            if (activePane instanceof disassemblyView_1.DisassemblyView) {
                const location = activePane.focusedAddressAndOffset;
                if (location) {
                    const bps = debugService.getModel().getInstructionBreakpoints();
                    const toRemove = bps.find(bp => bp.address === location.address);
                    if (toRemove) {
                        debugService.removeInstructionBreakpoints(toRemove.instructionReference, toRemove.offset);
                    }
                    else {
                        debugService.addInstructionBreakpoint({ instructionReference: location.reference, offset: location.offset, address: location.address, canPersist: false });
                    }
                }
                return;
            }
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const editor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (editor?.hasModel()) {
                const modelUri = editor.getModel().uri;
                const canSet = debugService.canSetBreakpointsIn(editor.getModel());
                // Does not account for multi line selections, Set to remove multiple cursor on the same line
                const lineNumbers = [...new Set(editor.getSelections().map(s => s.getPosition().lineNumber))];
                await Promise.all(lineNumbers.map(async (line) => {
                    const bps = debugService.getModel().getBreakpoints({ lineNumber: line, uri: modelUri });
                    if (bps.length) {
                        await Promise.all(bps.map(bp => debugService.removeBreakpoints(bp.getId())));
                    }
                    else if (canSet) {
                        await debugService.addBreakpoints(modelUri, [{ lineNumber: line }]);
                    }
                }));
            }
        }
    }
    class ConditionalBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.conditionalBreakpoint',
                label: nls.localize('conditionalBreakpointEditorAction', "Debug: Add Conditional Breakpoint..."),
                alias: 'Debug: Add Conditional Breakpoint...',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                menuOpts: {
                    menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                    title: nls.localize({ key: 'miConditionalBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Conditional Breakpoint..."),
                    group: '1_breakpoints',
                    order: 1,
                    when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.canSetBreakpointsIn(editor.getModel())) {
                editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)?.showBreakpointWidget(position.lineNumber, undefined, 0 /* BreakpointWidgetContext.CONDITION */);
            }
        }
    }
    class LogPointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.addLogPoint',
                label: nls.localize('logPointEditorAction', "Debug: Add Logpoint..."),
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                alias: 'Debug: Add Logpoint...',
                menuOpts: [
                    {
                        menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                        title: nls.localize({ key: 'miLogPoint', comment: ['&& denotes a mnemonic'] }, "&&Logpoint..."),
                        group: '1_breakpoints',
                        order: 4,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                    }
                ]
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.canSetBreakpointsIn(editor.getModel())) {
                editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)?.showBreakpointWidget(position.lineNumber, position.column, 2 /* BreakpointWidgetContext.LOG_MESSAGE */);
            }
        }
    }
    class TriggerByBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.triggerByBreakpoint',
                label: nls.localize('triggerByBreakpointEditorAction', "Debug: Add Triggered Breakpoint..."),
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                alias: 'Debug: Triggered Breakpoint...',
                menuOpts: [
                    {
                        menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                        title: nls.localize({ key: 'miTriggerByBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Triggered Breakpoint..."),
                        group: '1_breakpoints',
                        order: 4,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                    }
                ]
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.canSetBreakpointsIn(editor.getModel())) {
                editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)?.showBreakpointWidget(position.lineNumber, position.column, 3 /* BreakpointWidgetContext.TRIGGER_POINT */);
            }
        }
    }
    class EditBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.editBreakpoint',
                label: nls.localize('EditBreakpointEditorAction', "Debug: Edit Breakpoint"),
                alias: 'Debug: Edit Existing Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                menuOpts: {
                    menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                    title: nls.localize({ key: 'miEditBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Edit Breakpoint"),
                    group: '1_breakpoints',
                    order: 1,
                    when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            const debugModel = debugService.getModel();
            if (!(editor.hasModel() && position)) {
                return;
            }
            const lineBreakpoints = debugModel.getBreakpoints({ lineNumber: position.lineNumber });
            if (lineBreakpoints.length === 0) {
                return;
            }
            const breakpointDistances = lineBreakpoints.map(b => {
                if (!b.column) {
                    return position.column;
                }
                return Math.abs(b.column - position.column);
            });
            const closestBreakpointIndex = breakpointDistances.indexOf(Math.min(...breakpointDistances));
            const closestBreakpoint = lineBreakpoints[closestBreakpointIndex];
            editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)?.showBreakpointWidget(closestBreakpoint.lineNumber, closestBreakpoint.column);
        }
    }
    class OpenDisassemblyViewAction extends actions_2.Action2 {
        static { this.ID = 'debug.action.openDisassemblyView'; }
        constructor() {
            super({
                id: OpenDisassemblyViewAction.ID,
                title: {
                    ...nls.localize2('openDisassemblyView', "Open Disassembly View"),
                    mnemonicTitle: nls.localize({ key: 'miDisassemblyView', comment: ['&& denotes a mnemonic'] }, "&&DisassemblyView"),
                },
                precondition: debug_1.CONTEXT_FOCUSED_STACK_FRAME_HAS_INSTRUCTION_POINTER_REFERENCE,
                menu: [
                    {
                        id: actions_2.MenuId.EditorContext,
                        group: 'debug',
                        order: 5,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkeys_1.PanelFocusContext.toNegated(), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus, debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED, debug_1.CONTEXT_LANGUAGE_SUPPORTS_DISASSEMBLE_REQUEST)
                    },
                    {
                        id: actions_2.MenuId.DebugCallStackContext,
                        group: 'z_commands',
                        order: 50,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'), debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED)
                    },
                    {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED)
                    }
                ]
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            editorService.openEditor(disassemblyViewInput_1.DisassemblyViewInput.instance, { pinned: true, revealIfOpened: true });
        }
    }
    class ToggleDisassemblyViewSourceCodeAction extends actions_2.Action2 {
        static { this.ID = 'debug.action.toggleDisassemblyViewSourceCode'; }
        static { this.configID = 'debug.disassemblyView.showSourceCode'; }
        constructor() {
            super({
                id: ToggleDisassemblyViewSourceCodeAction.ID,
                title: {
                    ...nls.localize2('toggleDisassemblyViewSourceCode', "Toggle Source Code in Disassembly View"),
                    mnemonicTitle: nls.localize({ key: 'mitogglesource', comment: ['&& denotes a mnemonic'] }, "&&ToggleSource"),
                },
                f1: true,
            });
        }
        run(accessor, editor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            if (configService) {
                const value = configService.getValue('debug').disassemblyView.showSourceCode;
                configService.updateValue(ToggleDisassemblyViewSourceCodeAction.configID, !value);
            }
        }
    }
    class RunToCursorAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.debug.action.runToCursor'; }
        static { this.LABEL = nls.localize2('runToCursor', "Run to Cursor"); }
        constructor() {
            super({
                id: RunToCursorAction.ID,
                label: RunToCursorAction.LABEL.value,
                alias: 'Debug: Run to Cursor',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, contextkeys_1.PanelFocusContext.toNegated(), contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.editorTextFocus, debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS)),
                contextMenuOpts: {
                    group: 'debug',
                    order: 2,
                    when: debug_1.CONTEXT_IN_DEBUG_MODE
                }
            });
        }
        async run(accessor, editor) {
            const position = editor.getPosition();
            if (!(editor.hasModel() && position)) {
                return;
            }
            const uri = editor.getModel().uri;
            const debugService = accessor.get(debug_1.IDebugService);
            const viewModel = debugService.getViewModel();
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            let column = undefined;
            const focusedStackFrame = viewModel.focusedStackFrame;
            if (focusedStackFrame && uriIdentityService.extUri.isEqual(focusedStackFrame.source.uri, uri) && focusedStackFrame.range.startLineNumber === position.lineNumber) {
                // If the cursor is on a line different than the one the debugger is currently paused on, then send the breakpoint on the line without a column
                // otherwise set it at the precise column #102199
                column = position.column;
            }
            await debugService.runTo(uri, position.lineNumber, column);
        }
    }
    exports.RunToCursorAction = RunToCursorAction;
    class SelectionToReplAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.debug.action.selectionToRepl'; }
        static { this.LABEL = nls.localize2('evaluateInDebugConsole', "Evaluate in Debug Console"); }
        constructor() {
            super({
                id: SelectionToReplAction.ID,
                label: SelectionToReplAction.LABEL.value,
                alias: 'Debug: Evaluate in Console',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 0
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const viewModel = debugService.getViewModel();
            const session = viewModel.focusedSession;
            if (!editor.hasModel() || !session) {
                return;
            }
            const selection = editor.getSelection();
            let text;
            if (selection.isEmpty()) {
                text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
            }
            else {
                text = editor.getModel().getValueInRange(selection);
            }
            await session.addReplExpression(viewModel.focusedStackFrame, text);
            await viewsService.openView(debug_1.REPL_VIEW_ID, false);
        }
    }
    exports.SelectionToReplAction = SelectionToReplAction;
    class SelectionToWatchExpressionsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.debug.action.selectionToWatch'; }
        static { this.LABEL = nls.localize2('addToWatch', "Add to Watch"); }
        constructor() {
            super({
                id: SelectionToWatchExpressionsAction.ID,
                label: SelectionToWatchExpressionsAction.LABEL.value,
                alias: 'Debug: Add to Watch',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const languageFeaturesService = accessor.get(languageFeatures_1.ILanguageFeaturesService);
            if (!editor.hasModel()) {
                return;
            }
            let expression = undefined;
            const model = editor.getModel();
            const selection = editor.getSelection();
            if (!selection.isEmpty()) {
                expression = model.getValueInRange(selection);
            }
            else {
                const position = editor.getPosition();
                const evaluatableExpression = await (0, debugUtils_1.getEvaluatableExpressionAtPosition)(languageFeaturesService, model, position);
                if (!evaluatableExpression) {
                    return;
                }
                expression = evaluatableExpression.matchingExpression;
            }
            if (!expression) {
                return;
            }
            await viewsService.openView(debug_1.WATCH_VIEW_ID);
            debugService.addWatchExpression(expression);
        }
    }
    exports.SelectionToWatchExpressionsAction = SelectionToWatchExpressionsAction;
    class ShowDebugHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.showDebugHover',
                label: nls.localize('showDebugHover', "Debug: Show Hover"),
                alias: 'Debug: Show Hover',
                precondition: debug_1.CONTEXT_IN_DEBUG_MODE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            const position = editor.getPosition();
            if (!position || !editor.hasModel()) {
                return;
            }
            return editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID)?.showHover(position, true);
        }
    }
    const NO_TARGETS_MESSAGE = nls.localize('editor.debug.action.stepIntoTargets.notAvailable', "Step targets are not available here");
    class StepIntoTargetsAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.debug.action.stepIntoTargets'; }
        static { this.LABEL = nls.localize({ key: 'stepIntoTargets', comment: ['Step Into Targets lets the user step into an exact function he or she is interested in.'] }, "Step Into Target"); }
        constructor() {
            super({
                id: StepIntoTargetsAction.ID,
                label: StepIntoTargetsAction.LABEL,
                alias: 'Debug: Step Into Target',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1.5
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const contextMenuService = accessor.get(contextView_1.IContextMenuService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const session = debugService.getViewModel().focusedSession;
            const frame = debugService.getViewModel().focusedStackFrame;
            const selection = editor.getSelection();
            const targetPosition = selection?.getPosition() || (frame && { lineNumber: frame.range.startLineNumber, column: frame.range.startColumn });
            if (!session || !frame || !editor.hasModel() || !uriIdentityService.extUri.isEqual(editor.getModel().uri, frame.source.uri)) {
                if (targetPosition) {
                    messageController_1.MessageController.get(editor)?.showMessage(NO_TARGETS_MESSAGE, targetPosition);
                }
                return;
            }
            const targets = await session.stepInTargets(frame.frameId);
            if (!targets?.length) {
                messageController_1.MessageController.get(editor)?.showMessage(NO_TARGETS_MESSAGE, targetPosition);
                return;
            }
            // If there is a selection, try to find the best target with a position to step into.
            if (selection) {
                const positionalTargets = [];
                for (const target of targets) {
                    if (target.line) {
                        positionalTargets.push({
                            start: new position_1.Position(target.line, target.column || 1),
                            end: target.endLine ? new position_1.Position(target.endLine, target.endColumn || 1) : undefined,
                            target
                        });
                    }
                }
                positionalTargets.sort((a, b) => b.start.lineNumber - a.start.lineNumber || b.start.column - a.start.column);
                const needle = selection.getPosition();
                // Try to find a target with a start and end that is around the cursor
                // position. Or, if none, whatever is before the cursor.
                const best = positionalTargets.find(t => t.end && needle.isBefore(t.end) && t.start.isBeforeOrEqual(needle)) || positionalTargets.find(t => t.end === undefined && t.start.isBeforeOrEqual(needle));
                if (best) {
                    session.stepIn(frame.thread.threadId, best.target.id);
                    return;
                }
            }
            // Otherwise, show a context menu and have the user pick a target
            editor.revealLineInCenterIfOutsideViewport(frame.range.startLineNumber);
            const cursorCoords = editor.getScrolledVisiblePosition(targetPosition);
            const editorCoords = (0, dom_1.getDomNodePagePosition)(editor.getDomNode());
            const x = editorCoords.left + cursorCoords.left;
            const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
            contextMenuService.showContextMenu({
                getAnchor: () => ({ x, y }),
                getActions: () => {
                    return targets.map(t => new actions_1.Action(`stepIntoTarget:${t.id}`, t.label, undefined, true, () => session.stepIn(frame.thread.threadId, t.id)));
                }
            });
        }
    }
    class GoToBreakpointAction extends editorExtensions_1.EditorAction {
        constructor(isNext, opts) {
            super(opts);
            this.isNext = isNext;
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            if (editor.hasModel()) {
                const currentUri = editor.getModel().uri;
                const currentLine = editor.getPosition().lineNumber;
                //Breakpoints returned from `getBreakpoints` are already sorted.
                const allEnabledBreakpoints = debugService.getModel().getBreakpoints({ enabledOnly: true });
                //Try to find breakpoint in current file
                let moveBreakpoint = this.isNext
                    ? allEnabledBreakpoints.filter(bp => uriIdentityService.extUri.isEqual(bp.uri, currentUri) && bp.lineNumber > currentLine).shift()
                    : allEnabledBreakpoints.filter(bp => uriIdentityService.extUri.isEqual(bp.uri, currentUri) && bp.lineNumber < currentLine).pop();
                //Try to find breakpoints in following files
                if (!moveBreakpoint) {
                    moveBreakpoint =
                        this.isNext
                            ? allEnabledBreakpoints.filter(bp => bp.uri.toString() > currentUri.toString()).shift()
                            : allEnabledBreakpoints.filter(bp => bp.uri.toString() < currentUri.toString()).pop();
                }
                //Move to first or last possible breakpoint
                if (!moveBreakpoint && allEnabledBreakpoints.length) {
                    moveBreakpoint = this.isNext ? allEnabledBreakpoints[0] : allEnabledBreakpoints[allEnabledBreakpoints.length - 1];
                }
                if (moveBreakpoint) {
                    return (0, breakpointsView_1.openBreakpointSource)(moveBreakpoint, false, true, false, debugService, editorService);
                }
            }
        }
    }
    class GoToNextBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(true, {
                id: 'editor.debug.action.goToNextBreakpoint',
                label: nls.localize('goToNextBreakpoint', "Debug: Go to Next Breakpoint"),
                alias: 'Debug: Go to Next Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
            });
        }
    }
    class GoToPreviousBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(false, {
                id: 'editor.debug.action.goToPreviousBreakpoint',
                label: nls.localize('goToPreviousBreakpoint', "Debug: Go to Previous Breakpoint"),
                alias: 'Debug: Go to Previous Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
            });
        }
    }
    class CloseExceptionWidgetAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.closeExceptionWidget',
                label: nls.localize('closeExceptionWidget', "Close Exception Widget"),
                alias: 'Close Exception Widget',
                precondition: debug_1.CONTEXT_EXCEPTION_WIDGET_VISIBLE,
                kbOpts: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            const contribution = editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID);
            contribution?.closeExceptionWidget();
        }
    }
    (0, actions_2.registerAction2)(OpenDisassemblyViewAction);
    (0, actions_2.registerAction2)(ToggleDisassemblyViewSourceCodeAction);
    (0, actions_2.registerAction2)(ToggleBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(ConditionalBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(LogPointAction);
    (0, editorExtensions_1.registerEditorAction)(TriggerByBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(EditBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(RunToCursorAction);
    (0, editorExtensions_1.registerEditorAction)(StepIntoTargetsAction);
    (0, editorExtensions_1.registerEditorAction)(SelectionToReplAction);
    (0, editorExtensions_1.registerEditorAction)(SelectionToWatchExpressionsAction);
    (0, editorExtensions_1.registerEditorAction)(ShowDebugHoverAction);
    (0, editorExtensions_1.registerEditorAction)(GoToNextBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(GoToPreviousBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(CloseExceptionWidgetAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdFZGl0b3JBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnRWRpdG9yQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4QmhHLE1BQU0sc0JBQXVCLFNBQVEsaUJBQU87UUFDM0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHNDQUFzQztnQkFDMUMsS0FBSyxFQUFFO29CQUNOLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSwwQkFBMEIsQ0FBQztvQkFDdEUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHFCQUFxQixDQUFDO2lCQUNySDtnQkFDRCxZQUFZLEVBQUUsbUNBQTJCO2dCQUN6QyxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHFDQUFpQixDQUFDLGVBQWUsRUFBRSxzQ0FBOEIsQ0FBQztvQkFDMUYsT0FBTyxxQkFBWTtvQkFDbkIsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxnQkFBZ0I7b0JBQzNCLElBQUksRUFBRSxtQ0FBMkI7b0JBQ2pDLEtBQUssRUFBRSxrQkFBa0I7b0JBQ3pCLEtBQUssRUFBRSxDQUFDO2lCQUNSO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEI7WUFDbkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxZ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