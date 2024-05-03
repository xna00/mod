/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/types", "vs/editor/common/model/textModel", "vs/workbench/contrib/searchEditor/browser/constants", "vs/base/common/event", "vs/base/common/map", "vs/workbench/services/search/common/search"], function (require, exports, model_1, language_1, instantiation_1, searchEditorSerialization_1, workingCopyBackup_1, types_1, textModel_1, constants_1, event_1, map_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.searchEditorModelFactory = exports.SearchEditorModel = exports.SearchConfigurationModel = void 0;
    class SearchConfigurationModel {
        constructor(config) {
            this.config = config;
            this._onConfigDidUpdate = new event_1.Emitter();
            this.onConfigDidUpdate = this._onConfigDidUpdate.event;
        }
        updateConfig(config) { this.config = config; this._onConfigDidUpdate.fire(config); }
    }
    exports.SearchConfigurationModel = SearchConfigurationModel;
    class SearchEditorModel {
        constructor(resource) {
            this.resource = resource;
        }
        async resolve() {
            return (0, types_1.assertIsDefined)(exports.searchEditorModelFactory.models.get(this.resource)).resolve();
        }
    }
    exports.SearchEditorModel = SearchEditorModel;
    class SearchEditorModelFactory {
        constructor() {
            this.models = new map_1.ResourceMap();
        }
        initializeModelFromExistingModel(accessor, resource, config) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            return Promise.resolve({
                                resultsModel: modelService.getModel(resource) ?? modelService.createModel('', languageService.createById(search_1.SEARCH_RESULT_LANGUAGE_ID), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        initializeModelFromRawData(accessor, resource, config, contents) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            return Promise.resolve({
                                resultsModel: modelService.createModel(contents ?? '', languageService.createById(search_1.SEARCH_RESULT_LANGUAGE_ID), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        initializeModelFromExistingFile(accessor, resource, existingFile) {
            if (this.models.has(resource)) {
                throw Error('Unable to contruct model for resource that already exists');
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const modelService = accessor.get(model_1.IModelService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            let ongoingResolve;
            this.models.set(resource, {
                resolve: async () => {
                    if (!ongoingResolve) {
                        ongoingResolve = (async () => {
                            const backup = await this.tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService);
                            if (backup) {
                                return backup;
                            }
                            const { text, config } = await instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, existingFile);
                            return ({
                                resultsModel: modelService.createModel(text ?? '', languageService.createById(search_1.SEARCH_RESULT_LANGUAGE_ID), resource),
                                configurationModel: new SearchConfigurationModel(config)
                            });
                        })();
                    }
                    return ongoingResolve;
                }
            });
        }
        async tryFetchModelFromBackupService(resource, languageService, modelService, workingCopyBackupService, instantiationService) {
            const backup = await workingCopyBackupService.resolve({ resource, typeId: constants_1.SearchEditorWorkingCopyTypeId });
            let model = modelService.getModel(resource);
            if (!model && backup) {
                const factory = await (0, textModel_1.createTextBufferFactoryFromStream)(backup.value);
                model = modelService.createModel(factory, languageService.createById(search_1.SEARCH_RESULT_LANGUAGE_ID), resource);
            }
            if (model) {
                const existingFile = model.getValue();
                const { text, config } = (0, searchEditorSerialization_1.parseSerializedSearchEditor)(existingFile);
                modelService.destroyModel(resource);
                return ({
                    resultsModel: modelService.createModel(text ?? '', languageService.createById(search_1.SEARCH_RESULT_LANGUAGE_ID), resource),
                    configurationModel: new SearchConfigurationModel(config)
                });
            }
            else {
                return undefined;
            }
        }
    }
    exports.searchEditorModelFactory = new SearchEditorModelFactory();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRWRpdG9yTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaEVkaXRvci9icm93c2VyL3NlYXJjaEVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1CaEcsTUFBYSx3QkFBd0I7UUFJcEMsWUFBbUIsTUFBcUM7WUFBckMsV0FBTSxHQUFOLE1BQU0sQ0FBK0I7WUFIaEQsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQXVCLENBQUM7WUFDaEQsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztRQUVOLENBQUM7UUFDN0QsWUFBWSxDQUFDLE1BQTJCLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN6RztJQU5ELDREQU1DO0lBRUQsTUFBYSxpQkFBaUI7UUFDN0IsWUFDUyxRQUFhO1lBQWIsYUFBUSxHQUFSLFFBQVEsQ0FBSztRQUNsQixDQUFDO1FBRUwsS0FBSyxDQUFDLE9BQU87WUFDWixPQUFPLElBQUEsdUJBQWUsRUFBQyxnQ0FBd0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3RGLENBQUM7S0FDRDtJQVJELDhDQVFDO0lBRUQsTUFBTSx3QkFBd0I7UUFHN0I7WUFGQSxXQUFNLEdBQUcsSUFBSSxpQkFBVyxFQUFnRCxDQUFDO1FBRXpELENBQUM7UUFFakIsZ0NBQWdDLENBQUMsUUFBMEIsRUFBRSxRQUFhLEVBQUUsTUFBMkI7WUFDdEcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdB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