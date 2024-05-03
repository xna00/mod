/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/update/common/update"], function (require, exports, event_1, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UpdateChannelClient = exports.UpdateChannel = void 0;
    class UpdateChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onStateChange': return this.service.onStateChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'checkForUpdates': return this.service.checkForUpdates(arg);
                case 'downloadUpdate': return this.service.downloadUpdate();
                case 'applyUpdate': return this.service.applyUpdate();
                case 'quitAndInstall': return this.service.quitAndInstall();
                case '_getInitialState': return Promise.resolve(this.service.state);
                case 'isLatestVersion': return this.service.isLatestVersion();
                case '_applySpecificUpdate': return this.service._applySpecificUpdate(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.UpdateChannel = UpdateChannel;
    class UpdateChannelClient {
        get state() { return this._state; }
        set state(state) {
            this._state = state;
            this._onStateChange.fire(state);
        }
        constructor(channel) {
            this.channel = channel;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            this._state = update_1.State.Uninitialized;
            this.channel.listen('onStateChange')(state => this.state = state);
            this.channel.call('_getInitialState').then(state => this.state = state);
        }
        checkForUpdates(explicit) {
            return this.channel.call('checkForUpdates', explicit);
        }
        downloadUpdate() {
            return this.channel.call('downloadUpdate');
        }
        applyUpdate() {
            return this.channel.call('applyUpdate');
        }
        quitAndInstall() {
            return this.channel.call('quitAndInstall');
        }
        isLatestVersion() {
            return this.channel.call('isLatestVersion');
        }
        _applySpecificUpdate(packagePath) {
            return this.channel.call('_applySpecificUpdate', packagePath);
        }
    }
    exports.UpdateChannelClient = UpdateChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91cGRhdGUvY29tbW9uL3VwZGF0ZUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxhQUFhO1FBRXpCLFlBQW9CLE9BQXVCO1lBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBQUksQ0FBQztRQUVoRCxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsUUFBUSxLQUFLLEVBQUUsQ0FBQztnQkFDZixLQUFLLGVBQWUsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7WUFDekQsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELElBQUksQ0FBQyxDQUFVLEVBQUUsT0FBZSxFQUFFLEdBQVM7WUFDMUMsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2pFLEtBQUssZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVELEtBQUssYUFBYSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0RCxLQUFLLGdCQUFnQixDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUM1RCxLQUFLLGtCQUFrQixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3BFLEtBQUssaUJBQWlCLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzlELEtBQUssc0JBQXNCLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDNUUsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDL0MsQ0FBQztLQUNEO0lBekJELHNDQXlCQztJQUVELE1BQWEsbUJBQW1CO1FBUS9CLElBQUksS0FBSyxLQUFZLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxLQUFLLENBQUMsS0FBWTtZQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFBNkIsT0FBaUI7WUFBakIsWUFBTyxHQUFQLE9BQU8sQ0FBVTtZQVY3QixtQkFBYyxHQUFHLElBQUksZUFBTyxFQUFTLENBQUM7WUFDOUMsa0JBQWEsR0FBaUIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7WUFFekQsV0FBTSxHQUFVLGNBQUssQ0FBQyxhQUFhLENBQUM7WUFRM0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQVEsZUFBZSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFRLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBRUQsZUFBZSxDQUFDLFFBQWlCO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELGNBQWM7WUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELFdBQVc7WUFDVixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxlQUFlO1lBQ2QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxvQkFBb0IsQ0FBQyxXQUFtQjtZQUN2QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQy9ELENBQUM7S0FDRDtJQTFDRCxrREEwQ0MifQ==