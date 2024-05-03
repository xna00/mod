/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/base/common/event", "vs/platform/instantiation/common/instantiation"], function (require, exports, extHost_protocol_1, event_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostSecretState = exports.ExtHostSecretState = void 0;
    class ExtHostSecretState {
        constructor(mainContext) {
            this._onDidChangePassword = new event_1.Emitter();
            this.onDidChangePassword = this._onDidChangePassword.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSecretState);
        }
        async $onDidChangePassword(e) {
            this._onDidChangePassword.fire(e);
        }
        get(extensionId, key) {
            return this._proxy.$getPassword(extensionId, key);
        }
        store(extensionId, key, value) {
            return this._proxy.$setPassword(extensionId, key, value);
        }
        delete(extensionId, key) {
            return this._proxy.$deletePassword(extensionId, key);
        }
    }
    exports.ExtHostSecretState = ExtHostSecretState;
    exports.IExtHostSecretState = (0, instantiation_1.createDecorator)('IExtHostSecretState');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFNlY3JldFN0YXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0U2VjcmV0U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsa0JBQWtCO1FBSzlCLFlBQVksV0FBK0I7WUFIbkMseUJBQW9CLEdBQUcsSUFBSSxlQUFPLEVBQXdDLENBQUM7WUFDMUUsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUc5RCxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3ZFLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBdUM7WUFDakUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsR0FBRyxDQUFDLFdBQW1CLEVBQUUsR0FBVztZQUNuQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQW1CLEVBQUUsR0FBVyxFQUFFLEtBQWE7WUFDcEQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxNQUFNLENBQUMsV0FBbUIsRUFBRSxHQUFXO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FDRDtJQXhCRCxnREF3QkM7SUFHWSxRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0IscUJBQXFCLENBQUMsQ0FBQyJ9