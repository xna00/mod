define(["require", "exports", "vs/workbench/contrib/tasks/common/problemMatcher", "assert", "vs/base/common/parsers"], function (require, exports, matchers, assert, parsers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProblemReporter {
        constructor() {
            this._validationStatus = new parsers_1.ValidationStatus();
            this._messages = [];
        }
        info(message) {
            this._messages.push(message);
            this._validationStatus.state = 1 /* ValidationState.Info */;
        }
        warn(message) {
            this._messages.push(message);
            this._validationStatus.state = 2 /* ValidationState.Warning */;
        }
        error(message) {
            this._messages.push(message);
            this._validationStatus.state = 3 /* ValidationState.Error */;
        }
        fatal(message) {
            this._messages.push(message);
            this._validationStatus.state = 4 /* ValidationState.Fatal */;
        }
        hasMessage(message) {
            return this._messages.indexOf(message) !== null;
        }
        get messages() {
            return this._messages;
        }
        get state() {
            return this._validationStatus.state;
        }
        isOK() {
            return this._validationStatus.isOK();
        }
        get status() {
            return this._validationStatus;
        }
    }
    suite('ProblemPatternParser', () => {
        let reporter;
        let parser;
        const testRegexp = new RegExp('test');
        setup(() => {
            reporter = new ProblemReporter();
            parser = new matchers.ProblemPatternParser(reporter);
        });
        suite('single-pattern definitions', () => {
            test('parses a pattern defined by only a regexp', () => {
                const problemPattern = {
                    regexp: 'test'
                };
                const parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepStrictEqual(parsed, {
                    regexp: testRegexp,
                    kind: matchers.ProblemLocationKind.Location,
                    file: 1,
                    line: 2,
                    character: 3,
                    message: 0
                });
            });
            test('does not sets defaults for line and character if kind is File', () => {
                const problemPattern = {
                    regexp: 'test',
                    kind: 'file'
                };
                const parsed = parser.parse(problemPattern);
                assert.deepStrictEqual(parsed, {
                    regexp: testRegexp,
                    kind: matchers.ProblemLocationKind.File,
                    file: 1,
                    message: 0
                });
            });
        });
        suite('multi-pattern definitions', () => {
            test('defines a pattern based on regexp and property fields, with file/line location', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3, line: 4, column: 5, message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepStrictEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.Location,
                        file: 3,
                        line: 4,
                        character: 5,
                        message: 6
                    }]);
            });
            test('defines a pattern bsaed on regexp and property fields, with location', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3, location: 4, message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepStrictEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.Location,
                        file: 3,
                        location: 4,
                        message: 6
                    }]);
            });
            test('accepts a pattern that provides the fields from multiple entries', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3 },
                    { regexp: 'test1', line: 4 },
                    { regexp: 'test2', column: 5 },
                    { regexp: 'test3', message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepStrictEqual(parsed, [
                    { regexp: testRegexp, kind: matchers.ProblemLocationKind.Location, file: 3 },
                    { regexp: new RegExp('test1'), line: 4 },
                    { regexp: new RegExp('test2'), character: 5 },
                    { regexp: new RegExp('test3'), message: 6 }
                ]);
            });
            test('forbids setting the loop flag outside of the last element in the array', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3, loop: true },
                    { regexp: 'test1', line: 4 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The loop property is only supported on the last line matcher.'));
            });
            test('forbids setting the kind outside of the first element of the array', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3 },
                    { regexp: 'test1', kind: 'file', line: 4 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. The kind property must be provided only in the first element'));
            });
            test('kind: Location requires a regexp', () => {
                const problemPattern = [
                    { file: 0, line: 1, column: 20, message: 0 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is missing a regular expression.'));
            });
            test('kind: Location requires a regexp on every entry', () => {
                const problemPattern = [
                    { regexp: 'test', file: 3 },
                    { line: 4 },
                    { regexp: 'test2', column: 5 },
                    { regexp: 'test3', message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is missing a regular expression.'));
            });
            test('kind: Location requires a message', () => {
                const problemPattern = [
                    { regexp: 'test', file: 0, line: 1, column: 20 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
            test('kind: Location requires a file', () => {
                const problemPattern = [
                    { regexp: 'test', line: 1, column: 20, message: 0 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
            });
            test('kind: Location requires either a line or location', () => {
                const problemPattern = [
                    { regexp: 'test', file: 1, column: 20, message: 0 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
            });
            test('kind: File accepts a regexp, file and message', () => {
                const problemPattern = [
                    { regexp: 'test', file: 2, kind: 'file', message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert(reporter.isOK());
                assert.deepStrictEqual(parsed, [{
                        regexp: testRegexp,
                        kind: matchers.ProblemLocationKind.File,
                        file: 2,
                        message: 6
                    }]);
            });
            test('kind: File requires a file', () => {
                const problemPattern = [
                    { regexp: 'test', kind: 'file', message: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
            test('kind: File requires a message', () => {
                const problemPattern = [
                    { regexp: 'test', kind: 'file', file: 6 }
                ];
                const parsed = parser.parse(problemPattern);
                assert.strictEqual(null, parsed);
                assert.strictEqual(3 /* ValidationState.Error */, reporter.state);
                assert(reporter.hasMessage('The problem pattern is invalid. It must have at least have a file and a message.'));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvYmxlbU1hdGNoZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvdGVzdC9jb21tb24vcHJvYmxlbU1hdGNoZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFTQSxNQUFNLGVBQWU7UUFJcEI7WUFDQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSwwQkFBZ0IsRUFBRSxDQUFDO1lBQ2hELElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFTSxJQUFJLENBQUMsT0FBZTtZQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSywrQkFBdUIsQ0FBQztRQUNyRCxDQUFDO1FBRU0sSUFBSSxDQUFDLE9BQWU7WUFDMUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssa0NBQTBCLENBQUM7UUFDeEQsQ0FBQztRQUVNLEtBQUssQ0FBQyxPQUFlO1lBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLGdDQUF3QixDQUFDO1FBQ3RELENBQUM7UUFFTSxLQUFLLENBQUMsT0FBZTtZQUMzQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxnQ0FBd0IsQ0FBQztRQUN0RCxDQUFDO1FBRU0sVUFBVSxDQUFDLE9BQWU7WUFDaEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8s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