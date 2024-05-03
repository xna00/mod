/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/textDiffEditorModel", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, textDiffEditorModel_1, diffEditorInput_1, textResourceEditorInput_1, uri_1, workbenchTestServices_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextDiffEditorModel', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            disposables.add(accessor.textModelResolverService.registerTextModelContentProvider('test', {
                provideTextContent: async function (resource) {
                    if (resource.scheme === 'test') {
                        const modelContent = 'Hello Test';
                        const languageSelection = accessor.languageService.createById('json');
                        return disposables.add(accessor.modelService.createModel(modelContent, languageSelection, resource));
                    }
                    return null;
                }
            }));
            const input = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), 'name', 'description', undefined, undefined));
            const otherInput = disposables.add(instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), 'name2', 'description', undefined, undefined));
            const diffInput = disposables.add(instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined));
            let model = disposables.add(await diffInput.resolve());
            assert(model);
            assert(model instanceof textDiffEditorModel_1.TextDiffEditorModel);
            const diffEditorModel = model.textDiffEditorModel;
            assert(diffEditorModel.original);
            assert(diffEditorModel.modified);
            model = disposables.add(await diffInput.resolve());
            assert(model.isResolved());
            assert(diffEditorModel !== model.textDiffEditorModel);
            diffInput.dispose();
            assert(!model.textDiffEditorModel);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yRGlmZk1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvckRpZmZNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsSUFBSSxvQkFBMkMsQ0FBQztRQUNoRCxJQUFJLFFBQTZCLENBQUM7UUFFbEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztRQUNyRSxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pCLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLGdDQUFnQyxDQUFDLE1BQU0sRUFBRTtnQkFDMUYsa0JBQWtCLEVBQUUsS0FBSyxXQUFXLFFBQWE7b0JBQ2hELElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQzt3QkFDaEMsTUFBTSxZQUFZLEdBQUcsWUFBWSxDQUFDO3dCQUNsQyxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUV0RSxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ3RHLENBQUM7b0JBRUQsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaURBQXVCLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzFNLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlEQUF1QixFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNoTixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRTdJLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxTQUFTLENBQUMsT0FBTyxFQUF5QixDQUFDLENBQUM7WUFFOUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLEtBQUssWUFBWSx5Q0FBbUIsQ0FBQyxDQUFDO1lBRTdDLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxtQkFBb0IsQ0FBQztZQUNuRCxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFakMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxTQUFTLENBQUMsT0FBTyxFQUF5QixDQUFDLENBQUM7WUFDMUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBRTNCLE1BQU0sQ0FBQyxlQUFlLEtBQUssS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdEQsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=