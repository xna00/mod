/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, instantiation_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExternalTerminalService = void 0;
    exports.IExternalTerminalService = (0, instantiation_1.createDecorator)('externalTerminal');
    (0, services_1.registerMainProcessRemoteService)(exports.IExternalTerminalService, 'externalTerminal');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxUZXJtaW5hbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVybmFsVGVybWluYWwvZWxlY3Ryb24tc2FuZGJveC9leHRlcm5hbFRlcm1pbmFsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNbkYsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLGtCQUFrQixDQUFDLENBQUM7SUFNdEcsSUFBQSwyQ0FBZ0MsRUFBQyxnQ0FBd0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDIn0=