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
define(["require", "exports", "vs/base/common/event", "vs/base/common/json", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/base/common/buffer", "vs/workbench/contrib/url/browser/trustedDomains", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, json_1, files_1, storage_1, buffer_1, trustedDomains_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TrustedDomainsFileSystemProvider = void 0;
    const TRUSTED_DOMAINS_SCHEMA = 'trustedDomains';
    const TRUSTED_DOMAINS_STAT = {
        type: files_1.FileType.File,
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0
    };
    const CONFIG_HELP_TEXT_PRE = `// Links matching one or more entries in the list below can be opened without link protection.
// The following examples show what entries can look like:
// - "https://microsoft.com": Matches this specific domain using https
// - "https://microsoft.com:8080": Matches this specific domain on this port using https
// - "https://microsoft.com:*": Matches this specific domain on any port using https
// - "https://microsoft.com/foo": Matches https://microsoft.com/foo and https://microsoft.com/foo/bar,
//   but not https://microsoft.com/foobar or https://microsoft.com/bar
// - "https://*.microsoft.com": Match all domains ending in "microsoft.com" using https
// - "microsoft.com": Match this specific domain using either http or https
// - "*.microsoft.com": Match all domains ending in "microsoft.com" using either http or https
// - "http://192.168.0.1: Matches this specific IP using http
// - "http://192.168.0.*: Matches all IP's with this prefix using http
// - "*": Match all domains using either http or https
//
`;
    const CONFIG_HELP_TEXT_AFTER = `//
// You can use the "Manage Trusted Domains" command to open this file.
// Save this file to apply the trusted domains rules.
`;
    const CONFIG_PLACEHOLDER_TEXT = `[
	// "https://microsoft.com"
]`;
    function computeTrustedDomainContent(defaultTrustedDomains, trustedDomains, userTrustedDomains, workspaceTrustedDomains, configuring) {
        let content = CONFIG_HELP_TEXT_PRE;
        if (defaultTrustedDomains.length > 0) {
            content += `// By default, VS Code trusts "localhost" as well as the following domains:\n`;
            defaultTrustedDomains.forEach(d => {
                content += `// - "${d}"\n`;
            });
        }
        else {
            content += `// By default, VS Code trusts "localhost".\n`;
        }
        if (userTrustedDomains.length) {
            content += `//\n// Additionally, the following domains are trusted based on your logged-in Accounts:\n`;
            userTrustedDomains.forEach(d => {
                content += `// - "${d}"\n`;
            });
        }
        if (workspaceTrustedDomains.length) {
            content += `//\n// Further, the following domains are trusted based on your workspace configuration:\n`;
            workspaceTrustedDomains.forEach(d => {
                content += `// - "${d}"\n`;
            });
        }
        content += CONFIG_HELP_TEXT_AFTER;
        content += configuring ? `\n// Currently configuring trust for ${configuring}\n` : '';
        if (trustedDomains.length === 0) {
            content += CONFIG_PLACEHOLDER_TEXT;
        }
        else {
            content += JSON.stringify(trustedDomains, null, 2);
        }
        return content;
    }
    let TrustedDomainsFileSystemProvider = class TrustedDomainsFileSystemProvider {
        static { this.ID = 'workbench.contrib.trustedDomainsFileSystemProvider'; }
        constructor(fileService, storageService, instantiationService) {
            this.fileService = fileService;
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            this.fileService.registerProvider(TRUSTED_DOMAINS_SCHEMA, this);
        }
        stat(resource) {
            return Promise.resolve(TRUSTED_DOMAINS_STAT);
        }
        async readFile(resource) {
            let trustedDomainsContent = this.storageService.get(trustedDomains_1.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            const configuring = resource.fragment;
            const { defaultTrustedDomains, trustedDomains, userDomains, workspaceDomains } = await this.instantiationService.invokeFunction(trustedDomains_1.readTrustedDomains);
            if (!trustedDomainsContent ||
                trustedDomainsContent.indexOf(CONFIG_HELP_TEXT_PRE) === -1 ||
                trustedDomainsContent.indexOf(CONFIG_HELP_TEXT_AFTER) === -1 ||
                trustedDomainsContent.indexOf(configuring ?? '') === -1 ||
                [...defaultTrustedDomains, ...trustedDomains, ...userDomains, ...workspaceDomains].some(d => !(0, types_1.assertIsDefined)(trustedDomainsContent).includes(d))) {
                trustedDomainsContent = computeTrustedDomainContent(defaultTrustedDomains, trustedDomains, userDomains, workspaceDomains, configuring);
            }
            const buffer = buffer_1.VSBuffer.fromString(trustedDomainsContent).buffer;
            return buffer;
        }
        writeFile(resource, content, opts) {
            try {
                const trustedDomainsContent = buffer_1.VSBuffer.wrap(content).toString();
                const trustedDomains = (0, json_1.parse)(trustedDomainsContent);
                this.storageService.store(trustedDomains_1.TRUSTED_DOMAINS_CONTENT_STORAGE_KEY, trustedDomainsContent, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                this.storageService.store(trustedDomains_1.TRUSTED_DOMAINS_STORAGE_KEY, JSON.stringify(trustedDomains) || '', -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            }
            catch (err) { }
            return Promise.resolve();
        }
        watch(resource, opts) {
            return {
                dispose() {
                    return;
                }
            };
        }
        mkdir(resource) {
            return Promise.resolve(undefined);
        }
        readdir(resource) {
            return Promise.resolve(undefined);
        }
        delete(resource, opts) {
            return Promise.resolve(undefined);
        }
        rename(from, to, opts) {
            return Promise.resolve(undefined);
        }
    };
    exports.TrustedDomainsFileSystemProvider = TrustedDomainsFileSystemProvider;
    exports.TrustedDomainsFileSystemProvider = TrustedDomainsFileSystemProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, storage_1.IStorageService),
        __param(2, instantiation_1.IInstantiationService)
    ], TrustedDomainsFileSystemProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJ1c3RlZERvbWFpbnNGaWxlU3lzdGVtUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VybC9icm93c2VyL3RydXN0ZWREb21haW5zRmlsZVN5c3RlbVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxNQUFNLHNCQUFzQixHQUFHLGdCQUFnQixDQUFDO0lBRWhELE1BQU0sb0JBQW9CLEdBQVU7UUFDbkMsSUFBSSxFQUFFLGdCQUFRLENBQUMsSUFBSTtRQUNuQixLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNqQixJQUFJLEVBQUUsQ0FBQztLQUNQLENBQUM7SUFFRixNQUFNLG9CQUFvQixHQUFHOzs7Ozs7Ozs7Ozs7OztDQWM1QixDQUFDO0lBRUYsTUFBTSxzQkFBc0IsR0FBRzs7O0NBRzlCLENBQUM7SUFFRixNQUFNLHVCQUF1QixHQUFHOztFQUU5QixDQUFDO0lBRUgsU0FBUywyQkFBMkIsQ0FBQyxxQkFBK0IsRUFBRSxjQUF3QixFQUFFLGtCQUE0QixFQUFFLHVCQUFpQyxFQUFFLFdBQW9CO1FBQ3BMLElBQUksT0FBTyxHQUFHLG9CQUFvQixDQUFDO1FBRW5DLElBQUkscUJBQXFCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sSUFBSSwrRUFBK0UsQ0FBQztZQUMzRixxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pDLE9BQU8sSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLElBQUksOENBQThDLENB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