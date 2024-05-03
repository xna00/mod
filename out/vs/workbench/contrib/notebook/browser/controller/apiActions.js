/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, glob, uri_1, commands_1, notebookCommon_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    commands_1.CommandsRegistry.registerCommand('_resolveNotebookContentProvider', (accessor) => {
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const contentProviders = notebookService.getContributedNotebookTypes();
        return contentProviders.map(provider => {
            const filenamePatterns = provider.selectors.map(selector => {
                if (typeof selector === 'string') {
                    return selector;
                }
                if (glob.isRelativePattern(selector)) {
                    return selector;
                }
                if ((0, notebookCommon_1.isDocumentExcludePattern)(selector)) {
                    return {
                        include: selector.include,
                        exclude: selector.exclude
                    };
                }
                return null;
            }).filter(pattern => pattern !== null);
            return {
                viewType: provider.id,
                displayName: provider.displayName,
                filenamePattern: filenamePatterns,
                options: {
                    transientCellMetadata: provider.options.transientCellMetadata,
                    transientDocumentMetadata: provider.options.transientDocumentMetadata,
                    transientOutputs: provider.options.transientOutputs
                }
            };
        });
    });
    commands_1.CommandsRegistry.registerCommand('_resolveNotebookKernels', async (accessor, args) => {
        const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
        const uri = uri_1.URI.revive(args.uri);
        const kernels = notebookKernelService.getMatchingKernel({ uri, viewType: args.viewType });
        return kernels.all.map(provider => ({
            id: provider.id,
            label: provider.label,
            description: provider.description,
            detail: provider.detail,
            isPreferred: false, // todo@jrieken,@rebornix
            preloads: provider.preloadUris,
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cm9sbGVyL2FwaUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsMkJBQWdCLENBQUMsZUFBZSxDQUFDLGlDQUFpQyxFQUFFLENBQUMsUUFBUSxFQUt6RSxFQUFFO1FBQ0wsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBbUIsa0NBQWdCLENBQUMsQ0FBQztRQUN6RSxNQUFNLGdCQUFnQixHQUFHLGVBQWUsQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ3ZFLE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzFELElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2xDLE9BQU8sUUFBUSxDQUFDO2dCQUNqQixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLE9BQU8sUUFBUSxDQUFDO2dCQUNqQixDQUFDO2dCQUVELElBQUksSUFBQSx5Q0FBd0IsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUN4QyxPQUFPO3dCQUNOLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTzt3QkFDekIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPO3FCQUN6QixDQUFDO2dCQUNILENBQUM7Z0JBRUQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUE4SCxDQUFDO1lBRXBLLE9BQU87Z0JBQ04sUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNyQixXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVc7Z0JBQ2pDLGVBQWUsRUFBRSxnQkFBZ0I7Z0JBQ2pDLE9BQU8sRUFBRTtvQkFDUixxQkFBcUIsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLHFCQUFxQjtvQkFDN0QseUJBQXlCLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyx5QkFBeUI7b0JBQ3JFLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCO2lCQUNuRDthQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDLHlCQUF5QixFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFHNUUsRUFPSSxFQUFFO1FBQ04sTUFBTSxxQkFBcUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUFzQixDQUFDLENBQUM7UUFDbkUsTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBb0IsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sT0FBTyxHQUFHLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUUxRixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuQyxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDZixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7WUFDckIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXO1lBQ2pDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtZQUN2QixXQUFXLEVBQUUsS0FBSyxFQUFFLHlCQUF5QjtZQUM3QyxRQUFRLEVBQUUsUUFBUSxDQUFDLFdBQVc7U0FDOUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQyJ9