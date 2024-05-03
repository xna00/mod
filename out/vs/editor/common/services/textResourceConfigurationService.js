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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, position_1, language_1, model_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextResourceConfigurationService = void 0;
    let TextResourceConfigurationService = class TextResourceConfigurationService extends lifecycle_1.Disposable {
        constructor(configurationService, modelService, languageService) {
            super();
            this.configurationService = configurationService;
            this.modelService = modelService;
            this.languageService = languageService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.configurationService.onDidChangeConfiguration(e => this._onDidChangeConfiguration.fire(this.toResourceConfigurationChangeEvent(e))));
        }
        getValue(resource, arg2, arg3) {
            if (typeof arg3 === 'string') {
                return this._getValue(resource, position_1.Position.isIPosition(arg2) ? arg2 : null, arg3);
            }
            return this._getValue(resource, null, typeof arg2 === 'string' ? arg2 : undefined);
        }
        updateValue(resource, key, value, configurationTarget) {
            const language = this.getLanguage(resource, null);
            const configurationValue = this.configurationService.inspect(key, { resource, overrideIdentifier: language });
            if (configurationTarget === undefined) {
                configurationTarget = this.deriveConfigurationTarget(configurationValue, language);
            }
            switch (configurationTarget) {
                case 8 /* ConfigurationTarget.MEMORY */:
                    return this._updateValue(key, value, configurationTarget, configurationValue.memory?.override, resource, language);
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return this._updateValue(key, value, configurationTarget, configurationValue.workspaceFolder?.override, resource, language);
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return this._updateValue(key, value, configurationTarget, configurationValue.workspace?.override, resource, language);
                case 4 /* ConfigurationTarget.USER_REMOTE */:
                    return this._updateValue(key, value, configurationTarget, configurationValue.userRemote?.override, resource, language);
                default:
                    return this._updateValue(key, value, configurationTarget, configurationValue.userLocal?.override, resource, language);
            }
        }
        _updateValue(key, value, configurationTarget, overriddenValue, resource, language) {
            if (language && overriddenValue !== undefined) {
                return this.configurationService.updateValue(key, value, { resource, overrideIdentifier: language }, configurationTarget);
            }
            else {
                return this.configurationService.updateValue(key, value, { resource }, configurationTarget);
            }
        }
        deriveConfigurationTarget(configurationValue, language) {
            if (language) {
                if (configurationValue.memory?.override !== undefined) {
                    return 8 /* ConfigurationTarget.MEMORY */;
                }
                if (configurationValue.workspaceFolder?.override !== undefined) {
                    return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
                if (configurationValue.workspace?.override !== undefined) {
                    return 5 /* ConfigurationTarget.WORKSPACE */;
                }
                if (configurationValue.userRemote?.override !== undefined) {
                    return 4 /* ConfigurationTarget.USER_REMOTE */;
                }
                if (configurationValue.userLocal?.override !== undefined) {
                    return 3 /* ConfigurationTarget.USER_LOCAL */;
                }
            }
            if (configurationValue.memory?.value !== undefined) {
                return 8 /* ConfigurationTarget.MEMORY */;
            }
            if (configurationValue.workspaceFolder?.value !== undefined) {
                return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
            if (configurationValue.workspace?.value !== undefined) {
                return 5 /* ConfigurationTarget.WORKSPACE */;
            }
            if (configurationValue.userRemote?.value !== undefined) {
                return 4 /* ConfigurationTarget.USER_REMOTE */;
            }
            return 3 /* ConfigurationTarget.USER_LOCAL */;
        }
        _getValue(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            if (typeof section === 'undefined') {
                return this.configurationService.getValue({ resource, overrideIdentifier: language });
            }
            return this.configurationService.getValue(section, { resource, overrideIdentifier: language });
        }
        inspect(resource, position, section) {
            const language = resource ? this.getLanguage(resource, position) : undefined;
            return this.configurationService.inspect(section, { resource, overrideIdentifier: language });
        }
        getLanguage(resource, position) {
            const model = this.modelService.getModel(resource);
            if (model) {
                return position ? model.getLanguageIdAtPosition(position.lineNumber, position.column) : model.getLanguageId();
            }
            return this.languageService.guessLanguageIdByFilepathOrFirstLine(resource);
        }
        toResourceConfigurationChangeEvent(configurationChangeEvent) {
            return {
                affectedKeys: configurationChangeEvent.affectedKeys,
                affectsConfiguration: (resource, configuration) => {
                    const overrideIdentifier = resource ? this.getLanguage(resource, null) : undefined;
                    return configurationChangeEvent.affectsConfiguration(configuration, { resource, overrideIdentifier });
                }
            };
        }
    };
    exports.TextResourceConfigurationService = TextResourceConfigurationService;
    exports.TextResourceConfigurationService = TextResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], TextResourceConfigurationService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFJlc291cmNlQ29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvdGV4dFJlc291cmNlQ29uZmlndXJhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsc0JBQVU7UUFPL0QsWUFDd0Isb0JBQTRELEVBQ3BFLFlBQTRDLEVBQ3pDLGVBQWtEO1lBRXBFLEtBQUssRUFBRSxDQUFDO1lBSmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbkQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBTnBELDhCQUF5QixHQUFtRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QyxDQUFDLENBQUM7WUFDbEosNkJBQXdCLEdBQWlELElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUM7WUFRN0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxSixDQUFDO1FBSUQsUUFBUSxDQUFJLFFBQXlCLEVBQUUsSUFBVSxFQUFFLElBQVU7WUFDNUQsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxtQkFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakYsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRUQsV0FBVyxDQUFDLFFBQWEsRUFBRSxHQUFXLEVBQUUsS0FBVSxFQUFFLG1CQUF5QztZQUM1RixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDOUcsSUFBSSxtQkFBbUIsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7WUFDRCxRQUFRLG1CQUFtQixFQUFFLENBQUM7Z0JBQzdCO29CQUNDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNwSDtvQkFDQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0g7b0JBQ0MsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZIO29CQUNDLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN4SDtvQkFDQyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN4SCxDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVksQ0FBQyxHQUFXLEVBQUUsS0FBVSxFQUFFLG1CQUF3QyxFQUFFLGVBQWdDLEVBQUUsUUFBYSxFQUFFLFFBQXVCO1lBQy9KLElBQUksUUFBUSxJQUFJLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0MsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUMzSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQzdGLENBQUM7UUFDRixDQUFDO1FBRU8seUJBQXlCLENBQUMsa0JBQTRDLEVBQUUsUUFBdUI7WUFDdEcsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3ZELDBDQUFrQztnQkFDbkMsQ0FBQztnQkFDRCxJQUFJLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ2hFLG9EQUE0QztnQkFDN0MsQ0FBQztnQkFDRCxJQUFJLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFELDZDQUFxQztnQkFDdEMsQ0FBQztnQkFDRCxJQUFJLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzNELCtDQUF1QztnQkFDeEMsQ0FBQztnQkFDRCxJQUFJLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFELDhDQUFzQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3BELDBDQUFrQztZQUNuQyxDQUFDO1lBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM3RCxvREFBNEM7WUFDN0MsQ0FBQztZQUNELElBQUksa0JBQWtCLENBQUMsU0FBUyxFQUFFLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkQsNkNBQXFDO1lBQ3RDLENBQUM7WUFDRCxJQUFJLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3hELCtDQUF1QztZQUN4QyxDQUFDO1lBQ0QsOENBQXNDO1FBQ3ZDLENBQUM7UUFFTyxTQUFTLENBQUksUUFBeUIsRUFBRSxRQUEwQixFQUFFLE9BQTJCO1lBQ3RHLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUM3RSxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUNwQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUksRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUMxRixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFJLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25HLENBQUM7UUFFRCxPQUFPLENBQUksUUFBeUIsRUFBRSxRQUEwQixFQUFFLE9BQWU7WUFDaEYsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzdFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBSSxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRU8sV0FBVyxDQUFDLFFBQWEsRUFBRSxRQUEwQjtZQUM1RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMvRyxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLG9DQUFvQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFTyxrQ0FBa0MsQ0FBQyx3QkFBbUQ7WUFDN0YsT0FBTztnQkFDTixZQUFZLEVBQUUsd0JBQXdCLENBQUMsWUFBWTtnQkFDbkQsb0JBQW9CLEVBQUUsQ0FBQyxRQUF5QixFQUFFLGFBQXFCLEVBQUUsRUFBRTtvQkFDMUUsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ25GLE9BQU8sd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQztnQkFDdkcsQ0FBQzthQUNELENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQTtJQXBIWSw0RUFBZ0M7K0NBQWhDLGdDQUFnQztRQVExQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsMkJBQWdCLENBQUE7T0FWTixnQ0FBZ0MsQ0FvSDVDIn0=