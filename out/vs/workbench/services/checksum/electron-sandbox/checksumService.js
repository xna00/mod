/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/checksum/common/checksumService", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, checksumService_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerSharedProcessRemoteService)(checksumService_1.IChecksumService, 'checksum');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tzdW1TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY2hlY2tzdW0vZWxlY3Ryb24tc2FuZGJveC9jaGVja3N1bVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsSUFBQSw2Q0FBa0MsRUFBQyxrQ0FBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQyJ9