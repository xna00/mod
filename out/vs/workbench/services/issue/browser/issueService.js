/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/issue/common/issueReporterUtil", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, dom, cancellation_1, lifecycle_1, platform_1, issueReporterUtil_1, log_1, productService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebIssueService = void 0;
    let WebIssueService = class WebIssueService {
        constructor(extensionService, productService, logService) {
            this.extensionService = extensionService;
            this.productService = productService;
            this.logService = logService;
            this._handlers = new Map();
            this._providers = new Map();
        }
        //TODO @TylerLeonhardt @Tyriar to implement a process explorer for the web
        async openProcessExplorer() {
            console.error('openProcessExplorer is not implemented in web');
        }
        async openReporter(options) {
            const extensionId = options.extensionId;
            // If we don't have a extensionId, treat this as a Core issue
            if (!extensionId) {
                if (this.productService.reportIssueUrl) {
                    const uri = this.getIssueUriFromStaticContent(this.productService.reportIssueUrl);
                    dom.windowOpenNoOpener(uri);
                    return;
                }
                throw new Error(`No issue reporting URL configured for ${this.productService.nameLong}.`);
            }
            // If we have a handler registered for this extension, use it instead of anything else
            if (this._handlers.has(extensionId)) {
                try {
                    const uri = await this.getIssueUriFromHandler(extensionId, cancellation_1.CancellationToken.None);
                    dom.windowOpenNoOpener(uri);
                    return;
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            // if we don't have a handler, or the handler failed, try to get the extension's github url
            const selectedExtension = this.extensionService.extensions.filter(ext => ext.identifier.value === options.extensionId)[0];
            const extensionGitHubUrl = this.getExtensionGitHubUrl(selectedExtension);
            if (!extensionGitHubUrl) {
                throw new Error(`Unable to find issue reporting url for ${extensionId}`);
            }
            const uri = this.getIssueUriFromStaticContent(`${extensionGitHubUrl}/issues/new`, selectedExtension);
            dom.windowOpenNoOpener(uri);
        }
        registerIssueUriRequestHandler(extensionId, handler) {
            this._handlers.set(extensionId, handler);
            return (0, lifecycle_1.toDisposable)(() => this._handlers.delete(extensionId));
        }
        registerIssueDataProvider(extensionId, handler) {
            this._providers.set(extensionId, handler);
            return (0, lifecycle_1.toDisposable)(() => this._providers.delete(extensionId));
        }
        async getIssueUriFromHandler(extensionId, token) {
            const handler = this._handlers.get(extensionId);
            if (!handler) {
                throw new Error(`No handler registered for extension ${extensionId}`);
            }
            const result = await handler.provideIssueUrl(token);
            return result.toString(true);
        }
        getExtensionGitHubUrl(extension) {
            if (extension.isBuiltin && this.productService.reportIssueUrl) {
                return (0, issueReporterUtil_1.normalizeGitHubUrl)(this.productService.reportIssueUrl);
            }
            let repositoryUrl = '';
            const bugsUrl = extension?.bugs?.url;
            const extensionUrl = extension?.repository?.url;
            // If given, try to match the extension's bug url
            if (bugsUrl && bugsUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(bugsUrl);
            }
            else if (extensionUrl && extensionUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(extensionUrl);
            }
            return repositoryUrl;
        }
        getIssueUriFromStaticContent(baseUri, extension) {
            const issueDescription = `ADD ISSUE DESCRIPTION HERE

Version: ${this.productService.version}
Commit: ${this.productService.commit ?? 'unknown'}
User Agent: ${platform_1.userAgent ?? 'unknown'}
Embedder: ${this.productService.embedderIdentifier ?? 'unknown'}
${extension?.version ? `\nExtension version: ${extension.version}` : ''}
<!-- generated by web issue reporter -->`;
            return `${baseUri}?body=${encodeURIComponent(issueDescription)}&labels=web`;
        }
    };
    exports.WebIssueService = WebIssueService;
    exports.WebIssueService = WebIssueService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], WebIssueService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaXNzdWUvYnJvd3Nlci9pc3N1ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7UUFNM0IsWUFDb0IsZ0JBQW9ELEVBQ3RELGNBQWdELEVBQ3BELFVBQXdDO1lBRmpCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFOckMsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1lBQ3ZELGVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztRQU1oRSxDQUFDO1FBRUwsMEVBQTBFO1FBQzFFLEtBQUssQ0FBQyxtQkFBbUI7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQW1DO1lBQ3JELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDeEMsNkRBQTZEO1lBQzdELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN4QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDbEYsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUM1QixPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FB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