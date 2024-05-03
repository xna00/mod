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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/services/editor/common/editorService"], function (require, exports, uri_1, event_1, model_1, resolverService_1, nls_1, instantiation_1, environmentVariable_1, terminalActions_1, editorService_1) {
    "use strict";
    var EnvironmentCollectionProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO: The rest of the terminal environment changes feature should move here https://github.com/microsoft/vscode/issues/177241
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.showEnvironmentContributions" /* TerminalCommandId.ShowEnvironmentContributions */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showEnvironmentContributions', 'Show Environment Contributions'),
        run: async (activeInstance, c, accessor, arg) => {
            const collection = activeInstance.extEnvironmentVariableCollection;
            if (collection) {
                const scope = arg;
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const outputProvider = instantiationService.createInstance(EnvironmentCollectionProvider);
                const editorService = accessor.get(editorService_1.IEditorService);
                const timestamp = new Date().getTime();
                const scopeDesc = scope?.workspaceFolder ? ` - ${scope.workspaceFolder.name}` : '';
                const textContent = await outputProvider.provideTextContent(uri_1.URI.from({
                    scheme: EnvironmentCollectionProvider.scheme,
                    path: `Environment changes${scopeDesc}`,
                    fragment: describeEnvironmentChanges(collection, scope),
                    query: `environment-collection-${timestamp}`
                }));
                if (textContent) {
                    await editorService.openEditor({
                        resource: textContent.uri
                    });
                }
            }
        }
    });
    function describeEnvironmentChanges(collection, scope) {
        let content = `# ${(0, nls_1.localize)('envChanges', 'Terminal Environment Changes')}`;
        const globalDescriptions = collection.getDescriptionMap(undefined);
        const workspaceDescriptions = collection.getDescriptionMap(scope);
        for (const [ext, coll] of collection.collections) {
            content += `\n\n## ${(0, nls_1.localize)('extension', 'Extension: {0}', ext)}`;
            content += '\n';
            const globalDescription = globalDescriptions.get(ext);
            if (globalDescription) {
                content += `\n${globalDescription}\n`;
            }
            const workspaceDescription = workspaceDescriptions.get(ext);
            if (workspaceDescription) {
                // Only show '(workspace)' suffix if there is already a description for the extension.
                const workspaceSuffix = globalDescription ? ` (${(0, nls_1.localize)('ScopedEnvironmentContributionInfo', 'workspace')})` : '';
                content += `\n${workspaceDescription}${workspaceSuffix}\n`;
            }
            for (const mutator of coll.map.values()) {
                if (filterScope(mutator, scope) === false) {
                    continue;
                }
                content += `\n- \`${mutatorTypeLabel(mutator.type, mutator.value, mutator.variable)}\``;
            }
        }
        return content;
    }
    function filterScope(mutator, scope) {
        if (!mutator.scope) {
            return true;
        }
        // Only mutators which are applicable on the relevant workspace should be shown.
        if (mutator.scope.workspaceFolder && scope?.workspaceFolder && mutator.scope.workspaceFolder.index === scope.workspaceFolder.index) {
            return true;
        }
        return false;
    }
    function mutatorTypeLabel(type, value, variable) {
        switch (type) {
            case environmentVariable_1.EnvironmentVariableMutatorType.Prepend: return `${variable}=${value}\${env:${variable}}`;
            case environmentVariable_1.EnvironmentVariableMutatorType.Append: return `${variable}=\${env:${variable}}${value}`;
            default: return `${variable}=${value}`;
        }
    }
    let EnvironmentCollectionProvider = class EnvironmentCollectionProvider {
        static { EnvironmentCollectionProvider_1 = this; }
        static { this.scheme = 'ENVIRONMENT_CHANGES_COLLECTION'; }
        constructor(textModelResolverService, _modelService) {
            this._modelService = _modelService;
            textModelResolverService.registerTextModelContentProvider(EnvironmentCollectionProvider_1.scheme, this);
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            return this._modelService.createModel(resource.fragment, { languageId: 'markdown', onDidChange: event_1.Event.None }, resource, false);
        }
    };
    EnvironmentCollectionProvider = EnvironmentCollectionProvider_1 = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], EnvironmentCollectionProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZW52aXJvbm1lbnRDaGFuZ2VzLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2Vudmlyb25tZW50Q2hhbmdlcy9icm93c2VyL3Rlcm1pbmFsLmVudmlyb25tZW50Q2hhbmdlcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY2hHLGdJQUFnSTtJQUVoSSxJQUFBLDhDQUE0QixFQUFDO1FBQzVCLEVBQUUsK0dBQWdEO1FBQ2xELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyx3REFBd0QsRUFBRSxnQ0FBZ0MsQ0FBQztRQUM1RyxHQUFHLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQy9DLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUNuRSxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixNQUFNLEtBQUssR0FBRyxHQUEyQyxDQUFDO2dCQUMxRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztnQkFDakUsTUFBTSxjQUFjLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZCQUE2QixDQUFDLENBQUM7Z0JBQzFGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN2QyxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxlQUFl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