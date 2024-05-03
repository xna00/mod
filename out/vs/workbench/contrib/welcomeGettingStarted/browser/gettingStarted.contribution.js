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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/editor", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/common/contributions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/welcomeGettingStarted/browser/startupPage", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/platform/action/common/actionCommonCategories", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedIcons"], function (require, exports, nls_1, gettingStarted_1, platform_1, editor_1, actions_1, instantiation_1, contextkey_1, editorService_1, editor_2, descriptors_1, gettingStartedService_1, gettingStartedInput_1, contributions_1, configurationRegistry_1, configuration_1, editorGroupsService_1, commands_1, quickInput_1, remoteAgentService_1, platform_2, extensionManagement_1, extensions_1, startupPage_1, extensionsInput_1, actionCommonCategories_1, icons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacePlatform = exports.icons = void 0;
    exports.icons = icons;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openWalkthrough',
                title: (0, nls_1.localize2)('miWelcome', 'Welcome'),
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '1_welcome',
                    order: 1,
                }
            });
        }
        run(accessor, walkthroughID, toSide) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const commandService = accessor.get(commands_1.ICommandService);
            if (walkthroughID) {
                const selectedCategory = typeof walkthroughID === 'string' ? walkthroughID : walkthroughID.category;
                const selectedStep = typeof walkthroughID === 'string' ? undefined : walkthroughID.category + '#' + walkthroughID.step;
                // We're trying to open the welcome page from the Help menu
                if (!selectedCategory && !selectedStep) {
                    editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { preserveFocus: toSide ?? false }
                    }, toSide ? editorService_1.SIDE_GROUP : undefined);
                    return;
                }
                // Try first to select the walkthrough on an active welcome page with no selected walkthrough
                for (const group of editorGroupsService.groups) {
                    if (group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput) {
                        group.activeEditorPane.makeCategoryVisibleWhenAvailable(selectedCategory, selectedStep);
                        return;
                    }
                }
                // Otherwise, try to find a welcome input somewhere with no selected walkthrough, and open it to this one.
                const result = editorService.findEditors({ typeId: gettingStartedInput_1.GettingStartedInput.ID, editorId: undefined, resource: gettingStartedInput_1.GettingStartedInput.RESOURCE });
                for (const { editor, groupId } of result) {
                    if (editor instanceof gettingStartedInput_1.GettingStartedInput) {
                        const group = editorGroupsService.getGroup(groupId);
                        if (!editor.selectedCategory && group) {
                            editor.selectedCategory = selectedCategory;
                            editor.selectedStep = selectedStep;
                            group.openEditor(editor, { revealIfOpened: true });
                            return;
                        }
                    }
                }
                const activeEditor = editorService.activeEditor;
                // If the walkthrough is already open just reveal the step
                if (selectedStep && activeEditor instanceof gettingStartedInput_1.GettingStartedInput && activeEditor.selectedCategory === selectedCategory) {
                    commandService.executeCommand('walkthroughs.selectStep', selectedStep);
                    return;
                }
                // If it's the extension install page then lets replace it with the getting started page
                if (activeEditor instanceof extensionsInput_1.ExtensionsInput) {
                    const activeGroup = editorGroupsService.activeGroup;
                    activeGroup.replaceEditors([{
                            editor: activeEditor,
                            replacement: instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, { selectedCategory: selectedCategory, selectedStep: selectedStep })
                        }]);
                }
                else {
                    // else open respecting toSide
                    editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { selectedCategory: selectedCategory, selectedStep: selectedStep, preserveFocus: toSide ?? false }
                    }, toSide ? editorService_1.SIDE_GROUP : undefined).then((editor) => {
                        editor?.makeCategoryVisibleWhenAvailable(selectedCategory, selectedStep);
                    });
                }
            }
            else {
                editorService.openEditor({
                    resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                    options: { preserveFocus: toSide ?? false }
                }, toSide ? editorService_1.SIDE_GROUP : undefined);
            }
        }
    });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(gettingStartedInput_1.GettingStartedInput.ID, gettingStarted_1.GettingStartedInputSerializer);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(gettingStarted_1.GettingStartedPage, gettingStarted_1.GettingStartedPage.ID, (0, nls_1.localize)('welcome', "Welcome")), [
        new descriptors_1.SyncDescriptor(gettingStartedInput_1.GettingStartedInput)
    ]);
    const category = (0, nls_1.localize2)('welcome', "Welcome");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.goBack',
                title: (0, nls_1.localize2)('welcome.goBack', 'Go Back'),
                category,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                    when: gettingStarted_1.inWelcomeContext
                },
                precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', 'gettingStartedPage'),
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.escape();
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'walkthroughs.selectStep',
        handler: (accessor, stepID) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.selectStepLoose(stepID);
            }
            else {
                console.error('Cannot run walkthroughs.selectStep outside of walkthrough context');
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepComplete',
                title: (0, nls_1.localize)('welcome.markStepComplete', "Mark Step Complete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.progressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepIncomplete',
                title: (0, nls_1.localize)('welcome.markStepInomplete', "Mark Step Incomplete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.deprogressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.showAllWalkthroughs',
                title: (0, nls_1.localize2)('welcome.showAllWalkthroughs', 'Open Walkthrough...'),
                category,
                f1: true,
            });
        }
        async getQuickPickItems(contextService, gettingStartedService) {
            const categories = await gettingStartedService.getWalkthroughs();
            return categories
                .filter(c => contextService.contextMatchesRules(c.when))
                .map(x => ({
                id: x.id,
                label: x.title,
                detail: x.description,
                description: x.source,
            }));
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const contextService = accessor.get(contextkey_1.IContextKeyService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const quickPick = quickInputService.createQuickPick();
            quickPick.canSelectMany = false;
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;
            quickPick.placeholder = (0, nls_1.localize)('pickWalkthroughs', 'Select a walkthrough to open');
            quickPick.items = await this.getQuickPickItems(contextService, gettingStartedService);
            quickPick.busy = true;
            quickPick.onDidAccept(() => {
                const selection = quickPick.selectedItems[0];
                if (selection) {
                    commandService.executeCommand('workbench.action.openWalkthrough', selection.id);
                }
                quickPick.hide();
            });
            quickPick.onDidHide(() => quickPick.dispose());
            await extensionService.whenInstalledExtensionsRegistered();
            gettingStartedService.onDidAddWalkthrough(async () => {
                quickPick.items = await this.getQuickPickItems(contextService, gettingStartedService);
            });
            quickPick.show();
            quickPick.busy = false;
        }
    });
    exports.WorkspacePlatform = new contextkey_1.RawContextKey('workspacePlatform', undefined, (0, nls_1.localize)('workspacePlatform', "The platform of the current workspace, which in remote or serverless contexts may be different from the platform of the UI"));
    let WorkspacePlatformContribution = class WorkspacePlatformContribution {
        static { this.ID = 'workbench.contrib.workspacePlatform'; }
        constructor(extensionManagementServerService, remoteAgentService, contextService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.remoteAgentService = remoteAgentService;
            this.contextService = contextService;
            this.remoteAgentService.getEnvironment().then(env => {
                const remoteOS = env?.os;
                const remotePlatform = remoteOS === 2 /* OS.Macintosh */ ? 'mac'
                    : remoteOS === 1 /* OS.Windows */ ? 'windows'
                        : remoteOS === 3 /* OS.Linux */ ? 'linux'
                            : undefined;
                if (remotePlatform) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set(remotePlatform);
                }
                else if (this.extensionManagementServerService.localExtensionManagementServer) {
                    if (platform_2.isMacintosh) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('mac');
                    }
                    else if (platform_2.isLinux) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('linux');
                    }
                    else if (platform_2.isWindows) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('windows');
                    }
                }
                else if (this.extensionManagementServerService.webExtensionManagementServer) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set('webworker');
                }
                else {
                    console.error('Error: Unable to detect workspace platform');
                }
            });
        }
    };
    WorkspacePlatformContribution = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, contextkey_1.IContextKeyService)
    ], WorkspacePlatformContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_1.workbenchConfigurationNodeBase,
        properties: {
            'workbench.welcomePage.walkthroughs.openOnInstall': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: true,
                description: (0, nls_1.localize)('workbench.welcomePage.walkthroughs.openOnInstall', "When enabled, an extension's walkthrough will open upon install of the extension.")
            },
            'workbench.startupEditor': {
                'scope': 4 /* ConfigurationScope.RESOURCE */,
                'type': 'string',
                'enum': ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench', 'terminal'],
                'enumDescriptions': [
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.none' }, "Start without an editor."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePage' }, "Open the Welcome page, with content to aid in getting started with VS Code and extensions."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.readme' }, "Open the README when opening a folder that contains one, fallback to 'welcomePage' otherwise. Note: This is only observed as a global configuration, it will be ignored if set in a workspace or folder configuration."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.newUntitledFile' }, "Open a new untitled text file (only applies when opening an empty window)."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePageInEmptyWorkbench' }, "Open the Welcome page when opening an empty workbench."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.terminal' }, "Open a new terminal in the editor area."),
                ],
                'default': 'welcomePage',
                'description': (0, nls_1.localize)('workbench.startupEditor', "Controls which editor is shown at startup, if none are restored from the previous session.")
            },
            'workbench.welcomePage.preferReducedMotion': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                deprecationMessage: (0, nls_1.localize)('deprecationMessage', "Deprecated, use the global `workbench.reduceMotion`."),
                description: (0, nls_1.localize)('workbench.welcomePage.preferReducedMotion', "When enabled, reduce motion in welcome page.")
            }
        }
    });
    (0, contributions_1.registerWorkbenchContribution2)(WorkspacePlatformContribution.ID, WorkspacePlatformContribution, 3 /* WorkbenchPhase.AfterRestored */);
    (0, contributions_1.registerWorkbenchContribution2)(startupPage_1.StartupPageEditorResolverContribution.ID, startupPage_1.StartupPageEditorResolverContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(startupPage_1.StartupPageRunnerContribution.ID, startupPage_1.StartupPageRunnerContribution, 3 /* WorkbenchPhase.AfterRestored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWQuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvYnJvd3Nlci9nZXR0aW5nU3RhcnRlZC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJoRyxzQkFBZ0c7SUFFaEcsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztnQkFDeEMsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7b0JBQzFCLEtBQUssRUFBRSxXQUFXO29CQUNsQixLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQ1QsUUFBMEIsRUFDMUIsYUFBc0UsRUFDdEUsTUFBMkI7WUFFM0IsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFvQixDQUFDLENBQUM7WUFDL0QsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxDQUFDLENBQUM7WUFFckQsSUFBSSxhQUFhLEVBQUUsQ0FB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