/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/async"], function (require, exports, instantiation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.remoteConnectionLatencyMeasurer = exports.IRemoteAgentService = void 0;
    exports.IRemoteAgentService = (0, instantiation_1.createDecorator)('remoteAgentService');
    exports.remoteConnectionLatencyMeasurer = new class {
        constructor() {
            this.maxSampleCount = 5;
            this.sampleDelay = 2000;
            this.initial = [];
            this.maxInitialCount = 3;
            this.average = [];
            this.maxAverageCount = 100;
            this.highLatencyMultiple = 2;
            this.highLatencyMinThreshold = 500;
            this.highLatencyMaxThreshold = 1500;
            this.lastMeasurement = undefined;
        }
        get latency() { return this.lastMeasurement; }
        async measure(remoteAgentService) {
            let currentLatency = Infinity;
            // Measure up to samples count
            for (let i = 0; i < this.maxSampleCount; i++) {
                const rtt = await remoteAgentService.getRoundTripTime();
                if (rtt === undefined) {
                    return undefined;
                }
                currentLatency = Math.min(currentLatency, rtt / 2 /* we want just one way, not round trip time */);
                await (0, async_1.timeout)(this.sampleDelay);
            }
            // Keep track of average latency
            this.average.push(currentLatency);
            if (this.average.length > this.maxAverageCount) {
                this.average.shift();
            }
            // Keep track of initial latency
            let initialLatency = undefined;
            if (this.initial.length < this.maxInitialCount) {
                this.initial.push(currentLatency);
            }
            else {
                initialLatency = this.initial.reduce((sum, value) => sum + value, 0) / this.initial.length;
            }
            // Remember as last measurement
            this.lastMeasurement = {
                initial: initialLatency,
                current: currentLatency,
                average: this.average.reduce((sum, value) => sum + value, 0) / this.average.length,
                high: (() => {
                    // based on the initial, average and current latency, try to decide
                    // if the connection has high latency
                    // Some rules:
                    // - we require the initial latency to be computed
                    // - we only consider latency above highLatencyMinThreshold as potentially high
                    // - we require the current latency to be above the average latency by a factor of highLatencyMultiple
                    // - but not if the latency is actually above highLatencyMaxThreshold
                    if (typeof initialLatency === 'undefined') {
                        return false;
                    }
                    if (currentLatency > this.highLatencyMaxThreshold) {
                        return true;
                    }
                    if (currentLatency > this.highLatencyMinThreshold && currentLatency > initialLatency * this.highLatencyMultiple) {
                        return true;
                    }
                    return false;
                })()
            };
            return this.lastMeasurement;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQWdlbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2NvbW1vbi9yZW1vdGVBZ2VudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV25GLFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixvQkFBb0IsQ0FBQyxDQUFDO0lBMERqRixRQUFBLCtCQUErQixHQUFHLElBQUk7UUFBQTtZQUV6QyxtQkFBYyxHQUFHLENBQUMsQ0FBQztZQUNuQixnQkFBVyxHQUFHLElBQUksQ0FBQztZQUVuQixZQUFPLEdBQWEsRUFBRSxDQUFDO1lBQ3ZCLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1lBRXBCLFlBQU8sR0FBYSxFQUFFLENBQUM7WUFDdkIsb0JBQWUsR0FBRyxHQUFHLENBQUM7WUFFdEIsd0JBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLDRCQUF1QixHQUFHLEdBQUcsQ0FBQztZQUM5Qiw0QkFBdUIsR0FBRyxJQUFJLENBQUM7WUFFeEMsb0JBQWUsR0FBb0QsU0FBUyxDQUFDO1FBZ0U5RSxDQUFDO1FBL0RBLElBQUksT0FBTyxLQUFLLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFFOUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQkFBdUM7WUFDcEQsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDO1lBRTlCLDhCQUE4QjtZQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLEdBQUcsR0FBRyxNQUFNLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hELElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN2QixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO2dCQUNuRyxNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLENBQUM7WUFFRCxnQ0FBZ0M7WUFDaEMsSUFBSSxjQUFjLEdBQXVCLFNBQVMsQ0FBQztZQUNuRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDNUYsQ0FBQztZQUVELCtCQUErQjtZQUMvQixJQUFJLENBQUMsZUFBZSxHQUFHO2dCQUN0QixPQUFPLEVBQUUsY0FBYztnQkFDdkIsT0FBTyxFQUFFLGNBQWM7Z0JBQ3ZCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO2dCQUNsRixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUU7b0JBRVgsbUVBQW1FO29CQUNuRSxxQ0FBcUM7b0JBQ3JDLGNBQWM7b0JBQ2Qsa0RBQWtEO29CQUNsRCwrRUFBK0U7b0JBQy9FLHNHQUFzRztvQkFDdEcscUVBQXFFO29CQUVyRSxJQUFJLE9BQU8sY0FBYyxLQUFLLFdBQVcsRUFBRSxDQUFDO3dCQUMzQyxPQUFPLEtBQUssQ0FBQztvQkFDZCxDQUFDO29CQUVELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUVELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxjQUFjLEdBQUcsY0FBYyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO3dCQUNqSCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUVELE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUMsQ0FBQyxFQUFFO2FBQ0osQ0FBQztZQUVGLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUM3QixDQUFDO0tBQ0QsQ0FBQyJ9