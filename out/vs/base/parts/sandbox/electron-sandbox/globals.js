/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.context = exports.process = exports.webFrame = exports.ipcMessagePort = exports.ipcRenderer = void 0;
    const vscodeGlobal = globalThis.vscode;
    exports.ipcRenderer = vscodeGlobal.ipcRenderer;
    exports.ipcMessagePort = vscodeGlobal.ipcMessagePort;
    exports.webFrame = vscodeGlobal.webFrame;
    exports.process = vscodeGlobal.process;
    exports.context = vscodeGlobal.context;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9zYW5kYm94L2VsZWN0cm9uLXNhbmRib3gvZ2xvYmFscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrSGhHLE1BQU0sWUFBWSxHQUFJLFVBQWtCLENBQUMsTUFBTSxDQUFDO0lBQ25DLFFBQUEsV0FBVyxHQUFnQixZQUFZLENBQUMsV0FBVyxDQUFDO0lBQ3BELFFBQUEsY0FBYyxHQUFtQixZQUFZLENBQUMsY0FBYyxDQUFDO0lBQzdELFFBQUEsUUFBUSxHQUFhLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDM0MsUUFBQSxPQUFPLEdBQXdCLFlBQVksQ0FBQyxPQUFPLENBQUM7SUFDcEQsUUFBQSxPQUFPLEdBQW9CLFlBQVksQ0FBQyxPQUFPLENBQUMifQ==