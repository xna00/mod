/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/strings", "vs/css!./countBadge"], function (require, exports, dom_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CountBadge = exports.unthemedCountStyles = void 0;
    exports.unthemedCountStyles = {
        badgeBackground: '#4D4D4D',
        badgeForeground: '#FFFFFF',
        badgeBorder: undefined
    };
    class CountBadge {
        constructor(container, options, styles) {
            this.options = options;
            this.styles = styles;
            this.count = 0;
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-count-badge'));
            this.countFormat = this.options.countFormat || '{0}';
            this.titleFormat = this.options.titleFormat || '';
            this.setCount(this.options.count || 0);
        }
        setCount(count) {
            this.count = count;
            this.render();
        }
        setCountFormat(countFormat) {
            this.countFormat = countFormat;
            this.render();
        }
        setTitleFormat(titleFormat) {
            this.titleFormat = titleFormat;
            this.render();
        }
        render() {
            this.element.textContent = (0, strings_1.format)(this.countFormat, this.count);
            this.element.title = (0, strings_1.format)(this.titleFormat, this.count);
            this.element.style.backgroundColor = this.styles.badgeBackground ?? '';
            this.element.style.color = this.styles.badgeForeground ?? '';
            if (this.styles.badgeBorder) {
                this.element.style.border = `1px solid ${this.styles.badgeBorder}`;
            }
        }
    }
    exports.CountBadge = CountBadge;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY291bnRCYWRnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2NvdW50QmFkZ2UvY291bnRCYWRnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQm5GLFFBQUEsbUJBQW1CLEdBQXNCO1FBQ3JELGVBQWUsRUFBRSxTQUFTO1FBQzFCLGVBQWUsRUFBRSxTQUFTO1FBQzFCLFdBQVcsRUFBRSxTQUFTO0tBQ3RCLENBQUM7SUFFRixNQUFhLFVBQVU7UUFPdEIsWUFBWSxTQUFzQixFQUFtQixPQUEyQixFQUFtQixNQUF5QjtZQUF2RSxZQUFPLEdBQVAsT0FBTyxDQUFvQjtZQUFtQixXQUFNLEdBQU4sTUFBTSxDQUFtQjtZQUpwSCxVQUFLLEdBQVcsQ0FBQyxDQUFDO1lBTXpCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSxZQUFNLEVBQUMsU0FBUyxFQUFFLElBQUEsT0FBQyxFQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUMzRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQztZQUNyRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztZQUNsRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFRCxRQUFRLENBQUMsS0FBYTtZQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDZixDQUFDO1FBRUQsY0FBYyxDQUFDLFdBQW1CO1lBQ2pDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxjQUFjLENBQUMsV0FBbUI7WUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFDL0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2YsQ0FBQztRQUVPLE1BQU07WUFDYixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBQSxnQkFBTSxFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsSUFBSSxFQUFFLENBQUM7WUFDdkUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQztZQUU3RCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxhQUFhLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEUsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXpDRCxnQ0F5Q0MifQ==