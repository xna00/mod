/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/test/browser/editorTestServices", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/common/editor", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/configuration/test/common/testServices", "vs/workbench/services/preferences/browser/preferencesService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, utils_1, editorTestServices_1, commands_1, descriptors_1, serviceCollection_1, editor_1, jsonEditing_1, testServices_1, preferencesService_1, preferences_1, remoteAgentService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('PreferencesService', () => {
        let testInstantiationService;
        let testObject;
        let editorService;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            editorService = disposables.add(new TestEditorService2());
            testInstantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
                editorService: () => editorService
            }, disposables);
            testInstantiationService.stub(jsonEditing_1.IJSONEditingService, testServices_1.TestJSONEditingService);
            testInstantiationService.stub(remoteAgentService_1.IRemoteAgentService, workbenchTestServices_1.TestRemoteAgentService);
            testInstantiationService.stub(commands_1.ICommandService, editorTestServices_1.TestCommandService);
            // PreferencesService creates a PreferencesEditorInput which depends on IPreferencesService, add the real one, not a stub
            const collection = new serviceCollection_1.ServiceCollection();
            collection.set(preferences_1.IPreferencesService, new descriptors_1.SyncDescriptor(preferencesService_1.PreferencesService));
            const instantiationService = testInstantiationService.createChild(collection);
            testObject = disposables.add(instantiationService.createInstance(preferencesService_1.PreferencesService));
        });
        test('options are preserved when calling openEditor', async () => {
            testObject.openSettings({ jsonEditor: false, query: 'test query' });
            const options = editorService.lastOpenEditorOptions;
            assert.strictEqual(options.focusSearch, true);
            assert.strictEqual(options.override, editor_1.DEFAULT_EDITOR_ASSOCIATION.id);
            assert.strictEqual(options.query, 'test query');
        });
    });
    class TestEditorService2 extends workbenchTestServices_1.TestEditorService {
        async openEditor(editorInput, options) {
            this.lastOpenEditorOptions = options;
            return super.openEditor(editorInput, options);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcmVmZXJlbmNlcy90ZXN0L2Jyb3dzZXIvcHJlZmVyZW5jZXNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDaEMsSUFBSSx3QkFBbUQsQ0FBQztRQUN4RCxJQUFJLFVBQThCLENBQUM7UUFDbkMsSUFBSSxhQUFpQyxDQUFDO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDMUQsd0JBQXdCLEdBQUcsSUFBQSxxREFBNkIsRUFBQztnQkFDeEQsYUFBYSxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQWE7YUFDbEMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUVoQix3QkFBd0IsQ0FBQyxJQUFJLENBQUMsaUNBQW1CLEVBQUUscUNBQXNCLENBQUMsQ0FBQztZQUMzRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsd0NBQW1CLEVBQUUsOENBQXNCLENBQUMsQ0FBQztZQUMzRSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsMEJBQWUsRUFBRSx1Q0FBa0IsQ0FBQyxDQUFDO1lBRW5FLHlIQUF5SDtZQUN6SCxNQUFNLFVBQVUsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7WUFDM0MsVUFBVSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUNBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sb0JBQW9CLEdBQUcsd0JBQXdCLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzlFLFVBQVUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1Q0FBa0IsQ0FBQyxDQUFDLENBQUM7UUFDdkYsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsK0NBQStDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEUsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLHFCQUErQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsbUNBQTBCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLGtCQUFtQixTQUFRLHlDQUFpQjtRQUd4QyxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQWdCLEVBQUUsT0FBYTtZQUN4RCxJQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFDO1lBQ3JDLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0MsQ0FBQztLQUNEIn0=