/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode"], function (require, exports, fastDomNode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.applyFontInfo = applyFontInfo;
    function applyFontInfo(domNode, fontInfo) {
        if (domNode instanceof fastDomNode_1.FastDomNode) {
            domNode.setFontFamily(fontInfo.getMassagedFontFamily());
            domNode.setFontWeight(fontInfo.fontWeight);
            domNode.setFontSize(fontInfo.fontSize);
            domNode.setFontFeatureSettings(fontInfo.fontFeatureSettings);
            domNode.setFontVariationSettings(fontInfo.fontVariationSettings);
            domNode.setLineHeight(fontInfo.lineHeight);
            domNode.setLetterSpacing(fontInfo.letterSpacing);
        }
        else {
            domNode.style.fontFamily = fontInfo.getMassagedFontFamily();
            domNode.style.fontWeight = fontInfo.fontWeight;
            domNode.style.fontSize = fontInfo.fontSize + 'px';
            domNode.style.fontFeatureSettings = fontInfo.fontFeatureSettings;
            domNode.style.fontVariationSettings = fontInfo.fontVariationSettings;
            domNode.style.lineHeight = fontInfo.lineHeight + 'px';
            domNode.style.letterSpacing = fontInfo.letterSpacing + 'px';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tRm9udEluZm8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbmZpZy9kb21Gb250SW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUtoRyxzQ0FrQkM7SUFsQkQsU0FBZ0IsYUFBYSxDQUFDLE9BQStDLEVBQUUsUUFBc0I7UUFDcEcsSUFBSSxPQUFPLFlBQVkseUJBQVcsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUMsQ0FBQztZQUN4RCxPQUFPLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxPQUFPLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDN0QsT0FBTyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbEQsQ0FBQzthQUFNLENBQUM7WUFDUCxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUM1RCxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDO1lBQy9DLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ2xELE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEdBQUcsUUFBUSxDQUFDLG1CQUFtQixDQUFDO1lBQ2pFLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFDO1lBQ3JFLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3RELE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzdELENBQUM7SUFDRixDQUFDIn0=