/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/uri", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/dialogs/common/dialogs", "vs/base/common/network"], function (require, exports, uri_1, extHost_protocol_1, extHostCustomers_1, dialogs_1, network_1) {
    "use strict";
    var MainThreadDialogs_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDialogs = void 0;
    let MainThreadDialogs = MainThreadDialogs_1 = class MainThreadDialogs {
        constructor(context, _fileDialogService) {
            this._fileDialogService = _fileDialogService;
            //
        }
        dispose() {
            //
        }
        async $showOpenDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertOpenOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showOpenDialog(convertedOptions));
        }
        async $showSaveDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertSaveOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showSaveDialog(convertedOptions));
        }
        static _convertOpenOptions(options) {
            const result = {
                openLabel: options?.openLabel || undefined,
                canSelectFiles: options?.canSelectFiles || (!options?.canSelectFiles && !options?.canSelectFolders),
                canSelectFolders: options?.canSelectFolders,
                canSelectMany: options?.canSelectMany,
                defaultUri: options?.defaultUri ? uri_1.URI.revive(options.defaultUri) : undefined,
                title: options?.title || undefined,
                availableFileSystems: options?.allowUIResources ? [network_1.Schemas.vscodeRemote, network_1.Schemas.file] : []
            };
            if (options?.filters) {
                result.filters = [];
                for (const [key, value] of Object.entries(options.filters)) {
                    result.filters.push({ name: key, extensions: value });
                }
            }
            return result;
        }
        static _convertSaveOptions(options) {
            const result = {
                defaultUri: options?.defaultUri ? uri_1.URI.revive(options.defaultUri) : undefined,
                saveLabel: options?.saveLabel || undefined,
                title: options?.title || undefined
            };
            if (options?.filters) {
                result.filters = [];
                for (const [key, value] of Object.entries(options.filters)) {
                    result.filters.push({ name: key, extensions: value });
                }
            }
            return result;
        }
    };
    exports.MainThreadDialogs = MainThreadDialogs;
    exports.MainThreadDialogs = MainThreadDialogs = MainThreadDialogs_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDialogs),
        __param(1, dialogs_1.IFileDialogService)
    ], MainThreadDialogs);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERpYWxvZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRGlhbG9ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0saUJBQWlCLHlCQUF2QixNQUFNLGlCQUFpQjtRQUU3QixZQUNDLE9BQXdCLEVBQ2Esa0JBQXNDO1lBQXRDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFFM0UsRUFBRTtRQUNILENBQUM7UUFFRCxPQUFPO1lBQ04sRUFBRTtRQUNILENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLE9BQXFDO1lBQzFELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQWlCLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNsQyxnQkFBZ0IsQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDL0UsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFxQztZQUMxRCxNQUFNLGdCQUFnQixHQUFHLG1CQUFpQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEMsZ0JBQWdCLENBQUMsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQy9F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