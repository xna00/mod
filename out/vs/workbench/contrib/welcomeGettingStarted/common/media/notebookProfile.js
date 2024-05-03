/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const profileArg = (profile) => encodeURIComponent(JSON.stringify({ profile }));
    const imageSize = 400;
    exports.default = () => `
<vertically-centered>
<checklist>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('default')}" checked-on="config.notebook.cellFocusIndicator == 'border' && config.notebook.insertToolbarLocation == 'both' && config.notebook.globalToolbar == false && config.notebook.compactView == true && config.notebook.showCellStatusBar == 'visible'">
		<img width="${imageSize}" src="./notebookThemes/default.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('default', "Default"))}
	</checkbox>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('jupyter')}" checked-on="config.notebook.cellFocusIndicator == 'gutter' && config.notebook.insertToolbarLocation == 'notebookToolbar' && config.notebook.globalToolbar == true && config.notebook.compactView == true  && config.notebook.showCellStatusBar == 'visible'">
		<img width="${imageSize}" src="./notebookThemes/jupyter.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('jupyter', "Jupyter"))}
	</checkbox>
	<checkbox on-checked="command:notebook.setProfile?${profileArg('colab')}" checked-on="config.notebook.cellFocusIndicator == 'border' && config.notebook.insertToolbarLocation == 'betweenCells' && config.notebook.globalToolbar == false && config.notebook.compactView == false && config.notebook.showCellStatusBar == 'hidden'">
		<img width="${imageSize}" src="./notebookThemes/colab.png"/>
		${(0, strings_1.escape)((0, nls_1.localize)('colab', "Colab"))}
	</checkbox>
</checklist>
</vertically-centered>
`;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tQcm9maWxlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWxjb21lR2V0dGluZ1N0YXJ0ZWQvY29tbW9uL21lZGlhL25vdGVib29rUHJvZmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN4RixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7SUFFdEIsa0JBQWUsR0FBRyxFQUFFLENBQUM7OztxREFHZ0MsVUFBVSxDQUFDLFNBQVMsQ0FBQztnQkFDMUQsU0FBUztJQUNyQixJQUFBLGdCQUFNLEVBQUMsSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztxREFFVyxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUMxRCxTQUFTO0lBQ3JCLElBQUEsZ0JBQU0sRUFBQyxJQUFBLGNBQVEsRUFBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7O3FEQUVXLFVBQVUsQ0FBQyxPQUFPLENBQUM7Z0JBQ3hELFNBQVM7SUFDckIsSUFBQSxnQkFBTSxFQUFDLElBQUEsY0FBUSxFQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzs7OztDQUlyQyxDQUFDIn0=