/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/base/common/event", "vs/platform/instantiation/common/instantiation"], function (require, exports, extHost_protocol_1, event_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostStorage = exports.ExtHostStorage = void 0;
    class ExtHostStorage {
        constructor(mainContext, _logService) {
            this._logService = _logService;
            this._onDidChangeStorage = new event_1.Emitter();
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStorage);
        }
        registerExtensionStorageKeysToSync(extension, keys) {
            this._proxy.$registerExtensionStorageKeysToSync(extension, keys);
        }
        async initializeExtensionStorage(shared, key, defaultValue) {
            const value = await this._proxy.$initializeExtensionStorage(shared, key);
            let parsedValue;
            if (value) {
                parsedValue = this.safeParseValue(shared, key, value);
            }
            return parsedValue || defaultValue;
        }
        setValue(shared, key, value) {
            return this._proxy.$setValue(shared, key, value);
        }
        $acceptValue(shared, key, value) {
            const parsedValue = this.safeParseValue(shared, key, value);
            if (parsedValue) {
                this._onDidChangeStorage.fire({ shared, key, value: parsedValue });
            }
        }
        safeParseValue(shared, key, value) {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                // Do not fail this call but log it for diagnostics
                // https://github.com/microsoft/vscode/issues/132777
                this._logService.error(`[extHostStorage] unexpected error parsing storage contents (extensionId: ${key}, global: ${shared}): ${error}`);
            }
            return undefined;
        }
    }
    exports.ExtHostStorage = ExtHostStorage;
    exports.IExtHostStorage = (0, instantiation_1.createDecorator)('IExtHostStorage');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RTdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLGNBQWM7UUFTMUIsWUFDQyxXQUErQixFQUNkLFdBQXdCO1lBQXhCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBTHpCLHdCQUFtQixHQUFHLElBQUksZUFBTyxFQUF1QixDQUFDO1lBQ2pFLHVCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFNNUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsa0NBQWtDLENBQUMsU0FBa0MsRUFBRSxJQUFjO1lBQ3BGLElBQUksQ0FBQyxNQUFNLENBQUMsbUNBQW1DLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxLQUFLLENBQUMsMEJBQTBCLENBQUMsTUFBZSxFQUFFLEdBQVcsRUFBRSxZQUFxQjtZQUNuRixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsMkJBQTJCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXpFLElBQUksV0FBK0IsQ0FBQztZQUNwQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUVELE9BQU8sV0FBVyxJQUFJLFlBQVksQ0FBQztRQUNwQyxDQUFDO1FBRUQsUUFBUSxDQUFDLE1BQWUsRUFBRSxHQUFXLEVBQUUsS0FBYTtZQUNuRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUVELFlBQVksQ0FBQyxNQUFlLEVBQUUsR0FBVyxFQUFFLEtBQWE7WUFDdkQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzVELElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7UUFDRixDQUFDO1FBRU8sY0FBYyxDQUFDLE1BQWUsRUFBRSxHQUFXLEVBQUUsS0FBYTtZQUNqRSxJQUFJLENBQUM7Z0JBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFCLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixtREFBbUQ7Z0JBQ25ELG9EQUFvRDtnQkFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsNEVBQTRFLEdBQUcsYUFBYSxNQUFNLE1BQU0sS0FBSyxFQUFFLENBQUMsQ0FBQztZQUN6SSxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBckRELHdDQXFEQztJQUdZLFFBQUEsZUFBZSxHQUFHLElBQUEsK0JBQWUsRUFBa0IsaUJBQWlCLENBQUMsQ0FBQyJ9