/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, event_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.originalGlobalValues = exports.AsyncSchedulerProcessor = exports.TimeTravelScheduler = void 0;
    exports.runWithFakedTimers = runWithFakedTimers;
    class SimplePriorityQueue {
        constructor(items, compare) {
            this.compare = compare;
            this.isSorted = false;
            this.items = items;
        }
        get length() {
            return this.items.length;
        }
        add(value) {
            this.items.push(value);
            this.isSorted = false;
        }
        remove(value) {
            this.items.splice(this.items.indexOf(value), 1);
            this.isSorted = false;
        }
        removeMin() {
            this.ensureSorted();
            return this.items.shift();
        }
        getMin() {
            this.ensureSorted();
            return this.items[0];
        }
        toSortedArray() {
            this.ensureSorted();
            return [...this.items];
        }
        ensureSorted() {
            if (!this.isSorted) {
                this.items.sort(this.compare);
                this.isSorted = true;
            }
        }
    }
    function compareScheduledTasks(a, b) {
        if (a.time !== b.time) {
            // Prefer lower time
            return a.time - b.time;
        }
        if (a.id !== b.id) {
            // Prefer lower id
            return a.id - b.id;
        }
        return 0;
    }
    class TimeTravelScheduler {
        constructor() {
            this.taskCounter = 0;
            this._now = 0;
            this.queue = new SimplePriorityQueue([], compareScheduledTasks);
            this.taskScheduledEmitter = new event_1.Emitter();
            this.onTaskScheduled = this.taskScheduledEmitter.event;
        }
        schedule(task) {
            if (task.time < this._now) {
                throw new Error(`Scheduled time (${task.time}) must be equal to or greater than the current time (${this._now}).`);
            }
            const extendedTask = { ...task, id: this.taskCounter++ };
            this.queue.add(extendedTask);
            this.taskScheduledEmitter.fire({ task });
            return { dispose: () => this.queue.remove(extendedTask) };
        }
        get now() {
            return this._now;
        }
        get hasScheduledTasks() {
            return this.queue.length > 0;
        }
        getScheduledTasks() {
            return this.queue.toSortedArray();
        }
        runNext() {
            const task = this.queue.removeMin();
            if (task) {
                this._now = task.time;
                task.run();
            }
            return task;
        }
        installGlobally() {
            return overwriteGlobals(this);
        }
    }
    exports.TimeTravelScheduler = TimeTravelScheduler;
    class AsyncSchedulerProcessor extends lifecycle_1.Disposable {
        get history() { return this._history; }
        constructor(scheduler, options) {
            super();
            this.scheduler = scheduler;
            this.isProcessing = false;
            this._history = new Array();
            this.queueEmptyEmitter = new event_1.Emitter();
            this.onTaskQueueEmpty = this.queueEmptyEmitter.event;
            this.maxTaskCount = options && options.maxTaskCount ? options.maxTaskCount : 100;
            this.useSetImmediate = options && options.useSetImmediate ? options.useSetImmediate : false;
            this._register(scheduler.onTaskScheduled(() => {
                if (this.isProcessing) {
                    return;
                }
                else {
                    this.isProcessing = true;
                    this.schedule();
                }
            }));
        }
        schedule() {
            // This allows promises created by a previous task to settle and schedule tasks before the next task is run.
            // Tasks scheduled in those promises might have to run before the current next task.
            Promise.resolve().then(() => {
                if (this.useSetImmediate) {
                    exports.originalGlobalValues.setImmediate(() => this.process());
                }
                else if (platform_1.setTimeout0IsFaster) {
                    (0, platform_1.setTimeout0)(() => this.process());
                }
                else {
                    exports.originalGlobalValues.setTimeout(() => this.process());
                }
            });
        }
        process() {
            const executedTask = this.scheduler.runNext();
            if (executedTask) {
                this._history.push(executedTask);
                if (this.history.length >= this.maxTaskCount && this.scheduler.hasScheduledTasks) {
                    const lastTasks = this._history.slice(Math.max(0, this.history.length - 10)).map(h => `${h.source.toString()}: ${h.source.stackTrace}`);
                    const e = new Error(`Queue did not get empty after processing ${this.history.length} items. These are the last ${lastTasks.length} scheduled tasks:\n${lastTasks.join('\n\n\n')}`);
                    this.lastError = e;
                    throw e;
                }
            }
            if (this.scheduler.hasScheduledTasks) {
                this.schedule();
            }
            else {
                this.isProcessing = false;
                this.queueEmptyEmitter.fire();
            }
        }
        waitForEmptyQueue() {
            if (this.lastError) {
                const error = this.lastError;
                this.lastError = undefined;
                throw error;
            }
            if (!this.isProcessing) {
                return Promise.resolve();
            }
            else {
                return event_1.Event.toPromise(this.onTaskQueueEmpty).then(() => {
                    if (this.lastError) {
                        throw this.lastError;
                    }
                });
            }
        }
    }
    exports.AsyncSchedulerProcessor = AsyncSchedulerProcessor;
    async function runWithFakedTimers(options, fn) {
        const useFakeTimers = options.useFakeTimers === undefined ? true : options.useFakeTimers;
        if (!useFakeTimers) {
            return fn();
        }
        const scheduler = new TimeTravelScheduler();
        const schedulerProcessor = new AsyncSchedulerProcessor(scheduler, { useSetImmediate: options.useSetImmediate, maxTaskCount: options.maxTaskCount });
        const globalInstallDisposable = scheduler.installGlobally();
        let result;
        try {
            result = await fn();
        }
        finally {
            globalInstallDisposable.dispose();
            try {
                // We process the remaining scheduled tasks.
                // The global override is no longer active, so during this, no more tasks will be scheduled.
                await schedulerProcessor.waitForEmptyQueue();
            }
            finally {
                schedulerProcessor.dispose();
            }
        }
        return result;
    }
    exports.originalGlobalValues = {
        setTimeout: globalThis.setTimeout.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        setInterval: globalThis.setInterval.bind(globalThis),
        clearInterval: globalThis.clearInterval.bind(globalThis),
        setImmediate: globalThis.setImmediate?.bind(globalThis),
        clearImmediate: globalThis.clearImmediate?.bind(globalThis),
        requestAnimationFrame: globalThis.requestAnimationFrame?.bind(globalThis),
        cancelAnimationFrame: globalThis.cancelAnimationFrame?.bind(globalThis),
        Date: globalThis.Date,
    };
    function setTimeout(scheduler, handler, timeout = 0) {
        if (typeof handler === 'string') {
            throw new Error('String handler args should not be used and are not supported');
        }
        return scheduler.schedule({
            time: scheduler.now + timeout,
            run: () => {
                handler();
            },
            source: {
                toString() { return 'setTimeout'; },
                stackTrace: new Error().stack,
            }
        });
    }
    function setInterval(scheduler, handler, interval) {
        if (typeof handler === 'string') {
            throw new Error('String handler args should not be used and are not supported');
        }
        const validatedHandler = handler;
        let iterCount = 0;
        const stackTrace = new Error().stack;
        let disposed = false;
        let lastDisposable;
        function schedule() {
            iterCount++;
            const curIter = iterCount;
            lastDisposable = scheduler.schedule({
                time: scheduler.now + interval,
                run() {
                    if (!disposed) {
                        schedule();
                        validatedHandler();
                    }
                },
                source: {
                    toString() { return `setInterval (iteration ${curIter})`; },
                    stackTrace,
                }
            });
        }
        schedule();
        return {
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                lastDisposable.dispose();
            }
        };
    }
    function overwriteGlobals(scheduler) {
        globalThis.setTimeout = ((handler, timeout) => setTimeout(scheduler, handler, timeout));
        globalThis.clearTimeout = (timeoutId) => {
            if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
                timeoutId.dispose();
            }
            else {
                exports.originalGlobalValues.clearTimeout(timeoutId);
            }
        };
        globalThis.setInterval = ((handler, timeout) => setInterval(scheduler, handler, timeout));
        globalThis.clearInterval = (timeoutId) => {
            if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
                timeoutId.dispose();
            }
            else {
                exports.originalGlobalValues.clearInterval(timeoutId);
            }
        };
        globalThis.Date = createDateClass(scheduler);
        return {
            dispose: () => {
                Object.assign(globalThis, exports.originalGlobalValues);
            }
        };
    }
    function createDateClass(scheduler) {
        const OriginalDate = exports.originalGlobalValues.Date;
        function SchedulerDate(...args) {
            // the Date constructor called as a function, ref Ecma-262 Edition 5.1, section 15.9.2.
            // This remains so in the 10th edition of 2019 as well.
            if (!(this instanceof SchedulerDate)) {
                return new OriginalDate(scheduler.now).toString();
            }
            // if Date is called as a constructor with 'new' keyword
            if (args.length === 0) {
                return new OriginalDate(scheduler.now);
            }
            return new OriginalDate(...args);
        }
        for (const prop in OriginalDate) {
            if (OriginalDate.hasOwnProperty(prop)) {
                SchedulerDate[prop] = OriginalDate[prop];
            }
        }
        SchedulerDate.now = function now() {
            return scheduler.now;
        };
        SchedulerDate.toString = function toString() {
            return OriginalDate.toString();
        };
        SchedulerDate.prototype = OriginalDate.prototype;
        SchedulerDate.parse = OriginalDate.parse;
        SchedulerDate.UTC = OriginalDate.UTC;
        SchedulerDate.prototype.toUTCString = OriginalDate.prototype.toUTCString;
        return SchedulerDate;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZVRyYXZlbFNjaGVkdWxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2NvbW1vbi90aW1lVHJhdmVsU2NoZWR1bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlPaEcsZ0RBMEJDO0lBNU9ELE1BQU0sbUJBQW1CO1FBSXhCLFlBQVksS0FBVSxFQUFtQixPQUErQjtZQUEvQixZQUFPLEdBQVAsT0FBTyxDQUF3QjtZQUhoRSxhQUFRLEdBQUcsS0FBSyxDQUFDO1lBSXhCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxJQUFJLE1BQU07WUFDVCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzFCLENBQUM7UUFFRCxHQUFHLENBQUMsS0FBUTtZQUNYLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBUTtZQUNkLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxTQUFTO1lBQ1IsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsTUFBTTtZQUNMLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENB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