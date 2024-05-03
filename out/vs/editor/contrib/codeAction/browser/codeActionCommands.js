/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hierarchicalKind", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/codeAction/browser/codeAction", "vs/nls", "vs/platform/contextkey/common/contextkey", "../common/types", "./codeActionController", "./codeActionModel"], function (require, exports, hierarchicalKind_1, strings_1, editorExtensions_1, editorContextKeys_1, codeAction_1, nls, contextkey_1, types_1, codeActionController_1, codeActionModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AutoFixAction = exports.FixAllAction = exports.OrganizeImportsAction = exports.SourceAction = exports.RefactorAction = exports.CodeActionCommand = exports.QuickFixAction = void 0;
    function contextKeyForSupportedActions(kind) {
        return contextkey_1.ContextKeyExpr.regex(codeActionModel_1.SUPPORTED_CODE_ACTIONS.keys()[0], new RegExp('(\\s|^)' + (0, strings_1.escapeRegExpCharacters)(kind.value) + '\\b'));
    }
    const argsSchema = {
        type: 'object',
        defaultSnippets: [{ body: { kind: '' } }],
        properties: {
            'kind': {
                type: 'string',
                description: nls.localize('args.schema.kind', "Kind of the code action to run."),
            },
            'apply': {
                type: 'string',
                description: nls.localize('args.schema.apply', "Controls when the returned actions are applied."),
                default: "ifSingle" /* CodeActionAutoApply.IfSingle */,
                enum: ["first" /* CodeActionAutoApply.First */, "ifSingle" /* CodeActionAutoApply.IfSingle */, "never" /* CodeActionAutoApply.Never */],
                enumDescriptions: [
                    nls.localize('args.schema.apply.first', "Always apply the first returned code action."),
                    nls.localize('args.schema.apply.ifSingle', "Apply the first returned code action if it is the only one."),
                    nls.localize('args.schema.apply.never', "Do not apply the returned code actions."),
                ]
            },
            'preferred': {
                type: 'boolean',
                default: false,
                description: nls.localize('args.schema.preferred', "Controls if only preferred code actions should be returned."),
            }
        }
    };
    function triggerCodeActionsForEditorSelection(editor, notAvailableMessage, filter, autoApply, triggerAction = types_1.CodeActionTriggerSource.Default) {
        if (editor.hasModel()) {
            const controller = codeActionController_1.CodeActionController.get(editor);
            controller?.manualTriggerAtCurrentPosition(notAvailableMessage, triggerAction, filter, autoApply);
        }
    }
    class QuickFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.quickFixCommandId,
                label: nls.localize('quickfix.trigger.label', "Quick Fix..."),
                alias: 'Quick Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.quickFix.noneMessage', "No code actions available"), undefined, undefined, types_1.CodeActionTriggerSource.QuickFix);
        }
    }
    exports.QuickFixAction = QuickFixAction;
    class CodeActionCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: codeAction_1.codeActionCommandId,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                metadata: {
                    description: 'Trigger a code action',
                    args: [{ name: 'args', schema: argsSchema, }]
                }
            });
        }
        runEditorCommand(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: hierarchicalKind_1.HierarchicalKind.Empty,
                apply: "ifSingle" /* CodeActionAutoApply.IfSingle */,
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred.kind', "No preferred code actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.codeAction.noneMessage.kind', "No code actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.codeAction.noneMessage.preferred', "No preferred code actions available")
                    : nls.localize('editor.action.codeAction.noneMessage', "No code actions available"), {
                include: args.kind,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply);
        }
    }
    exports.CodeActionCommand = CodeActionCommand;
    class RefactorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.refactorCommandId,
                label: nls.localize('refactor.label', "Refactor..."),
                alias: 'Refactor...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Refactor)),
                },
                metadata: {
                    description: 'Refactor...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Refactor,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred.kind', "No preferred refactorings for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.refactor.noneMessage.kind', "No refactorings for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.refactor.noneMessage.preferred', "No preferred refactorings available")
                    : nls.localize('editor.action.refactor.noneMessage', "No refactorings available"), {
                include: types_1.CodeActionKind.Refactor.contains(args.kind) ? args.kind : hierarchicalKind_1.HierarchicalKind.None,
                onlyIncludePreferredActions: args.preferred
            }, args.apply, types_1.CodeActionTriggerSource.Refactor);
        }
    }
    exports.RefactorAction = RefactorAction;
    class SourceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.sourceActionCommandId,
                label: nls.localize('source.label', "Source Action..."),
                alias: 'Source Action...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasCodeActionsProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 2.1,
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.Source)),
                },
                metadata: {
                    description: 'Source Action...',
                    args: [{ name: 'args', schema: argsSchema }]
                }
            });
        }
        run(_accessor, editor, userArgs) {
            const args = types_1.CodeActionCommandArgs.fromUser(userArgs, {
                kind: types_1.CodeActionKind.Source,
                apply: "never" /* CodeActionAutoApply.Never */
            });
            return triggerCodeActionsForEditorSelection(editor, typeof userArgs?.kind === 'string'
                ? args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred.kind', "No preferred source actions for '{0}' available", userArgs.kind)
                    : nls.localize('editor.action.source.noneMessage.kind', "No source actions for '{0}' available", userArgs.kind)
                : args.preferred
                    ? nls.localize('editor.action.source.noneMessage.preferred', "No preferred source actions available")
                    : nls.localize('editor.action.source.noneMessage', "No source actions available"), {
                include: types_1.CodeActionKind.Source.contains(args.kind) ? args.kind : hierarchicalKind_1.HierarchicalKind.None,
                includeSourceActions: true,
                onlyIncludePreferredActions: args.preferred,
            }, args.apply, types_1.CodeActionTriggerSource.SourceAction);
        }
    }
    exports.SourceAction = SourceAction;
    class OrganizeImportsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.organizeImportsCommandId,
                label: nls.localize('organizeImports.label', "Organize Imports"),
                alias: 'Organize Imports',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceOrganizeImports)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 45 /* KeyCode.KeyO */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.organize.noneMessage', "No organize imports action available"), { include: types_1.CodeActionKind.SourceOrganizeImports, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.OrganizeImports);
        }
    }
    exports.OrganizeImportsAction = OrganizeImportsAction;
    class FixAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.fixAllCommandId,
                label: nls.localize('fixAll.label', "Fix All"),
                alias: 'Fix All',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.SourceFixAll))
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('fixAll.noneMessage', "No fix all action available"), { include: types_1.CodeActionKind.SourceFixAll, includeSourceActions: true }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.FixAll);
        }
    }
    exports.FixAllAction = FixAllAction;
    class AutoFixAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: codeAction_1.autoFixCommandId,
                label: nls.localize('autoFix.label', "Auto Fix..."),
                alias: 'Auto Fix...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextKeyForSupportedActions(types_1.CodeActionKind.QuickFix)),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.Period */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 89 /* KeyCode.Period */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            return triggerCodeActionsForEditorSelection(editor, nls.localize('editor.action.autoFix.noneMessage', "No auto fixes available"), {
                include: types_1.CodeActionKind.QuickFix,
                onlyIncludePreferredActions: true
            }, "ifSingle" /* CodeActionAutoApply.IfSingle */, types_1.CodeActionTriggerSource.AutoFix);
        }
    }
    exports.AutoFixAction = AutoFixAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUFjdGlvbkNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2RlQWN0aW9uL2Jyb3dzZXIvY29kZUFjdGlvbkNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsU0FBUyw2QkFBNkIsQ0FBQyxJQUFzQjtRQUM1RCxPQUFPLDJCQUFjLENBQUMsS0FBSyxDQUMxQix3Q0FBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDaEMsSUFBSSxNQUFNLENBQUMsU0FBUyxHQUFHLElBQUEsZ0NBQXNCLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFnQjtRQUMvQixJQUFJLEVBQUUsUUFBUTtRQUNkLGVBQWUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDekMsVUFBVSxFQUFFO1lBQ1gsTUFBTSxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixFQUFFLGlDQUFpQyxDQUFDO2FBQ2hGO1lBQ0QsT0FBTyxFQUFFO2dCQUNSLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLGlEQUFpRCxDQUFDO2dCQUNqRyxPQUFPLCtDQUE4QjtnQkFDckMsSUFBSSxFQUFFLGlJQUFvRjtnQkFDMUYsZ0JBQWdCLEVBQUU7b0JBQ2pCLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUsOENBQThDLENBQUM7b0JBQ3ZGLEdBQUcsQ0FBQyxRQUFRLENBQUMs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