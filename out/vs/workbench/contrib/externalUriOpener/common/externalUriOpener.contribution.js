/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService"], function (require, exports, configurationRegistry_1, extensions_1, platform_1, configuration_1, externalUriOpenerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(externalUriOpenerService_1.IExternalUriOpenerService, externalUriOpenerService_1.ExternalUriOpenerService, 1 /* InstantiationType.Delayed */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(configuration_1.externalUriOpenersConfigurationNode);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlPcGVuZXIuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFVyaU9wZW5lci9jb21tb24vZXh0ZXJuYWxVcmlPcGVuZXIuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBUWhHLElBQUEsOEJBQWlCLEVBQUMsb0RBQXlCLEVBQUUsbURBQXdCLG9DQUE0QixDQUFDO0lBRWxHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUM7U0FDeEUscUJBQXFCLENBQUMsbURBQW1DLENBQUMsQ0FBQyJ9