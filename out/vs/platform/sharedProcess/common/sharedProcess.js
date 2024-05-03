/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessRawConnection = exports.SharedProcessChannelConnection = exports.SharedProcessLifecycle = void 0;
    exports.SharedProcessLifecycle = {
        exit: 'vscode:electron-main->shared-process=exit',
        ipcReady: 'vscode:shared-process->electron-main=ipc-ready',
        initDone: 'vscode:shared-process->electron-main=init-done'
    };
    exports.SharedProcessChannelConnection = {
        request: 'vscode:createSharedProcessChannelConnection',
        response: 'vscode:createSharedProcessChannelConnectionResult'
    };
    exports.SharedProcessRawConnection = {
        request: 'vscode:createSharedProcessRawConnection',
        response: 'vscode:createSharedProcessRawConnectionResult'
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc2hhcmVkUHJvY2Vzcy9jb21tb24vc2hhcmVkUHJvY2Vzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFbkYsUUFBQSxzQkFBc0IsR0FBRztRQUNyQyxJQUFJLEVBQUUsMkNBQTJDO1FBQ2pELFFBQVEsRUFBRSxnREFBZ0Q7UUFDMUQsUUFBUSxFQUFFLGdEQUFnRDtLQUMxRCxDQUFDO0lBRVcsUUFBQSw4QkFBOEIsR0FBRztRQUM3QyxPQUFPLEVBQUUsNkNBQTZDO1FBQ3RELFFBQVEsRUFBRSxtREFBbUQ7S0FDN0QsQ0FBQztJQUVXLFFBQUEsMEJBQTBCLEdBQUc7UUFDekMsT0FBTyxFQUFFLHlDQUF5QztRQUNsRCxRQUFRLEVBQUUsK0NBQStDO0tBQ3pELENBQUMifQ==