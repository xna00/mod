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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, dom_1, lifecycle_1, resources_1, uri_1, codeEditorService_1, mainThreadWebviews_1, extHost_protocol_1, webview_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadEditorInsets = void 0;
    // todo@jrieken move these things back into something like contrib/insets
    class EditorWebviewZone {
        // suppressMouseDown?: boolean | undefined;
        // heightInPx?: number | undefined;
        // minWidthInPx?: number | undefined;
        // marginDomNode?: HTMLElement | null | undefined;
        // onDomNodeTop?: ((top: number) => void) | undefined;
        // onComputedHeight?: ((height: number) => void) | undefined;
        constructor(editor, line, height, webview) {
            this.editor = editor;
            this.line = line;
            this.height = height;
            this.webview = webview;
            this.domNode = document.createElement('div');
            this.domNode.style.zIndex = '10'; // without this, the webview is not interactive
            this.afterLineNumber = line;
            this.afterColumn = 1;
            this.heightInLines = height;
            editor.changeViewZones(accessor => this._id = accessor.addZone(this));
            webview.mountTo(this.domNode, (0, dom_1.getWindow)(editor.getDomNode()));
        }
        dispose() {
            this.editor.changeViewZones(accessor => this._id && accessor.removeZone(this._id));
        }
    }
    let MainThreadEditorInsets = class MainThreadEditorInsets {
        constructor(context, _editorService, _webviewService) {
            this._editorService = _editorService;
            this._webviewService = _webviewService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._insets = new Map();
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostEditorInsets);
        }
        dispose() {
            this._disposables.dispose();
        }
        async $createEditorInset(handle, id, uri, line, height, options, extensionId, extensionLocation) {
            let editor;
            id = id.substr(0, id.indexOf(',')); //todo@jrieken HACK
            for (const candidate of this._editorService.listCodeEditors()) {
                if (candidate.getId() === id && candidate.hasModel() && (0, resources_1.isEqual)(candidate.getModel().uri, uri_1.URI.revive(uri))) {
                    editor = candidate;
                    break;
                }
            }
            if (!editor) {
                setTimeout(() => this._proxy.$onDidDispose(handle));
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const webview = this._webviewService.createWebviewElement({
                title: undefined,
                options: {
                    enableFindWidget: false,
                },
                contentOptions: (0, mainThreadWebviews_1.reviveWebviewContentOptions)(options),
                extension: { id: extensionId, location: uri_1.URI.revive(extensionLocation) }
            });
            const webviewZone = new EditorWebviewZone(editor, line, height, webview);
            const remove = () => {
                disposables.dispose();
                this._proxy.$onDidDispose(handle);
                this._insets.delete(handle);
            };
            disposables.add(editor.onDidChangeModel(remove));
            disposables.add(editor.onDidDispose(remove));
            disposables.add(webviewZone);
            disposables.add(webview);
            disposables.add(webview.onMessage(msg => this._proxy.$onDidReceiveMessage(handle, msg.message)));
            this._insets.set(handle, webviewZone);
        }
        $disposeEditorInset(handle) {
            const inset = this.getInset(handle);
            this._insets.delete(handle);
            inset.dispose();
        }
        $setHtml(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.setHtml(value);
        }
        $setOptions(handle, options) {
            const inset = this.getInset(handle);
            inset.webview.contentOptions = (0, mainThreadWebviews_1.reviveWebviewContentOptions)(options);
        }
        async $postMessage(handle, value) {
            const inset = this.getInset(handle);
            inset.webview.postMessage(value);
            return true;
        }
        getInset(handle) {
            const inset = this._insets.get(handle);
            if (!inset) {
                throw new Error('Unknown inset');
            }
            return inset;
        }
    };
    exports.MainThreadEditorInsets = MainThreadEditorInsets;
    exports.MainThreadEditorInsets = MainThreadEditorInsets = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadEditorInsets),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, webview_1.IWebviewService)
    ], MainThreadEditorInsets);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvZGVJbnNldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ29kZUluc2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjaEcseUVBQXlFO0lBQ3pFLE1BQU0saUJBQWlCO1FBUXRCLDJDQUEyQztRQUMzQyxtQ0FBbUM7UUFDbkMscUNBQXFDO1FBQ3JDLGtEQUFrRDtRQUNsRCxzREFBc0Q7UUFDdEQsNkRBQTZEO1FBRTdELFlBQ1UsTUFBeUIsRUFDekIsSUFBWSxFQUNaLE1BQWMsRUFDZCxPQUF3QjtZQUh4QixXQUFNLEdBQU4sTUFBTSxDQUFtQjtZQUN6QixTQUFJLEdBQUosSUFBSSxDQUFRO1lBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBRWpDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsK0NBQStDO1lBQ2pGLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO1lBRTVCLE1BQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBQSxlQUFTLEVBQUMsTUFB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