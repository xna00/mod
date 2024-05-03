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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/uri", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/preferences/common/preferences", "vs/platform/commands/common/commands", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding"], function (require, exports, actions_1, uri_1, getIconClasses_1, model_1, language_1, nls, quickInput_1, preferences_1, commands_1, platform_1, configurationRegistry_1, editorExtensions_1, actions_2, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureLanguageBasedSettingsAction = void 0;
    let ConfigureLanguageBasedSettingsAction = class ConfigureLanguageBasedSettingsAction extends actions_1.Action {
        static { this.ID = 'workbench.action.configureLanguageBasedSettings'; }
        static { this.LABEL = nls.localize2('configureLanguageBasedSettings', "Configure Language Specific Settings..."); }
        constructor(id, label, modelService, languageService, quickInputService, preferencesService) {
            super(id, label);
            this.modelService = modelService;
            this.languageService = languageService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
        }
        async run() {
            const languages = this.languageService.getSortedRegisteredLanguageNames();
            const picks = languages.map(({ languageName, languageId }) => {
                const description = nls.localize('languageDescriptionConfigured', "({0})", languageId);
                // construct a fake resource to be able to show nice icons if any
                let fakeResource;
                const extensions = this.languageService.getExtensions(languageId);
                if (extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = this.languageService.getFilenames(languageId);
                    if (filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
                return {
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, fakeResource),
                    description
                };
            });
            await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language") })
                .then(pick => {
                if (pick) {
                    const languageId = this.languageService.getLanguageIdByLanguageName(pick.label);
                    if (typeof languageId === 'string') {
                        return this.preferencesService.openLanguageSpecificSettings(languageId);
                    }
                }
                return undefined;
            });
        }
    };
    exports.ConfigureLanguageBasedSettingsAction = ConfigureLanguageBasedSettingsAction;
    exports.ConfigureLanguageBasedSettingsAction = ConfigureLanguageBasedSettingsAction = __decorate([
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, preferences_1.IPreferencesService)
    ], ConfigureLanguageBasedSettingsAction);
    // Register a command that gets all settings
    commands_1.CommandsRegistry.registerCommand({
        id: '_getAllSettings',
        handler: () => {
            const configRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const allSettings = configRegistry.getConfigurationProperties();
            return allSettings;
        }
    });
    //#region --- Register a command to get all actions from the command palette
    commands_1.CommandsRegistry.registerCommand('_getAllCommands', function (accessor) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const actions = [];
        for (const editorAction of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
            const keybinding = keybindingService.lookupKeybinding(editorAction.id);
            actions.push({ command: editorAction.id, label: editorAction.label, precondition: editorAction.precondition?.serialize(), keybinding: keybinding?.getLabel() ?? 'Not set' });
        }
        for (const menuItem of actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.CommandPalette)) {
            if ((0, actions_2.isIMenuItem)(menuItem)) {
                const title = typeof menuItem.command.title === 'string' ? menuItem.command.title : menuItem.command.title.value;
                const category = menuItem.command.category ? typeof menuItem.command.category === 'string' ? menuItem.command.category : menuItem.command.category.value : undefined;
                const label = category ? `${category}: ${title}` : title;
                const keybinding = keybindingService.lookupKeybinding(menuItem.command.id);
                actions.push({ command: menuItem.command.id, label, precondition: menuItem.when?.serialize(), keybinding: keybinding?.getLabel() ?? 'Not set' });
            }
        }
        return actions;
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3ByZWZlcmVuY2VzQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQnpGLElBQU0sb0NBQW9DLEdBQTFDLE1BQU0sb0NBQXFDLFNBQVEsZ0JBQU07aUJBRS9DLE9BQUUsR0FBRyxpREFBaUQsQUFBcEQsQ0FBcUQ7aUJBQ3ZELFVBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxFQUFFLHlDQUF5QyxDQUFDLEFBQTdGLENBQThGO1FBRW5ILFlBQ0MsRUFBVSxFQUNWLEtBQWEsRUFDbUIsWUFBMkIsRUFDeEIsZUFBaUMsRUFDL0IsaUJBQXFDLEVBQ3BDLGtCQUF1QztZQUU3RSxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBTGUsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQy9CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDcEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUc5RSxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUc7WUFDakIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1lBQzFFLE1BQU0sS0FBSyxHQUFxQixTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTtnQkFDOUUsTUFBTSxXQUFXLEdBQVcsR0FBRyxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQy9GLGlFQUFpRTtn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