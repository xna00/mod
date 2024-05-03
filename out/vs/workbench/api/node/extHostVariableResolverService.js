/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/workbench/api/common/extHostVariableResolverService"], function (require, exports, os_1, extHostVariableResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeExtHostVariableResolverProviderService = void 0;
    class NodeExtHostVariableResolverProviderService extends extHostVariableResolverService_1.ExtHostVariableResolverProviderService {
        homeDir() {
            return (0, os_1.homedir)();
        }
    }
    exports.NodeExtHostVariableResolverProviderService = NodeExtHostVariableResolverProviderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFZhcmlhYmxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL25vZGUvZXh0SG9zdFZhcmlhYmxlUmVzb2x2ZXJTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLDBDQUEyQyxTQUFRLHVFQUFzQztRQUNsRixPQUFPO1lBQ3pCLE9BQU8sSUFBQSxZQUFPLEdBQUUsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFKRCxnR0FJQyJ9