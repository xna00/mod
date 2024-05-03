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
define(["require", "exports", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, configuration_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IgnoredExtensionsManagementService = exports.IIgnoredExtensionsManagementService = void 0;
    exports.IIgnoredExtensionsManagementService = (0, instantiation_1.createDecorator)('IIgnoredExtensionsManagementService');
    let IgnoredExtensionsManagementService = class IgnoredExtensionsManagementService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        hasToNeverSyncExtension(extensionId) {
            const configuredIgnoredExtensions = this.getConfiguredIgnoredExtensions();
            return configuredIgnoredExtensions.includes(extensionId.toLowerCase());
        }
        hasToAlwaysSyncExtension(extensionId) {
            const configuredIgnoredExtensions = this.getConfiguredIgnoredExtensions();
            return configuredIgnoredExtensions.includes(`-${extensionId.toLowerCase()}`);
        }
        updateIgnoredExtensions(ignoredExtensionId, ignore) {
            // first remove the extension completely from ignored extensions
            let currentValue = [...this.configurationService.getValue('settingsSync.ignoredExtensions')].map(id => id.toLowerCase());
            currentValue = currentValue.filter(v => v !== ignoredExtensionId && v !== `-${ignoredExtensionId}`);
            // Add only if ignored
            if (ignore) {
                currentValue.push(ignoredExtensionId.toLowerCase());
            }
            return this.configurationService.updateValue('settingsSync.ignoredExtensions', currentValue.length ? currentValue : undefined, 2 /* ConfigurationTarget.USER */);
        }
        updateSynchronizedExtensions(extensionId, sync) {
            // first remove the extension completely from ignored extensions
            let currentValue = [...this.configurationService.getValue('settingsSync.ignoredExtensions')].map(id => id.toLowerCase());
            currentValue = currentValue.filter(v => v !== extensionId && v !== `-${extensionId}`);
            // Add only if synced
            if (sync) {
                currentValue.push(`-${extensionId.toLowerCase()}`);
            }
            return this.configurationService.updateValue('settingsSync.ignoredExtensions', currentValue.length ? currentValue : undefined, 2 /* ConfigurationTarget.USER */);
        }
        getIgnoredExtensions(installed) {
            const defaultIgnoredExtensions = installed.filter(i => i.isMachineScoped).map(i => i.identifier.id.toLowerCase());
            const value = this.getConfiguredIgnoredExtensions().map(id => id.toLowerCase());
            const added = [], removed = [];
            if (Array.isArray(value)) {
                for (const key of value) {
                    if (key.startsWith('-')) {
                        removed.push(key.substring(1));
                    }
                    else {
                        added.push(key);
                    }
                }
            }
            return (0, arrays_1.distinct)([...defaultIgnoredExtensions, ...added,].filter(setting => !removed.includes(setting)));
        }
        getConfiguredIgnoredExtensions() {
            let userValue = this.configurationService.inspect('settingsSync.ignoredExtensions').userValue;
            if (userValue !== undefined) {
                return userValue;
            }
            userValue = this.configurationService.inspect('sync.ignoredExtensions').userValue;
            if (userValue !== undefined) {
                return userValue;
            }
            return (this.configurationService.getValue('settingsSync.ignoredExtensions') || []).map(id => id.toLowerCase());
        }
    };
    exports.IgnoredExtensionsManagementService = IgnoredExtensionsManagementService;
    exports.IgnoredExtensionsManagementService = IgnoredExtensionsManagementService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], IgnoredExtensionsManagementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWdub3JlZEV4dGVuc2lvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vaWdub3JlZEV4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT25GLFFBQUEsbUNBQW1DLEdBQUcsSUFBQSwrQkFBZSxFQUFzQyxxQ0FBcUMsQ0FBQyxDQUFDO0lBWXhJLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQWtDO1FBSTlDLFlBQ3lDLG9CQUEyQztZQUEzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBRXBGLENBQUM7UUFFRCx1QkFBdUIsQ0FBQyxXQUFtQjtZQUMxQyxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQzFFLE9BQU8sMkJBQTJCLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxXQUFtQjtZQUMzQyxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQzFFLE9BQU8sMkJBQTJCLENBQUMsUUFBUSxDQUFDLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsdUJBQXVCLENBQUMsa0JBQTBCLEVBQUUsTUFBZTtZQUNsRSxnRUFBZ0U7WUFDaEUsSUFBSSxZQUFZLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVcsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ25JLFlBQVksR0FBRyxZ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