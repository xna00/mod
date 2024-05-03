/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes"], function (require, exports, extHost_protocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostIssueReporter = void 0;
    class ExtHostIssueReporter {
        constructor(mainContext) {
            this._IssueUriRequestHandlers = new Map();
            this._IssueDataProviders = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadIssueReporter);
        }
        async $getIssueReporterUri(extensionId, token) {
            if (this._IssueUriRequestHandlers.size === 0) {
                throw new Error('No issue request handlers registered');
            }
            const provider = this._IssueUriRequestHandlers.get(extensionId);
            if (!provider) {
                throw new Error('Issue request handler not found');
            }
            const result = await provider.handleIssueUrlRequest();
            if (!result) {
                throw new Error('Issue request handler returned no result');
            }
            return result;
        }
        async $getIssueReporterData(extensionId, token) {
            if (this._IssueDataProviders.size === 0) {
                throw new Error('No issue request handlers registered');
            }
            const provider = this._IssueDataProviders.get(extensionId);
            if (!provider) {
                throw new Error('Issue data provider not found');
            }
            const result = await provider.provideIssueData(token);
            if (!result) {
                throw new Error('Issue data provider returned no result');
            }
            return result;
        }
        async $getIssueReporterTemplate(extensionId, token) {
            if (this._IssueDataProviders.size === 0) {
                throw new Error('No issue request handlers registered');
            }
            const provider = this._IssueDataProviders.get(extensionId);
            if (!provider) {
                throw new Error('Issue data provider not found');
            }
            const result = await provider.provideIssueTemplate(token);
            if (!result) {
                throw new Error('Issue template provider returned no result');
            }
            return result;
        }
        registerIssueUriRequestHandler(extension, provider) {
            const extensionId = extension.identifier.value;
            this._IssueUriRequestHandlers.set(extensionId, provider);
            this._proxy.$registerIssueUriRequestHandler(extensionId);
            return new extHostTypes_1.Disposable(() => {
                this._proxy.$unregisterIssueUriRequestHandler(extensionId);
                this._IssueUriRequestHandlers.delete(extensionId);
            });
        }
        registerIssueDataProvider(extension, provider) {
            const extensionId = extension.identifier.value;
            this._IssueDataProviders.set(extensionId, provider);
            this._proxy.$registerIssueDataProvider(extensionId);
            return new extHostTypes_1.Disposable(() => {
                this._proxy.$unregisterIssueDataProvider(extensionId);
                this._IssueDataProviders.delete(extensionId);
            });
        }
    }
    exports.ExtHostIssueReporter = ExtHostIssueReporter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdElzc3VlUmVwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RJc3N1ZVJlcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLG9CQUFvQjtRQU1oQyxZQUNDLFdBQXlCO1lBTmxCLDZCQUF3QixHQUF3QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzFFLHdCQUFtQixHQUFtQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBT3ZFLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDekUsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxXQUFtQixFQUFFLEtBQXdCO1lBQ3ZFLElBQUksSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUM3RCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQs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