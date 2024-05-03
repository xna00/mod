/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/cancellation", "vs/base/common/errors", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/base/common/async"], function (require, exports, resources, uri_1, cancellation_1, errors, instantiation_1, queryBuilder_1, search_1, workspace_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkActivateWorkspaceContainsExtension = checkActivateWorkspaceContainsExtension;
    exports.checkGlobFileExists = checkGlobFileExists;
    const WORKSPACE_CONTAINS_TIMEOUT = 7000;
    function checkActivateWorkspaceContainsExtension(host, desc) {
        const activationEvents = desc.activationEvents;
        if (!activationEvents) {
            return Promise.resolve(undefined);
        }
        const fileNames = [];
        const globPatterns = [];
        for (const activationEvent of activationEvents) {
            if (/^workspaceContains:/.test(activationEvent)) {
                const fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0 || host.forceUsingSearch) {
                    globPatterns.push(fileNameOrGlob);
                }
                else {
                    fileNames.push(fileNameOrGlob);
                }
            }
        }
        if (fileNames.length === 0 && globPatterns.length === 0) {
            return Promise.resolve(undefined);
        }
        const { promise, resolve } = (0, async_1.promiseWithResolvers)();
        const activate = (activationEvent) => resolve({ activationEvent });
        const fileNamePromise = Promise.all(fileNames.map((fileName) => _activateIfFileName(host, fileName, activate))).then(() => { });
        const globPatternPromise = _activateIfGlobPatterns(host, desc.identifier, globPatterns, activate);
        Promise.all([fileNamePromise, globPatternPromise]).then(() => {
            // when all are done, resolve with undefined (relevant only if it was not activated so far)
            resolve(undefined);
        });
        return promise;
    }
    async function _activateIfFileName(host, fileName, activate) {
        // find exact path
        for (const uri of host.folders) {
            if (await host.exists(resources.joinPath(uri_1.URI.revive(uri), fileName))) {
                // the file was found
                activate(`workspaceContains:${fileName}`);
                return;
            }
        }
    }
    async function _activateIfGlobPatterns(host, extensionId, globPatterns, activate) {
        if (globPatterns.length === 0) {
            return Promise.resolve(undefined);
        }
        const tokenSource = new cancellation_1.CancellationTokenSource();
        const searchP = host.checkExists(host.folders, globPatterns, tokenSource.token);
        const timer = setTimeout(async () => {
            tokenSource.cancel();
            host.logService.info(`Not activating extension '${extensionId.value}': Timed out while searching for 'workspaceContains' pattern ${globPatterns.join(',')}`);
        }, WORKSPACE_CONTAINS_TIMEOUT);
        let exists = false;
        try {
            exists = await searchP;
        }
        catch (err) {
            if (!errors.isCancellationError(err)) {
                errors.onUnexpectedError(err);
            }
        }
        tokenSource.dispose();
        clearTimeout(timer);
        if (exists) {
            // a file was found matching one of the glob patterns
            activate(`workspaceContains:${globPatterns.join(',')}`);
        }
    }
    function checkGlobFileExists(accessor, folders, includes, token) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const searchService = accessor.get(search_1.ISearchService);
        const queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        const query = queryBuilder.file(folders.map(folder => (0, workspace_1.toWorkspaceFolder)(uri_1.URI.revive(folder))), {
            _reason: 'checkExists',
            includePattern: includes,
            exists: true
        });
        return searchService.fileSearch(query, token).then(result => {
            return !!result.limitHit;
        }, err => {
            if (!errors.isCancellationError(err)) {
                return Promise.reject(err);
            }
            return false;
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlQ29udGFpbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi93b3Jrc3BhY2VDb250YWlucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQTZCaEcsMEZBb0NDO0lBNENELGtEQTBCQztJQXpIRCxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQztJQWV4QyxTQUFnQix1Q0FBdUMsQ0FBQyxJQUE4QixFQUFFLElBQTJCO1FBQ2xILE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQy9DLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQWEsRUFBRSxDQUFDO1FBQy9CLE1BQU0sWUFBWSxHQUFhLEVBQUUsQ0FBQztRQUVsQyxLQUFLLE1BQU0sZUFBZSxJQUFJLGdCQUFnQixFQUFFLENBQUM7WUFDaEQsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxjQUFjLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDM0UsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDbkcsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFNBQVMsQ0FB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