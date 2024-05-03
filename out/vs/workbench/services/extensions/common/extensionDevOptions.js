/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseExtensionDevOptions = parseExtensionDevOptions;
    function parseExtensionDevOptions(environmentService) {
        // handle extension host lifecycle a bit special when we know we are developing an extension that runs inside
        const isExtensionDevHost = environmentService.isExtensionDevelopment;
        let debugOk = true;
        const extDevLocs = environmentService.extensionDevelopmentLocationURI;
        if (extDevLocs) {
            for (const x of extDevLocs) {
                if (x.scheme !== network_1.Schemas.file) {
                    debugOk = false;
                }
            }
        }
        const isExtensionDevDebug = debugOk && typeof environmentService.debugExtensionHost.port === 'number';
        const isExtensionDevDebugBrk = debugOk && !!environmentService.debugExtensionHost.break;
        const isExtensionDevTestFromCli = isExtensionDevHost && !!environmentService.extensionTestsLocationURI && !environmentService.debugExtensionHost.debugId;
        return {
            isExtensionDevHost,
            isExtensionDevDebug,
            isExtensionDevDebugBrk,
            isExtensionDevTestFromCli
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRGV2T3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbkRldk9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsNERBdUJDO0lBdkJELFNBQWdCLHdCQUF3QixDQUFDLGtCQUF1QztRQUMvRSw2R0FBNkc7UUFDN0csTUFBTSxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQyxzQkFBc0IsQ0FBQztRQUVyRSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDbkIsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsK0JBQStCLENBQUM7UUFDdEUsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNoQixLQUFLLE1BQU0sQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDL0IsT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDakIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLElBQUksT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1FBQ3RHLE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7UUFDeEYsTUFBTSx5QkFBeUIsR0FBRyxrQkFBa0IsSUFBSSxDQUFDLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7UUFDekosT0FBTztZQUNOLGtCQUFrQjtZQUNsQixtQkFBbUI7WUFDbkIsc0JBQXNCO1lBQ3RCLHlCQUF5QjtTQUN6QixDQUFDO0lBQ0gsQ0FBQyJ9