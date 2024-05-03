/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, assert, utils_1, range_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorSimpleWorker', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class WorkerWithModels extends editorSimpleWorker_1.EditorSimpleWorker {
            getModel(uri) {
                return this._getModel(uri);
            }
            addModel(lines, eol = '\n') {
                const uri = 'test:file#' + Date.now();
                this.acceptNewModel({
                    url: uri,
                    versionId: 1,
                    lines: lines,
                    EOL: eol
                });
                return this._getModel(uri);
            }
        }
        let worker;
        let model;
        setup(() => {
            worker = new WorkerWithModels(null, null);
            model = worker.addModel([
                'This is line one', //16
                'and this is line number two', //27
                'it is followed by #3', //20
                'and finished with the fourth.', //29
            ]);
        });
        function assertPositionAt(offset, line, column) {
            const position = model.positionAt(offset);
            assert.strictEqual(position.lineNumber, line);
            assert.strictEqual(position.column, column);
        }
        function assertOffsetAt(lineNumber, column, offset) {
            const actual = model.offsetAt({ lineNumber, column });
            assert.strictEqual(actual, offset);
        }
        test('ICommonModel#offsetAt', () => {
            assertOffsetAt(1, 1, 0);
            assertOffsetAt(1, 2, 1);
            assertOffsetAt(1, 17, 16);
            assertOffsetAt(2, 1, 17);
            assertOffsetAt(2, 4, 20);
            assertOffsetAt(3, 1, 45);
            assertOffsetAt(5, 30, 95);
            assertOffsetAt(5, 31, 95);
            assertOffsetAt(5, Number.MAX_VALUE, 95);
            assertOffsetAt(6, 30, 95);
            assertOffsetAt(Number.MAX_VALUE, 30, 95);
            assertOffsetAt(Number.MAX_VALUE, Number.MAX_VALUE, 95);
        });
        test('ICommonModel#positionAt', () => {
            assertPositionAt(0, 1, 1);
            assertPositionAt(Number.MIN_VALUE, 1, 1);
            assertPositionAt(1, 1, 2);
            assertPositionAt(16, 1, 17);
            assertPositionAt(17, 2, 1);
            assertPositionAt(20, 2, 4);
            assertPositionAt(45, 3, 1);
            assertPositionAt(95, 4, 30);
            assertPositionAt(96, 4, 30);
            assertPositionAt(99, 4, 30);
            assertPositionAt(Number.MAX_VALUE, 4, 30);
        });
        test('ICommonModel#validatePosition, issue #15882', function () {
            const model = worker.addModel(['{"id": "0001","type": "donut","name": "Cake","image":{"url": "images/0001.jpg","width": 200,"height": 200},"thumbnail":{"url": "images/thumbnails/0001.jpg","width": 32,"height": 32}}']);
            assert.strictEqual(model.offsetAt({ lineNumber: 1, column: 2 }), 1);
        });
        test('MoreMinimal', () => {
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: 'This is line One', range: new range_1.Range(1, 1, 1, 17) }], false).then(edits => {
                assert.strictEqual(edits.length, 1);
                const [first] = edits;
                assert.strictEqual(first.text, 'O');
                assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 14, endLineNumber: 1, endColumn: 15 });
            });
        });
        test('MoreMinimal, merge adjacent edits', async function () {
            const model = worker.addModel([
                'one',
                'two',
                'three',
                'four',
                'five'
            ], '\n');
            const newEdits = await worker.computeMoreMinimalEdits(model.uri.toString(), [
                {
                    range: new range_1.Range(1, 1, 2, 1),
                    text: 'one\ntwo\nthree\n',
                }, {
                    range: new range_1.Range(2, 1, 3, 1),
                    text: '',
                }, {
                    range: new range_1.Range(3, 1, 4, 1),
                    text: '',
                }, {
                    range: new range_1.Range(4, 2, 4, 3),
                    text: '4',
                }, {
                    range: new range_1.Range(5, 3, 5, 5),
                    text: '5',
                }
            ], false);
            assert.strictEqual(newEdits.length, 2);
            assert.strictEqual(newEdits[0].text, '4');
            assert.strictEqual(newEdits[1].text, '5');
        });
        test('MoreMinimal, issue #15385 newline changes only', function () {
            const model = worker.addModel([
                '{',
                '\t"a":1',
                '}'
            ], '\n');
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '{\r\n\t"a":1\r\n}', range: new range_1.Range(1, 1, 3, 2) }], false).then(edits => {
                assert.strictEqual(edits.length, 0);
            });
        });
        test('MoreMinimal, issue #15385 newline changes and other', function () {
            const model = worker.addModel([
                '{',
                '\t"a":1',
                '}'
            ], '\n');
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '{\r\n\t"b":1\r\n}', range: new range_1.Range(1, 1, 3, 2) }], false).then(edits => {
                assert.strictEqual(edits.length, 1);
                const [first] = edits;
                assert.strictEqual(first.text, 'b');
                assert.deepStrictEqual(first.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 2, endColumn: 4 });
            });
        });
        test('MoreMinimal, issue #15385 newline changes and other 2/2', function () {
            const model = worker.addModel([
                'package main', // 1
                'func foo() {', // 2
                '}' // 3
            ]);
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '\n', range: new range_1.Range(3, 2, 4, 1000) }], false).then(edits => {
                assert.strictEqual(edits.length, 1);
                const [first] = edits;
                assert.strictEqual(first.text, '\n');
                assert.deepStrictEqual(first.range, { startLineNumber: 3, startColumn: 2, endLineNumber: 3, endColumn: 2 });
            });
        });
        async function testEdits(lines, edits) {
            const model = worker.addModel(lines);
            const smallerEdits = await worker.computeHumanReadableDiff(model.uri.toString(), edits, { ignoreTrimWhitespace: false, maxComputationTimeMs: 0, computeMoves: false });
            const t1 = applyEdits(model.getValue(), edits);
            const t2 = applyEdits(model.getValue(), smallerEdits);
            assert.deepStrictEqual(t1, t2);
            return smallerEdits.map(e => ({ range: range_1.Range.lift(e.range).toString(), text: e.text }));
        }
        test('computeHumanReadableDiff 1', async () => {
            assert.deepStrictEqual(await testEdits([
                'function test() {}'
            ], [{
                    text: "\n/** Some Comment */\n",
                    range: new range_1.Range(1, 1, 1, 1)
                }]), ([{ range: "[1,1 -> 1,1]", text: "\n/** Some Comment */\n" }]));
        });
        test('computeHumanReadableDiff 2', async () => {
            assert.deepStrictEqual(await testEdits([
                'function test() {}'
            ], [{
                    text: 'function test(myParam: number) { console.log(myParam); }',
                    range: new range_1.Range(1, 1, 1, Number.MAX_SAFE_INTEGER)
                }]), ([{ range: '[1,15 -> 1,15]', text: 'myParam: number' }, { range: '[1,18 -> 1,18]', text: ' console.log(myParam); ' }]));
        });
        test('computeHumanReadableDiff 3', async () => {
            assert.deepStrictEqual(await testEdits([
                '',
                '',
                '',
                ''
            ], [{
                    text: 'function test(myParam: number) { console.log(myParam); }\n\n',
                    range: new range_1.Range(2, 1, 3, 20)
                }]), ([{ range: '[2,1 -> 2,1]', text: 'function test(myParam: number) { console.log(myParam); }\n' }]));
        });
        test('computeHumanReadableDiff 4', async () => {
            assert.deepStrictEqual(await testEdits([
                'function algorithm() {}',
            ], [{
                    text: 'function alm() {}',
                    range: new range_1.Range(1, 1, 1, Number.MAX_SAFE_INTEGER)
                }]), ([{ range: "[1,10 -> 1,19]", text: "alm" }]));
        });
        test('[Bug] Getting Message "Overlapping ranges are not allowed" and nothing happens with Inline-Chat ', async function () {
            await testEdits(("const API = require('../src/api');\n\ndescribe('API', () => {\n  let api;\n  let database;\n\n  beforeAll(() => {\n    database = {\n      getAllBooks: jest.fn(),\n      getBooksByAuthor: jest.fn(),\n      getBooksByTitle: jest.fn(),\n    };\n    api = new API(database);\n  });\n\n  describe('GET /books', () => {\n    it('should return all books', async () => {\n      const mockBooks = [{ title: 'Book 1' }, { title: 'Book 2' }];\n      database.getAllBooks.mockResolvedValue(mockBooks);\n\n      const req = {};\n      const res = {\n        json: jest.fn(),\n      };\n\n      await api.register({\n        get: (path, handler) => {\n          if (path === '/books') {\n            handler(req, res);\n          }\n        },\n      });\n\n      expect(database.getAllBooks).toHaveBeenCalled();\n      expect(res.json).toHaveBeenCalledWith(mockBooks);\n    });\n  });\n\n  describe('GET /books/author/:author', () => {\n    it('should return books by author', async () => {\n      const mockAuthor = 'John Doe';\n      const mockBooks = [{ title: 'Book 1', author: mockAuthor }, { title: 'Book 2', author: mockAuthor }];\n      database.getBooksByAuthor.mockResolvedValue(mockBooks);\n\n      const req = {\n        params: {\n          author: mockAuthor,\n        },\n      };\n      const res = {\n        json: jest.fn(),\n      };\n\n      await api.register({\n        get: (path, handler) => {\n          if (path === `/books/author/${mockAuthor}`) {\n            handler(req, res);\n          }\n        },\n      });\n\n      expect(database.getBooksByAuthor).toHaveBeenCalledWith(mockAuthor);\n      expect(res.json).toHaveBeenCalledWith(mockBooks);\n    });\n  });\n\n  describe('GET /books/title/:title', () => {\n    it('should return books by title', async () => {\n      const mockTitle = 'Book 1';\n      const mockBooks = [{ title: mockTitle, author: 'John Doe' }];\n      database.getBooksByTitle.mockResolvedValue(mockBooks);\n\n      const req = {\n        params: {\n          title: mockTitle,\n        },\n      };\n      const res = {\n        json: jest.fn(),\n      };\n\n      await api.register({\n        get: (path, handler) => {\n          if (path === `/books/title/${mockTitle}`) {\n            handler(req, res);\n          }\n        },\n      });\n\n      expect(database.getBooksByTitle).toHaveBeenCalledWith(mockTitle);\n      expect(res.json).toHaveBeenCalledWith(mockBooks);\n    });\n  });\n});\n").split('\n'), [{
                    range: { startLineNumber: 1, startColumn: 1, endLineNumber: 96, endColumn: 1 },
                    text: `const request = require('supertest');\nconst API = require('../src/api');\n\ndescribe('API', () => {\n  let api;\n  let database;\n\n  beforeAll(() => {\n    database = {\n      getAllBooks: jest.fn(),\n      getBooksByAuthor: jest.fn(),\n      getBooksByTitle: jest.fn(),\n    };\n    api = new API(database);\n  });\n\n  describe('GET /books', () => {\n    it('should return all books', async () => {\n      const mockBooks = [{ title: 'Book 1' }, { title: 'Book 2' }];\n      database.getAllBooks.mockResolvedValue(mockBooks);\n\n      const response = await request(api.app).get('/books');\n\n      expect(database.getAllBooks).toHaveBeenCalled();\n      expect(response.status).toBe(200);\n      expect(response.body).toEqual(mockBooks);\n    });\n  });\n\n  describe('GET /books/author/:author', () => {\n    it('should return books by author', async () => {\n      const mockAuthor = 'John Doe';\n      const mockBooks = [{ title: 'Book 1', author: mockAuthor }, { title: 'Book 2', author: mockAuthor }];\n      database.getBooksByAuthor.mockResolvedValue(mockBooks);\n\n      const response = await request(api.app).get(\`/books/author/\${mockAuthor}\`);\n\n      expect(database.getBooksByAuthor).toHaveBeenCalledWith(mockAuthor);\n      expect(response.status).toBe(200);\n      expect(response.body).toEqual(mockBooks);\n    });\n  });\n\n  describe('GET /books/title/:title', () => {\n    it('should return books by title', async () => {\n      const mockTitle = 'Book 1';\n      const mockBooks = [{ title: mockTitle, author: 'John Doe' }];\n      database.getBooksByTitle.mockResolvedValue(mockBooks);\n\n      const response = await request(api.app).get(\`/books/title/\${mockTitle}\`);\n\n      expect(database.getBooksByTitle).toHaveBeenCalledWith(mockTitle);\n      expect(response.status).toBe(200);\n      expect(response.body).toEqual(mockBooks);\n    });\n  });\n});\n`,
                }]);
        });
        test('ICommonModel#getValueInRange, issue #17424', function () {
            const model = worker.addModel([
                'package main', // 1
                'func foo() {', // 2
                '}' // 3
            ]);
            const value = model.getValueInRange({ startLineNumber: 3, startColumn: 1, endLineNumber: 4, endColumn: 1 });
            assert.strictEqual(value, '}');
        });
        test('textualSuggest, issue #17785', function () {
            const model = worker.addModel([
                'foobar', // 1
                'f f' // 2
            ]);
            return worker.textualSuggest([model.uri.toString()], 'f', '[a-z]+', 'img').then((result) => {
                if (!result) {
                    assert.ok(false);
                }
                assert.strictEqual(result.words.length, 1);
                assert.strictEqual(typeof result.duration, 'number');
                assert.strictEqual(result.words[0], 'foobar');
            });
        });
        test('get words via iterator, issue #46930', function () {
            const model = worker.addModel([
                'one line', // 1
                'two line', // 2
                '',
                'past empty',
                'single',
                '',
                'and now we are done'
            ]);
            const words = [...model.words(/[a-z]+/img)];
            assert.deepStrictEqual(words, ['one', 'line', 'two', 'line', 'past', 'empty', 'single', 'and', 'now', 'we', 'are', 'done']);
        });
    });
    function applyEdits(text, edits) {
        const transformer = new PositionOffsetTransformer(text);
        const offsetEdits = edits.map(e => {
            const range = range_1.Range.lift(e.range);
            return ({
                startOffset: transformer.getOffset(range.getStartPosition()),
                endOffset: transformer.getOffset(range.getEndPosition()),
                text: e.text
            });
        });
        offsetEdits.sort((a, b) => b.startOffset - a.startOffset);
        for (const edit of offsetEdits) {
            text = text.substring(0, edit.startOffset) + edit.text + text.substring(edit.endOffset);
        }
        return text;
    }
    class PositionOffsetTransformer {
        constructor(text) {
            this.text = text;
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
            this.lineStartOffsetByLineIdx.push(text.length + 1);
        }
        getOffset(position) {
            const maxLineOffset = position.lineNumber >= this.lineStartOffsetByLineIdx.length ? this.text.length : (this.lineStartOffsetByLineIdx[position.lineNumber] - 1);
            return Math.min(this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1, maxLineOffset);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2ltcGxlV29ya2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9zZXJ2aWNlcy9lZGl0b3JTaW1wbGVXb3JrZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBRWhDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxNQUFNLGdCQUFpQixTQUFRLHVDQUFrQjtZQUVoRCxRQUFRLENBQUMsR0FBVztnQkFDbkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxRQUFRLENBQUMsS0FBZSxFQUFFLE1BQWMsSUFBSTtnQkFDM0MsTUFBTSxHQUFHLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLGNBQWMsQ0FBQztvQkFDbkIsR0FBRyxFQUFFLEdBQUc7b0JBQ1IsU0FBUyxFQUFFLENBQUM7b0JBQ1osS0FBSyxFQUFFLEtBQUs7b0JBQ1osR0FBRyxFQUFFLEdBQUc7aUJBQ1IsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1QixDQUFDO1NBQ0Q7UUFFRCxJQUFJLE1BQXdCLENBQUM7UUFDN0IsSUFBSSxLQUFtQixDQUFDO1FBRXhCLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixNQUFNLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBb0IsSUFBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlELEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDO2dCQUN2QixrQkFBa0IsRUFBRSxJQUFJO2dCQUN4Qiw2QkFBNkIsRUFBRSxJQUFJO2dCQUNuQyxzQkFBc0IsRUFBRSxJQUFJO2dCQUM1QiwrQkFBK0IsRUFBRSxJQUFJO2FBQ3JDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsU0FBUyxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsSUFBWSxFQUFFLE1BQWM7WUFDckUsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCxTQUFTLGNBQWMsQ0FBQyxVQUFrQixFQUFFLE1BQWMsRUFBRSxNQUFjO1lBQ3pFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNsQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QixjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN6QixjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQixjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMxQixjQUFjLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEMsY0FBYyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUIsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUIsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxQixnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0IsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQixnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDNUIsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM1QixnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLGdC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