/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalExtensionsRegistry = void 0;
    exports.registerTerminalContribution = registerTerminalContribution;
    function registerTerminalContribution(id, ctor, canRunInDetachedTerminals = false) {
        TerminalContributionRegistry.INSTANCE.registerTerminalContribution({ id, ctor, canRunInDetachedTerminals });
    }
    var TerminalExtensionsRegistry;
    (function (TerminalExtensionsRegistry) {
        function getTerminalContributions() {
            return TerminalContributionRegistry.INSTANCE.getTerminalContributions();
        }
        TerminalExtensionsRegistry.getTerminalContributions = getTerminalContributions;
    })(TerminalExtensionsRegistry || (exports.TerminalExtensionsRegistry = TerminalExtensionsRegistry = {}));
    class TerminalContributionRegistry {
        static { this.INSTANCE = new TerminalContributionRegistry(); }
        constructor() {
            this._terminalContributions = [];
        }
        registerTerminalContribution(description) {
            this._terminalContributions.push(description);
        }
        getTerminalContributions() {
            return this._terminalContributions.slice(0);
        }
    }
    var Extensions;
    (function (Extensions) {
        Extensions["TerminalContributions"] = "terminal.contributions";
    })(Extensions || (Extensions = {}));
    platform_1.Registry.add("terminal.contributions" /* Extensions.TerminalContributions */, TerminalContributionRegistry.INSTANCE);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxFeHRlbnNpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsRXh0ZW5zaW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvQmhHLG9FQUVDO0lBRkQsU0FBZ0IsNEJBQTRCLENBQW9DLEVBQVUsRUFBRSxJQUF1SyxFQUFFLHlCQUF5QixHQUFHLEtBQUs7UUFDclMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLDRCQUE0QixDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBc0MsQ0FBQyxDQUFDO0lBQ2pKLENBQUM7SUFFRCxJQUFpQiwwQkFBMEIsQ0FJMUM7SUFKRCxXQUFpQiwwQkFBMEI7UUFDMUMsU0FBZ0Isd0JBQXdCO1lBQ3ZDLE9BQU8sNEJBQTRCLENBQUMsUUFBUSxDQUFDLHdCQUF3QixFQUFFLENBQUM7UUFDekUsQ0FBQztRQUZlLG1EQUF3QiwyQkFFdkMsQ0FBQTtJQUNGLENBQUMsRUFKZ0IsMEJBQTBCLDBDQUExQiwwQkFBMEIsUUFJMUM7SUFFRCxNQUFNLDRCQUE0QjtpQkFFVixhQUFRLEdBQUcsSUFBSSw0QkFBNEIsRUFBRSxBQUFyQyxDQUFzQztRQUlyRTtZQUZpQiwyQkFBc0IsR0FBdUMsRUFBRSxDQUFDO1FBR2pGLENBQUM7UUFFTSw0QkFBNEIsQ0FBQyxXQUE2QztZQUNoRixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFTSx3QkFBd0I7WUFDOUIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7O0lBR0YsSUFBVyxVQUVWO0lBRkQsV0FBVyxVQUFVO1FBQ3BCLDhEQUFnRCxDQUFBO0lBQ2pELENBQUMsRUFGVSxVQUFVLEtBQVYsVUFBVSxRQUVwQjtJQUVELG1CQUFRLENBQUMsR0FBRyxrRUFBbUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLENBQUMifQ==