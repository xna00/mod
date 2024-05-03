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
define(["require", "exports", "vs/base/common/map", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, map_1, notebookEditorWidget_1, lifecycle_1, editorGroupsService_1, instantiation_1, notebookEditorInput_1, event_1, editorService_1, contextkey_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWidgetService = void 0;
    let NotebookEditorWidgetService = class NotebookEditorWidgetService {
        constructor(editorGroupService, editorService, contextKeyService) {
            this.editorGroupService = editorGroupService;
            this._tokenPool = 1;
            this._disposables = new lifecycle_1.DisposableStore();
            this._notebookEditors = new Map();
            this._onNotebookEditorAdd = new event_1.Emitter();
            this._onNotebookEditorsRemove = new event_1.Emitter();
            this.onDidAddNotebookEditor = this._onNotebookEditorAdd.event;
            this.onDidRemoveNotebookEditor = this._onNotebookEditorsRemove.event;
            this._borrowableEditors = new Map();
            const groupListener = new Map();
            const onNewGroup = (group) => {
                const { id } = group;
                const listeners = [];
                listeners.push(group.onDidCloseEditor(e => {
                    const widgets = this._borrowableEditors.get(group.id);
                    if (!widgets) {
                        return;
                    }
                    const inputs = e.editor instanceof notebookEditorInput_1.NotebookEditorInput ? [e.editor] : ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor) ? e.editor.editorInputs : []);
                    inputs.forEach(input => {
                        const value = widgets.get(input.resource);
                        if (!value) {
                            return;
                        }
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                        widgets.delete(input.resource);
                        value.widget = undefined; // unset the widget so that others that still hold a reference don't harm us
                    });
                }));
                listeners.push(group.onWillMoveEditor(e => {
                    if (e.editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                        this._allowWidgetMove(e.editor, e.groupId, e.target);
                    }
                    if ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(e.editor)) {
                        e.editor.editorInputs.forEach(input => {
                            this._allowWidgetMove(input, e.groupId, e.target);
                        });
                    }
                }));
                groupListener.set(id, listeners);
            };
            this._disposables.add(editorGroupService.onDidAddGroup(onNewGroup));
            editorGroupService.whenReady.then(() => editorGroupService.groups.forEach(onNewGroup));
            // group removed -> clean up listeners, clean up widgets
            this._disposables.add(editorGroupService.onDidRemoveGroup(group => {
                const listeners = groupListener.get(group.id);
                if (listeners) {
                    listeners.forEach(listener => listener.dispose());
                    groupListener.delete(group.id);
                }
                const widgets = this._borrowableEditors.get(group.id);
                this._borrowableEditors.delete(group.id);
                if (widgets) {
                    for (const value of widgets.values()) {
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                    }
                }
            }));
            const interactiveWindowOpen = notebookContextKeys_1.InteractiveWindowOpen.bindTo(contextKeyService);
            this._disposables.add(editorService.onDidEditorsChange(e => {
                if (e.event.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */ && !interactiveWindowOpen.get()) {
                    if (editorService.editors.find(editor => editor.editorId === 'interactive')) {
                        interactiveWindowOpen.set(true);
                    }
                }
                else if (e.event.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && interactiveWindowOpen.get()) {
                    if (!editorService.editors.find(editor => editor.editorId === 'interactive')) {
                        interactiveWindowOpen.set(false);
                    }
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._onNotebookEditorAdd.dispose();
            this._onNotebookEditorsRemove.dispose();
        }
        // --- group-based editor borrowing...
        _disposeWidget(widget) {
            widget.onWillHide();
            const domNode = widget.getDomNode();
            widget.dispose();
            domNode.remove();
        }
        _allowWidgetMove(input, sourceID, targetID) {
            const sourcePart = this.editorGroupService.getPart(sourceID);
            const targetPart = this.editorGroupService.getPart(targetID);
            if (sourcePart.windowId !== targetPart.windowId) {
                return;
            }
            const targetWidget = this._borrowableEditors.get(targetID)?.get(input.resource);
            if (targetWidget) {
                // not needed
                return;
            }
            const widget = this._borrowableEditors.get(sourceID)?.get(input.resource);
            if (!widget) {
                throw new Error('no widget at source group');
            }
            // don't allow the widget to be retrieved at its previous location any more
            this._borrowableEditors.get(sourceID)?.delete(input.resource);
            // allow the widget to be retrieved at its new location
            let targetMap = this._borrowableEditors.get(targetID);
            if (!targetMap) {
                targetMap = new map_1.ResourceMap();
                this._borrowableEditors.set(targetID, targetMap);
            }
            targetMap.set(input.resource, widget);
        }
        retrieveExistingWidgetFromURI(resource) {
            for (const widgetInfo of this._borrowableEditors.values()) {
                const widget = widgetInfo.get(resource);
                if (widget) {
                    return this._createBorrowValue(widget.token, widget);
                }
            }
            return undefined;
        }
        retrieveAllExistingWidgets() {
            const ret = [];
            for (const widgetInfo of this._borrowableEditors.values()) {
                for (const widget of widgetInfo.values()) {
                    ret.push(this._createBorrowValue(widget.token, widget));
                }
            }
            return ret;
        }
        retrieveWidget(accessor, group, input, creationOptions, initialDimension, codeWindow) {
            let value = this._borrowableEditors.get(group.id)?.get(input.resource);
            if (!value) {
                // NEW widget
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const ctorOptions = creationOptions ?? (0, notebookEditorWidget_1.getDefaultNotebookCreationOptions)();
                const widget = instantiationService.createInstance(notebookEditorWidget_1.NotebookEditorWidget, {
                    ...ctorOptions,
                    codeWindow: codeWindow ?? ctorOptions.codeWindow,
                }, initialDimension);
                const token = this._tokenPool++;
                value = { widget, token };
                let map = this._borrowableEditors.get(group.id);
                if (!map) {
                    map = new map_1.ResourceMap();
                    this._borrowableEditors.set(group.id, map);
                }
                map.set(input.resource, value);
            }
            else {
                // reuse a widget which was either free'ed before or which
                // is simply being reused...
                value.token = this._tokenPool++;
            }
            return this._createBorrowValue(value.token, value);
        }
        _createBorrowValue(myToken, widget) {
            return {
                get value() {
                    return widget.token === myToken ? widget.widget : undefined;
                }
            };
        }
        // --- editor management
        addNotebookEditor(editor) {
            this._notebookEditors.set(editor.getId(), editor);
            this._onNotebookEditorAdd.fire(editor);
        }
        removeNotebookEditor(editor) {
            if (this._notebookEditors.has(editor.getId())) {
                this._notebookEditors.delete(editor.getId());
                this._onNotebookEditorsRemove.fire(editor);
            }
        }
        getNotebookEditor(editorId) {
            return this._notebookEditors.get(editorId);
        }
        listNotebookEditors() {
            return [...this._notebookEditors].map(e => e[1]);
        }
    };
    exports.NotebookEditorWidgetService = NotebookEditorWidgetService;
    exports.NotebookEditorWidgetService = NotebookEditorWidgetService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, contextkey_1.IContextKeyService)
    ], NotebookEditorWidgetService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va0VkaXRvclNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7UUFnQnZDLFlBQ3VCLGtCQUFpRCxFQUN2RCxhQUE2QixFQUN6QixpQkFBcUM7WUFGMUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQWJoRSxlQUFVLEdBQUcsQ0FBQyxDQUFDO1lBRU4saUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNyQyxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUV0RCx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBbUIsQ0FBQztZQUN0RCw2QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBbUIsQ0FBQztZQUNsRSwyQkFBc0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBQ3pELDhCQUF5QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFeEQsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQW9GLENBQUM7WUFRakksTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7WUFDdkQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxLQUFtQixFQUFFLEVBQUU7Z0JBQzFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUM7Z0JBQ3JCLE1BQU0sU0FBUyxHQUFrQixFQUFFLENBQUM7Z0JBQ3BDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixD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