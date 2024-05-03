/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/uri", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/editor/common/core/offsetRange", "vs/editor/common/core/range", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, htmlContent_1, uri_1, snapshot_1, utils_1, offsetRange_1, range_1, instantiationServiceMock_1, log_1, storage_1, chatAgents_1, chatModel_1, chatParserTypes_1, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ChatModel', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        setup(async () => {
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(storage_1.IStorageService, testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(chatAgents_1.IChatAgentService, instantiationService.createInstance(chatAgents_1.ChatAgentService));
        });
        test('Waits for initialization', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            let hasInitialized = false;
            model.waitForInitialization().then(() => {
                hasInitialized = true;
            });
            await (0, async_1.timeout)(0);
            assert.strictEqual(hasInitialized, false);
            model.startInitialize();
            model.initialize({}, undefined);
            await (0, async_1.timeout)(0);
            assert.strictEqual(hasInitialized, true);
        });
        test('must call startInitialize before initialize', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            let hasInitialized = false;
            model.waitForInitialization().then(() => {
                hasInitialized = true;
            });
            await (0, async_1.timeout)(0);
            assert.strictEqual(hasInitialized, false);
            assert.throws(() => model.initialize({}, undefined));
            assert.strictEqual(hasInitialized, false);
        });
        test('deinitialize/reinitialize', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            let hasInitialized = false;
            model.waitForInitialization().then(() => {
                hasInitialized = true;
            });
            model.startInitialize();
            model.initialize({}, undefined);
            await (0, async_1.timeout)(0);
            assert.strictEqual(hasInitialized, true);
            model.deinitialize();
            let hasInitialized2 = false;
            model.waitForInitialization().then(() => {
                hasInitialized2 = true;
            });
            model.startInitialize();
            model.initialize({}, undefined);
            await (0, async_1.timeout)(0);
            assert.strictEqual(hasInitialized2, true);
        });
        test('cannot initialize twice', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            model.startInitialize();
            model.initialize({}, undefined);
            assert.throws(() => model.initialize({}, undefined));
        });
        test('Initialization fails when model is disposed', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            model.dispose();
            assert.throws(() => model.initialize({}, undefined));
        });
        test('removeRequest', async () => {
            const model = testDisposables.add(instantiationService.createInstance(chatModel_1.ChatModel, 'provider', undefined));
            model.startInitialize();
            model.initialize({}, undefined);
            const text = 'hello';
            model.addRequest({ text, parts: [new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(0, text.length), new range_1.Range(1, text.length, 1, text.length), text)] }, { variables: [] });
            const requests = model.getRequests();
            assert.strictEqual(requests.length, 1);
            model.removeRequest(requests[0].id);
            assert.strictEqual(model.getRequests().length, 0);
        });
    });
    suite('Response', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('content, markdown', async () => {
            const response = new chatModel_1.Response([]);
            response.updateContent({ content: 'text', kind: 'content' });
            response.updateContent({ content: new htmlContent_1.MarkdownString('markdown'), kind: 'markdownContent' });
            await (0, snapshot_1.assertSnapshot)(response.value);
            assert.strictEqual(response.asString(), 'textmarkdown');
        });
        test('markdown, content', async () => {
            const response = new chatModel_1.Response([]);
            response.updateContent({ content: new htmlContent_1.MarkdownString('markdown'), kind: 'markdownContent' });
            response.updateContent({ content: 'text', kind: 'content' });
            await (0, snapshot_1.assertSnapshot)(response.value);
        });
        test('inline reference', async () => {
            const response = new chatModel_1.Response([]);
            response.updateContent({ content: 'text before', kind: 'content' });
            response.updateContent({ inlineReference: uri_1.URI.parse('https://microsoft.com'), kind: 'inlineReference' });
            response.updateContent({ content: 'text after', kind: 'content' });
            await (0, snapshot_1.assertSnapshot)(response.value);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9jb21tb24vY2hhdE1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLE1BQU0sZUFBZSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVsRSxJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixvQkFBb0IsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLG9CQUFvQixDQUFDLElBQUksQ0FBQyx5QkFBZSxFQUFFLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSwwQ0FBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQzdELG9CQUFvQixDQUFDLElBQUksQ0FBQyw4QkFBaUIsRUFBRSxJQUFJLDRDQUFvQixFQUFFLENBQUMsQ0FBQztZQUN6RSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWlCLEVBQUUsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDZCQUFnQixDQUFDLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywwQkFBMEIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzQyxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRXpH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