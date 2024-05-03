/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullPolicyService = exports.AbstractPolicyService = exports.IPolicyService = void 0;
    exports.IPolicyService = (0, instantiation_1.createDecorator)('policy');
    class AbstractPolicyService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.policyDefinitions = {};
            this.policies = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        async updatePolicyDefinitions(policyDefinitions) {
            const size = Object.keys(this.policyDefinitions).length;
            this.policyDefinitions = { ...policyDefinitions, ...this.policyDefinitions };
            if (size !== Object.keys(this.policyDefinitions).length) {
                await this._updatePolicyDefinitions(policyDefinitions);
            }
            return iterator_1.Iterable.reduce(this.policies.entries(), (r, [name, value]) => ({ ...r, [name]: value }), {});
        }
        getPolicyValue(name) {
            return this.policies.get(name);
        }
        serialize() {
            return iterator_1.Iterable.reduce(Object.entries(this.policyDefinitions), (r, [name, definition]) => ({ ...r, [name]: { definition, value: this.policies.get(name) } }), {});
        }
    }
    exports.AbstractPolicyService = AbstractPolicyService;
    class NullPolicyService {
        constructor() {
            this.onDidChange = event_1.Event.None;
        }
        async updatePolicyDefinitions() { return {}; }
        getPolicyValue() { return undefined; }
        serialize() { return undefined; }
    }
    exports.NullPolicyService = NullPolicyService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wb2xpY3kvY29tbW9uL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZbkYsUUFBQSxjQUFjLEdBQUcsSUFBQSwrQkFBZSxFQUFpQixRQUFRLENBQUMsQ0FBQztJQVd4RSxNQUFzQixxQkFBc0IsU0FBUSxzQkFBVTtRQUE5RDs7WUFHVyxzQkFBaUIsR0FBd0MsRUFBRSxDQUFDO1lBQzVELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUVyQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXlCLENBQUMsQ0FBQztZQUM5RSxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBc0JoRCxDQUFDO1FBcEJBLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxpQkFBc0Q7WUFDbkYsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDeEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsR0FBRyxpQkFBaUIsRUFBRSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBRTdFLElBQUksSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3pELE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDeEQsQ0FBQztZQUVELE9BQU8sbUJBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsY0FBYyxDQUFDLElBQWdCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsQ0FBQztRQUVELFNBQVM7WUFDUixPQUFPLG1CQUFRLENBQUMsTUFBTSxDQUEwRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN1EsQ0FBQztLQUdEO0lBN0JELHNEQTZCQztJQUVELE1BQWEsaUJBQWlCO1FBQTlCO1lBRVUsZ0JBQVcsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1FBSW5DLENBQUM7UUFIQSxLQUFLLENBQUMsdUJBQXVCLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzlDLGNBQWMsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsU0FBUyxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztLQUNqQztJQU5ELDhDQU1DIn0=