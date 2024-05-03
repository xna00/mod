/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/editorFeatures", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/editor/contrib/dropOrPasteInto/browser/defaultProviders", "vs/nls"], function (require, exports, hierarchicalKind_1, editorExtensions_1, editorContextKeys_1, editorFeatures_1, copyPasteController_1, defaultProviders_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(copyPasteController_1.CopyPasteController.ID, copyPasteController_1.CopyPasteController, 0 /* EditorContributionInstantiation.Eager */); // eager because it listens to events on the container dom node of the editor
    (0, editorFeatures_1.registerEditorFeature)(defaultProviders_1.DefaultPasteProvidersFeature);
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: copyPasteController_1.changePasteTypeCommandId,
                precondition: copyPasteController_1.pasteWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            return copyPasteController_1.CopyPasteController.get(editor)?.changePasteType();
        }
    });
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.hidePasteWidget',
                precondition: copyPasteController_1.pasteWidgetVisibleCtx,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            copyPasteController_1.CopyPasteController.get(editor)?.clearWidgets();
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class PasteAsAction extends editorExtensions_1.EditorAction {
        static { this.argsSchema = {
            type: 'object',
            properties: {
                kind: {
                    type: 'string',
                    description: nls.localize('pasteAs.kind', "The kind of the paste edit to try applying. If not provided or there are multiple edits for this kind, the editor will show a picker."),
                }
            },
        }; }
        constructor() {
            super({
                id: 'editor.action.pasteAs',
                label: nls.localize('pasteAs', "Paste As..."),
                alias: 'Paste As...',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                metadata: {
                    description: 'Paste as',
                    args: [{
                            name: 'args',
                            schema: PasteAsAction.argsSchema
                        }]
                }
            });
        }
        run(_accessor, editor, args) {
            let kind = typeof args?.kind === 'string' ? args.kind : undefined;
            if (!kind && args) {
                // Support old id property
                // TODO: remove this in the future
                kind = typeof args.id === 'string' ? args.id : undefined;
            }
            return copyPasteController_1.CopyPasteController.get(editor)?.pasteAs(kind ? new hierarchicalKind_1.HierarchicalKind(kind) : undefined);
        }
    });
    (0, editorExtensions_1.registerEditorAction)(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.pasteAsText',
                label: nls.localize('pasteAsText', "Paste as Text"),
                alias: 'Paste as Text',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
            });
        }
        run(_accessor, editor) {
            return copyPasteController_1.CopyPasteController.get(editor)?.pasteAs({ providerId: defaultProviders_1.DefaultTextPasteOrDropEditProvider.id });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weVBhc3RlQ29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kcm9wT3JQYXN0ZUludG8vYnJvd3Nlci9jb3B5UGFzdGVDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsSUFBQSw2Q0FBMEIsRUFBQyx5Q0FBbUIsQ0FBQyxFQUFFLEVBQUUseUNBQW1CLGdEQUF3QyxDQUFDLENBQUMsNkVBQTZFO0lBQzdMLElBQUEsc0NBQXFCLEVBQUMsK0NBQTRCLENBQUMsQ0FBQztJQUVwRCxJQUFBLHdDQUFxQixFQUFDLElBQUksS0FBTSxTQUFRLGdDQUFhO1FBQ3BEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw4Q0FBd0I7Z0JBQzVCLFlBQVksRUFBRSwyQ0FBcUI7Z0JBQ25DLE1BQU0sRUFBRTtvQkFDUCxNQUFNLDBDQUFnQztvQkFDdEMsT0FBTyxFQUFFLG1EQUErQjtpQkFDeEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRWUsZ0JBQWdCLENBQUMsU0FBa0MsRUFBRSxNQUFtQjtZQUN2RixPQUFPLHlDQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUMzRCxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLEtBQU0sU0FBUSxnQ0FBYTtRQUNwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0JBQXdCO2dCQUM1QixZQUFZLEVBQUUsMkNBQXFCO2dCQUNuQyxNQUFNLEVBQUU7b0JBQ1AsTUFBTSwwQ0FBZ0M7b0JBQ3RDLE9BQU8sd0JBQWdCO2lCQUN2QjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFZSxnQkFBZ0IsQ0FBQyxTQUFr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