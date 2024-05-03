/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRule = void 0;
    exports.findMatchingThemeRule = findMatchingThemeRule;
    function findMatchingThemeRule(theme, scopes, onlyColorRules = true) {
        for (let i = scopes.length - 1; i >= 0; i--) {
            const parentScopes = scopes.slice(0, i);
            const scope = scopes[i];
            const r = findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules);
            if (r) {
                return r;
            }
        }
        return null;
    }
    function findMatchingThemeRule2(theme, scope, parentScopes, onlyColorRules) {
        let result = null;
        // Loop backwards, to ensure the last most specific rule wins
        for (let i = theme.tokenColors.length - 1; i >= 0; i--) {
            const rule = theme.tokenColors[i];
            if (onlyColorRules && !rule.settings.foreground) {
                continue;
            }
            let selectors;
            if (typeof rule.scope === 'string') {
                selectors = rule.scope.split(/,/).map(scope => scope.trim());
            }
            else if (Array.isArray(rule.scope)) {
                selectors = rule.scope;
            }
            else {
                continue;
            }
            for (let j = 0, lenJ = selectors.length; j < lenJ; j++) {
                const rawSelector = selectors[j];
                const themeRule = new ThemeRule(rawSelector, rule.settings);
                if (themeRule.matches(scope, parentScopes)) {
                    if (themeRule.isMoreSpecific(result)) {
                        result = themeRule;
                    }
                }
            }
        }
        return result;
    }
    class ThemeRule {
        constructor(rawSelector, settings) {
            this.rawSelector = rawSelector;
            this.settings = settings;
            const rawSelectorPieces = this.rawSelector.split(/ /);
            this.scope = rawSelectorPieces[rawSelectorPieces.length - 1];
            this.parentScopes = rawSelectorPieces.slice(0, rawSelectorPieces.length - 1);
        }
        matches(scope, parentScopes) {
            return ThemeRule._matches(this.scope, this.parentScopes, scope, parentScopes);
        }
        static _cmp(a, b) {
            if (a === null && b === null) {
                return 0;
            }
            if (a === null) {
                // b > a
                return -1;
            }
            if (b === null) {
                // a > b
                return 1;
            }
            if (a.scope.length !== b.scope.length) {
                // longer scope length > shorter scope length
                return a.scope.length - b.scope.length;
            }
            const aParentScopesLen = a.parentScopes.length;
            const bParentScopesLen = b.parentScopes.length;
            if (aParentScopesLen !== bParentScopesLen) {
                // more parents > less parents
                return aParentScopesLen - bParentScopesLen;
            }
            for (let i = 0; i < aParentScopesLen; i++) {
                const aLen = a.parentScopes[i].length;
                const bLen = b.parentScopes[i].length;
                if (aLen !== bLen) {
                    return aLen - bLen;
                }
            }
            return 0;
        }
        isMoreSpecific(other) {
            return (ThemeRule._cmp(this, other) > 0);
        }
        static _matchesOne(selectorScope, scope) {
            const selectorPrefix = selectorScope + '.';
            if (selectorScope === scope || scope.substring(0, selectorPrefix.length) === selectorPrefix) {
                return true;
            }
            return false;
        }
        static _matches(selectorScope, selectorParentScopes, scope, parentScopes) {
            if (!this._matchesOne(selectorScope, scope)) {
                return false;
            }
            let selectorParentIndex = selectorParentScopes.length - 1;
            let parentIndex = parentScopes.length - 1;
            while (selectorParentIndex >= 0 && parentIndex >= 0) {
                if (this._matchesOne(selectorParentScopes[selectorParentIndex], parentScopes[parentIndex])) {
                    selectorParentIndex--;
                }
                parentIndex--;
            }
            if (selectorParentIndex === -1) {
                return true;
            }
            return false;
        }
    }
    exports.ThemeRule = ThemeRule;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVE1IZWxwZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9jb21tb24vVE1IZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxzREFVQztJQVZELFNBQWdCLHFCQUFxQixDQUFDLEtBQWtCLEVBQUUsTUFBZ0IsRUFBRSxpQkFBMEIsSUFBSTtRQUN6RyxLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM3QyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsTUFBTSxDQUFDLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDUCxPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7UUFDRixDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsU0FBUyxzQkFBc0IsQ0FBQyxLQUFrQixFQUFFLEtBQWEsRUFBRSxZQUFzQixFQUFFLGNBQXVCO1FBQ2pILElBQUksTUFBTSxHQUFxQixJQUFJLENBQUM7UUFFcEMsNkRBQTZEO1FBQzdELEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4RCxNQUFNLElBQUksR0FBRyxLQUFL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