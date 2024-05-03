/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/hierarchicalKind"], function (require, exports, errors_1, hierarchicalKind_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionItem = exports.CodeActionCommandArgs = exports.CodeActionTriggerSource = exports.CodeActionAutoApply = exports.CodeActionKind = void 0;
    exports.mayIncludeActionsOfKind = mayIncludeActionsOfKind;
    exports.filtersAction = filtersAction;
    exports.CodeActionKind = new class {
        constructor() {
            this.QuickFix = new hierarchicalKind_1.HierarchicalKind('quickfix');
            this.Refactor = new hierarchicalKind_1.HierarchicalKind('refactor');
            this.RefactorExtract = this.Refactor.append('extract');
            this.RefactorInline = this.Refactor.append('inline');
            this.RefactorMove = this.Refactor.append('move');
            this.RefactorRewrite = this.Refactor.append('rewrite');
            this.Notebook = new hierarchicalKind_1.HierarchicalKind('notebook');
            this.Source = new hierarchicalKind_1.HierarchicalKind('source');
            this.SourceOrganizeImports = this.Source.append('organizeImports');
            this.SourceFixAll = this.Source.append('fixAll');
            this.SurroundWith = this.Refactor.append('surround');
        }
    };
    var CodeActionAutoApply;
    (function (CodeActionAutoApply) {
        CodeActionAutoApply["IfSingle"] = "ifSingle";
        CodeActionAutoApply["First"] = "first";
        CodeActionAutoApply["Never"] = "never";
    })(CodeActionAutoApply || (exports.CodeActionAutoApply = CodeActionAutoApply = {}));
    var CodeActionTriggerSource;
    (function (CodeActionTriggerSource) {
        CodeActionTriggerSource["Refactor"] = "refactor";
        CodeActionTriggerSource["RefactorPreview"] = "refactor preview";
        CodeActionTriggerSource["Lightbulb"] = "lightbulb";
        CodeActionTriggerSource["Default"] = "other (default)";
        CodeActionTriggerSource["SourceAction"] = "source action";
        CodeActionTriggerSource["QuickFix"] = "quick fix action";
        CodeActionTriggerSource["FixAll"] = "fix all";
        CodeActionTriggerSource["OrganizeImports"] = "organize imports";
        CodeActionTriggerSource["AutoFix"] = "auto fix";
        CodeActionTriggerSource["QuickFixHover"] = "quick fix hover window";
        CodeActionTriggerSource["OnSave"] = "save participants";
        CodeActionTriggerSource["ProblemsView"] = "problems view";
    })(CodeActionTriggerSource || (exports.CodeActionTriggerSource = CodeActionTriggerSource = {}));
    function mayIncludeActionsOfKind(filter, providedKind) {
        // A provided kind may be a subset or superset of our filtered kind.
        if (filter.include && !filter.include.intersects(providedKind)) {
            return false;
        }
        if (filter.excludes) {
            if (filter.excludes.some(exclude => excludesAction(providedKind, exclude, filter.include))) {
                return false;
            }
        }
        // Don't return source actions unless they are explicitly requested
        if (!filter.includeSourceActions && exports.CodeActionKind.Source.contains(providedKind)) {
            return false;
        }
        return true;
    }
    function filtersAction(filter, action) {
        const actionKind = action.kind ? new hierarchicalKind_1.HierarchicalKind(action.kind) : undefined;
        // Filter out actions by kind
        if (filter.include) {
            if (!actionKind || !filter.include.contains(actionKind)) {
                return false;
            }
        }
        if (filter.excludes) {
            if (actionKind && filter.excludes.some(exclude => excludesAction(actionKind, exclude, filter.include))) {
                return false;
            }
        }
        // Don't return source actions unless they are explicitly requested
        if (!filter.includeSourceActions) {
            if (actionKind && exports.CodeActionKind.Source.contains(actionKind)) {
                return false;
            }
        }
        if (filter.onlyIncludePreferredActions) {
            if (!action.isPreferred) {
                return false;
            }
        }
        return true;
    }
    function excludesAction(providedKind, exclude, include) {
        if (!exclude.contains(providedKind)) {
            return false;
        }
        if (include && exclude.contains(include)) {
            // The include is more specific, don't filter out
            return false;
        }
        return true;
    }
    class CodeActionCommandArgs {
        static fromUser(arg, defaults) {
            if (!arg || typeof arg !== 'object') {
                return new CodeActionCommandArgs(defaults.kind, defaults.apply, false);
            }
            return new CodeActionCommandArgs(CodeActionCommandArgs.getKindFromUser(arg, defaults.kind), CodeActionCommandArgs.getApplyFromUser(arg, defaults.apply), CodeActionCommandArgs.getPreferredUser(arg));
        }
        static getApplyFromUser(arg, defaultAutoApply) {
            switch (typeof arg.apply === 'string' ? arg.apply.toLowerCase() : '') {
                case 'first': return "first" /* CodeActionAutoApply.First */;
                case 'never': return "never" /* CodeActionAutoApply.Never */;
                case 'ifsingle': return "ifSingle" /* CodeActionAutoApply.IfSingle */;
                default: return defaultAutoApply;
            }
        }
        static getKindFromUser(arg, defaultKind) {
            return typeof arg.kind === 'string'
                ? new hierarchicalKind_1.HierarchicalKind(arg.kind)
                : defaultKind;
        }
        static getPreferredUser(arg) {
            return typeof arg.preferred === 'boolean'
                ? arg.preferred
                : false;
        }
        constructor(kind, apply, preferred) {
            this.kind = kind;
            this.apply = apply;
            this.preferred = preferred;
        }
    }
    exports.CodeActionCommandArgs = CodeActionCommandArgs;
    class CodeActionItem {
        constructor(action, provider, highlightRange) {
            this.action = action;
            this.provider = provider;
            this.highlightRange = highlightRange;
        }
        async resolve(token) {
            if (this.provider?.resolveCodeAction && !this.action.edit) {
                let action;
                try {
                    action = await this.provider.resolveCodeAction(this.action, token);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
                if (action) {
                    this.action.edit = action.edit;
                }
            }
            return this;
        }
    }
    exports.CodeActionItem = CodeActionItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvZGVBY3Rpb24vY29tbW9uL3R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNEaEcsMERBa0JDO0lBRUQsc0NBOEJDO0lBL0ZZLFFBQUEsY0FBYyxHQUFHLElBQUk7UUFBQTtZQUNqQixhQUFRLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU1QyxhQUFRLEdBQUcsSUFBSSxtQ0FBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM1QyxvQkFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsaUJBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxvQkFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWxELGFBQVEsR0FBRyxJQUFJLG1DQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTVDLFdBQU0sR0FBRyxJQUFJLG1DQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hDLDBCQUFxQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDOUQsaUJBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxpQkFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7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