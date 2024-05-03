/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/log/common/log", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, log_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentsAndEditors', () => {
        let editors;
        setup(function () {
            editors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(new testRPCProtocol_1.TestRPCProtocol(), new log_1.NullLogService());
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('The value of TextDocument.isClosed is incorrect when a text document is closed, #27949', () => {
            editors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        EOL: '\n',
                        isDirty: true,
                        languageId: 'fooLang',
                        uri: uri_1.URI.parse('foo:bar'),
                        versionId: 1,
                        lines: [
                            'first',
                            'second'
                        ]
                    }]
            });
            return new Promise((resolve, reject) => {
                const d = editors.onDidRemoveDocuments(e => {
                    try {
                        for (const data of e) {
                            assert.strictEqual(data.document.isClosed, true);
                        }
                        resolve(undefined);
                    }
                    catch (e) {
                        reject(e);
                    }
                    finally {
                        d.dispose();
                    }
                });
                editors.$acceptDocumentsAndEditorsDelta({
                    removedDocuments: [uri_1.URI.parse('foo:bar')]
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50c0FuZEVkaXRvcnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdERvY3VtZW50c0FuZEVkaXRvcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1FBRXhDLElBQUksT0FBbUMsQ0FBQztRQUV4QyxLQUFLLENBQUM7WUFDTCxPQUFPLEdBQUcsSUFBSSx1REFBMEIsQ0FBQyxJQUFJLGlDQUFlLEVBQUUsRUFBRSxJQUFJLG9CQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZGLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx3RkFBd0YsRUFBRSxHQUFHLEVBQUU7WUFFbkcsT0FBTyxDQUFDLCtCQUErQixDQUFDO2dCQUN2QyxjQUFjLEVBQUUsQ0FBQzt3QkFDaEIsR0FBRyxFQUFFLElBQUk7d0JBQ1QsT0FBTyxFQUFFLElBQUk7d0JBQ2IsVUFBVSxFQUFFLFNBQVM7d0JBQ3JCLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQzt3QkFDekIsU0FBUyxFQUFFLENBQUM7d0JBQ1osS0FBSyxFQUFFOzRCQUNOLE9BQU87NEJBQ1AsUUFBUTt5QkFDUjtxQkFDRCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFFdEMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUMxQyxJQUFJLENBQUM7d0JBRUosS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDbEQsQ0FBQzt3QkFDRCxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3BCLENBQUM7b0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDWixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ1gsQ0FBQzs0QkFBUyxDQUFDO3dCQUNWLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztvQkFDdkMsZ0JBQWdCLEVBQUUsQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QyxDQUFDLENBQUM7WUFFSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==