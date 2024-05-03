/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorTheme"], function (require, exports, editorTheme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContext = void 0;
    class ViewContext {
        constructor(configuration, theme, model) {
            this.configuration = configuration;
            this.theme = new editorTheme_1.EditorTheme(theme);
            this.viewModel = model;
            this.viewLayout = model.viewLayout;
        }
        addEventHandler(eventHandler) {
            this.viewModel.addViewEventHandler(eventHandler);
        }
        removeEventHandler(eventHandler) {
            this.viewModel.removeViewEventHandler(eventHandler);
        }
    }
    exports.ViewContext = ViewContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0NvbnRleHQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vdmlld01vZGVsL3ZpZXdDb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLFdBQVc7UUFPdkIsWUFDQyxhQUFtQyxFQUNuQyxLQUFrQixFQUNsQixLQUFpQjtZQUVqQixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztZQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUkseUJBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDcEMsQ0FBQztRQUVNLGVBQWUsQ0FBQyxZQUE4QjtZQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxZQUE4QjtZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JELENBQUM7S0FDRDtJQXpCRCxrQ0F5QkMifQ==