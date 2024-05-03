/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, resources_1, utils_1, environment_1, files_1, userDataProfile_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tsSnippet1 = `{

	// Place your snippets for TypeScript here. Each snippet is defined under a snippet name and has a prefix, body and
	// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:
	// $1, $2 for tab stops, $0 for the final cursor position, Placeholders with the
	// same ids are connected.
	"Print to console": {
	// Example:
	"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
			"description": "Log output to console",
	}

}`;
    const tsSnippet2 = `{

	// Place your snippets for TypeScript here. Each snippet is defined under a snippet name and has a prefix, body and
	// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:
	// $1, $2 for tab stops, $0 for the final cursor position, Placeholders with the
	// same ids are connected.
	"Print to console": {
	// Example:
	"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
			"description": "Log output to console always",
	}

}`;
    const htmlSnippet1 = `{
/*
	// Place your snippets for HTML here. Each snippet is defined under a snippet name and has a prefix, body and
	// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted.
	// Example:
	"Print to console": {
	"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
			"description": "Log output to console"
	}
*/
"Div": {
	"prefix": "div",
		"body": [
			"<div>",
			"",
			"</div>"
		],
			"description": "New div"
	}
}`;
    const htmlSnippet2 = `{
/*
	// Place your snippets for HTML here. Each snippet is defined under a snippet name and has a prefix, body and
	// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted.
	// Example:
	"Print to console": {
	"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
			"description": "Log output to console"
	}
*/
"Div": {
	"prefix": "div",
		"body": [
			"<div>",
			"",
			"</div>"
		],
			"description": "New div changed"
	}
}`;
    const htmlSnippet3 = `{
/*
	// Place your snippets for HTML here. Each snippet is defined under a snippet name and has a prefix, body and
	// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted.
	// Example:
	"Print to console": {
	"prefix": "log",
		"body": [
			"console.log('$1');",
			"$2"
		],
			"description": "Log output to console"
	}
*/
"Div": {
	"prefix": "div",
		"body": [
			"<div>",
			"",
			"</div>"
		],
			"description": "New div changed again"
	}
}`;
    const globalSnippet = `{
	// Place your global snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and
	// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope
	// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is
	// used to trigger the snippet and the body will be expanded and inserted. Possible variables are:
	// $1, $2 for tab stops, $0 for the final cursor position, and {1: label}, { 2: another } for placeholders.
	// Placeholders with the same ids are connected.
	// Example:
	// "Print to console": {
	// 	"scope": "javascript,typescript",
	// 	"prefix": "log",
	// 	"body": [
	// 		"console.log('$1');",
	// 		"$2"
	// 	],
	// 	"description": "Log output to console"
	// }
}`;
    suite('SnippetsSync', () => {
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let testClient;
        let client2;
        let testObject;
        teardown(async () => {
            await testClient.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear();
        });
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await testClient.setUp(true);
            testObject = testClient.getSynchronizer("snippets" /* SyncResource.Snippets */);
            client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
        });
        test('when snippets does not exist', async () => {
            const fileService = testClient.instantiationService.get(files_1.IFileService);
            const snippetsResource = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.snippetsHome;
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await testClient.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(snippetsResource));
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await testClient.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await testClient.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        });
        test('when snippet is created after first sync', async () => {
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet1, testClient);
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await testClient.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData?.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.deepStrictEqual(lastSyncUserData.syncData.content, JSON.stringify({ 'html.json': htmlSnippet1 }));
        });
        test('first time sync - outgoing to server (no snippets)', async () => {
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await updateSnippet('typescript.json', tsSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet1, 'typescript.json': tsSnippet1 });
        });
        test('first time sync - incoming from server (no snippets)', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const actual2 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual2, tsSnippet1);
        });
        test('first time sync when snippets exists', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await updateSnippet('typescript.json', tsSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const actual2 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual2, tsSnippet1);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet1, 'typescript.json': tsSnippet1 });
        });
        test('first time sync when snippets exists - has conflicts', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const local = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json');
            assertPreviews(testObject.conflicts.conflicts, [local]);
        });
        test('first time sync when snippets exists - has conflicts and accept conflicts', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            const conflicts = testObject.conflicts.conflicts;
            await testObject.accept(conflicts[0].previewResource, htmlSnippet1);
            await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet1 });
        });
        test('first time sync when snippets exists - has multiple conflicts', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const local1 = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json');
            const local2 = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json');
            assertPreviews(testObject.conflicts.conflicts, [local1, local2]);
        });
        test('first time sync when snippets exists - has multiple conflicts and accept one conflict', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            let conflicts = testObject.conflicts.conflicts;
            await testObject.accept(conflicts[0].previewResource, htmlSnippet2);
            conflicts = testObject.conflicts.conflicts;
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const local = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json');
            assertPreviews(testObject.conflicts.conflicts, [local]);
        });
        test('first time sync when snippets exists - has multiple conflicts and accept all conflicts', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            const conflicts = testObject.conflicts.conflicts;
            await testObject.accept(conflicts[0].previewResource, htmlSnippet2);
            await testObject.accept(conflicts[1].previewResource, tsSnippet1);
            await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet2);
            const actual2 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual2, tsSnippet1);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet2, 'typescript.json': tsSnippet1 });
        });
        test('sync adding a snippet', async () => {
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('typescript.json', tsSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const actual2 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual2, tsSnippet1);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet1, 'typescript.json': tsSnippet1 });
        });
        test('sync adding a snippet - accept', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const actual2 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual2, tsSnippet1);
        });
        test('sync updating a snippet', async () => {
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet2);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet2 });
        });
        test('sync updating a snippet - accept', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet2, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet2);
        });
        test('sync updating a snippet - conflict', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet2, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet3, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const local = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json');
            assertPreviews(testObject.conflicts.conflicts, [local]);
        });
        test('sync updating a snippet - resolve conflict', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet2, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet3, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await testObject.accept(testObject.conflicts.conflicts[0].previewResource, htmlSnippet2);
            await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet2);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet2 });
        });
        test('sync removing a snippet', async () => {
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await updateSnippet('typescript.json', tsSnippet1, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await removeSnippet('html.json', testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual2, null);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'typescript.json': tsSnippet1 });
        });
        test('sync removing a snippet - accept', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await removeSnippet('html.json', client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual2, null);
        });
        test('sync removing a snippet locally and updating it remotely', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await updateSnippet('html.json', htmlSnippet2, client2);
            await client2.sync();
            await removeSnippet('html.json', testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual2, htmlSnippet2);
        });
        test('sync removing a snippet - conflict', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await removeSnippet('html.json', client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const local = (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json');
            assertPreviews(testObject.conflicts.conflicts, [local]);
        });
        test('sync removing a snippet - resolve conflict', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await removeSnippet('html.json', client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await testObject.accept(testObject.conflicts.conflicts[0].previewResource, htmlSnippet3);
            await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual2, htmlSnippet3);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'typescript.json': tsSnippet1, 'html.json': htmlSnippet3 });
        });
        test('sync removing a snippet - resolve conflict by removing', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            await removeSnippet('html.json', client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            await testObject.accept(testObject.conflicts.conflicts[0].previewResource, null);
            await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual2, null);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'typescript.json': tsSnippet1 });
        });
        test('sync global and language snippet', async () => {
            await updateSnippet('global.code-snippets', globalSnippet, client2);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('html.json', testClient);
            assert.strictEqual(actual1, htmlSnippet1);
            const actual2 = await readSnippet('global.code-snippets', testClient);
            assert.strictEqual(actual2, globalSnippet);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'html.json': htmlSnippet1, 'global.code-snippets': globalSnippet });
        });
        test('sync should ignore non snippets', async () => {
            await updateSnippet('global.code-snippets', globalSnippet, client2);
            await updateSnippet('html.html', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await testObject.sync(await testClient.getResourceManifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            const actual1 = await readSnippet('typescript.json', testClient);
            assert.strictEqual(actual1, tsSnippet1);
            const actual2 = await readSnippet('global.code-snippets', testClient);
            assert.strictEqual(actual2, globalSnippet);
            const actual3 = await readSnippet('html.html', testClient);
            assert.strictEqual(actual3, null);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseSnippets(content);
            assert.deepStrictEqual(actual, { 'typescript.json': tsSnippet1, 'global.code-snippets': globalSnippet });
        });
        test('previews are reset after all conflicts resolved', async () => {
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await testObject.sync(await testClient.getResourceManifest());
            const conflicts = testObject.conflicts.conflicts;
            await testObject.accept(conflicts[0].previewResource, htmlSnippet2);
            await testObject.apply(false);
            const fileService = testClient.instantiationService.get(files_1.IFileService);
            assert.ok(!await fileService.exists((0, resources_1.dirname)(conflicts[0].previewResource)));
        });
        test('merge when there are multiple snippets and only one snippet is merged', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('merge when there are multiple snippets and all snippets are merged', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            preview = await testObject.merge(preview.resourcePreviews[1].localResource);
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('merge when there are multiple snippets and all snippets are merged and applied', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            preview = await testObject.merge(preview.resourcePreviews[1].localResource);
            preview = await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('merge when there are multiple snippets and one snippet has no changes and one snippet is merged', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('merge when there are multiple snippets and one snippet has no changes and one snippet is merged and applied', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet1, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('merge when there are multiple snippets with conflicts and only one snippet is merged', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assertPreviews(testObject.conflicts.conflicts, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
            ]);
        });
        test('merge when there are multiple snippets with conflicts and all snippets are merged', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.merge(preview.resourcePreviews[1].previewResource);
            assert.strictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assertPreviews(testObject.conflicts.conflicts, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
        });
        test('accept when there are multiple snippets with conflicts and only one snippet is accepted', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource, htmlSnippet2);
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('accept when there are multiple snippets with conflicts and all snippets are accepted', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource, htmlSnippet2);
            preview = await testObject.accept(preview.resourcePreviews[1].previewResource, tsSnippet2);
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('accept when there are multiple snippets with conflicts and all snippets are accepted and applied', async () => {
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            await updateSnippet('html.json', htmlSnippet1, client2);
            await updateSnippet('typescript.json', tsSnippet1, client2);
            await client2.sync();
            await updateSnippet('html.json', htmlSnippet2, testClient);
            await updateSnippet('typescript.json', tsSnippet2, testClient);
            let preview = await testObject.preview(await testClient.getResourceManifest(), {});
            assert.strictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'html.json'),
                (0, resources_1.joinPath)(environmentService.userDataSyncHome, testObject.resource, userDataSync_1.PREVIEW_DIR_NAME, 'typescript.json'),
            ]);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource, htmlSnippet2);
            preview = await testObject.accept(preview.resourcePreviews[1].previewResource, tsSnippet2);
            preview = await testObject.apply(false);
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assert.deepStrictEqual(testObject.conflicts.conflicts, []);
        });
        test('sync profile snippets', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const profile = await client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).createNamedProfile('profile1');
            await updateSnippet('html.json', htmlSnippet1, client2, profile);
            await client2.sync();
            await testClient.sync();
            const syncedProfile = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService).profiles.find(p => p.id === profile.id);
            const content = await readSnippet('html.json', testClient, syncedProfile);
            assert.strictEqual(content, htmlSnippet1);
        });
        function parseSnippets(content) {
            const syncData = JSON.parse(content);
            return JSON.parse(syncData.content);
        }
        async function updateSnippet(name, content, client, profile) {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            const snippetsResource = (0, resources_1.joinPath)((profile ?? userDataProfilesService.defaultProfile).snippetsHome, name);
            await fileService.writeFile(snippetsResource, buffer_1.VSBuffer.fromString(content));
        }
        async function removeSnippet(name, client) {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            const snippetsResource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, name);
            await fileService.del(snippetsResource);
        }
        async function readSnippet(name, client, profile) {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            const snippetsResource = (0, resources_1.joinPath)((profile ?? userDataProfilesService.defaultProfile).snippetsHome, name);
            if (await fileService.exists(snippetsResource)) {
                const content = await fileService.readFile(snippetsResource);
                return content.value.toString();
            }
            return null;
        }
        function assertPreviews(actual, expected) {
            assert.deepStrictEqual(actual.map(({ previewResource }) => previewResource.toString()), expected.map(uri => uri.toString()));
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNTeW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy90ZXN0L2NvbW1vbi9zbmlwcGV0c1N5bmMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxNQUFNLFVBQVUsR0FBRzs7Ozs7Ozs7Ozs7Ozs7OztFQWdCakIsQ0FBQztJQUVILE1BQU0sVUFBVSxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JqQixDQUFDO0lBRUgsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBdUJuQixDQUFDO0lBRUgsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBdUJuQixDQUFDO0lBRUgsTUFBTSxZQUFZLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBdUJuQixDQUFDO0lBRUgsTUFBTSxhQUFhLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBaUJwQixDQUFDO0lBRUgsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFFMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO1FBQzVDLElBQUksVUFBOEIsQ0FBQztRQUNuQyxJQUFJLE9BQTJCLENBQUM7UUFFaEMsSUFBSSxVQUFnQyxDQUFDO1FBRXJDLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNuQixNQUFNLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsd0NBQXlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5RSxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVsRSxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsVUFBVSxHQUFHLGVBQWUsQ0FB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