/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/browser", "vs/platform/theme/common/colorRegistry", "vs/base/browser/window", "vs/css!./media/style"], function (require, exports, themeService_1, theme_1, platform_1, dom_1, browser_1, colorRegistry_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Background (helps for subpixel-antialiasing on Windows)
        const workbenchBackground = (0, theme_1.WORKBENCH_BACKGROUND)(theme);
        collector.addRule(`.monaco-workbench { background-color: ${workbenchBackground}; }`);
        // Selection (do NOT remove - https://github.com/microsoft/vscode/issues/169662)
        const windowSelectionBackground = theme.getColor(colorRegistry_1.selectionBackground);
        if (windowSelectionBackground) {
            collector.addRule(`.monaco-workbench ::selection { background-color: ${windowSelectionBackground}; }`);
        }
        // Update <meta name="theme-color" content=""> based on selected theme
        if (platform_1.isWeb) {
            const titleBackground = theme.getColor(theme_1.TITLE_BAR_ACTIVE_BACKGROUND);
            if (titleBackground) {
                const metaElementId = 'monaco-workbench-meta-theme-color';
                let metaElement = window_1.mainWindow.document.getElementById(metaElementId);
                if (!metaElement) {
                    metaElement = (0, dom_1.createMetaElement)();
                    metaElement.name = 'theme-color';
                    metaElement.id = metaElementId;
                }
                metaElement.content = titleBackground.toString();
            }
        }
        // We disable user select on the root element, however on Safari this seems
        // to prevent any text selection in the monaco editor. As a workaround we
        // allow to select text in monaco editor instances.
        if (browser_1.isSafari) {
            collector.addRule(`
			body.web {
				touch-action: none;
			}
			.monaco-workbench .monaco-editor .view-lines {
				user-select: text;
				-webkit-user-select: text;
			}
		`);
        }
        // Update body background color to ensure the home indicator area looks similar to the workbench
        if (platform_1.isIOS && (0, browser_1.isStandalone)()) {
            collector.addRule(`body { background-color: ${workbenchBackground}; }`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3N0eWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLElBQUEseUNBQTBCLEVBQUMsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFFL0MsMERBQTBEO1FBQzFELE1BQU0sbUJBQW1CLEdBQUcsSUFBQSw0QkFBb0IsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUN4RCxTQUFTLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxtQkFBbUIsS0FBSyxDQUFDLENBQUM7UUFFckYsZ0ZBQWdGO1FBQ2hGLE1BQU0seUJBQXlCLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQ0FBbUIsQ0FBQyxDQUFDO1FBQ3RFLElBQUkseUJBQXlCLEVBQUUsQ0FBQztZQUMvQixTQUFTLENBQUMsT0FBTyxDQUFDLHFEQUFxRCx5QkFBeUIsS0FBSyxDQUFDLENBQUM7UUFDeEcsQ0FBQztRQUVELHNFQUFzRTtRQUN0RSxJQUFJLGdCQUFLLEVBQUUsQ0FBQztZQUNYLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsbUNBQTJCLENBQUMsQ0FBQztZQUNwRSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixNQUFNLGFBQWEsR0FBRyxtQ0FBbUMsQ0FBQztnQkFDMUQsSUFBSSxXQUFXLEdBQUcsbUJBQVUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBMkIsQ0FBQztnQkFDOUYsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixXQUFXLEdBQUcsSUFBQSx1QkFBaUIsR0FBRSxDQUFDO29CQUNsQyxXQUFXLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQztvQkFDakMsV0FBVyxDQUFDLEVBQUUsR0FBRyxhQUFhLENBQUM7Z0JBQ2hDLENBQUM7Z0JBRUQsV0FBVyxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCwyRUFBMkU7UUFDM0UseUVBQXlFO1FBQ3pFLG1EQUFtRDtRQUNuRCxJQUFJLGtCQUFRLEVBQUUsQ0FBQztZQUNkLFNBQVMsQ0FBQyxPQUFPLENBQUM7Ozs7Ozs7O0dBUWpCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxnR0FBZ0c7UUFDaEcsSUFBSSxnQkFBSyxJQUFJLElBQUEsc0JBQVksR0FBRSxFQUFFLENBQUM7WUFDN0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsbUJBQW1CLEtBQUssQ0FBQyxDQUFDO1FBQ3pFLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQyJ9