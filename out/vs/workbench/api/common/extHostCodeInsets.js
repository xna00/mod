/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/webview/common/webview"], function (require, exports, event_1, lifecycle_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditorInsets = void 0;
    class ExtHostEditorInsets {
        constructor(_proxy, _editors, _remoteInfo) {
            this._proxy = _proxy;
            this._editors = _editors;
            this._remoteInfo = _remoteInfo;
            this._handlePool = 0;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            // dispose editor inset whenever the hosting editor goes away
            this._disposables.add(_editors.onDidChangeVisibleTextEditors(() => {
                const visibleEditor = _editors.getVisibleTextEditors();
                for (const value of this._insets.values()) {
                    if (visibleEditor.indexOf(value.editor) < 0) {
                        value.inset.dispose(); // will remove from `this._insets`
                    }
                }
            }));
        }
        dispose() {
            this._insets.forEach(value => value.inset.dispose());
            this._disposables.dispose();
        }
        createWebviewEditorInset(editor, line, height, options, extension) {
            let apiEditor;
            for (const candidate of this._editors.getVisibleTextEditors(true)) {
                if (candidate.value === editor) {
                    apiEditor = candidate;
                    break;
                }
            }
            if (!apiEditor) {
                throw new Error('not a visible editor');
            }
            const that = this;
            const handle = this._handlePool++;
            const onDidReceiveMessage = new event_1.Emitter();
            const onDidDispose = new event_1.Emitter();
            const webview = new class {
                constructor() {
                    this._html = '';
                    this._options = Object.create(null);
                }
                asWebviewUri(resource) {
                    return (0, webview_1.asWebviewUri)(resource, that._remoteInfo);
                }
                get cspSource() {
                    return webview_1.webviewGenericCspSource;
                }
                set options(value) {
                    this._options = value;
                    that._proxy.$setOptions(handle, value);
                }
                get options() {
                    return this._options;
                }
                set html(value) {
                    this._html = value;
                    that._proxy.$setHtml(handle, value);
                }
                get html() {
                    return this._html;
                }
                get onDidReceiveMessage() {
                    return onDidReceiveMessage.event;
                }
                postMessage(message) {
                    return that._proxy.$postMessage(handle, message);
                }
            };
            const inset = new class {
                constructor() {
                    this.editor = editor;
                    this.line = line;
                    this.height = height;
                    this.webview = webview;
                    this.onDidDispose = onDidDispose.event;
                }
                dispose() {
                    if (that._insets.has(handle)) {
                        that._insets.delete(handle);
                        that._proxy.$disposeEditorInset(handle);
                        onDidDispose.fire();
                        // final cleanup
                        onDidDispose.dispose();
                        onDidReceiveMessage.dispose();
                    }
                }
            };
            this._proxy.$createEditorInset(handle, apiEditor.id, apiEditor.value.document.uri, line + 1, height, options || {}, extension.identifier, extension.extensionLocation);
            this._insets.set(handle, { editor, inset, onDidReceiveMessage });
            return inset;
        }
        $onDidDispose(handle) {
            const value = this._insets.get(handle);
            if (value) {
                value.inset.dispose();
            }
        }
        $onDidReceiveMessage(handle, message) {
            const value = this._insets.get(handle);
            value?.onDidReceiveMessage.fire(message);
        }
    }
    exports.ExtHostEditorInsets = ExtHostEditorInsets;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvZGVJbnNldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDb2RlSW5zZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVdoRyxNQUFhLG1CQUFtQjtRQU0vQixZQUNrQixNQUFtQyxFQUNuQyxRQUF3QixFQUN4QixXQUE4QjtZQUY5QixXQUFNLEdBQU4sTUFBTSxDQUE2QjtZQUNuQyxhQUFRLEdBQVIsUUFBUSxDQUFnQjtZQUN4QixnQkFBVyxHQUFYLFdBQVcsQ0FBbUI7WUFQeEMsZ0JBQVcsR0FBRyxDQUFDLENBQUM7WUFDUCxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlDLFlBQU8sR0FBRyxJQUFJLEdBQUcsRUFBOEcsQ0FBQztZQVF2SSw2REFBNkQ7WUFDN0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRTtnQkFDakUsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3ZELEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUMzQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM3QyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsa0NBQWtDO29CQUMxRCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxD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