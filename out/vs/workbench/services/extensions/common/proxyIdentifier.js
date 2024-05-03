/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SerializableObjectWithBuffers = exports.ProxyIdentifier = void 0;
    exports.createProxyIdentifier = createProxyIdentifier;
    exports.getStringIdentifierForProxy = getStringIdentifierForProxy;
    class ProxyIdentifier {
        static { this.count = 0; }
        constructor(sid) {
            this._proxyIdentifierBrand = undefined;
            this.sid = sid;
            this.nid = (++ProxyIdentifier.count);
        }
    }
    exports.ProxyIdentifier = ProxyIdentifier;
    const identifiers = [];
    function createProxyIdentifier(identifier) {
        const result = new ProxyIdentifier(identifier);
        identifiers[result.nid] = result;
        return result;
    }
    function getStringIdentifierForProxy(nid) {
        return identifiers[nid].sid;
    }
    /**
     * Marks the object as containing buffers that should be serialized more efficiently.
     */
    class SerializableObjectWithBuffers {
        constructor(value) {
            this.value = value;
        }
    }
    exports.SerializableObjectWithBuffers = SerializableObjectWithBuffers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHlJZGVudGlmaWVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vcHJveHlJZGVudGlmaWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRDaEcsc0RBSUM7SUFzQkQsa0VBRUM7SUEzQ0QsTUFBYSxlQUFlO2lCQUNiLFVBQUssR0FBRyxDQUFDLEFBQUosQ0FBSztRQU14QixZQUFZLEdBQVc7WUFMdkIsMEJBQXFCLEdBQVMsU0FBUyxDQUFDO1lBTXZDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1lBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7O0lBVkYsMENBV0M7SUFFRCxNQUFNLFdBQVcsR0FBMkIsRUFBRSxDQUFDO0lBRS9DLFNBQWdCLHFCQUFxQixDQUFJLFVBQWtCO1FBQzFELE1BQU0sTUFBTSxHQUFHLElBQUksZUFBZSxDQUFJLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQ2pDLE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQXNCRCxTQUFnQiwyQkFBMkIsQ0FBQyxHQUFXO1FBQ3RELE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxNQUFhLDZCQUE2QjtRQUN6QyxZQUNpQixLQUFRO1lBQVIsVUFBSyxHQUFMLEtBQUssQ0FBRztRQUNyQixDQUFDO0tBQ0w7SUFKRCxzRUFJQyJ9