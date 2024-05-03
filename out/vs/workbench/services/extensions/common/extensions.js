/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/common/implicitActivationEvents", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, uri_1, extensionManagementUtil_1, implicitActivationEvents_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullExtensionService = exports.ActivationKind = exports.ExtensionPointContribution = exports.ActivationTimes = exports.ExtensionHostExtensions = exports.ExtensionHostStartup = exports.MissingExtensionDependency = exports.IExtensionService = exports.webWorkerExtHostConfig = exports.nullExtensionDescription = void 0;
    exports.isProposedApiEnabled = isProposedApiEnabled;
    exports.checkProposedApiEnabled = checkProposedApiEnabled;
    exports.toExtension = toExtension;
    exports.toExtensionDescription = toExtensionDescription;
    exports.nullExtensionDescription = Object.freeze({
        identifier: new extensions_1.ExtensionIdentifier('nullExtensionDescription'),
        name: 'Null Extension Description',
        version: '0.0.0',
        publisher: 'vscode',
        engines: { vscode: '' },
        extensionLocation: uri_1.URI.parse('void:location'),
        isBuiltin: false,
        targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
        isUserBuiltin: false,
        isUnderDevelopment: false,
    });
    exports.webWorkerExtHostConfig = 'extensions.webWorker';
    exports.IExtensionService = (0, instantiation_1.createDecorator)('extensionService');
    class MissingExtensionDependency {
        constructor(dependency) {
            this.dependency = dependency;
        }
    }
    exports.MissingExtensionDependency = MissingExtensionDependency;
    var ExtensionHostStartup;
    (function (ExtensionHostStartup) {
        /**
         * The extension host should be launched immediately and doesn't require a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["EagerAutoStart"] = 1] = "EagerAutoStart";
        /**
         * The extension host should be launched immediately and needs a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["EagerManualStart"] = 2] = "EagerManualStart";
        /**
         * The extension host should be launched lazily and only when it has extensions it needs to host. It needs a `$startExtensionHost` call.
         */
        ExtensionHostStartup[ExtensionHostStartup["Lazy"] = 3] = "Lazy";
    })(ExtensionHostStartup || (exports.ExtensionHostStartup = ExtensionHostStartup = {}));
    class ExtensionHostExtensions {
        get versionId() {
            return this._versionId;
        }
        get allExtensions() {
            return this._allExtensions;
        }
        get myExtensions() {
            return this._myExtensions;
        }
        constructor(versionId, allExtensions, myExtensions) {
            this._versionId = versionId;
            this._allExtensions = allExtensions.slice(0);
            this._myExtensions = myExtensions.slice(0);
            this._myActivationEvents = null;
        }
        toSnapshot() {
            return {
                versionId: this._versionId,
                allExtensions: this._allExtensions,
                myExtensions: this._myExtensions,
                activationEvents: implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(this._allExtensions)
            };
        }
        set(versionId, allExtensions, myExtensions) {
            if (this._versionId > versionId) {
                throw new Error(`ExtensionHostExtensions: invalid versionId ${versionId} (current: ${this._versionId})`);
            }
            const toRemove = [];
            const toAdd = [];
            const myToRemove = [];
            const myToAdd = [];
            const oldExtensionsMap = extensionDescriptionArrayToMap(this._allExtensions);
            const newExtensionsMap = extensionDescriptionArrayToMap(allExtensions);
            const extensionsAreTheSame = (a, b) => {
                return ((a.extensionLocation.toString() === b.extensionLocation.toString())
                    || (a.isBuiltin === b.isBuiltin)
                    || (a.isUserBuiltin === b.isUserBuiltin)
                    || (a.isUnderDevelopment === b.isUnderDevelopment));
            };
            for (const oldExtension of this._allExtensions) {
                const newExtension = newExtensionsMap.get(oldExtension.identifier);
                if (!newExtension) {
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
            }
            for (const newExtension of allExtensions) {
                const oldExtension = oldExtensionsMap.get(newExtension.identifier);
                if (!oldExtension) {
                    toAdd.push(newExtension);
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(oldExtension.identifier);
                    continue;
                }
            }
            const myOldExtensionsSet = new extensions_1.ExtensionIdentifierSet(this._myExtensions);
            const myNewExtensionsSet = new extensions_1.ExtensionIdentifierSet(myExtensions);
            for (const oldExtensionId of this._myExtensions) {
                if (!myNewExtensionsSet.has(oldExtensionId)) {
                    myToRemove.push(oldExtensionId);
                }
            }
            for (const newExtensionId of myExtensions) {
                if (!myOldExtensionsSet.has(newExtensionId)) {
                    myToAdd.push(newExtensionId);
                }
            }
            const addActivationEvents = implicitActivationEvents_1.ImplicitActivationEvents.createActivationEventsMap(toAdd);
            const delta = { versionId, toRemove, toAdd, addActivationEvents, myToRemove, myToAdd };
            this.delta(delta);
            return delta;
        }
        delta(extensionsDelta) {
            if (this._versionId >= extensionsDelta.versionId) {
                // ignore older deltas
                return null;
            }
            const { toRemove, toAdd, myToRemove, myToAdd } = extensionsDelta;
            // First handle removals
            const toRemoveSet = new extensions_1.ExtensionIdentifierSet(toRemove);
            const myToRemoveSet = new extensions_1.ExtensionIdentifierSet(myToRemove);
            for (let i = 0; i < this._allExtensions.length; i++) {
                if (toRemoveSet.has(this._allExtensions[i].identifier)) {
                    this._allExtensions.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < this._myExtensions.length; i++) {
                if (myToRemoveSet.has(this._myExtensions[i])) {
                    this._myExtensions.splice(i, 1);
                    i--;
                }
            }
            // Then handle additions
            for (const extension of toAdd) {
                this._allExtensions.push(extension);
            }
            for (const extensionId of myToAdd) {
                this._myExtensions.push(extensionId);
            }
            // clear cached activation events
            this._myActivationEvents = null;
            return extensionsDelta;
        }
        containsExtension(extensionId) {
            for (const myExtensionId of this._myExtensions) {
                if (extensions_1.ExtensionIdentifier.equals(myExtensionId, extensionId)) {
                    return true;
                }
            }
            return false;
        }
        containsActivationEvent(activationEvent) {
            if (!this._myActivationEvents) {
                this._myActivationEvents = this._readMyActivationEvents();
            }
            return this._myActivationEvents.has(activationEvent);
        }
        _readMyActivationEvents() {
            const result = new Set();
            for (const extensionDescription of this._allExtensions) {
                if (!this.containsExtension(extensionDescription.identifier)) {
                    continue;
                }
                const activationEvents = implicitActivationEvents_1.ImplicitActivationEvents.readActivationEvents(extensionDescription);
                for (const activationEvent of activationEvents) {
                    result.add(activationEvent);
                }
            }
            return result;
        }
    }
    exports.ExtensionHostExtensions = ExtensionHostExtensions;
    function extensionDescriptionArrayToMap(extensions) {
        const result = new extensions_1.ExtensionIdentifierMap();
        for (const extension of extensions) {
            result.set(extension.identifier, extension);
        }
        return result;
    }
    function isProposedApiEnabled(extension, proposal) {
        if (!extension.enabledApiProposals) {
            return false;
        }
        return extension.enabledApiProposals.includes(proposal);
    }
    function checkProposedApiEnabled(extension, proposal) {
        if (!isProposedApiEnabled(extension, proposal)) {
            throw new Error(`Extension '${extension.identifier.value}' CANNOT use API proposal: ${proposal}.\nIts package.json#enabledApiProposals-property declares: ${extension.enabledApiProposals?.join(', ') ?? '[]'} but NOT ${proposal}.\n The missing proposal MUST be added and you must start in extension development mode or use the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
        }
    }
    class ActivationTimes {
        constructor(codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
            this.activationReason = activationReason;
        }
    }
    exports.ActivationTimes = ActivationTimes;
    class ExtensionPointContribution {
        constructor(description, value) {
            this.description = description;
            this.value = value;
        }
    }
    exports.ExtensionPointContribution = ExtensionPointContribution;
    var ActivationKind;
    (function (ActivationKind) {
        ActivationKind[ActivationKind["Normal"] = 0] = "Normal";
        ActivationKind[ActivationKind["Immediate"] = 1] = "Immediate";
    })(ActivationKind || (exports.ActivationKind = ActivationKind = {}));
    function toExtension(extensionDescription) {
        return {
            type: extensionDescription.isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */,
            isBuiltin: extensionDescription.isBuiltin || extensionDescription.isUserBuiltin,
            identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(extensionDescription.publisher, extensionDescription.name), uuid: extensionDescription.uuid },
            manifest: extensionDescription,
            location: extensionDescription.extensionLocation,
            targetPlatform: extensionDescription.targetPlatform,
            validations: [],
            isValid: true
        };
    }
    function toExtensionDescription(extension, isUnderDevelopment) {
        return {
            identifier: new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(extension.manifest.publisher, extension.manifest.name)),
            isBuiltin: extension.type === 0 /* ExtensionType.System */,
            isUserBuiltin: extension.type === 1 /* ExtensionType.User */ && extension.isBuiltin,
            isUnderDevelopment: !!isUnderDevelopment,
            extensionLocation: extension.location,
            ...extension.manifest,
            uuid: extension.identifier.uuid,
            targetPlatform: extension.targetPlatform
        };
    }
    class NullExtensionService {
        constructor() {
            this.onDidRegisterExtensions = event_1.Event.None;
            this.onDidChangeExtensionsStatus = event_1.Event.None;
            this.onDidChangeExtensions = event_1.Event.None;
            this.onWillActivateByEvent = event_1.Event.None;
            this.onDidChangeResponsiveChange = event_1.Event.None;
            this.onWillStop = event_1.Event.None;
            this.extensions = [];
        }
        activateByEvent(_activationEvent) { return Promise.resolve(undefined); }
        activateById(extensionId, reason) { return Promise.resolve(undefined); }
        activationEventIsDone(_activationEvent) { return false; }
        whenInstalledExtensionsRegistered() { return Promise.resolve(true); }
        getExtension() { return Promise.resolve(undefined); }
        readExtensionPointContributions(_extPoint) { return Promise.resolve(Object.create(null)); }
        getExtensionsStatus() { return Object.create(null); }
        getInspectPorts(_extensionHostKind, _tryEnableInspector) { return Promise.resolve([]); }
        stopExtensionHosts() { }
        async startExtensionHosts() { }
        async setRemoteEnvironment(_env) { }
        canAddExtension() { return false; }
        canRemoveExtension() { return false; }
    }
    exports.NullExtensionService = NullExtensionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc1RoRyxvREFLQztJQUVELDBEQUlDO0lBNE5ELGtDQVdDO0lBRUQsd0RBV0M7SUFwaUJZLFFBQUEsd0JBQXdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBd0I7UUFDNUUsVUFBVSxFQUFFLElBQUksZ0NBQW1CLENBQUMsMEJBQTBCLENBQUM7UUFDL0QsSUFBSSxFQUFFLDRCQUE0QjtRQUNsQyxPQUFPLEVBQUUsT0FBTztRQUNoQixTQUFTLEVBQUUsUUFBUTtRQUNuQixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFO1FBQ3ZCLGlCQUFpQixFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBQzdDLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLGNBQWMsNENBQTBCO1FBQ3hDLGFBQWEsRUFBRSxLQUFLO1FBQ3BCLGtCQUFrQixFQUFFLEtBQUs7S0FDekIsQ0FBQyxDQUFDO0lBR1UsUUFBQSxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztJQUVoRCxRQUFBLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQWtCeEYsTUFBYSwwQkFBMEI7UUFDdEMsWUFBcUIsVUFBa0I7WUFBbEIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUFJLENBQUM7S0FDNUM7SUFGRCxnRUFFQztJQTBDRCxJQUFrQixvQkFhakI7SUFiRCxXQUFrQixvQkFBb0I7UUFDckM7O1dBRUc7UUFDSCxtRkFBa0IsQ0FBQTtRQUNsQjs7V0FFRztRQUNILHVGQUFvQixDQUFBO1FBQ3BCOztXQUVHO1FBQ0gs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