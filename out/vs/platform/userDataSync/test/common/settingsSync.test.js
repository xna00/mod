/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/files/common/files", "vs/platform/registry/common/platform", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, event_1, timeTravelScheduler_1, utils_1, configuration_1, configurationRegistry_1, files_1, platform_1, userDataProfile_1, settingsSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SettingsSync - Auto', () => {
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        teardown(async () => {
            await client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear();
        });
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
                'id': 'settingsSync',
                'type': 'object',
                'properties': {
                    'settingsSync.machine': {
                        'type': 'string',
                        'scope': 2 /* ConfigurationScope.MACHINE */
                    },
                    'settingsSync.machineOverridable': {
                        'type': 'string',
                        'scope': 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */
                    }
                }
            });
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("settings" /* SyncResource.Settings */);
        });
        test('when settings file does not exist', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource;
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(settingResource));
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        }));
        test('when settings file is empty and remote has no changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource;
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)?.settings, '{}');
            assert.strictEqual((0, settingsSync_1.parseSettingsSyncContent)(remoteUserData.syncData.content)?.settings, '{}');
            assert.strictEqual((await fileService.readFile(settingsResource)).value.toString(), '');
        }));
        test('when settings file is empty and remote has changes', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	},

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource;
            await fileService.writeFile(settingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)?.settings, content);
            assert.strictEqual((0, settingsSync_1.parseSettingsSyncContent)(remoteUserData.syncData.content)?.settings, content);
            assert.strictEqual((await fileService.readFile(settingsResource)).value.toString(), content);
        }));
        test('when settings file is created after first sync', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const settingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.settingsResource;
            await testObject.sync(await client.getResourceManifest());
            await fileService.createFile(settingsResource, buffer_1.VSBuffer.fromString('{}'));
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData?.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual((0, settingsSync_1.parseSettingsSyncContent)(lastSyncUserData.syncData.content)?.settings, '{}');
        }));
        test('sync for first time to the server', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expected = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	},

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await updateSettings(expected, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, expected);
        }));
        test('do not sync machine settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp"
}`);
        }));
        test('do not sync machine settings when spread across file', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"settingsSync.machine": "someValue",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp"
}`);
        }));
        test('do not sync machine settings when spread across file - 2', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"settingsSync.machine": "someValue",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Machine
	"settingsSync.machineOverridable": "someValue",
	"files.simpleDialog.enable": true,
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"files.simpleDialog.enable": true,
}`);
        }));
        test('sync when all settings are machine settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue"
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
}`);
        }));
        test('sync when all settings are machine settings with trailing comma', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Machine
	"settingsSync.machine": "someValue",
	"settingsSync.machineOverridable": "someValue",
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	,
}`);
        }));
        test('local change event is triggered when settings are changed', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const content = `{
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,
}`;
            await updateSettings(content, client);
            await testObject.sync(await client.getResourceManifest());
            const promise = event_1.Event.toPromise(testObject.onDidChangeLocal);
            await updateSettings(`{
	"files.autoSave": "off",
	"files.simpleDialog.enable": true,
}`, client);
            await promise;
        }));
        test('do not sync ignored settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`);
        }));
        test('do not sync ignored and machine settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	],

	// Machine
	"settingsSync.machine": "someValue",
}`;
            await updateSettings(settingsContent, client);
            await testObject.sync(await client.getResourceManifest());
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	],
}`);
        }));
        test('sync throws invalid content error', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const expected = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",
	"workbench.tree.indent": 20,
	"workbench.colorCustomizations": {
		"editorLineNumber.activeForeground": "#ff0000",
		"[GitHub Sharp]": {
			"statusBarItem.remoteBackground": "#24292E",
			"editorPane.background": "#f3f1f11a"
		}
	}

	"gitBranch.base": "remote-repo/master",

	// Experimental
	"workbench.view.experimental.allowMovingToNewContainer": true,
}`;
            await updateSettings(expected, client);
            try {
                await testObject.sync(await client.getResourceManifest());
                assert.fail('should fail with invalid content error');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncError);
                assert.deepStrictEqual(e.code, "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */);
            }
        }));
        test('sync throws invalid content error - content is an array', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            await updateSettings('[]', client);
            try {
                await testObject.sync(await client.getResourceManifest());
                assert.fail('should fail with invalid content error');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncError);
                assert.deepStrictEqual(e.code, "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */);
            }
        }));
        test('sync when there are conflicts', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            await updateSettings(JSON.stringify({
                'a': 1,
                'b': 2,
                'settingsSync.ignoredSettings': ['a']
            }), client2);
            await client2.sync();
            await updateSettings(JSON.stringify({
                'a': 2,
                'b': 1,
                'settingsSync.ignoredSettings': ['a']
            }), client);
            await testObject.sync(await client.getResourceManifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assert.strictEqual(testObject.conflicts.conflicts[0].localResource.toString(), testObject.localResource.toString());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const mergeContent = (await fileService.readFile(testObject.conflicts.conflicts[0].previewResource)).value.toString();
            assert.strictEqual(mergeContent, '');
        }));
        test('sync profile settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const profile = await client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).createNamedProfile('profile1');
            await updateSettings(JSON.stringify({
                'a': 1,
                'b': 2,
            }), client2, profile);
            await client2.sync();
            await client.sync();
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const syncedProfile = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).profiles.find(p => p.id === profile.id);
            const content = (await client.instantiationService.get(files_1.IFileService).readFile(syncedProfile.settingsResource)).value.toString();
            assert.deepStrictEqual(JSON.parse(content), {
                'a': 1,
                'b': 2,
            });
        }));
    });
    suite('SettingsSync - Manual', () => {
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        teardown(async () => {
            await client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear();
        });
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("settings" /* SyncResource.Settings */);
        });
        test('do not sync ignored settings', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const settingsContent = `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Editor
	"editor.fontFamily": "Fira Code",

	// Terminal
	"terminal.integrated.shell.osx": "some path",

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`;
            await updateSettings(settingsContent, client);
            let preview = await testObject.preview(await client.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            const { content } = await client.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSettings(content);
            assert.deepStrictEqual(actual, `{
	// Always
	"files.autoSave": "afterDelay",
	"files.simpleDialog.enable": true,

	// Workbench
	"workbench.colorTheme": "GitHub Sharp",

	// Ignored
	"settingsSync.ignoredSettings": [
		"editor.fontFamily",
		"terminal.integrated.shell.osx"
	]
}`);
        }));
    });
    function parseSettings(content) {
        const syncData = JSON.parse(content);
        const settingsSyncContent = JSON.parse(syncData.content);
        return settingsSyncContent.settings;
    }
    async function updateSettings(content, client, profile) {
        await client.instantiationService.get(files_1.IFileService).writeFile((profile ?? client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile).settingsResource, buffer_1.VSBuffer.fromString(content));
        await client.instantiationService.get(configuration_1.IConfigurationService).reloadConfiguration();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NTeW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy90ZXN0L2NvbW1vbi9zZXR0aW5nc1N5bmMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUVqQyxNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixFQUFFLENBQUM7UUFDNUMsSUFBSSxNQUEwQixDQUFDO1FBQy9CLElBQUksVUFBZ0MsQ0FBQztRQUVyQyxRQUFRLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDbkIsTUFBTSxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLHdDQUF5QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUUsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLGVBQWUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFbEUsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO2dCQUNuRixJQUFJLEVBQUUsY0FBYztnQkFDcEIsTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFlBQVksRUFBRTtvQkFDYixzQkFBc0IsRUFBRTt3QkFDdkIsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLE9BQU8sb0NBQTRCO3FCQUNuQztvQkFDRCxpQ0FBaUMsRUFBRTt3QkFDbEMsTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLE9BQU8sZ0RBQXdDO3FCQUMvQztpQkFDRDthQUNELENBQUMsQ0FBQztZQUNILE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMs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