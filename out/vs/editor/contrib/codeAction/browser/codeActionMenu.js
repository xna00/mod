/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/base/common/hierarchicalKind", "vs/base/browser/ui/codicons/codiconStyles", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, codicons_1, types_1, nls_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toMenuItems = toMenuItems;
    const uncategorizedCodeActionGroup = Object.freeze({ kind: hierarchicalKind_1.HierarchicalKind.Empty, title: (0, nls_1.localize)('codeAction.widget.id.more', 'More Actions...') });
    const codeActionGroups = Object.freeze([
        { kind: types_1.CodeActionKind.QuickFix, title: (0, nls_1.localize)('codeAction.widget.id.quickfix', 'Quick Fix') },
        { kind: types_1.CodeActionKind.RefactorExtract, title: (0, nls_1.localize)('codeAction.widget.id.extract', 'Extract'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorInline, title: (0, nls_1.localize)('codeAction.widget.id.inline', 'Inline'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorRewrite, title: (0, nls_1.localize)('codeAction.widget.id.convert', 'Rewrite'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.RefactorMove, title: (0, nls_1.localize)('codeAction.widget.id.move', 'Move'), icon: codicons_1.Codicon.wrench },
        { kind: types_1.CodeActionKind.SurroundWith, title: (0, nls_1.localize)('codeAction.widget.id.surround', 'Surround With'), icon: codicons_1.Codicon.surroundWith },
        { kind: types_1.CodeActionKind.Source, title: (0, nls_1.localize)('codeAction.widget.id.source', 'Source Action'), icon: codicons_1.Codicon.symbolFile },
        uncategorizedCodeActionGroup,
    ]);
    function toMenuItems(inputCodeActions, showHeaders, keybindingResolver) {
        if (!showHeaders) {
            return inputCodeActions.map((action) => {
                return {
                    kind: "action" /* ActionListItemKind.Action */,
                    item: action,
                    group: uncategorizedCodeActionGroup,
                    disabled: !!action.action.disabled,
                    label: action.action.disabled || action.action.title,
                    canPreview: !!action.action.edit?.edits.length,
                };
            });
        }
        // Group code actions
        const menuEntries = codeActionGroups.map(group => ({ group, actions: [] }));
        for (const action of inputCodeActions) {
            const kind = action.action.kind ? new hierarchicalKind_1.HierarchicalKind(action.action.kind) : hierarchicalKind_1.HierarchicalKind.None;
            for (const menuEntry of menuEntries) {
                if (menuEntry.group.kind.contains(kind)) {
                    menuEntry.actions.push(action);
                    break;
                }
            }
        }
        const allMenuItems = [];
        for (const menuEntry of menuEntries) {
            if (menuEntry.actions.length) {
                allMenuItems.push({ kind: "header" /* ActionListItemKind.Header */, group: menuEntry.group });
                for (const action of menuEntry.actions) {
                    const group = menuEntry.group;
                    allMenuItems.push({
                        kind: "action" /* ActionListItemKind.Action */,
                        item: action,
                        group: action.action.isAI ? { title: group.title, kind: group.kind, icon: codicons_1.Codicon.sparkle } : group,
                        label: action.action.title,
                        disabled: !!action.action.disabled,
                        keybinding: keybindingResolver(action.action),
                    });
                }
            }
        }
        return allMenuItems;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbk1lbnUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVBY3Rpb24vYnJvd3Nlci9jb2RlQWN0aW9uTWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdDaEcsa0NBaURDO0lBOURELE1BQU0sNEJBQTRCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBYyxFQUFFLElBQUksRUFBRSxtQ0FBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRW5LLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBZ0I7UUFDckQsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLFdBQVcsQ0FBQyxFQUFFO1FBQ2hHLEVBQUUsSUFBSSxFQUFFLHNCQUFjLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyw4QkFBOEIsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxNQUFNLEVBQUU7UUFDMUgsRUFBRSxJQUFJLEVBQUUsc0JBQWMsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRTtRQUN2SCxFQUFFLElBQUksRUFBRSxzQkFBYyxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFPLENBQUMsTUFBTSxFQUFFO1FBQzFILEVB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