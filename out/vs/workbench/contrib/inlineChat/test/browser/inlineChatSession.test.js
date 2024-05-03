define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/event", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/test/browser/diff/testDiffProviderFactoryService", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/test/browser/testCodeEditor", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/progress/common/progress", "vs/workbench/common/views", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/inlineChat/browser/inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/cancellation", "vs/base/common/types", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/services/editorWorker", "./testWorkerService", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/contrib/chat/test/common/mockChatVariables", "vs/workbench/services/views/common/viewsService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/test/common/mockChatContributionService", "vs/platform/commands/common/commands", "vs/editor/test/browser/editorTestServices"], function (require, exports, assert, lifecycle_1, uri_1, event_1, mock_1, utils_1, testDiffProviderFactoryService_1, diffProviderFactoryService_1, range_1, model_1, testCodeEditor_1, configuration_1, testConfigurationService_1, contextkey_1, descriptors_1, serviceCollection_1, mockKeybindingService_1, progress_1, views_1, accessibleView_1, chat_1, inlineChatSavingService_1, inlineChatSession_1, inlineChatSessionService_1, inlineChatSessionServiceImpl_1, inlineChat_1, workbenchTestServices_1, cancellation_1, types_1, inlineChatServiceImpl_1, editOperation_1, position_1, editorWorker_1, testWorkerService_1, extensions_1, log_1, telemetry_1, telemetryUtils_1, workspace_1, chatWidget_1, chatContributionService_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_1, chatWidgetHistoryService_1, mockChatVariables_1, viewsService_1, workbenchTestServices_2, chatAgents_1, mockChatContributionService_1, commands_1, editorTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ReplyResponse', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Inline chat widget should not contain Accept and Discard buttons for responses which do not include changes. #3143', async function () {
            const textFileService = new class extends (0, mock_1.mock)() {
            };
            const languageService = new class extends (0, mock_1.mock)() {
            };
            const message = { value: 'hello' };
            const emptyMessage = { value: '' };
            const raw = {
                type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                edits: [],
                message: emptyMessage,
                id: 1234
            };
            {
                const res2 = new inlineChatSession_1.ReplyResponse(raw, emptyMessage, uri_1.URI.parse('test:uri'), 1, [], '1', textFileService, languageService);
                assert.strictEqual(res2.responseType, "empty" /* InlineChatResponseTypes.Empty */);
            }
            {
                const res1 = new inlineChatSession_1.ReplyResponse({ ...raw, message }, message, uri_1.URI.parse('test:uri'), 1, [], '1', textFileService, languageService);
                assert.strictEqual(res1.responseType, "onlyMessages" /* InlineChatResponseTypes.OnlyMessages */);
            }
            {
                const res3 = new inlineChatSession_1.ReplyResponse({ ...raw, edits: [{ text: 'EDIT', range: new range_1.Range(1, 1, 1, 1) }] }, emptyMessage, uri_1.URI.parse('test:uri'), 1, [], '1', textFileService, languageService);
                assert.strictEqual(res3.responseType, "onlyEdits" /* InlineChatResponseTypes.OnlyEdits */);
            }
            {
                const res4 = new inlineChatSession_1.ReplyResponse({ ...raw, edits: [{ text: 'EDIT', range: new range_1.Range(1, 1, 1, 1) }], message }, message, uri_1.URI.parse('test:uri'), 1, [], '1', textFileService, languageService);
                assert.strictEqual(res4.responseType, "mixed" /* InlineChatResponseTypes.Mixed */);
            }
        });
    });
    suite('InlineChatSession', function () {
        const store = new lifecycle_1.DisposableStore();
        let editor;
        let model;
        let instaService;
        let inlineChatService;
        let inlineChatSessionService;
        setup(function () {
            const contextKeyService = new mockKeybindingService_1.MockContextKeyService();
            const serviceCollection = new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [chatVariables_1.IChatVariablesService, new mockChatVariables_1.MockChatVariablesService()], [log_1.ILogService, new log_1.NullLogService()], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [extensions_1.IExtensionService, new workbenchTestServices_2.TestExtensionService()], [contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService()], [viewsService_1.IViewsService, new workbenchTestServices_2.TestExtensionService()], [chatContributionService_1.IChatContributionService, new workbenchTestServices_2.TestExtensionService()], [workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService()], [chatWidgetHistoryService_1.IChatWidgetHistoryService, new descriptors_1.SyncDescriptor(chatWidgetHistoryService_1.ChatWidgetHistoryService)], [chat_1.IChatWidgetService, new descriptors_1.SyncDescriptor(chatWidget_1.ChatWidgetService)], [chatSlashCommands_1.IChatSlashCommandService, new descriptors_1.SyncDescriptor(chatSlashCommands_1.ChatSlashCommandService)], [chatService_1.IChatService, new descriptors_1.SyncDescriptor(chatServiceImpl_1.ChatService)], [editorWorker_1.IEditorWorkerService, new descriptors_1.SyncDescriptor(testWorkerService_1.TestWorkerService)], [chatContributionService_1.IChatContributionService, new mockChatContributionService_1.MockChatContributionService()], [chatAgents_1.IChatAgentService, new descriptors_1.SyncDescriptor(chatAgents_1.ChatAgentService)], [inlineChat_1.IInlineChatService, new descriptors_1.SyncDescriptor(inlineChatServiceImpl_1.InlineChatServiceImpl)], [contextkey_1.IContextKeyService, contextKeyService], [diffProviderFactoryService_1.IDiffProviderFactoryService, new descriptors_1.SyncDescriptor(testDiffProviderFactoryService_1.TestDiffProviderFactoryService)], [inlineChatSessionService_1.IInlineChatSessionService, new descriptors_1.SyncDescriptor(inlineChatSessionServiceImpl_1.InlineChatSessionServiceImpl)], [commands_1.ICommandService, new descriptors_1.SyncDescriptor(editorTestServices_1.TestCommandService)], [inlineChatSavingService_1.IInlineChatSavingService, new class extends (0, mock_1.mock)() {
                    markChanged(session) {
                        // noop
                    }
                }], [progress_1.IEditorProgressService, new class extends (0, mock_1.mock)() {
                    show(total, delay) {
                        return {
                            total() { },
                            worked(value) { },
                            done() { },
                        };
                    }
                }], [chat_1.IChatAccessibilityService, new class extends (0, mock_1.mock)() {
                    acceptResponse(response, requestId) { }
                    acceptRequest() { return -1; }
                }], [accessibleView_1.IAccessibleViewService, new class extends (0, mock_1.mock)() {
                    getOpenAriaHint(verbositySettingKey) {
                        return null;
                    }
                }], [configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [views_1.IViewDescriptorService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.onDidChangeLocation = event_1.Event.None;
                    }
                }]);
            instaService = store.add((0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store).createChild(serviceCollection));
            inlineChatService = instaService.get(inlineChat_1.IInlineChatService);
            inlineChatSessionService = store.add(instaService.get(inlineChatSessionService_1.IInlineChatSessionService));
            instaService.get(chatAgents_1.IChatAgentService).registerDynamicAgent({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                id: 'testAgent',
                name: 'testAgent',
                isDefault: true,
                locations: [chatAgents_1.ChatAgentLocation.Panel],
                metadata: {},
                slashCommands: []
            }, {
                async invoke() {
                    return {};
                }
            });
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(session, request) {
                    return {
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        id: Math.random(),
                        edits: [{
                                range: new range_1.Range(1, 1, 1, 1),
                                text: request.prompt
                            }]
                    };
                }
            }));
            model = store.add(instaService.get(model_1.IModelService).createModel('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven', null));
            editor = store.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instaService, model));
        });
        teardown(function () {
            store.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function makeEditAsAi(edit) {
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            (0, types_1.assertType)(session);
            session.hunkData.ignoreTextModelNChanges = true;
            try {
                editor.executeEdits('test', Array.isArray(edit) ? edit : [edit]);
            }
            finally {
                session.hunkData.ignoreTextModelNChanges = false;
            }
            await session.hunkData.recompute();
        }
        function makeEdit(edit) {
            editor.executeEdits('test', Array.isArray(edit) ? edit : [edit]);
        }
        test('Create, release', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, info', async function () {
            const decorationCountThen = model.getAllDecorations().length;
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            assert.ok(session.textModelN === model);
            await makeEditAsAi(editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'));
            assert.strictEqual(session.hunkData.size, 1);
            let [hunk] = session.hunkData.getInfo();
            (0, types_1.assertType)(hunk);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
            assert.ok(hunk.getRangesN()[0].equalsRange({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 7 }));
            await makeEditAsAi(editOperation_1.EditOperation.insert(new position_1.Position(1, 3), 'foobar'));
            [hunk] = session.hunkData.getInfo();
            assert.ok(hunk.getRangesN()[0].equalsRange({ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 13 }));
            inlineChatSessionService.releaseSession(session);
            assert.strictEqual(model.getAllDecorations().length, decorationCountThen); // no leaked decorations!
        });
        test('HunkData, accept', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'), editOperation_1.EditOperation.insert(new position_1.Position(10, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 2);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            for (const hunk of session.hunkData.getInfo()) {
                (0, types_1.assertType)(hunk);
                assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
                hunk.acceptChanges();
                assert.strictEqual(hunk.getState(), 1 /* HunkState.Accepted */);
            }
            assert.strictEqual(session.textModel0.getValue(), session.textModelN.getValue());
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, reject', async function () {
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI_EDIT\n'), editOperation_1.EditOperation.insert(new position_1.Position(10, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 2);
            assert.ok(!session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            for (const hunk of session.hunkData.getInfo()) {
                (0, types_1.assertType)(hunk);
                assert.strictEqual(hunk.getState(), 0 /* HunkState.Pending */);
                hunk.discardChanges();
                assert.strictEqual(hunk.getState(), 2 /* HunkState.Rejected */);
            }
            assert.strictEqual(session.textModel0.getValue(), session.textModelN.getValue());
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, N rounds', async function () {
            model.setValue('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven\ntwelwe\nthirteen\nfourteen\nfifteen\nsixteen\nseventeen\neighteen\nnineteen\n');
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            assert.ok(session.textModel0.equalsTextBuffer(session.textModelN.getTextBuffer()));
            assert.strictEqual(session.hunkData.size, 0);
            // ROUND #1
            await makeEditAsAi([
                editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'AI1'),
                editOperation_1.EditOperation.insert(new position_1.Position(4, 1), 'AI2'),
                editOperation_1.EditOperation.insert(new position_1.Position(19, 1), 'AI3')
            ]);
            assert.strictEqual(session.hunkData.size, 2); // AI1, AI2 are merged into one hunk, AI3 is a separate hunk
            let [first, second] = session.hunkData.getInfo();
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(model.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            assert.ok(!session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(!session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(!session.textModel0.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            first.acceptChanges();
            assert.ok(session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI1'));
            assert.ok(session.textModel0.getValueInRange(first.getRangesN()[0]).includes('AI2'));
            assert.ok(!session.textModel0.getValueInRange(second.getRangesN()[0]).includes('AI3'));
            // ROUND #2
            await makeEditAsAi([
                editOperation_1.EditOperation.insert(new position_1.Position(7, 1), 'AI4'),
            ]);
            assert.strictEqual(session.hunkData.size, 2);
            [first, second] = session.hunkData.getInfo();
            assert.ok(model.getValueInRange(first.getRangesN()[0]).includes('AI4')); // the new hunk (in line-order)
            assert.ok(model.getValueInRange(second.getRangesN()[0]).includes('AI3')); // the previous hunk remains
            inlineChatSessionService.releaseSession(session);
        });
        test('HunkData, (mirror) edit before', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 4), 'ONE')]);
            assert.strictEqual(session.textModelN.getValue(), ['ONE', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['ONE', 'two', 'three'].join('\n'));
        });
        test('HunkData, (mirror) edit after', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            const [hunk] = session.hunkData.getInfo();
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'USER1')]);
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'three', 'four', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'USER2')]);
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'three', 'USER2four', 'five'].join('\n'));
            hunk.acceptChanges();
            assert.strictEqual(session.textModelN.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['USER1one', 'two', 'AI_EDIT', 'three', 'USER2four', 'five'].join('\n'));
        });
        test('HunkData, (mirror) edit inside ', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(3, 4, 3, 7), 'wwaaassss')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI wwaaassss HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three'].join('\n'));
        });
        test('HunkData, (mirror) edit after dicard ', async function () {
            const lines = ['one', 'two', 'three'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI WAS HERE\n')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI WAS HERE', 'three'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            assert.strictEqual(session.hunkData.size, 1);
            const [hunk] = session.hunkData.getInfo();
            hunk.discardChanges();
            assert.strictEqual(session.textModelN.getValue(), lines.join('\n'));
            assert.strictEqual(session.textModel0.getValue(), lines.join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(3, 4, 3, 6), '3333')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'thr3333'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'thr3333'].join('\n'));
        });
        test('HunkData, (mirror) edit after, multi turn', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'FOO')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(2, 4), ' zwei')]);
            assert.strictEqual(session.hunkData.size, 1);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two zwei', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(6, 3, 6, 5), 'vefivefi')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two zwei', 'AI_EDIT', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
        });
        test('HunkData, (mirror) edit after, multi turn 2', async function () {
            const lines = ['one', 'two', 'three', 'four', 'five'];
            model.setValue(lines.join('\n'));
            const session = await inlineChatSessionService.createSession(editor, { editMode: "live" /* EditMode.Live */ }, cancellation_1.CancellationToken.None);
            (0, types_1.assertType)(session);
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(3, 1), 'AI_EDIT\n')]);
            assert.strictEqual(session.hunkData.size, 1);
            makeEdit([editOperation_1.EditOperation.insert(new position_1.Position(5, 1), 'FOO')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'two', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            await makeEditAsAi([editOperation_1.EditOperation.insert(new position_1.Position(2, 4), 'zwei')]);
            assert.strictEqual(session.hunkData.size, 1);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'twozwei', 'AI_EDIT', 'three', 'FOOfour', 'five'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'five'].join('\n'));
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(6, 3, 6, 5), 'vefivefi')]);
            assert.strictEqual(session.textModelN.getValue(), ['one', 'twozwei', 'AI_EDIT', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            assert.strictEqual(session.textModel0.getValue(), ['one', 'two', 'three', 'FOOfour', 'fivefivefi'].join('\n'));
            session.hunkData.getInfo()[0].acceptChanges();
            assert.strictEqual(session.textModelN.getValue(), session.textModel0.getValue());
            makeEdit([editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 1), 'done')]);
            assert.strictEqual(session.textModelN.getValue(), session.textModel0.getValue());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC90ZXN0L2Jyb3dzZXIvaW5saW5lQ2hhdFNlc3Npb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFrRUEsS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUV0QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLG9IQUFvSCxFQUFFLEtBQUs7WUFDL0gsTUFBTSxlQUFlLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQW9CO2FBQUksQ0FBQztZQUN2RSxNQUFNLGVBQWUsR0FBRyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBb0I7YUFBSSxDQUFDO1lBRXZFLE1BQU0sT0FBTyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ25DLE1BQU0sWUFBWSxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBRW5DLE1BQU0sR0FBRyxHQUE0QjtnQkFDcEMsSUFBSSxzREFBbUM7Z0JBQ3ZDLEtBQUssRUFBRSxFQUFFO2dCQUNULE9BQU8sRUFBRSxZQUFZO2dCQUNyQixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUM7WUFFRixDQUFDO2dCQUNBLE1BQU0sSUFBSSxHQUFHLElBQUksaUNBQWEsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2dCQUN2SCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLDhDQUFnQyxDQUFDO1lBQ3RFLENBQUM7WUFDRCxDQUFDO2dCQUNBLE1B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