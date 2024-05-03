/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerTelemetryChannel = void 0;
    class ServerTelemetryChannel extends lifecycle_1.Disposable {
        constructor(telemetryService, telemetryAppender) {
            super();
            this.telemetryService = telemetryService;
            this.telemetryAppender = telemetryAppender;
        }
        async call(_, command, arg) {
            switch (command) {
                case 'updateTelemetryLevel': {
                    const { telemetryLevel } = arg;
                    return this.telemetryService.updateInjectedTelemetryLevel(telemetryLevel);
                }
                case 'logTelemetry': {
                    const { eventName, data } = arg;
                    // Logging is done directly to the appender instead of through the telemetry service
                    // as the data sent from the client has already had common properties added to it and
                    // has already been sent to the telemetry output channel
                    if (this.telemetryAppender) {
                        return this.telemetryAppender.log(eventName, data);
                    }
                    return Promise.resolve();
                }
                case 'flushTelemetry': {
                    if (this.telemetryAppender) {
                        return this.telemetryAppender.flush();
                    }
                    return Promise.resolve();
                }
                case 'ping': {
                    return;
                }
            }
            // Command we cannot handle so we throw an error
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(_, event, arg) {
            throw new Error('Not supported');
        }
        /**
         * Disposing the channel also disables the telemetryService as there is
         * no longer a way to control it
         */
        dispose() {
            this.telemetryService.updateInjectedTelemetryLevel(0 /* TelemetryLevel.NONE */);
            super.dispose();
        }
    }
    exports.ServerTelemetryChannel = ServerTelemetryChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVGVsZW1ldHJ5Q2hhbm5lbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L2NvbW1vbi9yZW1vdGVUZWxlbWV0cnlDaGFubmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHNCQUF1QixTQUFRLHNCQUFVO1FBQ3JELFlBQ2tCLGdCQUF5QyxFQUN6QyxpQkFBNEM7WUFFN0QsS0FBSyxFQUFFLENBQUM7WUFIUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXlCO1lBQ3pDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBMkI7UUFHOUQsQ0FBQztRQUdELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBTSxFQUFFLE9BQWUsRUFBRSxHQUFTO1lBQzVDLFFBQVEsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssc0JBQXNCLENBQUMsQ0FBQyxDQUFDO29CQUM3QixNQUFNLEVBQUUsY0FBYyxFQUFFLEdBQUcsR0FBRyxDQUFDO29CQUMvQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyw0QkFBNEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDM0UsQ0FBQztnQkFFRCxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JCLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO29CQUNoQyxvRkFBb0Y7b0JBQ3BGLHFGQUFxRjtvQkFDckYsd0RBQXdEO29CQUN4RCxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUM1QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNwRCxDQUFDO29CQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMxQixDQUFDO2dCQUVELEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO29CQUN2QixJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUM1QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDdkMsQ0FBQztvQkFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFFRCxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7b0JBQ2IsT0FBTztnQkFDUixDQUFDO1lBQ0YsQ0FBQztZQUNELGdEQUFnRDtZQUNoRCxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsT0FBTyxZQUFZLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQsTUFBTSxDQUFDLENBQU0sRUFBRSxLQUFhLEVBQUUsR0FBUTtZQUNyQyxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRDs7O1dBR0c7UUFDYSxPQUFPO1lBQ3RCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyw0QkFBNEIsNkJBQXFCLENBQUM7WUFDeEUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQXhERCx3REF3REMifQ==