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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, arrays_1, lifecycle_1, editorOptions_1, configuration_1, contextkey_1, instantiation_1, themeService_1, commentService_1, commentThreadWidget_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellComments = void 0;
    let CellComments = class CellComments extends cellPart_1.CellContentPart {
        constructor(notebookEditor, container, contextKeyService, themeService, commentService, configurationService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.container = container;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.commentService = commentService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this._initialized = false;
            this._commentThreadWidget = null;
            this.commentTheadDisposables = this._register(new lifecycle_1.DisposableStore());
            this.container.classList.add('review-widget');
            this._register(this.themeService.onDidColorThemeChange(this._applyTheme, this));
            // TODO @rebornix onDidChangeLayout (font change)
            // this._register(this.notebookEditor.onDidchangeLa)
            this._applyTheme();
        }
        async initialize(element) {
            if (this._initialized) {
                return;
            }
            this._initialized = true;
            const info = await this._getCommentThreadForCell(element);
            if (info) {
                this._createCommentTheadWidget(info.owner, info.thread);
            }
        }
        _createCommentTheadWidget(owner, commentThread) {
            this._commentThreadWidget?.dispose();
            this.commentTheadDisposables.clear();
            this._commentThreadWidget = this.instantiationService.createInstance(commentThreadWidget_1.CommentThreadWidget, this.container, this.notebookEditor, owner, this.notebookEditor.textModel.uri, this.contextKeyService, this.instantiationService, commentThread, undefined, undefined, {
                codeBlockFontFamily: this.configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily
            }, undefined, {
                actionRunner: () => {
                },
                collapse: () => { }
            });
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            this._commentThreadWidget.display(layoutInfo.fontInfo.lineHeight);
            this._applyTheme();
            this.commentTheadDisposables.add(this._commentThreadWidget.onDidResize(() => {
                if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                    this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                }
            }));
        }
        _bindListeners() {
            this.cellDisposables.add(this.commentService.onDidUpdateCommentThreads(async () => {
                if (this.currentElement) {
                    const info = await this._getCommentThreadForCell(this.currentElement);
                    if (!this._commentThreadWidget && info) {
                        this._createCommentTheadWidget(info.owner, info.thread);
                        const layoutInfo = this.currentElement.layoutInfo;
                        this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
                        this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                        return;
                    }
                    if (this._commentThreadWidget) {
                        if (!info) {
                            this._commentThreadWidget.dispose();
                            this.currentElement.commentHeight = 0;
                            return;
                        }
                        if (this._commentThreadWidget.commentThread === info.thread) {
                            this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                            return;
                        }
                        this._commentThreadWidget.updateCommentThread(info.thread);
                        this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
                    }
                }
            }));
        }
        _calculateCommentThreadHeight(bodyHeight) {
            const layoutInfo = this.notebookEditor.getLayoutInfo();
            const headHeight = Math.ceil(layoutInfo.fontInfo.lineHeight * 1.2);
            const lineHeight = layoutInfo.fontInfo.lineHeight;
            const arrowHeight = Math.round(lineHeight / 3);
            const frameThickness = Math.round(lineHeight / 9) * 2;
            const computedHeight = headHeight + bodyHeight + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */;
            return computedHeight;
        }
        async _getCommentThreadForCell(element) {
            if (this.notebookEditor.hasModel()) {
                const commentInfos = (0, arrays_1.coalesce)(await this.commentService.getNotebookComments(element.uri));
                if (commentInfos.length && commentInfos[0].threads.length) {
                    return { owner: commentInfos[0].uniqueOwner, thread: commentInfos[0].threads[0] };
                }
            }
            return null;
        }
        _applyTheme() {
            const theme = this.themeService.getColorTheme();
            const fontInfo = this.notebookEditor.getLayoutInfo().fontInfo;
            this._commentThreadWidget?.applyTheme(theme, fontInfo);
        }
        didRenderCell(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Code) {
                this.currentElement = element;
                this.initialize(element);
                this._bindListeners();
            }
        }
        prepareLayout() {
            if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                this.currentElement.commentHeight = this._calculateCommentThreadHeight(this._commentThreadWidget.getDimensions().height);
            }
        }
        updateInternalLayoutNow(element) {
            if (this.currentElement?.cellKind === notebookCommon_1.CellKind.Code && this._commentThreadWidget) {
                const layoutInfo = element.layoutInfo;
                this.container.style.top = `${layoutInfo.outputContainerOffset + layoutInfo.outputTotalHeight}px`;
            }
        }
    };
    exports.CellComments = CellComments;
    exports.CellComments = CellComments = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, commentService_1.ICommentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService)
    ], CellComments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENvbW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvY2VsbFBhcnRzL2NlbGxDb21tZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSwwQkFBZTtRQU1oRCxZQUNrQixjQUF1QyxFQUN2QyxTQUFzQixFQUVuQixpQkFBc0QsRUFDM0QsWUFBNEMsRUFDMUMsY0FBZ0QsRUFDMUMsb0JBQTRELEVBQzVELG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQVRTLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUN2QyxjQUFTLEdBQVQsU0FBUyxDQUFhO1lBRUYsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUN6QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBYjVFLGlCQUFZLEdBQVksS0FBSyxDQUFDO1lBQzlCLHlCQUFvQixHQUEyQyxJQUFJLENBQUM7WUFFM0QsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBYWhGLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUU5QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLGlEQUFpRDtZQUNq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