/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/common/ipc.mp"], function (require, exports, ipc_mp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = void 0;
    /**
     * An implementation of a `IPCClient` on top of DOM `MessagePort`.
     */
    class Client extends ipc_mp_1.Client {
        /**
         * @param clientId a way to uniquely identify this client among
         * other clients. this is important for routing because every
         * client can also be a server
         */
        constructor(port, clientId) {
            super(port, clientId);
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBjLm1wLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3BhcnRzL2lwYy9icm93c2VyL2lwYy5tcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEc7O09BRUc7SUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFpQjtRQUU1Qzs7OztXQUlHO1FBQ0gsWUFBWSxJQUFpQixFQUFFLFFBQWdCO1lBQzlDLEtBQUssQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBVkQsd0JBVUMifQ==