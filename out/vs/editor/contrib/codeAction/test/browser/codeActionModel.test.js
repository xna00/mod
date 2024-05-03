/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/editor/common/languageFeatureRegistry", "vs/editor/contrib/codeAction/browser/codeActionModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/markers/common/markerService"], function (require, exports, assert, async_1, lifecycle_1, types_1, uri_1, timeTravelScheduler_1, languageFeatureRegistry_1, codeActionModel_1, testCodeEditor_1, testTextModel_1, mockKeybindingService_1, markerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const testProvider = {
        provideCodeActions() {
            return {
                actions: [
                    { title: 'test', command: { id: 'test-command', title: 'test', arguments: [] } }
                ],
                dispose() { }
            };
        }
    };
    suite('CodeActionModel', () => {
        const languageId = 'foo-lang';
        const uri = uri_1.URI.parse('untitled:path');
        let model;
        let markerService;
        let editor;
        let registry;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.clear();
            markerService = new markerService_1.MarkerService();
            model = (0, testTextModel_1.createTextModel)('foobar  foo bar\nfarboo far boo', languageId, undefined, uri);
            editor = (0, testCodeEditor_1.createTestCodeEditor)(model);
            editor.setPosition({ lineNumber: 1, column: 1 });
            registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
        });
        teardown(() => {
            disposables.clear();
            editor.dispose();
            model.dispose();
            markerService.dispose();
        });
        test('Oracle -> marker added', async () => {
            const { promise: donePromise, resolve: done } = (0, async_1.promiseWithResolvers)();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                    assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                    assert.ok(e.actions);
                    e.actions.then(fixes => {
                        model.dispose();
                        assert.strictEqual(fixes.validActions.length, 1);
                        done();
                    }, done);
                }));
                // start here
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                return donePromise;
            });
        });
        test('Oracle -> position changed', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                editor.setPosition({ lineNumber: 2, column: 1 });
                return new Promise((resolve, reject) => {
                    const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                    const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                    disposables.add(model.onDidChangeState((e) => {
                        (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                        assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                        assert.ok(e.actions);
                        e.actions.then(fixes => {
                            model.dispose();
                            assert.strictEqual(fixes.validActions.length, 1);
                            resolve(undefined);
                        }, reject);
                    }));
                    // start here
                    editor.setPosition({ lineNumber: 1, column: 1 });
                });
            });
        });
        test('Oracle -> should only auto trigger once for cursor and marker update right after each other', async () => {
            const { promise: donePromise, resolve: done } = (0, async_1.promiseWithResolvers)();
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, () => {
                const reg = registry.register(languageId, testProvider);
                disposables.add(reg);
                let triggerCount = 0;
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, registry, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    (0, types_1.assertType)(e.type === 1 /* CodeActionsState.Type.Triggered */);
                    assert.strictEqual(e.trigger.type, 2 /* languages.CodeActionTriggerType.Auto */);
                    ++triggerCount;
                    // give time for second trigger before completing test
                    setTimeout(() => {
                        model.dispose();
                        assert.strictEqual(triggerCount, 1);
                        done();
                    }, 0);
                }, 5 /*delay*/));
                markerService.changeOne('fake', uri, [{
                        startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                        message: 'error',
                        severity: 1,
                        code: '',
                        source: ''
                    }]);
                editor.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 1 });
                return donePromise;
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVBY3Rpb24vdGVzdC9icm93c2VyL2NvZGVBY3Rpb25Nb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0JoRyxNQUFNLFlBQVksR0FBRztRQUNwQixrQkFBa0I7WUFDakIsT0FBTztnQkFDTixPQUFPLEVBQUU7b0JBQ1IsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7aUJBQ2hGO2dCQUNELE9BQU8sS0FBZSxDQUFDO2FBQ3ZCLENBQUM7UUFDSCxDQUFDO0tBQ0QsQ0FBQztJQUVGLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFFN0IsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdkMsSUFBSSxLQUFnQixDQUFDO1FBQ3JCLElBQUksYUFBNEIsQ0FBQztRQUNqQyxJQUFJLE1BQW1CLENBQUM7UUFDeEIsSUFBSSxRQUErRCxDQUFDO1FBQ3BFLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsYUFBYSxHQUFHLElBQUksNkJBQWEsRUFBRSxDQUFDO1lBQ3BDLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUMsaUNBQWlDLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN2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