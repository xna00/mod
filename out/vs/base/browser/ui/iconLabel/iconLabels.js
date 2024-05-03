/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/themables"], function (require, exports, dom, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderLabelWithIcons = renderLabelWithIcons;
    exports.renderIcon = renderIcon;
    const labelWithIconsRegex = new RegExp(`(\\\\)?\\$\\((${themables_1.ThemeIcon.iconNameExpression}(?:${themables_1.ThemeIcon.iconModifierExpression})?)\\)`, 'g');
    function renderLabelWithIcons(text) {
        const elements = new Array();
        let match;
        let textStart = 0, textStop = 0;
        while ((match = labelWithIconsRegex.exec(text)) !== null) {
            textStop = match.index || 0;
            if (textStart < textStop) {
                elements.push(text.substring(textStart, textStop));
            }
            textStart = (match.index || 0) + match[0].length;
            const [, escaped, codicon] = match;
            elements.push(escaped ? `$(${codicon})` : renderIcon({ id: codicon }));
        }
        if (textStart < text.length) {
            elements.push(text.substring(textStart));
        }
        return elements;
    }
    function renderIcon(icon) {
        const node = dom.$(`span`);
        node.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon));
        return node;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbkxhYmVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2ljb25MYWJlbC9pY29uTGFiZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLG9EQW9CQztJQUVELGdDQUlDO0lBM0JELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMsaUJBQWlCLHFCQUFTLENBQUMsa0JBQWtCLE1BQU0scUJBQVMsQ0FBQyxzQkFBc0IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3pJLFNBQWdCLG9CQUFvQixDQUFDLElBQVk7UUFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxLQUFLLEVBQTRCLENBQUM7UUFDdkQsSUFBSSxLQUE2QixDQUFDO1FBRWxDLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDMUQsUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQzVCLElBQUksU0FBUyxHQUFHLFFBQVEsRUFBRSxDQUFDO2dCQUMxQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUNELFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUVqRCxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQ25DLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDN0IsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxTQUFnQixVQUFVLENBQUMsSUFBZTtRQUN6QyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyJ9