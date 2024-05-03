/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTypes", "vs/editor/common/core/range", "vs/base/test/common/mock", "./extHostDocumentData.test.perf-data", "vs/editor/common/core/wordHelper", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostDocumentData_1, extHostTypes_1, range_1, mock_1, perfData, wordHelper_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentData', () => {
        let data;
        function assertPositionAt(offset, line, character) {
            const position = data.document.positionAt(offset);
            assert.strictEqual(position.line, line);
            assert.strictEqual(position.character, character);
        }
        function assertOffsetAt(line, character, offset) {
            const pos = new extHostTypes_1.Position(line, character);
            const actual = data.document.offsetAt(pos);
            assert.strictEqual(actual, offset);
        }
        setup(function () {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ], '\n', 1, 'text', false);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('readonly-ness', () => {
            assert.throws(() => data.document.uri = null);
            assert.throws(() => data.document.fileName = 'foofile');
            assert.throws(() => data.document.isDirty = false);
            assert.throws(() => data.document.isUntitled = false);
            assert.throws(() => data.document.languageId = 'dddd');
            assert.throws(() => data.document.lineCount = 9);
        });
        test('save, when disposed', function () {
            let saved;
            const data = new extHostDocumentData_1.ExtHostDocumentData(new class extends (0, mock_1.mock)() {
                $trySaveDocument(uri) {
                    assert.ok(!saved);
                    saved = uri;
                    return Promise.resolve(true);
                }
            }, uri_1.URI.parse('foo:bar'), [], '\n', 1, 'text', true);
            return data.document.save().then(() => {
                assert.strictEqual(saved.toString(), 'foo:bar');
                data.dispose();
                return data.document.save().then(() => {
                    assert.ok(false, 'expected failure');
                }, err => {
                    assert.ok(err);
                });
            });
        });
        test('read, when disposed', function () {
            data.dispose();
            const { document } = data;
            assert.strictEqual(document.lineCount, 4);
            assert.strictEqual(document.lineAt(0).text, 'This is line one');
        });
        test('lines', () => {
            assert.strictEqual(data.document.lineCount, 4);
            assert.throws(() => data.document.lineAt(-1));
            assert.throws(() => data.document.lineAt(data.document.lineCount));
            assert.throws(() => data.document.lineAt(Number.MAX_VALUE));
            assert.throws(() => data.document.lineAt(Number.MIN_VALUE));
            assert.throws(() => data.document.lineAt(0.8));
            let line = data.document.lineAt(0);
            assert.strictEqual(line.lineNumber, 0);
            assert.strictEqual(line.text.length, 16);
            assert.strictEqual(line.text, 'This is line one');
            assert.strictEqual(line.isEmptyOrWhitespace, false);
            assert.strictEqual(line.firstNonWhitespaceCharacterIndex, 0);
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: '\t '
                    }],
                eol: undefined,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            });
            // line didn't change
            assert.strictEqual(line.text, 'This is line one');
            assert.strictEqual(line.firstNonWhitespaceCharacterIndex, 0);
            // fetch line again
            line = data.document.lineAt(0);
            assert.strictEqual(line.text, '\t This is line one');
            assert.strictEqual(line.firstNonWhitespaceCharacterIndex, 2);
        });
        test('line, issue #5704', function () {
            let line = data.document.lineAt(0);
            let { range, rangeIncludingLineBreak } = line;
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 16);
            assert.strictEqual(rangeIncludingLineBreak.end.line, 1);
            assert.strictEqual(rangeIncludingLineBreak.end.character, 0);
            line = data.document.lineAt(data.document.lineCount - 1);
            range = line.range;
            rangeIncludingLineBreak = line.rangeIncludingLineBreak;
            assert.strictEqual(range.end.line, 3);
            assert.strictEqual(range.end.character, 29);
            assert.strictEqual(rangeIncludingLineBreak.end.line, 3);
            assert.strictEqual(rangeIncludingLineBreak.end.character, 29);
        });
        test('offsetAt', () => {
            assertOffsetAt(0, 0, 0);
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 16, 16);
            assertOffsetAt(1, 0, 17);
            assertOffsetAt(1, 3, 20);
            assertOffsetAt(2, 0, 45);
            assertOffsetAt(4, 29, 95);
            assertOffsetAt(4, 30, 95);
            assertOffsetAt(4, Number.MAX_VALUE, 95);
            assertOffsetAt(5, 29, 95);
            assertOffsetAt(Number.MAX_VALUE, 29, 95);
            assertOffsetAt(Number.MAX_VALUE, Number.MAX_VALUE, 95);
        });
        test('offsetAt, after remove', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: ''
                    }],
                eol: undefined,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 13, 13);
            assertOffsetAt(1, 0, 14);
        });
        test('offsetAt, after replace', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: 'is could be'
                    }],
                eol: undefined,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 24, 24);
            assertOffsetAt(1, 0, 25);
        });
        test('offsetAt, after insert line', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 1, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: 'is could be\na line with number'
                    }],
                eol: undefined,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 13, 13);
            assertOffsetAt(1, 0, 14);
            assertOffsetAt(1, 18, 13 + 1 + 18);
            assertOffsetAt(1, 29, 13 + 1 + 29);
            assertOffsetAt(2, 0, 13 + 1 + 29 + 1);
        });
        test('offsetAt, after remove line', function () {
            data.onEvents({
                changes: [{
                        range: { startLineNumber: 1, startColumn: 3, endLineNumber: 2, endColumn: 6 },
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: ''
                    }],
                eol: undefined,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            });
            assertOffsetAt(0, 1, 1);
            assertOffsetAt(0, 2, 2);
            assertOffsetAt(1, 0, 25);
        });
        test('positionAt', () => {
            assertPositionAt(0, 0, 0);
            assertPositionAt(Number.MIN_VALUE, 0, 0);
            assertPositionAt(1, 0, 1);
            assertPositionAt(16, 0, 16);
            assertPositionAt(17, 1, 0);
            assertPositionAt(20, 1, 3);
            assertPositionAt(45, 2, 0);
            assertPositionAt(95, 3, 29);
            assertPositionAt(96, 3, 29);
            assertPositionAt(99, 3, 29);
            assertPositionAt(Number.MAX_VALUE, 3, 29);
        });
        test('getWordRangeAtPosition', () => {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'aaaa bbbb+cccc abc'
            ], '\n', 1, 'text', false);
            let range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 2));
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 4);
            // ignore bad regular expresson /.*/
            assert.throws(() => data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 2), /.*/));
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 5), /[a-z+]+/);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 5);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 14);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 17), /[a-z+]+/);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.start.character, 15);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.end.character, 18);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 11), /yy/);
            assert.strictEqual(range, undefined);
        });
        test('getWordRangeAtPosition doesn\'t quite use the regex as expected, #29102', function () {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                'some text here',
                '/** foo bar */',
                'function() {',
                '	"far boo"',
                '}'
            ], '\n', 1, 'text', false);
            let range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 0), /\/\*.+\*\//);
            assert.strictEqual(range, undefined);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(1, 0), /\/\*.+\*\//);
            assert.strictEqual(range.start.line, 1);
            assert.strictEqual(range.start.character, 0);
            assert.strictEqual(range.end.line, 1);
            assert.strictEqual(range.end.character, 14);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(3, 0), /("|').*\1/);
            assert.strictEqual(range, undefined);
            range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(3, 1), /("|').*\1/);
            assert.strictEqual(range.start.line, 3);
            assert.strictEqual(range.start.character, 1);
            assert.strictEqual(range.end.line, 3);
            assert.strictEqual(range.end.character, 10);
        });
        test('getWordRangeAtPosition can freeze the extension host #95319', function () {
            const regex = /(https?:\/\/github\.com\/(([^\s]+)\/([^\s]+))\/([^\s]+\/)?(issues|pull)\/([0-9]+))|(([^\s]+)\/([^\s]+))?#([1-9][0-9]*)($|[\s\:\;\-\(\=])/;
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                perfData._$_$_expensive
            ], '\n', 1, 'text', false);
            // this test only ensures that we eventually give and timeout (when searching "funny" words and long lines)
            // for the sake of speedy tests we lower the timeBudget here
            const config = (0, wordHelper_1.setDefaultGetWordAtTextConfig)({ maxLen: 1000, windowSize: 15, timeBudget: 30 });
            try {
                let range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 1_177_170), regex);
                assert.strictEqual(range, undefined);
                const pos = new extHostTypes_1.Position(0, 1177170);
                range = data.document.getWordRangeAtPosition(pos);
                assert.ok(range);
                assert.ok(range.contains(pos));
                assert.strictEqual(data.document.getText(range), 'TaskDefinition');
            }
            finally {
                config.dispose();
            }
        });
        test('Rename popup sometimes populates with text on the left side omitted #96013', function () {
            const regex = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\$\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g;
            const line = 'int abcdefhijklmnopqwvrstxyz;';
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                line
            ], '\n', 1, 'text', false);
            const range = data.document.getWordRangeAtPosition(new extHostTypes_1.Position(0, 27), regex);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.start.character, 4);
            assert.strictEqual(range.end.character, 28);
        });
        test('Custom snippet $TM_SELECTED_TEXT not show suggestion #108892', function () {
            data = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), [
                `        <p><span xml:lang="en">Sheldon</span>, soprannominato "<span xml:lang="en">Shelly</span> dalla madre e dalla sorella, è nato a <span xml:lang="en">Galveston</span>, in <span xml:lang="en">Texas</span>, il 26 febbraio 1980 in un supermercato. È stato un bambino prodigio, come testimoniato dal suo quoziente d'intelligenza (187, di molto superiore alla norma) e dalla sua rapida carriera scolastica: si è diplomato all'eta di 11 anni approdando alla stessa età alla formazione universitaria e all'età di 16 anni ha ottenuto il suo primo dottorato di ricerca. All'inizio della serie e per gran parte di essa vive con il coinquilino Leonard nell'appartamento 4A al 2311 <span xml:lang="en">North Los Robles Avenue</span> di <span xml:lang="en">Pasadena</span>, per poi trasferirsi nell'appartamento di <span xml:lang="en">Penny</span> con <span xml:lang="en">Amy</span> nella decima stagione. Come più volte afferma lui stesso possiede una memoria eidetica e un orecchio assoluto. È stato educato da una madre estremamente religiosa e, in più occasioni, questo aspetto contrasta con il rigore scientifico di <span xml:lang="en">Sheldon</span>; tuttavia la donna sembra essere l'unica persona in grado di comandarlo a bacchetta.</p>`
            ], '\n', 1, 'text', false);
            const pos = new extHostTypes_1.Position(0, 55);
            const range = data.document.getWordRangeAtPosition(pos);
            assert.strictEqual(range.start.line, 0);
            assert.strictEqual(range.end.line, 0);
            assert.strictEqual(range.start.character, 47);
            assert.strictEqual(range.end.character, 61);
            assert.strictEqual(data.document.getText(range), 'soprannominato');
        });
    });
    var AssertDocumentLineMappingDirection;
    (function (AssertDocumentLineMappingDirection) {
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["OffsetToPosition"] = 0] = "OffsetToPosition";
        AssertDocumentLineMappingDirection[AssertDocumentLineMappingDirection["PositionToOffset"] = 1] = "PositionToOffset";
    })(AssertDocumentLineMappingDirection || (AssertDocumentLineMappingDirection = {}));
    suite('ExtHostDocumentData updates line mapping', () => {
        function positionToStr(position) {
            return '(' + position.line + ',' + position.character + ')';
        }
        function assertDocumentLineMapping(doc, direction) {
            const allText = doc.getText();
            let line = 0, character = 0, previousIsCarriageReturn = false;
            for (let offset = 0; offset <= allText.length; offset++) {
                // The position coordinate system cannot express the position between \r and \n
                const position = new extHostTypes_1.Position(line, character + (previousIsCarriageReturn ? -1 : 0));
                if (direction === AssertDocumentLineMappingDirection.OffsetToPosition) {
                    const actualPosition = doc.document.positionAt(offset);
                    assert.strictEqual(positionToStr(actualPosition), positionToStr(position), 'positionAt mismatch for offset ' + offset);
                }
                else {
                    // The position coordinate system cannot express the position between \r and \n
                    const expectedOffset = offset + (previousIsCarriageReturn ? -1 : 0);
                    const actualOffset = doc.document.offsetAt(position);
                    assert.strictEqual(actualOffset, expectedOffset, 'offsetAt mismatch for position ' + positionToStr(position));
                }
                if (allText.charAt(offset) === '\n') {
                    line++;
                    character = 0;
                }
                else {
                    character++;
                }
                previousIsCarriageReturn = (allText.charAt(offset) === '\r');
            }
        }
        function createChangeEvent(range, text, eol) {
            return {
                changes: [{
                        range: range,
                        rangeOffset: undefined,
                        rangeLength: undefined,
                        text: text
                    }],
                eol: eol,
                versionId: undefined,
                isRedoing: false,
                isUndoing: false,
            };
        }
        function testLineMappingDirectionAfterEvents(lines, eol, direction, e) {
            const myDocument = new extHostDocumentData_1.ExtHostDocumentData(undefined, uri_1.URI.file(''), lines.slice(0), eol, 1, 'text', false);
            assertDocumentLineMapping(myDocument, direction);
            myDocument.onEvents(e);
            assertDocumentLineMapping(myDocument, direction);
        }
        function testLineMappingAfterEvents(lines, e) {
            testLineMappingDirectionAfterEvents(lines, '\n', AssertDocumentLineMappingDirection.PositionToOffset, e);
            testLineMappingDirectionAfterEvents(lines, '\n', AssertDocumentLineMappingDirection.OffsetToPosition, e);
            testLineMappingDirectionAfterEvents(lines, '\r\n', AssertDocumentLineMappingDirection.PositionToOffset, e);
            testLineMappingDirectionAfterEvents(lines, '\r\n', AssertDocumentLineMappingDirection.OffsetToPosition, e);
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('line mapping', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], { changes: [], eol: undefined, versionId: 7, isRedoing: false, isUndoing: false });
        });
        test('after remove', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), ''));
        });
        test('after replace', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be'));
        });
        test('after insert line', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be\na line with number'));
        });
        test('after insert two lines', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 1, 6), 'is could be\na line with number\nyet another line'));
        });
        test('after remove line', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 2, 6), ''));
        });
        test('after remove two lines', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 3, 6), ''));
        });
        test('after deleting entire content', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 4, 30), ''));
        });
        test('after replacing entire content', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 3, 4, 30), 'some new text\nthat\nspans multiple lines'));
        });
        test('after changing EOL to CRLF', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 1, 1, 1), '', '\r\n'));
        });
        test('after changing EOL to LF', () => {
            testLineMappingAfterEvents([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ], createChangeEvent(new range_1.Range(1, 1, 1, 1), '', '\n'));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50RGF0YS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0RG9jdW1lbnREYXRhLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUVqQyxJQUFJLElBQXlCLENBQUM7UUFFOUIsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsSUFBWSxFQUFFLFNBQWlCO1lBQ3hFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELFNBQVMsY0FBYyxDQUFDLElBQVksRUFBRSxTQUFpQixFQUFFLE1BQWM7WUFDdEUsTUFBTSxHQUFHLEdBQUcsSUFBSSx1QkFBUSxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDO1lBQ0wsSUFBSSxHQUFHLElBQUkseUNBQW1CLENBQUMsU0FBVSxFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ3hELGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hC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LHVCQUF1QixFQUFFLEdBQUcsSUFBSSxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTdELElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN6RCxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNuQix1QkFBdUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7WUFDdkQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixjQUFjLENBQUMsQ0FBQyxF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