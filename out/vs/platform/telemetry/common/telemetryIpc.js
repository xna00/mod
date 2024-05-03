/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryAppenderClient = exports.TelemetryAppenderChannel = void 0;
    class TelemetryAppenderChannel {
        constructor(appenders) {
            this.appenders = appenders;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, { eventName, data }) {
            this.appenders.forEach(a => a.log(eventName, data));
            return Promise.resolve(null);
        }
    }
    exports.TelemetryAppenderChannel = TelemetryAppenderChannel;
    class TelemetryAppenderClient {
        constructor(channel) {
            this.channel = channel;
        }
        log(eventName, data) {
            this.channel.call('log', { eventName, data })
                .then(undefined, err => `Failed to log telemetry: ${console.warn(err)}`);
            return Promise.resolve(null);
        }
        flush() {
            // TODO
            return Promise.resolve();
        }
    }
    exports.TelemetryAppenderClient = TelemetryAppenderClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5SXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvY29tbW9uL3RlbGVtZXRyeUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSx3QkFBd0I7UUFFcEMsWUFBb0IsU0FBK0I7WUFBL0IsY0FBUyxHQUFULFNBQVMsQ0FBc0I7UUFBSSxDQUFDO1FBRXhELE1BQU0sQ0FBSSxDQUFVLEVBQUUsS0FBYTtZQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBVSxFQUFFLE9BQWUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQWlCO1lBQ25FLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztLQUNEO0lBWkQsNERBWUM7SUFFRCxNQUFhLHVCQUF1QjtRQUVuQyxZQUFvQixPQUFpQjtZQUFqQixZQUFPLEdBQVAsT0FBTyxDQUFVO1FBQUksQ0FBQztRQUUxQyxHQUFHLENBQUMsU0FBaUIsRUFBRSxJQUFVO1lBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQztpQkFDM0MsSUFBSSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLDRCQUE0QixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUUxRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPO1lBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNEO0lBZkQsMERBZUMifQ==