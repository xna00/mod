/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/environment/common/environmentService", "vs/platform/product/common/product", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/test/common/utils"], function (require, exports, assert, fileService_1, log_1, network_1, uri_1, resources_1, inMemoryFilesystemProvider_1, environmentService_1, product_1, userDataProfile_1, uriIdentityService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    class TestEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        constructor(_appSettingsHome) {
            super(Object.create(null), Object.create(null), { _serviceBrand: undefined, ...product_1.default });
            this._appSettingsHome = _appSettingsHome;
        }
        get userRoamingDataHome() { return this._appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
        get cacheHome() { return this.userRoamingDataHome; }
    }
    suite('UserDataProfileService (Common)', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let testObject;
        let environmentService;
        setup(async () => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(fileService.registerProvider(ROOT.scheme, fileSystemProvider));
            disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, fileSystemProvider));
            environmentService = new TestEnvironmentService((0, resources_1.joinPath)(ROOT, 'User'));
            testObject = disposables.add(new userDataProfile_1.InMemoryUserDataProfilesService(environmentService, fileService, disposables.add(new uriIdentityService_1.UriIdentityService(fileService)), logService));
        });
        test('default profile', () => {
            assert.strictEqual(testObject.defaultProfile.isDefault, true);
            assert.strictEqual(testObject.defaultProfile.useDefaultFlags, undefined);
            assert.strictEqual(testObject.defaultProfile.location.toString(), environmentService.userRoamingDataHome.toString());
            assert.strictEqual(testObject.defaultProfile.globalStorageHome.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'globalStorage').toString());
            assert.strictEqual(testObject.defaultProfile.keybindingsResource.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'keybindings.json').toString());
            assert.strictEqual(testObject.defaultProfile.settingsResource.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'settings.json').toString());
            assert.strictEqual(testObject.defaultProfile.snippetsHome.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'snippets').toString());
            assert.strictEqual(testObject.defaultProfile.tasksResource.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'tasks.json').toString());
            assert.strictEqual(testObject.defaultProfile.extensionsResource.toString(), (0, resources_1.joinPath)(environmentService.userRoamingDataHome, 'extensions.json').toString());
        });
        test('profiles always include default profile', () => {
            assert.deepStrictEqual(testObject.profiles.length, 1);
            assert.deepStrictEqual(testObject.profiles[0].isDefault, true);
        });
        test('create profile with id', async () => {
            const profile = await testObject.createProfile('id', 'name');
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(profile.id, 'id');
            assert.deepStrictEqual(profile.name, 'name');
            assert.deepStrictEqual(!!profile.isTransient, false);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
            assert.deepStrictEqual(testObject.profiles[1].name, profile.name);
        });
        test('create profile with id, name and transient', async () => {
            const profile = await testObject.createProfile('id', 'name', { transient: true });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(profile.id, 'id');
            assert.deepStrictEqual(profile.name, 'name');
            assert.deepStrictEqual(!!profile.isTransient, true);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('create transient profiles', async () => {
            const profile1 = await testObject.createTransientProfile();
            const profile2 = await testObject.createTransientProfile();
            const profile3 = await testObject.createTransientProfile();
            const profile4 = await testObject.createProfile('id', 'name', { transient: true });
            assert.deepStrictEqual(testObject.profiles.length, 5);
            assert.deepStrictEqual(profile1.name, 'Temp 1');
            assert.deepStrictEqual(profile1.isTransient, true);
            assert.deepStrictEqual(testObject.profiles[1].id, profile1.id);
            assert.deepStrictEqual(profile2.name, 'Temp 2');
            assert.deepStrictEqual(profile2.isTransient, true);
            assert.deepStrictEqual(testObject.profiles[2].id, profile2.id);
            assert.deepStrictEqual(profile3.name, 'Temp 3');
            assert.deepStrictEqual(profile3.isTransient, true);
            assert.deepStrictEqual(testObject.profiles[3].id, profile3.id);
            assert.deepStrictEqual(profile4.name, 'name');
            assert.deepStrictEqual(profile4.isTransient, true);
            assert.deepStrictEqual(testObject.profiles[4].id, profile4.id);
        });
        test('create transient profile when a normal profile with Temp is already created', async () => {
            await testObject.createNamedProfile('Temp 1');
            const profile1 = await testObject.createTransientProfile();
            assert.deepStrictEqual(profile1.name, 'Temp 2');
            assert.deepStrictEqual(profile1.isTransient, true);
        });
        test('profiles include default profile with extension resource defined when transiet prrofile is created', async () => {
            await testObject.createTransientProfile();
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[0].isDefault, true);
        });
        test('profiles include default profile with extension resource undefined when transiet prrofile is removed', async () => {
            const profile = await testObject.createTransientProfile();
            await testObject.removeProfile(profile);
            assert.deepStrictEqual(testObject.profiles.length, 1);
            assert.deepStrictEqual(testObject.profiles[0].isDefault, true);
        });
        test('update named profile', async () => {
            const profile = await testObject.createNamedProfile('name');
            await testObject.updateProfile(profile, { name: 'name changed' });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[1].name, 'name changed');
            assert.deepStrictEqual(!!testObject.profiles[1].isTransient, false);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('persist transient profile', async () => {
            const profile = await testObject.createTransientProfile();
            await testObject.updateProfile(profile, { name: 'saved', transient: false });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[1].name, 'saved');
            assert.deepStrictEqual(!!testObject.profiles[1].isTransient, false);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('persist transient profile (2)', async () => {
            const profile = await testObject.createProfile('id', 'name', { transient: true });
            await testObject.updateProfile(profile, { name: 'saved', transient: false });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[1].name, 'saved');
            assert.deepStrictEqual(!!testObject.profiles[1].isTransient, false);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('save transient profile', async () => {
            const profile = await testObject.createTransientProfile();
            await testObject.updateProfile(profile, { name: 'saved' });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[1].name, 'saved');
            assert.deepStrictEqual(!!testObject.profiles[1].isTransient, true);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('short name', async () => {
            const profile = await testObject.createNamedProfile('name', { shortName: 'short' });
            assert.strictEqual(profile.shortName, 'short');
            await testObject.updateProfile(profile, { shortName: 'short changed' });
            assert.deepStrictEqual(testObject.profiles.length, 2);
            assert.deepStrictEqual(testObject.profiles[1].name, 'name');
            assert.deepStrictEqual(testObject.profiles[1].shortName, 'short changed');
            assert.deepStrictEqual(!!testObject.profiles[1].isTransient, false);
            assert.deepStrictEqual(testObject.profiles[1].id, profile.id);
        });
        test('profile using default profile for settings', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { settings: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { settings: true });
            assert.strictEqual(profile.settingsResource.toString(), testObject.defaultProfile.settingsResource.toString());
        });
        test('profile using default profile for keybindings', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { keybindings: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { keybindings: true });
            assert.strictEqual(profile.keybindingsResource.toString(), testObject.defaultProfile.keybindingsResource.toString());
        });
        test('profile using default profile for snippets', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { snippets: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { snippets: true });
            assert.strictEqual(profile.snippetsHome.toString(), testObject.defaultProfile.snippetsHome.toString());
        });
        test('profile using default profile for tasks', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { tasks: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { tasks: true });
            assert.strictEqual(profile.tasksResource.toString(), testObject.defaultProfile.tasksResource.toString());
        });
        test('profile using default profile for global state', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { globalState: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { globalState: true });
            assert.strictEqual(profile.globalStorageHome.toString(), testObject.defaultProfile.globalStorageHome.toString());
        });
        test('profile using default profile for extensions', async () => {
            const profile = await testObject.createNamedProfile('name', { useDefaultFlags: { extensions: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { extensions: true });
            assert.strictEqual(profile.extensionsResource.toString(), testObject.defaultProfile.extensionsResource.toString());
        });
        test('update profile using default profile for keybindings', async () => {
            let profile = await testObject.createNamedProfile('name');
            profile = await testObject.updateProfile(profile, { useDefaultFlags: { keybindings: true } });
            assert.strictEqual(profile.isDefault, false);
            assert.deepStrictEqual(profile.useDefaultFlags, { keybindings: true });
            assert.strictEqual(profile.keybindingsResource.toString(), testObject.defaultProfile.keybindingsResource.toString());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVByb2ZpbGUvdGVzdC9jb21tb24vdXNlckRhdGFQcm9maWxlU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLE1BQU0sSUFBSSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFFaEUsTUFBTSxzQkFBdUIsU0FBUSxxREFBZ0M7UUFDcEUsWUFBNkIsZ0JBQXFCO1lBQ2pELEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLEdBQUcsaUJBQU8sRUFBRSxDQUFDLENBQUM7WUFEOUQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFLO1FBRWxELENBQUM7UUFDRCxJQUFhLG1CQUFtQixLQUFLLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdHLElBQWEsU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztLQUM3RDtJQUVELEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFFN0MsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBQzlELElBQUksVUFBbUMsQ0FBQztRQUN4QyxJQUFJLGtCQUEwQyxDQUFDO1FBRS9DLEtBQUssQ0FBQyxL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QUFDO1lBQzVELE1BQU0sVUFBVSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztZQUVsRSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUMsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMxRCxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUU3RSxNQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUs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