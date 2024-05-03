/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "path", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/indentation/common/indentation", "vs/editor/test/common/testTextModel", "vs/workbench/contrib/codeEditor/common/languageConfigurationExtensionPoint", "vs/base/common/json"], function (require, exports, fs, path, assert, lifecycle_1, utils_1, languageConfigurationRegistry_1, indentation_1, testTextModel_1, languageConfigurationExtensionPoint_1, json_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getIRange(range) {
        return {
            startLineNumber: range.startLineNumber,
            startColumn: range.startColumn,
            endLineNumber: range.endLineNumber,
            endColumn: range.endColumn
        };
    }
    suite('Auto-Reindentation - TypeScript/JavaScript', () => {
        const languageId = 'ts-test';
        const options = {};
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const configPath = path.join('extensions', 'typescript-basics', 'language-configuration.json');
            const configString = fs.readFileSync(configPath).toString();
            const config = (0, json_1.parse)(configString, []);
            const configParsed = languageConfigurationExtensionPoint_1.LanguageConfigurationFileHandler.extractValidConfig(languageId, config);
            disposables.add(languageConfigurationService.register(languageId, configParsed));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        // Test which can be ran to find cases of incorrect indentation...
        test.skip('Find Cases of Incorrect Indentation', () => {
            const filePath = path.join('..', 'TypeScript', 'src', 'server', 'utilities.ts');
            const fileContents = fs.readFileSync(filePath).toString();
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            model.applyEdits(editOperations);
            // save the files to disk
            const initialFile = path.join('..', 'autoindent', 'initial.ts');
            const finalFile = path.join('..', 'autoindent', 'final.ts');
            fs.writeFileSync(initialFile, fileContents);
            fs.writeFileSync(finalFile, model.getValue());
        });
        // Unit tests for increase and decrease indent patterns...
        /**
         * First increase indent and decrease indent patterns:
         *
         * - decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/
         *  - In (https://macromates.com/manual/en/appendix)
         * 	  Either we have white space before the closing bracket, or we have a multi line comment ending on that line followed by whitespaces
         *    This is followed by any character.
         *    Textmate decrease indent pattern is as follows: /^(.*\*\/)?\s*\}[;\s]*$/
         *    Presumably allowing multi line comments ending on that line implies that } is itself not part of a multi line comment
         *
         * - increaseIndentPattern: /^.*\{[^}"']*$/
         *  - In (https://macromates.com/manual/en/appendix)
         *    This regex means that we increase the indent when we have any characters followed by the opening brace, followed by characters
         *    except for closing brace }, double quotes " or single quote '.
         *    The } is checked in order to avoid the indentation in the following case `int arr[] = { 1, 2, 3 };`
         *    The double quote and single quote are checked in order to avoid the indentation in the following case: str = "foo {";
         */
        test('Issue #25437', () => {
            // issue: https://github.com/microsoft/vscode/issues/25437
            // fix: https://github.com/microsoft/vscode/commit/8c82a6c6158574e098561c28d470711f1b484fc8
            // explanation: var foo = `{`; should not increase indentation
            // increaseIndentPattern: /^.*\{[^}"']*$/ -> /^.*\{[^}"'`]*$/
            const fileContents = [
                'const foo = `{`;',
                '    ',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 5,
            });
            assert.deepStrictEqual(operation.text, '');
        });
        test('Enriching the hover', () => {
            // issue: -
            // fix: https://github.com/microsoft/vscode/commit/19ae0932c45b1096443a8c1335cf1e02eb99e16d
            // explanation:
            //  - decrease indent on ) and ] also
            //  - increase indent on ( and [ also
            // decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/ -> /^(.*\*\/)?\s*[\}\]\)].*$/
            // increaseIndentPattern: /^.*\{[^}"'`]*$/ -> /^.*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
            let fileContents = [
                'function foo(',
                '    bar: string',
                '    ){}',
            ].join('\n');
            let model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            let editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            let operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 3,
                "startColumn": 1,
                "endLineNumber": 3,
                "endColumn": 5,
            });
            assert.deepStrictEqual(operation.text, '');
            fileContents = [
                'function foo(',
                'bar: string',
                '){}',
            ].join('\n');
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 1,
            });
            assert.deepStrictEqual(operation.text, '    ');
        });
        test('Issue #86176', () => {
            // issue: https://github.com/microsoft/vscode/issues/86176
            // fix: https://github.com/microsoft/vscode/commit/d89e2e17a5d1ba37c99b1d3929eb6180a5bfc7a8
            // explanation: When quotation marks are present on the first line of an if statement or for loop, following line should not be indented
            // increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/ -> /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/
            // explanation: after open brace, do not decrease indent if it is followed on the same line by "<whitespace characters> // <any characters>"
            // todo@aiday-mar: should also apply for when it follows ( and [
            const fileContents = [
                `if () { // '`,
                `x = 4`,
                `}`
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 1,
            });
            assert.deepStrictEqual(operation.text, '    ');
        });
        test('Issue #141816', () => {
            // issue: https://github.com/microsoft/vscode/issues/141816
            // fix: https://github.com/microsoft/vscode/pull/141997/files
            // explanation: if (, [, {, is followed by a forward slash then assume we are in a regex pattern, and do not indent
            // increaseIndentPattern: /^((?!\/\/).)*(\{([^}"'`]*|(\t|[ ])*\/\/.*)|\([^)"'`]*|\[[^\]"'`]*)$/ -> /^((?!\/\/).)*(\{([^}"'`/]*|(\t|[ ])*\/\/.*)|\([^)"'`/]*|\[[^\]"'`/]*)$/
            // -> Final current increase indent pattern at of writing
            const fileContents = [
                'const r = /{/;',
                '   ',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 1);
            const operation = editOperations[0];
            assert.deepStrictEqual(getIRange(operation.range), {
                "startLineNumber": 2,
                "startColumn": 1,
                "endLineNumber": 2,
                "endColumn": 4,
            });
            assert.deepStrictEqual(operation.text, '');
        });
        test('Issue #29886', () => {
            // issue: https://github.com/microsoft/vscode/issues/29886
            // fix: https://github.com/microsoft/vscode/commit/7910b3d7bab8a721aae98dc05af0b5e1ea9d9782
            // decreaseIndentPattern: /^(.*\*\/)?\s*[\}\]\)].*$/ -> /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/
            // -> Final current decrease indent pattern at the time of writing
            // explanation: Positive lookahead: (?= «pattern») matches if pattern matches what comes after the current location in the input string.
            // Negative lookahead: (?! «pattern») matches if pattern does not match what comes after the current location in the input string
            // The change proposed is to not decrease the indent if there is a multi-line comment ending on the same line before the closing parentheses
            const fileContents = [
                'function foo() {',
                '    bar(/*  */)',
                '};',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        // Failing tests inferred from the current regexes...
        test.skip('Incorrect deindentation after `*/}` string', () => {
            // explanation: If */ was not before the }, the regex does not allow characters before the }, so there would not be an indent
            // Here since there is */ before the }, the regex allows all the characters before, hence there is a deindent
            const fileContents = [
                `const obj = {`,
                `    obj1: {`,
                `        brace : '*/}'`,
                `    }`,
                `}`,
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        // Failing tests from issues...
        test.skip('Issue #56275', () => {
            // issue: https://github.com/microsoft/vscode/issues/56275
            // explanation: If */ was not before the }, the regex does not allow characters before the }, so there would not be an indent
            // Here since there is */ before the }, the regex allows all the characters before, hence there is a deindent
            let fileContents = [
                'function foo() {',
                '    var bar = (/b*/);',
                '}',
            ].join('\n');
            let model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            let editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
            fileContents = [
                'function foo() {',
                '    var bar = "/b*/)";',
                '}',
            ].join('\n');
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue #116843', () => {
            // issue: https://github.com/microsoft/vscode/issues/116843
            // related: https://github.com/microsoft/vscode/issues/43244
            // explanation: When you have an arrow function, you don't have { or }, but you would expect indentation to still be done in that way
            // TODO: requires exploring indent/outdent pairs instead
            const fileContents = [
                'const add1 = (n) =>',
                '	n + 1;',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue #185252', () => {
            // issue: https://github.com/microsoft/vscode/issues/185252
            // explanation: Reindenting the comment correctly
            const fileContents = [
                '/*',
                ' * This is a comment.',
                ' */',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
        test.skip('Issue 43244: incorrect indentation when signature of function call spans several lines', () => {
            // issue: https://github.com/microsoft/vscode/issues/43244
            const fileContents = [
                'function callSomeOtherFunction(one: number, two: number) { }',
                'function someFunction() {',
                '    callSomeOtherFunction(4,',
                '        5)',
                '}',
            ].join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, fileContents, languageId, options));
            const editOperations = (0, indentation_1.getReindentEditOperations)(model, languageConfigurationService, 1, model.getLineCount());
            assert.deepStrictEqual(editOperations.length, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0b2luZGVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL3Rlc3Qvbm9kZS9hdXRvaW5kZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsU0FBUyxTQUFTLENBQUMsS0FBYTtRQUMvQixPQUFPO1lBQ04sZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFlO1lBQ3RDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVztZQUM5QixhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7WUFDbEMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO1NBQzFCLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLDRDQUE0QyxFQUFFLEdBQUcsRUFBRTtRQUV4RCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFDN0IsTUFBTSxPQUFPLEdBQXFDLEVBQUUsQ0FBQztRQUNyRCxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLDRCQUEyRCxDQUFDO1FBRWhFLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsSUFBQSxtQ0FBbUIsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUN4RCw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsNkRBQTZCLENBQUMsQ0FBQztZQUN2RixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxtQkFBbUIsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFD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