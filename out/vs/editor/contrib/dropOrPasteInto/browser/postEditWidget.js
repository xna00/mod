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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/services/bulkEditService", "vs/editor/contrib/dropOrPasteInto/browser/edit", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/css!./postEditWidget"], function (require, exports, dom, button_1, actions_1, event_1, lifecycle_1, bulkEditService_1, edit_1, contextkey_1, contextView_1, instantiation_1, keybinding_1) {
    "use strict";
    var PostEditWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PostEditWidgetManager = void 0;
    let PostEditWidget = class PostEditWidget extends lifecycle_1.Disposable {
        static { PostEditWidget_1 = this; }
        static { this.baseId = 'editor.widget.postEditWidget'; }
        constructor(typeId, editor, visibleContext, showCommand, range, edits, onSelectNewEdit, _contextMenuService, contextKeyService, _keybindingService) {
            super();
            this.typeId = typeId;
            this.editor = editor;
            this.showCommand = showCommand;
            this.range = range;
            this.edits = edits;
            this.onSelectNewEdit = onSelectNewEdit;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = true;
            this.create();
            this.visibleContext = visibleContext.bindTo(contextKeyService);
            this.visibleContext.set(true);
            this._register((0, lifecycle_1.toDisposable)(() => this.visibleContext.reset()));
            this.editor.addContentWidget(this);
            this.editor.layoutContentWidget(this);
            this._register((0, lifecycle_1.toDisposable)((() => this.editor.removeContentWidget(this))));
            this._register(this.editor.onDidChangeCursorPosition(e => {
                if (!range.containsPosition(e.position)) {
                    this.dispose();
                }
            }));
            this._register(event_1.Event.runAndSubscribe(_keybindingService.onDidUpdateKeybindings, () => {
                this._updateButtonTitle();
            }));
        }
        _updateButtonTitle() {
            const binding = this._keybindingService.lookupKeybinding(this.showCommand.id)?.getLabel();
            this.button.element.title = this.showCommand.label + (binding ? ` (${binding})` : '');
        }
        create() {
            this.domNode = dom.$('.post-edit-widget');
            this.button = this._register(new button_1.Button(this.domNode, {
                supportIcons: true,
            }));
            this.button.label = '$(insert)';
            this._register(dom.addDisposableListener(this.domNode, dom.EventType.CLICK, () => this.showSelector()));
        }
        getId() {
            return PostEditWidget_1.baseId + '.' + this.typeId;
        }
        getDomNode() {
            return this.domNode;
        }
        getPosition() {
            return {
                position: this.range.getEndPosition(),
                preference: [2 /* ContentWidgetPositionPreference.BELOW */]
            };
        }
        showSelector() {
            this._contextMenuService.showContextMenu({
                getAnchor: () => {
                    const pos = dom.getDomNodePagePosition(this.button.element);
                    return { x: pos.left + pos.width, y: pos.top + pos.height };
                },
                getActions: () => {
                    return this.edits.allEdits.map((edit, i) => (0, actions_1.toAction)({
                        id: '',
                        label: edit.title,
                        checked: i === this.edits.activeEditIndex,
                        run: () => {
                            if (i !== this.edits.activeEditIndex) {
                                return this.onSelectNewEdit(i);
                            }
                        },
                    }));
                }
            });
        }
    };
    PostEditWidget = PostEditWidget_1 = __decorate([
        __param(7, contextView_1.IContextMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, keybinding_1.IKeybindingService)
    ], PostEditWidget);
    let PostEditWidgetManager = class PostEditWidgetManager extends lifecycle_1.Disposable {
        constructor(_id, _editor, _visibleContext, _showCommand, _instantiationService, _bulkEditService) {
            super();
            this._id = _id;
            this._editor = _editor;
            this._visibleContext = _visibleContext;
            this._showCommand = _showCommand;
            this._instantiationService = _instantiationService;
            this._bulkEditService = _bulkEditService;
            this._currentWidget = this._register(new lifecycle_1.MutableDisposable());
            this._register(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelContent)(() => this.clear()));
        }
        async applyEditAndShowIfNeeded(ranges, edits, canShowWidget, resolve, token) {
            const model = this._editor.getModel();
            if (!model || !ranges.length) {
                return;
            }
            const edit = edits.allEdits.at(edits.activeEditIndex);
            if (!edit) {
                return;
            }
            const resolvedEdit = await resolve(edit, token);
            const combinedWorkspaceEdit = (0, edit_1.createCombinedWorkspaceEdit)(model.uri, ranges, resolvedEdit);
            // Use a decoration to track edits around the trigger range
            const primaryRange = ranges[0];
            const editTrackingDecoration = model.deltaDecorations([], [{
                    range: primaryRange,
                    options: { description: 'paste-line-suffix', stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */ }
                }]);
            let editResult;
            let editRange;
            try {
                editResult = await this._bulkEditService.apply(combinedWorkspaceEdit, { editor: this._editor, token });
                editRange = model.getDecorationRange(editTrackingDecoration[0]);
            }
            finally {
                model.deltaDecorations(editTrackingDecoration, []);
            }
            if (canShowWidget && editResult.isApplied && edits.allEdits.length > 1) {
                this.show(editRange ?? primaryRange, edits, async (newEditIndex) => {
                    const model = this._editor.getModel();
                    if (!model) {
                        return;
                    }
                    await model.undo();
                    this.applyEditAndShowIfNeeded(ranges, { activeEditIndex: newEditIndex, allEdits: edits.allEdits }, canShowWidget, resolve, token);
                });
            }
        }
        show(range, edits, onDidSelectEdit) {
            this.clear();
            if (this._editor.hasModel()) {
                this._currentWidget.value = this._instantiationService.createInstance((PostEditWidget), this._id, this._editor, this._visibleContext, this._showCommand, range, edits, onDidSelectEdit);
            }
        }
        clear() {
            this._currentWidget.clear();
        }
        tryShowSelector() {
            this._currentWidget.value?.showSelector();
        }
    };
    exports.PostEditWidgetManager = PostEditWidgetManager;
    exports.PostEditWidgetManager = PostEditWidgetManager = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, bulkEditService_1.IBulkEditService)
    ], PostEditWidgetManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdEVkaXRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Ryb3BPclBhc3RlSW50by9icm93c2VyL3Bvc3RFZGl0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUErQmhHLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWlFLFNBQVEsc0JBQVU7O2lCQUNoRSxXQUFNLEdBQUcsOEJBQThCLEFBQWpDLENBQWtDO1FBVWhFLFlBQ2tCLE1BQWMsRUFDZCxNQUFtQixFQUNwQyxjQUFzQyxFQUNyQixXQUF3QixFQUN4QixLQUFZLEVBQ1osS0FBaUIsRUFDakIsZUFBNEMsRUFDeEMsbUJBQXlELEVBQzFELGlCQUFxQyxFQUNyQyxrQkFBdUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFYUyxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQUVuQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUN4QixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osVUFBSyxHQUFMLEtBQUssQ0FBWTtZQUNqQixvQkFBZSxHQUFmLGVBQWUsQ0FBNkI7WUFDdkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUV6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBbEJuRSx3QkFBbUIsR0FBRyxJQUFJLENBQUM7WUFDM0Isc0JBQWlCLEdBQUcsSUFBSSxDQUFDO1lBcUJqQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFZCxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixJQUFJLENB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