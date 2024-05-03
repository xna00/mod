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
define(["require", "exports", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/multiEditorTabsControl", "vs/base/common/lifecycle", "vs/workbench/common/editor/filteredEditorGroupModel"], function (require, exports, dom_1, instantiation_1, multiEditorTabsControl_1, lifecycle_1, filteredEditorGroupModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiRowEditorControl = void 0;
    let MultiRowEditorControl = class MultiRowEditorControl extends lifecycle_1.Disposable {
        constructor(parent, editorPartsView, groupsView, groupView, model, instantiationService) {
            super();
            this.parent = parent;
            this.groupsView = groupsView;
            this.groupView = groupView;
            this.model = model;
            this.instantiationService = instantiationService;
            const stickyModel = this._register(new filteredEditorGroupModel_1.StickyEditorGroupModel(this.model));
            const unstickyModel = this._register(new filteredEditorGroupModel_1.UnstickyEditorGroupModel(this.model));
            this.stickyEditorTabsControl = this._register(this.instantiationService.createInstance(multiEditorTabsControl_1.MultiEditorTabsControl, this.parent, editorPartsView, this.groupsView, this.groupView, stickyModel));
            this.unstickyEditorTabsControl = this._register(this.instantiationService.createInstance(multiEditorTabsControl_1.MultiEditorTabsControl, this.parent, editorPartsView, this.groupsView, this.groupView, unstickyModel));
            this.handlePinnedTabsLayoutChange();
        }
        handlePinnedTabsLayoutChange() {
            if (this.groupView.count === 0) {
                // Do nothing as no tab bar is visible
                return;
            }
            const hadTwoTabBars = this.parent.classList.contains('two-tab-bars');
            const hasTwoTabBars = this.groupView.count !== this.groupView.stickyCount && this.groupView.stickyCount > 0;
            // Ensure action toolbar is only visible once
            this.parent.classList.toggle('two-tab-bars', hasTwoTabBars);
            if (hadTwoTabBars !== hasTwoTabBars) {
                this.groupView.relayout();
            }
        }
        getEditorTabsController(editor) {
            return this.model.isSticky(editor) ? this.stickyEditorTabsControl : this.unstickyEditorTabsControl;
        }
        openEditor(editor, options) {
            const [editorTabController, otherTabController] = this.model.isSticky(editor) ? [this.stickyEditorTabsControl, this.unstickyEditorTabsControl] : [this.unstickyEditorTabsControl, this.stickyEditorTabsControl];
            const didChange = editorTabController.openEditor(editor, options);
            if (didChange) {
                // HACK: To render all editor tabs on startup, otherwise only one row gets rendered
                otherTabController.openEditors([]);
                this.handleOpenedEditors();
            }
            return didChange;
        }
        openEditors(editors) {
            const stickyEditors = editors.filter(e => this.model.isSticky(e));
            const unstickyEditors = editors.filter(e => !this.model.isSticky(e));
            const didChangeOpenEditorsSticky = this.stickyEditorTabsControl.openEditors(stickyEditors);
            const didChangeOpenEditorsUnSticky = this.unstickyEditorTabsControl.openEditors(unstickyEditors);
            const didChange = didChangeOpenEditorsSticky || didChangeOpenEditorsUnSticky;
            if (didChange) {
                this.handleOpenedEditors();
            }
            return didChange;
        }
        handleOpenedEditors() {
            this.handlePinnedTabsLayoutChange();
        }
        beforeCloseEditor(editor) {
            this.getEditorTabsController(editor).beforeCloseEditor(editor);
        }
        closeEditor(editor) {
            // Has to be called on both tab bars as the editor could be either sticky or not
            this.stickyEditorTabsControl.closeEditor(editor);
            this.unstickyEditorTabsControl.closeEditor(editor);
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            const stickyEditors = editors.filter(e => this.model.isSticky(e));
            const unstickyEditors = editors.filter(e => !this.model.isSticky(e));
            this.stickyEditorTabsControl.closeEditors(stickyEditors);
            this.unstickyEditorTabsControl.closeEditors(unstickyEditors);
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            this.handlePinnedTabsLayoutChange();
        }
        moveEditor(editor, fromIndex, targetIndex, stickyStateChange) {
            if (stickyStateChange) {
                // If sticky state changes, move editor between tab bars
                if (this.model.isSticky(editor)) {
                    this.stickyEditorTabsControl.openEditor(editor);
                    this.unstickyEditorTabsControl.closeEditor(editor);
                }
                else {
                    this.stickyEditorTabsControl.closeEditor(editor);
                    this.unstickyEditorTabsControl.openEditor(editor);
                }
                this.handlePinnedTabsLayoutChange();
            }
            else {
                if (this.model.isSticky(editor)) {
                    this.stickyEditorTabsControl.moveEditor(editor, fromIndex, targetIndex, stickyStateChange);
                }
                else {
                    this.unstickyEditorTabsControl.moveEditor(editor, fromIndex - this.model.stickyCount, targetIndex - this.model.stickyCount, stickyStateChange);
                }
            }
        }
        pinEditor(editor) {
            this.getEditorTabsController(editor).pinEditor(editor);
        }
        stickEditor(editor) {
            this.unstickyEditorTabsControl.closeEditor(editor);
            this.stickyEditorTabsControl.openEditor(editor);
            this.handlePinnedTabsLayoutChange();
        }
        unstickEditor(editor) {
            this.stickyEditorTabsControl.closeEditor(editor);
            this.unstickyEditorTabsControl.openEditor(editor);
            this.handlePinnedTabsLayoutChange();
        }
        setActive(isActive) {
            this.stickyEditorTabsControl.setActive(isActive);
            this.unstickyEditorTabsControl.setActive(isActive);
        }
        updateEditorLabel(editor) {
            this.getEditorTabsController(editor).updateEditorLabel(editor);
        }
        updateEditorDirty(editor) {
            this.getEditorTabsController(editor).updateEditorDirty(editor);
        }
        updateOptions(oldOptions, newOptions) {
            this.stickyEditorTabsControl.updateOptions(oldOptions, newOptions);
            this.unstickyEditorTabsControl.updateOptions(oldOptions, newOptions);
        }
        layout(dimensions) {
            const stickyDimensions = this.stickyEditorTabsControl.layout(dimensions);
            const unstickyAvailableDimensions = {
                container: dimensions.container,
                available: new dom_1.Dimension(dimensions.available.width, dimensions.available.height - stickyDimensions.height)
            };
            const unstickyDimensions = this.unstickyEditorTabsControl.layout(unstickyAvailableDimensions);
            return new dom_1.Dimension(dimensions.container.width, stickyDimensions.height + unstickyDimensions.height);
        }
        getHeight() {
            return this.stickyEditorTabsControl.getHeight() + this.unstickyEditorTabsControl.getHeight();
        }
        dispose() {
            this.parent.classList.toggle('two-tab-bars', false);
            super.dispose();
        }
    };
    exports.MultiRowEditorControl = MultiRowEditorControl;
    exports.MultiRowEditorControl = MultiRowEditorControl = __decorate([
        __param(5, instantiation_1.IInstantiationService)
    ], MultiRowEditorControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGlSb3dFZGl0b3JUYWJzQ29udHJvbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL211bHRpUm93RWRpdG9yVGFic0NvbnRyb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVU7UUFLcEQsWUFDa0IsTUFBbUIsRUFDcEMsZUFBaUMsRUFDaEIsVUFBNkIsRUFDN0IsU0FBMkIsRUFDM0IsS0FBZ0MsRUFDVCxvQkFBMkM7WUFFbkYsS0FBSyxFQUFFLENBQUM7WUFQUyxXQUFNLEdBQU4sTUFBTSxDQUFhO1lBRW5CLGVBQVUsR0FBVixVQUFVLENBQW1CO1lBQzdCLGNBQVMsR0FBVCxTQUFTLENBQWtCO1lBQzNCLFVBQUssR0FBTCxLQUFLLENBQTJCO1lBQ1QseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUluRixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksaURBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1EQUF3QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRS9FLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsK0NBQXNCLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDNUwsSUFB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