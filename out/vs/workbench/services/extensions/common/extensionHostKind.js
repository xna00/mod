/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions"], function (require, exports, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRunningPreference = exports.ExtensionHostKind = void 0;
    exports.extensionHostKindToString = extensionHostKindToString;
    exports.extensionRunningPreferenceToString = extensionRunningPreferenceToString;
    exports.determineExtensionHostKinds = determineExtensionHostKinds;
    var ExtensionHostKind;
    (function (ExtensionHostKind) {
        ExtensionHostKind[ExtensionHostKind["LocalProcess"] = 1] = "LocalProcess";
        ExtensionHostKind[ExtensionHostKind["LocalWebWorker"] = 2] = "LocalWebWorker";
        ExtensionHostKind[ExtensionHostKind["Remote"] = 3] = "Remote";
    })(ExtensionHostKind || (exports.ExtensionHostKind = ExtensionHostKind = {}));
    function extensionHostKindToString(kind) {
        if (kind === null) {
            return 'None';
        }
        switch (kind) {
            case 1 /* ExtensionHostKind.LocalProcess */: return 'LocalProcess';
            case 2 /* ExtensionHostKind.LocalWebWorker */: return 'LocalWebWorker';
            case 3 /* ExtensionHostKind.Remote */: return 'Remote';
        }
    }
    var ExtensionRunningPreference;
    (function (ExtensionRunningPreference) {
        ExtensionRunningPreference[ExtensionRunningPreference["None"] = 0] = "None";
        ExtensionRunningPreference[ExtensionRunningPreference["Local"] = 1] = "Local";
        ExtensionRunningPreference[ExtensionRunningPreference["Remote"] = 2] = "Remote";
    })(ExtensionRunningPreference || (exports.ExtensionRunningPreference = ExtensionRunningPreference = {}));
    function extensionRunningPreferenceToString(preference) {
        switch (preference) {
            case 0 /* ExtensionRunningPreference.None */:
                return 'None';
            case 1 /* ExtensionRunningPreference.Local */:
                return 'Local';
            case 2 /* ExtensionRunningPreference.Remote */:
                return 'Remote';
        }
    }
    function determineExtensionHostKinds(_localExtensions, _remoteExtensions, getExtensionKind, pickExtensionHostKind) {
        const localExtensions = toExtensionWithKind(_localExtensions, getExtensionKind);
        const remoteExtensions = toExtensionWithKind(_remoteExtensions, getExtensionKind);
        const allExtensions = new Map();
        const collectExtension = (ext) => {
            if (allExtensions.has(ext.key)) {
                return;
            }
            const local = localExtensions.get(ext.key) || null;
            const remote = remoteExtensions.get(ext.key) || null;
            const info = new ExtensionInfo(local, remote);
            allExtensions.set(info.key, info);
        };
        localExtensions.forEach((ext) => collectExtension(ext));
        remoteExtensions.forEach((ext) => collectExtension(ext));
        const extensionHostKinds = new Map();
        allExtensions.forEach((ext) => {
            const isInstalledLocally = Boolean(ext.local);
            const isInstalledRemotely = Boolean(ext.remote);
            const isLocallyUnderDevelopment = Boolean(ext.local && ext.local.isUnderDevelopment);
            const isRemotelyUnderDevelopment = Boolean(ext.remote && ext.remote.isUnderDevelopment);
            let preference = 0 /* ExtensionRunningPreference.None */;
            if (isLocallyUnderDevelopment && !isRemotelyUnderDevelopment) {
                preference = 1 /* ExtensionRunningPreference.Local */;
            }
            else if (isRemotelyUnderDevelopment && !isLocallyUnderDevelopment) {
                preference = 2 /* ExtensionRunningPreference.Remote */;
            }
            extensionHostKinds.set(ext.key, pickExtensionHostKind(ext.identifier, ext.kind, isInstalledLocally, isInstalledRemotely, preference));
        });
        return extensionHostKinds;
    }
    function toExtensionWithKind(extensions, getExtensionKind) {
        const result = new Map();
        extensions.forEach((desc) => {
            const ext = new ExtensionWithKind(desc, getExtensionKind(desc));
            result.set(ext.key, ext);
        });
        return result;
    }
    class ExtensionWithKind {
        constructor(desc, kind) {
            this.desc = desc;
            this.kind = kind;
        }
        get key() {
            return extensions_1.ExtensionIdentifier.toKey(this.desc.identifier);
        }
        get isUnderDevelopment() {
            return this.desc.isUnderDevelopment;
        }
    }
    class ExtensionInfo {
        constructor(local, remote) {
            this.local = local;
            this.remote = remote;
        }
        get key() {
            if (this.local) {
                return this.local.key;
            }
            return this.remote.key;
        }
        get identifier() {
            if (this.local) {
                return this.local.desc.identifier;
            }
            return this.remote.desc.identifier;
        }
        get kind() {
            // in case of disagreements between extension kinds, it is always
            // better to pick the local extension because it has a much higher
            // chance of being up-to-date
            if (this.local) {
                return this.local.kind;
            }
            return this.remote.kind;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdEtpbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25Ib3N0S2luZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsOERBU0M7SUFRRCxnRkFTQztJQU1ELGtFQXlDQztJQS9FRCxJQUFrQixpQkFJakI7SUFKRCxXQUFrQixpQkFBaUI7UUFDbEMseUVBQWdCLENBQUE7UUFDaEIsNkVBQWtCLENBQUE7UUFDbEIsNkRBQVUsQ0FBQTtJQUNYLENBQUMsRUFKaUIsaUJBQWlCLGlDQUFqQixpQkFBaUIsUUFJbEM7SUFFRCxTQUFnQix5QkFBeUIsQ0FBQyxJQUE4QjtRQUN2RSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuQixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFDRCxRQUFRLElBQUksRUFBRSxDQUFDO1lBQ2QsMkNBQW1DLENBQUMsQ0FBQyxPQUFPLGNBQWMsQ0FBQztZQUMzRCw2Q0FBcUMsQ0FBQyxDQUFDLE9BQU8sZ0JBQWdCLENBQUM7WUFDL0QscUNBQTZCLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQztRQUNoRCxDQUFDO0lBQ0YsQ0FBQztJQUVELElBQWtCLDBCQUlqQjtJQUpELFdBQWtCLDBCQUEwQjtRQUMzQywyRUFBSSxDQUFBO1FBQ0osNkVBQUssQ0FBQTtRQUNMLCtFQUFNLENBQUE7SUFDUCxDQUFDLEVBSmlCLDBCQUEwQiwwQ0FBMUIsMEJBQTBCLFFBSTNDO0lBRUQsU0FBZ0Isa0NBQWtDLENBQUMsVUFBc0M7UUFDeEYsUUFBUSxVQUFVLEVBQUUsQ0FBQztZQUNwQjtnQkFDQyxPQUFPLE1BQU0sQ0FBQztZQUNmO2dCQUNDLE9BQU8sT0FBTyxDQUFDO1lBQ2hCO2dC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