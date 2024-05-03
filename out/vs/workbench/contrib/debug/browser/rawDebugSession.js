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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/debug/common/extensionHostDebug", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/base/common/network"], function (require, exports, nls, event_1, objects, actions_1, errors, errorMessage_1, debugUtils_1, extensionHostDebug_1, uri_1, opener_1, lifecycle_1, notification_1, dialogs_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RawDebugSession = void 0;
    /**
     * Encapsulates the DebugAdapter lifecycle and some idiosyncrasies of the Debug Adapter Protocol.
     */
    let RawDebugSession = class RawDebugSession {
        constructor(debugAdapter, dbgr, sessionId, name, extensionHostDebugService, openerService, notificationService, dialogSerivce) {
            this.dbgr = dbgr;
            this.sessionId = sessionId;
            this.name = name;
            this.extensionHostDebugService = extensionHostDebugService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogSerivce = dialogSerivce;
            this.allThreadsContinued = true;
            this._readyForBreakpoints = false;
            // shutdown
            this.debugAdapterStopped = false;
            this.inShutdown = false;
            this.terminated = false;
            this.firedAdapterExitEvent = false;
            // telemetry
            this.startTime = 0;
            this.didReceiveStoppedEvent = false;
            // DAP events
            this._onDidInitialize = new event_1.Emitter();
            this._onDidStop = new event_1.Emitter();
            this._onDidContinued = new event_1.Emitter();
            this._onDidTerminateDebugee = new event_1.Emitter();
            this._onDidExitDebugee = new event_1.Emitter();
            this._onDidThread = new event_1.Emitter();
            this._onDidOutput = new event_1.Emitter();
            this._onDidBreakpoint = new event_1.Emitter();
            this._onDidLoadedSource = new event_1.Emitter();
            this._onDidProgressStart = new event_1.Emitter();
            this._onDidProgressUpdate = new event_1.Emitter();
            this._onDidProgressEnd = new event_1.Emitter();
            this._onDidInvalidated = new event_1.Emitter();
            this._onDidInvalidateMemory = new event_1.Emitter();
            this._onDidCustomEvent = new event_1.Emitter();
            this._onDidEvent = new event_1.Emitter();
            // DA events
            this._onDidExitAdapter = new event_1.Emitter();
            this.stoppedSinceLastStep = false;
            this.toDispose = [];
            this.debugAdapter = debugAdapter;
            this._capabilities = Object.create(null);
            this.toDispose.push(this.debugAdapter.onError(err => {
                this.shutdown(err);
            }));
            this.toDispose.push(this.debugAdapter.onExit(code => {
                if (code !== 0) {
                    this.shutdown(new Error(`exit code: ${code}`));
                }
                else {
                    // normal exit
                    this.shutdown();
                }
            }));
            this.debugAdapter.onEvent(event => {
                switch (event.event) {
                    case 'initialized':
                        this._readyForBreakpoints = true;
                        this._onDidInitialize.fire(event);
                        break;
                    case 'loadedSource':
                        this._onDidLoadedSource.fire(event);
                        break;
                    case 'capabilities':
                        if (event.body) {
                            const capabilities = event.body.capabilities;
                            this.mergeCapabilities(capabilities);
                        }
                        break;
                    case 'stopped':
                        this.didReceiveStoppedEvent = true; // telemetry: remember that debugger stopped successfully
                        this.stoppedSinceLastStep = true;
                        this._onDidStop.fire(event);
                        break;
                    case 'continued':
                        this.allThreadsContinued = event.body.allThreadsContinued === false ? false : true;
                        this._onDidContinued.fire(event);
                        break;
                    case 'thread':
                        this._onDidThread.fire(event);
                        break;
                    case 'output':
                        this._onDidOutput.fire(event);
                        break;
                    case 'breakpoint':
                        this._onDidBreakpoint.fire(event);
                        break;
                    case 'terminated':
                        this._onDidTerminateDebugee.fire(event);
                        break;
                    case 'exited':
                        this._onDidExitDebugee.fire(event);
                        break;
                    case 'progressStart':
                        this._onDidProgressStart.fire(event);
                        break;
                    case 'progressUpdate':
                        this._onDidProgressUpdate.fire(event);
                        break;
                    case 'progressEnd':
                        this._onDidProgressEnd.fire(event);
                        break;
                    case 'invalidated':
                        this._onDidInvalidated.fire(event);
                        break;
                    case 'memory':
                        this._onDidInvalidateMemory.fire(event);
                        break;
                    case 'process':
                        break;
                    case 'module':
                        break;
                    default:
                        this._onDidCustomEvent.fire(event);
                        break;
                }
                this._onDidEvent.fire(event);
            });
            this.debugAdapter.onRequest(request => this.dispatchRequest(request));
        }
        get isInShutdown() {
            return this.inShutdown;
        }
        get onDidExitAdapter() {
            return this._onDidExitAdapter.event;
        }
        get capabilities() {
            return this._capabilities;
        }
        /**
         * DA is ready to accepts setBreakpoint requests.
         * Becomes true after "initialized" events has been received.
         */
        get readyForBreakpoints() {
            return this._readyForBreakpoints;
        }
        //---- DAP events
        get onDidInitialize() {
            return this._onDidInitialize.event;
        }
        get onDidStop() {
            return this._onDidStop.event;
        }
        get onDidContinued() {
            return this._onDidContinued.event;
        }
        get onDidTerminateDebugee() {
            return this._onDidTerminateDebugee.event;
        }
        get onDidExitDebugee() {
            return this._onDidExitDebugee.event;
        }
        get onDidThread() {
            return this._onDidThread.event;
        }
        get onDidOutput() {
            return this._onDidOutput.event;
        }
        get onDidBreakpoint() {
            return this._onDidBreakpoint.event;
        }
        get onDidLoadedSource() {
            return this._onDidLoadedSource.event;
        }
        get onDidCustomEvent() {
            return this._onDidCustomEvent.event;
        }
        get onDidProgressStart() {
            return this._onDidProgressStart.event;
        }
        get onDidProgressUpdate() {
            return this._onDidProgressUpdate.event;
        }
        get onDidProgressEnd() {
            return this._onDidProgressEnd.event;
        }
        get onDidInvalidated() {
            return this._onDidInvalidated.event;
        }
        get onDidInvalidateMemory() {
            return this._onDidInvalidateMemory.event;
        }
        get onDidEvent() {
            return this._onDidEvent.event;
        }
        //---- DebugAdapter lifecycle
        /**
         * Starts the underlying debug adapter and tracks the session time for telemetry.
         */
        async start() {
            if (!this.debugAdapter) {
                return Promise.reject(new Error(nls.localize('noDebugAdapterStart', "No debug adapter, can not start debug session.")));
            }
            await this.debugAdapter.startSession();
            this.startTime = new Date().getTime();
        }
        /**
         * Send client capabilities to the debug adapter and receive DA capabilities in return.
         */
        async initialize(args) {
            const response = await this.send('initialize', args, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Terminate the debuggee and shutdown the adapter
         */
        disconnect(args) {
            const terminateDebuggee = this.capabilities.supportTerminateDebuggee ? args.terminateDebuggee : undefined;
            const suspendDebuggee = this.capabilities.supportTerminateDebuggee && this.capabilities.supportSuspendDebuggee ? args.suspendDebuggee : undefined;
            return this.shutdown(undefined, args.restart, terminateDebuggee, suspendDebuggee);
        }
        //---- DAP requests
        async launchOrAttach(config) {
            const response = await this.send(config.request, config, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Try killing the debuggee softly...
         */
        terminate(restart = false) {
            if (this.capabilities.supportsTerminateRequest) {
                if (!this.terminated) {
                    this.terminated = true;
                    return this.send('terminate', { restart }, undefined);
                }
                return this.disconnect({ terminateDebuggee: true, restart });
            }
            return Promise.reject(new Error('terminated not supported'));
        }
        restart(args) {
            if (this.capabilities.supportsRestartRequest) {
                return this.send('restart', args);
            }
            return Promise.reject(new Error('restart not supported'));
        }
        async next(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('next', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async stepIn(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('stepIn', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async stepOut(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('stepOut', args);
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId);
            }
            return response;
        }
        async continue(args) {
            this.stoppedSinceLastStep = false;
            const response = await this.send('continue', args);
            if (response && response.body && response.body.allThreadsContinued !== undefined) {
                this.allThreadsContinued = response.body.allThreadsContinued;
            }
            if (!this.stoppedSinceLastStep) {
                this.fireSimulatedContinuedEvent(args.threadId, this.allThreadsContinued);
            }
            return response;
        }
        pause(args) {
            return this.send('pause', args);
        }
        terminateThreads(args) {
            if (this.capabilities.supportsTerminateThreadsRequest) {
                return this.send('terminateThreads', args);
            }
            return Promise.reject(new Error('terminateThreads not supported'));
        }
        setVariable(args) {
            if (this.capabilities.supportsSetVariable) {
                return this.send('setVariable', args);
            }
            return Promise.reject(new Error('setVariable not supported'));
        }
        setExpression(args) {
            if (this.capabilities.supportsSetExpression) {
                return this.send('setExpression', args);
            }
            return Promise.reject(new Error('setExpression not supported'));
        }
        async restartFrame(args, threadId) {
            if (this.capabilities.supportsRestartFrame) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('restartFrame', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(threadId);
                }
                return response;
            }
            return Promise.reject(new Error('restartFrame not supported'));
        }
        stepInTargets(args) {
            if (this.capabilities.supportsStepInTargetsRequest) {
                return this.send('stepInTargets', args);
            }
            return Promise.reject(new Error('stepInTargets not supported'));
        }
        completions(args, token) {
            if (this.capabilities.supportsCompletionsRequest) {
                return this.send('completions', args, token);
            }
            return Promise.reject(new Error('completions not supported'));
        }
        setBreakpoints(args) {
            return this.send('setBreakpoints', args);
        }
        setFunctionBreakpoints(args) {
            if (this.capabilities.supportsFunctionBreakpoints) {
                return this.send('setFunctionBreakpoints', args);
            }
            return Promise.reject(new Error('setFunctionBreakpoints not supported'));
        }
        dataBreakpointInfo(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('dataBreakpointInfo', args);
            }
            return Promise.reject(new Error('dataBreakpointInfo not supported'));
        }
        setDataBreakpoints(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('setDataBreakpoints', args);
            }
            return Promise.reject(new Error('setDataBreakpoints not supported'));
        }
        setExceptionBreakpoints(args) {
            return this.send('setExceptionBreakpoints', args);
        }
        breakpointLocations(args) {
            if (this.capabilities.supportsBreakpointLocationsRequest) {
                return this.send('breakpointLocations', args);
            }
            return Promise.reject(new Error('breakpointLocations is not supported'));
        }
        configurationDone() {
            if (this.capabilities.supportsConfigurationDoneRequest) {
                return this.send('configurationDone', null);
            }
            return Promise.reject(new Error('configurationDone not supported'));
        }
        stackTrace(args, token) {
            return this.send('stackTrace', args, token);
        }
        exceptionInfo(args) {
            if (this.capabilities.supportsExceptionInfoRequest) {
                return this.send('exceptionInfo', args);
            }
            return Promise.reject(new Error('exceptionInfo not supported'));
        }
        scopes(args, token) {
            return this.send('scopes', args, token);
        }
        variables(args, token) {
            return this.send('variables', args, token);
        }
        source(args) {
            return this.send('source', args);
        }
        loadedSources(args) {
            if (this.capabilities.supportsLoadedSourcesRequest) {
                return this.send('loadedSources', args);
            }
            return Promise.reject(new Error('loadedSources not supported'));
        }
        threads() {
            return this.send('threads', null);
        }
        evaluate(args) {
            return this.send('evaluate', args);
        }
        async stepBack(args) {
            if (this.capabilities.supportsStepBack) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('stepBack', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('stepBack not supported'));
        }
        async reverseContinue(args) {
            if (this.capabilities.supportsStepBack) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('reverseContinue', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('reverseContinue not supported'));
        }
        gotoTargets(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                return this.send('gotoTargets', args);
            }
            return Promise.reject(new Error('gotoTargets is not supported'));
        }
        async goto(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                this.stoppedSinceLastStep = false;
                const response = await this.send('goto', args);
                if (!this.stoppedSinceLastStep) {
                    this.fireSimulatedContinuedEvent(args.threadId);
                }
                return response;
            }
            return Promise.reject(new Error('goto is not supported'));
        }
        async setInstructionBreakpoints(args) {
            if (this.capabilities.supportsInstructionBreakpoints) {
                return await this.send('setInstructionBreakpoints', args);
            }
            return Promise.reject(new Error('setInstructionBreakpoints is not supported'));
        }
        async disassemble(args) {
            if (this.capabilities.supportsDisassembleRequest) {
                return await this.send('disassemble', args);
            }
            return Promise.reject(new Error('disassemble is not supported'));
        }
        async readMemory(args) {
            if (this.capabilities.supportsReadMemoryRequest) {
                return await this.send('readMemory', args);
            }
            return Promise.reject(new Error('readMemory is not supported'));
        }
        async writeMemory(args) {
            if (this.capabilities.supportsWriteMemoryRequest) {
                return await this.send('writeMemory', args);
            }
            return Promise.reject(new Error('writeMemory is not supported'));
        }
        cancel(args) {
            return this.send('cancel', args);
        }
        custom(request, args) {
            return this.send(request, args);
        }
        //---- private
        async shutdown(error, restart = false, terminateDebuggee = undefined, suspendDebuggee = undefined) {
            if (!this.inShutdown) {
                this.inShutdown = true;
                if (this.debugAdapter) {
                    try {
                        const args = { restart };
                        if (typeof terminateDebuggee === 'boolean') {
                            args.terminateDebuggee = terminateDebuggee;
                        }
                        if (typeof suspendDebuggee === 'boolean') {
                            args.suspendDebuggee = suspendDebuggee;
                        }
                        // if there's an error, the DA is probably already gone, so give it a much shorter timeout.
                        await this.send('disconnect', args, undefined, error ? 200 : 2000);
                    }
                    catch (e) {
                        // Catch the potential 'disconnect' error - no need to show it to the user since the adapter is shutting down
                    }
                    finally {
                        await this.stopAdapter(error);
                    }
                }
                else {
                    return this.stopAdapter(error);
                }
            }
        }
        async stopAdapter(error) {
            try {
                if (this.debugAdapter) {
                    const da = this.debugAdapter;
                    this.debugAdapter = null;
                    await da.stopSession();
                    this.debugAdapterStopped = true;
                }
            }
            finally {
                this.fireAdapterExitEvent(error);
            }
        }
        fireAdapterExitEvent(error) {
            if (!this.firedAdapterExitEvent) {
                this.firedAdapterExitEvent = true;
                const e = {
                    emittedStopped: this.didReceiveStoppedEvent,
                    sessionLengthInSeconds: (new Date().getTime() - this.startTime) / 1000
                };
                if (error && !this.debugAdapterStopped) {
                    e.error = error;
                }
                this._onDidExitAdapter.fire(e);
            }
        }
        async dispatchRequest(request) {
            const response = {
                type: 'response',
                seq: 0,
                command: request.command,
                request_seq: request.seq,
                success: true
            };
            const safeSendResponse = (response) => this.debugAdapter && this.debugAdapter.sendResponse(response);
            if (request.command === 'launchVSCode') {
                try {
                    let result = await this.launchVsCode(request.arguments);
                    if (!result.success) {
                        const { confirmed } = await this.dialogSerivce.confirm({
                            type: notification_1.Severity.Warning,
                            message: nls.localize('canNotStart', "The debugger needs to open a new tab or window for the debuggee but the browser prevented this. You must give permission to continue."),
                            primaryButton: nls.localize({ key: 'continue', comment: ['&& denotes a mnemonic'] }, "&&Continue")
                        });
                        if (confirmed) {
                            result = await this.launchVsCode(request.arguments);
                        }
                        else {
                            response.success = false;
                            safeSendResponse(response);
                            await this.shutdown();
                        }
                    }
                    response.body = {
                        rendererDebugPort: result.rendererDebugPort,
                    };
                    safeSendResponse(response);
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else if (request.command === 'runInTerminal') {
                try {
                    const shellProcessId = await this.dbgr.runInTerminal(request.arguments, this.sessionId);
                    const resp = response;
                    resp.body = {};
                    if (typeof shellProcessId === 'number') {
                        resp.body.shellProcessId = shellProcessId;
                    }
                    safeSendResponse(resp);
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else if (request.command === 'startDebugging') {
                try {
                    const args = request.arguments;
                    const config = {
                        ...args.configuration,
                        ...{
                            request: args.request,
                            type: this.dbgr.type,
                            name: args.configuration.name || this.name
                        }
                    };
                    const success = await this.dbgr.startDebugging(config, this.sessionId);
                    if (success) {
                        safeSendResponse(response);
                    }
                    else {
                        response.success = false;
                        response.message = 'Failed to start debugging';
                        safeSendResponse(response);
                    }
                }
                catch (err) {
                    response.success = false;
                    response.message = err.message;
                    safeSendResponse(response);
                }
            }
            else {
                response.success = false;
                response.message = `unknown request '${request.command}'`;
                safeSendResponse(response);
            }
        }
        launchVsCode(vscodeArgs) {
            const args = [];
            for (const arg of vscodeArgs.args) {
                const a2 = (arg.prefix || '') + (arg.path || '');
                const match = /^--(.+)=(.+)$/.exec(a2);
                if (match && match.length === 3) {
                    const key = match[1];
                    let value = match[2];
                    if ((key === 'file-uri' || key === 'folder-uri') && !(0, debugUtils_1.isUri)(arg.path)) {
                        value = (0, debugUtils_1.isUri)(value) ? value : uri_1.URI.file(value).toString();
                    }
                    args.push(`--${key}=${value}`);
                }
                else {
                    args.push(a2);
                }
            }
            if (vscodeArgs.env) {
                args.push(`--extensionEnvironment=${JSON.stringify(vscodeArgs.env)}`);
            }
            return this.extensionHostDebugService.openExtensionDevelopmentHostWindow(args, !!vscodeArgs.debugRenderer);
        }
        send(command, args, token, timeout, showErrors = true) {
            return new Promise((completeDispatch, errorDispatch) => {
                if (!this.debugAdapter) {
                    if (this.inShutdown) {
                        // We are in shutdown silently complete
                        completeDispatch(undefined);
                    }
                    else {
                        errorDispatch(new Error(nls.localize('noDebugAdapter', "No debugger available found. Can not send '{0}'.", command)));
                    }
                    return;
                }
                let cancelationListener;
                const requestId = this.debugAdapter.sendRequest(command, args, (response) => {
                    cancelationListener?.dispose();
                    if (response.success) {
                        completeDispatch(response);
                    }
                    else {
                        errorDispatch(response);
                    }
                }, timeout);
                if (token) {
                    cancelationListener = token.onCancellationRequested(() => {
                        cancelationListener.dispose();
                        if (this.capabilities.supportsCancelRequest) {
                            this.cancel({ requestId });
                        }
                    });
                }
            }).then(undefined, err => Promise.reject(this.handleErrorResponse(err, showErrors)));
        }
        handleErrorResponse(errorResponse, showErrors) {
            if (errorResponse.command === 'canceled' && errorResponse.message === 'canceled') {
                return new errors.CancellationError();
            }
            const error = errorResponse?.body?.error;
            const errorMessage = errorResponse?.message || '';
            const userMessage = error ? (0, debugUtils_1.formatPII)(error.format, false, error.variables) : errorMessage;
            const url = error?.url;
            if (error && url) {
                const label = error.urlLabel ? error.urlLabel : nls.localize('moreInfo', "More Info");
                const uri = uri_1.URI.parse(url);
                // Use a suffixed id if uri invokes a command, so default 'Open launch.json' command is suppressed on dialog
                const actionId = uri.scheme === network_1.Schemas.command ? 'debug.moreInfo.command' : 'debug.moreInfo';
                return (0, errorMessage_1.createErrorWithActions)(userMessage, [(0, actions_1.toAction)({ id: actionId, label, run: () => this.openerService.open(uri, { allowCommands: true }) })]);
            }
            if (showErrors && error && error.format && error.showUser) {
                this.notificationService.error(userMessage);
            }
            const result = new errors.ErrorNoTelemetry(userMessage);
            result.showUser = error?.showUser;
            return result;
        }
        mergeCapabilities(capabilities) {
            if (capabilities) {
                this._capabilities = objects.mixin(this._capabilities, capabilities);
            }
        }
        fireSimulatedContinuedEvent(threadId, allThreadsContinued = false) {
            this._onDidContinued.fire({
                type: 'event',
                event: 'continued',
                body: {
                    threadId,
                    allThreadsContinued
                },
                seq: undefined
            });
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.RawDebugSession = RawDebugSession;
    exports.RawDebugSession = RawDebugSession = __decorate([
        __param(4, extensionHostDebug_1.IExtensionHostDebugService),
        __param(5, opener_1.IOpenerService),
        __param(6, notification_1.INotificationService),
        __param(7, dialogs_1.IDialogService)
    ], RawDebugSession);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3RGVidWdTZXNzaW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL3Jhd0RlYnVnU2Vzc2lvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQ2hHOztPQUVHO0lBQ0ksSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZTtRQXlDM0IsWUFDQyxZQUEyQixFQUNYLElBQWUsRUFDZCxTQUFpQixFQUNqQixJQUFZLEVBQ0QseUJBQXNFLEVBQ2xGLGFBQThDLEVBQ3hDLG1CQUEwRCxFQUNoRSxhQUE4QztZQU45QyxTQUFJLEdBQUosSUFBSSxDQUFXO1lBQ2QsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ2dCLDhCQUF5QixHQUF6Qix5QkFBeUIsQ0FBNEI7WUFDakUsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3ZCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDL0Msa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBL0N2RCx3QkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDM0IseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1lBR3JDLFdBQVc7WUFDSCx3QkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDNUIsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNuQixlQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ25CLDBCQUFxQixHQUFHLEtBQUssQ0FBQztZQUV0QyxZQUFZO1lBQ0osY0FBUyxHQUFHLENBQUMsQ0FBQztZQUNkLDJCQUFzQixHQUFHLEtBQUssQ0FBQztZQUV2QyxhQUFhO1lBQ0kscUJBQWdCLEdBQUcsSUFBSSxlQUFPLEVBQWtDLENBQUM7WUFDakUsZUFBVSxHQUFHLElBQUksZUFBTyxFQUE4QixDQUFDO1lBQ3ZE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