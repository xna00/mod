/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/contrib/linkedEditing/browser/linkedEditing", "vs/editor/contrib/wordOperations/browser/wordOperations", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, uri_1, timeTravelScheduler_1, utils_1, coreCommands_1, position_1, range_1, wordHelper_1, languageConfigurationRegistry_1, languageFeatures_1, linesOperations_1, linkedEditing_1, wordOperations_1, testCodeEditor_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockFile = uri_1.URI.parse('test:somefile.ttt');
    const mockFileSelector = { scheme: 'test' };
    const timeout = 30;
    const languageId = 'linkedEditingTestLangage';
    suite('linked editing', () => {
        let disposables;
        let instantiationService;
        let languageFeaturesService;
        let languageConfigurationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageFeaturesService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            disposables.add(languageConfigurationService.register(languageId, {
                wordPattern: /[a-zA-Z]+/
            }));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createMockEditor(text) {
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, typeof text === 'string' ? text : text.join('\n'), languageId, undefined, mockFile));
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model));
            return editor;
        }
        function testCase(name, initialState, operations, expectedEndText) {
            test(name, async () => {
                await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                    disposables.add(languageFeaturesService.linkedEditingRangeProvider.register(mockFileSelector, {
                        provideLinkedEditingRanges(model, pos) {
                            const wordAtPos = model.getWordAtPosition(pos);
                            if (wordAtPos) {
                                const matches = model.findMatches(wordAtPos.word, false, false, true, wordHelper_1.USUAL_WORD_SEPARATORS, false);
                                return { ranges: matches.map(m => m.range), wordPattern: initialState.responseWordPattern };
                            }
                            return { ranges: [], wordPattern: initialState.responseWordPattern };
                        }
                    }));
                    const editor = createMockEditor(initialState.text);
                    editor.updateOptions({ linkedEditing: true });
                    const linkedEditingContribution = disposables.add(editor.registerAndInstantiateContribution(linkedEditing_1.LinkedEditingContribution.ID, linkedEditing_1.LinkedEditingContribution));
                    linkedEditingContribution.setDebounceDuration(0);
                    const testEditor = {
                        setPosition(pos) {
                            editor.setPosition(pos);
                            return linkedEditingContribution.currentUpdateTriggerPromise;
                        },
                        setSelection(sel) {
                            editor.setSelection(sel);
                            return linkedEditingContribution.currentUpdateTriggerPromise;
                        },
                        trigger(source, handlerId, payload) {
                            if (handlerId === "type" /* Handler.Type */ || handlerId === "paste" /* Handler.Paste */) {
                                editor.trigger(source, handlerId, payload);
                            }
                            else if (handlerId === 'deleteLeft') {
                                coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, payload);
                            }
                            else if (handlerId === 'deleteWordLeft') {
                                instantiationService.invokeFunction((accessor) => (new wordOperations_1.DeleteWordLeft()).runEditorCommand(accessor, editor, payload));
                            }
                            else if (handlerId === 'deleteAllLeft') {
                                instantiationService.invokeFunction((accessor) => (new linesOperations_1.DeleteAllLeftAction()).runEditorCommand(accessor, editor, payload));
                            }
                            else {
                                throw new Error(`Unknown handler ${handlerId}!`);
                            }
                            return linkedEditingContribution.currentSyncTriggerPromise;
                        },
                        undo() {
                            coreCommands_1.CoreEditingCommands.Undo.runEditorCommand(null, editor, null);
                        },
                        redo() {
                            coreCommands_1.CoreEditingCommands.Redo.runEditorCommand(null, editor, null);
                        }
                    };
                    await operations(testEditor);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            if (typeof expectedEndText === 'string') {
                                assert.strictEqual(editor.getModel().getValue(), expectedEndText);
                            }
                            else {
                                assert.strictEqual(editor.getModel().getValue(), expectedEndText.join('\n'));
                            }
                            resolve();
                        }, timeout);
                    });
                });
            });
        }
        const state = {
            text: '<ooo></ooo>'
        };
        /**
         * Simple insertion
         */
        testCase('Simple insert - initial', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert - middle', state, async (editor) => {
            const pos = new position_1.Position(1, 3);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert - end', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Simple insertion - end
         */
        testCase('Simple insert end - initial', state, async (editor) => {
            const pos = new position_1.Position(1, 8);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Simple insert end - middle', state, async (editor) => {
            const pos = new position_1.Position(1, 9);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oioo></oioo>');
        testCase('Simple insert end - end', state, async (editor) => {
            const pos = new position_1.Position(1, 11);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<oooi></oooi>');
        /**
         * Boundary insertion
         */
        testCase('Simple insert - out of boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 1);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, 'i<ooo></ooo>');
        testCase('Simple insert - out of boundary 2', state, async (editor) => {
            const pos = new position_1.Position(1, 6);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo>i</ooo>');
        testCase('Simple insert - out of boundary 3', state, async (editor) => {
            const pos = new position_1.Position(1, 7);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo><i/ooo>');
        testCase('Simple insert - out of boundary 4', state, async (editor) => {
            const pos = new position_1.Position(1, 12);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ooo></ooo>i');
        /**
         * Insert + Move
         */
        testCase('Continuous insert', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iiooo></iiooo>');
        testCase('Insert - move - insert', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.setPosition(new position_1.Position(1, 4));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ioioo></ioioo>');
        testCase('Insert - move - insert outside region', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            await editor.setPosition(new position_1.Position(1, 7));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo>i</iooo>');
        /**
         * Selection insert
         */
        testCase('Selection insert - simple', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 3));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<ioo></ioo>');
        testCase('Selection insert - whole', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 5));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<i></i>');
        testCase('Selection insert - across boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 1, 1, 3));
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, 'ioo></oo>');
        /**
         * @todo
         * Undefined behavior
         */
        // testCase('Selection insert - across two boundary', state, async (editor) => {
        // 	const pos = new Position(1, 2);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.setSelection(new Range(1, 4, 1, 9));
        // 	await editor.trigger('keyboard', Handler.Type, { text: 'i' });
        // }, '<ooioo>');
        /**
         * Break out behavior
         */
        testCase('Breakout - type space', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
        }, '<ooo ></ooo>');
        testCase('Breakout - type space then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Breakout - type space in middle', state, async (editor) => {
            const pos = new position_1.Position(1, 4);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
        }, '<oo o></ooo>');
        testCase('Breakout - paste content starting with space', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i="i"' });
        }, '<ooo i="i"></ooo>');
        testCase('Breakout - paste content starting with space then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i="i"' });
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Breakout - paste content starting with space in middle', state, async (editor) => {
            const pos = new position_1.Position(1, 4);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: ' i' });
        }, '<oo io></ooo>');
        /**
         * Break out with custom provider wordPattern
         */
        const state3 = {
            ...state,
            responseWordPattern: /[a-yA-Y]+/
        };
        testCase('Breakout with stop pattern - insert', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></iooo>');
        testCase('Breakout with stop pattern - insert stop char', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'z' });
        }, '<zooo></ooo>');
        testCase('Breakout with stop pattern - paste char', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: 'z' });
        }, '<zooo></ooo>');
        testCase('Breakout with stop pattern - paste string', state3, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "paste" /* Handler.Paste */, { text: 'zo' });
        }, '<zoooo></ooo>');
        testCase('Breakout with stop pattern - insert at end', state3, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'z' });
        }, '<oooz></ooo>');
        const state4 = {
            ...state,
            responseWordPattern: /[a-eA-E]+/
        };
        testCase('Breakout with stop pattern - insert stop char, respos', state4, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, '<iooo></ooo>');
        /**
         * Delete
         */
        testCase('Delete - left char', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - left char then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteLeft', {});
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Delete - left word', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteWordLeft', {});
        }, '<></>');
        testCase('Delete - left word then undo', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteWordLeft', {});
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all', state, async (editor) => {
        // 	const pos = new Position(1, 3);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.trigger('keyboard', 'deleteAllLeft', {});
        // }, '></>');
        /**
         * Todo: Fix test
         */
        // testCase('Delete - left all then undo', state, async (editor) => {
        // 	const pos = new Position(1, 5);
        // 	await editor.setPosition(pos);
        // 	await linkedEditingContribution.updateLinkedUI(pos);
        // 	await editor.trigger('keyboard', 'deleteAllLeft', {});
        // 	editor.undo();
        // }, '></ooo>');
        testCase('Delete - left all then undo twice', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', 'deleteAllLeft', {});
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Delete - selection', state, async (editor) => {
            const pos = new position_1.Position(1, 5);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 2, 1, 3));
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, '<oo></oo>');
        testCase('Delete - selection across boundary', state, async (editor) => {
            const pos = new position_1.Position(1, 3);
            await editor.setPosition(pos);
            await editor.setSelection(new range_1.Range(1, 1, 1, 3));
            await editor.trigger('keyboard', 'deleteLeft', {});
        }, 'oo></oo>');
        /**
         * Undo / redo
         */
        testCase('Undo/redo - simple undo', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            editor.undo();
            editor.undo();
        }, '<ooo></ooo>');
        testCase('Undo/redo - simple undo/redo', state, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
            editor.undo();
            editor.redo();
        }, '<iooo></iooo>');
        /**
         * Multi line
         */
        const state2 = {
            text: [
                '<ooo>',
                '</ooo>'
            ]
        };
        testCase('Multiline insert', state2, async (editor) => {
            const pos = new position_1.Position(1, 2);
            await editor.setPosition(pos);
            await editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'i' });
        }, [
            '<iooo>',
            '</iooo>'
        ]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkRWRpdGluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9saW5rZWRFZGl0aW5nL3Rlc3QvYnJvd3Nlci9saW5rZWRFZGl0aW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUNoRCxNQUFNLGdCQUFnQixHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztJQVVuQixNQUFNLFVBQVUsR0FBRywwQkFBMEIsQ0FBQztJQUU5QyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzVCLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksdUJBQWlELENBQUM7UUFDdEQsSUFBSSw0QkFBMkQsQ0FBQztRQUVoRSxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFvQixHQUFHLElBQUEseUNBQXdCLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDN0QsdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJDQUF3QixDQUFDLENBQUM7WUFDN0UsNEJBQTRCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDZEQUE2QixDQUFDLENBQUM7WUFFdkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxXQUFXLEVBQUUsV0FBVzthQUN4QixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxD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