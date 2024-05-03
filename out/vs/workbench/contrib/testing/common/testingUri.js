/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/uri"], function (require, exports, assert_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTestUri = exports.parseTestUri = exports.TestUriType = exports.TEST_DATA_SCHEME = void 0;
    exports.TEST_DATA_SCHEME = 'vscode-test-data';
    var TestUriType;
    (function (TestUriType) {
        /** All console output for a task */
        TestUriType[TestUriType["TaskOutput"] = 0] = "TaskOutput";
        /** All console output for a test in a task */
        TestUriType[TestUriType["TestOutput"] = 1] = "TestOutput";
        /** Specific message in a test */
        TestUriType[TestUriType["ResultMessage"] = 2] = "ResultMessage";
        /** Specific actual output message in a test */
        TestUriType[TestUriType["ResultActualOutput"] = 3] = "ResultActualOutput";
        /** Specific expected output message in a test */
        TestUriType[TestUriType["ResultExpectedOutput"] = 4] = "ResultExpectedOutput";
    })(TestUriType || (exports.TestUriType = TestUriType = {}));
    var TestUriParts;
    (function (TestUriParts) {
        TestUriParts["Results"] = "results";
        TestUriParts["AllOutput"] = "output";
        TestUriParts["Messages"] = "message";
        TestUriParts["Text"] = "TestFailureMessage";
        TestUriParts["ActualOutput"] = "ActualOutput";
        TestUriParts["ExpectedOutput"] = "ExpectedOutput";
    })(TestUriParts || (TestUriParts = {}));
    const parseTestUri = (uri) => {
        const type = uri.authority;
        const [resultId, ...request] = uri.path.slice(1).split('/');
        if (request[0] === "message" /* TestUriParts.Messages */) {
            const taskIndex = Number(request[1]);
            const testExtId = uri.query;
            const index = Number(request[2]);
            const part = request[3];
            if (type === "results" /* TestUriParts.Results */) {
                switch (part) {
                    case "TestFailureMessage" /* TestUriParts.Text */:
                        return { resultId, taskIndex, testExtId, messageIndex: index, type: 2 /* TestUriType.ResultMessage */ };
                    case "ActualOutput" /* TestUriParts.ActualOutput */:
                        return { resultId, taskIndex, testExtId, messageIndex: index, type: 3 /* TestUriType.ResultActualOutput */ };
                    case "ExpectedOutput" /* TestUriParts.ExpectedOutput */:
                        return { resultId, taskIndex, testExtId, messageIndex: index, type: 4 /* TestUriType.ResultExpectedOutput */ };
                    case "message" /* TestUriParts.Messages */:
                }
            }
        }
        if (request[0] === "output" /* TestUriParts.AllOutput */) {
            const testExtId = uri.query;
            const taskIndex = Number(request[1]);
            return testExtId
                ? { resultId, taskIndex, testExtId, type: 1 /* TestUriType.TestOutput */ }
                : { resultId, taskIndex, type: 0 /* TestUriType.TaskOutput */ };
        }
        return undefined;
    };
    exports.parseTestUri = parseTestUri;
    const buildTestUri = (parsed) => {
        const uriParts = {
            scheme: exports.TEST_DATA_SCHEME,
            authority: "results" /* TestUriParts.Results */
        };
        if (parsed.type === 0 /* TestUriType.TaskOutput */) {
            return uri_1.URI.from({
                ...uriParts,
                path: ['', parsed.resultId, "output" /* TestUriParts.AllOutput */, parsed.taskIndex].join('/'),
            });
        }
        const msgRef = (resultId, ...remaining) => uri_1.URI.from({
            ...uriParts,
            query: parsed.testExtId,
            path: ['', resultId, "message" /* TestUriParts.Messages */, ...remaining].join('/'),
        });
        switch (parsed.type) {
            case 3 /* TestUriType.ResultActualOutput */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "ActualOutput" /* TestUriParts.ActualOutput */);
            case 4 /* TestUriType.ResultExpectedOutput */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "ExpectedOutput" /* TestUriParts.ExpectedOutput */);
            case 2 /* TestUriType.ResultMessage */:
                return msgRef(parsed.resultId, parsed.taskIndex, parsed.messageIndex, "TestFailureMessage" /* TestUriParts.Text */);
            case 1 /* TestUriType.TestOutput */:
                return uri_1.URI.from({
                    ...uriParts,
                    query: parsed.testExtId,
                    path: ['', parsed.resultId, "output" /* TestUriParts.AllOutput */, parsed.taskIndex].join('/'),
                });
            default:
                (0, assert_1.assertNever)(parsed, 'Invalid test uri');
        }
    };
    exports.buildTestUri = buildTestUri;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1VyaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdGluZ1VyaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLbkYsUUFBQSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQztJQUVuRCxJQUFrQixXQVdqQjtJQVhELFdBQWtCLFdBQVc7UUFDNUIsb0NBQW9DO1FBQ3BDLHlEQUFVLENBQUE7UUFDViw4Q0FBOEM7UUFDOUMseURBQVUsQ0FBQTtRQUNWLGlDQUFpQztRQUNqQywrREFBYSxDQUFBO1FBQ2IsK0NBQStDO1FBQy9DLHlFQUFrQixDQUFBO1FBQ2xCLGlEQUFpRDtRQUNqRCw2RUFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBWGlCLFdBQVcsMkJBQVgsV0FBVyxRQVc1QjtJQWtDRCxJQUFXLFlBUVY7SUFSRCxXQUFXLFlBQVk7UUFDdEIsbUNBQW1CLENBQUE7UUFFbkIsb0NBQW9CLENBQUE7UUFDcEIsb0NBQW9CLENBQUE7UUFDcEIsMkNBQTJCLENBQUE7UUFDM0IsNkNBQTZCLENBQUE7UUFDN0IsaURBQWlDLENBQUE7SUFDbEMsQ0FBQyxFQVJVLFlBQVksS0FBWixZQUFZLFFBUXRCO0lBRU0sTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFRLEVBQTZCLEVBQUU7UUFDbkUsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUMzQixNQUFNLENBQUMsUUFBUSxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTVELElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQywwQ0FBMEIsRUFBRSxDQUFDO1lBQzFDLE1B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