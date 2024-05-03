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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/remote/common/tunnelModel", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, nls, event_1, instantiation_1, extensions_1, storage_1, tunnel_1, tunnelModel_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelEditId = exports.TunnelType = exports.PORT_AUTO_SOURCE_SETTING_HYBRID = exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = exports.PORT_AUTO_SOURCE_SETTING_PROCESS = exports.PORT_AUTO_FALLBACK_SETTING = exports.PORT_AUTO_SOURCE_SETTING = exports.PORT_AUTO_FORWARD_SETTING = exports.TUNNEL_VIEW_CONTAINER_ID = exports.TUNNEL_VIEW_ID = exports.REMOTE_EXPLORER_TYPE_KEY = exports.IRemoteExplorerService = void 0;
    exports.IRemoteExplorerService = (0, instantiation_1.createDecorator)('remoteExplorerService');
    exports.REMOTE_EXPLORER_TYPE_KEY = 'remote.explorerType';
    exports.TUNNEL_VIEW_ID = '~remote.forwardedPorts';
    exports.TUNNEL_VIEW_CONTAINER_ID = '~remote.forwardedPortsContainer';
    exports.PORT_AUTO_FORWARD_SETTING = 'remote.autoForwardPorts';
    exports.PORT_AUTO_SOURCE_SETTING = 'remote.autoForwardPortsSource';
    exports.PORT_AUTO_FALLBACK_SETTING = 'remote.autoForwardPortsFallback';
    exports.PORT_AUTO_SOURCE_SETTING_PROCESS = 'process';
    exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = 'output';
    exports.PORT_AUTO_SOURCE_SETTING_HYBRID = 'hybrid';
    var TunnelType;
    (function (TunnelType) {
        TunnelType["Candidate"] = "Candidate";
        TunnelType["Detected"] = "Detected";
        TunnelType["Forwarded"] = "Forwarded";
        TunnelType["Add"] = "Add";
    })(TunnelType || (exports.TunnelType = TunnelType = {}));
    var TunnelEditId;
    (function (TunnelEditId) {
        TunnelEditId[TunnelEditId["None"] = 0] = "None";
        TunnelEditId[TunnelEditId["New"] = 1] = "New";
        TunnelEditId[TunnelEditId["Label"] = 2] = "Label";
        TunnelEditId[TunnelEditId["LocalPort"] = 3] = "LocalPort";
    })(TunnelEditId || (exports.TunnelEditId = TunnelEditId = {}));
    const getStartedWalkthrough = {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                description: nls.localize('getStartedWalkthrough.id', 'The ID of a Get Started walkthrough to open.'),
                type: 'string'
            },
        }
    };
    const remoteHelpExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'remoteHelp',
        jsonSchema: {
            description: nls.localize('RemoteHelpInformationExtPoint', 'Contributes help information for Remote'),
            type: 'object',
            properties: {
                'getStarted': {
                    description: nls.localize('RemoteHelpInformationExtPoint.getStarted', "The url, or a command that returns the url, to your project's Getting Started page, or a walkthrough ID contributed by your project's extension"),
                    oneOf: [
                        { type: 'string' },
                        getStartedWalkthrough
                    ]
                },
                'documentation': {
                    description: nls.localize('RemoteHelpInformationExtPoint.documentation', "The url, or a command that returns the url, to your project's documentation page"),
                    type: 'string'
                },
                'feedback': {
                    description: nls.localize('RemoteHelpInformationExtPoint.feedback', "The url, or a command that returns the url, to your project's feedback reporter"),
                    type: 'string',
                    markdownDeprecationMessage: nls.localize('RemoteHelpInformationExtPoint.feedback.deprecated', "Use {0} instead", '`reportIssue`')
                },
                'reportIssue': {
                    description: nls.localize('RemoteHelpInformationExtPoint.reportIssue', "The url, or a command that returns the url, to your project's issue reporter"),
                    type: 'string'
                },
                'issues': {
                    description: nls.localize('RemoteHelpInformationExtPoint.issues', "The url, or a command that returns the url, to your project's issues list"),
                    type: 'string'
                }
            }
        }
    });
    let RemoteExplorerService = class RemoteExplorerService {
        constructor(storageService, tunnelService, instantiationService) {
            this.storageService = storageService;
            this.tunnelService = tunnelService;
            this._targetType = [];
            this._onDidChangeTargetType = new event_1.Emitter();
            this.onDidChangeTargetType = this._onDidChangeTargetType.event;
            this._onDidChangeHelpInformation = new event_1.Emitter();
            this.onDidChangeHelpInformation = this._onDidChangeHelpInformation.event;
            this._helpInformation = [];
            this._onDidChangeEditable = new event_1.Emitter();
            this.onDidChangeEditable = this._onDidChangeEditable.event;
            this._onEnabledPortsFeatures = new event_1.Emitter();
            this.onEnabledPortsFeatures = this._onEnabledPortsFeatures.event;
            this._portsFeaturesEnabled = false;
            this.namedProcesses = new Map();
            this._tunnelModel = instantiationService.createInstance(tunnelModel_1.TunnelModel);
            remoteHelpExtPoint.setHandler((extensions) => {
                this._helpInformation.push(...extensions);
                this._onDidChangeHelpInformation.fire(extensions);
            });
        }
        get helpInformation() {
            return this._helpInformation;
        }
        set targetType(name) {
            // Can just compare the first element of the array since there are no target overlaps
            const current = this._targetType.length > 0 ? this._targetType[0] : '';
            const newName = name.length > 0 ? name[0] : '';
            if (current !== newName) {
                this._targetType = name;
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                this._onDidChangeTargetType.fire(this._targetType);
            }
        }
        get targetType() {
            return this._targetType;
        }
        get tunnelModel() {
            return this._tunnelModel;
        }
        forward(tunnelProperties, attributes) {
            return this.tunnelModel.forward(tunnelProperties, attributes);
        }
        close(remote, reason) {
            return this.tunnelModel.close(remote.host, remote.port, reason);
        }
        setTunnelInformation(tunnelInformation) {
            if (tunnelInformation?.features) {
                this.tunnelService.setTunnelFeatures(tunnelInformation.features);
            }
            this.tunnelModel.addEnvironmentTunnels(tunnelInformation?.environmentTunnels);
        }
        setEditable(tunnelItem, editId, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { tunnelItem, data, editId };
            }
            this._onDidChangeEditable.fire(tunnelItem ? { tunnel: tunnelItem, editId } : undefined);
        }
        getEditableData(tunnelItem, editId) {
            return (this._editable &&
                ((!tunnelItem && (tunnelItem === this._editable.tunnelItem)) ||
                    (tunnelItem && (this._editable.tunnelItem?.remotePort === tunnelItem.remotePort) && (this._editable.tunnelItem.remoteHost === tunnelItem.remoteHost)
                        && (this._editable.editId === editId)))) ?
                this._editable.data : undefined;
        }
        setCandidateFilter(filter) {
            if (!filter) {
                return {
                    dispose: () => { }
                };
            }
            this.tunnelModel.setCandidateFilter(filter);
            return {
                dispose: () => {
                    this.tunnelModel.setCandidateFilter(undefined);
                }
            };
        }
        onFoundNewCandidates(candidates) {
            this.tunnelModel.setCandidates(candidates);
        }
        restore() {
            return this.tunnelModel.restoreForwarded();
        }
        enablePortsFeatures() {
            this._portsFeaturesEnabled = true;
            this._onEnabledPortsFeatures.fire();
        }
        get portsFeaturesEnabled() {
            return this._portsFeaturesEnabled;
        }
    };
    RemoteExplorerService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, tunnel_1.ITunnelService),
        __param(2, instantiation_1.IInstantiationService)
    ], RemoteExplorerService);
    (0, extensions_1.registerSingleton)(exports.IRemoteExplorerService, RemoteExplorerService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXhwbG9yZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcmVtb3RlL2NvbW1vbi9yZW1vdGVFeHBsb3JlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJuRixRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQUMxRixRQUFBLHdCQUF3QixHQUFXLHFCQUFxQixDQUFDO0lBQ3pELFFBQUEsY0FBYyxHQUFHLHdCQUF3QixDQUFDO0lBQzFDLFFBQUEsd0JBQXdCLEdBQUcsaUNBQWlDLENBQUM7SUFDN0QsUUFBQSx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQztJQUN0RCxRQUFBLHdCQUF3QixHQUFHLCtCQUErQixDQUFDO0lBQzNELFFBQUEsMEJBQTBCLEdBQUcsaUNBQWlDLENBQUM7SUFDL0QsUUFBQSxnQ0FBZ0MsR0FBRyxTQUFTLENBQUM7SUFDN0MsUUFBQSwrQkFBK0IsR0FBRyxRQUFRLENBQUM7SUFDM0MsUUFBQSwrQkFBK0IsR0FBRyxRQUFRLENBQUM7SUFFeEQsSUFBWSxVQUtYO0lBTEQsV0FBWSxVQUFVO1FBQ3JCLHFDQUF1QixDQUFBO1FBQ3ZCLG1DQUFxQixDQUFBO1FBQ3JCLHFDQUF1QixDQUFBO1FBQ3ZCLHlCQUFXLENBQUE7SUFDWixDQUFDLEVBTFcsVUFBVSwwQkFBVixVQUFVLFFBS3JCO0lBcUJELElBQVksWUFLWDtJQUxELFdBQVksWUFBWTtRQUN2QiwrQ0FBUSxDQUFBO1FBQ1IsNkNBQU8sQ0FBQTtRQUNQLGlEQUFTLENBQUE7UUFDVCx5REFBYSxDQUFBO0lBQ2QsQ0FBQyxFQUxXLFlBQVksNEJBQVosWUFBWSxRQUt2QjtJQVlELE1BQU0scUJBQXFCLEdB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