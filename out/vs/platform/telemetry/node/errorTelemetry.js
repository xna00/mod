/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/telemetry/common/errorTelemetry"], function (require, exports, errors_1, errorTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorTelemetry extends errorTelemetry_1.default {
        installErrorListeners() {
            (0, errors_1.setUnexpectedErrorHandler)(err => console.error(err));
            // Print a console message when rejection isn't handled within N seconds. For details:
            // see https://nodejs.org/api/process.html#process_event_unhandledrejection
            // and https://nodejs.org/api/process.html#process_event_rejectionhandled
            const unhandledPromises = [];
            process.on('unhandledRejection', (reason, promise) => {
                unhandledPromises.push(promise);
                setTimeout(() => {
                    const idx = unhandledPromises.indexOf(promise);
                    if (idx >= 0) {
                        promise.catch(e => {
                            unhandledPromises.splice(idx, 1);
                            if (!(0, errors_1.isCancellationError)(e)) {
                                console.warn(`rejected promise not handled within 1 second: ${e}`);
                                if (e.stack) {
                                    console.warn(`stack trace: ${e.stack}`);
                                }
                                if (reason) {
                                    (0, errors_1.onUnexpectedError)(reason);
                                }
                            }
                        });
                    }
                }, 1000);
            });
            process.on('rejectionHandled', (promise) => {
                const idx = unhandledPromises.indexOf(promise);
                if (idx >= 0) {
                    unhandledPromises.splice(idx, 1);
                }
            });
            // Print a console message when an exception isn't handled.
            process.on('uncaughtException', (err) => {
                if ((0, errors_1.isSigPipeError)(err)) {
                    return;
                }
                (0, errors_1.onUnexpectedError)(err);
            });
        }
    }
    exports.default = ErrorTelemetry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9ub2RlL2Vycm9yVGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLE1BQXFCLGNBQWUsU0FBUSx3QkFBa0I7UUFDMUMscUJBQXFCO1lBQ3ZDLElBQUEsa0NBQXlCLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFckQsc0ZBQXNGO1lBQ3RGLDJFQUEyRTtZQUMzRSx5RUFBeUU7WUFDekUsTUFBTSxpQkFBaUIsR0FBbUIsRUFBRSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFXLEVBQUUsT0FBcUIsRUFBRSxFQUFFO2dCQUN2RSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ2YsTUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUNqQixpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUNqQyxJQUFJLENBQUMsSUFBQSw0QkFBbUIsRUFBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dDQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLGlEQUFpRCxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dDQUNuRSxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQ0FDYixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztnQ0FDekMsQ0FBQztnQ0FDRCxJQUFJLE1BQU0sRUFBRSxDQUFDO29DQUNaLElBQUEsMEJBQWlCLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0NBQzNCLENBQUM7NEJBQ0YsQ0FBQzt3QkFDRixDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDO2dCQUNGLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLE9BQXFCLEVBQUUsRUFBRTtnQkFDeEQsTUFBTSxHQUFHLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDZCxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCwyREFBMkQ7WUFDM0QsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEdBQWtDLEVBQUUsRUFBRTtnQkFDdEUsSUFBSSxJQUFBLHVCQUFjLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDekIsT0FBTztnQkFDUixDQUFDO2dCQUVELElBQUEsMEJBQWlCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUE3Q0QsaUNBNkNDIn0=