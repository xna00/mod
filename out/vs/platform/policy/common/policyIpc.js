/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/policy/common/policy"], function (require, exports, event_1, lifecycle_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyChannelClient = exports.PolicyChannel = void 0;
    class PolicyChannel {
        constructor(service) {
            this.service = service;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChange': return event_1.Event.map(this.service.onDidChange, names => names.reduce((r, name) => ({ ...r, [name]: this.service.getPolicyValue(name) ?? null }), {}), this.disposables);
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'updatePolicyDefinitions': return this.service.updatePolicyDefinitions(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    exports.PolicyChannel = PolicyChannel;
    class PolicyChannelClient extends policy_1.AbstractPolicyService {
        constructor(policiesData, channel) {
            super();
            this.channel = channel;
            for (const name in policiesData) {
                const { definition, value } = policiesData[name];
                this.policyDefinitions[name] = definition;
                if (value !== undefined) {
                    this.policies.set(name, value);
                }
            }
            this.channel.listen('onDidChange')(policies => {
                for (const name in policies) {
                    const value = policies[name];
                    if (value === null) {
                        this.policies.delete(name);
                    }
                    else {
                        this.policies.set(name, value);
                    }
                }
                this._onDidChange.fire(Object.keys(policies));
            });
        }
        async _updatePolicyDefinitions(policyDefinitions) {
            const result = await this.channel.call('updatePolicyDefinitions', policyDefinitions);
            for (const name in result) {
                this.policies.set(name, result[name]);
            }
        }
    }
    exports.PolicyChannelClient = PolicyChannelClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5SXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wb2xpY3kvY29tbW9uL3BvbGljeUlwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxhQUFhO1FBSXpCLFlBQW9CLE9BQXVCO1lBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO1lBRjFCLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFTixDQUFDO1FBRWhELE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYTtZQUMvQixRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssYUFBYSxDQUFDLENBQUMsT0FBTyxhQUFLLENBQUMsR0FBRyxDQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFDeEIsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFDN0csSUFBSSxDQUFDLFdBQVcsQ0FDaEIsQ0FBQztZQUNILENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBVSxFQUFFLE9BQWUsRUFBRSxHQUFTO1lBQzFDLFFBQVEsT0FBTyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUsseUJBQXlCLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsR0FBMEMsQ0FBQyxDQUFDO1lBQ3pILENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixDQUFDO0tBQ0Q7SUE3QkQsc0NBNkJDO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSw4QkFBcUI7UUFFN0QsWUFBWSxZQUFxRixFQUFtQixPQUFpQjtZQUNwSSxLQUFLLEVBQUUsQ0FBQztZQUQyRyxZQUFPLEdBQVAsT0FBTyxDQUFVO1lBRXBJLEtBQUssTUFBTSxJQUFJLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2pDLE1BQU0sRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDO2dCQUMxQyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFTLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNyRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUM3QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBNkIsQ0FBQyxDQUFDO29CQUV0RCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVCLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2hDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLGlCQUFzRDtZQUM5RixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFzQyx5QkFBeUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQzFILEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQztLQUVEO0lBakNELGtEQWlDQyJ9