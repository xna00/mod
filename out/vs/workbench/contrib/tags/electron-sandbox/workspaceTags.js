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
define(["require", "exports", "vs/base/browser/hash", "vs/base/common/errors", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/tags/common/workspaceTags", "vs/platform/diagnostics/common/diagnostics", "vs/platform/request/common/request", "vs/base/common/platform", "vs/platform/extensionManagement/common/configRemotes", "vs/platform/native/common/native", "vs/platform/product/common/productService"], function (require, exports, hash_1, errors_1, files_1, telemetry_1, workspace_1, textfiles_1, workspaceTags_1, diagnostics_1, request_1, platform_1, configRemotes_1, native_1, productService_1) {
    "use strict";
    var WorkspaceTags_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTags = void 0;
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    async function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return (0, workspaceTags_1.getHashedRemotesFromConfig)(text, stripEndingDotGit, remote => (0, hash_1.sha1Hex)(remote));
    }
    let WorkspaceTags = WorkspaceTags_1 = class WorkspaceTags {
        constructor(fileService, contextService, telemetryService, requestService, textFileService, workspaceTagsService, diagnosticsService, productService, nativeHostService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.requestService = requestService;
            this.textFileService = textFileService;
            this.workspaceTagsService = workspaceTagsService;
            this.diagnosticsService = diagnosticsService;
            this.productService = productService;
            this.nativeHostService = nativeHostService;
            if (this.telemetryService.telemetryLevel === 3 /* TelemetryLevel.USAGE */) {
                this.report();
            }
        }
        async report() {
            // Windows-only Edition Event
            this.reportWindowsEdition();
            // Workspace Tags
            this.workspaceTagsService.getTags()
                .then(tags => this.reportWorkspaceTags(tags), error => (0, errors_1.onUnexpectedError)(error));
            // Cloud Stats
            this.reportCloudStats();
            this.reportProxyStats();
            this.getWorkspaceInformation().then(stats => this.diagnosticsService.reportWorkspaceStats(stats));
        }
        async reportWindowsEdition() {
            if (!platform_1.isWindows) {
                return;
            }
            let value = await this.nativeHostService.windowsGetStringRegKey('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'EditionID');
            if (value === undefined) {
                value = 'Unknown';
            }
            this.telemetryService.publicLog2('windowsEdition', { edition: value });
        }
        async getWorkspaceInformation() {
            const workspace = this.contextService.getWorkspace();
            const state = this.contextService.getWorkbenchState();
            const telemetryId = await this.workspaceTagsService.getTelemetryWorkspaceId(workspace, state);
            return {
                id: workspace.id,
                telemetryId,
                rendererSessionId: this.telemetryService.sessionId,
                folders: workspace.folders,
                transient: workspace.transient,
                configuration: workspace.configuration
            };
        }
        reportWorkspaceTags(tags) {
            /* __GDPR__
                "workspce.tags" : {
                    "owner": "lramos15",
                    "${include}": [
                        "${WorkspaceTags}"
                    ]
                }
            */
            this.telemetryService.publicLog('workspce.tags', tags);
        }
        reportRemoteDomains(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
                return this.fileService.exists(uri).then(exists => {
                    if (!exists) {
                        return [];
                    }
                    return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => (0, configRemotes_1.getDomainsOfRemotes)(content.value, configRemotes_1.AllowedSecondLevelDomains), err => [] // ignore missing or binary file
                    );
                });
            })).then(domains => {
                const set = domains.reduce((set, list) => list.reduce((set, item) => set.add(item), set), new Set());
                const list = [];
                set.forEach(item => list.push(item));
                /* __GDPR__
                    "workspace.remotes" : {
                        "owner": "lramos15",
                        "domains" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('workspace.remotes', { domains: list.sort() });
            }, errors_1.onUnexpectedError);
        }
        reportRemotes(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                return this.workspaceTagsService.getHashedRemotesFromUri(workspaceUri, true);
            })).then(() => { }, errors_1.onUnexpectedError);
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "node" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureNode(workspaceUris, tags) {
            // TODO: should also work for `node_modules` folders several levels down
            const uris = workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                return workspaceUri.with({ path: `${path !== '/' ? path : ''}/node_modules` });
            });
            return this.fileService.resolveAll(uris.map(resource => ({ resource }))).then(results => {
                const names = [].concat(...results.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const referencesAzure = WorkspaceTags_1.searchArray(names, /azure/i);
                if (referencesAzure) {
                    tags['node'] = true;
                }
                return tags;
            }, err => {
                return tags;
            });
        }
        static searchArray(arr, regEx) {
            return arr.some(v => v.search(regEx) > -1) || undefined;
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "java" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureJava(workspaceUris, tags) {
            return Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/pom.xml` });
                return this.fileService.exists(uri).then(exists => {
                    if (!exists) {
                        return false;
                    }
                    return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => !!content.value.match(/azure/i), err => false);
                });
            })).then(javas => {
                if (javas.indexOf(true) !== -1) {
                    tags['java'] = true;
                }
                return tags;
            });
        }
        reportAzure(uris) {
            const tags = Object.create(null);
            this.reportAzureNode(uris, tags).then((tags) => {
                return this.reportAzureJava(uris, tags);
            }).then((tags) => {
                if (Object.keys(tags).length) {
                    /* __GDPR__
                        "workspace.azure" : {
                            "owner": "lramos15",
                            "${include}": [
                                "${AzureTags}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('workspace.azure', tags);
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        reportCloudStats() {
            const uris = this.contextService.getWorkspace().folders.map(folder => folder.uri);
            if (uris.length && this.fileService) {
                this.reportRemoteDomains(uris);
                this.reportRemotes(uris);
                this.reportAzure(uris);
            }
        }
        reportProxyStats() {
            const downloadUrl = this.productService.downloadUrl;
            if (!downloadUrl) {
                return;
            }
            this.requestService.resolveProxy(downloadUrl)
                .then(proxy => {
                let type = proxy ? String(proxy).trim().split(/\s+/, 1)[0] : 'EMPTY';
                if (['DIRECT', 'PROXY', 'HTTPS', 'SOCKS', 'EMPTY'].indexOf(type) === -1) {
                    type = 'UNKNOWN';
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
    };
    exports.WorkspaceTags = WorkspaceTags;
    exports.WorkspaceTags = WorkspaceTags = WorkspaceTags_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, request_1.IRequestService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, workspaceTags_1.IWorkspaceTagsService),
        __param(6, diagnostics_1.IDiagnosticsService),
        __param(7, productService_1.IProductService),
        __param(8, native_1.INativeHostService)
    ], WorkspaceTags);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVGFncy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFncy9lbGVjdHJvbi1zYW5kYm94L3dvcmtzcGFjZVRhZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtCaEcsZ0VBRUM7SUFGTSxLQUFLLFVBQVUsMEJBQTBCLENBQUMsSUFBWSxFQUFFLG9CQUE2QixLQUFLO1FBQ2hHLE9BQU8sSUFBQSwwQ0FBOEIsRUFBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLGNBQU8sRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7SUFFTSxJQUFNLGFBQWEscUJBQW5CLE1BQU0sYUFBYTtRQUV6QixZQUNnQyxXQUF5QixFQUNiLGNBQXdDLEVBQy9DLGdCQUFtQyxFQUNyQyxjQUErQixFQUM5QixlQUFpQyxFQUM1QixvQkFBMkMsRUFDN0Msa0JBQXVDLEVBQzNDLGNBQStCLEVBQzVCLGlCQUFxQztZQVIzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNiLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMvQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3JDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM5QixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDNUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM1QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBRTFFLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsaUNBQXlCLEVBQUUsQ0FBQztnQkFDbkUsSUFBSSxDQUFD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