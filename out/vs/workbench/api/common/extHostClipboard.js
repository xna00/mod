/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol"], function (require, exports, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostClipboard = void 0;
    class ExtHostClipboard {
        constructor(mainContext) {
            const proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadClipboard);
            this.value = Object.freeze({
                readText() {
                    return proxy.$readText();
                },
                writeText(value) {
                    return proxy.$writeText(value);
                }
            });
        }
    }
    exports.ExtHostClipboard = ExtHostClipboard;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENsaXBib2FyZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdENsaXBib2FyZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsTUFBYSxnQkFBZ0I7UUFJNUIsWUFBWSxXQUF5QjtZQUNwQyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLFFBQVE7b0JBQ1AsT0FBTyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzFCLENBQUM7Z0JBQ0QsU0FBUyxDQUFDLEtBQWE7b0JBQ3RCLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEMsQ0FBQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQWZELDRDQWVDIn0=