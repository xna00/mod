/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostRpcService = exports.IExtHostRpcService = void 0;
    exports.IExtHostRpcService = (0, instantiation_1.createDecorator)('IExtHostRpcService');
    class ExtHostRpcService {
        constructor(rpcProtocol) {
            this.getProxy = rpcProtocol.getProxy.bind(rpcProtocol);
            this.set = rpcProtocol.set.bind(rpcProtocol);
            this.dispose = rpcProtocol.dispose.bind(rpcProtocol);
            this.assertRegistered = rpcProtocol.assertRegistered.bind(rpcProtocol);
            this.drain = rpcProtocol.drain.bind(rpcProtocol);
        }
    }
    exports.ExtHostRpcService = ExtHostRpcService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFJwY1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RScGNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtuRixRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsb0JBQW9CLENBQUMsQ0FBQztJQU01RixNQUFhLGlCQUFpQjtRQVM3QixZQUFZLFdBQXlCO1lBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbEQsQ0FBQztLQUNEO0lBaEJELDhDQWdCQyJ9