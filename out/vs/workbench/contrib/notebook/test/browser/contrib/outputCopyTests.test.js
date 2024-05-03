/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/mock", "assert", "vs/base/common/buffer", "vs/workbench/contrib/notebook/browser/contrib/clipboard/cellOutputClipboard", "vs/base/test/common/utils"], function (require, exports, mock_1, assert, buffer_1, cellOutputClipboard_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Cell Output Clipboard Tests', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class ClipboardService {
            constructor() {
                this._clipboardContent = '';
            }
            get clipboardContent() {
                return this._clipboardContent;
            }
            async writeText(value) {
                this._clipboardContent = value;
            }
        }
        const logService = new class extends (0, mock_1.mock)() {
        };
        function createOutputViewModel(outputs, cellViewModel) {
            const outputViewModel = { model: { outputs: outputs } };
            if (cellViewModel) {
                cellViewModel.outputsViewModels.push(outputViewModel);
                cellViewModel.model.outputs.push(outputViewModel.model);
            }
            else {
                cellViewModel = {
                    outputsViewModels: [outputViewModel],
                    model: { outputs: [outputViewModel.model] }
                };
            }
            outputViewModel.cellViewModel = cellViewModel;
            return outputViewModel;
        }
        test('Copy text/plain output', async () => {
            const mimeType = 'text/plain';
            const clipboard = new ClipboardService();
            const outputDto = { data: buffer_1.VSBuffer.fromString('output content'), mime: 'text/plain' };
            const output = createOutputViewModel([outputDto]);
            await (0, cellOutputClipboard_1.copyCellOutput)(mimeType, output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'output content');
        });
        test('Nothing copied for invalid mimetype', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('output content'), mime: 'bad' },
                { data: buffer_1.VSBuffer.fromString('output 2'), mime: 'unknown' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('bad', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, '');
        });
        test('Text copied if available instead of invalid mime type', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('output content'), mime: 'bad' },
                { data: buffer_1.VSBuffer.fromString('text content'), mime: 'text/plain' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('bad', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'text content');
        });
        test('Selected mimetype is preferred', async () => {
            const clipboard = new ClipboardService();
            const outputDtos = [
                { data: buffer_1.VSBuffer.fromString('plain text'), mime: 'text/plain' },
                { data: buffer_1.VSBuffer.fromString('html content'), mime: 'text/html' }
            ];
            const output = createOutputViewModel(outputDtos);
            await (0, cellOutputClipboard_1.copyCellOutput)('text/html', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'html content');
        });
        test('copy subsequent output', async () => {
            const clipboard = new ClipboardService();
            const output = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('first'), mime: 'text/plain' }]);
            const output2 = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('second'), mime: 'text/plain' }], output.cellViewModel);
            const output3 = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('third'), mime: 'text/plain' }], output.cellViewModel);
            await (0, cellOutputClipboard_1.copyCellOutput)('text/plain', output2, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'second');
            await (0, cellOutputClipboard_1.copyCellOutput)('text/plain', output3, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'third');
        });
        test('adjacent stream outputs are concanented', async () => {
            const clipboard = new ClipboardService();
            const output = createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('stdout'), mime: 'application/vnd.code.notebook.stdout' }]);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('stderr'), mime: 'application/vnd.code.notebook.stderr' }], output.cellViewModel);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('text content'), mime: 'text/plain' }], output.cellViewModel);
            createOutputViewModel([{ data: buffer_1.VSBuffer.fromString('non-adjacent'), mime: 'application/vnd.code.notebook.stdout' }], output.cellViewModel);
            await (0, cellOutputClipboard_1.copyCellOutput)('application/vnd.code.notebook.stdout', output, clipboard, logService);
            assert.strictEqual(clipboard.clipboardContent, 'stdoutstderr');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0Q29weVRlc3RzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9jb250cmliL291dHB1dENvcHlUZXN0cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7UUFDekMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sZ0JBQWdCO1lBQXRCO2dCQUNTLHNCQUFpQixHQUFHLEVBQUUsQ0FBQztZQU9oQyxDQUFDO1lBTkEsSUFBVyxnQkFBZ0I7Z0JBQzFCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO1lBQy9CLENBQUM7WUFDTSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQWE7Z0JBQ25DLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFDaEMsQ0FBQztTQUNEO1FBRUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQWU7U0FBSSxDQUFDO1FBRTdELFNBQVMscUJBQXFCLENBQUMsT0FBeUIsRUFBRSxhQUE4QjtZQUN2RixNQUFNLGVBQWUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBMEIsQ0FBQztZQUVoRixJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQixhQUFhLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUN0RCxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxhQUFhLEdBQUc7b0JBQ2YsaUJBQWlCLEVB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