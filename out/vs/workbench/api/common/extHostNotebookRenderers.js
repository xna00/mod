/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostNotebookEditor"], function (require, exports, event_1, extHost_protocol_1, extHostNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookRenderers = void 0;
    class ExtHostNotebookRenderers {
        constructor(mainContext, _extHostNotebook) {
            this._extHostNotebook = _extHostNotebook;
            this._rendererMessageEmitters = new Map();
            this.proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadNotebookRenderers);
        }
        $postRendererMessage(editorId, rendererId, message) {
            const editor = this._extHostNotebook.getEditorById(editorId);
            this._rendererMessageEmitters.get(rendererId)?.fire({ editor: editor.apiEditor, message });
        }
        createRendererMessaging(manifest, rendererId) {
            if (!manifest.contributes?.notebookRenderer?.some(r => r.id === rendererId)) {
                throw new Error(`Extensions may only call createRendererMessaging() for renderers they contribute (got ${rendererId})`);
            }
            const messaging = {
                onDidReceiveMessage: (listener, thisArg, disposables) => {
                    return this.getOrCreateEmitterFor(rendererId).event(listener, thisArg, disposables);
                },
                postMessage: (message, editorOrAlias) => {
                    if (extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.has(message)) { // back compat for swapped args
                        [message, editorOrAlias] = [editorOrAlias, message];
                    }
                    const extHostEditor = editorOrAlias && extHostNotebookEditor_1.ExtHostNotebookEditor.apiEditorsToExtHost.get(editorOrAlias);
                    return this.proxy.$postMessage(extHostEditor?.id, rendererId, message);
                },
            };
            return messaging;
        }
        getOrCreateEmitterFor(rendererId) {
            let emitter = this._rendererMessageEmitters.get(rendererId);
            if (emitter) {
                return emitter;
            }
            emitter = new event_1.Emitter({
                onDidRemoveLastListener: () => {
                    emitter?.dispose();
                    this._rendererMessageEmitters.delete(rendererId);
                }
            });
            this._rendererMessageEmitters.set(rendererId, emitter);
            return emitter;
        }
    }
    exports.ExtHostNotebookRenderers = ExtHostNotebookRenderers;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rUmVuZGVyZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Tm90ZWJvb2tSZW5kZXJlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBVWhHLE1BQWEsd0JBQXdCO1FBSXBDLFlBQVksV0FBeUIsRUFBbUIsZ0JBQTJDO1lBQTNDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMkI7WUFIbEYsNkJBQXdCLEdBQUcsSUFBSSxHQUFHLEVBQXFGLENBQUM7WUFJeEksSUFBSSxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLDhCQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRU0sb0JBQW9CLENBQUMsUUFBZ0IsRUFBRSxVQUFrQixFQUFFLE9BQWdCO1lBQ2pGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFTSx1QkFBdUIsQ0FBQyxRQUErQixFQUFFLFVBQWtCO1lBQ2pGLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssVUFBVSxDQUFDLEVBQUUsQ0FBQztnQkFDN0UsTUFBTSxJQUFJLEtBQUssQ0FBQyx5RkFBeUYsVUFBVSxHQUFHLENBQUMsQ0FBQztZQUN6SCxDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQXFDO2dCQUNuRCxtQkFBbUIsRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUU7b0JBQ3ZELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO2dCQUNELFdBQVcsRUFBRSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsRUFBRTtvQkFDdkMsSUFBSSw2Q0FBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLCtCQUErQjt3QkFDNUYsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3JELENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsYUFBYSxJQUFJLDZDQUFxQixDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDcEcsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDeEUsQ0FBQzthQUNELENBQUM7WUFFRixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8scUJBQXFCLENBQUMsVUFBa0I7WUFDL0MsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM1RCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sT0FBTyxDQUFDO1lBQ2hCLENBQUM7WUFFRCxPQUFPLEdBQUcsSUFBSSxlQUFPLENBQUM7Z0JBQ3JCLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtvQkFDN0IsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFdkQsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztLQUNEO0lBcERELDREQW9EQyJ9