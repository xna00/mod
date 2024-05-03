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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/contributions", "vs/platform/instantiation/common/descriptors", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/editor", "vs/workbench/contrib/extensions/electron-sandbox/runtimeExtensionsEditor", "vs/workbench/contrib/extensions/electron-sandbox/debugExtensionHostAction", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/contrib/extensions/common/runtimeExtensionsInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/extensions/electron-sandbox/extensionsActions", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/ipc/electron-sandbox/services", "vs/platform/extensionRecommendations/common/extensionRecommendationsIpc", "vs/base/common/codicons", "vs/workbench/contrib/extensions/electron-sandbox/remoteExtensionsInit", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/extensions/electron-sandbox/extensionProfileService", "vs/workbench/contrib/extensions/electron-sandbox/extensionsAutoProfiler", "vs/base/common/lifecycle"], function (require, exports, nls_1, platform_1, actions_1, contributions_1, descriptors_1, commands_1, instantiation_1, editor_1, runtimeExtensionsEditor_1, debugExtensionHostAction_1, editor_2, contextkeys_1, runtimeExtensionsInput_1, contextkey_1, extensionsActions_1, extensionRecommendations_1, services_1, extensionRecommendationsIpc_1, codicons_1, remoteExtensionsInit_1, extensions_1, extensionProfileService_1, extensionsAutoProfiler_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Singletons
    (0, extensions_1.registerSingleton)(runtimeExtensionsEditor_1.IExtensionHostProfileService, extensionProfileService_1.ExtensionHostProfileService, 1 /* InstantiationType.Delayed */);
    // Running Extensions Editor
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(runtimeExtensionsEditor_1.RuntimeExtensionsEditor, runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID, (0, nls_1.localize)('runtimeExtension', "Running Extensions")), [new descriptors_1.SyncDescriptor(runtimeExtensionsInput_1.RuntimeExtensionsInput)]);
    class RuntimeExtensionsInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '';
        }
        deserialize(instantiationService) {
            return runtimeExtensionsInput_1.RuntimeExtensionsInput.instance;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(runtimeExtensionsInput_1.RuntimeExtensionsInput.ID, RuntimeExtensionsInputSerializer);
    // Global actions
    let ExtensionsContributions = class ExtensionsContributions extends lifecycle_1.Disposable {
        constructor(extensionRecommendationNotificationService, sharedProcessService) {
            super();
            sharedProcessService.registerChannel('extensionRecommendationNotification', new extensionRecommendationsIpc_1.ExtensionRecommendationNotificationServiceChannel(extensionRecommendationNotificationService));
            this._register((0, actions_1.registerAction2)(extensionsActions_1.OpenExtensionsFolderAction));
            this._register((0, actions_1.registerAction2)(extensionsActions_1.CleanUpExtensionsFolderAction));
        }
    };
    ExtensionsContributions = __decorate([
        __param(0, extensionRecommendations_1.IExtensionRecommendationNotificationService),
        __param(1, services_1.ISharedProcessService)
    ], ExtensionsContributions);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExtensionsContributions, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsAutoProfiler_1.ExtensionsAutoProfiler, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(remoteExtensionsInit_1.RemoteExtensionsInitializerContribution, 3 /* LifecyclePhase.Restored */);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand(debugExtensionHostAction_1.DebugExtensionHostAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(debugExtensionHostAction_1.DebugExtensionHostAction).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.StartExtensionHostProfileAction, runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.StartExtensionHostProfileAction.LABEL).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.StopExtensionHostProfileAction, runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.StopExtensionHostProfileAction.LABEL).run();
    });
    commands_1.CommandsRegistry.registerCommand(runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID, (accessor) => {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        instantiationService.createInstance(runtimeExtensionsEditor_1.SaveExtensionHostProfileAction, runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID, runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.LABEL).run();
    });
    // Running extensions
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: debugExtensionHostAction_1.DebugExtensionHostAction.ID,
            title: debugExtensionHostAction_1.DebugExtensionHostAction.LABEL,
            icon: codicons_1.Codicon.debugStart
        },
        group: 'navigation',
        when: contextkeys_1.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: runtimeExtensionsEditor_1.StartExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.StartExtensionHostProfileAction.LABEL,
            icon: codicons_1.Codicon.circleFilled
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID), runtimeExtensionsEditor_1.CONTEXT_PROFILE_SESSION_STATE.notEqualsTo('running'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: runtimeExtensionsEditor_1.StopExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.StopExtensionHostProfileAction.LABEL,
            icon: codicons_1.Codicon.debugStop
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID), runtimeExtensionsEditor_1.CONTEXT_PROFILE_SESSION_STATE.isEqualTo('running'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.ID,
            title: runtimeExtensionsEditor_1.SaveExtensionHostProfileAction.LABEL,
            icon: codicons_1.Codicon.saveAll,
            precondition: runtimeExtensionsEditor_1.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED
        },
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorContext.isEqualTo(runtimeExtensionsEditor_1.RuntimeExtensionsEditor.ID))
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9ucy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9leHRlbnNpb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQTZCaEcsYUFBYTtJQUNiLElBQUEsOEJBQWlCLEVBQUMsc0RBQTRCLEVBQUUscURBQTJCLG9DQUE0QixDQUFDO0lBRXhHLDRCQUE0QjtJQUM1QixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQy9FLDZCQUFvQixDQUFDLE1BQU0sQ0FBQyxpREFBdUIsRUFBRSxpREFBdUIsQ0FBQyxFQUFFLEVBQUUsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxFQUNwSSxDQUFDLElBQUksNEJBQWMsQ0FBQywrQ0FBc0IsQ0FBQyxDQUFDLENBQzVDLENBQUM7SUFFRixNQUFNLGdDQUFnQztRQUNyQyxZQUFZLENBQUMsV0FBd0I7WUFDcEMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsU0FBUyxDQUFDLFdBQXdCO1lBQ2pDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUNELFdBQVcsQ0FBQyxvQkFBMkM7WUFDdEQsT0FBTywrQ0FBc0IsQ0FBQyxRQUFRLENBQUM7UUFDeEMsQ0FBQztLQUNEO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLHlCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLCtDQUFzQixDQUFDLEVBQUUsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO0lBRzFKLGlCQUFpQjtJQUVqQixJQUFNLHVCQUF1QixHQUE3QixNQUFN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