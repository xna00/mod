/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/platform", "vs/nls", "vs/workbench/contrib/testing/common/getComputedState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, async_1, buffer_1, event_1, lazy_1, lifecycle_1, observable_1, platform_1, nls_1, getComputedState_1, testId_1, testingStates_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HydratedTestResult = exports.LiveTestResult = exports.TestResultItemChangeReason = exports.maxCountPriority = exports.resultItemParents = exports.TaskRawOutput = void 0;
    const emptyRawOutput = {
        buffers: [],
        length: 0,
        onDidWriteData: event_1.Event.None,
        endPromise: Promise.resolve(),
        getRange: () => buffer_1.VSBuffer.alloc(0),
        getRangeIter: () => [],
    };
    class TaskRawOutput {
        constructor() {
            this.writeDataEmitter = new event_1.Emitter();
            this.endDeferred = new async_1.DeferredPromise();
            this.offset = 0;
            /** @inheritdoc */
            this.onDidWriteData = this.writeDataEmitter.event;
            /** @inheritdoc */
            this.endPromise = this.endDeferred.p;
            /** @inheritdoc */
            this.buffers = [];
        }
        /** @inheritdoc */
        get length() {
            return this.offset;
        }
        /** @inheritdoc */
        getRange(start, length) {
            const buf = buffer_1.VSBuffer.alloc(length);
            let bufLastWrite = 0;
            for (const chunk of this.getRangeIter(start, length)) {
                buf.buffer.set(chunk.buffer, bufLastWrite);
                bufLastWrite += chunk.byteLength;
            }
            return bufLastWrite < length ? buf.slice(0, bufLastWrite) : buf;
        }
        /** @inheritdoc */
        *getRangeIter(start, length) {
            let soFar = 0;
            let internalLastRead = 0;
            for (const b of this.buffers) {
                if (internalLastRead + b.byteLength <= start) {
                    internalLastRead += b.byteLength;
                    continue;
                }
                const bstart = Math.max(0, start - internalLastRead);
                const bend = Math.min(b.byteLength, bstart + length - soFar);
                yield b.slice(bstart, bend);
                soFar += bend - bstart;
                internalLastRead += b.byteLength;
                if (soFar === length) {
                    break;
                }
            }
        }
        /**
         * Appends data to the output, returning the byte range where the data can be found.
         */
        append(data, marker) {
            const offset = this.offset;
            let length = data.byteLength;
            if (marker === undefined) {
                this.push(data);
                return { offset, length };
            }
            // Bytes that should be 'trimmed' off the end of data. This is done because
            // selections in the terminal are based on the entire line, and commonly
            // the interesting marked range has a trailing new line. We don't want to
            // select the trailing line (which might have other data)
            // so we place the marker before all trailing trimbytes.
            let TrimBytes;
            (function (TrimBytes) {
                TrimBytes[TrimBytes["CR"] = 13] = "CR";
                TrimBytes[TrimBytes["LF"] = 10] = "LF";
            })(TrimBytes || (TrimBytes = {}));
            const start = buffer_1.VSBuffer.fromString(getMarkCode(marker, true));
            const end = buffer_1.VSBuffer.fromString(getMarkCode(marker, false));
            length += start.byteLength + end.byteLength;
            this.push(start);
            let trimLen = data.byteLength;
            for (; trimLen > 0; trimLen--) {
                const last = data.buffer[trimLen - 1];
                if (last !== 13 /* TrimBytes.CR */ && last !== 10 /* TrimBytes.LF */) {
                    break;
                }
            }
            this.push(data.slice(0, trimLen));
            this.push(end);
            this.push(data.slice(trimLen));
            return { offset, length };
        }
        push(data) {
            if (data.byteLength === 0) {
                return;
            }
            this.buffers.push(data);
            this.writeDataEmitter.fire(data);
            this.offset += data.byteLength;
        }
        /** Signals the output has ended. */
        end() {
            this.endDeferred.complete();
        }
    }
    exports.TaskRawOutput = TaskRawOutput;
    const resultItemParents = function* (results, item) {
        for (const id of testId_1.TestId.fromString(item.item.extId).idsToRoot()) {
            yield results.getStateById(id.toString());
        }
    };
    exports.resultItemParents = resultItemParents;
    const maxCountPriority = (counts) => {
        for (const state of testingStates_1.statesInOrder) {
            if (counts[state] > 0) {
                return state;
            }
        }
        return 0 /* TestResultState.Unset */;
    };
    exports.maxCountPriority = maxCountPriority;
    const getMarkCode = (marker, start) => `\x1b]633;SetMark;Id=${(0, testTypes_1.getMarkId)(marker, start)};Hidden\x07`;
    const itemToNode = (controllerId, item, parent) => ({
        controllerId,
        expand: 0 /* TestItemExpandState.NotExpandable */,
        item: { ...item },
        children: [],
        tasks: [],
        ownComputedState: 0 /* TestResultState.Unset */,
        computedState: 0 /* TestResultState.Unset */,
    });
    var TestResultItemChangeReason;
    (function (TestResultItemChangeReason) {
        TestResultItemChangeReason[TestResultItemChangeReason["ComputedStateChange"] = 0] = "ComputedStateChange";
        TestResultItemChangeReason[TestResultItemChangeReason["OwnStateChange"] = 1] = "OwnStateChange";
        TestResultItemChangeReason[TestResultItemChangeReason["NewMessage"] = 2] = "NewMessage";
    })(TestResultItemChangeReason || (exports.TestResultItemChangeReason = TestResultItemChangeReason = {}));
    /**
     * Results of a test. These are created when the test initially started running
     * and marked as "complete" when the run finishes.
     */
    class LiveTestResult extends lifecycle_1.Disposable {
        /**
         * @inheritdoc
         */
        get completedAt() {
            return this._completedAt;
        }
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        constructor(id, persist, request) {
            super();
            this.id = id;
            this.persist = persist;
            this.request = request;
            this.completeEmitter = this._register(new event_1.Emitter());
            this.newTaskEmitter = this._register(new event_1.Emitter());
            this.endTaskEmitter = this._register(new event_1.Emitter());
            this.changeEmitter = this._register(new event_1.Emitter());
            /** todo@connor4312: convert to a WellDefinedPrefixTree */
            this.testById = new Map();
            this.testMarkerCounter = 0;
            this.startedAt = Date.now();
            this.onChange = this.changeEmitter.event;
            this.onComplete = this.completeEmitter.event;
            this.onNewTask = this.newTaskEmitter.event;
            this.onEndTask = this.endTaskEmitter.event;
            this.tasks = [];
            this.name = (0, nls_1.localize)('runFinished', 'Test run at {0}', new Date().toLocaleString(platform_1.language));
            /**
             * @inheritdoc
             */
            this.counts = (0, testingStates_1.makeEmptyCounts)();
            this.computedStateAccessor = {
                getOwnState: i => i.ownComputedState,
                getCurrentComputedState: i => i.computedState,
                setComputedState: (i, s) => i.computedState = s,
                getChildren: i => i.children,
                getParents: i => {
                    const { testById: testByExtId } = this;
                    return (function* () {
                        const parentId = testId_1.TestId.fromString(i.item.extId).parentId;
                        if (parentId) {
                            for (const id of parentId.idsToRoot()) {
                                yield testByExtId.get(id.toString());
                            }
                        }
                    })();
                },
            };
            this.doSerialize = new lazy_1.Lazy(() => ({
                id: this.id,
                completedAt: this.completedAt,
                tasks: this.tasks.map(t => ({ id: t.id, name: t.name })),
                name: this.name,
                request: this.request,
                items: [...this.testById.values()].map(testTypes_1.TestResultItem.serializeWithoutMessages),
            }));
            this.doSerializeWithMessages = new lazy_1.Lazy(() => ({
                id: this.id,
                completedAt: this.completedAt,
                tasks: this.tasks.map(t => ({ id: t.id, name: t.name })),
                name: this.name,
                request: this.request,
                items: [...this.testById.values()].map(testTypes_1.TestResultItem.serialize),
            }));
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * Appends output that occurred during the test run.
         */
        appendOutput(output, taskId, location, testId) {
            const preview = output.byteLength > 100 ? output.slice(0, 100).toString() + '…' : output.toString();
            let marker;
            // currently, the UI only exposes jump-to-message from tests or locations,
            // so no need to mark outputs that don't come from either of those.
            if (testId || location) {
                marker = this.testMarkerCounter++;
            }
            const index = this.mustGetTaskIndex(taskId);
            const task = this.tasks[index];
            const { offset, length } = task.output.append(output, marker);
            const message = {
                location,
                message: preview,
                offset,
                length,
                marker,
                type: 1 /* TestMessageType.Output */,
            };
            const test = testId && this.testById.get(testId);
            if (test) {
                test.tasks[index].messages.push(message);
                this.changeEmitter.fire({ item: test, result: this, reason: 2 /* TestResultItemChangeReason.NewMessage */, message });
            }
            else {
                task.otherMessages.push(message);
            }
        }
        /**
         * Adds a new run task to the results.
         */
        addTask(task) {
            this.tasks.push({ ...task, coverage: (0, observable_1.observableValue)(this, undefined), otherMessages: [], output: new TaskRawOutput() });
            for (const test of this.tests) {
                test.tasks.push({ duration: undefined, messages: [], state: 0 /* TestResultState.Unset */ });
            }
            this.newTaskEmitter.fire(this.tasks.length - 1);
        }
        /**
         * Add the chain of tests to the run. The first test in the chain should
         * be either a test root, or a previously-known test.
         */
        addTestChainToRun(controllerId, chain) {
            let parent = this.testById.get(chain[0].extId);
            if (!parent) { // must be a test root
                parent = this.addTestToRun(controllerId, chain[0], null);
            }
            for (let i = 1; i < chain.length; i++) {
                parent = this.addTestToRun(controllerId, chain[i], parent.item.extId);
            }
            return undefined;
        }
        /**
         * Updates the state of the test by its internal ID.
         */
        updateState(testId, taskId, state, duration) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            const index = this.mustGetTaskIndex(taskId);
            const oldTerminalStatePrio = testingStates_1.terminalStatePriorities[entry.tasks[index].state];
            const newTerminalStatePrio = testingStates_1.terminalStatePriorities[state];
            // Ignore requests to set the state from one terminal state back to a
            // "lower" one, e.g. from failed back to passed:
            if (oldTerminalStatePrio !== undefined &&
                (newTerminalStatePrio === undefined || newTerminalStatePrio < oldTerminalStatePrio)) {
                return;
            }
            this.fireUpdateAndRefresh(entry, index, state, duration);
        }
        /**
         * Appends a message for the test in the run.
         */
        appendMessage(testId, taskId, message) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            entry.tasks[this.mustGetTaskIndex(taskId)].messages.push(message);
            this.changeEmitter.fire({ item: entry, result: this, reason: 2 /* TestResultItemChangeReason.NewMessage */, message });
        }
        /**
         * Marks the task in the test run complete.
         */
        markTaskComplete(taskId) {
            const index = this.mustGetTaskIndex(taskId);
            const task = this.tasks[index];
            task.running = false;
            task.output.end();
            this.setAllToState(0 /* TestResultState.Unset */, taskId, t => t.state === 1 /* TestResultState.Queued */ || t.state === 2 /* TestResultState.Running */);
            this.endTaskEmitter.fire(index);
        }
        /**
         * Notifies the service that all tests are complete.
         */
        markComplete() {
            if (this._completedAt !== undefined) {
                throw new Error('cannot complete a test result multiple times');
            }
            for (const task of this.tasks) {
                if (task.running) {
                    this.markTaskComplete(task.id);
                }
            }
            this._completedAt = Date.now();
            this.completeEmitter.fire();
        }
        /**
         * Marks the test and all of its children in the run as retired.
         */
        markRetired(testIds) {
            for (const [id, test] of this.testById) {
                if (!test.retired && (!testIds || testIds.hasKeyOrParent(testId_1.TestId.fromString(id).path))) {
                    test.retired = true;
                    this.changeEmitter.fire({ reason: 0 /* TestResultItemChangeReason.ComputedStateChange */, item: test, result: this });
                }
            }
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.completedAt && this.persist ? this.doSerialize.value : undefined;
        }
        toJSONWithMessages() {
            return this.completedAt && this.persist ? this.doSerializeWithMessages.value : undefined;
        }
        /**
         * Updates all tests in the collection to the given state.
         */
        setAllToState(state, taskId, when) {
            const index = this.mustGetTaskIndex(taskId);
            for (const test of this.testById.values()) {
                if (when(test.tasks[index], test)) {
                    this.fireUpdateAndRefresh(test, index, state);
                }
            }
        }
        fireUpdateAndRefresh(entry, taskIndex, newState, newOwnDuration) {
            const previousOwnComputed = entry.ownComputedState;
            const previousOwnDuration = entry.ownDuration;
            const changeEvent = {
                item: entry,
                result: this,
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                previousState: previousOwnComputed,
                previousOwnDuration: previousOwnDuration,
            };
            entry.tasks[taskIndex].state = newState;
            if (newOwnDuration !== undefined) {
                entry.tasks[taskIndex].duration = newOwnDuration;
                entry.ownDuration = Math.max(entry.ownDuration || 0, newOwnDuration);
            }
            const newOwnComputed = (0, testingStates_1.maxPriority)(...entry.tasks.map(t => t.state));
            if (newOwnComputed === previousOwnComputed) {
                if (newOwnDuration !== previousOwnDuration) {
                    this.changeEmitter.fire(changeEvent); // fire manually since state change won't do it
                }
                return;
            }
            entry.ownComputedState = newOwnComputed;
            this.counts[previousOwnComputed]--;
            this.counts[newOwnComputed]++;
            (0, getComputedState_1.refreshComputedState)(this.computedStateAccessor, entry).forEach(t => this.changeEmitter.fire(t === entry ? changeEvent : {
                item: t,
                result: this,
                reason: 0 /* TestResultItemChangeReason.ComputedStateChange */,
            }));
        }
        addTestToRun(controllerId, item, parent) {
            const node = itemToNode(controllerId, item, parent);
            this.testById.set(item.extId, node);
            this.counts[0 /* TestResultState.Unset */]++;
            if (parent) {
                this.testById.get(parent)?.children.push(node);
            }
            if (this.tasks.length) {
                for (let i = 0; i < this.tasks.length; i++) {
                    node.tasks.push({ duration: undefined, messages: [], state: 0 /* TestResultState.Unset */ });
                }
            }
            return node;
        }
        mustGetTaskIndex(taskId) {
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index === -1) {
                throw new Error(`Unknown task ${taskId} in updateState`);
            }
            return index;
        }
    }
    exports.LiveTestResult = LiveTestResult;
    /**
     * Test results hydrated from a previously-serialized test run.
     */
    class HydratedTestResult {
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        constructor(identity, serialized, persist = true) {
            this.serialized = serialized;
            this.persist = persist;
            /**
             * @inheritdoc
             */
            this.counts = (0, testingStates_1.makeEmptyCounts)();
            this.testById = new Map();
            this.id = serialized.id;
            this.completedAt = serialized.completedAt;
            this.tasks = serialized.tasks.map((task, i) => ({
                id: task.id,
                name: task.name,
                running: false,
                coverage: (0, observable_1.observableValue)(this, undefined),
                output: emptyRawOutput,
                otherMessages: []
            }));
            this.name = serialized.name;
            this.request = serialized.request;
            for (const item of serialized.items) {
                const de = testTypes_1.TestResultItem.deserialize(identity, item);
                this.counts[de.ownComputedState]++;
                this.testById.set(item.item.extId, de);
            }
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.persist ? this.serialized : undefined;
        }
        /**
         * @inheritdoc
         */
        toJSONWithMessages() {
            return this.toJSON();
        }
    }
    exports.HydratedTestResult = HydratedTestResult;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFJlc3VsdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdFJlc3VsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3R2hHLE1BQU0sY0FBYyxHQUFtQjtRQUN0QyxPQUFPLEVBQUUsRUFBRTtRQUNYLE1BQU0sRUFBRSxDQUFDO1FBQ1QsY0FBYyxFQUFFLGFBQUssQ0FBQyxJQUFJO1FBQzFCLFVBQVUsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFO1FBQzdCLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDakMsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7S0FDdEIsQ0FBQztJQUVGLE1BQWEsYUFBYTtRQUExQjtZQUNrQixxQkFBZ0IsR0FBRyxJQUFJLGVBQU8sRUFBWSxDQUFDO1lBQzNDLGdCQUFXLEdBQUcsSUFBSSx1QkFBZSxFQUFRLENBQUM7WUFDbkQsV0FBTSxHQUFHLENBQUMsQ0FBQztZQUVuQixrQkFBa0I7WUFDRixtQkFBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFFN0Qsa0JBQWtCO1lBQ0YsZUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRWhELGtCQUFrQjtZQUNGLFlBQU8sR0FBZSxFQUFFLENBQUM7UUFrRzFDLENBQUM7UUFoR0Esa0JBQWtCO1FBQ2xCLElBQVcsTUFBTTtZQUNoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELGtCQUFrQjtRQUNsQixRQUFRLENBQUMsS0FBYSxFQUFFLE1BQWM7WUFDckMsTUFBTSxHQUFHLEdBQUcsaUJBQVEsQ0FBQyxLQUFLLENBQUMs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