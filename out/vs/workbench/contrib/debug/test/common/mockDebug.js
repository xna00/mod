/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/abstractDebugAdapter", "vs/workbench/contrib/debug/common/debugStorage"], function (require, exports, async_1, log_1, abstractDebugAdapter_1, debugStorage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockDebugStorage = exports.MockDebugAdapter = exports.MockRawSession = exports.MockSession = exports.MockDebugService = void 0;
    class MockDebugService {
        get state() {
            throw new Error('not implemented');
        }
        get onWillNewSession() {
            throw new Error('not implemented');
        }
        get onDidNewSession() {
            throw new Error('not implemented');
        }
        get onDidEndSession() {
            throw new Error('not implemented');
        }
        get onDidChangeState() {
            throw new Error('not implemented');
        }
        getConfigurationManager() {
            throw new Error('not implemented');
        }
        getAdapterManager() {
            throw new Error('Method not implemented.');
        }
        canSetBreakpointsIn(model) {
            throw new Error('Method not implemented.');
        }
        focusStackFrame(focusedStackFrame) {
            throw new Error('not implemented');
        }
        sendAllBreakpoints(session) {
            throw new Error('not implemented');
        }
        sendBreakpoints(modelUri, sourceModified, session) {
            throw new Error('not implemented');
        }
        addBreakpoints(uri, rawBreakpoints) {
            throw new Error('not implemented');
        }
        updateBreakpoints(uri, data, sendOnResourceSaved) {
            throw new Error('not implemented');
        }
        enableOrDisableBreakpoints(enabled) {
            throw new Error('not implemented');
        }
        setBreakpointsActivated() {
            throw new Error('not implemented');
        }
        removeBreakpoints() {
            throw new Error('not implemented');
        }
        addInstructionBreakpoint(opts) {
            throw new Error('Method not implemented.');
        }
        removeInstructionBreakpoints(address) {
            throw new Error('Method not implemented.');
        }
        setExceptionBreakpointCondition(breakpoint, condition) {
            throw new Error('Method not implemented.');
        }
        setExceptionBreakpointsForSession(session, data) {
            throw new Error('Method not implemented.');
        }
        addFunctionBreakpoint() { }
        moveWatchExpression(id, position) { }
        updateFunctionBreakpoint(id, update) {
            throw new Error('not implemented');
        }
        removeFunctionBreakpoints(id) {
            throw new Error('not implemented');
        }
        addDataBreakpoint() {
            throw new Error('Method not implemented.');
        }
        updateDataBreakpoint(id, update) {
            throw new Error('not implemented');
        }
        removeDataBreakpoints(id) {
            throw new Error('Method not implemented.');
        }
        addReplExpression(name) {
            throw new Error('not implemented');
        }
        removeReplExpressions() { }
        addWatchExpression(name) {
            throw new Error('not implemented');
        }
        renameWatchExpression(id, newName) {
            throw new Error('not implemented');
        }
        removeWatchExpressions(id) { }
        startDebugging(launch, configOrName, options) {
            return Promise.resolve(true);
        }
        restartSession() {
            throw new Error('not implemented');
        }
        stopSession() {
            throw new Error('not implemented');
        }
        getModel() {
            throw new Error('not implemented');
        }
        getViewModel() {
            throw new Error('not implemented');
        }
        sourceIsNotAvailable(uri) { }
        tryToAutoFocusStackFrame(thread) {
            throw new Error('not implemented');
        }
        runTo(uri, lineNumber, column) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockDebugService = MockDebugService;
    class MockSession {
        constructor() {
            this.suppressDebugToolbar = false;
            this.suppressDebugStatusbar = false;
            this.suppressDebugView = false;
            this.autoExpandLazyVariables = false;
            this.configuration = { type: 'mock', name: 'mock', request: 'launch' };
            this.unresolvedConfiguration = { type: 'mock', name: 'mock', request: 'launch' };
            this.state = 2 /* State.Stopped */;
            this.capabilities = {};
        }
        getMemory(memoryReference) {
            throw new Error('Method not implemented.');
        }
        get onDidInvalidateMemory() {
            throw new Error('Not implemented');
        }
        readMemory(memoryReference, offset, count) {
            throw new Error('Method not implemented.');
        }
        writeMemory(memoryReference, offset, data, allowPartial) {
            throw new Error('Method not implemented.');
        }
        get compoundRoot() {
            return undefined;
        }
        get saveBeforeRestart() {
            return true;
        }
        get isSimpleUI() {
            return false;
        }
        get lifecycleManagedByParent() {
            return false;
        }
        stepInTargets(frameId) {
            throw new Error('Method not implemented.');
        }
        cancel(_progressId) {
            throw new Error('Method not implemented.');
        }
        breakpointsLocations(uri, lineNumber) {
            throw new Error('Method not implemented.');
        }
        dataBytesBreakpointInfo(address, bytes) {
            throw new Error('Method not implemented.');
        }
        dataBreakpointInfo(name, variablesReference) {
            throw new Error('Method not implemented.');
        }
        sendDataBreakpoints(dbps) {
            throw new Error('Method not implemented.');
        }
        get compact() {
            return false;
        }
        setSubId(subId) {
            throw new Error('Method not implemented.');
        }
        get parentSession() {
            return undefined;
        }
        getReplElements() {
            return [];
        }
        hasSeparateRepl() {
            return true;
        }
        removeReplExpressions() { }
        get onDidChangeReplElements() {
            throw new Error('not implemented');
        }
        addReplExpression(stackFrame, name) {
            return Promise.resolve(undefined);
        }
        appendToRepl(data) { }
        getId() {
            return 'mock';
        }
        getLabel() {
            return 'mockname';
        }
        get name() {
            return 'mockname';
        }
        setName(name) {
            throw new Error('not implemented');
        }
        getSourceForUri(modelUri) {
            throw new Error('not implemented');
        }
        getThread(threadId) {
            throw new Error('not implemented');
        }
        getStoppedDetails() {
            throw new Error('not implemented');
        }
        get onDidCustomEvent() {
            throw new Error('not implemented');
        }
        get onDidLoadedSource() {
            throw new Error('not implemented');
        }
        get onDidChangeState() {
            throw new Error('not implemented');
        }
        get onDidEndAdapter() {
            throw new Error('not implemented');
        }
        get onDidChangeName() {
            throw new Error('not implemented');
        }
        get onDidProgressStart() {
            throw new Error('not implemented');
        }
        get onDidProgressUpdate() {
            throw new Error('not implemented');
        }
        get onDidProgressEnd() {
            throw new Error('not implemented');
        }
        setConfiguration(configuration) { }
        getAllThreads() {
            return [];
        }
        getSource(raw) {
            throw new Error('not implemented');
        }
        getLoadedSources() {
            return Promise.resolve([]);
        }
        completions(frameId, threadId, text, position, overwriteBefore) {
            throw new Error('not implemented');
        }
        clearThreads(removeThreads, reference) { }
        rawUpdate(data) { }
        initialize(dbgr) {
            throw new Error('Method not implemented.');
        }
        launchOrAttach(config) {
            throw new Error('Method not implemented.');
        }
        restart() {
            throw new Error('Method not implemented.');
        }
        sendBreakpoints(modelUri, bpts, sourceModified) {
            throw new Error('Method not implemented.');
        }
        sendFunctionBreakpoints(fbps) {
            throw new Error('Method not implemented.');
        }
        sendExceptionBreakpoints(exbpts) {
            throw new Error('Method not implemented.');
        }
        sendInstructionBreakpoints(dbps) {
            throw new Error('Method not implemented.');
        }
        getDebugProtocolBreakpoint(breakpointId) {
            throw new Error('Method not implemented.');
        }
        customRequest(request, args) {
            throw new Error('Method not implemented.');
        }
        stackTrace(threadId, startFrame, levels, token) {
            throw new Error('Method not implemented.');
        }
        exceptionInfo(threadId) {
            throw new Error('Method not implemented.');
        }
        scopes(frameId) {
            throw new Error('Method not implemented.');
        }
        variables(variablesReference, threadId, filter, start, count) {
            throw new Error('Method not implemented.');
        }
        evaluate(expression, frameId, context) {
            throw new Error('Method not implemented.');
        }
        restartFrame(frameId, threadId) {
            throw new Error('Method not implemented.');
        }
        next(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepIn(threadId, targetId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepOut(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        stepBack(threadId, granularity) {
            throw new Error('Method not implemented.');
        }
        continue(threadId) {
            throw new Error('Method not implemented.');
        }
        reverseContinue(threadId) {
            throw new Error('Method not implemented.');
        }
        pause(threadId) {
            throw new Error('Method not implemented.');
        }
        terminateThreads(threadIds) {
            throw new Error('Method not implemented.');
        }
        setVariable(variablesReference, name, value) {
            throw new Error('Method not implemented.');
        }
        setExpression(frameId, expression, value) {
            throw new Error('Method not implemented.');
        }
        loadSource(resource) {
            throw new Error('Method not implemented.');
        }
        disassemble(memoryReference, offset, instructionOffset, instructionCount) {
            throw new Error('Method not implemented.');
        }
        terminate(restart = false) {
            throw new Error('Method not implemented.');
        }
        disconnect(restart = false) {
            throw new Error('Method not implemented.');
        }
        gotoTargets(source, line, column) {
            throw new Error('Method not implemented.');
        }
        goto(threadId, targetId) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockSession = MockSession;
    class MockRawSession {
        constructor() {
            this.capabilities = {};
            this.disconnected = false;
            this.sessionLengthInSeconds = 0;
            this.readyForBreakpoints = true;
            this.emittedStopped = true;
            this.onDidStop = null;
        }
        getLengthInSeconds() {
            return 100;
        }
        stackTrace(args) {
            return Promise.resolve({
                seq: 1,
                type: 'response',
                request_seq: 1,
                success: true,
                command: 'stackTrace',
                body: {
                    stackFrames: [{
                            id: 1,
                            name: 'mock',
                            line: 5,
                            column: 6
                        }]
                }
            });
        }
        exceptionInfo(args) {
            throw new Error('not implemented');
        }
        launchOrAttach(args) {
            throw new Error('not implemented');
        }
        scopes(args) {
            throw new Error('not implemented');
        }
        variables(args) {
            throw new Error('not implemented');
        }
        evaluate(args) {
            return Promise.resolve(null);
        }
        custom(request, args) {
            throw new Error('not implemented');
        }
        terminate(restart = false) {
            throw new Error('not implemented');
        }
        disconnect(restart) {
            throw new Error('not implemented');
        }
        threads() {
            throw new Error('not implemented');
        }
        stepIn(args) {
            throw new Error('not implemented');
        }
        stepOut(args) {
            throw new Error('not implemented');
        }
        stepBack(args) {
            throw new Error('not implemented');
        }
        continue(args) {
            throw new Error('not implemented');
        }
        reverseContinue(args) {
            throw new Error('not implemented');
        }
        pause(args) {
            throw new Error('not implemented');
        }
        terminateThreads(args) {
            throw new Error('not implemented');
        }
        setVariable(args) {
            throw new Error('not implemented');
        }
        restartFrame(args) {
            throw new Error('not implemented');
        }
        completions(args) {
            throw new Error('not implemented');
        }
        next(args) {
            throw new Error('not implemented');
        }
        source(args) {
            throw new Error('not implemented');
        }
        loadedSources(args) {
            throw new Error('not implemented');
        }
        setBreakpoints(args) {
            throw new Error('not implemented');
        }
        setFunctionBreakpoints(args) {
            throw new Error('not implemented');
        }
        setExceptionBreakpoints(args) {
            throw new Error('not implemented');
        }
    }
    exports.MockRawSession = MockRawSession;
    class MockDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor() {
            super(...arguments);
            this.seq = 0;
            this.pendingResponses = new Map();
        }
        startSession() {
            return Promise.resolve();
        }
        stopSession() {
            return Promise.resolve();
        }
        sendMessage(message) {
            if (message.type === 'request') {
                setTimeout(() => {
                    const request = message;
                    switch (request.command) {
                        case 'evaluate':
                            this.evaluate(request, request.arguments);
                            return;
                    }
                    this.sendResponseBody(request, {});
                    return;
                }, 0);
            }
            else if (message.type === 'response') {
                const response = message;
                if (this.pendingResponses.has(response.command)) {
                    this.pendingResponses.get(response.command).complete(response);
                }
            }
        }
        sendResponseBody(request, body) {
            const response = {
                seq: ++this.seq,
                type: 'response',
                request_seq: request.seq,
                command: request.command,
                success: true,
                body
            };
            this.acceptMessage(response);
        }
        sendEventBody(event, body) {
            const response = {
                seq: ++this.seq,
                type: 'event',
                event,
                body
            };
            this.acceptMessage(response);
        }
        waitForResponseFromClient(command) {
            const deferred = new async_1.DeferredPromise();
            if (this.pendingResponses.has(command)) {
                return this.pendingResponses.get(command).p;
            }
            this.pendingResponses.set(command, deferred);
            return deferred.p;
        }
        sendRequestBody(command, args) {
            const response = {
                seq: ++this.seq,
                type: 'request',
                command,
                arguments: args
            };
            this.acceptMessage(response);
        }
        evaluate(request, args) {
            if (args.expression.indexOf('before.') === 0) {
                this.sendEventBody('output', { output: args.expression });
            }
            this.sendResponseBody(request, {
                result: '=' + args.expression,
                variablesReference: 0
            });
            if (args.expression.indexOf('after.') === 0) {
                this.sendEventBody('output', { output: args.expression });
            }
        }
    }
    exports.MockDebugAdapter = MockDebugAdapter;
    class MockDebugStorage extends debugStorage_1.DebugStorage {
        constructor(storageService) {
            super(storageService, undefined, undefined, new log_1.NullLogService());
        }
    }
    exports.MockDebugStorage = MockDebugStorage;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0RlYnVnLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2NvbW1vbi9tb2NrRGVidWcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLGdCQUFnQjtRQUc1QixJQUFJLEtBQUs7WUFDUixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksZ0JBQWdCO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxlQUFlO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxnQkFBZ0I7WUFDbkIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCx1QkFBdUI7WUFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxLQUFpQjtZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELGVBQWUsQ0FBQyxpQkFBOEI7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxPQUF1QjtZQUN6QyxNQUFN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