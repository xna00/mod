/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/platform", "vs/code/electron-sandbox/issue/issueReporterPage", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/ipc/common/mainProcessService", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/issue/common/issue", "vs/platform/native/common/native", "vs/platform/native/common/nativeHostService", "./issueReporterService", "vs/base/browser/window", "vs/base/browser/ui/codicons/codiconStyles", "vs/css!./media/issueReporter"], function (require, exports, dom_1, platform_1, issueReporterPage_1, descriptors_1, extensions_1, instantiationService_1, serviceCollection_1, mainProcessService_1, mainProcessService_2, services_1, issue_1, native_1, nativeHostService_1, issueReporterService_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startup = startup;
    function startup(configuration) {
        const platformClass = platform_1.isWindows ? 'windows' : platform_1.isLinux ? 'linux' : 'mac';
        window_1.mainWindow.document.body.classList.add(platformClass); // used by our fonts
        (0, dom_1.safeInnerHtml)(window_1.mainWindow.document.body, (0, issueReporterPage_1.default)());
        const instantiationService = initServices(configuration.windowId);
        const issueReporter = instantiationService.createInstance(issueReporterService_1.IssueReporter, configuration);
        issueReporter.render();
        window_1.mainWindow.document.body.style.display = 'block';
        issueReporter.setInitialFocus();
    }
    function initServices(windowId) {
        const services = new serviceCollection_1.ServiceCollection();
        const contributedServices = (0, extensions_1.getSingletonServiceDescriptors)();
        for (const [id, descriptor] of contributedServices) {
            services.set(id, descriptor);
        }
        services.set(mainProcessService_1.IMainProcessService, new descriptors_1.SyncDescriptor(mainProcessService_2.ElectronIPCMainProcessService, [windowId]));
        services.set(native_1.INativeHostService, new descriptors_1.SyncDescriptor(nativeHostService_1.NativeHostService, [windowId]));
        return new instantiationService_1.InstantiationService(services, true);
    }
    (0, services_1.registerMainProcessRemoteService)(issue_1.IIssueMainService, 'issue');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVSZXBvcnRlck1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvZWxlY3Ryb24tc2FuZGJveC9pc3N1ZS9pc3N1ZVJlcG9ydGVyTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW9CaEcsMEJBWUM7SUFaRCxTQUFnQixPQUFPLENBQUMsYUFBK0M7UUFDdEUsTUFBTSxhQUFhLEdBQUcsb0JBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxrQkFBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUN4RSxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjtRQUUzRSxJQUFBLG1CQUFhLEVBQUMsbUJBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUEsMkJBQVEsR0FBRSxDQUFDLENBQUM7UUFFcEQsTUFBTSxvQkFBb0IsR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWxFLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxvQ0FBYSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3hGLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN2QixtQkFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDakQsYUFBYSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxTQUFTLFlBQVksQ0FBQyxRQUFnQjtRQUNyQyxNQUFNLFFBQVEsR0FBRyxJQUFJLHFDQUFpQixFQUFFLENBQUM7UUFFekMsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDJDQUE4QixHQUFFLENBQUM7UUFDN0QsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDcEQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGtEQUE2QixFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWtCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHFDQUFpQixFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXBGLE9BQU8sSUFBSSwyQ0FBb0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELElBQUEsMkNBQWdDLEVBQUMseUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUMifQ==