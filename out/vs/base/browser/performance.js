/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.inputLatency = void 0;
    var inputLatency;
    (function (inputLatency) {
        const totalKeydownTime = { total: 0, min: Number.MAX_VALUE, max: 0 };
        const totalInputTime = { ...totalKeydownTime };
        const totalRenderTime = { ...totalKeydownTime };
        const totalInputLatencyTime = { ...totalKeydownTime };
        let measurementsCount = 0;
        // The state of each event, this helps ensure the integrity of the measurement and that
        // something unexpected didn't happen that could skew the measurement.
        let EventPhase;
        (function (EventPhase) {
            EventPhase[EventPhase["Before"] = 0] = "Before";
            EventPhase[EventPhase["InProgress"] = 1] = "InProgress";
            EventPhase[EventPhase["Finished"] = 2] = "Finished";
        })(EventPhase || (EventPhase = {}));
        const state = {
            keydown: 0 /* EventPhase.Before */,
            input: 0 /* EventPhase.Before */,
            render: 0 /* EventPhase.Before */,
        };
        /**
         * Record the start of the keydown event.
         */
        function onKeyDown() {
            /** Direct Check C. See explanation in {@link recordIfFinished} */
            recordIfFinished();
            performance.mark('inputlatency/start');
            performance.mark('keydown/start');
            state.keydown = 1 /* EventPhase.InProgress */;
            queueMicrotask(markKeyDownEnd);
        }
        inputLatency.onKeyDown = onKeyDown;
        /**
         * Mark the end of the keydown event.
         */
        function markKeyDownEnd() {
            if (state.keydown === 1 /* EventPhase.InProgress */) {
                performance.mark('keydown/end');
                state.keydown = 2 /* EventPhase.Finished */;
            }
        }
        /**
         * Record the start of the beforeinput event.
         */
        function onBeforeInput() {
            performance.mark('input/start');
            state.input = 1 /* EventPhase.InProgress */;
            /** Schedule Task A. See explanation in {@link recordIfFinished} */
            scheduleRecordIfFinishedTask();
        }
        inputLatency.onBeforeInput = onBeforeInput;
        /**
         * Record the start of the input event.
         */
        function onInput() {
            if (state.input === 0 /* EventPhase.Before */) {
                // it looks like we didn't receive a `beforeinput`
                onBeforeInput();
            }
            queueMicrotask(markInputEnd);
        }
        inputLatency.onInput = onInput;
        function markInputEnd() {
            if (state.input === 1 /* EventPhase.InProgress */) {
                performance.mark('input/end');
                state.input = 2 /* EventPhase.Finished */;
            }
        }
        /**
         * Record the start of the keyup event.
         */
        function onKeyUp() {
            /** Direct Check D. See explanation in {@link recordIfFinished} */
            recordIfFinished();
        }
        inputLatency.onKeyUp = onKeyUp;
        /**
         * Record the start of the selectionchange event.
         */
        function onSelectionChange() {
            /** Direct Check E. See explanation in {@link recordIfFinished} */
            recordIfFinished();
        }
        inputLatency.onSelectionChange = onSelectionChange;
        /**
         * Record the start of the animation frame performing the rendering.
         */
        function onRenderStart() {
            // Render may be triggered during input, but we only measure the following animation frame
            if (state.keydown === 2 /* EventPhase.Finished */ && state.input === 2 /* EventPhase.Finished */ && state.render === 0 /* EventPhase.Before */) {
                // Only measure the first render after keyboard input
                performance.mark('render/start');
                state.render = 1 /* EventPhase.InProgress */;
                queueMicrotask(markRenderEnd);
                /** Schedule Task B. See explanation in {@link recordIfFinished} */
                scheduleRecordIfFinishedTask();
            }
        }
        inputLatency.onRenderStart = onRenderStart;
        /**
         * Mark the end of the animation frame performing the rendering.
         */
        function markRenderEnd() {
            if (state.render === 1 /* EventPhase.InProgress */) {
                performance.mark('render/end');
                state.render = 2 /* EventPhase.Finished */;
            }
        }
        function scheduleRecordIfFinishedTask() {
            // Here we can safely assume that the `setTimeout` will not be
            // artificially delayed by 4ms because we schedule it from
            // event handlers
            setTimeout(recordIfFinished);
        }
        /**
         * Record the input latency sample if input handling and rendering are finished.
         *
         * The challenge here is that we want to record the latency in such a way that it includes
         * also the layout and painting work the browser does during the animation frame task.
         *
         * Simply scheduling a new task (via `setTimeout`) from the animation frame task would
         * schedule the new task at the end of the task queue (after other code that uses `setTimeout`),
         * so we need to use multiple strategies to make sure our task runs before others:
         *
         * We schedule tasks (A and B):
         *    - we schedule a task A (via a `setTimeout` call) when the input starts in `markInputStart`.
         *      If the animation frame task is scheduled quickly by the browser, then task A has a very good
         *      chance of being the very first task after the animation frame and thus will record the input latency.
         *    - however, if the animation frame task is scheduled a bit later, then task A might execute
         *      before the animation frame task. We therefore schedule another task B from `markRenderStart`.
         *
         * We do direct checks in browser event handlers (C, D, E):
         *    - if the browser has multiple keydown events queued up, they will be scheduled before the `setTimeout` tasks,
         *      so we do a direct check in the keydown event handler (C).
         *    - depending on timing, sometimes the animation frame is scheduled even before the `keyup` event, so we
         *      do a direct check there too (E).
         *    - the browser oftentimes emits a `selectionchange` event after an `input`, so we do a direct check there (D).
         */
        function recordIfFinished() {
            if (state.keydown === 2 /* EventPhase.Finished */ && state.input === 2 /* EventPhase.Finished */ && state.render === 2 /* EventPhase.Finished */) {
                performance.mark('inputlatency/end');
                performance.measure('keydown', 'keydown/start', 'keydown/end');
                performance.measure('input', 'input/start', 'input/end');
                performance.measure('render', 'render/start', 'render/end');
                performance.measure('inputlatency', 'inputlatency/start', 'inputlatency/end');
                addMeasure('keydown', totalKeydownTime);
                addMeasure('input', totalInputTime);
                addMeasure('render', totalRenderTime);
                addMeasure('inputlatency', totalInputLatencyTime);
                // console.info(
                // 	`input latency=${performance.getEntriesByName('inputlatency')[0].duration.toFixed(1)} [` +
                // 	`keydown=${performance.getEntriesByName('keydown')[0].duration.toFixed(1)}, ` +
                // 	`input=${performance.getEntriesByName('input')[0].duration.toFixed(1)}, ` +
                // 	`render=${performance.getEntriesByName('render')[0].duration.toFixed(1)}` +
                // 	`]`
                // );
                measurementsCount++;
                reset();
            }
        }
        function addMeasure(entryName, cumulativeMeasurement) {
            const duration = performance.getEntriesByName(entryName)[0].duration;
            cumulativeMeasurement.total += duration;
            cumulativeMeasurement.min = Math.min(cumulativeMeasurement.min, duration);
            cumulativeMeasurement.max = Math.max(cumulativeMeasurement.max, duration);
        }
        /**
         * Clear the current sample.
         */
        function reset() {
            performance.clearMarks('keydown/start');
            performance.clearMarks('keydown/end');
            performance.clearMarks('input/start');
            performance.clearMarks('input/end');
            performance.clearMarks('render/start');
            performance.clearMarks('render/end');
            performance.clearMarks('inputlatency/start');
            performance.clearMarks('inputlatency/end');
            performance.clearMeasures('keydown');
            performance.clearMeasures('input');
            performance.clearMeasures('render');
            performance.clearMeasures('inputlatency');
            state.keydown = 0 /* EventPhase.Before */;
            state.input = 0 /* EventPhase.Before */;
            state.render = 0 /* EventPhase.Before */;
        }
        /**
         * Gets all input latency samples and clears the internal buffers to start recording a new set
         * of samples.
         */
        function getAndClearMeasurements() {
            if (measurementsCount === 0) {
                return undefined;
            }
            // Assemble the result
            const result = {
                keydown: cumulativeToFinalMeasurement(totalKeydownTime),
                input: cumulativeToFinalMeasurement(totalInputTime),
                render: cumulativeToFinalMeasurement(totalRenderTime),
                total: cumulativeToFinalMeasurement(totalInputLatencyTime),
                sampleCount: measurementsCount
            };
            // Clear the cumulative measurements
            clearCumulativeMeasurement(totalKeydownTime);
            clearCumulativeMeasurement(totalInputTime);
            clearCumulativeMeasurement(totalRenderTime);
            clearCumulativeMeasurement(totalInputLatencyTime);
            measurementsCount = 0;
            return result;
        }
        inputLatency.getAndClearMeasurements = getAndClearMeasurements;
        function cumulativeToFinalMeasurement(cumulative) {
            return {
                average: cumulative.total / measurementsCount,
                max: cumulative.max,
                min: cumulative.min,
            };
        }
        function clearCumulativeMeasurement(cumulative) {
            cumulative.total = 0;
            cumulative.min = Number.MAX_VALUE;
            cumulative.max = 0;
        }
    })(inputLatency || (exports.inputLatency = inputLatency = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVyZm9ybWFuY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9wZXJmb3JtYW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsSUFBaUIsWUFBWSxDQTBRNUI7SUExUUQsV0FBaUIsWUFBWTtRQVM1QixNQUFNLGdCQUFnQixHQUEyQixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQzdGLE1BQU0sY0FBYyxHQUEyQixFQUFFLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztRQUN2RSxNQUFNLGVBQWUsR0FBMkIsRUFBRSxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDeEUsTUFBTSxxQkFBcUIsR0FBMkIsRUFBRSxHQUFHLGdCQUFnQixFQUFFLENBQUM7UUFDOUUsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7UUFJMUIsdUZBQXVGO1FBQ3ZGLHNFQUFzRTtRQUN0RSxJQUFXLFVBSVY7UUFKRCxXQUFXLFVBQVU7WUFDcEIsK0NBQVUsQ0FBQTtZQUNWLHVEQUFjLENBQUE7WUFDZCxtREFBWSxDQUFBO1FBQ2IsQ0FBQyxFQUpVLFVBQVUsS0FBVixVQUFVLFFBSXBCO1FBQ0QsTUFBTSxLQUFLLEdBQUc7WUFDYixPQUFPLDJCQUFtQjtZQUMxQixLQUFLLDJCQUFtQjtZQUN4QixNQUFNLDJCQUFtQjtTQUN6QixDQUFDO1FBRUY7O1dBRUc7UUFDSCxTQUFnQixTQUFTO1lBQ3hCLGtFQUFrRTtZQUNsRSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN2QyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2xD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