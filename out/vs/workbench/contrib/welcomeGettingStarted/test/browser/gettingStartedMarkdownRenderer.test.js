/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/test/common/utils", "vs/editor/common/services/languageService", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedDetailsRenderer", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, network_1, utils_1, languageService_1, testNotificationService_1, gettingStartedDetailsRenderer_1, gettingStartedService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Getting Started Markdown Renderer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('renders theme picker markdown with images', async () => {
            const fileService = new workbenchTestServices_1.TestFileService();
            const languageService = new languageService_1.LanguageService();
            const renderer = new gettingStartedDetailsRenderer_1.GettingStartedDetailsRenderer(fileService, new testNotificationService_1.TestNotificationService(), new workbenchTestServices_2.TestExtensionService(), languageService);
            const mdPath = (0, gettingStartedService_1.convertInternalMediaPathToFileURI)('theme_picker').with({ query: JSON.stringify({ moduleId: 'vs/workbench/contrib/welcomeGettingStarted/common/media/theme_picker' }) });
            const mdBase = network_1.FileAccess.asFileUri('vs/workbench/contrib/welcomeGettingStarted/common/media/');
            const rendered = await renderer.renderMarkdown(mdPath, mdBase);
            const imageSrcs = [...rendered.matchAll(/img src="[^"]*"/g)].map(match => match[0]);
            for (const src of imageSrcs) {
                const targetSrcFormat = /^img src=".*\/vs\/workbench\/contrib\/welcomeGettingStarted\/common\/media\/.*.png"$/;
                assert(targetSrcFormat.test(src), `${src} didnt match regex`);
            }
            languageService.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0dGluZ1N0YXJ0ZWRNYXJrZG93blJlbmRlcmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVHZXR0aW5nU3RhcnRlZC90ZXN0L2Jyb3dzZXIvZ2V0dGluZ1N0YXJ0ZWRNYXJrZG93blJlbmRlcmVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUUvQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE1BQU0sV0FBVyxHQUFHLElBQUksdUNBQWUsRUFBRSxDQUFDO1lBQzFDLE1BQU0sZUFBZSxHQUFHLElBQUksaUNBQWUsRUFBRSxDQUFDO1lBQzlDLE1BQU0sUUFBUSxHQUFHLElBQUksNkRBQTZCLENBQUMsV0FBVyxFQUFFLElBQUksaURBQXVCLEVBQUUsRUFBRSxJQUFJLDRDQUFvQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDNUksTUFBTSxNQUFNLEdBQUcsSUFBQSx5REFBaUMsRUFBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxzRUFBc0UsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZMLE1BQU0sTUFBTSxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7WUFDaEcsTUFBTSxRQUFRLEdBQUcsTUFBTSxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMvRCxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsS0FBSyxNQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsTUFBTSxlQUFlLEdBQUcsc0ZBQXNGLENBQUM7Z0JBQy9HLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxvQkFBb0IsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFDRCxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9