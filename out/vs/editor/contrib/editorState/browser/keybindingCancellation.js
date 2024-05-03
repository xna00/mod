/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/nls"], function (require, exports, editorExtensions_1, contextkey_1, cancellation_1, linkedList_1, instantiation_1, extensions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorKeybindingCancellationTokenSource = void 0;
    const IEditorCancellationTokens = (0, instantiation_1.createDecorator)('IEditorCancelService');
    const ctxCancellableOperation = new contextkey_1.RawContextKey('cancellableOperation', false, (0, nls_1.localize)('cancellableOperation', 'Whether the editor runs a cancellable operation, e.g. like \'Peek References\''));
    (0, extensions_1.registerSingleton)(IEditorCancellationTokens, class {
        constructor() {
            this._tokens = new WeakMap();
        }
        add(editor, cts) {
            let data = this._tokens.get(editor);
            if (!data) {
                data = editor.invokeWithinContext(accessor => {
                    const key = ctxCancellableOperation.bindTo(accessor.get(contextkey_1.IContextKeyService));
                    const tokens = new linkedList_1.LinkedList();
                    return { key, tokens };
                });
                this._tokens.set(editor, data);
            }
            let removeFn;
            data.key.set(true);
            removeFn = data.tokens.push(cts);
            return () => {
                // remove w/o cancellation
                if (removeFn) {
                    removeFn();
                    data.key.set(!data.tokens.isEmpty());
                    removeFn = undefined;
                }
            };
        }
        cancel(editor) {
            const data = this._tokens.get(editor);
            if (!data) {
                return;
            }
            // remove with cancellation
            const cts = data.tokens.pop();
            if (cts) {
                cts.cancel();
                data.key.set(!data.tokens.isEmpty());
            }
        }
    }, 1 /* InstantiationType.Delayed */);
    class EditorKeybindingCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        constructor(editor, parent) {
            super(parent);
            this.editor = editor;
            this._unregister = editor.invokeWithinContext(accessor => accessor.get(IEditorCancellationTokens).add(editor, this));
        }
        dispose() {
            this._unregister();
            super.dispose();
        }
    }
    exports.EditorKeybindingCancellationTokenSource = EditorKeybindingCancellationTokenSource;
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.cancelOperation',
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                precondition: ctxCancellableOperation
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IEditorCancellationTokens).cancel(editor);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ0NhbmNlbGxhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZWRpdG9yU3RhdGUvYnJvd3Nlci9rZXliaW5kaW5nQ2FuY2VsbGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFNLHlCQUF5QixHQUFHLElBQUEsK0JBQWUsRUFBNEIsc0JBQXNCLENBQUMsQ0FBQztJQVFyRyxNQUFNLHVCQUF1QixHQUFHLElBQUksMEJBQWEsQ0FBQyxzQkFBc0IsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsZ0ZBQWdGLENBQUMsQ0FBQyxDQUFDO0lBRXJNLElBQUEsOEJBQWlCLEVBQUMseUJBQXlCLEVBQUU7UUFBQTtZQUkzQixZQUFPLEdBQUcsSUFBSSxPQUFPLEVBQTJGLENBQUM7UUF5Q25JLENBQUM7UUF2Q0EsR0FBRyxDQUFDLE1BQW1CLEVBQUUsR0FBNEI7WUFDcEQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLElBQUksR0FBRyxNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLEVBQUU7b0JBQzVDLE1BQU0sR0FBRyxHQUFHLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDN0UsTUFBTSxNQUFNLEdBQUcsSUFBSSx1QkFBVSxFQUEyQixDQUFDO29CQUN6RCxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixDQUFDLENBQUMsQ0FBQztnQkFDSCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDaEMsQ0FBQztZQUVELElBQUksUUFBOEIsQ0FBQztZQUVuQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQixRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFakMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1gsMEJBQTBCO2dCQUMxQixJQUFJLFFBQVEsRUFBRSxDQUFDO29CQUNkLFFBQVEsRUFBRSxDQUFDO29CQUNYLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO29CQUNyQyxRQUFRLEdBQUcsU0FBUyxDQUFDO2dCQUN0QixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFtQjtZQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTztZQUNSLENBQUM7WUFDRCwyQkFBMkI7WUFDM0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM5QixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztLQUVELG9DQUE0QixDQUFDO0lBRTlCLE1BQWEsdUNBQXdDLFNBQVEsc0NBQXVCO1FBSW5GLFlBQXFCLE1BQW1CLEVBQUUsTUFBMEI7WUFDbkUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRE0sV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUV2QyxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDdEgsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQWJELDBGQWFDO0lBRUQsSUFBQSx3Q0FBcUIsRUFBQyxJQUFJLEtBQU0sU0FBUSxnQ0FBYTtRQUVwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0JBQXdCO2dCQUM1QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSwwQ0FBZ0M7b0JBQ3RDLE9BQU8sd0JBQWdCO2lCQUN2QjtnQkFDRCxZQUFZLEVBQUUsdUJBQXVCO2FBQ3JDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQy9ELFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNELENBQUMsQ0FBQyJ9