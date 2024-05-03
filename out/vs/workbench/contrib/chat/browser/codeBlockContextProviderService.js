/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatCodeBlockContextProviderService = void 0;
    class ChatCodeBlockContextProviderService {
        constructor() {
            this._providers = new Map();
        }
        get providers() {
            return [...this._providers.values()];
        }
        registerProvider(provider, id) {
            this._providers.set(id, provider);
            return (0, lifecycle_1.toDisposable)(() => this._providers.delete(id));
        }
    }
    exports.ChatCodeBlockContextProviderService = ChatCodeBlockContextProviderService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUJsb2NrQ29udGV4dFByb3ZpZGVyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NvZGVCbG9ja0NvbnRleHRQcm92aWRlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHLE1BQWEsbUNBQW1DO1FBQWhEO1lBRWtCLGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBMkMsQ0FBQztRQVNsRixDQUFDO1FBUEEsSUFBSSxTQUFTO1lBQ1osT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxnQkFBZ0IsQ0FBQyxRQUF5QyxFQUFFLEVBQVU7WUFDckUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztLQUNEO0lBWEQsa0ZBV0MifQ==