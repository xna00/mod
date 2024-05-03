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
define(["require", "exports", "vs/base/common/network", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/extensions/common/extensionRunningLocation"], function (require, exports, network_1, configuration_1, extensions_1, log_1, environmentService_1, extensionHostKind_1, extensionManifestPropertiesService_1, extensionRunningLocation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRunningLocationTracker = void 0;
    exports.filterExtensionDescriptions = filterExtensionDescriptions;
    exports.filterExtensionIdentifiers = filterExtensionIdentifiers;
    let ExtensionRunningLocationTracker = class ExtensionRunningLocationTracker {
        get maxLocalProcessAffinity() {
            return this._maxLocalProcessAffinity;
        }
        get maxLocalWebWorkerAffinity() {
            return this._maxLocalWebWorkerAffinity;
        }
        constructor(_registry, _extensionHostKindPicker, _environmentService, _configurationService, _logService, _extensionManifestPropertiesService) {
            this._registry = _registry;
            this._extensionHostKindPicker = _extensionHostKindPicker;
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            this._runningLocation = new extensions_1.ExtensionIdentifierMap();
            this._maxLocalProcessAffinity = 0;
            this._maxLocalWebWorkerAffinity = 0;
        }
        set(extensionId, runningLocation) {
            this._runningLocation.set(extensionId, runningLocation);
        }
        readExtensionKinds(extensionDescription) {
            if (extensionDescription.isUnderDevelopment && this._environmentService.extensionDevelopmentKind) {
                return this._environmentService.extensionDevelopmentKind;
            }
            return this._extensionManifestPropertiesService.getExtensionKind(extensionDescription);
        }
        getRunningLocation(extensionId) {
            return this._runningLocation.get(extensionId) || null;
        }
        filterByRunningLocation(extensions, desiredRunningLocation) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => desiredRunningLocation.equals(extRunningLocation));
        }
        filterByExtensionHostKind(extensions, desiredExtensionHostKind) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => extRunningLocation.kind === desiredExtensionHostKind);
        }
        filterByExtensionHostManager(extensions, extensionHostManager) {
            return filterExtensionDescriptions(extensions, this._runningLocation, extRunningLocation => extensionHostManager.representsRunningLocation(extRunningLocation));
        }
        _computeAffinity(inputExtensions, extensionHostKind, isInitialAllocation) {
            // Only analyze extensions that can execute
            const extensions = new extensions_1.ExtensionIdentifierMap();
            for (const extension of inputExtensions) {
                if (extension.main || extension.browser) {
                    extensions.set(extension.identifier, extension);
                }
            }
            // Also add existing extensions of the same kind that can execute
            for (const extension of this._registry.getAllExtensionDescriptions()) {
                if (extension.main || extension.browser) {
                    const runningLocation = this._runningLocation.get(extension.identifier);
                    if (runningLocation && runningLocation.kind === extensionHostKind) {
                        extensions.set(extension.identifier, extension);
                    }
                }
            }
            // Initially, each extension belongs to its own group
            const groups = new extensions_1.ExtensionIdentifierMap();
            let groupNumber = 0;
            for (const [_, extension] of extensions) {
                groups.set(extension.identifier, ++groupNumber);
            }
            const changeGroup = (from, to) => {
                for (const [key, group] of groups) {
                    if (group === from) {
                        groups.set(key, to);
                    }
                }
            };
            // We will group things together when there are dependencies
            for (const [_, extension] of extensions) {
                if (!extension.extensionDependencies) {
                    continue;
                }
                const myGroup = groups.get(extension.identifier);
                for (const depId of extension.extensionDependencies) {
                    const depGroup = groups.get(depId);
                    if (!depGroup) {
                        // probably can't execute, so it has no impact
                        continue;
                    }
                    if (depGroup === myGroup) {
                        // already in the same group
                        continue;
                    }
                    changeGroup(depGroup, myGroup);
                }
            }
            // Initialize with existing affinities
            const resultingAffinities = new Map();
            let lastAffinity = 0;
            for (const [_, extension] of extensions) {
                const runningLocation = this._runningLocation.get(extension.identifier);
                if (runningLocation) {
                    const group = groups.get(extension.identifier);
                    resultingAffinities.set(group, runningLocation.affinity);
                    lastAffinity = Math.max(lastAffinity, runningLocation.affinity);
                }
            }
            // When doing extension host debugging, we will ignore the configured affinity
            // because we can currently debug a single extension host
            if (!this._environmentService.isExtensionDevelopment) {
                // Go through each configured affinity and try to accomodate it
                const configuredAffinities = this._configurationService.getValue('extensions.experimental.affinity') || {};
                const configuredExtensionIds = Object.keys(configuredAffinities);
                const configuredAffinityToResultingAffinity = new Map();
                for (const extensionId of configuredExtensionIds) {
                    const configuredAffinity = configuredAffinities[extensionId];
                    if (typeof configuredAffinity !== 'number' || configuredAffinity <= 0 || Math.floor(configuredAffinity) !== configuredAffinity) {
                        this._logService.info(`Ignoring configured affinity for '${extensionId}' because the value is not a positive integer.`);
                        continue;
                    }
                    const group = groups.get(extensionId);
                    if (!group) {
                        // The extension is not known or cannot execute for this extension host kind
                        continue;
                    }
                    const affinity1 = resultingAffinities.get(group);
                    if (affinity1) {
                        // Affinity for this group is already established
                        configuredAffinityToResultingAffinity.set(configuredAffinity, affinity1);
                        continue;
                    }
                    const affinity2 = configuredAffinityToResultingAffinity.get(configuredAffinity);
                    if (affinity2) {
                        // Affinity for this configuration is already established
                        resultingAffinities.set(group, affinity2);
                        continue;
                    }
                    if (!isInitialAllocation) {
                        this._logService.info(`Ignoring configured affinity for '${extensionId}' because extension host(s) are already running. Reload window.`);
                        continue;
                    }
                    const affinity3 = ++lastAffinity;
                    configuredAffinityToResultingAffinity.set(configuredAffinity, affinity3);
                    resultingAffinities.set(group, affinity3);
                }
            }
            const result = new extensions_1.ExtensionIdentifierMap();
            for (const extension of inputExtensions) {
                const group = groups.get(extension.identifier) || 0;
                const affinity = resultingAffinities.get(group) || 0;
                result.set(extension.identifier, affinity);
            }
            if (lastAffinity > 0 && isInitialAllocation) {
                for (let affinity = 1; affinity <= lastAffinity; affinity++) {
                    const extensionIds = [];
                    for (const extension of inputExtensions) {
                        if (result.get(extension.identifier) === affinity) {
                            extensionIds.push(extension.identifier);
                        }
                    }
                    this._logService.info(`Placing extension(s) ${extensionIds.map(e => e.value).join(', ')} on a separate extension host.`);
                }
            }
            return { affinities: result, maxAffinity: lastAffinity };
        }
        computeRunningLocation(localExtensions, remoteExtensions, isInitialAllocation) {
            return this._doComputeRunningLocation(this._runningLocation, localExtensions, remoteExtensions, isInitialAllocation).runningLocation;
        }
        _doComputeRunningLocation(existingRunningLocation, localExtensions, remoteExtensions, isInitialAllocation) {
            // Skip extensions that have an existing running location
            localExtensions = localExtensions.filter(extension => !existingRunningLocation.has(extension.identifier));
            remoteExtensions = remoteExtensions.filter(extension => !existingRunningLocation.has(extension.identifier));
            const extensionHostKinds = (0, extensionHostKind_1.determineExtensionHostKinds)(localExtensions, remoteExtensions, (extension) => this.readExtensionKinds(extension), (extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference) => this._extensionHostKindPicker.pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference));
            const extensions = new extensions_1.ExtensionIdentifierMap();
            for (const extension of localExtensions) {
                extensions.set(extension.identifier, extension);
            }
            for (const extension of remoteExtensions) {
                extensions.set(extension.identifier, extension);
            }
            const result = new extensions_1.ExtensionIdentifierMap();
            const localProcessExtensions = [];
            const localWebWorkerExtensions = [];
            for (const [extensionIdKey, extensionHostKind] of extensionHostKinds) {
                let runningLocation = null;
                if (extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                    const extensionDescription = extensions.get(extensionIdKey);
                    if (extensionDescription) {
                        localProcessExtensions.push(extensionDescription);
                    }
                }
                else if (extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                    const extensionDescription = extensions.get(extensionIdKey);
                    if (extensionDescription) {
                        localWebWorkerExtensions.push(extensionDescription);
                    }
                }
                else if (extensionHostKind === 3 /* ExtensionHostKind.Remote */) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                result.set(extensionIdKey, runningLocation);
            }
            const { affinities, maxAffinity } = this._computeAffinity(localProcessExtensions, 1 /* ExtensionHostKind.LocalProcess */, isInitialAllocation);
            for (const extension of localProcessExtensions) {
                const affinity = affinities.get(extension.identifier) || 0;
                result.set(extension.identifier, new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            const { affinities: localWebWorkerAffinities, maxAffinity: maxLocalWebWorkerAffinity } = this._computeAffinity(localWebWorkerExtensions, 2 /* ExtensionHostKind.LocalWebWorker */, isInitialAllocation);
            for (const extension of localWebWorkerExtensions) {
                const affinity = localWebWorkerAffinities.get(extension.identifier) || 0;
                result.set(extension.identifier, new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
            // Add extensions that already have an existing running location
            for (const [extensionIdKey, runningLocation] of existingRunningLocation) {
                if (runningLocation) {
                    result.set(extensionIdKey, runningLocation);
                }
            }
            return { runningLocation: result, maxLocalProcessAffinity: maxAffinity, maxLocalWebWorkerAffinity: maxLocalWebWorkerAffinity };
        }
        initializeRunningLocation(localExtensions, remoteExtensions) {
            const { runningLocation, maxLocalProcessAffinity, maxLocalWebWorkerAffinity } = this._doComputeRunningLocation(this._runningLocation, localExtensions, remoteExtensions, true);
            this._runningLocation = runningLocation;
            this._maxLocalProcessAffinity = maxLocalProcessAffinity;
            this._maxLocalWebWorkerAffinity = maxLocalWebWorkerAffinity;
        }
        /**
         * Returns the running locations for the removed extensions.
         */
        deltaExtensions(toAdd, toRemove) {
            // Remove old running location
            const removedRunningLocation = new extensions_1.ExtensionIdentifierMap();
            for (const extensionId of toRemove) {
                const extensionKey = extensionId;
                removedRunningLocation.set(extensionKey, this._runningLocation.get(extensionKey) || null);
                this._runningLocation.delete(extensionKey);
            }
            // Determine new running location
            this._updateRunningLocationForAddedExtensions(toAdd);
            return removedRunningLocation;
        }
        /**
         * Update `this._runningLocation` with running locations for newly enabled/installed extensions.
         */
        _updateRunningLocationForAddedExtensions(toAdd) {
            // Determine new running location
            const localProcessExtensions = [];
            const localWebWorkerExtensions = [];
            for (const extension of toAdd) {
                const extensionKind = this.readExtensionKinds(extension);
                const isRemote = extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote;
                const extensionHostKind = this._extensionHostKindPicker.pickExtensionHostKind(extension.identifier, extensionKind, !isRemote, isRemote, 0 /* ExtensionRunningPreference.None */);
                let runningLocation = null;
                if (extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                    localProcessExtensions.push(extension);
                }
                else if (extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                    localWebWorkerExtensions.push(extension);
                }
                else if (extensionHostKind === 3 /* ExtensionHostKind.Remote */) {
                    runningLocation = new extensionRunningLocation_1.RemoteRunningLocation();
                }
                this._runningLocation.set(extension.identifier, runningLocation);
            }
            const { affinities } = this._computeAffinity(localProcessExtensions, 1 /* ExtensionHostKind.LocalProcess */, false);
            for (const extension of localProcessExtensions) {
                const affinity = affinities.get(extension.identifier) || 0;
                this._runningLocation.set(extension.identifier, new extensionRunningLocation_1.LocalProcessRunningLocation(affinity));
            }
            const { affinities: webWorkerExtensionsAffinities } = this._computeAffinity(localWebWorkerExtensions, 2 /* ExtensionHostKind.LocalWebWorker */, false);
            for (const extension of localWebWorkerExtensions) {
                const affinity = webWorkerExtensionsAffinities.get(extension.identifier) || 0;
                this._runningLocation.set(extension.identifier, new extensionRunningLocation_1.LocalWebWorkerRunningLocation(affinity));
            }
        }
    };
    exports.ExtensionRunningLocationTracker = ExtensionRunningLocationTracker;
    exports.ExtensionRunningLocationTracker = ExtensionRunningLocationTracker = __decorate([
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, log_1.ILogService),
        __param(5, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], ExtensionRunningLocationTracker);
    function filterExtensionDescriptions(extensions, runningLocation, predicate) {
        return extensions.filter((ext) => {
            const extRunningLocation = runningLocation.get(ext.identifier);
            return extRunningLocation && predicate(extRunningLocation);
        });
    }
    function filterExtensionIdentifiers(extensions, runningLocation, predicate) {
        return extensions.filter((ext) => {
            const extRunningLocation = runningLocation.get(ext);
            return extRunningLocation && predicate(extRunningLocation);
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUnVubmluZ0xvY2F0aW9uVHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvblJ1bm5pbmdMb2NhdGlvblRyYWNrZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcVVoRyxrRUFLQztJQUVELGdFQUtDO0lBblVNLElBQU0sK0JBQStCLEdBQXJDLE1BQU0sK0JBQStCO1FBTTNDLElBQVcsdUJBQXVCO1lBQ2pDLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDO1FBQ3RDLENBQUM7UUFFRCxJQUFXLHlCQUF5QjtZQUNuQyxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQztRQUN4QyxDQUFDO1FBRUQsWUFDa0IsU0FBZ0QsRUFDaEQsd0JBQWtELEVBQ3JDLG1CQUFrRSxFQUN6RSxxQkFBNkQsRUFDdkUsV0FBeUMsRUFDakIsbUNBQXlGO1lBTDdHLGNBQVMsR0FBVCxTQUFTLENBQXVDO1lBQ2hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDcEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUN4RCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ0Esd0NBQW1DLEdBQW5DLG1DQUFtQyxDQUFxQztZQWxCdkgscUJBQWdCLEdBQUcsSUFBSSxtQ0FBc0IsRUFBbUMsQ0FBQztZQUNqRiw2QkFBd0IsR0FBVyxDQUFDLENBQUM7WUFDckMsK0JBQTBCLEdBQVcsQ0FBQyxDQUFDO1FBaUIzQyxDQUFDO1FBRUUsR0FBRyxDQUFDLFdBQWdDLEVBQUUsZUFBeUM7WUFDckYsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVNLGtCQUFrQixDQUFDLG9CQUEyQztZQUNwRSxJQUFJLG9CQUFvQixDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUNsRyxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsQ0FBQztZQUMxRCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsbUNBQW1DLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRU0sa0JBQWtCLENBQUMsV0FBZ0M7WUFDekQsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUN2RCxDQUFDO1FBRU0sdUJBQXVCLENBQUMsVUFBNEMsRUFBRSxzQkFBZ0Q7WUFDNUgsT0FBTywyQkFBMkIsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ2hKLENBQUM7UUFFTSx5QkFBeUIsQ0FBQyxVQUE0QyxFQUFFLHdCQUEyQztZQUN6SCxPQUFPLDJCQUEyQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLElBQUksS0FBSyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ25KLENBQUM7UUFFTSw0QkFBNEIsQ0FBQyxVQUE0QyxFQUFFLG9CQUEyQztZQUM1SCxPQUFPLDJCQUEyQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLHlCQUF5QixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNqSyxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsZUFBd0MsRUFBRSxpQkFBb0MsRUFBRSxtQkFBNEI7WUFDcEksMkNBQTJDO1lBQzNDLE1BQU0sVUFBVSxHQUFHLElBQUksbUNBQXNCLEVBQXlCLENBQUM7WUFDdkUsS0FBSyxNQUFNLFNBQVMsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxTQUFTLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDekMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNqRCxDQUFDO1lBQ0YsQ0FBQztZQUNELGlFQUFpRTtZQUNqRSxLQUFLLE1BQU0sU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDO2dCQUN0RSxJQUFJLFNBQVMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN6QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDeEUsSUFBSSxlQUFlLElBQUksZUFBZSxDQUFDLElBQUksS0FBSyxpQkFBaUIsRUFBRSxDQUFDO3dCQUNuRSxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQ2pELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxxREFBcUQ7WUFDckQsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQ0FBc0IsRUFBVSxDQUFDO1lBQ3BELElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNwQixLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsRUFBRTtnQkFDaEQsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNuQyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQzt3QkFDcEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3JCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQztZQUVGLDREQUE0RDtZQUM1RCxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3pDLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDdEMsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBRSxDQUFDO2dCQUNsRCxLQUFLLE1BQU0sS0FBSyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO29CQUNyRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ2YsOENBQThDO3dCQUM5QyxTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7d0JBQzFCLDRCQUE0Qjt3QkFDNUIsU0FBUztvQkFDVixDQUFDO29CQUVELFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLENBQUM7WUFDRixDQUFDO1lBRUQsc0NBQXNDO1lBQ3RDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDdEQsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLEtBQUssTUFBTSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hFLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBRSxDQUFDO29CQUNoRCxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDekQsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakUsQ0FBQztZQUNGLENBQUM7WUFFRCw4RUFBOEU7WUFDOUUseURBQXlEO1lBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDdEQsK0RBQStEO2dCQUMvRCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQWdELGtDQUFrQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMxSixNQUFNLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDakUsTUFBTSxxQ0FBcUMsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztnQkFDeEUsS0FBSyxNQUFNLFdBQVcsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO29CQUNsRCxNQUFNLGtCQUFrQixHQUFHLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLE9BQU8sa0JBQWtCLEtBQUssUUFBUSxJQUFJLGtCQUFrQixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQUssa0JBQWtCLEVBQUUsQ0FBQzt3QkFDaEksSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMscUNBQXFDLFdBQVcsZ0RBQWdELENBQUMsQ0FBQzt3QkFDeEgsU0FBUztvQkFDVixDQUFDO29CQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWiw0RUFBNEU7d0JBQzVFLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ2pELElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2YsaURBQWlEO3dCQUNqRCxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3pFLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxNQUFNLFNBQVMsR0FBRyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQztvQkFDaEYsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDZix5REFBeUQ7d0JBQ3pELG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQzFDLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzt3QkFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMscUNBQXFDLFdBQVcsaUVBQWlFLENBQUMsQ0FBQzt3QkFDekksU0FBUztvQkFDVixDQUFDO29CQUVELE1BQU0sU0FBUyxHQUFHLEVBQUUsWUFBWSxDQUFDO29CQUNqQyxxQ0FBcUMsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQ3pFLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzNDLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQ0FBc0IsRUFBVSxDQUFDO1lBQ3BELEtBQUssTUFBTSxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxJQUFJLFlBQVksR0FBRyxDQUFDLElBQUksbUJBQW1CLEVBQUUsQ0FBQztnQkFDN0MsS0FBSyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxJQUFJLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUM3RCxNQUFNLFlBQVksR0FBMEIsRUFBRSxDQUFDO29CQUMvQyxLQUFLLE1BQU0sU0FBUyxJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUN6QyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDOzRCQUNuRCxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDekMsQ0FBQztvQkFDRixDQUFDO29CQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHdCQUF3QixZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztnQkFDMUgsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLENBQUM7UUFDMUQsQ0FBQztRQUVNLHNCQUFzQixDQUFDLGVBQXdDLEVBQUUsZ0JBQXlDLEVBQUUsbUJBQTRCO1lBQzlJLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxlQUFlLENBQUM7UUFDdEksQ0FBQztRQUVPLHlCQUF5QixDQUFDLHVCQUFnRixFQUFFLGVBQXdDLEVBQUUsZ0JBQXlDLEVBQUUsbUJBQTRCO1lBQ3BPLHlEQUF5RDtZQUN6RCxlQUFlLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzFHLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBRTVHLE1BQU0sa0JBQWtCLEdBQUcsSUFBQSwrQ0FBMkIsRUFDckQsZUFBZSxFQUNmLGdCQUFnQixFQUNoQixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxFQUNqRCxDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLENBQUMsQ0FDM04sQ0FBQztZQUVGLE1BQU0sVUFBVSxHQUFHLElBQUksbUNBQXNCLEVBQXlCLENBQUM7WUFDdkUsS0FBSyxNQUFNLFNBQVMsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDekMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxLQUFLLE1BQU0sU0FBUyxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQzFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNqRCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxtQ0FBc0IsRUFBbUMsQ0FBQztZQUM3RSxNQUFNLHNCQUFzQixHQUE0QixFQUFFLENBQUM7WUFDM0QsTUFBTSx3QkFBd0IsR0FBNEIsRUFBRSxDQUFDO1lBQzdELEtBQUssTUFBTSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RFLElBQUksZUFBZSxHQUFvQyxJQUFJLENBQUM7Z0JBQzVELElBQUksaUJBQWlCLDJDQUFtQyxFQUFFLENBQUM7b0JBQzFELE1BQU0sb0JBQW9CLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO3dCQUMxQixzQkFBc0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDbkQsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksaUJBQWlCLDZDQUFxQyxFQUFFLENBQUM7b0JBQ25FLE1BQU0sb0JBQW9CLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO3dCQUMxQix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO3FCQUFNLElBQUksaUJBQWlCLHFDQUE2QixFQUFFLENBQUM7b0JBQzNELGVBQWUsR0FBRyxJQUFJLGdEQUFxQixFQUFFLENBQUM7Z0JBQy9DLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELE1BQU0sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQiwwQ0FBa0MsbUJBQW1CLENBQUMsQ0FBQztZQUN2SSxLQUFLLE1BQU0sU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2hELE1BQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksc0RBQTJCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3RSxDQUFDO1lBQ0QsTUFBTSxFQUFFLFVBQVUsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUseUJBQXlCLEVBQUUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLDRDQUFvQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2hNLEtBQUssTUFBTSxTQUFTLElBQUksd0JBQXdCLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pFLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLHdEQUE2QixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDL0UsQ0FBQztZQUVELGdFQUFnRTtZQUNoRSxLQUFLLE1BQU0sQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLElBQUksdUJBQXVCLEVBQUUsQ0FBQztnQkFDekUsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLHlCQUF5QixFQUFFLHlCQUF5QixFQUFFLENBQUM7UUFDaEksQ0FBQztRQUVNLHlCQUF5QixDQUFDLGVBQXdDLEVBQUUsZ0JBQXlDO1lBQ25ILE1BQU0sRUFBRSxlQUFlLEVBQUUsdUJBQXVCLEVBQUUseUJBQXlCLEVBQUUsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvSyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyx1QkFBdUIsQ0FBQztZQUN4RCxJQUFJLENBQUMsMEJBQTBCLEdBQUcseUJBQXlCLENBQUM7UUFDN0QsQ0FBQztRQUVEOztXQUVHO1FBQ0ksZUFBZSxDQUFDLEtBQThCLEVBQUUsUUFBK0I7WUFDckYsOEJBQThCO1lBQzlCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxtQ0FBc0IsRUFBbUMsQ0FBQztZQUM3RixLQUFLLE1BQU0sV0FBVyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUM7Z0JBQ2pDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQztnQkFDMUYsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRUQsaUNBQWlDO1lBQ2pDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVyRCxPQUFPLHNCQUFzQixDQUFDO1FBQy9CLENBQUM7UUFFRDs7V0FFRztRQUNLLHdDQUF3QyxDQUFDLEtBQThCO1lBQzlFLGlDQUFpQztZQUNqQyxNQUFNLHNCQUFzQixHQUE0QixFQUFFLENBQUM7WUFDM0QsTUFBTSx3QkFBd0IsR0FBNEIsRUFBRSxDQUFDO1lBQzdELEtBQUssTUFBTSxTQUFTLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDekQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFlBQVksQ0FBQztnQkFDN0UsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSwwQ0FBa0MsQ0FBQztnQkFDekssSUFBSSxlQUFlLEdBQW9DLElBQUksQ0FBQztnQkFDNUQsSUFBSSxpQkFBaUIsMkNBQW1DLEVBQUUsQ0FBQztvQkFDMUQsc0JBQXNCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO3FCQUFNLElBQUksaUJBQWlCLDZDQUFxQyxFQUFFLENBQUM7b0JBQ25FLHdCQUF3QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDMUMsQ0FBQztxQkFBTSxJQUFJLGlCQUFpQixxQ0FBNkIsRUFBRSxDQUFDO29CQUMzRCxlQUFlLEdBQUcsSUFBSSxnREFBcUIsRUFBRSxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsMENBQWtDLEtBQUssQ0FBQyxDQUFDO1lBQzVHLEtBQUssTUFBTSxTQUFTLElBQUksc0JBQXNCLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxzREFBMkIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLDZCQUE2QixFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHdCQUF3Qiw0Q0FBb0MsS0FBSyxDQUFDLENBQUM7WUFDL0ksS0FBSyxNQUFNLFNBQVMsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO2dCQUNsRCxNQUFNLFFBQVEsR0FBRyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLElBQUksd0RBQTZCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM5RixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFyVFksMEVBQStCOzhDQUEvQiwrQkFBK0I7UUFpQnpDLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHdFQUFtQyxDQUFBO09BcEJ6QiwrQkFBK0IsQ0FxVDNDO0lBRUQsU0FBZ0IsMkJBQTJCLENBQUMsVUFBNEMsRUFBRSxlQUF3RSxFQUFFLFNBQW9FO1FBQ3ZPLE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2hDLE1BQU0sa0JBQWtCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0QsT0FBTyxrQkFBa0IsSUFBSSxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxTQUFnQiwwQkFBMEIsQ0FBQyxVQUEwQyxFQUFFLGVBQXdFLEVBQUUsU0FBb0U7UUFDcE8sT0FBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDaEMsTUFBTSxrQkFBa0IsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sa0JBQWtCLElBQUksU0FBUyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=