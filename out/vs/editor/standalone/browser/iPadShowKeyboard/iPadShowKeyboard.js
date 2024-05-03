/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/base/common/platform", "vs/css!./iPadShowKeyboard"], function (require, exports, dom, lifecycle_1, editorExtensions_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IPadShowKeyboard = void 0;
    class IPadShowKeyboard extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.iPadShowKeyboard'; }
        constructor(editor) {
            super();
            this.editor = editor;
            this.widget = null;
            if (platform_1.isIOS) {
                this._register(editor.onDidChangeConfiguration(() => this.update()));
                this.update();
            }
        }
        update() {
            const shouldHaveWidget = (!this.editor.getOption(91 /* EditorOption.readOnly */));
            if (!this.widget && shouldHaveWidget) {
                this.widget = new ShowKeyboardWidget(this.editor);
            }
            else if (this.widget && !shouldHaveWidget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
        dispose() {
            super.dispose();
            if (this.widget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
    }
    exports.IPadShowKeyboard = IPadShowKeyboard;
    class ShowKeyboardWidget extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.ShowKeyboardWidget'; }
        constructor(editor) {
            super();
            this.editor = editor;
            this._domNode = document.createElement('textarea');
            this._domNode.className = 'iPadShowKeyboard';
            this._register(dom.addDisposableListener(this._domNode, 'touchstart', (e) => {
                this.editor.focus();
            }));
            this._register(dom.addDisposableListener(this._domNode, 'focus', (e) => {
                this.editor.focus();
            }));
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
        // ----- IOverlayWidget API
        getId() {
            return ShowKeyboardWidget.ID;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 1 /* OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER */
            };
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(IPadShowKeyboard.ID, IPadShowKeyboard, 3 /* EditorContributionInstantiation.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaVBhZFNob3dLZXlib2FyZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3N0YW5kYWxvbmUvYnJvd3Nlci9pUGFkU2hvd0tleWJvYXJkL2lQYWRTaG93S2V5Ym9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7aUJBRXhCLE9BQUUsR0FBRyxpQ0FBaUMsQ0FBQztRQUs5RCxZQUFZLE1BQW1CO1lBQzlCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBSSxnQkFBSyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2YsQ0FBQztRQUNGLENBQUM7UUFFTyxNQUFNO1lBQ2IsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLGdDQUF1QixDQUFDLENBQUM7WUFFekUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFFdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVuRCxDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBRTdDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBRXBCLENBQUM7UUFDRixDQUFDO1FBRWUsT0FBTztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLENBQUM7UUFDRixDQUFDOztJQXRDRiw0Q0F1Q0M7SUFFRCxNQUFNLGtCQUFtQixTQUFRLHNCQUFVO2lCQUVsQixPQUFFLEdBQUcsbUNBQW1DLENBQUM7UUFNakUsWUFBWSxNQUFtQjtZQUM5QixLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQztZQUU3QyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUMzRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUN0RSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFZSxPQUFPO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFRCwyQkFBMkI7UUFFcEIsS0FBSztZQUNYLE9BQU8sa0JBQWtCLENBQUMsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFTSxVQUFVO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRU0sV0FBVztZQUNqQixPQUFPO2dCQUNOLFVBQVUsNkRBQXFEO2FBQy9ELENBQUM7UUFDSCxDQUFDOztJQUdGLElBQUEsNkNBQTBCLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLGdCQUFnQixxREFBNkMsQ0FBQyJ9