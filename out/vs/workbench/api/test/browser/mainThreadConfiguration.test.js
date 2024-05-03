/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/api/browser/mainThreadConfiguration", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/configuration/common/configuration", "vs/workbench/services/configuration/browser/configurationService", "vs/platform/environment/common/environment"], function (require, exports, assert, sinon, uri_1, platform_1, configurationRegistry_1, workspace_1, instantiationServiceMock_1, mainThreadConfiguration_1, testRPCProtocol_1, configuration_1, configurationService_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadConfiguration', function () {
        const proxy = {
            $initializeConfiguration: () => { }
        };
        let instantiationService;
        let target;
        suiteSetup(() => {
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
                'id': 'extHostConfiguration',
                'title': 'a',
                'type': 'object',
                'properties': {
                    'extHostConfiguration.resource': {
                        'description': 'extHostConfiguration.resource',
                        'type': 'boolean',
                        'default': true,
                        'scope': 4 /* ConfigurationScope.RESOURCE */
                    },
                    'extHostConfiguration.window': {
                        'description': 'extHostConfiguration.resource',
                        'type': 'boolean',
                        'default': true,
                        'scope': 3 /* ConfigurationScope.WINDOW */
                    }
                }
            });
        });
        setup(() => {
            target = sinon.spy();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService_1.WorkspaceService);
            instantiationService.stub(configuration_1.IConfigurationService, 'onDidUpdateConfiguration', sinon.mock());
            instantiationService.stub(configuration_1.IConfigurationService, 'onDidChangeConfiguration', sinon.mock());
            instantiationService.stub(configuration_1.IConfigurationService, 'updateValue', target);
            instantiationService.stub(environment_1.IEnvironmentService, {
                isBuilt: false
            });
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('update resource configuration without configuration target defaults to workspace in multi root workspace when no resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.resource', 'value', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update resource configuration without configuration target defaults to workspace in folder workspace when resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.resource', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update resource configuration without configuration target defaults to workspace in folder workspace when no resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.resource', 'value', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update window configuration without configuration target defaults to workspace in multi root workspace when no resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.window', 'value', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update window configuration without configuration target defaults to workspace in multi root workspace when resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.window', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update window configuration without configuration target defaults to workspace in folder workspace when resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.window', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update window configuration without configuration target defaults to workspace in folder workspace when no resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.window', 'value', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update resource configuration without configuration target defaults to folder', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(null, 'extHostConfiguration.resource', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, target.args[0][3]);
        });
        test('update configuration with user configuration target', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(2 /* ConfigurationTarget.USER */, 'extHostConfiguration.window', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(2 /* ConfigurationTarget.USER */, target.args[0][3]);
        });
        test('update configuration with workspace configuration target', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(5 /* ConfigurationTarget.WORKSPACE */, 'extHostConfiguration.window', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('update configuration with folder configuration target', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$updateConfigurationOption(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, 'extHostConfiguration.window', 'value', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, target.args[0][3]);
        });
        test('remove resource configuration without configuration target defaults to workspace in multi root workspace when no resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.resource', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove resource configuration without configuration target defaults to workspace in folder workspace when resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.resource', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove resource configuration without configuration target defaults to workspace in folder workspace when no resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.resource', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove window configuration without configuration target defaults to workspace in multi root workspace when no resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.window', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove window configuration without configuration target defaults to workspace in multi root workspace when resource is provided', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.window', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove window configuration without configuration target defaults to workspace in folder workspace when resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.window', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove window configuration without configuration target defaults to workspace in folder workspace when no resource is provider', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.window', undefined, undefined);
            assert.strictEqual(5 /* ConfigurationTarget.WORKSPACE */, target.args[0][3]);
        });
        test('remove configuration without configuration target defaults to folder', function () {
            instantiationService.stub(workspace_1.IWorkspaceContextService, { getWorkbenchState: () => 3 /* WorkbenchState.WORKSPACE */ });
            const testObject = instantiationService.createInstance(mainThreadConfiguration_1.MainThreadConfiguration, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(proxy));
            testObject.$removeConfigurationOption(null, 'extHostConfiguration.resource', { resource: uri_1.URI.file('abc') }, undefined);
            assert.strictEqual(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, target.args[0][3]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbmZpZ3VyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvbWFpblRocmVhZENvbmZpZ3VyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxLQUFLLENBQUMseUJBQXlCLEVBQUU7UUFFaEMsTUFBTSxLQUFLLEdBQUc7WUFDYix3QkFBd0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDO1NBQ25DLENBQUM7UUFDRixJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksTUFBc0IsQ0FBQztRQUUzQixVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2YsbUJBQVEsQ0FBQyxFQUFFLENBQXlCLGtDQUFVLENBQUMsYUFBYSxDQUFDLENBQUMscUJBQXFCLENBQUM7Z0JBQ25GLElBQUksRUFBRSxzQkFBc0I7Z0JBQzVCLE9BQU8sRUFBRSxHQUFHO2dCQUNaLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixZQUFZLEVBQUU7b0JBQ2IsK0JBQStCLEVBQUU7d0JBQ2hDLGFBQWEsRUFBRSwrQkFBK0I7d0JBQzlDLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixTQUFTLEVBQUUsSUFBSTt3QkFDZixPQUFPLHFDQUE2QjtxQkFDcEM7b0JBQ0QsNkJBQTZCLEVBQUU7d0JBQzlCLGFBQWEsRUFBRSwrQkFBK0I7d0JBQzlDLE1BQU0sRUFBRSxTQUFTO3dCQUNqQixTQUFTLEVBQUUsSUFBSTt3QkFDZixPQUFPLG1DQUEyQjtxQkFDbEM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXJCLG9CQUFvQixH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