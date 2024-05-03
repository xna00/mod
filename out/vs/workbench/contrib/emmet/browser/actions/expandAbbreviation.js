define(["require", "exports", "vs/nls", "vs/workbench/contrib/emmet/browser/emmetActions", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions"], function (require, exports, nls, emmetActions_1, editorExtensions_1, editorContextKeys_1, contextkey_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExpandAbbreviationAction extends emmetActions_1.EmmetEditorAction {
        constructor() {
            super({
                id: 'editor.emmet.action.expandAbbreviation',
                label: nls.localize('expandAbbreviationAction', "Emmet: Expand Abbreviation"),
                alias: 'Emmet: Expand Abbreviation',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                actionName: 'expand_abbreviation',
                kbOpts: {
                    primary: 2 /* KeyCode.Tab */,
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus, contextkey_1.ContextKeyExpr.has('config.emmet.triggerExpansionOnTab')),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '5_insert',
                    title: nls.localize({ key: 'miEmmetExpandAbbreviation', comment: ['&& denotes a mnemonic'] }, "Emmet: E&&xpand Abbreviation"),
                    order: 3
                }
            });
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ExpandAbbreviationAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwYW5kQWJicmV2aWF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lbW1ldC9icm93c2VyL2FjdGlvbnMvZXhwYW5kQWJicmV2aWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWFBLE1BQU0sd0JBQXlCLFNBQVEsZ0NBQWlCO1FBRXZEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx3Q0FBd0M7Z0JBQzVDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLDBCQUEwQixFQUFFLDRCQUE0QixDQUFDO2dCQUM3RSxLQUFLLEVBQUUsNEJBQTRCO2dCQUNuQyxZQUFZLEVBQUUscUNBQWlCLENBQUMsUUFBUTtnQkFDeEMsVUFBVSxFQUFFLHFCQUFxQjtnQkFDakMsTUFBTSxFQUFFO29CQUNQLE9BQU8scUJBQWE7b0JBQ3BCLE1BQU0sRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDekIscUNBQWlCLENBQUMsZUFBZSxFQUNqQyxxQ0FBaUIsQ0FBQyxtQkFBbUIsRUFDckMsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsQ0FDeEQ7b0JBQ0QsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO29CQUM5QixLQUFLLEVBQUUsVUFBVTtvQkFDakIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEVBQUUsMkJBQTJCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLDhCQUE4QixDQUFDO29CQUM3SCxLQUFLLEVBQUUsQ0FBQztpQkFDUjthQUNELENBQUMsQ0FBQztRQUVKLENBQUM7S0FDRDtJQUVELElBQUEsdUNBQW9CLEVBQUMsd0JBQXdCLENBQUMsQ0FBQyJ9