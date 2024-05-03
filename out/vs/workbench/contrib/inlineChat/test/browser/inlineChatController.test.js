/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/editorWorker", "vs/editor/common/services/model", "vs/editor/test/browser/diff/testDiffProviderFactoryService", "vs/editor/test/browser/testCodeEditor", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/progress/common/progress", "vs/workbench/common/views", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl", "vs/workbench/test/browser/workbenchTestServices", "../../browser/inlineChatSavingService", "../../browser/inlineChatSessionService", "../../browser/inlineChatSessionServiceImpl", "./testWorkerService", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/common/mockChatVariables", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/common/workspace", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/platform/commands/common/commands", "vs/editor/test/browser/editorTestServices"], function (require, exports, assert, arrays_1, async_1, event_1, lifecycle_1, network_1, mock_1, timeTravelScheduler_1, diffProviderFactoryService_1, editOperation_1, range_1, editorWorker_1, model_1, testDiffProviderFactoryService_1, testCodeEditor_1, configuration_1, testConfigurationService_1, contextkey_1, descriptors_1, serviceCollection_1, mockKeybindingService_1, progress_1, views_1, accessibleView_1, chat_1, chatAgents_1, inlineChatController_1, inlineChat_1, inlineChatServiceImpl_1, workbenchTestServices_1, inlineChatSavingService_1, inlineChatSessionService_1, inlineChatSessionServiceImpl_1, testWorkerService_1, chatContributionService_1, extensions_1, chatService_1, chatServiceImpl_1, chatVariables_1, mockChatVariables_1, log_1, telemetry_1, telemetryUtils_1, workbenchTestServices_2, workspace_1, viewsService_1, chatSlashCommands_1, chatWidget_1, chatWidgetHistoryService_1, commands_1, editorTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('InteractiveChatController', function () {
        class TestController extends inlineChatController_1.InlineChatController {
            constructor() {
                super(...arguments);
                this._onDidChangeState = new event_1.Emitter();
                this.onDidChangeState = this._onDidChangeState.event;
                this.states = [];
            }
            static { this.INIT_SEQUENCE = ["CREATE_SESSION" /* State.CREATE_SESSION */, "INIT_UI" /* State.INIT_UI */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]; }
            static { this.INIT_SEQUENCE_AUTO_SEND = [...this.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]; }
            waitFor(states) {
                const actual = [];
                return new Promise((resolve, reject) => {
                    const d = this.onDidChangeState(state => {
                        actual.push(state);
                        if ((0, arrays_1.equals)(states, actual)) {
                            d.dispose();
                            resolve();
                        }
                    });
                    setTimeout(() => {
                        d.dispose();
                        reject(new Error(`timeout, \nEXPECTED: ${states.join('>')}, \nACTUAL  : ${actual.join('>')}`));
                    }, 1000);
                });
            }
            async _nextState(state, options) {
                let nextState = state;
                while (nextState) {
                    this._onDidChangeState.fire(nextState);
                    this.states.push(nextState);
                    nextState = await this[nextState](options);
                }
            }
            dispose() {
                super.dispose();
                this._onDidChangeState.dispose();
            }
        }
        const store = new lifecycle_1.DisposableStore();
        let configurationService;
        let editor;
        let model;
        let ctrl;
        let contextKeyService;
        let inlineChatService;
        let inlineChatSessionService;
        let instaService;
        setup(function () {
            const serviceCollection = new serviceCollection_1.ServiceCollection([configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService()], [chatVariables_1.IChatVariablesService, new mockChatVariables_1.MockChatVariablesService()], [log_1.ILogService, new log_1.NullLogService()], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [extensions_1.IExtensionService, new workbenchTestServices_2.TestExtensionService()], [contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService()], [viewsService_1.IViewsService, new workbenchTestServices_2.TestExtensionService()], [chatContributionService_1.IChatContributionService, new workbenchTestServices_2.TestExtensionService()], [workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService()], [chatWidgetHistoryService_1.IChatWidgetHistoryService, new descriptors_1.SyncDescriptor(chatWidgetHistoryService_1.ChatWidgetHistoryService)], [chat_1.IChatWidgetService, new descriptors_1.SyncDescriptor(chatWidget_1.ChatWidgetService)], [chatSlashCommands_1.IChatSlashCommandService, new descriptors_1.SyncDescriptor(chatSlashCommands_1.ChatSlashCommandService)], [chatService_1.IChatService, new descriptors_1.SyncDescriptor(chatServiceImpl_1.ChatService)], [editorWorker_1.IEditorWorkerService, new descriptors_1.SyncDescriptor(testWorkerService_1.TestWorkerService)], [contextkey_1.IContextKeyService, contextKeyService], [chatAgents_1.IChatAgentService, new descriptors_1.SyncDescriptor(chatAgents_1.ChatAgentService)], [inlineChat_1.IInlineChatService, new descriptors_1.SyncDescriptor(inlineChatServiceImpl_1.InlineChatServiceImpl)], [diffProviderFactoryService_1.IDiffProviderFactoryService, new descriptors_1.SyncDescriptor(testDiffProviderFactoryService_1.TestDiffProviderFactoryService)], [inlineChatSessionService_1.IInlineChatSessionService, new descriptors_1.SyncDescriptor(inlineChatSessionServiceImpl_1.InlineChatSessionServiceImpl)], [commands_1.ICommandService, new descriptors_1.SyncDescriptor(editorTestServices_1.TestCommandService)], [inlineChatSavingService_1.IInlineChatSavingService, new class extends (0, mock_1.mock)() {
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
                }], [configuration_1.IConfigurationService, configurationService], [views_1.IViewDescriptorService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.onDidChangeLocation = event_1.Event.None;
                    }
                }]);
            instaService = store.add((store.add((0, workbenchTestServices_1.workbenchInstantiationService)(undefined, store))).createChild(serviceCollection));
            configurationService = instaService.get(configuration_1.IConfigurationService);
            configurationService.setUserConfiguration('chat', { editor: { fontSize: 14, fontFamily: 'default' } });
            configurationService.setUserConfiguration('inlineChat', { mode: 'livePreview' });
            configurationService.setUserConfiguration('editor', {});
            contextKeyService = instaService.get(contextkey_1.IContextKeyService);
            inlineChatService = instaService.get(inlineChat_1.IInlineChatService);
            const chatAgentService = instaService.get(chatAgents_1.IChatAgentService);
            store.add(chatAgentService.registerDynamicAgent({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                id: 'testAgent',
                name: 'testAgent',
                isDefault: true,
                locations: [chatAgents_1.ChatAgentLocation.Panel],
                metadata: {},
                slashCommands: []
            }, {
                async invoke(request, progress, history, token) {
                    return {};
                },
            }));
            inlineChatSessionService = store.add(instaService.get(inlineChatSessionService_1.IInlineChatSessionService));
            model = store.add(instaService.get(model_1.IModelService).createModel('Hello\nWorld\nHello Again\nHello World\n', null));
            editor = store.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instaService, model));
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test Default',
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
        });
        teardown(function () {
            store.clear();
            ctrl?.dispose();
        });
        // TODO@jrieken re-enable, looks like List/ChatWidget is leaking
        // ensureNoDisposablesAreLeakedInTestSuite();
        test('creation, not showing anything', function () {
            ctrl = instaService.createInstance(TestController, editor);
            assert.ok(ctrl);
            assert.strictEqual(ctrl.getWidgetPosition(), undefined);
        });
        test('run (show/hide)', async function () {
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
            const run = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            assert.ok(ctrl.getWidgetPosition() !== undefined);
            await ctrl.cancelSession();
            await run;
            assert.ok(ctrl.getWidgetPosition() === undefined);
        });
        test('wholeRange does not expand to whole lines, editor selection default', async function () {
            editor.setSelection(new range_1.Range(1, 1, 1, 3));
            ctrl = instaService.createInstance(TestController, editor);
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(session, request) {
                    throw new Error();
                }
            }));
            ctrl.run({});
            await event_1.Event.toPromise(event_1.Event.filter(ctrl.onDidChangeState, e => e === "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */));
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 3));
            await ctrl.cancelSession();
        });
        test('wholeRange expands to whole lines, session provided', async function () {
            editor.setSelection(new range_1.Range(1, 1, 1, 1));
            ctrl = instaService.createInstance(TestController, editor);
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(1, 1, 1, 3)
                    };
                },
                provideResponse(session, request) {
                    throw new Error();
                }
            }));
            ctrl.run({});
            await event_1.Event.toPromise(event_1.Event.filter(ctrl.onDidChangeState, e => e === "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */));
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 3));
            await ctrl.cancelSession();
        });
        test('typing outside of wholeRange finishes session', async function () {
            configurationService.setUserConfiguration("inlineChat.finishOnType" /* InlineChatConfigKeys.FinishOnType */, true);
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 1, 10 /* line length */));
            editor.setSelection(new range_1.Range(2, 1, 2, 1));
            editor.trigger('test', 'type', { text: 'a' });
            await ctrl.waitFor(["DONE" /* State.ACCEPT */]);
            await r;
        });
        test('\'whole range\' isn\'t updated for edits outside whole range #4346', async function () {
            editor.setSelection(new range_1.Range(3, 1, 3, 1));
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                provideResponse(session, request) {
                    return {
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        id: Math.random(),
                        edits: [{
                                range: new range_1.Range(1, 1, 1, 1), // EDIT happens outside of whole range
                                text: `${request.prompt}\n${request.prompt}`
                            }]
                    };
                }
            }));
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor(TestController.INIT_SEQUENCE);
            const r = ctrl.run({ message: 'GENGEN', autoSend: false });
            await p;
            const session = inlineChatSessionService.getSession(editor, editor.getModel().uri);
            assert.ok(session);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(3, 1, 3, 3)); // initial
            ctrl.acceptInput();
            await ctrl.waitFor(["SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            assert.deepStrictEqual(session.wholeRange.value, new range_1.Range(1, 1, 4, 3));
            await ctrl.cancelSession();
            await r;
        });
        test('Stuck inline chat widget #211', async function () {
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                provideResponse(session, request) {
                    return new Promise(() => { });
                }
            }));
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */]);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            ctrl.acceptSession();
            await r;
            assert.strictEqual(ctrl.getWidgetPosition(), undefined);
        });
        test('[Bug] Inline Chat\'s streaming pushed broken iterations to the undo stack #2403', async function () {
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random(),
                        wholeRange: new range_1.Range(3, 1, 3, 3)
                    };
                },
                async provideResponse(session, request, progress) {
                    progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: 'hEllo1\n' }] });
                    progress.report({ edits: [{ range: new range_1.Range(2, 1, 2, 1), text: 'hEllo2\n' }] });
                    return {
                        id: Math.random(),
                        type: "editorEdit" /* InlineChatResponseType.EditorEdit */,
                        edits: [{ range: new range_1.Range(1, 1, 1000, 1), text: 'Hello1\nHello2\n' }]
                    };
                }
            }));
            const valueThen = editor.getModel().getValue();
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'Hello', autoSend: true });
            await p;
            ctrl.acceptSession();
            await r;
            assert.strictEqual(editor.getModel().getValue(), 'Hello1\nHello2\n');
            editor.getModel().undo();
            assert.strictEqual(editor.getModel().getValue(), valueThen);
        });
        test.skip('UI is streaming edits minutes after the response is finished #3345', async function () {
            configurationService.setUserConfiguration("inlineChat.mode" /* InlineChatConfigKeys.Mode */, "live" /* EditMode.Live */);
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ maxTaskCount: Number.MAX_SAFE_INTEGER }, async () => {
                store.add(inlineChatService.addProvider({
                    extensionId: extensions_1.nullExtensionDescription.identifier,
                    label: 'Unit Test',
                    prepareInlineChatSession() {
                        return {
                            id: Math.random(),
                        };
                    },
                    async provideResponse(session, request, progress) {
                        const text = '${CSI}#a\n${CSI}#b\n${CSI}#c\n';
                        await (0, async_1.timeout)(10);
                        progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: text }] });
                        await (0, async_1.timeout)(10);
                        progress.report({ edits: [{ range: new range_1.Range(1, 1, 1, 1), text: text.repeat(1000) + 'DONE' }] });
                        throw new Error('Too long');
                    }
                }));
                // let modelChangeCounter = 0;
                // store.add(editor.getModel().onDidChangeContent(() => { modelChangeCounter++; }));
                ctrl = instaService.createInstance(TestController, editor);
                const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
                const r = ctrl.run({ message: 'Hello', autoSend: true });
                await p;
                // assert.ok(modelChangeCounter > 0, modelChangeCounter.toString()); // some changes have been made
                // const modelChangeCounterNow = modelChangeCounter;
                assert.ok(!editor.getModel().getValue().includes('DONE'));
                await (0, async_1.timeout)(10);
                // assert.strictEqual(modelChangeCounterNow, modelChangeCounter);
                assert.ok(!editor.getModel().getValue().includes('DONE'));
                await ctrl.cancelSession();
                await r;
            });
        });
        test('escape doesn\'t remove code added from inline editor chat #3523 1/2', async function () {
            // NO manual edits -> cancel
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'GENERATED', autoSend: true });
            await p;
            assert.ok(model.getValue().includes('GENERATED'));
            assert.strictEqual(contextKeyService.getContextKeyValue(inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.key), undefined);
            ctrl.cancelSession();
            await r;
            assert.ok(!model.getValue().includes('GENERATED'));
        });
        test('escape doesn\'t remove code added from inline editor chat #3523, 2/2', async function () {
            // manual edits -> finish
            ctrl = instaService.createInstance(TestController, editor);
            const p = ctrl.waitFor([...TestController.INIT_SEQUENCE, "SHOW_REQUEST" /* State.SHOW_REQUEST */, "APPLY_RESPONSE" /* State.APPLY_RESPONSE */, "SHOW_RESPONSE" /* State.SHOW_RESPONSE */, "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */]);
            const r = ctrl.run({ message: 'GENERATED', autoSend: true });
            await p;
            assert.ok(model.getValue().includes('GENERATED'));
            editor.executeEdits('test', [editOperation_1.EditOperation.insert(model.getFullModelRange().getEndPosition(), 'MANUAL')]);
            assert.strictEqual(contextKeyService.getContextKeyValue(inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.key), true);
            ctrl.finishExistingSession();
            await r;
            assert.ok(model.getValue().includes('GENERATED'));
            assert.ok(model.getValue().includes('MANUAL'));
        });
        test('context has correct preview document', async function () {
            const requests = [];
            store.add(inlineChatService.addProvider({
                extensionId: extensions_1.nullExtensionDescription.identifier,
                label: 'Unit Test',
                prepareInlineChatSession() {
                    return {
                        id: Math.random()
                    };
                },
                provideResponse(_session, request) {
                    requests.push(request);
                    return undefined;
                }
            }));
            async function makeRequest() {
                const p = ctrl.waitFor(TestController.INIT_SEQUENCE_AUTO_SEND);
                const r = ctrl.run({ message: 'Hello', autoSend: true });
                await p;
                await ctrl.cancelSession();
                await r;
            }
            // manual edits -> finish
            ctrl = instaService.createInstance(TestController, editor);
            configurationService.setUserConfiguration('inlineChat', { mode: "live" /* EditMode.Live */ });
            await makeRequest();
            configurationService.setUserConfiguration('inlineChat', { mode: "preview" /* EditMode.Preview */ });
            await makeRequest();
            assert.strictEqual(requests.length, 2);
            assert.strictEqual(requests[0].previewDocument.toString(), model.uri.toString()); // live
            assert.strictEqual(requests[1].previewDocument.scheme, network_1.Schemas.vscode); // preview
            assert.strictEqual(requests[1].previewDocument.authority, 'inline-chat');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRyb2xsZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC90ZXN0L2Jyb3dzZXIvaW5saW5lQ2hhdENvbnRyb2xsZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTREaEcsS0FBSyxDQUFDLDJCQUEyQixFQUFFO1FBQ2xDLE1BQU0sY0FBZSxTQUFRLDJDQUFvQjtZQUFqRDs7Z0JBS2tCLHNCQUFpQixHQUFHLElBQUksZUFBTyxFQUFTLENBQUM7Z0JBQ2pELHFCQUFnQixHQUFpQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO2dCQUU5RCxXQUFNLEdBQXFCLEVBQUUsQ0FBQztZQWtDeEMsQ0FBQztxQkF4Q08sa0JBQWEsR0FBcUIseUhBQTJELEFBQWhGLENBQWlGO3FCQUM5Riw0QkFBdUIsR0FBcUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLCtLQUFzRixBQUFqSSxDQUFrSTtZQU9oSyxPQUFPLENBQUMsTUFBd0I7Z0JBQy9CLE1BQU0sTUFBTSxHQUFZLEVBQUUsQ0FBQztnQkFFM0IsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUN2QyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNuQixJQUFJLElBQUEsZUFBTSxFQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDOzRCQUM1QixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7NEJBQ1osT0FBTyxFQUFFLENBQUM7d0JBQ1gsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztvQkFFSCxVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUNmLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDWixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsd0JBQXdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLGlCQUFpQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUNoRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ1YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRWtCLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBWSxFQUFFLE9BQTZCO2dCQUM5RSxJQUFJLFNBQVMsR0FBaUIsS0FBSyxDQUFDO2dCQUNwQyxPQUFPLFNBQVMsRUFBRSxDQUFDO29CQUNsQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM3QixJQUFJLENBQUMsTUFBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO1lBQ0YsQ0FBQztZQUVRLE9BQU87Z0JBQ2YsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbEMsQ0FBQzs7UUFHRixNQUFNLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUNwQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksTUFBeUIsQ0FBQztRQUM5QixJQUFJLEtBQWlCLENBQUM7UUFDdEIsSUFBSSxJQUFvQixDQUFDO1FBQ3pCLElBQUksaUJBQXdDLENBQUM7UUFDN0MsSUFBSSxpQkFBd0MsQ0FBQztRQUM3QyxJQUFJLHdCQUFtRCxDQUFDO1FBQ3hELElBQUksWUFBc0MsQ0FBQztRQUUzQyxLQUFLLENBQUM7WUFFTCxNQUFNLGlCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQzlDLENBQUMscUNBQXFCLEVBQUUsSUFBSSxtREFBd0IsRUFBRSxDQUFDLEVBQ3ZELENBQUMscUNBQXFCLEVBQUUsSUFBSSw0Q0FBd0IsRUFBRSxDQUFDLEVBQ3ZELENBQUMsaUJBQVcsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxFQUNuQyxDQUFDLDZCQUFpQixFQUFFLHFDQUFvQixDQUFDLEVBQ3pDLENBQUMsOEJBQWlCLEVBQUUsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDLEVBQy9DLENBQUMsK0JBQWtCLEVBQUUsSUFBSSw2Q0FBcUIsRUFBRSxDQUFDLEVBQ2pELENBQUMsNEJBQWEsRUFBRSxJQUFJLDRDQUFvQixFQUFFLENBQUMsRUFDM0MsQ0FBQyxrREFBd0IsRUFBRSxJQUFJLDRDQUFvQixFQUFFLENBQUMsRUFDdEQsQ0FBQyxvQ0FBd0IsRUFBRSxJQUFJLDBDQUFrQixFQUFFLENBQUMsRUFDcEQsQ0FBQyxvREFBeUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsbURBQXdCLENBQUMsQ0FBQyxFQUN6RSxDQUFDLHlCQUFrQixFQUFFLElBQUksNEJBQWMsQ0FBQyw4QkFBaUIsQ0FBQyxDQUFDLEVBQzNELENBQUMsNENBQXdCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLDJDQUF1QixDQUFDLENBQUMsRUFDdkUsQ0FBQywwQkFBWSxFQUFFLElBQUksNEJBQWMsQ0FBQyw2QkFBVyxDQUFDLENBQUMsRUFDL0MsQ0FBQyxtQ0FBb0IsRUFBRSxJQUFJLDRCQUFjLENBQUMscUNBQWlCLENBQUMsQ0FBQyxFQUM3RCxDQUFDLCtCQUFrQixFQUFFLGlCQUFpQixDQUFDLEVBQ3ZDLENBQUMsOEJBQWlCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLDZCQUFnQixDQUFDLENBQUMsRUFDekQsQ0FBQywrQkFBa0IsRUFBRSxJQUFJLDRCQUFjLENBQUMsNkNBQXFCLENBQUMsQ0FBQyxFQUMvRCxDQUFDLHdEQUEyQixFQUFFLElBQUksNEJBQWMsQ0FBQywrREFBOEIsQ0FBQyxDQUFDLEVBQ2pGLENBQUMsb0RBQXlCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLDJEQUE0QixDQUFDLENBQUMsRUFDN0UsQ0FBQywwQkFBZSxFQUFFLElBQUksNEJBQWMsQ0FBQyx1Q0FBa0IsQ0FBQyxDQUFDLEVBQ3pELENBQUMsa0RBQXdCLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTRCO29CQUNuRSxXQUFXLENBQUMsT0FBZ0I7d0JBQ3BDLE9BQU87b0JBQ1IsQ0FBQztpQkFDRCxDQUFDLEVBQ0YsQ0FBQyxpQ0FBc0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMEI7b0JBQy9ELElBQUksQ0FBQyxLQUFjLEVBQUUsS0FBZTt3QkFDNUMsT0FBTzs0QkFDTixLQUFLLEtBQUssQ0FBQzs0QkFDWCxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUM7NEJBQ2pCLElBQUksS0FBSyxDQUFDO3lCQUNWLENBQUM7b0JBQ0gsQ0FBQztpQkFDRCxDQUFDLEVBQ0YsQ0FBQyxnQ0FBeUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBNkI7b0JBQ3JFLGNBQWMsQ0FBQyxRQUE0QyxFQUFFLFNBQWlCLElBQVUsQ0FBQztvQkFDekYsYUFBYSxLQUFhLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUMvQyxDQUFDLEVBQ0YsQ0FBQyx1Q0FBc0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMEI7b0JBQy9ELGVBQWUsQ0FBQyxtQkFBb0Q7d0JBQzVFLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7aUJBQ0QsQ0FBQyxFQUNGLENBQUMscUNBQXFCLEVBQUUsb0JBQW9CLENBQUMsRUFDN0MsQ0FBQyw4QkFBc0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMEI7b0JBQTVDOzt3QkFDbkIsd0JBQW1CLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztvQkFDM0MsQ0FBQztpQkFBQSxDQUFDLENBQ0YsQ0FBQztZQUVGLFlBQVksR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUV0SCxvQkFBb0IsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUE2QixDQUFDO1lBQzNGLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUNqRixvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFeEQsaUJBQWlCLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBMEIsQ0FBQztZQUVsRixpQkFBaUIsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUEwQixDQUFDO1lBRWxGLE1BQU0sZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyw4QkFBaUIsQ0FBQyxDQUFDO1lBRTdELEtBQUssQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUM7Z0JBQy9DLFdBQVcsRUFBRSxxQ0FBd0IsQ0FBQyxVQUFVO2dCQUNoRCxFQUFFLEVBQUUsV0FBVztnQkFDZixJQUFJLEVBQUUsV0FBVztnQkFDakIsU0FBUyxFQUFFLElBQUk7Z0JBQ2YsU0FBUyxFQUFFLENBQUMsOEJBQWlCLENBQUMsS0FBSyxDQUFDO2dCQUNwQyxRQUFRLEVBQUUsRUFBRTtnQkFDWixhQUFhLEVBQUUsRUFBRTthQUNqQixFQUFFO2dCQUNGLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSztvQkFDN0MsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0osd0JBQXdCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLG9EQUF5QixDQUFDLENBQUMsQ0FBQztZQUVsRixLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLHFCQUFhLENBQUMsQ0FBQyxXQUFXLENBQUMsMENBQTBDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqSCxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDBDQUF5QixFQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRW5FLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtnQkFDaEQsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsd0JBQXdCO29CQUN2QixPQUFPO3dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO3FCQUNqQixDQUFDO2dCQUNILENBQUM7Z0JBQ0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPO29CQUMvQixPQUFPO3dCQUNOLElBQUksc0RBQW1DO3dCQUN2QyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDakIsS0FBSyxFQUFFLENBQUM7Z0NBQ1AsS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDNUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNOzZCQUNwQixDQUFDO3FCQUNGLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUM7WUFDUixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZCxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFSCxnRUFBZ0U7UUFDaEUsNkNBQTZDO1FBRTdDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRTtZQUN0QyxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEtBQUs7WUFDNUIsSUFBSSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDL0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLENBQUM7WUFDUixNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBRTNCLE1BQU0sR0FBRyxDQUFDO1lBRVYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxRUFBcUUsRUFBRSxLQUFLO1lBRWhGLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZDLFdBQVcsRUFBRSxxQ0FBd0IsQ0FBQyxVQUFVO2dCQUNoRCxLQUFLLEVBQUUsV0FBVztnQkFDbEIsd0JBQXdCO29CQUN2QixPQUFPO3dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO3FCQUNqQixDQUFDO2dCQUNILENBQUM7Z0JBQ0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPO29CQUMvQixNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ25CLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDYixNQUFNLGFBQUssQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdEQUF5QixDQUFDLENBQUMsQ0FBQztZQUU1RixNQUFNLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4RSxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxREFBcUQsRUFBRSxLQUFLO1lBRWhFLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFM0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7Z0JBQ3ZDLFdBQVcsRUFBRSxxQ0FBd0IsQ0FBQyxVQUFVO2dCQUNoRCxLQUFLLEVBQUUsV0FBVztnQkFDbEIsd0JBQXdCO29CQUN2QixPQUFPO3dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNqQixVQUFVLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3FCQUNqQyxDQUFDO2dCQUNILENBQUM7Z0JBQ0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxPQUFPO29CQUMvQixNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ25CLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDYixNQUFNLGFBQUssQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLGdEQUF5QixDQUFDLENBQUMsQ0FBQztZQUU1RixNQUFNLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4RSxNQUFNLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxLQUFLO1lBRTFELG9CQUFvQixDQUFDLG9CQUFvQixvRUFBb0MsSUFBSSxDQUFDLENBQUM7WUFFbkYsSUFBSSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDL0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFekQsTUFBTSxDQUFDLENBQUM7WUFFUixNQUFNLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwRixNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUUzRixNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFFOUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLDJCQUFjLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsQ0FBQztRQUNULENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9FQUFvRSxFQUFFLEtBQUs7WUFFL0UsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNDLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtnQkFDaEQsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLHdCQUF3QjtvQkFDdkIsT0FBTzt3QkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDakIsVUFBVSxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDakMsQ0FBQztnQkFDSCxDQUFDO2dCQUNELGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTztvQkFDL0IsT0FBTzt3QkFDTixJQUFJLHNEQUFtQzt3QkFDdkMsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ2pCLEtBQUssRUFBRSxDQUFDO2dDQUNQLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxzQ0FBc0M7Z0NBQ3BFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLE1BQU0sRUFBRTs2QkFDNUMsQ0FBQztxQkFDRixDQUFDO2dCQUNILENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUUzRCxNQUFNLENBQUMsQ0FBQztZQUVSLE1BQU0sT0FBTyxHQUFHLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUVuRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLDhLQUFxRixDQUFDLENBQUM7WUFFMUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxDQUFDO1FBQ1QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsS0FBSztZQUMxQyxLQUFLLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQztnQkFDdkMsV0FBVyxFQUFFLHFDQUF3QixDQUFDLFVBQVU7Z0JBQ2hELEtBQUssRUFBRSxXQUFXO2dCQUNsQix3QkFBd0I7b0JBQ3ZCLE9BQU87d0JBQ04sRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7d0JBQ2pCLFVBQVUsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQ2pDLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU87b0JBQy9CLE9BQU8sSUFBSSxPQUFPLENBQVEsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsYUFBYSwwQ0FBcUIsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRXpELE1BQU0sQ0FBQyxDQUFDO1lBQ1IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBRXJCLE1BQU0sQ0FBQyxDQUFDO1lBQ1IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRkFBaUYsRUFBRSxLQUFLO1lBRTVGLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtnQkFDaEQsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLHdCQUF3QjtvQkFDdkIsT0FBTzt3QkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTt3QkFDakIsVUFBVSxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDakMsQ0FBQztnQkFDSCxDQUFDO2dCQUNELEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRO29CQUUvQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNqRixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUVqRixPQUFPO3dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNqQixJQUFJLHNEQUFtQzt3QkFDdkMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLENBQUM7cUJBQ3RFLENBQUM7Z0JBQ0gsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBRS9DLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsYUFBYSwrS0FBc0YsQ0FBQyxDQUFDO1lBQy9JLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxDQUFDO1lBQ1IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxDQUFDO1lBRVIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUVyRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDekIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7UUFJSCxJQUFJLENBQUMsSUFBSSxDQUFDLG9FQUFvRSxFQUFFLEtBQUs7WUFFcEYsb0JBQW9CLENBQUMsb0JBQW9CLCtFQUEwQyxDQUFDO1lBRXBGLE9BQU8sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFFL0UsS0FBSyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7b0JBQ3ZDLFdBQVcsRUFBRSxxQ0FBd0IsQ0FBQyxVQUFVO29CQUNoRCxLQUFLLEVBQUUsV0FBVztvQkFDbEIsd0JBQXdCO3dCQUN2QixPQUFPOzRCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO3lCQUNqQixDQUFDO29CQUNILENBQUM7b0JBQ0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVE7d0JBRS9DLE1BQU0sSUFBSSxHQUFHLGdDQUFnQyxDQUFDO3dCQUU5QyxNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNsQixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUUzRSxNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNsQixRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBRWpHLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzdCLENBQUM7aUJBQ0QsQ0FBQyxDQUFDLENBQUM7Z0JBR0osOEJBQThCO2dCQUM5QixvRkFBb0Y7Z0JBRXBGLElBQUksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLGFBQWEsK0tBQXNGLENBQUMsQ0FBQztnQkFDL0ksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQyxDQUFDO2dCQUVSLG1HQUFtRztnQkFDbkcsb0RBQW9EO2dCQUVwRCxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUVsQixpRUFBaUU7Z0JBQ2pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRTFELE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUMzQixNQUFNLENBQUMsQ0FBQztZQUNULENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUVBQXFFLEVBQUUsS0FBSztZQUdoRiw0QkFBNEI7WUFDNUIsSUFBSSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxhQUFhLCtLQUFzRixDQUFDLENBQUM7WUFDL0ksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLENBQUM7WUFFUixNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLDBDQUE2QixDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQixNQUFNLENBQUMsQ0FBQztZQUNSLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0VBQXNFLEVBQUUsS0FBSztZQUVqRix5QkFBeUI7WUFDekIsSUFBSSxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxhQUFhLCtLQUFzRixDQUFDLENBQUM7WUFDL0ksTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLENBQUM7WUFFUixNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUVsRCxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLGNBQWMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRyxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDLDBDQUE2QixDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWxHLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxDQUFDO1lBQ1IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFaEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSztZQUVqRCxNQUFNLFFBQVEsR0FBeUIsRUFBRSxDQUFDO1lBRTFDLEtBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDO2dCQUN2QyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtnQkFDaEQsS0FBSyxFQUFFLFdBQVc7Z0JBQ2xCLHdCQUF3QjtvQkFDdkIsT0FBTzt3QkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTtxQkFDakIsQ0FBQztnQkFDSCxDQUFDO2dCQUNELGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTztvQkFDaEMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDdkIsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLEtBQUssVUFBVSxXQUFXO2dCQUN6QixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDekQsTUFBTSxDQUFDLENBQUM7Z0JBQ1IsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztZQUVELHlCQUF5QjtZQUN6QixJQUFJLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFM0Qsb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSw0QkFBZSxFQUFFLENBQUMsQ0FBQztZQUNqRixNQUFNLFdBQVcsRUFBRSxDQUFDO1lBR3BCLG9CQUFvQixDQUFDLG9CQUFvQixDQUFDLFlBQVksRUFBRSxFQUFFLElBQUksa0NBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sV0FBVyxFQUFFLENBQUM7WUFFcEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPO1lBQ3pGLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDbEYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=