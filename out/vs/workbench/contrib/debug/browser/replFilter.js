/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/glob", "vs/workbench/contrib/debug/common/replModel", "vs/workbench/contrib/debug/common/debugModel"], function (require, exports, filters_1, glob_1, replModel_1, debugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplFilter = void 0;
    class ReplFilter {
        constructor() {
            this._parsedQueries = [];
        }
        static { this.matchQuery = filters_1.matchesFuzzy; }
        set filterQuery(query) {
            this._parsedQueries = [];
            query = query.trim();
            if (query && query !== '') {
                const filters = (0, glob_1.splitGlobAware)(query, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    if (f.startsWith('!')) {
                        this._parsedQueries.push({ type: 'exclude', query: f.slice(1) });
                    }
                    else {
                        this._parsedQueries.push({ type: 'include', query: f });
                    }
                }
            }
        }
        filter(element, parentVisibility) {
            if (element instanceof replModel_1.ReplEvaluationInput || element instanceof replModel_1.ReplEvaluationResult || element instanceof debugModel_1.Variable) {
                // Only filter the output events, everything else is visible https://github.com/microsoft/vscode/issues/105863
                return 1 /* TreeVisibility.Visible */;
            }
            let includeQueryPresent = false;
            let includeQueryMatched = false;
            const text = element.toString(true);
            for (const { type, query } of this._parsedQueries) {
                if (type === 'exclude' && ReplFilter.matchQuery(query, text)) {
                    // If exclude query matches, ignore all other queries and hide
                    return false;
                }
                else if (type === 'include') {
                    includeQueryPresent = true;
                    if (ReplFilter.matchQuery(query, text)) {
                        includeQueryMatched = true;
                    }
                }
            }
            return includeQueryPresent ? includeQueryMatched : (typeof parentVisibility !== 'undefined' ? parentVisibility : 1 /* TreeVisibility.Visible */);
        }
    }
    exports.ReplFilter = ReplFilter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbEZpbHRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9yZXBsRmlsdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyxNQUFhLFVBQVU7UUFBdkI7WUFJUyxtQkFBYyxHQUFrQixFQUFFLENBQUM7UUEwQzVDLENBQUM7aUJBNUNPLGVBQVUsR0FBRyxzQkFBWSxBQUFmLENBQWdCO1FBR2pDLElBQUksV0FBVyxDQUFDLEtBQWE7WUFDNUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFDekIsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUVyQixJQUFJLEtBQUssSUFBSSxLQUFLLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLElBQUEscUJBQWMsRUFBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEYsS0FBSyxNQUFNLENBQUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xFLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3pELENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQXFCLEVBQUUsZ0JBQWdDO1lBQzdELElBQUksT0FBTyxZQUFZLCtCQUFtQixJQUFJLE9BQU8sWUFBWSxnQ0FBb0IsSUFBSSxPQUFPLFlBQVkscUJBQVEsRUFBRSxDQUFDO2dCQUN0SCw4R0FBOEc7Z0JBQzlHLHNDQUE4QjtZQUMvQixDQUFDO1lBRUQsSUFBSSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFDaEMsSUFBSSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7WUFFaEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVwQyxLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNuRCxJQUFJLElBQUksS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDOUQsOERBQThEO29CQUM5RCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO3FCQUFNLElBQUksSUFBSSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUMvQixtQkFBbUIsR0FBRyxJQUFJLENBQUM7b0JBQzNCLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDeEMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO29CQUM1QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsK0JBQXVCLENBQUMsQ0FBQztRQUMxSSxDQUFDOztJQTdDRixnQ0E4Q0MifQ==