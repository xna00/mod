/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/editor/common/languages/supports/tokenization"], function (require, exports, assert, fs, tokenization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function parseTest(fileName) {
        const testContents = fs.readFileSync(fileName).toString();
        const lines = testContents.split(/\r\n|\n/);
        const magicToken = lines[0];
        let currentElement = {
            line: lines[1],
            assertions: []
        };
        const parsedTest = [];
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            if (line.substr(0, magicToken.length) === magicToken) {
                // this is an assertion line
                const m1 = line.substr(magicToken.length).match(/^( +)([\^]+) (\w+)\\?$/);
                if (m1) {
                    currentElement.assertions.push({
                        testLineNumber: i + 1,
                        startOffset: magicToken.length + m1[1].length,
                        length: m1[2].length,
                        expectedTokenType: (0, tokenization_1.toStandardTokenType)(m1[3])
                    });
                }
                else {
                    const m2 = line.substr(magicToken.length).match(/^( +)<(-+) (\w+)\\?$/);
                    if (m2) {
                        currentElement.assertions.push({
                            testLineNumber: i + 1,
                            startOffset: 0,
                            length: m2[2].length,
                            expectedTokenType: (0, tokenization_1.toStandardTokenType)(m2[3])
                        });
                    }
                    else {
                        throw new Error(`Invalid test line at line number ${i + 1}.`);
                    }
                }
            }
            else {
                // this is a line to be parsed
                parsedTest.push(currentElement);
                currentElement = {
                    line: line,
                    assertions: []
                };
            }
        }
        parsedTest.push(currentElement);
        const assertions = [];
        let offset = 0;
        for (let i = 0; i < parsedTest.length; i++) {
            const parsedTestLine = parsedTest[i];
            for (let j = 0; j < parsedTestLine.assertions.length; j++) {
                const assertion = parsedTestLine.assertions[j];
                assertions.push({
                    testLineNumber: assertion.testLineNumber,
                    startOffset: offset + assertion.startOffset,
                    length: assertion.length,
                    tokenType: assertion.expectedTokenType
                });
            }
            offset += parsedTestLine.line.length + 1;
        }
        const content = parsedTest.map(parsedTestLine => parsedTestLine.line).join('\n');
        return { content, assertions };
    }
    // @ts-expect-error
    function executeTest(fileName, parseFunc) {
        const { content, assertions } = parseTest(fileName);
        const actual = parseFunc(content);
        let actualIndex = 0;
        const actualCount = actual.length / 3;
        for (let i = 0; i < assertions.length; i++) {
            const assertion = assertions[i];
            while (actualIndex < actualCount && actual[3 * actualIndex] + actual[3 * actualIndex + 1] <= assertion.startOffset) {
                actualIndex++;
            }
            assert.ok(actual[3 * actualIndex] <= assertion.startOffset, `Line ${assertion.testLineNumber} : startOffset : ${actual[3 * actualIndex]} <= ${assertion.startOffset}`);
            assert.ok(actual[3 * actualIndex] + actual[3 * actualIndex + 1] >= assertion.startOffset + assertion.length, `Line ${assertion.testLineNumber} : length : ${actual[3 * actualIndex]} + ${actual[3 * actualIndex + 1]} >= ${assertion.startOffset} + ${assertion.length}.`);
            assert.strictEqual(actual[3 * actualIndex + 2], assertion.tokenType, `Line ${assertion.testLineNumber} : tokenType`);
        }
    }
    suite('Classification', () => {
        test('TypeScript', () => {
            // executeTest(getPathFromAmdModule(require, 'vs/editor/test/node/classification/typescript-test.ts').replace(/\bout\b/, 'src'), parse);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9ub2RlL2NsYXNzaWZpY2F0aW9uL3R5cGVzY3JpcHQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXlCaEcsU0FBUyxTQUFTLENBQUMsUUFBZ0I7UUFhbEMsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMxRCxNQUFNLEtBQUssR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1QixJQUFJLGNBQWMsR0FBd0I7WUFDekMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDZCxVQUFVLEVBQUUsRUFBRTtTQUNkLENBQUM7UUFFRixNQUFNLFVBQVUsR0FBMEIsRUFBRSxDQUFDO1FBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDdkMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUN0RCw0QkFBNEI7Z0JBQzVCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2dCQUMxRSxJQUFJLEVBQUUsRUFBRSxDQUFDO29CQUNSLGNBQWMs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