/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, event_1, debug_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewModel = void 0;
    class ViewModel {
        constructor(contextKeyService) {
            this.contextKeyService = contextKeyService;
            this.firstSessionStart = true;
            this._onDidFocusSession = new event_1.Emitter();
            this._onDidFocusThread = new event_1.Emitter();
            this._onDidFocusStackFrame = new event_1.Emitter();
            this._onDidSelectExpression = new event_1.Emitter();
            this._onDidEvaluateLazyExpression = new event_1.Emitter();
            this._onWillUpdateViews = new event_1.Emitter();
            this._onDidChangeVisualization = new event_1.Emitter();
            this.visualized = new WeakMap();
            this.preferredVisualizers = new Map();
            contextKeyService.bufferChangeEvents(() => {
                this.expressionSelectedContextKey = debug_1.CONTEXT_EXPRESSION_SELECTED.bindTo(contextKeyService);
                this.loadedScriptsSupportedContextKey = debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED.bindTo(contextKeyService);
                this.stepBackSupportedContextKey = debug_1.CONTEXT_STEP_BACK_SUPPORTED.bindTo(contextKeyService);
                this.focusedSessionIsAttach = debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.bindTo(contextKeyService);
                this.focusedSessionIsNoDebug = debug_1.CONTEXT_FOCUSED_SESSION_IS_NO_DEBUG.bindTo(contextKeyService);
                this.restartFrameSupportedContextKey = debug_1.CONTEXT_RESTART_FRAME_SUPPORTED.bindTo(contextKeyService);
                this.stepIntoTargetsSupported = debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED.bindTo(contextKeyService);
                this.jumpToCursorSupported = debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED.bindTo(contextKeyService);
                this.setVariableSupported = debug_1.CONTEXT_SET_VARIABLE_SUPPORTED.bindTo(contextKeyService);
                this.setDataBreakpointAtByteSupported = debug_1.CONTEXT_SET_DATA_BREAKPOINT_BYTES_SUPPORTED.bindTo(contextKeyService);
                this.setExpressionSupported = debug_1.CONTEXT_SET_EXPRESSION_SUPPORTED.bindTo(contextKeyService);
                this.multiSessionDebug = debug_1.CONTEXT_MULTI_SESSION_DEBUG.bindTo(contextKeyService);
                this.terminateDebuggeeSupported = debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED.bindTo(contextKeyService);
                this.suspendDebuggeeSupported = debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED.bindTo(contextKeyService);
                this.disassembleRequestSupported = debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED.bindTo(contextKeyService);
                this.focusedStackFrameHasInstructionPointerReference = debug_1.CONTEXT_FOCUSED_STACK_FRAME_HAS_INSTRUCTION_POINTER_REFERENCE.bindTo(contextKeyService);
            });
        }
        getId() {
            return 'root';
        }
        get focusedSession() {
            return this._focusedSession;
        }
        get focusedThread() {
            return this._focusedThread;
        }
        get focusedStackFrame() {
            return this._focusedStackFrame;
        }
        setFocus(stackFrame, thread, session, explicit) {
            const shouldEmitForStackFrame = this._focusedStackFrame !== stackFrame;
            const shouldEmitForSession = this._focusedSession !== session;
            const shouldEmitForThread = this._focusedThread !== thread;
            this._focusedStackFrame = stackFrame;
            this._focusedThread = thread;
            this._focusedSession = session;
            this.contextKeyService.bufferChangeEvents(() => {
                this.loadedScriptsSupportedContextKey.set(!!session?.capabilities.supportsLoadedSourcesRequest);
                this.stepBackSupportedContextKey.set(!!session?.capabilities.supportsStepBack);
                this.restartFrameSupportedContextKey.set(!!session?.capabilities.supportsRestartFrame);
                this.stepIntoTargetsSupported.set(!!session?.capabilities.supportsStepInTargetsRequest);
                this.jumpToCursorSupported.set(!!session?.capabilities.supportsGotoTargetsRequest);
                this.setVariableSupported.set(!!session?.capabilities.supportsSetVariable);
                this.setDataBreakpointAtByteSupported.set(!!session?.capabilities.supportsDataBreakpointBytes);
                this.setExpressionSupported.set(!!session?.capabilities.supportsSetExpression);
                this.terminateDebuggeeSupported.set(!!session?.capabilities.supportTerminateDebuggee);
                this.suspendDebuggeeSupported.set(!!session?.capabilities.supportSuspendDebuggee);
                this.disassembleRequestSupported.set(!!session?.capabilities.supportsDisassembleRequest);
                this.focusedStackFrameHasInstructionPointerReference.set(!!stackFrame?.instructionPointerReference);
                const attach = !!session && (0, debugUtils_1.isSessionAttach)(session);
                this.focusedSessionIsAttach.set(attach);
                this.focusedSessionIsNoDebug.set(!!session && !!session.configuration.noDebug);
            });
            if (shouldEmitForSession) {
                this._onDidFocusSession.fire(session);
            }
            // should not call onDidFocusThread if onDidFocusStackFrame is called.
            if (shouldEmitForStackFrame) {
                this._onDidFocusStackFrame.fire({ stackFrame, explicit, session });
            }
            else if (shouldEmitForThread) {
                this._onDidFocusThread.fire({ thread, explicit, session });
            }
        }
        get onDidFocusSession() {
            return this._onDidFocusSession.event;
        }
        get onDidFocusThread() {
            return this._onDidFocusThread.event;
        }
        get onDidFocusStackFrame() {
            return this._onDidFocusStackFrame.event;
        }
        get onDidChangeVisualization() {
            return this._onDidChangeVisualization.event;
        }
        getSelectedExpression() {
            return this.selectedExpression;
        }
        setSelectedExpression(expression, settingWatch) {
            this.selectedExpression = expression ? { expression, settingWatch: settingWatch } : undefined;
            this.expressionSelectedContextKey.set(!!expression);
            this._onDidSelectExpression.fire(this.selectedExpression);
        }
        get onDidSelectExpression() {
            return this._onDidSelectExpression.event;
        }
        get onDidEvaluateLazyExpression() {
            return this._onDidEvaluateLazyExpression.event;
        }
        updateViews() {
            this._onWillUpdateViews.fire();
        }
        get onWillUpdateViews() {
            return this._onWillUpdateViews.event;
        }
        isMultiSessionView() {
            return !!this.multiSessionDebug.get();
        }
        setMultiSessionView(isMultiSessionView) {
            this.multiSessionDebug.set(isMultiSessionView);
        }
        setVisualizedExpression(original, visualized) {
            const current = this.visualized.get(original) || original;
            const key = this.getPreferredVisualizedKey(original);
            if (visualized) {
                this.visualized.set(original, visualized);
                this.preferredVisualizers.set(key, visualized.treeId);
            }
            else {
                this.visualized.delete(original);
                this.preferredVisualizers.delete(key);
            }
            this._onDidChangeVisualization.fire({ original: current, replacement: visualized || original });
        }
        getVisualizedExpression(expression) {
            return this.visualized.get(expression) || this.preferredVisualizers.get(this.getPreferredVisualizedKey(expression));
        }
        async evaluateLazyExpression(expression) {
            await expression.evaluateLazy();
            this._onDidEvaluateLazyExpression.fire(expression);
        }
        getPreferredVisualizedKey(expr) {
            return JSON.stringify([
                expr.name,
                expr.type,
                !!expr.memoryReference,
            ].join('\0'));
        }
    }
    exports.ViewModel = ViewModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z1ZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxTQUFTO1FBa0NyQixZQUFvQixpQkFBcUM7WUFBckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQWhDekQsc0JBQWlCLEdBQUcsSUFBSSxDQUFDO1lBTVIsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQTZCLENBQUM7WUFDOUQsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQTBGLENBQUM7WUFDMUgsMEJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQWtHLENBQUM7WUFDdEksMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQWtFLENBQUM7WUFDdkcsaUNBQTRCLEdBQUcsSUFBSSxlQUFPLEVBQXdCLENBQUM7WUFDbkUsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUN6Qyw4QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBdUQsQ0FBQztZQUMvRixlQUFVLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7WUFDckQseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQWlELENBQUM7WUFtQmhHLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRTtnQkFDekMsSUFBSSxDQUFDLDRCQUE0QixHQUFHLG1DQUEyQixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMxRixJQUFJLENBQUMsZ0NBQWdDLEdBQUcsd0NBQWdDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ25HLElBQUksQ0FBQywyQkFBMkIsR0FBRyxtQ0FBMkIsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENB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