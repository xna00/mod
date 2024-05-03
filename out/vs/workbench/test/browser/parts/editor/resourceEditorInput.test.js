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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/label/common/label", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/test/common/utils", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/customEditorLabelService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/workspace/common/workspace"], function (require, exports, assert, uri_1, workbenchTestServices_1, resourceEditorInput_1, label_1, files_1, lifecycle_1, filesConfigurationService_1, utils_1, textResourceConfiguration_1, configuration_1, customEditorLabelService_1, testConfigurationService_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceEditorInput', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let TestResourceEditorInput = class TestResourceEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
            constructor(resource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService) {
                super(resource, resource, labelService, fileService, filesConfigurationService, textResourceConfigurationService, customEditorLabelService);
                this.typeId = 'test.typeId';
            }
        };
        TestResourceEditorInput = __decorate([
            __param(1, label_1.ILabelService),
            __param(2, files_1.IFileService),
            __param(3, filesConfigurationService_1.IFilesConfigurationService),
            __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
            __param(5, customEditorLabelService_1.ICustomEditorLabelService)
        ], TestResourceEditorInput);
        async function createServices() {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            const customEditorLabelService = disposables.add(new customEditorLabelService_1.CustomEditorLabelService(testConfigurationService, instantiationService.get(workspace_1.IWorkspaceContextService)));
            instantiationService.stub(customEditorLabelService_1.ICustomEditorLabelService, customEditorLabelService);
            return [instantiationService, testConfigurationService, customEditorLabelService];
        }
        teardown(() => {
            disposables.clear();
        });
        test('basics', async () => {
            const [instantiationService] = await createServices();
            const resource = uri_1.URI.from({ scheme: 'testResource', path: 'thePath/of/the/resource.txt' });
            const input = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource));
            assert.ok(input.getName().length > 0);
            assert.ok(input.getDescription(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getDescription(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getDescription(2 /* Verbosity.LONG */).length > 0);
            assert.ok(input.getTitle(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getTitle(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getTitle(2 /* Verbosity.LONG */).length > 0);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.isReadonly(), false);
            assert.strictEqual(input.hasCapability(4 /* EditorInputCapabilities.Untitled */), true);
        });
        test('custom editor name', async () => {
            const [instantiationService, testConfigurationService, customEditorLabelService] = await createServices();
            const resource1 = uri_1.URI.from({ scheme: 'testResource', path: 'thePath/of/the/resource.txt' });
            const resource2 = uri_1.URI.from({ scheme: 'testResource', path: 'theOtherPath/of/the/resource.md' });
            const input1 = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource1));
            const input2 = disposables.add(instantiationService.createInstance(TestResourceEditorInput, resource2));
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS, {
                '**/theOtherPath/**': 'Label 1',
                '**/*.txt': 'Label 2',
                '**/resource.txt': 'Label 3',
            });
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS; }, source: 2 /* ConfigurationTarget.USER */ });
            let label1Name = '';
            let label2Name = '';
            disposables.add(customEditorLabelService.onDidChange(() => {
                label1Name = input1.getName();
                label2Name = input2.getName();
            }));
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, true);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'Label 3');
            assert.ok(label2Name === 'Label 1');
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, false);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'resource.txt');
            assert.ok(label2Name === 'resource.md');
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED, true);
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_ENABLED; }, source: 2 /* ConfigurationTarget.USER */ });
            await testConfigurationService.setUserConfiguration(customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS, {
                'thePath/**/resource.txt': 'Label 4',
                'thePath/of/*/resource.txt': 'Label 5',
            });
            testConfigurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration(configuration) { return configuration === customEditorLabelService_1.CustomEditorLabelService.SETTING_ID_PATTERNS; }, source: 2 /* ConfigurationTarget.USER */ });
            assert.ok(label1Name === 'Label 5');
            assert.ok(label2Name === 'resource.md');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb3VyY2VFZGl0b3JJbnB1dC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9icm93c2VyL3BhcnRzL2VkaXRvci9yZXNvdXJjZUVkaXRvcklucHV0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxpREFBMkI7WUFJaEUsWUFDQyxRQUFhLEVBQ0UsWUFBMkIsRUFDNUIsV0FBeUIsRUFDWCx5QkFBcUQsRUFDOUMsZ0NBQW1FLEVBQzNFLHdCQUFtRDtnQkFFOUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSx5QkFBeUIsRUFBRSxnQ0FBZ0MsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO2dCQVZwSSxXQUFNLEdBQUcsYUFBYSxDQUFDO1lBV2hDLENBQUM7U0FDRCxDQUFBO1FBZEssdUJBQXVCO1lBTTFCLFdBQUEscUJBQWEsQ0FBQTtZQUNiLFdBQUEsb0JBQVksQ0FBQTtZQUNaLFdBQUEsc0RBQTBCLENBQUE7WUFDMUIsV0FBQSw2REFBaUMsQ0FBQTtZQUNqQyxXQUFBLG9EQUF5QixDQUFBO1dBVnRCLHVCQUF1QixDQWM1QjtRQUVELEtBQUssVUFBVSxjQUFjO1lBQzVCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbkYsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDaEUsb0JBQW9CLENBQUMsSUFBSSxD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