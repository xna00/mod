/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/update/common/update", "vs/platform/ipc/electron-sandbox/services", "vs/platform/update/common/updateIpc"], function (require, exports, update_1, services_1, updateIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerMainProcessRemoteService)(update_1.IUpdateService, 'update', { channelClientCtor: updateIpc_1.UpdateChannelClient });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VwZGF0ZS9lbGVjdHJvbi1zYW5kYm94L3VwZGF0ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsSUFBQSwyQ0FBZ0MsRUFBQyx1QkFBYyxFQUFFLFFBQVEsRUFBRSxFQUFFLGlCQUFpQixFQUFFLCtCQUFtQixFQUFFLENBQUMsQ0FBQyJ9