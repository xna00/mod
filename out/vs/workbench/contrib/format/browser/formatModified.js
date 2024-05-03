/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/model", "vs/editor/common/services/editorWorker", "vs/editor/common/services/resolverService", "vs/editor/contrib/format/browser/format", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/scm/browser/dirtydiffDecorator", "vs/workbench/contrib/scm/common/quickDiff"], function (require, exports, arrays_1, cancellation_1, editorExtensions_1, range_1, editorContextKeys_1, model_1, editorWorker_1, resolverService_1, format_1, nls, contextkey_1, instantiation_1, progress_1, dirtydiffDecorator_1, quickDiff_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getModifiedRanges = getModifiedRanges;
    (0, editorExtensions_1.registerEditorAction)(class FormatModifiedAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatChanges',
                label: nls.localize('formatChanges', "Format Modified Lines"),
                alias: 'Format Modified Lines',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentSelectionFormattingProvider),
            });
        }
        async run(accessor, editor) {
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            if (!editor.hasModel()) {
                return;
            }
            const ranges = await instaService.invokeFunction(getModifiedRanges, editor.getModel());
            if ((0, arrays_1.isNonEmptyArray)(ranges)) {
                return instaService.invokeFunction(format_1.formatDocumentRangesWithSelectedProvider, editor, ranges, 1 /* FormattingMode.Explicit */, progress_1.Progress.None, cancellation_1.CancellationToken.None, true);
            }
        }
    });
    async function getModifiedRanges(accessor, modified) {
        const quickDiffService = accessor.get(quickDiff_1.IQuickDiffService);
        const workerService = accessor.get(editorWorker_1.IEditorWorkerService);
        const modelService = accessor.get(resolverService_1.ITextModelService);
        const original = await (0, dirtydiffDecorator_1.getOriginalResource)(quickDiffService, modified.uri, modified.getLanguageId(), (0, model_1.shouldSynchronizeModel)(modified));
        if (!original) {
            return null; // let undefined signify no changes, null represents no source control (there's probably a better way, but I can't think of one rn)
        }
        const ranges = [];
        const ref = await modelService.createModelReference(original);
        try {
            if (!workerService.canComputeDirtyDiff(original, modified.uri)) {
                return undefined;
            }
            const changes = await workerService.computeDirtyDiff(original, modified.uri, false);
            if (!(0, arrays_1.isNonEmptyArray)(changes)) {
                return undefined;
            }
            for (const change of changes) {
                ranges.push(modified.validateRange(new range_1.Range(change.modifiedStartLineNumber, 1, change.modifiedEndLineNumber || change.modifiedStartLineNumber /*endLineNumber is 0 when things got deleted*/, Number.MAX_SAFE_INTEGER)));
            }
        }
        finally {
            ref.dispose();
        }
        return ranges;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0TW9kaWZpZWQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2Zvcm1hdC9icm93c2VyL2Zvcm1hdE1vZGlmaWVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBaURoRyw4Q0ErQkM7SUE3REQsSUFBQSx1Q0FBb0IsRUFBQyxNQUFNLG9CQUFxQixTQUFRLCtCQUFZO1FBRW5FO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw2QkFBNkI7Z0JBQ2pDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQztnQkFDN0QsS0FBSyxFQUFFLHVCQUF1QjtnQkFDOUIsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHFDQUFpQixDQUFDLFFBQVEsRUFBRSxxQ0FBaUIsQ0FBQyxzQ0FBc0MsQ0FBQzthQUN0SCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3hELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUV6RCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsY0FBYyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksSUFBQSx3QkFBZSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sWUFBWSxDQUFDLGNBQWMsQ0FDakMsaURBQXdDLEVBQUUsTUFBTSxFQUFFLE1BQU0sbUNBQy9CLG1CQUFRLENBQUMsSUFBSSxFQUFFLGdDQUFpQixDQUFDLElBQUksRUFDOUQsSUFBSSxDQUNKLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdJLEtBQUssVUFBVSxpQkFBaUIsQ0FBQyxRQUEwQixFQUFFLFFBQW9CO1FBQ3ZGLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2QkFBaUIsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQztRQUN6RCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG1DQUFpQixDQUFDLENBQUM7UUFFckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFBLHdDQUFtQixFQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUEsOEJBQXNCLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUN2SSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixPQUFPLElBQUksQ0FBQyxDQUFDLG1JQUFtSTtRQUNqSixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQVksRUFBRSxDQUFDO1FBQzNCLE1BQU0sR0FBRyxHQUFHLE1BQU0sWUFBWSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQztZQUNKLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNoRSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxhQUFhLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEYsSUFBSSxDQUFDLElBQUEsd0JBQWUsRUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksYUFBSyxDQUMzQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxFQUNqQyxNQUFNLENBQUMscUJBQXFCLElBQUksTUFBTSxDQUFDLHVCQUF1QixDQUFDLDhDQUE4QyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUN2SSxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztnQkFBUyxDQUFDO1lBQ1YsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQyJ9