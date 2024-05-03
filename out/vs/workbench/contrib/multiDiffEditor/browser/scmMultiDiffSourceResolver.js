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
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, event_1, lifecycle_1, observable_1, uri_1, nls_1, actions_1, contextkey_1, instantiation_1, multiDiffSourceResolverService_1, scm_1, editorService_1) {
    "use strict";
    var ScmMultiDiffSourceResolver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenScmGroupAction = exports.ScmMultiDiffSourceResolverContribution = exports.ScmMultiDiffSourceResolver = void 0;
    let ScmMultiDiffSourceResolver = class ScmMultiDiffSourceResolver {
        static { ScmMultiDiffSourceResolver_1 = this; }
        static { this._scheme = 'scm-multi-diff-source'; }
        static getMultiDiffSourceUri(repositoryUri, groupId) {
            return uri_1.URI.from({
                scheme: ScmMultiDiffSourceResolver_1._scheme,
                query: JSON.stringify({ repositoryUri, groupId }),
            });
        }
        static parseUri(uri) {
            if (uri.scheme !== ScmMultiDiffSourceResolver_1._scheme) {
                return undefined;
            }
            let query;
            try {
                query = JSON.parse(uri.query);
            }
            catch (e) {
                return undefined;
            }
            if (typeof query !== 'object' || query === null) {
                return undefined;
            }
            const { repositoryUri, groupId } = query;
            if (typeof repositoryUri !== 'string' || typeof groupId !== 'string') {
                return undefined;
            }
            return { repositoryUri: uri_1.URI.parse(repositoryUri), groupId };
        }
        constructor(_scmService) {
            this._scmService = _scmService;
        }
        canHandleUri(uri) {
            return ScmMultiDiffSourceResolver_1.parseUri(uri) !== undefined;
        }
        async resolveDiffSource(uri) {
            const { repositoryUri, groupId } = ScmMultiDiffSourceResolver_1.parseUri(uri);
            const repository = await promiseFromEventState(this._scmService.onDidAddRepository, () => {
                const repository = [...this._scmService.repositories].find(r => r.provider.rootUri?.toString() === repositoryUri.toString());
                return repository ?? false;
            });
            const group = await promiseFromEventState(repository.provider.onDidChangeResourceGroups, () => {
                const group = repository.provider.groups.find(g => g.id === groupId);
                return group ?? false;
            });
            const resources = (0, observable_1.observableFromEvent)(group.onDidChangeResources, () => group.resources.map(e => {
                return {
                    original: e.multiDiffEditorOriginalUri,
                    modified: e.multiDiffEditorModifiedUri
                };
            }));
            return new ScmResolvedMultiDiffSource(resources, {
                scmResourceGroup: groupId,
                scmProvider: repository.provider.contextValue,
            });
        }
    };
    exports.ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver;
    exports.ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver = ScmMultiDiffSourceResolver_1 = __decorate([
        __param(0, scm_1.ISCMService)
    ], ScmMultiDiffSourceResolver);
    class ScmResolvedMultiDiffSource {
        get resources() { return this._resources.get(); }
        constructor(_resources, contextKeys) {
            this._resources = _resources;
            this.contextKeys = contextKeys;
            this.onDidChange = event_1.Event.fromObservableLight(this._resources);
        }
    }
    function promiseFromEventState(event, checkState) {
        const state = checkState();
        if (state) {
            return Promise.resolve(state);
        }
        return new Promise(resolve => {
            const listener = event(() => {
                const state = checkState();
                if (state) {
                    listener.dispose();
                    resolve(state);
                }
            });
        });
    }
    let ScmMultiDiffSourceResolverContribution = class ScmMultiDiffSourceResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.scmMultiDiffSourceResolver'; }
        constructor(instantiationService, multiDiffSourceResolverService) {
            super();
            this._register(multiDiffSourceResolverService.registerResolver(instantiationService.createInstance(ScmMultiDiffSourceResolver)));
        }
    };
    exports.ScmMultiDiffSourceResolverContribution = ScmMultiDiffSourceResolverContribution;
    exports.ScmMultiDiffSourceResolverContribution = ScmMultiDiffSourceResolverContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, multiDiffSourceResolverService_1.IMultiDiffSourceResolverService)
    ], ScmMultiDiffSourceResolverContribution);
    class OpenScmGroupAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.openScmDiff',
                title: (0, nls_1.localize2)('viewChanges', 'View Changes'),
                icon: codicons_1.Codicon.diffMultiple,
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('config.multiDiffEditor.experimental.enabled'), contextkey_1.ContextKeyExpr.has('multiDiffEditorEnableViewChanges')),
                    id: actions_1.MenuId.SCMResourceGroupContext,
                    group: 'inline',
                },
                f1: false,
            });
        }
        async run(accessor, group) {
            const editorService = accessor.get(editorService_1.IEditorService);
            if (!group.provider.rootUri) {
                return;
            }
            const multiDiffSource = ScmMultiDiffSourceResolver.getMultiDiffSourceUri(group.provider.rootUri.toString(), group.id);
            const label = (0, nls_1.localize)('scmDiffLabel', '{0}: {1}', group.provider.label, group.label);
            await editorService.openEditor({ label, multiDiffSource });
        }
    }
    exports.OpenScmGroupAction = OpenScmGroupAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtTXVsdGlEaWZmU291cmNlUmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL211bHRpRGlmZkVkaXRvci9icm93c2VyL3NjbU11bHRpRGlmZlNvdXJjZVJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFlekYsSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMEI7O2lCQUNkLFlBQU8sR0FBRyx1QkFBdUIsQUFBMUIsQ0FBMkI7UUFFbkQsTUFBTSxDQUFDLHFCQUFxQixDQUFDLGFBQXFCLEVBQUUsT0FBZTtZQUN6RSxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2YsTUFBTSxFQUFFLDRCQUEwQixDQUFDLE9BQU87Z0JBQzFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBc0IsQ0FBQzthQUNyRSxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFRO1lBQy9CLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyw0QkFBMEIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksS0FBZ0IsQ0FBQztZQUNyQixJQUFJLENBQUM7Z0JBQ0osS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBYyxDQUFDO1lBQzVDLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2pELE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxHQUFHLEtBQUssQ0FBQztZQUN6QyxJQUFJLE9BQU8sYUFBYSxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEUsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sRUFBRSxhQUFhLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUM3RCxDQUFDO1FBRUQsWUFDK0IsV0FBd0I7WUFBeEIsZ0JBQVcsR0FBWCxXQUFXLENBQWE7UUFFdkQsQ0FBQztRQUVELFlBQVksQ0FBQyxHQUFRO1lBQ3BCLE9BQU8sNEJBQTBCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQVE7WUFDL0IsTUFBTSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsR0FBRyw0QkFBMEIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFFLENBQUM7WUFFN0UsTUFBTSxVQUFVLEdBQUcsTUFBTSxxQkFBcUIsQ0FDN0MsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFDbkMsR0FBRyxFQUFFO2dCQUNKLE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUM3SCxPQUFPLFVBQVUsSUFBSSxLQUFLLENBQUM7WUFDNUIsQ0FBQyxDQUNELENBQUM7WUFFRixNQUFNLEtBQUssR0FBRyxNQUFNLHFCQUFxQixDQUN4QyxVQUFVLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUM3QyxHQUFHLEVBQUU7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQztnQkFDckUsT0FBTyxLQUFLLElBQUksS0FBSyxDQUFDO1lBQ3ZCLENBQUMsQ0FDRCxDQUFDO1lBRUYsTUFBTSxTQUFTLEdBQUcsSUFBQSxnQ0FBbUIsRUFBd0IsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN0SCxPQUFPO29CQUNOLFFBQVEsRUFBRSxDQUFDLENBQUMsMEJBQTBCO29CQUN0QyxRQUFRLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQjtpQkFDdEMsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixPQUFPLElBQUksMEJBQTBCLENBQUMsU0FBUyxFQUFFO2dCQUNoRCxnQkFBZ0IsRUFBRSxPQUFPO2dCQUN6QixXQUFXLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxZQUFZO2FBQzdDLENBQUMsQ0FBQztRQUNKLENBQUM7O0lBekVXLGdFQUEwQjt5Q0FBMUIsMEJBQTBCO1FBbUNwQyxXQUFBLGlCQUFXLENBQUE7T0FuQ0QsMEJBQTBCLENBMEV0QztJQUVELE1BQU0sMEJBQTBCO1FBQy9CLElBQUksU0FBUyxLQUFxQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBR2pGLFlBQ2tCLFVBQXVELEVBQ3hELFdBQXdEO1lBRHZELGVBQVUsR0FBVixVQUFVLENBQTZDO1lBQ3hELGdCQUFXLEdBQVgsV0FBVyxDQUE2QztZQUp6RCxnQkFBVyxHQUFHLGFBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFNekUsQ0FBQztLQUNEO0lBT0QsU0FBUyxxQkFBcUIsQ0FBSSxLQUFpQixFQUFFLFVBQTJCO1FBQy9FLE1BQU0sS0FBSyxHQUFHLFVBQVUsRUFBRSxDQUFDO1FBQzNCLElBQUksS0FBSyxFQUFFLENBQUM7WUFDWCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVELE9BQU8sSUFBSSxPQUFPLENBQUksT0FBTyxDQUFDLEVBQUU7WUFDL0IsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDM0IsTUFBTSxLQUFLLEdBQUcsVUFBVSxFQUFFLENBQUM7Z0JBQzNCLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVNLElBQU0sc0NBQXNDLEdBQTVDLE1BQU0sc0NBQXVDLFNBQVEsc0JBQVU7aUJBRXJELE9BQUUsR0FBRyw4Q0FBOEMsQUFBakQsQ0FBa0Q7UUFFcEUsWUFDd0Isb0JBQTJDLEVBQ2pDLDhCQUErRDtZQUVoRyxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xJLENBQUM7O0lBWFcsd0ZBQXNDO3FEQUF0QyxzQ0FBc0M7UUFLaEQsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGdFQUErQixDQUFBO09BTnJCLHNDQUFzQyxDQVlsRDtJQUVELE1BQWEsa0JBQW1CLFNBQVEsaUJBQU87UUFDOUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDZCQUE2QjtnQkFDakMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLGFBQWEsRUFBRSxjQUFjLENBQUM7Z0JBQy9DLElBQUksRUFBRSxrQkFBTyxDQUFDLFlBQVk7Z0JBQzFCLElBQUksRUFBRTtvQkFDTCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDLEVBQ2pFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDLENBQ3REO29CQUNELEVBQUUsRUFBRSxnQkFBTSxDQUFDLHVCQUF1QjtvQkFDbEMsS0FBSyxFQUFFLFFBQVE7aUJBQ2Y7Z0JBQ0QsRUFBRSxFQUFFLEtBQUs7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLEtBQXdCO1lBQzdELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0SCxNQUFNLEtBQUssR0FBRyxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RixNQUFNLGFBQWEsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUM1RCxDQUFDO0tBQ0Q7SUE1QkQsZ0RBNEJDIn0=