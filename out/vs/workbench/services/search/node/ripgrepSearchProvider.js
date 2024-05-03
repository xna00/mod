/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/workbench/services/search/node/ripgrepTextSearchEngine", "vs/platform/progress/common/progress", "vs/base/common/network"], function (require, exports, cancellation_1, ripgrepTextSearchEngine_1, progress_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RipgrepSearchProvider = void 0;
    class RipgrepSearchProvider {
        constructor(outputChannel) {
            this.outputChannel = outputChannel;
            this.inProgress = new Set();
            process.once('exit', () => this.dispose());
        }
        provideTextSearchResults(query, options, progress, token) {
            const engine = new ripgrepTextSearchEngine_1.RipgrepTextSearchEngine(this.outputChannel);
            if (options.folder.scheme === network_1.Schemas.vscodeUserData) {
                // Ripgrep search engine can only provide file-scheme results, but we want to use it to search some schemes that are backed by the filesystem, but with some other provider as the frontend,
                // case in point vscode-userdata. In these cases we translate the query to a file, and translate the results back to the frontend scheme.
                const translatedOptions = { ...options, folder: options.folder.with({ scheme: network_1.Schemas.file }) };
                const progressTranslator = new progress_1.Progress(data => progress.report({ ...data, uri: data.uri.with({ scheme: options.folder.scheme }) }));
                return this.withToken(token, token => engine.provideTextSearchResults(query, translatedOptions, progressTranslator, token));
            }
            else {
                return this.withToken(token, token => engine.provideTextSearchResults(query, options, progress, token));
            }
        }
        async withToken(token, fn) {
            const merged = mergedTokenSource(token);
            this.inProgress.add(merged);
            const result = await fn(merged.token);
            this.inProgress.delete(merged);
            return result;
        }
        dispose() {
            this.inProgress.forEach(engine => engine.cancel());
        }
    }
    exports.RipgrepSearchProvider = RipgrepSearchProvider;
    function mergedTokenSource(token) {
        const tokenSource = new cancellation_1.CancellationTokenSource();
        token.onCancellationRequested(() => tokenSource.cancel());
        return tokenSource;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlwZ3JlcFNlYXJjaFByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL25vZGUvcmlwZ3JlcFNlYXJjaFByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHFCQUFxQjtRQUdqQyxZQUFvQixhQUE0QjtZQUE1QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUZ4QyxlQUFVLEdBQWlDLElBQUksR0FBRyxFQUFFLENBQUM7WUFHNUQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELHdCQUF3QixDQUFDLEtBQXNCLEVBQUUsT0FBMEIsRUFBRSxRQUFvQyxFQUFFLEtBQXdCO1lBQzFJLE1BQU0sTUFBTSxHQUFHLElBQUksaURBQXVCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9ELElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDdEQsNExBQTRMO2dCQUM1TCx5SUFBeUk7Z0JBQ3pJLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hHLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxtQkFBUSxDQUFtQixJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2SixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzdILENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekcsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsU0FBUyxDQUFJLEtBQXdCLEVBQUUsRUFBNEM7WUFDaEcsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRS9CLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLE9BQU87WUFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7S0FDRDtJQWhDRCxzREFnQ0M7SUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQXdCO1FBQ2xELE1BQU0sV0FBVyxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztRQUNsRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFMUQsT0FBTyxXQUFXLENBQUM7SUFDcEIsQ0FBQyJ9