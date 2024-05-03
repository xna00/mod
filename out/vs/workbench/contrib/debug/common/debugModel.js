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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/observable", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/nls", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, arrays_1, arraysFind_1, async_1, buffer_1, cancellation_1, event_1, hash_1, lifecycle_1, objects_1, observable_1, resources, types_1, uri_1, uuid_1, range_1, nls, log_1, uriIdentity_1, debug_1, debugSource_1, disassemblyViewInput_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugModel = exports.ThreadAndSessionIds = exports.InstructionBreakpoint = exports.ExceptionBreakpoint = exports.DataBreakpoint = exports.FunctionBreakpoint = exports.Breakpoint = exports.BaseBreakpoint = exports.Enablement = exports.MemoryRegion = exports.getUriForDebugMemory = exports.Thread = exports.StackFrame = exports.ErrorScope = exports.Scope = exports.Variable = exports.Expression = exports.VisualizedExpression = exports.ExpressionContainer = void 0;
    class ExpressionContainer {
        static { this.allValues = new Map(); }
        // Use chunks to support variable paging #9537
        static { this.BASE_CHUNK_SIZE = 100; }
        constructor(session, threadId, _reference, id, namedVariables = 0, indexedVariables = 0, memoryReference = undefined, startOfVariables = 0, presentationHint = undefined) {
            this.session = session;
            this.threadId = threadId;
            this._reference = _reference;
            this.id = id;
            this.namedVariables = namedVariables;
            this.indexedVariables = indexedVariables;
            this.memoryReference = memoryReference;
            this.startOfVariables = startOfVariables;
            this.presentationHint = presentationHint;
            this.valueChanged = false;
            this._value = '';
        }
        get reference() {
            return this._reference;
        }
        set reference(value) {
            this._reference = value;
            this.children = undefined; // invalidate children cache
        }
        async evaluateLazy() {
            if (typeof this.reference === 'undefined') {
                return;
            }
            const response = await this.session.variables(this.reference, this.threadId, undefined, undefined, undefined);
            if (!response || !response.body || !response.body.variables || response.body.variables.length !== 1) {
                return;
            }
            const dummyVar = response.body.variables[0];
            this.reference = dummyVar.variablesReference;
            this._value = dummyVar.value;
            this.namedVariables = dummyVar.namedVariables;
            this.indexedVariables = dummyVar.indexedVariables;
            this.memoryReference = dummyVar.memoryReference;
            this.presentationHint = dummyVar.presentationHint;
            // Also call overridden method to adopt subclass props
            this.adoptLazyResponse(dummyVar);
        }
        adoptLazyResponse(response) {
        }
        getChildren() {
            if (!this.children) {
                this.children = this.doGetChildren();
            }
            return this.children;
        }
        async doGetChildren() {
            if (!this.hasChildren) {
                return [];
            }
            if (!this.getChildrenInChunks) {
                return this.fetchVariables(undefined, undefined, undefined);
            }
            // Check if object has named variables, fetch them independent from indexed variables #9670
            const children = this.namedVariables ? await this.fetchVariables(undefined, undefined, 'named') : [];
            // Use a dynamic chunk size based on the number of elements #9774
            let chunkSize = ExpressionContainer.BASE_CHUNK_SIZE;
            while (!!this.indexedVariables && this.indexedVariables > chunkSize * ExpressionContainer.BASE_CHUNK_SIZE) {
                chunkSize *= ExpressionContainer.BASE_CHUNK_SIZE;
            }
            if (!!this.indexedVariables && this.indexedVariables > chunkSize) {
                // There are a lot of children, create fake intermediate values that represent chunks #9537
                const numberOfChunks = Math.ceil(this.indexedVariables / chunkSize);
                for (let i = 0; i < numberOfChunks; i++) {
                    const start = (this.startOfVariables || 0) + i * chunkSize;
                    const count = Math.min(chunkSize, this.indexedVariables - i * chunkSize);
                    children.push(new Variable(this.session, this.threadId, this, this.reference, `[${start}..${start + count - 1}]`, '', '', undefined, count, undefined, { kind: 'virtual' }, undefined, undefined, true, start));
                }
                return children;
            }
            const variables = await this.fetchVariables(this.startOfVariables, this.indexedVariables, 'indexed');
            return children.concat(variables);
        }
        getId() {
            return this.id;
        }
        getSession() {
            return this.session;
        }
        get value() {
            return this._value;
        }
        get hasChildren() {
            // only variables with reference > 0 have children.
            return !!this.reference && this.reference > 0 && !this.presentationHint?.lazy;
        }
        async fetchVariables(start, count, filter) {
            try {
                const response = await this.session.variables(this.reference || 0, this.threadId, filter, start, count);
                if (!response || !response.body || !response.body.variables) {
                    return [];
                }
                const nameCount = new Map();
                const vars = response.body.variables.filter(v => !!v).map((v) => {
                    if ((0, types_1.isString)(v.value) && (0, types_1.isString)(v.name) && typeof v.variablesReference === 'number') {
                        const count = nameCount.get(v.name) || 0;
                        const idDuplicationIndex = count > 0 ? count.toString() : '';
                        nameCount.set(v.name, count + 1);
                        return new Variable(this.session, this.threadId, this, v.variablesReference, v.name, v.evaluateName, v.value, v.namedVariables, v.indexedVariables, v.memoryReference, v.presentationHint, v.type, v.__vscodeVariableMenuContext, true, 0, idDuplicationIndex);
                    }
                    return new Variable(this.session, this.threadId, this, 0, '', undefined, nls.localize('invalidVariableAttributes', "Invalid variable attributes"), 0, 0, undefined, { kind: 'virtual' }, undefined, undefined, false);
                });
                if (this.session.autoExpandLazyVariables) {
                    await Promise.all(vars.map(v => v.presentationHint?.lazy && v.evaluateLazy()));
                }
                return vars;
            }
            catch (e) {
                return [new Variable(this.session, this.threadId, this, 0, '', undefined, e.message, 0, 0, undefined, { kind: 'virtual' }, undefined, undefined, false)];
            }
        }
        // The adapter explicitly sents the children count of an expression only if there are lots of children which should be chunked.
        get getChildrenInChunks() {
            return !!this.indexedVariables;
        }
        set value(value) {
            this._value = value;
            this.valueChanged = !!ExpressionContainer.allValues.get(this.getId()) &&
                ExpressionContainer.allValues.get(this.getId()) !== Expression.DEFAULT_VALUE && ExpressionContainer.allValues.get(this.getId()) !== value;
            ExpressionContainer.allValues.set(this.getId(), value);
        }
        toString() {
            return this.value;
        }
        async evaluateExpression(expression, session, stackFrame, context, keepLazyVars = false) {
            if (!session || (!stackFrame && context !== 'repl')) {
                this.value = context === 'repl' ? nls.localize('startDebugFirst', "Please start a debug session to evaluate expressions") : Expression.DEFAULT_VALUE;
                this.reference = 0;
                return false;
            }
            this.session = session;
            try {
                const response = await session.evaluate(expression, stackFrame ? stackFrame.frameId : undefined, context);
                if (response && response.body) {
                    this.value = response.body.result || '';
                    this.reference = response.body.variablesReference;
                    this.namedVariables = response.body.namedVariables;
                    this.indexedVariables = response.body.indexedVariables;
                    this.memoryReference = response.body.memoryReference;
                    this.type = response.body.type || this.type;
                    this.presentationHint = response.body.presentationHint;
                    if (!keepLazyVars && response.body.presentationHint?.lazy) {
                        await this.evaluateLazy();
                    }
                    return true;
                }
                return false;
            }
            catch (e) {
                this.value = e.message || '';
                this.reference = 0;
                return false;
            }
        }
    }
    exports.ExpressionContainer = ExpressionContainer;
    function handleSetResponse(expression, response) {
        if (response && response.body) {
            expression.value = response.body.value || '';
            expression.type = response.body.type || expression.type;
            expression.reference = response.body.variablesReference;
            expression.namedVariables = response.body.namedVariables;
            expression.indexedVariables = response.body.indexedVariables;
            // todo @weinand: the set responses contain most properties, but not memory references. Should they?
        }
    }
    class VisualizedExpression {
        evaluateLazy() {
            return Promise.resolve();
        }
        getChildren() {
            return this.visualizer.getVisualizedChildren(this.treeId, this.treeItem.id);
        }
        getId() {
            return this.id;
        }
        get name() {
            return this.treeItem.label;
        }
        get value() {
            return this.treeItem.description || '';
        }
        get hasChildren() {
            return this.treeItem.collapsibleState !== 0 /* DebugTreeItemCollapsibleState.None */;
        }
        constructor(visualizer, treeId, treeItem, original) {
            this.visualizer = visualizer;
            this.treeId = treeId;
            this.treeItem = treeItem;
            this.original = original;
            this.id = (0, uuid_1.generateUuid)();
        }
        /** Edits the value, sets the {@link errorMessage} and returns false if unsuccessful */
        async edit(newValue) {
            try {
                await this.visualizer.editTreeItem(this.treeId, this.treeItem, newValue);
                return true;
            }
            catch (e) {
                this.errorMessage = e.message;
                return false;
            }
        }
    }
    exports.VisualizedExpression = VisualizedExpression;
    class Expression extends ExpressionContainer {
        static { this.DEFAULT_VALUE = nls.localize('notAvailable', "not available"); }
        constructor(name, id = (0, uuid_1.generateUuid)()) {
            super(undefined, undefined, 0, id);
            this.name = name;
            this.available = false;
            // name is not set if the expression is just being added
            // in that case do not set default value to prevent flashing #14499
            if (name) {
                this.value = Expression.DEFAULT_VALUE;
            }
        }
        async evaluate(session, stackFrame, context, keepLazyVars) {
            this.available = await this.evaluateExpression(this.name, session, stackFrame, context, keepLazyVars);
        }
        toString() {
            return `${this.name}\n${this.value}`;
        }
        async setExpression(value, stackFrame) {
            if (!this.session) {
                return;
            }
            const response = await this.session.setExpression(stackFrame.frameId, this.name, value);
            handleSetResponse(this, response);
        }
    }
    exports.Expression = Expression;
    class Variable extends ExpressionContainer {
        constructor(session, threadId, parent, reference, name, evaluateName, value, namedVariables, indexedVariables, memoryReference, presentationHint, type = undefined, variableMenuContext = undefined, available = true, startOfVariables = 0, idDuplicationIndex = '') {
            super(session, threadId, reference, `variable:${parent.getId()}:${name}:${idDuplicationIndex}`, namedVariables, indexedVariables, memoryReference, startOfVariables, presentationHint);
            this.parent = parent;
            this.name = name;
            this.evaluateName = evaluateName;
            this.variableMenuContext = variableMenuContext;
            this.available = available;
            this.value = value || '';
            this.type = type;
        }
        getThreadId() {
            return this.threadId;
        }
        async setVariable(value, stackFrame) {
            if (!this.session) {
                return;
            }
            try {
                // Send out a setExpression for debug extensions that do not support set variables https://github.com/microsoft/vscode/issues/124679#issuecomment-869844437
                if (this.session.capabilities.supportsSetExpression && !this.session.capabilities.supportsSetVariable && this.evaluateName) {
                    return this.setExpression(value, stackFrame);
                }
                const response = await this.session.setVariable(this.parent.reference, this.name, value);
                handleSetResponse(this, response);
            }
            catch (err) {
                this.errorMessage = err.message;
            }
        }
        async setExpression(value, stackFrame) {
            if (!this.session || !this.evaluateName) {
                return;
            }
            const response = await this.session.setExpression(stackFrame.frameId, this.evaluateName, value);
            handleSetResponse(this, response);
        }
        toString() {
            return this.name ? `${this.name}: ${this.value}` : this.value;
        }
        adoptLazyResponse(response) {
            this.evaluateName = response.evaluateName;
        }
        toDebugProtocolObject() {
            return {
                name: this.name,
                variablesReference: this.reference || 0,
                memoryReference: this.memoryReference,
                value: this.value,
                evaluateName: this.evaluateName
            };
        }
    }
    exports.Variable = Variable;
    class Scope extends ExpressionContainer {
        constructor(stackFrame, id, name, reference, expensive, namedVariables, indexedVariables, range) {
            super(stackFrame.thread.session, stackFrame.thread.threadId, reference, `scope:${name}:${id}`, namedVariables, indexedVariables);
            this.stackFrame = stackFrame;
            this.name = name;
            this.expensive = expensive;
            this.range = range;
        }
        toString() {
            return this.name;
        }
        toDebugProtocolObject() {
            return {
                name: this.name,
                variablesReference: this.reference || 0,
                expensive: this.expensive
            };
        }
    }
    exports.Scope = Scope;
    class ErrorScope extends Scope {
        constructor(stackFrame, index, message) {
            super(stackFrame, index, message, 0, false);
        }
        toString() {
            return this.name;
        }
    }
    exports.ErrorScope = ErrorScope;
    class StackFrame {
        constructor(thread, frameId, source, name, presentationHint, range, index, canRestart, instructionPointerReference) {
            this.thread = thread;
            this.frameId = frameId;
            this.source = source;
            this.name = name;
            this.presentationHint = presentationHint;
            this.range = range;
            this.index = index;
            this.canRestart = canRestart;
            this.instructionPointerReference = instructionPointerReference;
        }
        getId() {
            return `stackframe:${this.thread.getId()}:${this.index}:${this.source.name}`;
        }
        getScopes() {
            if (!this.scopes) {
                this.scopes = this.thread.session.scopes(this.frameId, this.thread.threadId).then(response => {
                    if (!response || !response.body || !response.body.scopes) {
                        return [];
                    }
                    const usedIds = new Set();
                    return response.body.scopes.map(rs => {
                        // form the id based on the name and location so that it's the
                        // same across multiple pauses to retain expansion state
                        let id = 0;
                        do {
                            id = (0, hash_1.stringHash)(`${rs.name}:${rs.line}:${rs.column}`, id);
                        } while (usedIds.has(id));
                        usedIds.add(id);
                        return new Scope(this, id, rs.name, rs.variablesReference, rs.expensive, rs.namedVariables, rs.indexedVariables, rs.line && rs.column && rs.endLine && rs.endColumn ? new range_1.Range(rs.line, rs.column, rs.endLine, rs.endColumn) : undefined);
                    });
                }, err => [new ErrorScope(this, 0, err.message)]);
            }
            return this.scopes;
        }
        async getMostSpecificScopes(range) {
            const scopes = await this.getScopes();
            const nonExpensiveScopes = scopes.filter(s => !s.expensive);
            const haveRangeInfo = nonExpensiveScopes.some(s => !!s.range);
            if (!haveRangeInfo) {
                return nonExpensiveScopes;
            }
            const scopesContainingRange = nonExpensiveScopes.filter(scope => scope.range && range_1.Range.containsRange(scope.range, range))
                .sort((first, second) => (first.range.endLineNumber - first.range.startLineNumber) - (second.range.endLineNumber - second.range.startLineNumber));
            return scopesContainingRange.length ? scopesContainingRange : nonExpensiveScopes;
        }
        restart() {
            return this.thread.session.restartFrame(this.frameId, this.thread.threadId);
        }
        forgetScopes() {
            this.scopes = undefined;
        }
        toString() {
            const lineNumberToString = typeof this.range.startLineNumber === 'number' ? `:${this.range.startLineNumber}` : '';
            const sourceToString = `${this.source.inMemory ? this.source.name : this.source.uri.fsPath}${lineNumberToString}`;
            return sourceToString === debugSource_1.UNKNOWN_SOURCE_LABEL ? this.name : `${this.name} (${sourceToString})`;
        }
        async openInEditor(editorService, preserveFocus, sideBySide, pinned) {
            const threadStopReason = this.thread.stoppedDetails?.reason;
            if (this.instructionPointerReference &&
                (threadStopReason === 'instruction breakpoint' ||
                    (threadStopReason === 'step' && this.thread.lastSteppingGranularity === 'instruction') ||
                    editorService.activeEditor instanceof disassemblyViewInput_1.DisassemblyViewInput)) {
                return editorService.openEditor(disassemblyViewInput_1.DisassemblyViewInput.instance, { pinned: true, revealIfOpened: true });
            }
            if (this.source.available) {
                return this.source.openInEditor(editorService, this.range, preserveFocus, sideBySide, pinned);
            }
            return undefined;
        }
        equals(other) {
            return (this.name === other.name) && (other.thread === this.thread) && (this.frameId === other.frameId) && (other.source === this.source) && (range_1.Range.equalsRange(this.range, other.range));
        }
    }
    exports.StackFrame = StackFrame;
    class Thread {
        constructor(session, name, threadId) {
            this.session = session;
            this.name = name;
            this.threadId = threadId;
            this.callStackCancellationTokens = [];
            this.reachedEndOfCallStack = false;
            this.callStack = [];
            this.staleCallStack = [];
            this.stopped = false;
        }
        getId() {
            return `thread:${this.session.getId()}:${this.threadId}`;
        }
        clearCallStack() {
            if (this.callStack.length) {
                this.staleCallStack = this.callStack;
            }
            this.callStack = [];
            this.callStackCancellationTokens.forEach(c => c.dispose(true));
            this.callStackCancellationTokens = [];
        }
        getCallStack() {
            return this.callStack;
        }
        getStaleCallStack() {
            return this.staleCallStack;
        }
        getTopStackFrame() {
            const callStack = this.getCallStack();
            // Allow stack frame without source and with instructionReferencePointer as top stack frame when using disassembly view.
            const firstAvailableStackFrame = callStack.find(sf => !!(sf &&
                ((this.stoppedDetails?.reason === 'instruction breakpoint' || (this.stoppedDetails?.reason === 'step' && this.lastSteppingGranularity === 'instruction')) && sf.instructionPointerReference) ||
                (sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize')));
            return firstAvailableStackFrame;
        }
        get stateLabel() {
            if (this.stoppedDetails) {
                return this.stoppedDetails.description ||
                    (this.stoppedDetails.reason ? nls.localize({ key: 'pausedOn', comment: ['indicates reason for program being paused'] }, "Paused on {0}", this.stoppedDetails.reason) : nls.localize('paused', "Paused"));
            }
            return nls.localize({ key: 'running', comment: ['indicates state'] }, "Running");
        }
        /**
         * Queries the debug adapter for the callstack and returns a promise
         * which completes once the call stack has been retrieved.
         * If the thread is not stopped, it returns a promise to an empty array.
         * Only fetches the first stack frame for performance reasons. Calling this method consecutive times
         * gets the remainder of the call stack.
         */
        async fetchCallStack(levels = 20) {
            if (this.stopped) {
                const start = this.callStack.length;
                const callStack = await this.getCallStackImpl(start, levels);
                this.reachedEndOfCallStack = callStack.length < levels;
                if (start < this.callStack.length) {
                    // Set the stack frames for exact position we requested. To make sure no concurrent requests create duplicate stack frames #30660
                    this.callStack.splice(start, this.callStack.length - start);
                }
                this.callStack = this.callStack.concat(callStack || []);
                if (typeof this.stoppedDetails?.totalFrames === 'number' && this.stoppedDetails.totalFrames === this.callStack.length) {
                    this.reachedEndOfCallStack = true;
                }
            }
        }
        async getCallStackImpl(startFrame, levels) {
            try {
                const tokenSource = new cancellation_1.CancellationTokenSource();
                this.callStackCancellationTokens.push(tokenSource);
                const response = await this.session.stackTrace(this.threadId, startFrame, levels, tokenSource.token);
                if (!response || !response.body || tokenSource.token.isCancellationRequested) {
                    return [];
                }
                if (this.stoppedDetails) {
                    this.stoppedDetails.totalFrames = response.body.totalFrames;
                }
                return response.body.stackFrames.map((rsf, index) => {
                    const source = this.session.getSource(rsf.source);
                    return new StackFrame(this, rsf.id, source, rsf.name, rsf.presentationHint, new range_1.Range(rsf.line, rsf.column, rsf.endLine || rsf.line, rsf.endColumn || rsf.column), startFrame + index, typeof rsf.canRestart === 'boolean' ? rsf.canRestart : true, rsf.instructionPointerReference);
                });
            }
            catch (err) {
                if (this.stoppedDetails) {
                    this.stoppedDetails.framesErrorMessage = err.message;
                }
                return [];
            }
        }
        /**
         * Returns exception info promise if the exception was thrown, otherwise undefined
         */
        get exceptionInfo() {
            if (this.stoppedDetails && this.stoppedDetails.reason === 'exception') {
                if (this.session.capabilities.supportsExceptionInfoRequest) {
                    return this.session.exceptionInfo(this.threadId);
                }
                return Promise.resolve({
                    description: this.stoppedDetails.text,
                    breakMode: null
                });
            }
            return Promise.resolve(undefined);
        }
        next(granularity) {
            return this.session.next(this.threadId, granularity);
        }
        stepIn(granularity) {
            return this.session.stepIn(this.threadId, undefined, granularity);
        }
        stepOut(granularity) {
            return this.session.stepOut(this.threadId, granularity);
        }
        stepBack(granularity) {
            return this.session.stepBack(this.threadId, granularity);
        }
        continue() {
            return this.session.continue(this.threadId);
        }
        pause() {
            return this.session.pause(this.threadId);
        }
        terminate() {
            return this.session.terminateThreads([this.threadId]);
        }
        reverseContinue() {
            return this.session.reverseContinue(this.threadId);
        }
    }
    exports.Thread = Thread;
    /**
     * Gets a URI to a memory in the given session ID.
     */
    const getUriForDebugMemory = (sessionId, memoryReference, range, displayName = 'memory') => {
        return uri_1.URI.from({
            scheme: debug_1.DEBUG_MEMORY_SCHEME,
            authority: sessionId,
            path: '/' + encodeURIComponent(memoryReference) + `/${encodeURIComponent(displayName)}.bin`,
            query: range ? `?range=${range.fromOffset}:${range.toOffset}` : undefined,
        });
    };
    exports.getUriForDebugMemory = getUriForDebugMemory;
    class MemoryRegion extends lifecycle_1.Disposable {
        constructor(memoryReference, session) {
            super();
            this.memoryReference = memoryReference;
            this.session = session;
            this.invalidateEmitter = this._register(new event_1.Emitter());
            /** @inheritdoc */
            this.onDidInvalidate = this.invalidateEmitter.event;
            /** @inheritdoc */
            this.writable = !!this.session.capabilities.supportsWriteMemoryRequest;
            this._register(session.onDidInvalidateMemory(e => {
                if (e.body.memoryReference === memoryReference) {
                    this.invalidate(e.body.offset, e.body.count - e.body.offset);
                }
            }));
        }
        async read(fromOffset, toOffset) {
            const length = toOffset - fromOffset;
            const offset = fromOffset;
            const result = await this.session.readMemory(this.memoryReference, offset, length);
            if (result === undefined || !result.body?.data) {
                return [{ type: 1 /* MemoryRangeType.Unreadable */, offset, length }];
            }
            let data;
            try {
                data = (0, buffer_1.decodeBase64)(result.body.data);
            }
            catch {
                return [{ type: 2 /* MemoryRangeType.Error */, offset, length, error: 'Invalid base64 data from debug adapter' }];
            }
            const unreadable = result.body.unreadableBytes || 0;
            const dataLength = length - unreadable;
            if (data.byteLength < dataLength) {
                const pad = buffer_1.VSBuffer.alloc(dataLength - data.byteLength);
                pad.buffer.fill(0);
                data = buffer_1.VSBuffer.concat([data, pad], dataLength);
            }
            else if (data.byteLength > dataLength) {
                data = data.slice(0, dataLength);
            }
            if (!unreadable) {
                return [{ type: 0 /* MemoryRangeType.Valid */, offset, length, data }];
            }
            return [
                { type: 0 /* MemoryRangeType.Valid */, offset, length: dataLength, data },
                { type: 1 /* MemoryRangeType.Unreadable */, offset: offset + dataLength, length: unreadable },
            ];
        }
        async write(offset, data) {
            const result = await this.session.writeMemory(this.memoryReference, offset, (0, buffer_1.encodeBase64)(data), true);
            const written = result?.body?.bytesWritten ?? data.byteLength;
            this.invalidate(offset, offset + written);
            return written;
        }
        dispose() {
            super.dispose();
        }
        invalidate(fromOffset, toOffset) {
            this.invalidateEmitter.fire({ fromOffset, toOffset });
        }
    }
    exports.MemoryRegion = MemoryRegion;
    class Enablement {
        constructor(enabled, id) {
            this.enabled = enabled;
            this.id = id;
        }
        getId() {
            return this.id;
        }
    }
    exports.Enablement = Enablement;
    function toBreakpointSessionData(data, capabilities) {
        return (0, objects_1.mixin)({
            supportsConditionalBreakpoints: !!capabilities.supportsConditionalBreakpoints,
            supportsHitConditionalBreakpoints: !!capabilities.supportsHitConditionalBreakpoints,
            supportsLogPoints: !!capabilities.supportsLogPoints,
            supportsFunctionBreakpoints: !!capabilities.supportsFunctionBreakpoints,
            supportsDataBreakpoints: !!capabilities.supportsDataBreakpoints,
            supportsInstructionBreakpoints: !!capabilities.supportsInstructionBreakpoints
        }, data);
    }
    class BaseBreakpoint extends Enablement {
        constructor(id, opts) {
            super(opts.enabled ?? true, id);
            this.sessionData = new Map();
            this.condition = opts.condition;
            this.hitCondition = opts.hitCondition;
            this.logMessage = opts.logMessage;
            this.mode = opts.mode;
            this.modeLabel = opts.modeLabel;
        }
        setSessionData(sessionId, data) {
            if (!data) {
                this.sessionData.delete(sessionId);
            }
            else {
                data.sessionId = sessionId;
                this.sessionData.set(sessionId, data);
            }
            const allData = Array.from(this.sessionData.values());
            const verifiedData = (0, arrays_1.distinct)(allData.filter(d => d.verified), d => `${d.line}:${d.column}`);
            if (verifiedData.length) {
                // In case multiple session verified the breakpoint and they provide different data show the intial data that the user set (corner case)
                this.data = verifiedData.length === 1 ? verifiedData[0] : undefined;
            }
            else {
                // No session verified the breakpoint
                this.data = allData.length ? allData[0] : undefined;
            }
        }
        get message() {
            if (!this.data) {
                return undefined;
            }
            return this.data.message;
        }
        get verified() {
            return this.data ? this.data.verified : true;
        }
        get sessionsThatVerified() {
            const sessionIds = [];
            for (const [sessionId, data] of this.sessionData) {
                if (data.verified) {
                    sessionIds.push(sessionId);
                }
            }
            return sessionIds;
        }
        getIdFromAdapter(sessionId) {
            const data = this.sessionData.get(sessionId);
            return data ? data.id : undefined;
        }
        getDebugProtocolBreakpoint(sessionId) {
            const data = this.sessionData.get(sessionId);
            if (data) {
                const bp = {
                    id: data.id,
                    verified: data.verified,
                    message: data.message,
                    source: data.source,
                    line: data.line,
                    column: data.column,
                    endLine: data.endLine,
                    endColumn: data.endColumn,
                    instructionReference: data.instructionReference,
                    offset: data.offset
                };
                return bp;
            }
            return undefined;
        }
        toJSON() {
            return {
                id: this.getId(),
                enabled: this.enabled,
                condition: this.condition,
                hitCondition: this.hitCondition,
                logMessage: this.logMessage,
                mode: this.mode,
                modeLabel: this.modeLabel,
            };
        }
    }
    exports.BaseBreakpoint = BaseBreakpoint;
    class Breakpoint extends BaseBreakpoint {
        constructor(opts, textFileService, uriIdentityService, logService, id = (0, uuid_1.generateUuid)()) {
            super(id, opts);
            this.textFileService = textFileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._uri = opts.uri;
            this._lineNumber = opts.lineNumber;
            this._column = opts.column;
            this._adapterData = opts.adapterData;
            this.triggeredBy = opts.triggeredBy;
        }
        toDAP() {
            return {
                line: this.sessionAgnosticData.lineNumber,
                column: this.sessionAgnosticData.column,
                condition: this.condition,
                hitCondition: this.hitCondition,
                logMessage: this.logMessage,
                mode: this.mode
            };
        }
        get originalUri() {
            return this._uri;
        }
        get lineNumber() {
            return this.verified && this.data && typeof this.data.line === 'number' ? this.data.line : this._lineNumber;
        }
        get verified() {
            if (this.data) {
                return this.data.verified && !this.textFileService.isDirty(this._uri);
            }
            return true;
        }
        get pending() {
            if (this.data) {
                return false;
            }
            return this.triggeredBy !== undefined;
        }
        get uri() {
            return this.verified && this.data && this.data.source ? (0, debugSource_1.getUriFromSource)(this.data.source, this.data.source.path, this.data.sessionId, this.uriIdentityService, this.logService) : this._uri;
        }
        get column() {
            return this.verified && this.data && typeof this.data.column === 'number' ? this.data.column : this._column;
        }
        get message() {
            if (this.textFileService.isDirty(this.uri)) {
                return nls.localize('breakpointDirtydHover', "Unverified breakpoint. File is modified, please restart debug session.");
            }
            return super.message;
        }
        get adapterData() {
            return this.data && this.data.source && this.data.source.adapterData ? this.data.source.adapterData : this._adapterData;
        }
        get endLineNumber() {
            return this.verified && this.data ? this.data.endLine : undefined;
        }
        get endColumn() {
            return this.verified && this.data ? this.data.endColumn : undefined;
        }
        get sessionAgnosticData() {
            return {
                lineNumber: this._lineNumber,
                column: this._column
            };
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            if (this.logMessage && !this.data.supportsLogPoints) {
                return false;
            }
            if (this.condition && !this.data.supportsConditionalBreakpoints) {
                return false;
            }
            if (this.hitCondition && !this.data.supportsHitConditionalBreakpoints) {
                return false;
            }
            return true;
        }
        setSessionData(sessionId, data) {
            super.setSessionData(sessionId, data);
            if (!this._adapterData) {
                this._adapterData = this.adapterData;
            }
        }
        toJSON() {
            return {
                ...super.toJSON(),
                uri: this._uri,
                lineNumber: this._lineNumber,
                column: this._column,
                adapterData: this.adapterData,
                triggeredBy: this.triggeredBy,
            };
        }
        toString() {
            return `${resources.basenameOrAuthority(this.uri)} ${this.lineNumber}`;
        }
        setSessionDidTrigger(sessionId) {
            this.sessionsDidTrigger ??= new Set();
            this.sessionsDidTrigger.add(sessionId);
        }
        getSessionDidTrigger(sessionId) {
            return !!this.sessionsDidTrigger?.has(sessionId);
        }
        update(data) {
            if (data.hasOwnProperty('lineNumber') && !(0, types_1.isUndefinedOrNull)(data.lineNumber)) {
                this._lineNumber = data.lineNumber;
            }
            if (data.hasOwnProperty('column')) {
                this._column = data.column;
            }
            if (data.hasOwnProperty('condition')) {
                this.condition = data.condition;
            }
            if (data.hasOwnProperty('hitCondition')) {
                this.hitCondition = data.hitCondition;
            }
            if (data.hasOwnProperty('logMessage')) {
                this.logMessage = data.logMessage;
            }
            if (data.hasOwnProperty('mode')) {
                this.mode = data.mode;
                this.modeLabel = data.modeLabel;
            }
            if (data.hasOwnProperty('triggeredBy')) {
                this.triggeredBy = data.triggeredBy;
                this.sessionsDidTrigger = undefined;
            }
        }
    }
    exports.Breakpoint = Breakpoint;
    class FunctionBreakpoint extends BaseBreakpoint {
        constructor(opts, id = (0, uuid_1.generateUuid)()) {
            super(id, opts);
            this.name = opts.name;
        }
        toDAP() {
            return {
                name: this.name,
                condition: this.condition,
                hitCondition: this.hitCondition,
            };
        }
        toJSON() {
            return {
                ...super.toJSON(),
                name: this.name,
            };
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsFunctionBreakpoints;
        }
        toString() {
            return this.name;
        }
    }
    exports.FunctionBreakpoint = FunctionBreakpoint;
    class DataBreakpoint extends BaseBreakpoint {
        constructor(opts, id = (0, uuid_1.generateUuid)()) {
            super(id, opts);
            this.sessionDataIdForAddr = new WeakMap();
            this.description = opts.description;
            if ('dataId' in opts) { //  back compat with old saved variables in 1.87
                opts.src = { type: 0 /* DataBreakpointSetType.Variable */, dataId: opts.dataId };
            }
            this.src = opts.src;
            this.canPersist = opts.canPersist;
            this.accessTypes = opts.accessTypes;
            this.accessType = opts.accessType;
            if (opts.initialSessionData) {
                this.sessionDataIdForAddr.set(opts.initialSessionData.session, opts.initialSessionData.dataId);
            }
        }
        async toDAP(session) {
            let dataId;
            if (this.src.type === 0 /* DataBreakpointSetType.Variable */) {
                dataId = this.src.dataId;
            }
            else {
                let sessionDataId = this.sessionDataIdForAddr.get(session);
                if (!sessionDataId) {
                    sessionDataId = (await session.dataBytesBreakpointInfo(this.src.address, this.src.bytes))?.dataId;
                    if (!sessionDataId) {
                        return undefined;
                    }
                    this.sessionDataIdForAddr.set(session, sessionDataId);
                }
                dataId = sessionDataId;
            }
            return {
                dataId,
                accessType: this.accessType,
                condition: this.condition,
                hitCondition: this.hitCondition,
            };
        }
        toJSON() {
            return {
                ...super.toJSON(),
                description: this.description,
                src: this.src,
                accessTypes: this.accessTypes,
                accessType: this.accessType,
                canPersist: this.canPersist,
            };
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsDataBreakpoints;
        }
        toString() {
            return this.description;
        }
    }
    exports.DataBreakpoint = DataBreakpoint;
    class ExceptionBreakpoint extends BaseBreakpoint {
        constructor(opts, id = (0, uuid_1.generateUuid)()) {
            super(id, opts);
            this.supportedSessions = new Set();
            this.fallback = false;
            this.filter = opts.filter;
            this.label = opts.label;
            this.supportsCondition = opts.supportsCondition;
            this.description = opts.description;
            this.conditionDescription = opts.conditionDescription;
            this.fallback = opts.fallback || false;
        }
        toJSON() {
            return {
                ...super.toJSON(),
                filter: this.filter,
                label: this.label,
                enabled: this.enabled,
                supportsCondition: this.supportsCondition,
                conditionDescription: this.conditionDescription,
                condition: this.condition,
                fallback: this.fallback,
                description: this.description,
            };
        }
        setSupportedSession(sessionId, supported) {
            if (supported) {
                this.supportedSessions.add(sessionId);
            }
            else {
                this.supportedSessions.delete(sessionId);
            }
        }
        /**
         * Used to specify which breakpoints to show when no session is specified.
         * Useful when no session is active and we want to show the exception breakpoints from the last session.
         */
        setFallback(isFallback) {
            this.fallback = isFallback;
        }
        get supported() {
            return true;
        }
        /**
         * Checks if the breakpoint is applicable for the specified session.
         * If sessionId is undefined, returns true if this breakpoint is a fallback breakpoint.
         */
        isSupportedSession(sessionId) {
            return sessionId ? this.supportedSessions.has(sessionId) : this.fallback;
        }
        matches(filter) {
            return this.filter === filter.filter
                && this.label === filter.label
                && this.supportsCondition === !!filter.supportsCondition
                && this.conditionDescription === filter.conditionDescription
                && this.description === filter.description;
        }
        toString() {
            return this.label;
        }
    }
    exports.ExceptionBreakpoint = ExceptionBreakpoint;
    class InstructionBreakpoint extends BaseBreakpoint {
        constructor(opts, id = (0, uuid_1.generateUuid)()) {
            super(id, opts);
            this.instructionReference = opts.instructionReference;
            this.offset = opts.offset;
            this.canPersist = opts.canPersist;
            this.address = opts.address;
        }
        toDAP() {
            return {
                instructionReference: this.instructionReference,
                condition: this.condition,
                hitCondition: this.hitCondition,
                mode: this.mode,
                offset: this.offset,
            };
        }
        toJSON() {
            return {
                ...super.toJSON(),
                instructionReference: this.instructionReference,
                offset: this.offset,
                canPersist: this.canPersist,
                address: this.address,
            };
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsInstructionBreakpoints;
        }
        toString() {
            return this.instructionReference;
        }
    }
    exports.InstructionBreakpoint = InstructionBreakpoint;
    class ThreadAndSessionIds {
        constructor(sessionId, threadId) {
            this.sessionId = sessionId;
            this.threadId = threadId;
        }
        getId() {
            return `${this.sessionId}:${this.threadId}`;
        }
    }
    exports.ThreadAndSessionIds = ThreadAndSessionIds;
    let DebugModel = class DebugModel extends lifecycle_1.Disposable {
        constructor(debugStorage, textFileService, uriIdentityService, logService) {
            super();
            this.textFileService = textFileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.schedulers = new Map();
            this.breakpointsActivated = true;
            this._onDidChangeBreakpoints = this._register(new event_1.Emitter());
            this._onDidChangeCallStack = this._register(new event_1.Emitter());
            this._onDidChangeWatchExpressions = this._register(new event_1.Emitter());
            this._breakpointModes = new Map();
            this._register((0, observable_1.autorun)(reader => {
                this.breakpoints = debugStorage.breakpoints.read(reader);
                this.functionBreakpoints = debugStorage.functionBreakpoints.read(reader);
                this.exceptionBreakpoints = debugStorage.exceptionBreakpoints.read(reader);
                this.dataBreakpoints = debugStorage.dataBreakpoints.read(reader);
                this._onDidChangeBreakpoints.fire(undefined);
            }));
            this._register((0, observable_1.autorun)(reader => {
                this.watchExpressions = debugStorage.watchExpressions.read(reader);
                this._onDidChangeWatchExpressions.fire(undefined);
            }));
            this.instructionBreakpoints = [];
            this.sessions = [];
        }
        getId() {
            return 'root';
        }
        getSession(sessionId, includeInactive = false) {
            if (sessionId) {
                return this.getSessions(includeInactive).find(s => s.getId() === sessionId);
            }
            return undefined;
        }
        getSessions(includeInactive = false) {
            // By default do not return inactive sessions.
            // However we are still holding onto inactive sessions due to repl and debug service session revival (eh scenario)
            return this.sessions.filter(s => includeInactive || s.state !== 0 /* State.Inactive */);
        }
        addSession(session) {
            this.sessions = this.sessions.filter(s => {
                if (s.getId() === session.getId()) {
                    // Make sure to de-dupe if a session is re-initialized. In case of EH debugging we are adding a session again after an attach.
                    return false;
                }
                if (s.state === 0 /* State.Inactive */ && s.configuration.name === session.configuration.name) {
                    // Make sure to remove all inactive sessions that are using the same configuration as the new session
                    return false;
                }
                return true;
            });
            let i = 1;
            while (this.sessions.some(s => s.getLabel() === session.getLabel())) {
                session.setName(`${session.configuration.name} ${++i}`);
            }
            let index = -1;
            if (session.parentSession) {
                // Make sure that child sessions are placed after the parent session
                index = (0, arraysFind_1.findLastIdx)(this.sessions, s => s.parentSession === session.parentSession || s === session.parentSession);
            }
            if (index >= 0) {
                this.sessions.splice(index + 1, 0, session);
            }
            else {
                this.sessions.push(session);
            }
            this._onDidChangeCallStack.fire(undefined);
        }
        get onDidChangeBreakpoints() {
            return this._onDidChangeBreakpoints.event;
        }
        get onDidChangeCallStack() {
            return this._onDidChangeCallStack.event;
        }
        get onDidChangeWatchExpressions() {
            return this._onDidChangeWatchExpressions.event;
        }
        rawUpdate(data) {
            const session = this.sessions.find(p => p.getId() === data.sessionId);
            if (session) {
                session.rawUpdate(data);
                this._onDidChangeCallStack.fire(undefined);
            }
        }
        clearThreads(id, removeThreads, reference = undefined) {
            const session = this.sessions.find(p => p.getId() === id);
            this.schedulers.forEach(entry => {
                entry.scheduler.dispose();
                entry.completeDeferred.complete();
            });
            this.schedulers.clear();
            if (session) {
                session.clearThreads(removeThreads, reference);
                this._onDidChangeCallStack.fire(undefined);
            }
        }
        /**
         * Update the call stack and notify the call stack view that changes have occurred.
         */
        async fetchCallstack(thread, levels) {
            if (thread.reachedEndOfCallStack) {
                return;
            }
            const totalFrames = thread.stoppedDetails?.totalFrames;
            const remainingFrames = (typeof totalFrames === 'number') ? (totalFrames - thread.getCallStack().length) : undefined;
            if (!levels || (remainingFrames && levels > remainingFrames)) {
                levels = remainingFrames;
            }
            if (levels && levels > 0) {
                await thread.fetchCallStack(levels);
                this._onDidChangeCallStack.fire();
            }
            return;
        }
        refreshTopOfCallstack(thread, fetchFullStack = true) {
            if (thread.session.capabilities.supportsDelayedStackTraceLoading) {
                // For improved performance load the first stack frame and then load the rest async.
                let topCallStack = Promise.resolve();
                const wholeCallStack = new Promise((c, e) => {
                    topCallStack = thread.fetchCallStack(1).then(() => {
                        if (!this.schedulers.has(thread.getId()) && fetchFullStack) {
                            const deferred = new async_1.DeferredPromise();
                            this.schedulers.set(thread.getId(), {
                                completeDeferred: deferred,
                                scheduler: new async_1.RunOnceScheduler(() => {
                                    thread.fetchCallStack(19).then(() => {
                                        const stale = thread.getStaleCallStack();
                                        const current = thread.getCallStack();
                                        let bottomOfCallStackChanged = stale.length !== current.length;
                                        for (let i = 1; i < stale.length && !bottomOfCallStackChanged; i++) {
                                            bottomOfCallStackChanged = !stale[i].equals(current[i]);
                                        }
                                        if (bottomOfCallStackChanged) {
                                            this._onDidChangeCallStack.fire();
                                        }
                                    }).finally(() => {
                                        deferred.complete();
                                        this.schedulers.delete(thread.getId());
                                    });
                                }, 420)
                            });
                        }
                        const entry = this.schedulers.get(thread.getId());
                        entry.scheduler.schedule();
                        entry.completeDeferred.p.then(c, e);
                        this._onDidChangeCallStack.fire();
                    });
                });
                return { topCallStack, wholeCallStack };
            }
            const wholeCallStack = thread.fetchCallStack();
            return { wholeCallStack, topCallStack: wholeCallStack };
        }
        getBreakpoints(filter) {
            if (filter) {
                const uriStr = filter.uri?.toString();
                const originalUriStr = filter.originalUri?.toString();
                return this.breakpoints.filter(bp => {
                    if (uriStr && bp.uri.toString() !== uriStr) {
                        return false;
                    }
                    if (originalUriStr && bp.originalUri.toString() !== originalUriStr) {
                        return false;
                    }
                    if (filter.lineNumber && bp.lineNumber !== filter.lineNumber) {
                        return false;
                    }
                    if (filter.column && bp.column !== filter.column) {
                        return false;
                    }
                    if (filter.enabledOnly && (!this.breakpointsActivated || !bp.enabled)) {
                        return false;
                    }
                    if (filter.triggeredOnly && bp.triggeredBy === undefined) {
                        return false;
                    }
                    return true;
                });
            }
            return this.breakpoints;
        }
        getFunctionBreakpoints() {
            return this.functionBreakpoints;
        }
        getDataBreakpoints() {
            return this.dataBreakpoints;
        }
        getExceptionBreakpoints() {
            return this.exceptionBreakpoints;
        }
        getExceptionBreakpointsForSession(sessionId) {
            return this.exceptionBreakpoints.filter(ebp => ebp.isSupportedSession(sessionId));
        }
        getInstructionBreakpoints() {
            return this.instructionBreakpoints;
        }
        setExceptionBreakpointsForSession(sessionId, filters) {
            if (!filters) {
                return;
            }
            let didChangeBreakpoints = false;
            filters.forEach((d) => {
                let ebp = this.exceptionBreakpoints.filter((exbp) => exbp.matches(d)).pop();
                if (!ebp) {
                    didChangeBreakpoints = true;
                    ebp = new ExceptionBreakpoint({
                        filter: d.filter,
                        label: d.label,
                        enabled: !!d.default,
                        supportsCondition: !!d.supportsCondition,
                        description: d.description,
                        conditionDescription: d.conditionDescription,
                    });
                    this.exceptionBreakpoints.push(ebp);
                }
                ebp.setSupportedSession(sessionId, true);
            });
            if (didChangeBreakpoints) {
                this._onDidChangeBreakpoints.fire(undefined);
            }
        }
        removeExceptionBreakpointsForSession(sessionId) {
            this.exceptionBreakpoints.forEach(ebp => ebp.setSupportedSession(sessionId, false));
        }
        // Set last focused session as fallback session.
        // This is done to keep track of the exception breakpoints to show when no session is active.
        setExceptionBreakpointFallbackSession(sessionId) {
            this.exceptionBreakpoints.forEach(ebp => ebp.setFallback(ebp.isSupportedSession(sessionId)));
        }
        setExceptionBreakpointCondition(exceptionBreakpoint, condition) {
            exceptionBreakpoint.condition = condition;
            this._onDidChangeBreakpoints.fire(undefined);
        }
        areBreakpointsActivated() {
            return this.breakpointsActivated;
        }
        setBreakpointsActivated(activated) {
            this.breakpointsActivated = activated;
            this._onDidChangeBreakpoints.fire(undefined);
        }
        addBreakpoints(uri, rawData, fireEvent = true) {
            const newBreakpoints = rawData.map(rawBp => {
                return new Breakpoint({
                    uri,
                    lineNumber: rawBp.lineNumber,
                    column: rawBp.column,
                    enabled: rawBp.enabled ?? true,
                    condition: rawBp.condition,
                    hitCondition: rawBp.hitCondition,
                    logMessage: rawBp.logMessage,
                    triggeredBy: rawBp.triggeredBy,
                    adapterData: undefined,
                    mode: rawBp.mode,
                    modeLabel: rawBp.modeLabel,
                }, this.textFileService, this.uriIdentityService, this.logService, rawBp.id);
            });
            this.breakpoints = this.breakpoints.concat(newBreakpoints);
            this.breakpointsActivated = true;
            this.sortAndDeDup();
            if (fireEvent) {
                this._onDidChangeBreakpoints.fire({ added: newBreakpoints, sessionOnly: false });
            }
            return newBreakpoints;
        }
        removeBreakpoints(toRemove) {
            this.breakpoints = this.breakpoints.filter(bp => !toRemove.some(toRemove => toRemove.getId() === bp.getId()));
            this._onDidChangeBreakpoints.fire({ removed: toRemove, sessionOnly: false });
        }
        updateBreakpoints(data) {
            const updated = [];
            this.breakpoints.forEach(bp => {
                const bpData = data.get(bp.getId());
                if (bpData) {
                    bp.update(bpData);
                    updated.push(bp);
                }
            });
            this.sortAndDeDup();
            this._onDidChangeBreakpoints.fire({ changed: updated, sessionOnly: false });
        }
        setBreakpointSessionData(sessionId, capabilites, data) {
            this.breakpoints.forEach(bp => {
                if (!data) {
                    bp.setSessionData(sessionId, undefined);
                }
                else {
                    const bpData = data.get(bp.getId());
                    if (bpData) {
                        bp.setSessionData(sessionId, toBreakpointSessionData(bpData, capabilites));
                    }
                }
            });
            this.functionBreakpoints.forEach(fbp => {
                if (!data) {
                    fbp.setSessionData(sessionId, undefined);
                }
                else {
                    const fbpData = data.get(fbp.getId());
                    if (fbpData) {
                        fbp.setSessionData(sessionId, toBreakpointSessionData(fbpData, capabilites));
                    }
                }
            });
            this.dataBreakpoints.forEach(dbp => {
                if (!data) {
                    dbp.setSessionData(sessionId, undefined);
                }
                else {
                    const dbpData = data.get(dbp.getId());
                    if (dbpData) {
                        dbp.setSessionData(sessionId, toBreakpointSessionData(dbpData, capabilites));
                    }
                }
            });
            this.exceptionBreakpoints.forEach(ebp => {
                if (!data) {
                    ebp.setSessionData(sessionId, undefined);
                }
                else {
                    const ebpData = data.get(ebp.getId());
                    if (ebpData) {
                        ebp.setSessionData(sessionId, toBreakpointSessionData(ebpData, capabilites));
                    }
                }
            });
            this.instructionBreakpoints.forEach(ibp => {
                if (!data) {
                    ibp.setSessionData(sessionId, undefined);
                }
                else {
                    const ibpData = data.get(ibp.getId());
                    if (ibpData) {
                        ibp.setSessionData(sessionId, toBreakpointSessionData(ibpData, capabilites));
                    }
                }
            });
            this._onDidChangeBreakpoints.fire({
                sessionOnly: true
            });
        }
        getDebugProtocolBreakpoint(breakpointId, sessionId) {
            const bp = this.breakpoints.find(bp => bp.getId() === breakpointId);
            if (bp) {
                return bp.getDebugProtocolBreakpoint(sessionId);
            }
            return undefined;
        }
        getBreakpointModes(forBreakpointType) {
            return [...this._breakpointModes.values()].filter(mode => mode.appliesTo.includes(forBreakpointType));
        }
        registerBreakpointModes(debugType, modes) {
            for (const mode of modes) {
                const key = `${mode.mode}/${mode.label}`;
                const rec = this._breakpointModes.get(key);
                if (rec) {
                    for (const target of mode.appliesTo) {
                        if (!rec.appliesTo.includes(target)) {
                            rec.appliesTo.push(target);
                        }
                    }
                }
                else {
                    const duplicate = [...this._breakpointModes.values()].find(r => r !== rec && r.label === mode.label);
                    if (duplicate) {
                        duplicate.label = `${duplicate.label} (${duplicate.firstFromDebugType})`;
                    }
                    this._breakpointModes.set(key, {
                        mode: mode.mode,
                        label: duplicate ? `${mode.label} (${debugType})` : mode.label,
                        firstFromDebugType: debugType,
                        description: mode.description,
                        appliesTo: mode.appliesTo.slice(), // avoid later mutations
                    });
                }
            }
        }
        sortAndDeDup() {
            this.breakpoints = this.breakpoints.sort((first, second) => {
                if (first.uri.toString() !== second.uri.toString()) {
                    return resources.basenameOrAuthority(first.uri).localeCompare(resources.basenameOrAuthority(second.uri));
                }
                if (first.lineNumber === second.lineNumber) {
                    if (first.column && second.column) {
                        return first.column - second.column;
                    }
                    return 1;
                }
                return first.lineNumber - second.lineNumber;
            });
            this.breakpoints = (0, arrays_1.distinct)(this.breakpoints, bp => `${bp.uri.toString()}:${bp.lineNumber}:${bp.column}`);
        }
        setEnablement(element, enable) {
            if (element instanceof Breakpoint || element instanceof FunctionBreakpoint || element instanceof ExceptionBreakpoint || element instanceof DataBreakpoint || element instanceof InstructionBreakpoint) {
                const changed = [];
                if (element.enabled !== enable && (element instanceof Breakpoint || element instanceof FunctionBreakpoint || element instanceof DataBreakpoint || element instanceof InstructionBreakpoint)) {
                    changed.push(element);
                }
                element.enabled = enable;
                if (enable) {
                    this.breakpointsActivated = true;
                }
                this._onDidChangeBreakpoints.fire({ changed: changed, sessionOnly: false });
            }
        }
        enableOrDisableAllBreakpoints(enable) {
            const changed = [];
            this.breakpoints.forEach(bp => {
                if (bp.enabled !== enable) {
                    changed.push(bp);
                }
                bp.enabled = enable;
            });
            this.functionBreakpoints.forEach(fbp => {
                if (fbp.enabled !== enable) {
                    changed.push(fbp);
                }
                fbp.enabled = enable;
            });
            this.dataBreakpoints.forEach(dbp => {
                if (dbp.enabled !== enable) {
                    changed.push(dbp);
                }
                dbp.enabled = enable;
            });
            this.instructionBreakpoints.forEach(ibp => {
                if (ibp.enabled !== enable) {
                    changed.push(ibp);
                }
                ibp.enabled = enable;
            });
            if (enable) {
                this.breakpointsActivated = true;
            }
            this._onDidChangeBreakpoints.fire({ changed: changed, sessionOnly: false });
        }
        addFunctionBreakpoint(functionName, id, mode) {
            const newFunctionBreakpoint = new FunctionBreakpoint({ name: functionName, mode }, id);
            this.functionBreakpoints.push(newFunctionBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newFunctionBreakpoint], sessionOnly: false });
            return newFunctionBreakpoint;
        }
        updateFunctionBreakpoint(id, update) {
            const functionBreakpoint = this.functionBreakpoints.find(fbp => fbp.getId() === id);
            if (functionBreakpoint) {
                if (typeof update.name === 'string') {
                    functionBreakpoint.name = update.name;
                }
                if (typeof update.condition === 'string') {
                    functionBreakpoint.condition = update.condition;
                }
                if (typeof update.hitCondition === 'string') {
                    functionBreakpoint.hitCondition = update.hitCondition;
                }
                this._onDidChangeBreakpoints.fire({ changed: [functionBreakpoint], sessionOnly: false });
            }
        }
        removeFunctionBreakpoints(id) {
            let removed;
            if (id) {
                removed = this.functionBreakpoints.filter(fbp => fbp.getId() === id);
                this.functionBreakpoints = this.functionBreakpoints.filter(fbp => fbp.getId() !== id);
            }
            else {
                removed = this.functionBreakpoints;
                this.functionBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        addDataBreakpoint(opts, id) {
            const newDataBreakpoint = new DataBreakpoint(opts, id);
            this.dataBreakpoints.push(newDataBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newDataBreakpoint], sessionOnly: false });
        }
        updateDataBreakpoint(id, update) {
            const dataBreakpoint = this.dataBreakpoints.find(fbp => fbp.getId() === id);
            if (dataBreakpoint) {
                if (typeof update.condition === 'string') {
                    dataBreakpoint.condition = update.condition;
                }
                if (typeof update.hitCondition === 'string') {
                    dataBreakpoint.hitCondition = update.hitCondition;
                }
                this._onDidChangeBreakpoints.fire({ changed: [dataBreakpoint], sessionOnly: false });
            }
        }
        removeDataBreakpoints(id) {
            let removed;
            if (id) {
                removed = this.dataBreakpoints.filter(fbp => fbp.getId() === id);
                this.dataBreakpoints = this.dataBreakpoints.filter(fbp => fbp.getId() !== id);
            }
            else {
                removed = this.dataBreakpoints;
                this.dataBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        addInstructionBreakpoint(opts) {
            const newInstructionBreakpoint = new InstructionBreakpoint(opts);
            this.instructionBreakpoints.push(newInstructionBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newInstructionBreakpoint], sessionOnly: true });
        }
        removeInstructionBreakpoints(instructionReference, offset) {
            let removed = [];
            if (instructionReference) {
                for (let i = 0; i < this.instructionBreakpoints.length; i++) {
                    const ibp = this.instructionBreakpoints[i];
                    if (ibp.instructionReference === instructionReference && (offset === undefined || ibp.offset === offset)) {
                        removed.push(ibp);
                        this.instructionBreakpoints.splice(i--, 1);
                    }
                }
            }
            else {
                removed = this.instructionBreakpoints;
                this.instructionBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        getWatchExpressions() {
            return this.watchExpressions;
        }
        addWatchExpression(name) {
            const we = new Expression(name || '');
            this.watchExpressions.push(we);
            this._onDidChangeWatchExpressions.fire(we);
            return we;
        }
        renameWatchExpression(id, newName) {
            const filtered = this.watchExpressions.filter(we => we.getId() === id);
            if (filtered.length === 1) {
                filtered[0].name = newName;
                this._onDidChangeWatchExpressions.fire(filtered[0]);
            }
        }
        removeWatchExpressions(id = null) {
            this.watchExpressions = id ? this.watchExpressions.filter(we => we.getId() !== id) : [];
            this._onDidChangeWatchExpressions.fire(undefined);
        }
        moveWatchExpression(id, position) {
            const we = this.watchExpressions.find(we => we.getId() === id);
            if (we) {
                this.watchExpressions = this.watchExpressions.filter(we => we.getId() !== id);
                this.watchExpressions = this.watchExpressions.slice(0, position).concat(we, this.watchExpressions.slice(position));
                this._onDidChangeWatchExpressions.fire(undefined);
            }
        }
        sourceIsNotAvailable(uri) {
            this.sessions.forEach(s => {
                const source = s.getSourceForUri(uri);
                if (source) {
                    source.available = false;
                }
            });
            this._onDidChangeCallStack.fire(undefined);
        }
    };
    exports.DebugModel = DebugModel;
    exports.DebugModel = DebugModel = __decorate([
        __param(1, textfiles_1.ITextFileService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], DebugModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvY29tbW9uL2RlYnVnTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxNQUFhLG1CQUFtQjtpQkFFUixjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWtCLEFBQTVCLENBQTZCO1FBQzdELDhDQUE4QztpQkFDdEIsb0JBQWUsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQU85QyxZQUNXLE9BQWtDLEVBQ3pCLFFBQTRCLEVBQ3ZDLFVBQThCLEVBQ3JCLEVBQVUsRUFDcEIsaUJBQXFDLENBQUMsRUFDdEMsbUJBQXVDLENBQUMsRUFDeEMsa0JBQXNDLFNBQVMsRUFDOUMsbUJBQXVDLENBQUMsRUFDekMsbUJBQXVFLFNBQVM7WUFSN0UsWUFBTyxHQUFQLE9BQU8sQ0FBMkI7WUFDekIsYUFBUSxHQUFSLFFBQVEsQ0FBb0I7WUFDdkMsZUFBVSxHQUFWLFVBQVUsQ0FBb0I7WUFDckIsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUNwQixtQkFBYyxHQUFkLGNBQWMsQ0FBd0I7WUFDdEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF3QjtZQUN4QyxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0M7WUFDOUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF3QjtZQUN6QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWdFO1lBYmpGLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLFdBQU0sR0FBVyxFQUFFLENBQUM7UUFheEIsQ0FBQztRQUVMLElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxTQUFTLENBQUMsS0FBeUI7WUFDdEMsSUFBSSxDQUFDLFVBQVUsR0FB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