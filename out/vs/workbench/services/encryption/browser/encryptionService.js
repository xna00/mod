/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/encryption/common/encryptionService", "vs/platform/instantiation/common/extensions"], function (require, exports, encryptionService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptionService = void 0;
    class EncryptionService {
        encrypt(value) {
            return Promise.resolve(value);
        }
        decrypt(value) {
            return Promise.resolve(value);
        }
        isEncryptionAvailable() {
            return Promise.resolve(false);
        }
        getKeyStorageProvider() {
            return Promise.resolve("basic_text" /* KnownStorageProvider.basicText */);
        }
        setUsePlainTextEncryption() {
            return Promise.resolve(undefined);
        }
    }
    exports.EncryptionService = EncryptionService;
    (0, extensions_1.registerSingleton)(encryptionService_1.IEncryptionService, EncryptionService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9lbmNyeXB0aW9uL2Jyb3dzZXIvZW5jcnlwdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsaUJBQWlCO1FBSTdCLE9BQU8sQ0FBQyxLQUFhO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsT0FBTyxDQUFDLEtBQWE7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxxQkFBcUI7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxtREFBZ0MsQ0FBQztRQUN4RCxDQUFDO1FBRUQseUJBQXlCO1lBQ3hCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0Q7SUF2QkQsOENBdUJDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxzQ0FBa0IsRUFBRSxpQkFBaUIsb0NBQTRCLENBQUMifQ==