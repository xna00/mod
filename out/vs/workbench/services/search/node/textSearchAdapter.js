/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/pfs", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, pfs, ripgrepTextSearchEngine_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextSearchEngineAdapter = void 0;
    class TextSearchEngineAdapter {
        constructor(query) {
            this.query = query;
        }
        search(token, onResult, onMessage) {
            if ((!this.query.folderQueries || !this.query.folderQueries.length) && (!this.query.extraFileResources || !this.query.extraFileResources.length)) {
                return Promise.resolve({
                    type: 'success',
                    limitHit: false,
                    stats: {
                        type: 'searchProcess'
                    }
                });
            }
            const pretendOutputChannel = {
                appendLine(msg) {
                    onMessage({ message: msg });
                }
            };
            const textSearchManager = new textSearchManager_1.NativeTextSearchManager(this.query, new ripgrepTextSearchEngine_1.RipgrepTextSearchEngine(pretendOutputChannel), pfs);
            return new Promise((resolve, reject) => {
                return textSearchManager
                    .search(matches => {
                    onResult(matches.map(fileMatchToSerialized));
                }, token)
                    .then(c => resolve({ limitHit: c.limitHit, type: 'success', stats: c.stats }), reject);
            });
        }
    }
    exports.TextSearchEngineAdapter = TextSearchEngineAdapter;
    function fileMatchToSerialized(match) {
        return {
            path: match.resource && match.resource.fsPath,
            results: match.results,
            numMatches: (match.results || []).reduce((sum, r) => {
                if (!!r.ranges) {
                    const m = r;
                    return sum + (Array.isArray(m.ranges) ? m.ranges.length : 1);
                }
                else {
                    return sum + 1;
                }
            }, 0)
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaEFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWFyY2gvbm9kZS90ZXh0U2VhcmNoQWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx1QkFBdUI7UUFFbkMsWUFBb0IsS0FBaUI7WUFBakIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFJLENBQUM7UUFFMUMsTUFBTSxDQUFDLEtBQXdCLEVBQUUsUUFBbUQsRUFBRSxTQUE4QztZQUNuSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUNsSixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQTJCO29CQUNoRCxJQUFJLEVBQUUsU0FBUztvQkFDZixRQUFRLEVBQUUsS0FBSztvQkFDZixLQUFLLEVBQW9CO3dCQUN4QixJQUFJLEVBQUUsZUFBZTtxQkFDckI7aUJBQ0QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUc7Z0JBQzVCLFVBQVUsQ0FBQyxHQUFXO29CQUNyQixTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDN0IsQ0FBQzthQUNELENBQUM7WUFDRixNQUFNLGlCQUFpQixHQUFHLElBQUksMkNBQXVCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLGlEQUF1QixDQUFDLG9CQUFvQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDMUgsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDdEMsT0FBTyxpQkFBaUI7cUJBQ3RCLE1BQU0sQ0FDTixPQUFPLENBQUMsRUFBRTtvQkFDVCxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7Z0JBQzlDLENBQUMsRUFDRCxLQUFLLENBQUM7cUJBQ04sSUFBSSxDQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBOEIsQ0FBQyxFQUNuRyxNQUFNLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBakNELDBEQWlDQztJQUVELFNBQVMscUJBQXFCLENBQUMsS0FBaUI7UUFDL0MsT0FBTztZQUNOLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTTtZQUM3QyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDdEIsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxDQUFvQixDQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxHQUFxQixDQUFDLENBQUM7b0JBQzlCLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsQ0FBQztZQUNGLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDTCxDQUFDO0lBQ0gsQ0FBQyJ9