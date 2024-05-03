/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/uuid", "vs/workbench/common/editor/editorInput"], function (require, exports, network_1, uri_1, uuid_1, editorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewInput = void 0;
    class WebviewInput extends editorInput_1.EditorInput {
        static { this.typeId = 'workbench.editors.webviewInput'; }
        get typeId() {
            return WebviewInput.typeId;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            return 2 /* EditorInputCapabilities.Readonly */ | 8 /* EditorInputCapabilities.Singleton */ | 128 /* EditorInputCapabilities.CanDropIntoEditor */;
        }
        get resource() {
            return uri_1.URI.from({
                scheme: network_1.Schemas.webviewPanel,
                path: `webview-panel/webview-${this._resourceId}`
            });
        }
        constructor(init, webview, _iconManager) {
            super();
            this._iconManager = _iconManager;
            this._resourceId = (0, uuid_1.generateUuid)();
            this._hasTransfered = false;
            this.viewType = init.viewType;
            this.providedId = init.providedId;
            this._name = init.name;
            this._webview = webview;
        }
        dispose() {
            if (!this.isDisposed()) {
                if (!this._hasTransfered) {
                    this._webview?.dispose();
                }
            }
            super.dispose();
        }
        getName() {
            return this._name;
        }
        getTitle(_verbosity) {
            return this.getName();
        }
        getDescription() {
            return undefined;
        }
        setName(value) {
            this._name = value;
            this.webview.setTitle(value);
            this._onDidChangeLabel.fire();
        }
        get webview() {
            return this._webview;
        }
        get extension() {
            return this.webview.extension;
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            this._iconManager.setIcons(this._resourceId, value);
        }
        matches(other) {
            return super.matches(other) || other === this;
        }
        get group() {
            return this._group;
        }
        updateGroup(group) {
            this._group = group;
        }
        transfer(other) {
            if (this._hasTransfered) {
                return undefined;
            }
            this._hasTransfered = true;
            other._webview = this._webview;
            return other;
        }
        claim(claimant, targetWindow, scopedContextKeyService) {
            return this._webview.claim(claimant, targetWindow, scopedContextKeyService);
        }
    }
    exports.WebviewInput = WebviewInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0VkaXRvcklucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3UGFuZWwvYnJvd3Nlci93ZWJ2aWV3RWRpdG9ySW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLFlBQWEsU0FBUSx5QkFBVztpQkFFOUIsV0FBTSxHQUFHLGdDQUFnQyxBQUFuQyxDQUFvQztRQUV4RCxJQUFvQixNQUFNO1lBQ3pCLE9BQU8sWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBb0IsUUFBUTtZQUMzQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQW9CLFlBQVk7WUFDL0IsT0FBTyxvRkFBb0Usc0RBQTRDLENBQUM7UUFDekgsQ0FBQztRQVlELElBQUksUUFBUTtZQUNYLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQztnQkFDZixNQUFNLEVBQUUsaUJBQU8sQ0FBQyxZQUFZO2dCQUM1QixJQUFJLEVBQUUseUJBQXlCLElBQUksQ0FBQyxXQUFXLEVBQUU7YUFDakQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUtELFlBQ0MsSUFBMEIsRUFDMUIsT0FBd0IsRUFDUCxZQUFnQztZQUVqRCxLQUFLLEVBQUUsQ0FBQztZQUZTLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtZQXZCakMsZ0JBQVcsR0FBRyxJQUFBLG1CQUFZLEdBQUUsQ0FBQztZQVF0QyxtQkFBYyxHQUFHLEtBQUssQ0FBQztZQW1COUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUVsQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDekIsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLENBQUM7WUFDRixDQUFDO1lBQ0QsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7UUFFZSxPQUFPO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNuQixDQUFDO1FBRWUsUUFBUSxDQUFDLFVBQXNCO1lBQzlDLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFZSxjQUFjO1lBQzdCLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTSxPQUFPLENBQUMsS0FBYTtZQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFXLFFBQVE7WUFDbEIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFXLFFBQVEsQ0FBQyxLQUErQjtZQUNsRCxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFZSxPQUFPLENBQUMsS0FBd0M7WUFDL0QsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUM7UUFDL0MsQ0FBQztRQUVELElBQVcsS0FBSztZQUNmLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwQixDQUFDO1FBRU0sV0FBVyxDQUFDLEtBQXNCO1lBQ3hDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFFUyxRQUFRLENBQUMsS0FBbUI7WUFDckMsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQixLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDL0IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sS0FBSyxDQUFDLFFBQWlCLEVBQUUsWUFBd0IsRUFBRSx1QkFBdUQ7WUFDaEgsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFDN0UsQ0FBQzs7SUFySEYsb0NBc0hDIn0=