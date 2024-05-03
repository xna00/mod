/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/config/editorConfiguration", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/platform/accessibility/test/common/testAccessibilityService"], function (require, exports, editorConfiguration_1, editorOptions_1, fontInfo_1, testAccessibilityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfiguration = void 0;
    class TestConfiguration extends editorConfiguration_1.EditorConfiguration {
        constructor(opts) {
            super(false, opts, null, new testAccessibilityService_1.TestAccessibilityService());
        }
        _readEnvConfiguration() {
            const envConfig = this.getRawOptions().envConfig;
            return {
                extraEditorClassName: envConfig?.extraEditorClassName ?? '',
                outerWidth: envConfig?.outerWidth ?? 100,
                outerHeight: envConfig?.outerHeight ?? 100,
                emptySelectionClipboard: envConfig?.emptySelectionClipboard ?? true,
                pixelRatio: envConfig?.pixelRatio ?? 1,
                accessibilitySupport: envConfig?.accessibilitySupport ?? 0 /* AccessibilitySupport.Unknown */
            };
        }
        _readFontInfo(styling) {
            return new fontInfo_1.FontInfo({
                pixelRatio: 1,
                fontFamily: 'mockFont',
                fontWeight: 'normal',
                fontSize: 14,
                fontFeatureSettings: editorOptions_1.EditorFontLigatures.OFF,
                fontVariationSettings: editorOptions_1.EditorFontVariations.OFF,
                lineHeight: 19,
                letterSpacing: 1.5,
                isMonospace: true,
                typicalHalfwidthCharacterWidth: 10,
                typicalFullwidthCharacterWidth: 20,
                canUseHalfwidthRightwardsArrow: true,
                spaceWidth: 10,
                middotWidth: 10,
                wsmiddotWidth: 10,
                maxDigitWidth: 10,
            }, true);
        }
    }
    exports.TestConfiguration = TestConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvY29uZmlnL3Rlc3RDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLGlCQUFrQixTQUFRLHlDQUFtQjtRQUV6RCxZQUFZLElBQTZDO1lBQ3hELEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRWtCLHFCQUFxQjtZQUN2QyxNQUFNLFNBQVMsR0FBSSxJQUFJLENBQUMsYUFBYSxFQUFvQyxDQUFDLFNBQVMsQ0FBQztZQUNwRixPQUFPO2dCQUNOLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxvQkFBb0IsSUFBSSxFQUFFO2dCQUMzRCxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsSUFBSSxHQUFHO2dCQUN4QyxXQUFXLEVBQUUsU0FBUyxFQUFFLFdBQVcsSUFBSSxHQUFHO2dCQUMxQyx1QkFBdUIsRUFBRSxTQUFTLEVBQUUsdUJBQXVCLElBQUksSUFBSTtnQkFDbkUsVUFBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLElBQUksQ0FBQztnQkFDdEMsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLG9CQUFvQix3Q0FBZ0M7YUFDckYsQ0FBQztRQUNILENBQUM7UUFFa0IsYUFBYSxDQUFDLE9BQXFCO1lBQ3JELE9BQU8sSUFBSSxtQkFBUSxDQUFDO2dCQUNuQixVQUFVLEVBQUUsQ0FBQztnQkFDYixVQUFVLEVBQUUsVUFBVTtnQkFDdEIsVUFBVSxFQUFFLFFBQVE7Z0JBQ3BCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLG1CQUFtQixFQUFFLG1DQUFtQixDQUFDLEdBQUc7Z0JBQzVDLHFCQUFxQixFQUFFLG9DQUFvQixDQUFDLEdBQUc7Z0JBQy9DLFVBQVUsRUFBRSxFQUFFO2dCQUNkLGFBQWEsRUFBRSxHQUFHO2dCQUNsQixXQUFXLEVBQUUsSUFBSTtnQkFDakIsOEJBQThCLEVBQUUsRUFBRTtnQkFDbEMsOEJBQThCLEVBQUUsRUFBRTtnQkFDbEMsOEJBQThCLEVBQUUsSUFBSTtnQkFDcEMsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsYUFBYSxFQUFFLEVBQUU7Z0JBQ2pCLGFBQWEsRUFBRSxFQUFFO2FBQ2pCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDVixDQUFDO0tBQ0Q7SUF0Q0QsOENBc0NDIn0=