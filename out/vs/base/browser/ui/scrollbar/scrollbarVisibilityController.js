/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarVisibilityController = void 0;
    class ScrollbarVisibilityController extends lifecycle_1.Disposable {
        constructor(visibility, visibleClassName, invisibleClassName) {
            super();
            this._visibility = visibility;
            this._visibleClassName = visibleClassName;
            this._invisibleClassName = invisibleClassName;
            this._domNode = null;
            this._isVisible = false;
            this._isNeeded = false;
            this._rawShouldBeVisible = false;
            this._shouldBeVisible = false;
            this._revealTimer = this._register(new async_1.TimeoutTimer());
        }
        setVisibility(visibility) {
            if (this._visibility !== visibility) {
                this._visibility = visibility;
                this._updateShouldBeVisible();
            }
        }
        // ----------------- Hide / Reveal
        setShouldBeVisible(rawShouldBeVisible) {
            this._rawShouldBeVisible = rawShouldBeVisible;
            this._updateShouldBeVisible();
        }
        _applyVisibilitySetting() {
            if (this._visibility === 2 /* ScrollbarVisibility.Hidden */) {
                return false;
            }
            if (this._visibility === 3 /* ScrollbarVisibility.Visible */) {
                return true;
            }
            return this._rawShouldBeVisible;
        }
        _updateShouldBeVisible() {
            const shouldBeVisible = this._applyVisibilitySetting();
            if (this._shouldBeVisible !== shouldBeVisible) {
                this._shouldBeVisible = shouldBeVisible;
                this.ensureVisibility();
            }
        }
        setIsNeeded(isNeeded) {
            if (this._isNeeded !== isNeeded) {
                this._isNeeded = isNeeded;
                this.ensureVisibility();
            }
        }
        setDomNode(domNode) {
            this._domNode = domNode;
            this._domNode.setClassName(this._invisibleClassName);
            // Now that the flags & the dom node are in a consistent state, ensure the Hidden/Visible configuration
            this.setShouldBeVisible(false);
        }
        ensureVisibility() {
            if (!this._isNeeded) {
                // Nothing to be rendered
                this._hide(false);
                return;
            }
            if (this._shouldBeVisible) {
                this._reveal();
            }
            else {
                this._hide(true);
            }
        }
        _reveal() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            // The CSS animation doesn't play otherwise
            this._revealTimer.setIfNotSet(() => {
                this._domNode?.setClassName(this._visibleClassName);
            }, 0);
        }
        _hide(withFadeAway) {
            this._revealTimer.cancel();
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._domNode?.setClassName(this._invisibleClassName + (withFadeAway ? ' fade' : ''));
        }
    }
    exports.ScrollbarVisibilityController = ScrollbarVisibilityController;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyVmlzaWJpbGl0eUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvc2Nyb2xsYmFyVmlzaWJpbGl0eUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsNkJBQThCLFNBQVEsc0JBQVU7UUFXNUQsWUFBWSxVQUErQixFQUFFLGdCQUF3QixFQUFFLGtCQUEwQjtZQUNoRyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1lBQzlCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQztZQUMxQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7WUFDOUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztZQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQzlCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG9CQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTSxhQUFhLENBQUMsVUFBK0I7WUFDbkQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDL0IsQ0FBQztRQUNGLENBQUM7UUFFRCxrQ0FBa0M7UUFFM0Isa0JBQWtC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