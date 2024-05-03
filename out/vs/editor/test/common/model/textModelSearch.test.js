/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/wordHelper", "vs/editor/common/model", "vs/editor/common/model/textModelSearch", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, position_1, range_1, wordCharacterClassifier_1, wordHelper_1, model_1, textModelSearch_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --------- Find
    suite('TextModelSearch', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const usualWordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(wordHelper_1.USUAL_WORD_SEPARATORS, []);
        function assertFindMatch(actual, expectedRange, expectedMatches = null) {
            assert.deepStrictEqual(actual, new model_1.FindMatch(expectedRange, expectedMatches));
        }
        function _assertFindMatches(model, searchParams, expectedMatches) {
            const actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), false, 1000);
            assert.deepStrictEqual(actual, expectedMatches, 'findMatches OK');
            // test `findNextMatch`
            let startPos = new position_1.Position(1, 1);
            let match = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, startPos, false);
            assert.deepStrictEqual(match, expectedMatches[0], `findNextMatch ${startPos}`);
            for (const expectedMatch of expectedMatches) {
                startPos = expectedMatch.range.getStartPosition();
                match = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, startPos, false);
                assert.deepStrictEqual(match, expectedMatch, `findNextMatch ${startPos}`);
            }
            // test `findPrevMatch`
            startPos = new position_1.Position(model.getLineCount(), model.getLineMaxColumn(model.getLineCount()));
            match = textModelSearch_1.TextModelSearch.findPreviousMatch(model, searchParams, startPos, false);
            assert.deepStrictEqual(match, expectedMatches[expectedMatches.length - 1], `findPrevMatch ${startPos}`);
            for (const expectedMatch of expectedMatches) {
                startPos = expectedMatch.range.getEndPosition();
                match = textModelSearch_1.TextModelSearch.findPreviousMatch(model, searchParams, startPos, false);
                assert.deepStrictEqual(match, expectedMatch, `findPrevMatch ${startPos}`);
            }
        }
        function assertFindMatches(text, searchString, isRegex, matchCase, wordSeparators, _expected) {
            const expectedRanges = _expected.map(entry => new range_1.Range(entry[0], entry[1], entry[2], entry[3]));
            const expectedMatches = expectedRanges.map(entry => new model_1.FindMatch(entry, null));
            const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
            const model = (0, testTextModel_1.createTextModel)(text);
            _assertFindMatches(model, searchParams, expectedMatches);
            model.dispose();
            const model2 = (0, testTextModel_1.createTextModel)(text);
            model2.setEOL(1 /* EndOfLineSequence.CRLF */);
            _assertFindMatches(model2, searchParams, expectedMatches);
            model2.dispose();
        }
        const regularText = [
            'This is some foo - bar text which contains foo and bar - as in Barcelona.',
            'Now it begins a word fooBar and now it is caps Foo-isn\'t this great?',
            'And here\'s a dull line with nothing interesting in it',
            'It is also interesting if it\'s part of a word like amazingFooBar',
            'Again nothing interesting here'
        ];
        test('Simple find', () => {
            assertFindMatches(regularText.join('\n'), 'foo', false, false, null, [
                [1, 14, 1, 17],
                [1, 44, 1, 47],
                [2, 22, 2, 25],
                [2, 48, 2, 51],
                [4, 59, 4, 62]
            ]);
        });
        test('Case sensitive find', () => {
            assertFindMatches(regularText.join('\n'), 'foo', false, true, null, [
                [1, 14, 1, 17],
                [1, 44, 1, 47],
                [2, 22, 2, 25]
            ]);
        });
        test('Whole words find', () => {
            assertFindMatches(regularText.join('\n'), 'foo', false, false, wordHelper_1.USUAL_WORD_SEPARATORS, [
                [1, 14, 1, 17],
                [1, 44, 1, 47],
                [2, 48, 2, 51]
            ]);
        });
        test('/^/ find', () => {
            assertFindMatches(regularText.join('\n'), '^', true, false, null, [
                [1, 1, 1, 1],
                [2, 1, 2, 1],
                [3, 1, 3, 1],
                [4, 1, 4, 1],
                [5, 1, 5, 1]
            ]);
        });
        test('/$/ find', () => {
            assertFindMatches(regularText.join('\n'), '$', true, false, null, [
                [1, 74, 1, 74],
                [2, 69, 2, 69],
                [3, 54, 3, 54],
                [4, 65, 4, 65],
                [5, 31, 5, 31]
            ]);
        });
        test('/.*/ find', () => {
            assertFindMatches(regularText.join('\n'), '.*', true, false, null, [
                [1, 1, 1, 74],
                [2, 1, 2, 69],
                [3, 1, 3, 54],
                [4, 1, 4, 65],
                [5, 1, 5, 31]
            ]);
        });
        test('/^$/ find', () => {
            assertFindMatches([
                'This is some foo - bar text which contains foo and bar - as in Barcelona.',
                '',
                'And here\'s a dull line with nothing interesting in it',
                '',
                'Again nothing interesting here'
            ].join('\n'), '^$', true, false, null, [
                [2, 1, 2, 1],
                [4, 1, 4, 1]
            ]);
        });
        test('multiline find 1', () => {
            assertFindMatches([
                'Just some text text',
                'Just some text text',
                'some text again',
                'again some text'
            ].join('\n'), 'text\\n', true, false, null, [
                [1, 16, 2, 1],
                [2, 16, 3, 1],
            ]);
        });
        test('multiline find 2', () => {
            assertFindMatches([
                'Just some text text',
                'Just some text text',
                'some text again',
                'again some text'
            ].join('\n'), 'text\\nJust', true, false, null, [
                [1, 16, 2, 5]
            ]);
        });
        test('multiline find 3', () => {
            assertFindMatches([
                'Just some text text',
                'Just some text text',
                'some text again',
                'again some text'
            ].join('\n'), '\\nagain', true, false, null, [
                [3, 16, 4, 6]
            ]);
        });
        test('multiline find 4', () => {
            assertFindMatches([
                'Just some text text',
                'Just some text text',
                'some text again',
                'again some text'
            ].join('\n'), '.*\\nJust.*\\n', true, false, null, [
                [1, 1, 3, 1]
            ]);
        });
        test('multiline find with line beginning regex', () => {
            assertFindMatches([
                'if',
                'else',
                '',
                'if',
                'else'
            ].join('\n'), '^if\\nelse', true, false, null, [
                [1, 1, 2, 5],
                [4, 1, 5, 5]
            ]);
        });
        test('matching empty lines using boundary expression', () => {
            assertFindMatches([
                'if',
                '',
                'else',
                '  ',
                'if',
                ' ',
                'else'
            ].join('\n'), '^\\s*$\\n', true, false, null, [
                [2, 1, 3, 1],
                [4, 1, 5, 1],
                [6, 1, 7, 1]
            ]);
        });
        test('matching lines starting with A and ending with B', () => {
            assertFindMatches([
                'a if b',
                'a',
                'ab',
                'eb'
            ].join('\n'), '^a.*b$', true, false, null, [
                [1, 1, 1, 7],
                [3, 1, 3, 3]
            ]);
        });
        test('multiline find with line ending regex', () => {
            assertFindMatches([
                'if',
                'else',
                '',
                'if',
                'elseif',
                'else'
            ].join('\n'), 'if\\nelse$', true, false, null, [
                [1, 1, 2, 5],
                [5, 5, 6, 5]
            ]);
        });
        test('issue #4836 - ^.*$', () => {
            assertFindMatches([
                'Just some text text',
                '',
                'some text again',
                '',
                'again some text'
            ].join('\n'), '^.*$', true, false, null, [
                [1, 1, 1, 20],
                [2, 1, 2, 1],
                [3, 1, 3, 16],
                [4, 1, 4, 1],
                [5, 1, 5, 16],
            ]);
        });
        test('multiline find for non-regex string', () => {
            assertFindMatches([
                'Just some text text',
                'some text text',
                'some text again',
                'again some text',
                'but not some'
            ].join('\n'), 'text\nsome', false, false, null, [
                [1, 16, 2, 5],
                [2, 11, 3, 5],
            ]);
        });
        test('issue #3623: Match whole word does not work for not latin characters', () => {
            assertFindMatches([
                'я',
                'компилятор',
                'обфускация',
                ':я-я'
            ].join('\n'), 'я', false, false, wordHelper_1.USUAL_WORD_SEPARATORS, [
                [1, 1, 1, 2],
                [4, 2, 4, 3],
                [4, 4, 4, 5],
            ]);
        });
        test('issue #27459: Match whole words regression', () => {
            assertFindMatches([
                'this._register(this._textAreaInput.onKeyDown((e: IKeyboardEvent) => {',
                '	this._viewController.emitKeyDown(e);',
                '}));',
            ].join('\n'), '((e: ', false, false, wordHelper_1.USUAL_WORD_SEPARATORS, [
                [1, 45, 1, 50]
            ]);
        });
        test('issue #27594: Search results disappear', () => {
            assertFindMatches([
                'this.server.listen(0);',
            ].join('\n'), 'listen(', false, false, wordHelper_1.USUAL_WORD_SEPARATORS, [
                [1, 13, 1, 20]
            ]);
        });
        test('findNextMatch without regex', () => {
            const model = (0, testTextModel_1.createTextModel)('line line one\nline two\nthree');
            const searchParams = new textModelSearch_1.SearchParams('line', false, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(1, 6, 1, 10));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 3), false);
            assertFindMatch(actual, new range_1.Range(1, 6, 1, 10));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            model.dispose();
        });
        test('findNextMatch with beginning boundary regex', () => {
            const model = (0, testTextModel_1.createTextModel)('line one\nline two\nthree');
            const searchParams = new textModelSearch_1.SearchParams('^line', true, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 3), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            model.dispose();
        });
        test('findNextMatch with beginning boundary regex and line has repetitive beginnings', () => {
            const model = (0, testTextModel_1.createTextModel)('line line one\nline two\nthree');
            const searchParams = new textModelSearch_1.SearchParams('^line', true, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 3), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 1, 5));
            model.dispose();
        });
        test('findNextMatch with beginning boundary multiline regex and line has repetitive beginnings', () => {
            const model = (0, testTextModel_1.createTextModel)('line line one\nline two\nline three\nline four');
            const searchParams = new textModelSearch_1.SearchParams('^line.*\\nline', true, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), false);
            assertFindMatch(actual, new range_1.Range(1, 1, 2, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(3, 1, 4, 5));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(2, 1), false);
            assertFindMatch(actual, new range_1.Range(2, 1, 3, 5));
            model.dispose();
        });
        test('findNextMatch with ending boundary regex', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('line$', true, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), false);
            assertFindMatch(actual, new range_1.Range(1, 10, 1, 14));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 4), false);
            assertFindMatch(actual, new range_1.Range(1, 10, 1, 14));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(2, 5, 2, 9));
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, actual.range.getEndPosition(), false);
            assertFindMatch(actual, new range_1.Range(1, 10, 1, 14));
            model.dispose();
        });
        test('findMatches with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 100);
            assert.deepStrictEqual(actual, [
                new model_1.FindMatch(new range_1.Range(1, 5, 1, 9), ['line', 'line', 'in']),
                new model_1.FindMatch(new range_1.Range(1, 10, 1, 14), ['line', 'line', 'in']),
                new model_1.FindMatch(new range_1.Range(2, 5, 2, 9), ['line', 'line', 'in']),
            ]);
            model.dispose();
        });
        test('findMatches multiline with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)\\n', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 100);
            assert.deepStrictEqual(actual, [
                new model_1.FindMatch(new range_1.Range(1, 10, 2, 1), ['line\n', 'line', 'in']),
                new model_1.FindMatch(new range_1.Range(2, 5, 3, 1), ['line\n', 'line', 'in']),
            ]);
            model.dispose();
        });
        test('findNextMatch with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            assertFindMatch(actual, new range_1.Range(1, 5, 1, 9), ['line', 'line', 'in']);
            model.dispose();
        });
        test('findNextMatch multiline with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)\\n', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            assertFindMatch(actual, new range_1.Range(1, 10, 2, 1), ['line\n', 'line', 'in']);
            model.dispose();
        });
        test('findPreviousMatch with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findPreviousMatch(model, searchParams, new position_1.Position(1, 1), true);
            assertFindMatch(actual, new range_1.Range(2, 5, 2, 9), ['line', 'line', 'in']);
            model.dispose();
        });
        test('findPreviousMatch multiline with capturing matches', () => {
            const model = (0, testTextModel_1.createTextModel)('one line line\ntwo line\nthree');
            const searchParams = new textModelSearch_1.SearchParams('(l(in)e)\\n', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findPreviousMatch(model, searchParams, new position_1.Position(1, 1), true);
            assertFindMatch(actual, new range_1.Range(2, 5, 3, 1), ['line\n', 'line', 'in']);
            model.dispose();
        });
        test('\\n matches \\r\\n', () => {
            const model = (0, testTextModel_1.createTextModel)('a\r\nb\r\nc\r\nd\r\ne\r\nf\r\ng\r\nh\r\ni');
            assert.strictEqual(model.getEOL(), '\r\n');
            let searchParams = new textModelSearch_1.SearchParams('h\\n', true, false, null);
            let actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 1000)[0];
            assertFindMatch(actual, new range_1.Range(8, 1, 9, 1), ['h\n']);
            searchParams = new textModelSearch_1.SearchParams('g\\nh\\n', true, false, null);
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 1000)[0];
            assertFindMatch(actual, new range_1.Range(7, 1, 9, 1), ['g\nh\n']);
            searchParams = new textModelSearch_1.SearchParams('\\ni', true, false, null);
            actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 1000)[0];
            assertFindMatch(actual, new range_1.Range(8, 2, 9, 2), ['\ni']);
            model.dispose();
        });
        test('\\r can never be found', () => {
            const model = (0, testTextModel_1.createTextModel)('a\r\nb\r\nc\r\nd\r\ne\r\nf\r\ng\r\nh\r\ni');
            assert.strictEqual(model.getEOL(), '\r\n');
            const searchParams = new textModelSearch_1.SearchParams('\\r\\n', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findNextMatch(model, searchParams, new position_1.Position(1, 1), true);
            assert.strictEqual(actual, null);
            assert.deepStrictEqual(textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 1000), []);
            model.dispose();
        });
        function assertParseSearchResult(searchString, isRegex, matchCase, wordSeparators, expected) {
            const searchParams = new textModelSearch_1.SearchParams(searchString, isRegex, matchCase, wordSeparators);
            const actual = searchParams.parseSearchRequest();
            if (expected === null) {
                assert.ok(actual === null);
            }
            else {
                assert.deepStrictEqual(actual.regex, expected.regex);
                assert.deepStrictEqual(actual.simpleSearch, expected.simpleSearch);
                if (wordSeparators) {
                    assert.ok(actual.wordSeparators !== null);
                }
                else {
                    assert.ok(actual.wordSeparators === null);
                }
            }
        }
        test('parseSearchRequest invalid', () => {
            assertParseSearchResult('', true, true, wordHelper_1.USUAL_WORD_SEPARATORS, null);
            assertParseSearchResult('(', true, false, null, null);
        });
        test('parseSearchRequest non regex', () => {
            assertParseSearchResult('foo', false, false, null, new model_1.SearchData(/foo/giu, null, null));
            assertParseSearchResult('foo', false, false, wordHelper_1.USUAL_WORD_SEPARATORS, new model_1.SearchData(/foo/giu, usualWordSeparators, null));
            assertParseSearchResult('foo', false, true, null, new model_1.SearchData(/foo/gu, null, 'foo'));
            assertParseSearchResult('foo', false, true, wordHelper_1.USUAL_WORD_SEPARATORS, new model_1.SearchData(/foo/gu, usualWordSeparators, 'foo'));
            assertParseSearchResult('foo\\n', false, false, null, new model_1.SearchData(/foo\\n/giu, null, null));
            assertParseSearchResult('foo\\\\n', false, false, null, new model_1.SearchData(/foo\\\\n/giu, null, null));
            assertParseSearchResult('foo\\r', false, false, null, new model_1.SearchData(/foo\\r/giu, null, null));
            assertParseSearchResult('foo\\\\r', false, false, null, new model_1.SearchData(/foo\\\\r/giu, null, null));
        });
        test('parseSearchRequest regex', () => {
            assertParseSearchResult('foo', true, false, null, new model_1.SearchData(/foo/giu, null, null));
            assertParseSearchResult('foo', true, false, wordHelper_1.USUAL_WORD_SEPARATORS, new model_1.SearchData(/foo/giu, usualWordSeparators, null));
            assertParseSearchResult('foo', true, true, null, new model_1.SearchData(/foo/gu, null, null));
            assertParseSearchResult('foo', true, true, wordHelper_1.USUAL_WORD_SEPARATORS, new model_1.SearchData(/foo/gu, usualWordSeparators, null));
            assertParseSearchResult('foo\\n', true, false, null, new model_1.SearchData(/foo\n/gimu, null, null));
            assertParseSearchResult('foo\\\\n', true, false, null, new model_1.SearchData(/foo\\n/giu, null, null));
            assertParseSearchResult('foo\\r', true, false, null, new model_1.SearchData(/foo\r/gimu, null, null));
            assertParseSearchResult('foo\\\\r', true, false, null, new model_1.SearchData(/foo\\r/giu, null, null));
        });
        test('issue #53415. \W should match line break.', () => {
            assertFindMatches([
                'text',
                '180702-',
                '180703-180704'
            ].join('\n'), '\\d{6}-\\W', true, false, null, [
                [2, 1, 3, 1]
            ]);
            assertFindMatches([
                'Just some text',
                '',
                'Just'
            ].join('\n'), '\\W', true, false, null, [
                [1, 5, 1, 6],
                [1, 10, 1, 11],
                [1, 15, 2, 1],
                [2, 1, 3, 1]
            ]);
            // Line break doesn't affect the result as we always use \n as line break when doing search
            assertFindMatches([
                'Just some text',
                '',
                'Just'
            ].join('\r\n'), '\\W', true, false, null, [
                [1, 5, 1, 6],
                [1, 10, 1, 11],
                [1, 15, 2, 1],
                [2, 1, 3, 1]
            ]);
            assertFindMatches([
                'Just some text',
                '\tJust',
                'Just'
            ].join('\n'), '\\W', true, false, null, [
                [1, 5, 1, 6],
                [1, 10, 1, 11],
                [1, 15, 2, 1],
                [2, 1, 2, 2],
                [2, 6, 3, 1],
            ]);
            // line break is seen as one non-word character
            assertFindMatches([
                'Just  some text',
                '',
                'Just'
            ].join('\n'), '\\W{2}', true, false, null, [
                [1, 5, 1, 7],
                [1, 16, 3, 1]
            ]);
            // even if it's \r\n
            assertFindMatches([
                'Just  some text',
                '',
                'Just'
            ].join('\r\n'), '\\W{2}', true, false, null, [
                [1, 5, 1, 7],
                [1, 16, 3, 1]
            ]);
        });
        test('Simple find using unicode escape sequences', () => {
            assertFindMatches(regularText.join('\n'), '\\u{0066}\\u006f\\u006F', true, false, null, [
                [1, 14, 1, 17],
                [1, 44, 1, 47],
                [2, 22, 2, 25],
                [2, 48, 2, 51],
                [4, 59, 4, 62]
            ]);
        });
        test('isMultilineRegexSource', () => {
            assert(!(0, textModelSearch_1.isMultilineRegexSource)('foo'));
            assert(!(0, textModelSearch_1.isMultilineRegexSource)(''));
            assert(!(0, textModelSearch_1.isMultilineRegexSource)('foo\\sbar'));
            assert(!(0, textModelSearch_1.isMultilineRegexSource)('\\\\notnewline'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\\nbar'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\\nbar\\s'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\\r\\n'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('\\n'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\\W'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\n'));
            assert((0, textModelSearch_1.isMultilineRegexSource)('foo\r\n'));
        });
        test('issue #74715. \\d* finds empty string and stops searching.', () => {
            const model = (0, testTextModel_1.createTextModel)('10.243.30.10');
            const searchParams = new textModelSearch_1.SearchParams('\\d*', true, false, null);
            const actual = textModelSearch_1.TextModelSearch.findMatches(model, searchParams, model.getFullModelRange(), true, 100);
            assert.deepStrictEqual(actual, [
                new model_1.FindMatch(new range_1.Range(1, 1, 1, 3), ['10']),
                new model_1.FindMatch(new range_1.Range(1, 3, 1, 3), ['']),
                new model_1.FindMatch(new range_1.Range(1, 4, 1, 7), ['243']),
                new model_1.FindMatch(new range_1.Range(1, 7, 1, 7), ['']),
                new model_1.FindMatch(new range_1.Range(1, 8, 1, 10), ['30']),
                new model_1.FindMatch(new range_1.Range(1, 10, 1, 10), ['']),
                new model_1.FindMatch(new range_1.Range(1, 11, 1, 13), ['10'])
            ]);
            model.dispose();
        });
        test('issue #100134. Zero-length matches should properly step over surrogate pairs', () => {
            // 1[Laptop]1 - there shoud be no matches inside of [Laptop] emoji
            assertFindMatches('1\uD83D\uDCBB1', '()', true, false, null, [
                [1, 1, 1, 1],
                [1, 2, 1, 2],
                [1, 4, 1, 4],
                [1, 5, 1, 5],
            ]);
            // 1[Hacker Cat]1 = 1[Cat Face][ZWJ][Laptop]1 - there shoud be matches between emoji and ZWJ
            // there shoud be no matches inside of [Cat Face] and [Laptop] emoji
            assertFindMatches('1\uD83D\uDC31\u200D\uD83D\uDCBB1', '()', true, false, null, [
                [1, 1, 1, 1],
                [1, 2, 1, 2],
                [1, 4, 1, 4],
                [1, 5, 1, 5],
                [1, 7, 1, 7],
                [1, 8, 1, 8]
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsU2VhcmNoLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC90ZXh0TW9kZWxTZWFyY2gudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxpQkFBaUI7SUFDakIsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUU3QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLGlEQUF1QixFQUFDLGtDQUFxQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRS9FLFNBQVMsZUFBZSxDQUFDLE1BQXdCLEVBQUUsYUFBb0IsRUFBRSxrQkFBbUMsSUFBSTtZQUMvRyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLGlCQUFTLENBQUMsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELFNBQVMsa0JBQWtCLENBQUMsS0FBZ0IsRUFBRSxZQUEwQixFQUFFLGVBQTRCO1lBQ3JHLE1BQU0sTUFBTSxHQUFHLGlDQUFlLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRWxFLHVCQUF1QjtZQUN2QixJQUFJLFFBQVEsR0FBRyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksS0FBSyxHQUFHLGlDQUFlLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FB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QUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sR0FBRyxpQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkcsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhELE1BQU0sR0FBRyxpQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkYsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhELE1BQU0sR0FBRyxpQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkcsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sR0FBRyxpQ0FBZSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsWUFBWSxFQUFFLE1BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkcsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRS9DLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENB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