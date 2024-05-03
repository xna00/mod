define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/bracketMatching/browser/bracketMatching", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/base/test/common/utils"], function (require, exports, assert, position_1, selection_1, languageConfigurationRegistry_1, bracketMatching_1, testCodeEditor_1, testTextModel_1, lifecycle_1, language_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('bracket matching', () => {
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createTextModelWithBrackets(text) {
            const languageId = 'bracketMode';
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            return disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
        }
        function createCodeEditorWithBrackets(text) {
            return disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, createTextModelWithBrackets(text)));
        }
        test('issue #183: jump to matching bracket position', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)) + ((5+3)+5);');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start on closing bracket
            editor.setPosition(new position_1.Position(1, 20));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 19));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            // start on opening bracket
            editor.setPosition(new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 31));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 31));
        });
        test('Jump to next bracket', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)); y();');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start position between brackets
            editor.setPosition(new position_1.Position(1, 16));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 18));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 14));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 18));
            // skip brackets in comments
            editor.setPosition(new position_1.Position(1, 21));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 24));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 23));
            // do not break if no brackets are available
            editor.setPosition(new position_1.Position(1, 26));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 26));
        });
        test('Select to next bracket', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)); y();');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // start position in open brackets
            editor.setPosition(new position_1.Position(1, 9));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 20));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 9, 1, 20));
            // start position in close brackets (should select backwards)
            editor.setPosition(new position_1.Position(1, 20));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 9));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 20, 1, 9));
            // start position between brackets
            editor.setPosition(new position_1.Position(1, 16));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 19));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 14, 1, 19));
            // start position outside brackets
            editor.setPosition(new position_1.Position(1, 21));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 25));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 23, 1, 25));
            // do not break if no brackets are available
            editor.setPosition(new position_1.Position(1, 26));
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getPosition(), new position_1.Position(1, 26));
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 26, 1, 26));
        });
        test('issue #1772: jump to enclosing brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const editor = createCodeEditorWithBrackets(text);
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            editor.setPosition(new position_1.Position(3, 5));
            bracketMatchingController.jumpToBracket();
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(5, 1, 5, 1));
        });
        test('issue #43371: argument to not select brackets', () => {
            const text = [
                'const x = {',
                '    something: [0, 1, 2],',
                '    another: true,',
                '    somethingmore: [0, 2, 4]',
                '};',
            ].join('\n');
            const editor = createCodeEditorWithBrackets(text);
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            editor.setPosition(new position_1.Position(3, 5));
            bracketMatchingController.selectToBracket(false);
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 12, 5, 1));
        });
        test('issue #45369: Select to Bracket with multicursor', () => {
            const editor = createCodeEditorWithBrackets('{  }   {   }   { }');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            // cursors inside brackets become selections of the entire bracket contents
            editor.setSelections([
                new selection_1.Selection(1, 3, 1, 3),
                new selection_1.Selection(1, 10, 1, 10),
                new selection_1.Selection(1, 17, 1, 17)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 1, 1, 5),
                new selection_1.Selection(1, 8, 1, 13),
                new selection_1.Selection(1, 16, 1, 19)
            ]);
            // cursors to the left of bracket pairs become selections of the entire pair
            editor.setSelections([
                new selection_1.Selection(1, 1, 1, 1),
                new selection_1.Selection(1, 6, 1, 6),
                new selection_1.Selection(1, 14, 1, 14)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 1, 1, 5),
                new selection_1.Selection(1, 8, 1, 13),
                new selection_1.Selection(1, 16, 1, 19)
            ]);
            // cursors just right of a bracket pair become selections of the entire pair
            editor.setSelections([
                new selection_1.Selection(1, 5, 1, 5),
                new selection_1.Selection(1, 13, 1, 13),
                new selection_1.Selection(1, 19, 1, 19)
            ]);
            bracketMatchingController.selectToBracket(true);
            assert.deepStrictEqual(editor.getSelections(), [
                new selection_1.Selection(1, 5, 1, 1),
                new selection_1.Selection(1, 13, 1, 8),
                new selection_1.Selection(1, 19, 1, 16)
            ]);
        });
        test('Removes brackets', () => {
            const editor = createCodeEditorWithBrackets('var x = (3 + (5-7)); y();');
            const bracketMatchingController = disposables.add(editor.registerAndInstantiateContribution(bracketMatching_1.BracketMatchingController.ID, bracketMatching_1.BracketMatchingController));
            function removeBrackets() {
                bracketMatchingController.removeBrackets();
            }
            // position before the bracket
            editor.setPosition(new position_1.Position(1, 9));
            removeBrackets();
            assert.deepStrictEqual(editor.getModel().getValue(), 'var x = 3 + (5-7); y();');
            editor.getModel().setValue('var x = (3 + (5-7)); y();');
            // position between brackets
            editor.setPosition(new position_1.Position(1, 16));
            removeBrackets();
            assert.deepStrictEqual(editor.getModel().getValue(), 'var x = (3 + 5-7); y();');
            removeBrackets();
            assert.deepStrictEqual(editor.getModel().getValue(), 'var x = 3 + 5-7; y();');
            removeBrackets();
            assert.deepStrictEqual(editor.getModel().getValue(), 'var x = 3 + 5-7; y();');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldE1hdGNoaW5nLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2JyYWNrZXRNYXRjaGluZy90ZXN0L2Jyb3dzZXIvYnJhY2tldE1hdGNoaW5nLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZ0JBLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFDbkQsSUFBSSw0QkFBMkQsQ0FBQztRQUNoRSxJQUFJLGVBQWlDLENBQUM7UUFFdEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLHlDQUF3QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdELDRCQUE0QixHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyw2REFBNkIsQ0FBQyxDQUFDO1lBQ3ZGLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUywyQkFBMkIsQ0FBQyxJQUFZO1lBQ2hELE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztZQUNqQyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMs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RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUUsa0NBQWtDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0Usa0NBQWtDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFM0Us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