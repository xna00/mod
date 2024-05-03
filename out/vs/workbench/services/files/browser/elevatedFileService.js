/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/files/common/elevatedFileService"], function (require, exports, extensions_1, elevatedFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserElevatedFileService = void 0;
    class BrowserElevatedFileService {
        isSupported(resource) {
            // Saving elevated is currently not supported in web for as
            // long as we have no generic support from the file service
            // (https://github.com/microsoft/vscode/issues/48659)
            return false;
        }
        async writeFileElevated(resource, value, options) {
            throw new Error('Unsupported');
        }
    }
    exports.BrowserElevatedFileService = BrowserElevatedFileService;
    (0, extensions_1.registerSingleton)(elevatedFileService_1.IElevatedFileService, BrowserElevatedFileService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxldmF0ZWRGaWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ZpbGVzL2Jyb3dzZXIvZWxldmF0ZWRGaWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSwwQkFBMEI7UUFJdEMsV0FBVyxDQUFDLFFBQWE7WUFDeEIsMkRBQTJEO1lBQzNELDJEQUEyRDtZQUMzRCxxREFBcUQ7WUFDckQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQWEsRUFBRSxLQUEyRCxFQUFFLE9BQTJCO1lBQzlILE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUNEO0lBZEQsZ0VBY0M7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDBDQUFvQixFQUFFLDBCQUEwQixvQ0FBNEIsQ0FBQyJ9