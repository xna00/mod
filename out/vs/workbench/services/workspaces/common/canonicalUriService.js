/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/workspace/common/canonicalUri"], function (require, exports, extensions_1, canonicalUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CanonicalUriService = void 0;
    class CanonicalUriService {
        constructor() {
            this._providers = new Map();
        }
        registerCanonicalUriProvider(provider) {
            this._providers.set(provider.scheme, provider);
            return {
                dispose: () => this._providers.delete(provider.scheme)
            };
        }
        async provideCanonicalUri(uri, targetScheme, token) {
            const provider = this._providers.get(uri.scheme);
            if (provider) {
                return provider.provideCanonicalUri(uri, targetScheme, token);
            }
            return undefined;
        }
    }
    exports.CanonicalUriService = CanonicalUriService;
    (0, extensions_1.registerSingleton)(canonicalUri_1.ICanonicalUriService, CanonicalUriService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2Fub25pY2FsVXJpU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvY29tbW9uL2Nhbm9uaWNhbFVyaVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEsbUJBQW1CO1FBQWhDO1lBR2tCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBaUMsQ0FBQztRQWdCeEUsQ0FBQztRQWRBLDRCQUE0QixDQUFDLFFBQStCO1lBQzNELElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0MsT0FBTztnQkFDTixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQzthQUN0RCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFRLEVBQUUsWUFBb0IsRUFBRSxLQUF3QjtZQUNqRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFuQkQsa0RBbUJDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxtQ0FBb0IsRUFBRSxtQkFBbUIsb0NBQTRCLENBQUMifQ==