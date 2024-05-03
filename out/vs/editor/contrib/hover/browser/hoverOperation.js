/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverOperation = exports.HoverResult = exports.HoverStartSource = exports.HoverStartMode = void 0;
    var HoverOperationState;
    (function (HoverOperationState) {
        HoverOperationState[HoverOperationState["Idle"] = 0] = "Idle";
        HoverOperationState[HoverOperationState["FirstWait"] = 1] = "FirstWait";
        HoverOperationState[HoverOperationState["SecondWait"] = 2] = "SecondWait";
        HoverOperationState[HoverOperationState["WaitingForAsync"] = 3] = "WaitingForAsync";
        HoverOperationState[HoverOperationState["WaitingForAsyncShowingLoading"] = 4] = "WaitingForAsyncShowingLoading";
    })(HoverOperationState || (HoverOperationState = {}));
    var HoverStartMode;
    (function (HoverStartMode) {
        HoverStartMode[HoverStartMode["Delayed"] = 0] = "Delayed";
        HoverStartMode[HoverStartMode["Immediate"] = 1] = "Immediate";
    })(HoverStartMode || (exports.HoverStartMode = HoverStartMode = {}));
    var HoverStartSource;
    (function (HoverStartSource) {
        HoverStartSource[HoverStartSource["Mouse"] = 0] = "Mouse";
        HoverStartSource[HoverStartSource["Keyboard"] = 1] = "Keyboard";
    })(HoverStartSource || (exports.HoverStartSource = HoverStartSource = {}));
    class HoverResult {
        constructor(value, isComplete, hasLoadingMessage) {
            this.value = value;
            this.isComplete = isComplete;
            this.hasLoadingMessage = hasLoadingMessage;
        }
    }
    exports.HoverResult = HoverResult;
    /**
     * Computing the hover is very fine tuned.
     *
     * Suppose the hover delay is 300ms (the default). Then, when resting the mouse at an anchor:
     * - at 150ms, the async computation is triggered (i.e. semantic hover)
     *   - if async results already come in, they are not rendered yet.
     * - at 300ms, the sync computation is triggered (i.e. decorations, markers)
     *   - if there are sync or async results, they are rendered.
     * - at 900ms, if the async computation hasn't finished, a "Loading..." result is added.
     */
    class HoverOperation extends lifecycle_1.Disposable {
        constructor(_editor, _computer) {
            super();
            this._editor = _editor;
            this._computer = _computer;
            this._onResult = this._register(new event_1.Emitter());
            this.onResult = this._onResult.event;
            this._firstWaitScheduler = this._register(new async_1.RunOnceScheduler(() => this._triggerAsyncComputation(), 0));
            this._secondWaitScheduler = this._register(new async_1.RunOnceScheduler(() => this._triggerSyncComputation(), 0));
            this._loadingMessageScheduler = this._register(new async_1.RunOnceScheduler(() => this._triggerLoadingMessage(), 0));
            this._state = 0 /* HoverOperationState.Idle */;
            this._asyncIterable = null;
            this._asyncIterableDone = false;
            this._result = [];
        }
        dispose() {
            if (this._asyncIterable) {
                this._asyncIterable.cancel();
                this._asyncIterable = null;
            }
            super.dispose();
        }
        get _hoverTime() {
            return this._editor.getOption(60 /* EditorOption.hover */).delay;
        }
        get _firstWaitTime() {
            return this._hoverTime / 2;
        }
        get _secondWaitTime() {
            return this._hoverTime - this._firstWaitTime;
        }
        get _loadingMessageTime() {
            return 3 * this._hoverTime;
        }
        _setState(state, fireResult = true) {
            this._state = state;
            if (fireResult) {
                this._fireResult();
            }
        }
        _triggerAsyncComputation() {
            this._setState(2 /* HoverOperationState.SecondWait */);
            this._secondWaitScheduler.schedule(this._secondWaitTime);
            if (this._computer.computeAsync) {
                this._asyncIterableDone = false;
                this._asyncIterable = (0, async_1.createCancelableAsyncIterable)(token => this._computer.computeAsync(token));
                (async () => {
                    try {
                        for await (const item of this._asyncIterable) {
                            if (item) {
                                this._result.push(item);
                                this._fireResult();
                            }
                        }
                        this._asyncIterableDone = true;
                        if (this._state === 3 /* HoverOperationState.WaitingForAsync */ || this._state === 4 /* HoverOperationState.WaitingForAsyncShowingLoading */) {
                            this._setState(0 /* HoverOperationState.Idle */);
                        }
                    }
                    catch (e) {
                        (0, errors_1.onUnexpectedError)(e);
                    }
                })();
            }
            else {
                this._asyncIterableDone = true;
            }
        }
        _triggerSyncComputation() {
            if (this._computer.computeSync) {
                this._result = this._result.concat(this._computer.computeSync());
            }
            this._setState(this._asyncIterableDone ? 0 /* HoverOperationState.Idle */ : 3 /* HoverOperationState.WaitingForAsync */);
        }
        _triggerLoadingMessage() {
            if (this._state === 3 /* HoverOperationState.WaitingForAsync */) {
                this._setState(4 /* HoverOperationState.WaitingForAsyncShowingLoading */);
            }
        }
        _fireResult() {
            if (this._state === 1 /* HoverOperationState.FirstWait */ || this._state === 2 /* HoverOperationState.SecondWait */) {
                // Do not send out results before the hover time
                return;
            }
            const isComplete = (this._state === 0 /* HoverOperationState.Idle */);
            const hasLoadingMessage = (this._state === 4 /* HoverOperationState.WaitingForAsyncShowingLoading */);
            this._onResult.fire(new HoverResult(this._result.slice(0), isComplete, hasLoadingMessage));
        }
        start(mode) {
            if (mode === 0 /* HoverStartMode.Delayed */) {
                if (this._state === 0 /* HoverOperationState.Idle */) {
                    this._setState(1 /* HoverOperationState.FirstWait */);
                    this._firstWaitScheduler.schedule(this._firstWaitTime);
                    this._loadingMessageScheduler.schedule(this._loadingMessageTime);
                }
            }
            else {
                switch (this._state) {
                    case 0 /* HoverOperationState.Idle */:
                        this._triggerAsyncComputation();
                        this._secondWaitScheduler.cancel();
                        this._triggerSyncComputation();
                        break;
                    case 2 /* HoverOperationState.SecondWait */:
                        this._secondWaitScheduler.cancel();
                        this._triggerSyncComputation();
                        break;
                }
            }
        }
        cancel() {
            this._firstWaitScheduler.cancel();
            this._secondWaitScheduler.cancel();
            this._loadingMessageScheduler.cancel();
            if (this._asyncIterable) {
                this._asyncIterable.cancel();
                this._asyncIterable = null;
            }
            this._result = [];
            this._setState(0 /* HoverOperationState.Idle */, false);
        }
    }
    exports.HoverOperation = HoverOperation;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXJPcGVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL2Jyb3dzZXIvaG92ZXJPcGVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxJQUFXLG1CQU1WO0lBTkQsV0FBVyxtQkFBbUI7UUFDN0IsNkRBQUksQ0FBQTtRQUNKLHVFQUFTLENBQUE7UUFDVCx5RUFBVSxDQUFBO1FBQ1YsbUZBQW1CLENBQUE7UUFDbkIsK0dBQWlDLENBQUE7SUFDbEMsQ0FBQyxFQU5VLG1CQUFtQixLQUFuQixtQkFBbUIsUUFNN0I7SUFFRCxJQUFrQixjQUdqQjtJQUhELFdBQWtCLGNBQWM7UUFDL0IseURBQVcsQ0FBQTtRQUNYLDZEQUFhLENBQUE7SUFDZCxDQUFDLEVBSGlCLGNBQWMsOEJBQWQsY0FBYyxRQUcvQjtJQUVELElBQWtCLGdCQUdqQjtJQUhELFdBQWtCLGdCQUFnQjtRQUNqQyx5REFBUyxDQUFBO1FBQ1QsK0RBQVksQ0FBQTtJQUNiLENBQUMsRUFIaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFHakM7SUFFRCxNQUFhLFdBQVc7UUFDdkIsWUFDaUIsS0FBVSxFQUNWLFVBQW1CLEVBQ25CLGlCQUEwQjtZQUYxQixVQUFLLEdBQUwsS0FBSyxDQUFLO1lBQ1YsZUFBVSxHQUFWLFVBQVUsQ0FBUztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQVM7UUFDdkMsQ0FBQztLQUNMO0lBTkQsa0NBTUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxNQUFhLGNBQWtCLFNBQVEsc0JBQVU7UUFjaEQsWUFDa0IsT0FBb0IsRUFDcEIsU0FBNEI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFIUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ3BCLGNBQVMsR0FBVCxTQUFT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