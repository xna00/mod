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
define(["require", "exports", "vs/base/common/decorators"], function (require, exports, decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkedText = void 0;
    exports.parseLinkedText = parseLinkedText;
    class LinkedText {
        constructor(nodes) {
            this.nodes = nodes;
        }
        toString() {
            return this.nodes.map(node => typeof node === 'string' ? node : node.label).join('');
        }
    }
    exports.LinkedText = LinkedText;
    __decorate([
        decorators_1.memoize
    ], LinkedText.prototype, "toString", null);
    const LINK_REGEX = /\[([^\]]+)\]\(((?:https?:\/\/|command:|file:)[^\)\s]+)(?: (["'])(.+?)(\3))?\)/gi;
    function parseLinkedText(text) {
        const result = [];
        let index = 0;
        let match;
        while (match = LINK_REGEX.exec(text)) {
            if (match.index - index > 0) {
                result.push(text.substring(index, match.index));
            }
            const [, label, href, , title] = match;
            if (title) {
                result.push({ label, href, title });
            }
            else {
                result.push({ label, href });
            }
            index = match.index + match[0].length;
        }
        if (index < text.length) {
            result.push(text.substring(index));
        }
        return new LinkedText(result);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua2VkVGV4dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbGlua2VkVGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUF3QmhHLDBDQTJCQztJQXZDRCxNQUFhLFVBQVU7UUFFdEIsWUFBcUIsS0FBdUI7WUFBdkIsVUFBSyxHQUFMLEtBQUssQ0FBa0I7UUFBSSxDQUFDO1FBR2pELFFBQVE7WUFDUCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztLQUNEO0lBUkQsZ0NBUUM7SUFIQTtRQURDLG9CQUFPOzhDQUdQO0lBR0YsTUFBTSxVQUFVLEdBQUcsaUZBQWlGLENBQUM7SUFFckcsU0FBZ0IsZUFBZSxDQUFDLElBQVk7UUFDM0MsTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztRQUVwQyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLEtBQTZCLENBQUM7UUFFbEMsT0FBTyxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3RDLElBQUksS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQUFBRCxFQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUV2QyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDckMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN2QyxDQUFDO1FBRUQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxPQUFPLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUMifQ==