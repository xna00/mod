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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, actions_1, lifecycle_1, platform_1, editorExtensions_1, actions_2, contextkey_1, contextView_1, instantiation_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorLineNumberContextMenu = exports.GutterActionsRegistry = exports.GutterActionsRegistryImpl = void 0;
    class GutterActionsRegistryImpl {
        constructor() {
            this._registeredGutterActionsGenerators = new Set();
        }
        /**
         *
         * This exists solely to allow the debug and test contributions to add actions to the gutter context menu
         * which cannot be trivially expressed using when clauses and therefore cannot be statically registered.
         * If you want an action to show up in the gutter context menu, you should generally use MenuId.EditorLineNumberMenu instead.
         */
        registerGutterActionsGenerator(gutterActionsGenerator) {
            this._registeredGutterActionsGenerators.add(gutterActionsGenerator);
            return {
                dispose: () => {
                    this._registeredGutterActionsGenerators.delete(gutterActionsGenerator);
                }
            };
        }
        getGutterActionsGenerators() {
            return Array.from(this._registeredGutterActionsGenerators.values());
        }
    }
    exports.GutterActionsRegistryImpl = GutterActionsRegistryImpl;
    platform_2.Registry.add('gutterActionsRegistry', new GutterActionsRegistryImpl());
    exports.GutterActionsRegistry = platform_2.Registry.as('gutterActionsRegistry');
    let EditorLineNumberContextMenu = class EditorLineNumberContextMenu extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.editorLineNumberContextMenu'; }
        constructor(editor, contextMenuService, menuService, contextKeyService, instantiationService) {
            super();
            this.editor = editor;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this._register(this.editor.onMouseDown((e) => this.doShow(e, false)));
        }
        show(e) {
            this.doShow(e, true);
        }
        doShow(e, force) {
            const model = this.editor.getModel();
            // on macOS ctrl+click is interpreted as right click
            if (!e.event.rightButton && !(platform_1.isMacintosh && e.event.leftButton && e.event.ctrlKey) && !force
                || e.target.type !== 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ && e.target.type !== 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */
                || !e.target.position || !model) {
                return;
            }
            const lineNumber = e.target.position.lineNumber;
            const contextKeyService = this.contextKeyService.createOverlay([['editorLineNumber', lineNumber]]);
            const menu = this.menuService.createMenu(actions_2.MenuId.EditorLineNumberContext, contextKeyService);
            const allActions = [];
            this.instantiationService.invokeFunction(accessor => {
                for (const generator of exports.GutterActionsRegistry.getGutterActionsGenerators()) {
                    const collectedActions = new Map();
                    generator({ lineNumber, editor: this.editor, accessor }, {
                        push: (action, group = 'navigation') => {
                            const actions = (collectedActions.get(group) ?? []);
                            actions.push(action);
                            collectedActions.set(group, actions);
                        }
                    });
                    for (const [group, actions] of collectedActions.entries()) {
                        allActions.push([group, actions]);
                    }
                }
                allActions.sort((a, b) => a[0].localeCompare(b[0]));
                const menuActions = menu.getActions({ arg: { lineNumber, uri: model.uri }, shouldForwardArgs: true });
                allActions.push(...menuActions);
                // if the current editor selections do not contain the target line number,
                // set the selection to the clicked line number
                if (e.target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */) {
                    const currentSelections = this.editor.getSelections();
                    const lineRange = {
                        startLineNumber: lineNumber,
                        endLineNumber: lineNumber,
                        startColumn: 1,
                        endColumn: model.getLineLength(lineNumber) + 1
                    };
                    const containsSelection = currentSelections?.some(selection => !selection.isEmpty() && selection.intersectRanges(lineRange) !== null);
                    if (!containsSelection) {
                        this.editor.setSelection(lineRange, "api" /* TextEditorSelectionSource.PROGRAMMATIC */);
                    }
                }
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.event,
                    getActions: () => actions_1.Separator.join(...allActions.map((a) => a[1])),
                    onHide: () => menu.dispose(),
                });
            });
        }
    };
    exports.EditorLineNumberContextMenu = EditorLineNumberContextMenu;
    exports.EditorLineNumberContextMenu = EditorLineNumberContextMenu = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, actions_2.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService)
    ], EditorLineNumberContextMenu);
    (0, editorExtensions_1.registerEditorContribution)(EditorLineNumberContextMenu.ID, EditorLineNumberContextMenu, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yTGluZU51bWJlck1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvZGVFZGl0b3IvYnJvd3Nlci9lZGl0b3JMaW5lTnVtYmVyTWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLE1BQWEseUJBQXlCO1FBQXRDO1lBQ1MsdUNBQWtDLEdBQWlDLElBQUksR0FBRyxFQUFFLENBQUM7UUFvQnRGLENBQUM7UUFsQkE7Ozs7O1dBS0c7UUFDSSw4QkFBOEIsQ0FBQyxzQkFBK0M7WUFDcEYsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ3BFLE9BQU87Z0JBQ04sT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixJQUFJLENBQUMsa0NBQWtDLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQ3hFLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVNLDBCQUEwQjtZQUNoQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDckUsQ0FBQztLQUNEO0lBckJELDhEQXFCQztJQUVELG1CQUFRLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLElBQUkseUJBQXlCLEVBQUUsQ0FBQyxDQUFDO0lBQzFELFFBQUEscUJBQXFCLEdBQThCLG1CQUFRLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLENBQUM7SUFFOUYsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtpQkFDMUMsT0FBRSxHQUFHLCtDQUErQyxBQUFsRCxDQUFtRDtRQUVyRSxZQUNrQixNQUFtQixFQUNFLGtCQUF1QyxFQUM5QyxX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