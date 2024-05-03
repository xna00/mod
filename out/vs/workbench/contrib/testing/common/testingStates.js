/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.makeEmptyCounts = exports.terminalStatePriorities = exports.statesInOrder = exports.maxPriority = exports.cmpPriority = exports.stateNodes = exports.isStateWithResult = exports.isFailedState = exports.statePriority = void 0;
    /**
     * List of display priorities for different run states. When tests update,
     * the highest-priority state from any of their children will be the state
     * reflected in the parent node.
     */
    exports.statePriority = {
        [2 /* TestResultState.Running */]: 6,
        [6 /* TestResultState.Errored */]: 5,
        [4 /* TestResultState.Failed */]: 4,
        [1 /* TestResultState.Queued */]: 3,
        [3 /* TestResultState.Passed */]: 2,
        [0 /* TestResultState.Unset */]: 0,
        [5 /* TestResultState.Skipped */]: 1,
    };
    const isFailedState = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */;
    exports.isFailedState = isFailedState;
    const isStateWithResult = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */ || s === 3 /* TestResultState.Passed */;
    exports.isStateWithResult = isStateWithResult;
    exports.stateNodes = Object.entries(exports.statePriority).reduce((acc, [stateStr, priority]) => {
        const state = Number(stateStr);
        acc[state] = { statusNode: true, state, priority };
        return acc;
    }, {});
    const cmpPriority = (a, b) => exports.statePriority[b] - exports.statePriority[a];
    exports.cmpPriority = cmpPriority;
    const maxPriority = (...states) => {
        switch (states.length) {
            case 0:
                return 0 /* TestResultState.Unset */;
            case 1:
                return states[0];
            case 2:
                return exports.statePriority[states[0]] > exports.statePriority[states[1]] ? states[0] : states[1];
            default: {
                let max = states[0];
                for (let i = 1; i < states.length; i++) {
                    if (exports.statePriority[max] < exports.statePriority[states[i]]) {
                        max = states[i];
                    }
                }
                return max;
            }
        }
    };
    exports.maxPriority = maxPriority;
    exports.statesInOrder = Object.keys(exports.statePriority).map(s => Number(s)).sort(exports.cmpPriority);
    /**
     * Some states are considered terminal; once these are set for a given test run, they
     * are not reset back to a non-terminal state, or to a terminal state with lower
     * priority.
     */
    exports.terminalStatePriorities = {
        [3 /* TestResultState.Passed */]: 0,
        [5 /* TestResultState.Skipped */]: 1,
        [4 /* TestResultState.Failed */]: 2,
        [6 /* TestResultState.Errored */]: 3,
    };
    const makeEmptyCounts = () => {
        // shh! don't tell anyone this is actually an array!
        return new Uint32Array(exports.statesInOrder.length);
    };
    exports.makeEmptyCounts = makeEmptyCounts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1N0YXRlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdGluZ1N0YXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEc7Ozs7T0FJRztJQUNVLFFBQUEsYUFBYSxHQUF1QztRQUNoRSxpQ0FBeUIsRUFBRSxDQUFDO1FBQzVCLGlDQUF5QixFQUFFLENBQUM7UUFDNUIsZ0NBQXdCLEVBQUUsQ0FBQztRQUMzQixnQ0FBd0IsRUFBRSxDQUFDO1FBQzNCLGdDQUF3QixFQUFFLENBQUM7UUFDM0IsK0JBQXVCLEVBQUUsQ0FBQztRQUMxQixpQ0FBeUIsRUFBRSxDQUFDO0tBQzVCLENBQUM7SUFFSyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUMsb0NBQTRCLElBQUksQ0FBQyxtQ0FBMkIsQ0FBQztJQUF0RyxRQUFBLGFBQWEsaUJBQXlGO0lBQzVHLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxDQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFDLG9DQUE0QixJQUFJLENBQUMsbUNBQTJCLElBQUksQ0FBQyxtQ0FBMkIsQ0FBQztJQUExSSxRQUFBLGlCQUFpQixxQkFBeUg7SUFFMUksUUFBQSxVQUFVLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxxQkFBYSxDQUFDLENBQUMsTUFBTSxDQUM3RCxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFO1FBQzdCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQW9CLENBQUM7UUFDbEQsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUM7UUFDbkQsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDLEVBQUUsRUFBK0MsQ0FDbEQsQ0FBQztJQUVLLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBa0IsRUFBRSxDQUFrQixFQUFFLEVBQUUsQ0FBQyxxQkFBYSxDQUFDLENBQUMsQ0FBQyxHQUFHLHFCQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBOUYsUUFBQSxXQUFXLGVBQW1GO0lBRXBHLE1BQU0sV0FBVyxHQUFHLENBQUMsR0FBRyxNQUF5QixFQUFFLEVBQUU7UUFDM0QsUUFBUSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdkIsS0FBSyxDQUFDO2dCQUNMLHFDQUE2QjtZQUM5QixLQUFLLENBQUM7Z0JBQ0wsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEIsS0FBSyxDQUFDO2dCQUNMLE9BQU8scUJBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxxQkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwRixPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNULElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxxQkFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLHFCQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDbkQsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDakIsQ0FBQztnQkFDRixDQUFDO2dCQUVELE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztRQUNGLENBQUM7SUFDRixDQUFDLENBQUM7SUFuQlcsUUFBQSxXQUFXLGVBbUJ0QjtJQUVXLFFBQUEsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQW9CLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQVcsQ0FBQyxDQUFDO0lBRWpIOzs7O09BSUc7SUFDVSxRQUFBLHVCQUF1QixHQUEwQztRQUM3RSxnQ0FBd0IsRUFBRSxDQUFDO1FBQzNCLGlDQUF5QixFQUFFLENBQUM7UUFDNUIsZ0NBQXdCLEVBQUUsQ0FBQztRQUMzQixpQ0FBeUIsRUFBRSxDQUFDO0tBQzVCLENBQUM7SUFPSyxNQUFNLGVBQWUsR0FBRyxHQUFtQixFQUFFO1FBQ25ELG9EQUFvRDtRQUNwRCxPQUFPLElBQUksV0FBVyxDQUFDLHFCQUFhLENBQUMsTUFBTSxDQUE4QyxDQUFDO0lBQzNGLENBQUMsQ0FBQztJQUhXLFFBQUEsZUFBZSxtQkFHMUIifQ==