/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportSample = reportSample;
    function reportSample(data, telemetryService, logService, sendAsErrorTelemtry) {
        const { sample, perfBaseline, source } = data;
        // send telemetry event
        telemetryService.publicLog2(`unresponsive.sample`, {
            perfBaseline,
            selfTime: sample.selfTime,
            totalTime: sample.totalTime,
            percentage: sample.percentage,
            functionName: sample.location,
            callers: sample.caller.map(c => c.location).join('<'),
            callersAnnotated: sample.caller.map(c => `${c.percentage}|${c.location}`).join('<'),
            source
        });
        // log a fake error with a clearer stack
        const fakeError = new PerformanceError(data);
        if (sendAsErrorTelemtry) {
            errors_1.errorHandler.onUnexpectedError(fakeError);
        }
        else {
            logService.error(fakeError);
        }
    }
    class PerformanceError extends Error {
        constructor(data) {
            super(`PerfSampleError: by ${data.source} in ${data.sample.location}`);
            this.name = 'PerfSampleError';
            this.selfTime = data.sample.selfTime;
            const trace = [data.sample.absLocation, ...data.sample.caller.map(c => c.absLocation)];
            this.stack = `\n\t at ${trace.join('\n\t at ')}`;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nVGVsZW1ldHJ5U3BlYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvZmlsaW5nL2NvbW1vbi9wcm9maWxpbmdUZWxlbWV0cnlTcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUNoRyxvQ0F1QkM7SUF2QkQsU0FBZ0IsWUFBWSxDQUFDLElBQWdCLEVBQUUsZ0JBQW1DLEVBQUUsVUFBdUIsRUFBRSxtQkFBNEI7UUFFeEksTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRTlDLHVCQUF1QjtRQUN2QixnQkFBZ0IsQ0FBQyxVQUFVLENBQXlELHFCQUFxQixFQUFFO1lBQzFHLFlBQVk7WUFDWixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7WUFDekIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1lBQzNCLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtZQUM3QixZQUFZLEVBQUUsTUFBTSxDQUFDLFFBQVE7WUFDN0IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDckQsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNuRixNQUFNO1NBQ04sQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQ3hDLE1BQU0sU0FBUyxHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3pCLHFCQUFZLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDM0MsQ0FBQzthQUFNLENBQUM7WUFDUCxVQUFVLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdCLENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxnQkFBaUIsU0FBUSxLQUFLO1FBR25DLFlBQVksSUFBZ0I7WUFDM0IsS0FBSyxDQUFDLHVCQUF1QixJQUFJLENBQUMsTUFBTSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsSUFBSSxHQUFHLGlCQUFpQixDQUFDO1lBQzlCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFFckMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDbEQsQ0FBQztLQUNEIn0=