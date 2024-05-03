/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KnownStorageProvider = exports.PasswordStoreCLIOption = exports.IEncryptionMainService = exports.IEncryptionService = void 0;
    exports.isKwallet = isKwallet;
    exports.isGnome = isGnome;
    exports.IEncryptionService = (0, instantiation_1.createDecorator)('encryptionService');
    exports.IEncryptionMainService = (0, instantiation_1.createDecorator)('encryptionMainService');
    // The values provided to the `password-store` command line switch.
    // Notice that they are not the same as the values returned by
    // `getSelectedStorageBackend` in the `safeStorage` API.
    var PasswordStoreCLIOption;
    (function (PasswordStoreCLIOption) {
        PasswordStoreCLIOption["kwallet"] = "kwallet";
        PasswordStoreCLIOption["kwallet5"] = "kwallet5";
        PasswordStoreCLIOption["gnomeLibsecret"] = "gnome-libsecret";
        PasswordStoreCLIOption["basic"] = "basic";
    })(PasswordStoreCLIOption || (exports.PasswordStoreCLIOption = PasswordStoreCLIOption = {}));
    // The values returned by `getSelectedStorageBackend` in the `safeStorage` API.
    var KnownStorageProvider;
    (function (KnownStorageProvider) {
        KnownStorageProvider["unknown"] = "unknown";
        KnownStorageProvider["basicText"] = "basic_text";
        // Linux
        KnownStorageProvider["gnomeAny"] = "gnome_any";
        KnownStorageProvider["gnomeLibsecret"] = "gnome_libsecret";
        KnownStorageProvider["gnomeKeyring"] = "gnome_keyring";
        KnownStorageProvider["kwallet"] = "kwallet";
        KnownStorageProvider["kwallet5"] = "kwallet5";
        KnownStorageProvider["kwallet6"] = "kwallet6";
        // The rest of these are not returned by `getSelectedStorageBackend`
        // but these were added for platform completeness.
        // Windows
        KnownStorageProvider["dplib"] = "dpapi";
        // macOS
        KnownStorageProvider["keychainAccess"] = "keychain_access";
    })(KnownStorageProvider || (exports.KnownStorageProvider = KnownStorageProvider = {}));
    function isKwallet(backend) {
        return backend === "kwallet" /* KnownStorageProvider.kwallet */
            || backend === "kwallet5" /* KnownStorageProvider.kwallet5 */
            || backend === "kwallet6" /* KnownStorageProvider.kwallet6 */;
    }
    function isGnome(backend) {
        return backend === "gnome_any" /* KnownStorageProvider.gnomeAny */
            || backend === "gnome_libsecret" /* KnownStorageProvider.gnomeLibsecret */
            || backend === "gnome_keyring" /* KnownStorageProvider.gnomeKeyring */;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2VuY3J5cHRpb24vY29tbW9uL2VuY3J5cHRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlEaEcsOEJBSUM7SUFFRCwwQkFJQztJQS9EWSxRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsbUJBQW1CLENBQUMsQ0FBQztJQU05RSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQWN2RyxtRUFBbUU7SUFDbkUsOERBQThEO0lBQzlELHdEQUF3RDtJQUN4RCxJQUFrQixzQkFLakI7SUFMRCxXQUFrQixzQkFBc0I7UUFDdkMsNkNBQW1CLENBQUE7UUFDbkIsK0NBQXFCLENBQUE7UUFDckIsNERBQWtDLENBQUE7UUFDbEMseUNBQWUsQ0FBQTtJQUNoQixDQUFDLEVBTGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBS3ZDO0lBRUQsK0VBQStFO0lBQy9FLElBQWtCLG9CQW9CakI7SUFwQkQsV0FBa0Isb0JBQW9CO1FBQ3JDLDJDQUFtQixDQUFBO1FBQ25CLGdEQUF3QixDQUFBO1FBRXhCLFFBQVE7UUFDUiw4Q0FBc0IsQ0FBQTtRQUN0QiwwREFBa0MsQ0FBQTtRQUNsQyxzREFBOEIsQ0FBQTtRQUM5QiwyQ0FBbUIsQ0FBQTtRQUNuQiw2Q0FBcUIsQ0FBQTtRQUNyQiw2Q0FBcUIsQ0FBQTtRQUVyQixvRUFBb0U7UUFDcEUsa0RBQWtEO1FBRWxELFVBQVU7UUFDVix1Q0FBZSxDQUFBO1FBRWYsUUFBUTtRQUNSLDBEQUFrQyxDQUFBO0lBQ25DLENBQUMsRUFwQmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBb0JyQztJQUVELFNBQWdCLFNBQVMsQ0FBQyxPQUFlO1FBQ3hDLE9BQU8sT0FBTyxpREFBaUM7ZUFDM0MsT0FBTyxtREFBa0M7ZUFDekMsT0FBTyxtREFBa0MsQ0FBQztJQUMvQyxDQUFDO0lBRUQsU0FBZ0IsT0FBTyxDQUFDLE9BQWU7UUFDdEMsT0FBTyxPQUFPLG9EQUFrQztlQUM1QyxPQUFPLGdFQUF3QztlQUMvQyxPQUFPLDREQUFzQyxDQUFDO0lBQ25ELENBQUMifQ==