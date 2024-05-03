/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/integrity/common/integrity", "vs/platform/instantiation/common/extensions"], function (require, exports, integrity_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IntegrityService = void 0;
    class IntegrityService {
        async isPure() {
            return { isPure: true, proof: [] };
        }
    }
    exports.IntegrityService = IntegrityService;
    (0, extensions_1.registerSingleton)(integrity_1.IIntegrityService, IntegrityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWdyaXR5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ludGVncml0eS9icm93c2VyL2ludGVncml0eVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsZ0JBQWdCO1FBSTVCLEtBQUssQ0FBQyxNQUFNO1lBQ1gsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3BDLENBQUM7S0FDRDtJQVBELDRDQU9DO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyw2QkFBaUIsRUFBRSxnQkFBZ0Isb0NBQTRCLENBQUMifQ==