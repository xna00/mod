/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TEXT_BASED_MIMETYPES = void 0;
    exports.copyCellOutput = copyCellOutput;
    async function copyCellOutput(mimeType, outputViewModel, clipboardService, logService) {
        const cellOutput = outputViewModel.model;
        const output = mimeType && exports.TEXT_BASED_MIMETYPES.includes(mimeType) ?
            cellOutput.outputs.find(output => output.mime === mimeType) :
            cellOutput.outputs.find(output => exports.TEXT_BASED_MIMETYPES.includes(output.mime));
        mimeType = output?.mime;
        if (!mimeType || !output) {
            return;
        }
        const decoder = new TextDecoder();
        let text = decoder.decode(output.data.buffer);
        // append adjacent text streams since they are concatenated in the renderer
        if ((0, notebookCommon_1.isTextStreamMime)(mimeType)) {
            const cellViewModel = outputViewModel.cellViewModel;
            let index = cellViewModel.outputsViewModels.indexOf(outputViewModel) + 1;
            while (index < cellViewModel.model.outputs.length) {
                const nextCellOutput = cellViewModel.model.outputs[index];
                const nextOutput = nextCellOutput.outputs.find(output => (0, notebookCommon_1.isTextStreamMime)(output.mime));
                if (!nextOutput) {
                    break;
                }
                text = text + decoder.decode(nextOutput.data.buffer);
                index = index + 1;
            }
        }
        if (mimeType.endsWith('error')) {
            text = text.replace(/\\u001b\[[0-9;]*m/gi, '').replaceAll('\\n', '\n');
        }
        try {
            await clipboardService.writeText(text);
        }
        catch (e) {
            logService.error(`Failed to copy content: ${e}`);
        }
    }
    exports.TEXT_BASED_MIMETYPES = [
        'text/latex',
        'text/html',
        'application/vnd.code.notebook.error',
        'application/vnd.code.notebook.stdout',
        'application/x.notebook.stdout',
        'application/x.notebook.stream',
        'application/vnd.code.notebook.stderr',
        'application/x.notebook.stderr',
        'text/plain',
        'text/markdown',
        'application/json'
    ];
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE91dHB1dENsaXBib2FyZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL2NsaXBib2FyZC9jZWxsT3V0cHV0Q2xpcGJvYXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyx3Q0EwQ0M7SUExQ00sS0FBSyxVQUFVLGNBQWMsQ0FBQyxRQUE0QixFQUFFLGVBQXFDLEVBQUUsZ0JBQW1DLEVBQUUsVUFBdUI7UUFDckssTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxRQUFRLElBQUksNEJBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbkUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0QsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyw0QkFBb0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFL0UsUUFBUSxHQUFHLE1BQU0sRUFBRSxJQUFJLENBQUM7UUFFeEIsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzFCLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNsQyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFOUMsMkVBQTJFO1FBQzNFLElBQUksSUFBQSxpQ0FBZ0IsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQyxhQUErQixDQUFDO1lBQ3RFLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuRCxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLGlDQUFnQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN4RixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pCLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxJQUFJLEdBQUcsSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDckQsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFHRCxJQUFJLENBQUM7WUFDSixNQUFNLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4QyxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNaLFVBQVUsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEQsQ0FBQztJQUNGLENBQUM7SUFFWSxRQUFBLG9CQUFvQixHQUFHO1FBQ25DLFlBQVk7UUFDWixXQUFXO1FBQ1gscUNBQXFDO1FBQ3JDLHNDQUFzQztRQUN0QywrQkFBK0I7UUFDL0IsK0JBQStCO1FBQy9CLHNDQUFzQztRQUN0QywrQkFBK0I7UUFDL0IsWUFBWTtRQUNaLGVBQWU7UUFDZixrQkFBa0I7S0FDbEIsQ0FBQyJ9