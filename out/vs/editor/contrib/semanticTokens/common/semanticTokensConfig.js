/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SEMANTIC_HIGHLIGHTING_SETTING_ID = void 0;
    exports.isSemanticColoringEnabled = isSemanticColoringEnabled;
    exports.SEMANTIC_HIGHLIGHTING_SETTING_ID = 'editor.semanticHighlighting';
    function isSemanticColoringEnabled(model, themeService, configurationService) {
        const setting = configurationService.getValue(exports.SEMANTIC_HIGHLIGHTING_SETTING_ID, { overrideIdentifier: model.getLanguageId(), resource: model.uri })?.enabled;
        if (typeof setting === 'boolean') {
            return setting;
        }
        return themeService.getColorTheme().semanticHighlighting;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VtYW50aWNUb2tlbnNDb25maWcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NlbWFudGljVG9rZW5zL2NvbW1vbi9zZW1hbnRpY1Rva2Vuc0NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsOERBTUM7SUFaWSxRQUFBLGdDQUFnQyxHQUFHLDZCQUE2QixDQUFDO0lBTTlFLFNBQWdCLHlCQUF5QixDQUFDLEtBQWlCLEVBQUUsWUFBMkIsRUFBRSxvQkFBMkM7UUFDcEksTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFxQyx3Q0FBZ0MsRUFBRSxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUUsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO1FBQ2pNLElBQUksT0FBTyxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDbEMsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUNELE9BQU8sWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLG9CQUFvQixDQUFDO0lBQzFELENBQUMifQ==