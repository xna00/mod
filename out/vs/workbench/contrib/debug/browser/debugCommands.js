/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/ui/list/listWidget", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/extensions/common/extensions", "vs/editor/browser/editorBrowser", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/contextkeys", "vs/platform/commands/common/commands", "vs/editor/common/services/textResourceConfiguration", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/views/common/viewsService", "vs/base/common/objects", "vs/base/common/platform", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/debug/common/loadedScriptsPicker", "vs/workbench/contrib/debug/browser/debugSessionPicker", "vs/workbench/contrib/files/common/files"], function (require, exports, nls, listWidget_1, keybindingsRegistry_1, listService_1, debug_1, debugModel_1, extensions_1, editorBrowser_1, actions_1, editorService_1, editorContextKeys_1, contextkey_1, breakpointsView_1, notification_1, contextkeys_1, contextkeys_2, commands_1, textResourceConfiguration_1, clipboardService_1, configuration_1, quickInput_1, viewsService_1, objects_1, platform_1, debugUtils_1, panecomposite_1, loadedScriptsPicker_1, debugSessionPicker_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEBUG_CONSOLE_QUICK_ACCESS_PREFIX = exports.DEBUG_QUICK_ACCESS_PREFIX = exports.SELECT_DEBUG_SESSION_LABEL = exports.SELECT_DEBUG_CONSOLE_LABEL = exports.CALLSTACK_DOWN_LABEL = exports.CALLSTACK_UP_LABEL = exports.CALLSTACK_BOTTOM_LABEL = exports.CALLSTACK_TOP_LABEL = exports.OPEN_LOADED_SCRIPTS_LABEL = exports.PREV_DEBUG_CONSOLE_LABEL = exports.NEXT_DEBUG_CONSOLE_LABEL = exports.DEBUG_RUN_LABEL = exports.DEBUG_START_LABEL = exports.DEBUG_CONFIGURE_LABEL = exports.SELECT_AND_START_LABEL = exports.FOCUS_SESSION_LABEL = exports.CONTINUE_LABEL = exports.STOP_LABEL = exports.DISCONNECT_AND_SUSPEND_LABEL = exports.DISCONNECT_LABEL = exports.PAUSE_LABEL = exports.STEP_OUT_LABEL = exports.STEP_INTO_TARGET_LABEL = exports.STEP_INTO_LABEL = exports.STEP_OVER_LABEL = exports.RESTART_LABEL = exports.DEBUG_COMMAND_CATEGORY = exports.CALLSTACK_DOWN_ID = exports.CALLSTACK_UP_ID = exports.CALLSTACK_BOTTOM_ID = exports.CALLSTACK_TOP_ID = exports.SHOW_LOADED_SCRIPTS_ID = exports.PREV_DEBUG_CONSOLE_ID = exports.NEXT_DEBUG_CONSOLE_ID = exports.REMOVE_EXPRESSION_COMMAND_ID = exports.SET_EXPRESSION_COMMAND_ID = exports.EDIT_EXPRESSION_COMMAND_ID = exports.DEBUG_RUN_COMMAND_ID = exports.DEBUG_START_COMMAND_ID = exports.DEBUG_CONFIGURE_COMMAND_ID = exports.SELECT_DEBUG_SESSION_ID = exports.SELECT_DEBUG_CONSOLE_ID = exports.SELECT_AND_START_ID = exports.FOCUS_SESSION_ID = exports.JUMP_TO_CURSOR_ID = exports.FOCUS_REPL_ID = exports.CONTINUE_ID = exports.RESTART_FRAME_ID = exports.STOP_ID = exports.DISCONNECT_AND_SUSPEND_ID = exports.DISCONNECT_ID = exports.PAUSE_ID = exports.STEP_OUT_ID = exports.STEP_INTO_TARGET_ID = exports.STEP_INTO_ID = exports.STEP_OVER_ID = exports.TERMINATE_THREAD_ID = exports.RESTART_SESSION_ID = exports.STEP_BACK_ID = exports.REVERSE_CONTINUE_ID = exports.COPY_STACK_TRACE_ID = exports.TOGGLE_INLINE_BREAKPOINT_ID = exports.ADD_CONFIGURATION_ID = void 0;
    exports.ADD_CONFIGURATION_ID = 'debug.addConfiguration';
    exports.TOGGLE_INLINE_BREAKPOINT_ID = 'editor.debug.action.toggleInlineBreakpoint';
    exports.COPY_STACK_TRACE_ID = 'debug.copyStackTrace';
    exports.REVERSE_CONTINUE_ID = 'workbench.action.debug.reverseContinue';
    exports.STEP_BACK_ID = 'workbench.action.debug.stepBack';
    exports.RESTART_SESSION_ID = 'workbench.action.debug.restart';
    exports.TERMINATE_THREAD_ID = 'workbench.action.debug.terminateThread';
    exports.STEP_OVER_ID = 'workbench.action.debug.stepOver';
    exports.STEP_INTO_ID = 'workbench.action.debug.stepInto';
    exports.STEP_INTO_TARGET_ID = 'workbench.action.debug.stepIntoTarget';
    exports.STEP_OUT_ID = 'workbench.action.debug.stepOut';
    exports.PAUSE_ID = 'workbench.action.debug.pause';
    exports.DISCONNECT_ID = 'workbench.action.debug.disconnect';
    exports.DISCONNECT_AND_SUSPEND_ID = 'workbench.action.debug.disconnectAndSuspend';
    exports.STOP_ID = 'workbench.action.debug.stop';
    exports.RESTART_FRAME_ID = 'workbench.action.debug.restartFrame';
    exports.CONTINUE_ID = 'workbench.action.debug.continue';
    exports.FOCUS_REPL_ID = 'workbench.debug.action.focusRepl';
    exports.JUMP_TO_CURSOR_ID = 'debug.jumpToCursor';
    exports.FOCUS_SESSION_ID = 'workbench.action.debug.focusProcess';
    exports.SELECT_AND_START_ID = 'workbench.action.debug.selectandstart';
    exports.SELECT_DEBUG_CONSOLE_ID = 'workbench.action.debug.selectDebugConsole';
    exports.SELECT_DEBUG_SESSION_ID = 'workbench.action.debug.selectDebugSession';
    exports.DEBUG_CONFIGURE_COMMAND_ID = 'workbench.action.debug.configure';
    exports.DEBUG_START_COMMAND_ID = 'workbench.action.debug.start';
    exports.DEBUG_RUN_COMMAND_ID = 'workbench.action.debug.run';
    exports.EDIT_EXPRESSION_COMMAND_ID = 'debug.renameWatchExpression';
    exports.SET_EXPRESSION_COMMAND_ID = 'debug.setWatchExpression';
    exports.REMOVE_EXPRESSION_COMMAND_ID = 'debug.removeWatchExpression';
    exports.NEXT_DEBUG_CONSOLE_ID = 'workbench.action.debug.nextConsole';
    exports.PREV_DEBUG_CONSOLE_ID = 'workbench.action.debug.prevConsole';
    exports.SHOW_LOADED_SCRIPTS_ID = 'workbench.action.debug.showLoadedScripts';
    exports.CALLSTACK_TOP_ID = 'workbench.action.debug.callStackTop';
    exports.CALLSTACK_BOTTOM_ID = 'workbench.action.debug.callStackBottom';
    exports.CALLSTACK_UP_ID = 'workbench.action.debug.callStackUp';
    exports.CALLSTACK_DOWN_ID = 'workbench.action.debug.callStackDown';
    exports.DEBUG_COMMAND_CATEGORY = nls.localize2('debug', 'Debug');
    exports.RESTART_LABEL = nls.localize2('restartDebug', "Restart");
    exports.STEP_OVER_LABEL = nls.localize2('stepOverDebug', "Step Over");
    exports.STEP_INTO_LABEL = nls.localize2('stepIntoDebug', "Step Into");
    exports.STEP_INTO_TARGET_LABEL = nls.localize2('stepIntoTargetDebug', "Step Into Target");
    exports.STEP_OUT_LABEL = nls.localize2('stepOutDebug', "Step Out");
    exports.PAUSE_LABEL = nls.localize2('pauseDebug', "Pause");
    exports.DISCONNECT_LABEL = nls.localize2('disconnect', "Disconnect");
    exports.DISCONNECT_AND_SUSPEND_LABEL = nls.localize2('disconnectSuspend', "Disconnect and Suspend");
    exports.STOP_LABEL = nls.localize2('stop', "Stop");
    exports.CONTINUE_LABEL = nls.localize2('continueDebug', "Continue");
    exports.FOCUS_SESSION_LABEL = nls.localize2('focusSession', "Focus Session");
    exports.SELECT_AND_START_LABEL = nls.localize2('selectAndStartDebugging', "Select and Start Debugging");
    exports.DEBUG_CONFIGURE_LABEL = nls.localize('openLaunchJson', "Open '{0}'", 'launch.json');
    exports.DEBUG_START_LABEL = nls.localize2('startDebug', "Start Debugging");
    exports.DEBUG_RUN_LABEL = nls.localize2('startWithoutDebugging', "Start Without Debugging");
    exports.NEXT_DEBUG_CONSOLE_LABEL = nls.localize2('nextDebugConsole', "Focus Next Debug Console");
    exports.PREV_DEBUG_CONSOLE_LABEL = nls.localize2('prevDebugConsole', "Focus Previous Debug Console");
    exports.OPEN_LOADED_SCRIPTS_LABEL = nls.localize2('openLoadedScript', "Open Loaded Script...");
    exports.CALLSTACK_TOP_LABEL = nls.localize2('callStackTop', "Navigate to Top of Call Stack");
    exports.CALLSTACK_BOTTOM_LABEL = nls.localize2('callStackBottom', "Navigate to Bottom of Call Stack");
    exports.CALLSTACK_UP_LABEL = nls.localize2('callStackUp', "Navigate Up Call Stack");
    exports.CALLSTACK_DOWN_LABEL = nls.localize2('callStackDown', "Navigate Down Call Stack");
    exports.SELECT_DEBUG_CONSOLE_LABEL = nls.localize2('selectDebugConsole', "Select Debug Console");
    exports.SELECT_DEBUG_SESSION_LABEL = nls.localize2('selectDebugSession', "Select Debug Session");
    exports.DEBUG_QUICK_ACCESS_PREFIX = 'debug ';
    exports.DEBUG_CONSOLE_QUICK_ACCESS_PREFIX = 'debug consoles ';
    function isThreadContext(obj) {
        return obj && typeof obj.sessionId === 'string' && typeof obj.threadId === 'string';
    }
    async function getThreadAndRun(accessor, sessionAndThreadId, run) {
        const debugService = accessor.get(debug_1.IDebugService);
        let thread;
        if (isThreadContext(sessionAndThreadId)) {
            const session = debugService.getModel().getSession(sessionAndThreadId.sessionId);
            if (session) {
                thread = session.getAllThreads().find(t => t.getId() === sessionAndThreadId.threadId);
            }
        }
        else if (isSessionContext(sessionAndThreadId)) {
            const session = debugService.getModel().getSession(sessionAndThreadId.sessionId);
            if (session) {
                const threads = session.getAllThreads();
                thread = threads.length > 0 ? threads[0] : undefined;
            }
        }
        if (!thread) {
            thread = debugService.getViewModel().focusedThread;
            if (!thread) {
                const focusedSession = debugService.getViewModel().focusedSession;
                const threads = focusedSession ? focusedSession.getAllThreads() : undefined;
                thread = threads && threads.length ? threads[0] : undefined;
            }
        }
        if (thread) {
            await run(thread);
        }
    }
    function isStackFrameContext(obj) {
        return obj && typeof obj.sessionId === 'string' && typeof obj.threadId === 'string' && typeof obj.frameId === 'string';
    }
    function getFrame(debugService, context) {
        if (isStackFrameContext(context)) {
            const session = debugService.getModel().getSession(context.sessionId);
            if (session) {
                const thread = session.getAllThreads().find(t => t.getId() === context.threadId);
                if (thread) {
                    return thread.getCallStack().find(sf => sf.getId() === context.frameId);
                }
            }
        }
        else {
            return debugService.getViewModel().focusedStackFrame;
        }
        return undefined;
    }
    function isSessionContext(obj) {
        return obj && typeof obj.sessionId === 'string';
    }
    async function changeDebugConsoleFocus(accessor, next) {
        const debugService = accessor.get(debug_1.IDebugService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const sessions = debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl());
        let currSession = debugService.getViewModel().focusedSession;
        let nextIndex = 0;
        if (sessions.length > 0 && currSession) {
            while (currSession && !currSession.hasSeparateRepl()) {
                currSession = currSession.parentSession;
            }
            if (currSession) {
                const currIndex = sessions.indexOf(currSession);
                if (next) {
                    nextIndex = (currIndex === (sessions.length - 1) ? 0 : (currIndex + 1));
                }
                else {
                    nextIndex = (currIndex === 0 ? (sessions.length - 1) : (currIndex - 1));
                }
            }
        }
        await debugService.focusStackFrame(undefined, undefined, sessions[nextIndex], { explicit: true });
        if (!viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
            await viewsService.openView(debug_1.REPL_VIEW_ID, true);
        }
    }
    async function navigateCallStack(debugService, down) {
        const frame = debugService.getViewModel().focusedStackFrame;
        if (frame) {
            let callStack = frame.thread.getCallStack();
            let index = callStack.findIndex(elem => elem.frameId === frame.frameId);
            let nextVisibleFrame;
            if (down) {
                if (index >= callStack.length - 1) {
                    if (frame.thread.reachedEndOfCallStack) {
                        goToTopOfCallStack(debugService);
                        return;
                    }
                    else {
                        await debugService.getModel().fetchCallstack(frame.thread, 20);
                        callStack = frame.thread.getCallStack();
                        index = callStack.findIndex(elem => elem.frameId === frame.frameId);
                    }
                }
                nextVisibleFrame = findNextVisibleFrame(true, callStack, index);
            }
            else {
                if (index <= 0) {
                    goToBottomOfCallStack(debugService);
                    return;
                }
                nextVisibleFrame = findNextVisibleFrame(false, callStack, index);
            }
            if (nextVisibleFrame) {
                debugService.focusStackFrame(nextVisibleFrame, undefined, undefined, { preserveFocus: false });
            }
        }
    }
    async function goToBottomOfCallStack(debugService) {
        const thread = debugService.getViewModel().focusedThread;
        if (thread) {
            await debugService.getModel().fetchCallstack(thread);
            const callStack = thread.getCallStack();
            if (callStack.length > 0) {
                const nextVisibleFrame = findNextVisibleFrame(false, callStack, 0); // must consider the next frame up first, which will be the last frame
                if (nextVisibleFrame) {
                    debugService.focusStackFrame(nextVisibleFrame, undefined, undefined, { preserveFocus: false });
                }
            }
        }
    }
    function goToTopOfCallStack(debugService) {
        const thread = debugService.getViewModel().focusedThread;
        if (thread) {
            debugService.focusStackFrame(thread.getTopStackFrame(), undefined, undefined, { preserveFocus: false });
        }
    }
    /**
     * Finds next frame that is not skipped by SkipFiles. Skips frame at index and starts searching at next.
     * Must satisfy `0 <= startIndex <= callStack - 1`
     * @param down specifies whether to search downwards if the current file is skipped.
     * @param callStack the call stack to search
     * @param startIndex the index to start the search at
     */
    function findNextVisibleFrame(down, callStack, startIndex) {
        if (startIndex >= callStack.length) {
            startIndex = callStack.length - 1;
        }
        else if (startIndex < 0) {
            startIndex = 0;
        }
        let index = startIndex;
        let currFrame;
        do {
            if (down) {
                if (index === callStack.length - 1) {
                    index = 0;
                }
                else {
                    index++;
                }
            }
            else {
                if (index === 0) {
                    index = callStack.length - 1;
                }
                else {
                    index--;
                }
            }
            currFrame = callStack[index];
            if (!(currFrame.source.presentationHint === 'deemphasize' || currFrame.presentationHint === 'deemphasize')) {
                return currFrame;
            }
        } while (index !== startIndex); // end loop when we've just checked the start index, since that should be the last one checked
        return undefined;
    }
    // These commands are used in call stack context menu, call stack inline actions, command palette, debug toolbar, mac native touch bar
    // When the command is exectued in the context of a thread(context menu on a thread, inline call stack action) we pass the thread id
    // Otherwise when it is executed "globaly"(using the touch bar, debug toolbar, command palette) we do not pass any id and just take whatever is the focussed thread
    // Same for stackFrame commands and session commands.
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_STACK_TRACE_ID,
        handler: async (accessor, _, context) => {
            const textResourcePropertiesService = accessor.get(textResourceConfiguration_1.ITextResourcePropertiesService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const debugService = accessor.get(debug_1.IDebugService);
            const frame = getFrame(debugService, context);
            if (frame) {
                const eol = textResourcePropertiesService.getEOL(frame.source.uri);
                await clipboardService.writeText(frame.thread.getCallStack().map(sf => sf.toString()).join(eol));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVERSE_CONTINUE_ID,
        handler: async (accessor, _, context) => {
            await getThreadAndRun(accessor, context, thread => thread.reverseContinue());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.STEP_BACK_ID,
        handler: async (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                await getThreadAndRun(accessor, context, (thread) => thread.stepBack('instruction'));
            }
            else {
                await getThreadAndRun(accessor, context, (thread) => thread.stepBack());
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.TERMINATE_THREAD_ID,
        handler: async (accessor, _, context) => {
            await getThreadAndRun(accessor, context, thread => thread.terminate());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.JUMP_TO_CURSOR_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorControl = editorService.activeTextEditorControl;
            const notificationService = accessor.get(notification_1.INotificationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            if (stackFrame && (0, editorBrowser_1.isCodeEditor)(activeEditorControl) && activeEditorControl.hasModel()) {
                const position = activeEditorControl.getPosition();
                const resource = activeEditorControl.getModel().uri;
                const source = stackFrame.thread.session.getSourceForUri(resource);
                if (source) {
                    const response = await stackFrame.thread.session.gotoTargets(source.raw, position.lineNumber, position.column);
                    const targets = response?.body.targets;
                    if (targets && targets.length) {
                        let id = targets[0].id;
                        if (targets.length > 1) {
                            const picks = targets.map(t => ({ label: t.label, _id: t.id }));
                            const pick = await quickInputService.pick(picks, { placeHolder: nls.localize('chooseLocation', "Choose the specific location") });
                            if (!pick) {
                                return;
                            }
                            id = pick._id;
                        }
                        return await stackFrame.thread.session.goto(stackFrame.thread.threadId, id).catch(e => notificationService.warn(e));
                    }
                }
            }
            return notificationService.warn(nls.localize('noExecutableCode', "No executable code is associated at the current cursor position."));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.CALLSTACK_TOP_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            goToTopOfCallStack(debugService);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.CALLSTACK_BOTTOM_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            await goToBottomOfCallStack(debugService);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.CALLSTACK_UP_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            navigateCallStack(debugService, false);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.CALLSTACK_DOWN_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            navigateCallStack(debugService, true);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        command: {
            id: exports.JUMP_TO_CURSOR_ID,
            title: nls.localize('jumpToCursor', "Jump to Cursor"),
            category: exports.DEBUG_COMMAND_CATEGORY
        },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED, editorContextKeys_1.EditorContextKeys.editorTextFocus),
        group: 'debug',
        order: 3
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.NEXT_DEBUG_CONSOLE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        when: debug_1.CONTEXT_IN_DEBUG_REPL,
        primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
        mac: { primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */ },
        handler: async (accessor, _, context) => {
            changeDebugConsoleFocus(accessor, true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.PREV_DEBUG_CONSOLE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
        when: debug_1.CONTEXT_IN_DEBUG_REPL,
        primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
        mac: { primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 92 /* KeyCode.BracketLeft */ },
        handler: async (accessor, _, context) => {
            changeDebugConsoleFocus(accessor, false);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.RESTART_SESSION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */,
        when: debug_1.CONTEXT_IN_DEBUG_MODE,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let session;
            if (isSessionContext(context)) {
                session = debugService.getModel().getSession(context.sessionId);
            }
            else {
                session = debugService.getViewModel().focusedSession;
            }
            if (!session) {
                const { launch, name } = debugService.getConfigurationManager().selectedConfiguration;
                await debugService.startDebugging(launch, name, { noDebug: false, startedByUser: true });
            }
            else {
                const showSubSessions = configurationService.getValue('debug').showSubSessionsInToolBar;
                // Stop should be sent to the root parent session
                while (!showSubSessions && session.lifecycleManagedByParent && session.parentSession) {
                    session = session.parentSession;
                }
                session.removeReplExpressions();
                await debugService.restartSession(session);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_OVER_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 68 /* KeyCode.F10 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: async (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                await getThreadAndRun(accessor, context, (thread) => thread.next('instruction'));
            }
            else {
                await getThreadAndRun(accessor, context, (thread) => thread.next());
            }
        }
    });
    // Windows browsers use F11 for full screen, thus use alt+F11 as the default shortcut
    const STEP_INTO_KEYBINDING = (platform_1.isWeb && platform_1.isWindows) ? (512 /* KeyMod.Alt */ | 69 /* KeyCode.F11 */) : 69 /* KeyCode.F11 */;
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_INTO_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10, // Have a stronger weight to have priority over full screen when debugging
        primary: STEP_INTO_KEYBINDING,
        // Use a more flexible when clause to not allow full screen command to take over when F11 pressed a lot of times
        when: debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'),
        handler: async (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                await getThreadAndRun(accessor, context, (thread) => thread.stepIn('instruction'));
            }
            else {
                await getThreadAndRun(accessor, context, (thread) => thread.stepIn());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_OUT_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 69 /* KeyCode.F11 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: async (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                await getThreadAndRun(accessor, context, (thread) => thread.stepOut('instruction'));
            }
            else {
                await getThreadAndRun(accessor, context, (thread) => thread.stepOut());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.PAUSE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2, // take priority over focus next part while we are debugging
        primary: 64 /* KeyCode.F6 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'),
        handler: async (accessor, _, context) => {
            await getThreadAndRun(accessor, context, thread => thread.pause());
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_INTO_TARGET_ID,
        primary: STEP_INTO_KEYBINDING | 2048 /* KeyMod.CtrlCmd */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')),
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: async (accessor, _, context) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const debugService = accessor.get(debug_1.IDebugService);
            const session = debugService.getViewModel().focusedSession;
            const frame = debugService.getViewModel().focusedStackFrame;
            if (!frame || !session) {
                return;
            }
            const editor = await accessor.get(editorService_1.IEditorService).openEditor({
                resource: frame.source.uri,
                options: { revealIfOpened: true }
            });
            let codeEditor;
            if (editor) {
                const ctrl = editor?.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(ctrl)) {
                    codeEditor = ctrl;
                }
            }
            const qp = quickInputService.createQuickPick();
            qp.busy = true;
            qp.show();
            qp.onDidChangeActive(([item]) => {
                if (codeEditor && item && item.target.line !== undefined) {
                    codeEditor.revealLineInCenterIfOutsideViewport(item.target.line);
                    codeEditor.setSelection({
                        startLineNumber: item.target.line,
                        startColumn: item.target.column || 1,
                        endLineNumber: item.target.endLine || item.target.line,
                        endColumn: item.target.endColumn || item.target.column || 1,
                    });
                }
            });
            qp.onDidAccept(() => {
                if (qp.activeItems.length) {
                    session.stepIn(frame.thread.threadId, qp.activeItems[0].target.id);
                }
            });
            qp.onDidHide(() => qp.dispose());
            session.stepInTargets(frame.frameId).then(targets => {
                qp.busy = false;
                if (targets?.length) {
                    qp.items = targets?.map(target => ({ target, label: target.label }));
                }
                else {
                    qp.placeholder = nls.localize('editor.debug.action.stepIntoTargets.none', "No step targets available");
                }
            });
        }
    });
    async function stopHandler(accessor, _, context, disconnect, suspend) {
        const debugService = accessor.get(debug_1.IDebugService);
        let session;
        if (isSessionContext(context)) {
            session = debugService.getModel().getSession(context.sessionId);
        }
        else {
            session = debugService.getViewModel().focusedSession;
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const showSubSessions = configurationService.getValue('debug').showSubSessionsInToolBar;
        // Stop should be sent to the root parent session
        while (!showSubSessions && session && session.lifecycleManagedByParent && session.parentSession) {
            session = session.parentSession;
        }
        await debugService.stopSession(session, disconnect, suspend);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DISCONNECT_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_IN_DEBUG_MODE),
        handler: (accessor, _, context) => stopHandler(accessor, _, context, true)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.DISCONNECT_AND_SUSPEND_ID,
        handler: (accessor, _, context) => stopHandler(accessor, _, context, true, true)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STOP_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_IN_DEBUG_MODE),
        handler: (accessor, _, context) => stopHandler(accessor, _, context, false)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.RESTART_FRAME_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const frame = getFrame(debugService, context);
            if (frame) {
                try {
                    await frame.restart();
                }
                catch (e) {
                    notificationService.error(e);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.CONTINUE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10, // Use a stronger weight to get priority over start debugging F5 shortcut
        primary: 63 /* KeyCode.F5 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: async (accessor, _, context) => {
            await getThreadAndRun(accessor, context, thread => thread.continue());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SHOW_LOADED_SCRIPTS_ID,
        handler: async (accessor) => {
            await (0, loadedScriptsPicker_1.showLoadedScriptMenu)(accessor);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.FOCUS_REPL_ID,
        handler: async (accessor) => {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            await viewsService.openView(debug_1.REPL_VIEW_ID, true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'debug.startFromConfig',
        handler: async (accessor, config) => {
            const debugService = accessor.get(debug_1.IDebugService);
            await debugService.startDebugging(undefined, config);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.FOCUS_SESSION_ID,
        handler: async (accessor, session) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const stoppedChildSession = debugService.getModel().getSessions().find(s => s.parentSession === session && s.state === 2 /* State.Stopped */);
            if (stoppedChildSession && session.state !== 2 /* State.Stopped */) {
                session = stoppedChildSession;
            }
            await debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            if (stackFrame) {
                await stackFrame.openInEditor(editorService, true);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_AND_START_ID,
        handler: async (accessor, debugType) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const debugService = accessor.get(debug_1.IDebugService);
            if (debugType) {
                const configManager = debugService.getConfigurationManager();
                const dynamicProviders = await configManager.getDynamicProviders();
                for (const provider of dynamicProviders) {
                    if (provider.type === debugType) {
                        const pick = await provider.pick();
                        if (pick) {
                            await configManager.selectConfiguration(pick.launch, pick.config.name, pick.config, { type: provider.type });
                            debugService.startDebugging(pick.launch, pick.config, { startedByUser: true });
                            return;
                        }
                    }
                }
            }
            quickInputService.quickAccess.show(exports.DEBUG_QUICK_ACCESS_PREFIX);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_DEBUG_CONSOLE_ID,
        handler: async (accessor) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(exports.DEBUG_CONSOLE_QUICK_ACCESS_PREFIX);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_DEBUG_SESSION_ID,
        handler: async (accessor) => {
            (0, debugSessionPicker_1.showDebugSessionMenu)(accessor, exports.SELECT_AND_START_ID);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DEBUG_START_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive')),
        handler: async (accessor, debugStartOptions) => {
            const debugService = accessor.get(debug_1.IDebugService);
            await (0, debugUtils_1.saveAllBeforeDebugStart)(accessor.get(configuration_1.IConfigurationService), accessor.get(editorService_1.IEditorService));
            const { launch, name, getConfig } = debugService.getConfigurationManager().selectedConfiguration;
            const config = await getConfig();
            const configOrName = config ? Object.assign((0, objects_1.deepClone)(config), debugStartOptions?.config) : name;
            await debugService.startDebugging(launch, configOrName, { noDebug: debugStartOptions?.noDebug, startedByUser: true }, false);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DEBUG_RUN_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 63 /* KeyCode.F5 */ },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */))),
        handler: async (accessor) => {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(exports.DEBUG_START_COMMAND_ID, { noDebug: true });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.toggleBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focused = list.getFocusedElements();
                if (focused && focused.length) {
                    debugService.enableOrDisableBreakpoints(!focused[0].enabled, focused[0]);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.enableOrDisableBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: undefined,
        when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
        handler: (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const control = editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(control)) {
                const model = control.getModel();
                if (model) {
                    const position = control.getPosition();
                    if (position) {
                        const bps = debugService.getModel().getBreakpoints({ uri: model.uri, lineNumber: position.lineNumber });
                        if (bps.length) {
                            debugService.enableOrDisableBreakpoints(!bps[0].enabled, bps[0]);
                        }
                    }
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.EDIT_EXPRESSION_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED,
        primary: 60 /* KeyCode.F2 */,
        mac: { primary: 3 /* KeyCode.Enter */ },
        handler: (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (!(expression instanceof debugModel_1.Expression)) {
                const listService = accessor.get(listService_1.IListService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        expression = elements[0];
                    }
                }
            }
            if (expression instanceof debugModel_1.Expression) {
                debugService.getViewModel().setSelectedExpression(expression, false);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_EXPRESSION_COMMAND_ID,
        handler: async (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (expression instanceof debugModel_1.Expression || expression instanceof debugModel_1.Variable) {
                debugService.getViewModel().setSelectedExpression(expression, true);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.setVariable',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: debug_1.CONTEXT_VARIABLES_FOCUSED,
        primary: 60 /* KeyCode.F2 */,
        mac: { primary: 3 /* KeyCode.Enter */ },
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const focused = listService.lastFocusedList;
            if (focused) {
                const elements = focused.getFocus();
                if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Variable) {
                    debugService.getViewModel().setSelectedExpression(elements[0], false);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.REMOVE_EXPRESSION_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED, debug_1.CONTEXT_EXPRESSION_SELECTED.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
        handler: (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (expression instanceof debugModel_1.Expression) {
                debugService.removeWatchExpressions(expression.getId());
                return;
            }
            const listService = accessor.get(listService_1.IListService);
            const focused = listService.lastFocusedList;
            if (focused) {
                let elements = focused.getFocus();
                if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                    const selection = focused.getSelection();
                    if (selection && selection.indexOf(elements[0]) >= 0) {
                        elements = selection;
                    }
                    elements.forEach((e) => debugService.removeWatchExpressions(e.getId()));
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.removeBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, debug_1.CONTEXT_BREAKPOINT_INPUT_FOCUSED.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focused = list.getFocusedElements();
                const element = focused.length ? focused[0] : undefined;
                if (element instanceof debugModel_1.Breakpoint) {
                    debugService.removeBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.FunctionBreakpoint) {
                    debugService.removeFunctionBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.DataBreakpoint) {
                    debugService.removeDataBreakpoints(element.getId());
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.installAdditionalDebuggers',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, query) => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = (await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))?.getViewPaneContainer();
            let searchFor = `@category:debuggers`;
            if (typeof query === 'string') {
                searchFor += ` ${query}`;
            }
            viewlet.search(searchFor);
            viewlet.focus();
        }
    });
    (0, actions_1.registerAction2)(class AddConfigurationAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.ADD_CONFIGURATION_ID,
                title: nls.localize2('addConfiguration', "Add Configuration..."),
                category: exports.DEBUG_COMMAND_CATEGORY,
                f1: true,
                menu: {
                    id: actions_1.MenuId.EditorContent,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.regex(contextkeys_2.ResourceContextKey.Path.key, /\.vscode[/\\]launch\.json$/), contextkeys_2.ActiveEditorContext.isEqualTo(files_1.TEXT_FILE_EDITOR_ID))
                }
            });
        }
        async run(accessor, launchUri) {
            const manager = accessor.get(debug_1.IDebugService).getConfigurationManager();
            const launch = manager.getLaunches().find(l => l.uri.toString() === launchUri) || manager.selectedConfiguration.launch;
            if (launch) {
                const { editor, created } = await launch.openConfigFile({ preserveFocus: false });
                if (editor && !created) {
                    const codeEditor = editor.getControl();
                    if (codeEditor) {
                        await codeEditor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID)?.addLaunchConfiguration();
                    }
                }
            }
        }
    });
    const inlineBreakpointHandler = (accessor) => {
        const debugService = accessor.get(debug_1.IDebugService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const control = editorService.activeTextEditorControl;
        if ((0, editorBrowser_1.isCodeEditor)(control)) {
            const position = control.getPosition();
            if (position && control.hasModel() && debugService.canSetBreakpointsIn(control.getModel())) {
                const modelUri = control.getModel().uri;
                const breakpointAlreadySet = debugService.getModel().getBreakpoints({ lineNumber: position.lineNumber, uri: modelUri })
                    .some(bp => (bp.sessionAgnosticData.column === position.column || (!bp.column && position.column <= 1)));
                if (!breakpointAlreadySet) {
                    debugService.addBreakpoints(modelUri, [{ lineNumber: position.lineNumber, column: position.column > 1 ? position.column : undefined }]);
                }
            }
        }
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 67 /* KeyCode.F9 */,
        when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
        id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
        handler: inlineBreakpointHandler
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        command: {
            id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
            title: nls.localize('addInlineBreakpoint', "Add Inline Breakpoint"),
            category: exports.DEBUG_COMMAND_CATEGORY
        },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkeys_2.PanelFocusContext.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
        group: 'debug',
        order: 1
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.openBreakpointToSide',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: debug_1.CONTEXT_BREAKPOINTS_FOCUSED,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        secondary: [512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */],
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focus = list.getFocusedElements();
                if (focus.length && focus[0] instanceof debugModel_1.Breakpoint) {
                    return (0, breakpointsView_1.openBreakpointSource)(focus[0], true, false, true, accessor.get(debug_1.IDebugService), accessor.get(editorService_1.IEditorService));
                }
            }
            return undefined;
        }
    });
    // When there are no debug extensions, open the debug viewlet when F5 is pressed so the user can read the limitations
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.openView',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE.toNegated(),
        primary: 63 /* KeyCode.F5 */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */],
        handler: async (accessor) => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            await paneCompositeService.openPaneComposite(debug_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb21tYW5kcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z0NvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9DbkYsUUFBQSxvQkFBb0IsR0FBRyx3QkFBd0IsQ0FBQztJQUNoRCxRQUFBLDJCQUEyQixHQUFHLDRDQUE0QyxDQUFDO0lBQzNFLFFBQUEsbUJBQW1CLEdBQUcsc0JBQXNCLENBQUM7SUFDN0MsUUFBQSxtQkFBbUIsR0FBRyx3Q0FBd0MsQ0FBQztJQUMvRCxRQUFBLFlBQVksR0FBRyxpQ0FBaUMsQ0FBQztJQUNqRCxRQUFBLGtCQUFrQixHQUFHLGdDQUFnQyxDQUFDO0lBQ3RELFFBQUEsbUJBQW1CLEdBQUcsd0NBQXdDLENBQUM7SUFDL0QsUUFBQSxZQUFZLEdBQUcsaUNBQWlDLENBQUM7SUFDakQsUUFBQSxZQUFZLEdBQUcsaUNBQWlDLENBQUM7SUFDakQsUUFBQSxtQkFBbUIsR0FBRyx1Q0FBdUMsQ0FBQztJQUM5RCxRQUFBLFdBQVcsR0FBRyxnQ0FBZ0MsQ0FBQztJQUMvQyxRQUFBLFFBQVEsR0FBRyw4QkFBOEIsQ0FBQztJQUMxQyxRQUFBLGFBQWEsR0FBRyxtQ0FBbUMsQ0FBQztJQUNwRCxRQUFBLHlCQUF5QixHQUFHLDZDQUE2QyxDQUFDO0lBQzFFLFFBQUEsT0FBTyxHQUFHLDZCQUE2QixDQUFDO0lBQ3hDLFFBQUEsZ0JBQWdCLEdBQUcscUNBQXFDLENBQUM7SUFDekQsUUFBQSxXQUFXLEdBQUcsaUNBQWlDLENBQUM7SUFDaEQsUUFBQSxhQUFhLEdBQUcsa0NBQWtDLENBQUM7SUFDbkQsUUFBQSxpQkFBaUIsR0FBRyxvQkFBb0IsQ0FBQztJQUN6QyxRQUFBLGdCQUFnQixHQUFHLHFDQUFxQyxDQUFD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