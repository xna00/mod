/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/ternarySearchTree"], function (require, exports, filters_1, glob_1, strings, resources_1, ternarySearchTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterOptions = exports.ResourceGlobMatcher = void 0;
    class ResourceGlobMatcher {
        constructor(globalExpression, rootExpressions, uriIdentityService) {
            this.globalExpression = (0, glob_1.parse)(globalExpression);
            this.expressionsByRoot = ternarySearchTree_1.TernarySearchTree.forUris(uri => uriIdentityService.extUri.ignorePathCasing(uri));
            for (const expression of rootExpressions) {
                this.expressionsByRoot.set(expression.root, { root: expression.root, expression: (0, glob_1.parse)(expression.expression) });
            }
        }
        matches(resource) {
            const rootExpression = this.expressionsByRoot.findSubstr(resource);
            if (rootExpression) {
                const path = (0, resources_1.relativePath)(rootExpression.root, resource);
                if (path && !!rootExpression.expression(path)) {
                    return true;
                }
            }
            return !!this.globalExpression(resource.path);
        }
    }
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
    class FilterOptions {
        static { this._filter = filters_1.matchesFuzzy2; }
        static { this._messageFilter = filters_1.matchesFuzzy; }
        static EMPTY(uriIdentityService) { return new FilterOptions('', [], false, false, false, uriIdentityService); }
        constructor(filter, filesExclude, showWarnings, showErrors, showInfos, uriIdentityService) {
            this.filter = filter;
            this.showWarnings = false;
            this.showErrors = false;
            this.showInfos = false;
            filter = filter.trim();
            this.showWarnings = showWarnings;
            this.showErrors = showErrors;
            this.showInfos = showInfos;
            const filesExcludeByRoot = Array.isArray(filesExclude) ? filesExclude : [];
            const excludesExpression = Array.isArray(filesExclude) ? (0, glob_1.getEmptyExpression)() : filesExclude;
            for (const { expression } of filesExcludeByRoot) {
                for (const pattern of Object.keys(expression)) {
                    if (!pattern.endsWith('/**')) {
                        // Append `/**` to pattern to match a parent folder #103631
                        expression[`${strings.rtrim(pattern, '/')}/**`] = expression[pattern];
                    }
                }
            }
            const negate = filter.startsWith('!');
            this.textFilter = { text: (negate ? strings.ltrim(filter, '!') : filter).trim(), negate };
            const includeExpression = (0, glob_1.getEmptyExpression)();
            if (filter) {
                const filters = (0, glob_1.splitGlobAware)(filter, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    if (f.startsWith('!')) {
                        const filterText = strings.ltrim(f, '!');
                        if (filterText) {
                            this.setPattern(excludesExpression, filterText);
                        }
                    }
                    else {
                        this.setPattern(includeExpression, f);
                    }
                }
            }
            this.excludesMatcher = new ResourceGlobMatcher(excludesExpression, filesExcludeByRoot, uriIdentityService);
            this.includesMatcher = new ResourceGlobMatcher(includeExpression, [], uriIdentityService);
        }
        setPattern(expression, pattern) {
            if (pattern[0] === '.') {
                pattern = '*' + pattern; // convert ".js" to "*.js"
            }
            expression[`**/${pattern}/**`] = true;
            expression[`**/${pattern}`] = true;
        }
    }
    exports.FilterOptions = FilterOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc0ZpbHRlck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvYnJvd3Nlci9tYXJrZXJzRmlsdGVyT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxtQkFBbUI7UUFLL0IsWUFDQyxnQkFBNkIsRUFDN0IsZUFBeUQsRUFDekQsa0JBQXVDO1lBRXZDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFBLFlBQUssRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxxQ0FBaUIsQ0FBQyxPQUFPLENBQThDLEdBQUcsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEosS0FBSyxNQUFNLFVBQVUsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUEsWUFBSyxFQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEgsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLENBQUMsUUFBYTtZQUNwQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25FLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUEsd0JBQVksRUFBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLElBQUks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