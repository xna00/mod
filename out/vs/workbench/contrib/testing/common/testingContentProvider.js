/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/nls", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, buffer_1, lifecycle_1, strings_1, language_1, model_1, resolverService_1, nls_1, testResultService_1, testingUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContentProvider = void 0;
    /**
     * A content provider that returns various outputs for tests. This is used
     * in the inline peek view.
     */
    let TestingContentProvider = class TestingContentProvider {
        constructor(textModelResolverService, languageService, modelService, resultService) {
            this.languageService = languageService;
            this.modelService = modelService;
            this.resultService = resultService;
            textModelResolverService.registerTextModelContentProvider(testingUri_1.TEST_DATA_SCHEME, this);
        }
        /**
         * @inheritdoc
         */
        async provideTextContent(resource) {
            const existing = this.modelService.getModel(resource);
            if (existing && !existing.isDisposed()) {
                return existing;
            }
            const parsed = (0, testingUri_1.parseTestUri)(resource);
            if (!parsed) {
                return null;
            }
            const result = this.resultService.getResult(parsed.resultId);
            if (!result) {
                return null;
            }
            if (parsed.type === 0 /* TestUriType.TaskOutput */) {
                const task = result.tasks[parsed.taskIndex];
                const model = this.modelService.createModel('', null, resource, false);
                const append = (text) => model.applyEdits([{
                        range: { startColumn: 1, endColumn: 1, startLineNumber: Infinity, endLineNumber: Infinity },
                        text,
                    }]);
                const init = buffer_1.VSBuffer.concat(task.output.buffers, task.output.length).toString();
                append((0, strings_1.removeAnsiEscapeCodes)(init));
                let hadContent = init.length > 0;
                const dispose = new lifecycle_1.DisposableStore();
                dispose.add(task.output.onDidWriteData(d => {
                    hadContent ||= d.byteLength > 0;
                    append((0, strings_1.removeAnsiEscapeCodes)(d.toString()));
                }));
                task.output.endPromise.then(() => {
                    if (dispose.isDisposed) {
                        return;
                    }
                    if (!hadContent) {
                        append((0, nls_1.localize)('runNoOutout', 'The test run did not record any output.'));
                        dispose.dispose();
                    }
                });
                model.onWillDispose(() => dispose.dispose());
                return model;
            }
            const test = result?.getStateById(parsed.testExtId);
            if (!test) {
                return null;
            }
            let text;
            let language = null;
            switch (parsed.type) {
                case 3 /* TestUriType.ResultActualOutput */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (message?.type === 0 /* TestMessageType.Error */) {
                        text = message.actual;
                    }
                    break;
                }
                case 1 /* TestUriType.TestOutput */: {
                    text = '';
                    const output = result.tasks[parsed.taskIndex].output;
                    for (const message of test.tasks[parsed.taskIndex].messages) {
                        if (message.type === 1 /* TestMessageType.Output */) {
                            text += (0, strings_1.removeAnsiEscapeCodes)(output.getRange(message.offset, message.length).toString());
                        }
                    }
                    break;
                }
                case 4 /* TestUriType.ResultExpectedOutput */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (message?.type === 0 /* TestMessageType.Error */) {
                        text = message.expected;
                    }
                    break;
                }
                case 2 /* TestUriType.ResultMessage */: {
                    const message = test.tasks[parsed.taskIndex].messages[parsed.messageIndex];
                    if (!message) {
                        break;
                    }
                    if (message.type === 1 /* TestMessageType.Output */) {
                        const content = result.tasks[parsed.taskIndex].output.getRange(message.offset, message.length);
                        text = (0, strings_1.removeAnsiEscapeCodes)(content.toString());
                    }
                    else if (typeof message.message === 'string') {
                        text = (0, strings_1.removeAnsiEscapeCodes)(message.message);
                    }
                    else {
                        text = message.message.value;
                        language = this.languageService.createById('markdown');
                    }
                }
            }
            if (text === undefined) {
                return null;
            }
            return this.modelService.createModel(text, language, resource, false);
        }
    };
    exports.TestingContentProvider = TestingContentProvider;
    exports.TestingContentProvider = TestingContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, testResultService_1.ITestResultService)
    ], TestingContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ0NvbnRlbnRQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vdGVzdGluZ0NvbnRlbnRQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQmhHOzs7T0FHRztJQUNJLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXNCO1FBQ2xDLFlBQ29CLHdCQUEyQyxFQUMzQixlQUFpQyxFQUNwQyxZQUEyQixFQUN0QixhQUFpQztZQUZuQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDcEMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDdEIsa0JBQWEsR0FBYixhQUFhLENBQW9CO1lBRXRFLHdCQUF3QixDQUFDLGdDQUFnQyxDQUFDLDZCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFFRDs7V0FFRztRQUNJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFhO1lBQzVDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELElBQUksUUFBUSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLE9BQU8sUUFBUSxDQUFDO1lBQ2pCLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFBLHlCQUFZLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3RCxJQUFJLENB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