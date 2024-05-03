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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/event", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/base/common/labels", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/glob", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/workbench/services/path/common/pathService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/base/common/arrays"], function (require, exports, nls_1, uri_1, lifecycle_1, path_1, event_1, contributions_1, platform_1, environmentService_1, workspace_1, resources_1, labels_1, label_1, extensionsRegistry_1, glob_1, lifecycle_2, extensions_1, pathService_1, extensions_2, platform_2, remoteAgentService_1, network_1, storage_1, memento_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelService = void 0;
    const resourceLabelFormattersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'resourceLabelFormatters',
        jsonSchema: {
            description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters', 'Contributes resource label formatting rules.'),
            type: 'array',
            items: {
                type: 'object',
                required: ['scheme', 'formatting'],
                properties: {
                    scheme: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.scheme', 'URI scheme on which to match the formatter on. For example "file". Simple glob patterns are supported.'),
                    },
                    authority: {
                        type: 'string',
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.authority', 'URI authority on which to match the formatter on. Simple glob patterns are supported.'),
                    },
                    formatting: {
                        description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting', "Rules for formatting uri resource labels."),
                        type: 'object',
                        properties: {
                            label: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.label', "Label rules to display. For example: myLabel:/${path}. ${path}, ${scheme}, ${authority} and ${authoritySuffix} are supported as variables.")
                            },
                            separator: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.separator', "Separator to be used in the uri label display. '/' or '\' as an example.")
                            },
                            stripPathStartingSeparator: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.stripPathStartingSeparator', "Controls whether `${path}` substitutions should have starting separator characters stripped.")
                            },
                            tildify: {
                                type: 'boolean',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.tildify', "Controls if the start of the uri label should be tildified when possible.")
                            },
                            workspaceSuffix: {
                                type: 'string',
                                description: (0, nls_1.localize)('vscode.extension.contributes.resourceLabelFormatters.formatting.workspaceSuffix', "Suffix appended to the workspace label.")
                            }
                        }
                    }
                }
            }
        }
    });
    const sepRegexp = /\//g;
    const labelMatchingRegexp = /\$\{(scheme|authoritySuffix|authority|path|(query)\.(.+?))\}/g;
    function hasDriveLetterIgnorePlatform(path) {
        return !!(path && path[2] === ':');
    }
    let ResourceLabelFormattersHandler = class ResourceLabelFormattersHandler {
        constructor(labelService) {
            this.formattersDisposables = new Map();
            resourceLabelFormattersExtPoint.setHandler((extensions, delta) => {
                for (const added of delta.added) {
                    for (const untrustedFormatter of added.value) {
                        // We cannot trust that the formatter as it comes from an extension
                        // adheres to our interface, so for the required properties we fill
                        // in some defaults if missing.
                        const formatter = { ...untrustedFormatter };
                        if (typeof formatter.formatting.label !== 'string') {
                            formatter.formatting.label = '${authority}${path}';
                        }
                        if (typeof formatter.formatting.separator !== `string`) {
                            formatter.formatting.separator = path_1.sep;
                        }
                        if (!(0, extensions_2.isProposedApiEnabled)(added.description, 'contribLabelFormatterWorkspaceTooltip') && formatter.formatting.workspaceTooltip) {
                            formatter.formatting.workspaceTooltip = undefined; // workspaceTooltip is only proposed
                        }
                        this.formattersDisposables.set(formatter, labelService.registerFormatter(formatter));
                    }
                }
                for (const removed of delta.removed) {
                    for (const formatter of removed.value) {
                        (0, lifecycle_1.dispose)(this.formattersDisposables.get(formatter));
                    }
                }
            });
        }
    };
    ResourceLabelFormattersHandler = __decorate([
        __param(0, label_1.ILabelService)
    ], ResourceLabelFormattersHandler);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ResourceLabelFormattersHandler, 3 /* LifecyclePhase.Restored */);
    const FORMATTER_CACHE_SIZE = 50;
    let LabelService = class LabelService extends lifecycle_1.Disposable {
        constructor(environmentService, contextService, pathService, remoteAgentService, storageService, lifecycleService) {
            super();
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.remoteAgentService = remoteAgentService;
            this._onDidChangeFormatters = this._register(new event_1.Emitter({ leakWarningThreshold: 400 }));
            this.onDidChangeFormatters = this._onDidChangeFormatters.event;
            // Find some meaningful defaults until the remote environment
            // is resolved, by taking the current OS we are running in
            // and by taking the local `userHome` if we run on a local
            // file scheme.
            this.os = platform_2.OS;
            this.userHome = pathService.defaultUriScheme === network_1.Schemas.file ? this.pathService.userHome({ preferLocal: true }) : undefined;
            const memento = this.storedFormattersMemento = new memento_1.Memento('cachedResourceLabelFormatters2', storageService);
            this.storedFormatters = memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.formatters = this.storedFormatters?.formatters?.slice() || [];
            // Remote environment is potentially long running
            this.resolveRemoteEnvironment();
        }
        async resolveRemoteEnvironment() {
            // OS
            const env = await this.remoteAgentService.getEnvironment();
            this.os = env?.os ?? platform_2.OS;
            // User home
            this.userHome = await this.pathService.userHome();
        }
        findFormatting(resource) {
            let bestResult;
            for (const formatter of this.formatters) {
                if (formatter.scheme === resource.scheme) {
                    if (!formatter.authority && (!bestResult || formatter.priority)) {
                        bestResult = formatter;
                        continue;
                    }
                    if (!formatter.authority) {
                        continue;
                    }
                    if ((0, glob_1.match)(formatter.authority.toLowerCase(), resource.authority.toLowerCase()) &&
                        (!bestResult ||
                            !bestResult.authority ||
                            formatter.authority.length > bestResult.authority.length ||
                            ((formatter.authority.length === bestResult.authority.length) && formatter.priority))) {
                        bestResult = formatter;
                    }
                }
            }
            return bestResult ? bestResult.formatting : undefined;
        }
        getUriLabel(resource, options = {}) {
            let formatting = this.findFormatting(resource);
            if (formatting && options.separator) {
                // mixin separator if defined from the outside
                formatting = { ...formatting, separator: options.separator };
            }
            const label = this.doGetUriLabel(resource, formatting, options);
            // Without formatting we still need to support the separator
            // as provided in options (https://github.com/microsoft/vscode/issues/130019)
            if (!formatting && options.separator) {
                return label.replace(sepRegexp, options.separator);
            }
            return label;
        }
        doGetUriLabel(resource, formatting, options = {}) {
            if (!formatting) {
                return (0, labels_1.getPathLabel)(resource, {
                    os: this.os,
                    tildify: this.userHome ? { userHome: this.userHome } : undefined,
                    relative: options.relative ? {
                        noPrefix: options.noPrefix,
                        getWorkspace: () => this.contextService.getWorkspace(),
                        getWorkspaceFolder: resource => this.contextService.getWorkspaceFolder(resource)
                    } : undefined
                });
            }
            // Relative label
            if (options.relative && this.contextService) {
                let folder = this.contextService.getWorkspaceFolder(resource);
                if (!folder) {
                    // It is possible that the resource we want to resolve the
                    // workspace folder for is not using the same scheme as
                    // the folders in the workspace, so we help by trying again
                    // to resolve a workspace folder by trying again with a
                    // scheme that is workspace contained.
                    const workspace = this.contextService.getWorkspace();
                    const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
                    if (firstFolder && resource.scheme !== firstFolder.uri.scheme && resource.path.startsWith(path_1.posix.sep)) {
                        folder = this.contextService.getWorkspaceFolder(firstFolder.uri.with({ path: resource.path }));
                    }
                }
                if (folder) {
                    const folderLabel = this.formatUri(folder.uri, formatting, options.noPrefix);
                    let relativeLabel = this.formatUri(resource, formatting, options.noPrefix);
                    let overlap = 0;
                    while (relativeLabel[overlap] && relativeLabel[overlap] === folderLabel[overlap]) {
                        overlap++;
                    }
                    if (!relativeLabel[overlap] || relativeLabel[overlap] === formatting.separator) {
                        relativeLabel = relativeLabel.substring(1 + overlap);
                    }
                    else if (overlap === folderLabel.length && folder.uri.path === path_1.posix.sep) {
                        relativeLabel = relativeLabel.substring(overlap);
                    }
                    // always show root basename if there are multiple folders
                    const hasMultipleRoots = this.contextService.getWorkspace().folders.length > 1;
                    if (hasMultipleRoots && !options.noPrefix) {
                        const rootName = folder?.name ?? (0, resources_1.basenameOrAuthority)(folder.uri);
                        relativeLabel = relativeLabel ? `${rootName} • ${relativeLabel}` : rootName;
                    }
                    return relativeLabel;
                }
            }
            // Absolute label
            return this.formatUri(resource, formatting, options.noPrefix);
        }
        getUriBasenameLabel(resource) {
            const formatting = this.findFormatting(resource);
            const label = this.doGetUriLabel(resource, formatting);
            let pathLib;
            if (formatting?.separator === path_1.win32.sep) {
                pathLib = path_1.win32;
            }
            else if (formatting?.separator === path_1.posix.sep) {
                pathLib = path_1.posix;
            }
            else {
                pathLib = (this.os === 1 /* OperatingSystem.Windows */) ? path_1.win32 : path_1.posix;
            }
            return pathLib.basename(label);
        }
        getWorkspaceLabel(workspace, options) {
            if ((0, workspace_1.isWorkspace)(workspace)) {
                const identifier = (0, workspace_1.toWorkspaceIdentifier)(workspace);
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier) || (0, workspace_1.isWorkspaceIdentifier)(identifier)) {
                    return this.getWorkspaceLabel(identifier, options);
                }
                return '';
            }
            // Workspace: Single Folder (as URI)
            if (uri_1.URI.isUri(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace, options);
            }
            // Workspace: Single Folder (as workspace identifier)
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                return this.doGetSingleFolderWorkspaceLabel(workspace.uri, options);
            }
            // Workspace: Multi Root
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                return this.doGetWorkspaceLabel(workspace.configPath, options);
            }
            return '';
        }
        doGetWorkspaceLabel(workspaceUri, options) {
            // Workspace: Untitled
            if ((0, workspace_1.isUntitledWorkspace)(workspaceUri, this.environmentService)) {
                return (0, nls_1.localize)('untitledWorkspace', "Untitled (Workspace)");
            }
            // Workspace: Temporary
            if ((0, workspace_1.isTemporaryWorkspace)(workspaceUri)) {
                return (0, nls_1.localize)('temporaryWorkspace', "Workspace");
            }
            // Workspace: Saved
            let filename = (0, resources_1.basename)(workspaceUri);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            let label;
            switch (options?.verbose) {
                case 0 /* Verbosity.SHORT */:
                    label = filename; // skip suffix for short label
                    break;
                case 2 /* Verbosity.LONG */:
                    label = (0, nls_1.localize)('workspaceNameVerbose', "{0} (Workspace)", this.getUriLabel((0, resources_1.joinPath)((0, resources_1.dirname)(workspaceUri), filename)));
                    break;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    label = (0, nls_1.localize)('workspaceName', "{0} (Workspace)", filename);
                    break;
            }
            if (options?.verbose === 0 /* Verbosity.SHORT */) {
                return label; // skip suffix for short label
            }
            return this.appendWorkspaceSuffix(label, workspaceUri);
        }
        doGetSingleFolderWorkspaceLabel(folderUri, options) {
            let label;
            switch (options?.verbose) {
                case 2 /* Verbosity.LONG */:
                    label = this.getUriLabel(folderUri);
                    break;
                case 0 /* Verbosity.SHORT */:
                case 1 /* Verbosity.MEDIUM */:
                default:
                    label = (0, resources_1.basename)(folderUri) || path_1.posix.sep;
                    break;
            }
            if (options?.verbose === 0 /* Verbosity.SHORT */) {
                return label; // skip suffix for short label
            }
            return this.appendWorkspaceSuffix(label, folderUri);
        }
        getSeparator(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.separator || path_1.posix.sep;
        }
        getHostLabel(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.workspaceSuffix || authority || '';
        }
        getHostTooltip(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter?.workspaceTooltip;
        }
        registerCachedFormatter(formatter) {
            const list = this.storedFormatters.formatters ??= [];
            let replace = list.findIndex(f => f.scheme === formatter.scheme && f.authority === formatter.authority);
            if (replace === -1 && list.length >= FORMATTER_CACHE_SIZE) {
                replace = FORMATTER_CACHE_SIZE - 1; // at max capacity, replace the last element
            }
            if (replace === -1) {
                list.unshift(formatter);
            }
            else {
                for (let i = replace; i > 0; i--) {
                    list[i] = list[i - 1];
                }
                list[0] = formatter;
            }
            this.storedFormattersMemento.saveMemento();
            return this.registerFormatter(formatter);
        }
        registerFormatter(formatter) {
            this.formatters.push(formatter);
            this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
            return {
                dispose: () => {
                    this.formatters = this.formatters.filter(f => f !== formatter);
                    this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
                }
            };
        }
        formatUri(resource, formatting, forceNoTildify) {
            let label = formatting.label.replace(labelMatchingRegexp, (match, token, qsToken, qsValue) => {
                switch (token) {
                    case 'scheme': return resource.scheme;
                    case 'authority': return resource.authority;
                    case 'authoritySuffix': {
                        const i = resource.authority.indexOf('+');
                        return i === -1 ? resource.authority : resource.authority.slice(i + 1);
                    }
                    case 'path':
                        return formatting.stripPathStartingSeparator
                            ? resource.path.slice(resource.path[0] === formatting.separator ? 1 : 0)
                            : resource.path;
                    default: {
                        if (qsToken === 'query') {
                            const { query } = resource;
                            if (query && query[0] === '{' && query[query.length - 1] === '}') {
                                try {
                                    return JSON.parse(query)[qsValue] || '';
                                }
                                catch { }
                            }
                        }
                        return '';
                    }
                }
            });
            // convert \c:\something => C:\something
            if (formatting.normalizeDriveLetter && hasDriveLetterIgnorePlatform(label)) {
                label = label.charAt(1).toUpperCase() + label.substr(2);
            }
            if (formatting.tildify && !forceNoTildify) {
                if (this.userHome) {
                    label = (0, labels_1.tildify)(label, this.userHome.fsPath, this.os);
                }
            }
            if (formatting.authorityPrefix && resource.authority) {
                label = formatting.authorityPrefix + label;
            }
            return label.replace(sepRegexp, formatting.separator);
        }
        appendWorkspaceSuffix(label, uri) {
            const formatting = this.findFormatting(uri);
            const suffix = formatting && (typeof formatting.workspaceSuffix === 'string') ? formatting.workspaceSuffix : undefined;
            return suffix ? `${label} [${suffix}]` : label;
        }
    };
    exports.LabelService = LabelService;
    exports.LabelService = LabelService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, pathService_1.IPathService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, storage_1.IStorageService),
        __param(5, lifecycle_2.ILifecycleService)
    ], LabelService);
    (0, extensions_1.registerSingleton)(label_1.ILabelService, LabelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFiZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGFiZWwvY29tbW9uL2xhYmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLE1BQU0sK0JBQStCLEdBQUcsdUNBQWtCLENBQUMsc0JBQXNCLENBQTJCO1FBQzNHLGNBQWMsRUFBRSx5QkFBeUI7UUFDekMsVUFBVSxFQUFFO1lBQ1gsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLHNEQUFzRCxFQUFFLDhDQUE4QyxDQUFDO1lBQzdILElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFO2dCQUNOLElBQUksRUFBRSxRQUFRO2dCQUNkLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUM7Z0JBQ2xDLFVBQVUsRUFBRTtvQkFDWCxNQUFNLEVBQUU7d0JBQ1AsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZEQUE2RCxFQUFFLHdHQUF3RyxDQUFDO3FCQUM5TDtvQkFDRCxTQUFTLEVBQUU7d0JBQ1YsSUFBSSxFQUFFLFFBQVE7d0JBQ2QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGdFQUFnRSxFQUFFLHVGQUF1RixDQUFDO3FCQUNoTDtvQkFDRCxVQUFVLEVBQUU7d0JBQ1gsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLGlFQUFpRSxFQUFFLDJDQUEyQyxDQUFDO3dCQUNySSxJQUFJLEVBQUUsUUFBUTt3QkFDZCxVQUFVLEVBQUU7NEJBQ1gsS0FBSyxFQUFFO2dDQUNOLElBQUksRUFBRSxRQUFRO2dDQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyw0REFBNEQsRUFBRSw0SUFBNEksQ0FBQzs2QkFDak87NEJBQ0QsU0FBUyxF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