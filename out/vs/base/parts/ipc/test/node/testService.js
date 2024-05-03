/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event"], function (require, exports, async_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestServiceClient = exports.TestChannel = exports.TestService = void 0;
    class TestService {
        constructor() {
            this._onMarco = new event_1.Emitter();
            this.onMarco = this._onMarco.event;
        }
        marco() {
            this._onMarco.fire({ answer: 'polo' });
            return Promise.resolve('polo');
        }
        pong(ping) {
            return Promise.resolve({ incoming: ping, outgoing: 'pong' });
        }
        cancelMe() {
            return Promise.resolve((0, async_1.timeout)(100)).then(() => true);
        }
    }
    exports.TestService = TestService;
    class TestChannel {
        constructor(testService) {
            this.testService = testService;
        }
        listen(_, event) {
            switch (event) {
                case 'marco': return this.testService.onMarco;
            }
            throw new Error('Event not found');
        }
        call(_, command, ...args) {
            switch (command) {
                case 'pong': return this.testService.pong(args[0]);
                case 'cancelMe': return this.testService.cancelMe();
                case 'marco': return this.testService.marco();
                default: return Promise.reject(new Error(`command not found: ${command}`));
            }
        }
    }
    exports.TestChannel = TestChannel;
    class TestServiceClient {
        get onMarco() { return this.channel.listen('marco'); }
        constructor(channel) {
            this.channel = channel;
        }
        marco() {
            return this.channel.call('marco');
        }
        pong(ping) {
            return this.channel.call('pong', ping);
        }
        cancelMe() {
            return this.channel.call('cancelMe');
        }
    }
    exports.TestServiceClient = TestServiceClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvcGFydHMvaXBjL3Rlc3Qvbm9kZS90ZXN0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHLE1BQWEsV0FBVztRQUF4QjtZQUVrQixhQUFRLEdBQUcsSUFBSSxlQUFPLEVBQW1CLENBQUM7WUFDM0QsWUFBTyxHQUEyQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztRQWN2RCxDQUFDO1FBWkEsS0FBSztZQUNKLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDdkMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBWTtZQUNoQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxRQUFRO1lBQ1AsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUEsZUFBTyxFQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FDRDtJQWpCRCxrQ0FpQkM7SUFFRCxNQUFhLFdBQVc7UUFFdkIsWUFBb0IsV0FBeUI7WUFBekIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7UUFBSSxDQUFDO1FBRWxELE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYTtZQUMvQixRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssT0FBTyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQztZQUMvQyxDQUFDO1lBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBVSxFQUFFLE9BQWUsRUFBRSxHQUFHLElBQVc7WUFDL0MsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxLQUFLLFVBQVUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEQsS0FBSyxPQUFPLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVFLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFwQkQsa0NBb0JDO0lBRUQsTUFBYSxpQkFBaUI7UUFFN0IsSUFBSSxPQUFPLEtBQTZCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTlFLFlBQW9CLE9BQWlCO1lBQWpCLFlBQU8sR0FBUCxPQUFPLENBQVU7UUFBSSxDQUFDO1FBRTFDLEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLENBQUMsSUFBWTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEMsQ0FBQztLQUNEO0lBakJELDhDQWlCQyJ9