/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/buffer", "vs/base/common/async"], function (require, exports, resources_1, buffer_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationCache = void 0;
    class ConfigurationCache {
        constructor(donotCacheResourcesWithSchemes, environmentService, fileService) {
            this.donotCacheResourcesWithSchemes = donotCacheResourcesWithSchemes;
            this.fileService = fileService;
            this.cachedConfigurations = new Map();
            this.cacheHome = environmentService.cacheHome;
        }
        needsCaching(resource) {
            // Cache all non native resources
            return !this.donotCacheResourcesWithSchemes.includes(resource.scheme);
        }
        read(key) {
            return this.getCachedConfiguration(key).read();
        }
        write(key, content) {
            return this.getCachedConfiguration(key).save(content);
        }
        remove(key) {
            return this.getCachedConfiguration(key).remove();
        }
        getCachedConfiguration({ type, key }) {
            const k = `${type}:${key}`;
            let cachedConfiguration = this.cachedConfigurations.get(k);
            if (!cachedConfiguration) {
                cachedConfiguration = new CachedConfiguration({ type, key }, this.cacheHome, this.fileService);
                this.cachedConfigurations.set(k, cachedConfiguration);
            }
            return cachedConfiguration;
        }
    }
    exports.ConfigurationCache = ConfigurationCache;
    class CachedConfiguration {
        constructor({ type, key }, cacheHome, fileService) {
            this.fileService = fileService;
            this.cachedConfigurationFolderResource = (0, resources_1.joinPath)(cacheHome, 'CachedConfigurations', type, key);
            this.cachedConfigurationFileResource = (0, resources_1.joinPath)(this.cachedConfigurationFolderResource, type === 'workspaces' ? 'workspace.json' : 'configuration.json');
            this.queue = new async_1.Queue();
        }
        async read() {
            try {
                const content = await this.fileService.readFile(this.cachedConfigurationFileResource);
                return content.value.toString();
            }
            catch (e) {
                return '';
            }
        }
        async save(content) {
            const created = await this.createCachedFolder();
            if (created) {
                await this.queue.queue(async () => {
                    await this.fileService.writeFile(this.cachedConfigurationFileResource, buffer_1.VSBuffer.fromString(content));
                });
            }
        }
        async remove() {
            try {
                await this.queue.queue(() => this.fileService.del(this.cachedConfigurationFolderResource, { recursive: true, useTrash: false }));
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error;
                }
            }
        }
        async createCachedFolder() {
            if (await this.fileService.exists(this.cachedConfigurationFolderResource)) {
                return true;
            }
            try {
                await this.fileService.createFolder(this.cachedConfigurationFolderResource);
                return true;
            }
            catch (error) {
                return false;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkNhY2hlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvbi9jb21tb24vY29uZmlndXJhdGlvbkNhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLGtCQUFrQjtRQUs5QixZQUNrQiw4QkFBd0MsRUFDekQsa0JBQXVDLEVBQ3RCLFdBQXlCO1lBRnpCLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBVTtZQUV4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUwxQix5QkFBb0IsR0FBcUMsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFPaEgsSUFBSSxDQUFDLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7UUFDL0MsQ0FBQztRQUVELFlBQVksQ0FBQyxRQUFhO1lBQ3pCLGlDQUFpQztZQUNqQyxPQUFPLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELElBQUksQ0FBQyxHQUFxQjtZQUN6QixPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoRCxDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQXFCLEVBQUUsT0FBZTtZQUMzQyxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFxQjtZQUMzQixPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsRCxDQUFDO1FBRU8sc0JBQXNCLENBQUMsRUFBRSxJ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