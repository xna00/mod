/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/platform/encryption/common/encryptionService"], function (require, exports, services_1, encryptionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerMainProcessRemoteService)(encryptionService_1.IEncryptionService, 'encryption');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lbmNyeXB0aW9uL2VsZWN0cm9uLXNhbmRib3gvZW5jcnlwdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsSUFBQSwyQ0FBZ0MsRUFBQyxzQ0FBa0IsRUFBRSxZQUFZLENBQUMsQ0FBQyJ9