/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FastDomNode = void 0;
    exports.createFastDomNode = createFastDomNode;
    class FastDomNode {
        constructor(domNode) {
            this.domNode = domNode;
            this._maxWidth = '';
            this._width = '';
            this._height = '';
            this._top = '';
            this._left = '';
            this._bottom = '';
            this._right = '';
            this._paddingTop = '';
            this._paddingLeft = '';
            this._paddingBottom = '';
            this._paddingRight = '';
            this._fontFamily = '';
            this._fontWeight = '';
            this._fontSize = '';
            this._fontStyle = '';
            this._fontFeatureSettings = '';
            this._fontVariationSettings = '';
            this._textDecoration = '';
            this._lineHeight = '';
            this._letterSpacing = '';
            this._className = '';
            this._display = '';
            this._position = '';
            this._visibility = '';
            this._color = '';
            this._backgroundColor = '';
            this._layerHint = false;
            this._contain = 'none';
            this._boxShadow = '';
        }
        setMaxWidth(_maxWidth) {
            const maxWidth = numberAsPixels(_maxWidth);
            if (this._maxWidth === maxWidth) {
                return;
            }
            this._maxWidth = maxWidth;
            this.domNode.style.maxWidth = this._maxWidth;
        }
        setWidth(_width) {
            const width = numberAsPixels(_width);
            if (this._width === width) {
                return;
            }
            this._width = width;
            this.domNode.style.width = this._width;
        }
        setHeight(_height) {
            const height = numberAsPixels(_height);
            if (this._height === height) {
                return;
            }
            this._height = height;
            this.domNode.style.height = this._height;
        }
        setTop(_top) {
            const top = numberAsPixels(_top);
            if (this._top === top) {
                return;
            }
            this._top = top;
            this.domNode.style.top = this._top;
        }
        setLeft(_left) {
            const left = numberAsPixels(_left);
            if (this._left === left) {
                return;
            }
            this._left = left;
            this.domNode.style.left = this._left;
        }
        setBottom(_bottom) {
            const bottom = numberAsPixels(_bottom);
            if (this._bottom === bottom) {
                return;
            }
            this._bottom = bottom;
            this.domNode.style.bottom = this._bottom;
        }
        setRight(_right) {
            const right = numberAsPixels(_right);
            if (this._right === right) {
                return;
            }
            this._right = right;
            this.domNode.style.right = this._right;
        }
        setPaddingTop(_paddingTop) {
            const paddingTop = numberAsPixels(_paddingTop);
            if (this._paddingTop === paddingTop) {
                return;
            }
            this._paddingTop = paddingTop;
            this.domNode.style.paddingTop = this._paddingTop;
        }
        setPaddingLeft(_paddingLeft) {
            const paddingLeft = numberAsPixels(_paddingLeft);
            if (this._paddingLeft === paddingLeft) {
                return;
            }
            this._paddingLeft = paddingLeft;
            this.domNode.style.paddingLeft = this._paddingLeft;
        }
        setPaddingBottom(_paddingBottom) {
            const paddingBottom = numberAsPixels(_paddingBottom);
            if (this._paddingBottom === paddingBottom) {
                return;
            }
            this._paddingBottom = paddingBottom;
            this.domNode.style.paddingBottom = this._paddingBottom;
        }
        setPaddingRight(_paddingRight) {
            const paddingRight = numberAsPixels(_paddingRight);
            if (this._paddingRight === paddingRight) {
                return;
            }
            this._paddingRight = paddingRight;
            this.domNode.style.paddingRight = this._paddingRight;
        }
        setFontFamily(fontFamily) {
            if (this._fontFamily === fontFamily) {
                return;
            }
            this._fontFamily = fontFamily;
            this.domNode.style.fontFamily = this._fontFamily;
        }
        setFontWeight(fontWeight) {
            if (this._fontWeight === fontWeight) {
                return;
            }
            this._fontWeight = fontWeight;
            this.domNode.style.fontWeight = this._fontWeight;
        }
        setFontSize(_fontSize) {
            const fontSize = numberAsPixels(_fontSize);
            if (this._fontSize === fontSize) {
                return;
            }
            this._fontSize = fontSize;
            this.domNode.style.fontSize = this._fontSize;
        }
        setFontStyle(fontStyle) {
            if (this._fontStyle === fontStyle) {
                return;
            }
            this._fontStyle = fontStyle;
            this.domNode.style.fontStyle = this._fontStyle;
        }
        setFontFeatureSettings(fontFeatureSettings) {
            if (this._fontFeatureSettings === fontFeatureSettings) {
                return;
            }
            this._fontFeatureSettings = fontFeatureSettings;
            this.domNode.style.fontFeatureSettings = this._fontFeatureSettings;
        }
        setFontVariationSettings(fontVariationSettings) {
            if (this._fontVariationSettings === fontVariationSettings) {
                return;
            }
            this._fontVariationSettings = fontVariationSettings;
            this.domNode.style.fontVariationSettings = this._fontVariationSettings;
        }
        setTextDecoration(textDecoration) {
            if (this._textDecoration === textDecoration) {
                return;
            }
            this._textDecoration = textDecoration;
            this.domNode.style.textDecoration = this._textDecoration;
        }
        setLineHeight(_lineHeight) {
            const lineHeight = numberAsPixels(_lineHeight);
            if (this._lineHeight === lineHeight) {
                return;
            }
            this._lineHeight = lineHeight;
            this.domNode.style.lineHeight = this._lineHeight;
        }
        setLetterSpacing(_letterSpacing) {
            const letterSpacing = numberAsPixels(_letterSpacing);
            if (this._letterSpacing === letterSpacing) {
                return;
            }
            this._letterSpacing = letterSpacing;
            this.domNode.style.letterSpacing = this._letterSpacing;
        }
        setClassName(className) {
            if (this._className === className) {
                return;
            }
            this._className = className;
            this.domNode.className = this._className;
        }
        toggleClassName(className, shouldHaveIt) {
            this.domNode.classList.toggle(className, shouldHaveIt);
            this._className = this.domNode.className;
        }
        setDisplay(display) {
            if (this._display === display) {
                return;
            }
            this._display = display;
            this.domNode.style.display = this._display;
        }
        setPosition(position) {
            if (this._position === position) {
                return;
            }
            this._position = position;
            this.domNode.style.position = this._position;
        }
        setVisibility(visibility) {
            if (this._visibility === visibility) {
                return;
            }
            this._visibility = visibility;
            this.domNode.style.visibility = this._visibility;
        }
        setColor(color) {
            if (this._color === color) {
                return;
            }
            this._color = color;
            this.domNode.style.color = this._color;
        }
        setBackgroundColor(backgroundColor) {
            if (this._backgroundColor === backgroundColor) {
                return;
            }
            this._backgroundColor = backgroundColor;
            this.domNode.style.backgroundColor = this._backgroundColor;
        }
        setLayerHinting(layerHint) {
            if (this._layerHint === layerHint) {
                return;
            }
            this._layerHint = layerHint;
            this.domNode.style.transform = this._layerHint ? 'translate3d(0px, 0px, 0px)' : '';
        }
        setBoxShadow(boxShadow) {
            if (this._boxShadow === boxShadow) {
                return;
            }
            this._boxShadow = boxShadow;
            this.domNode.style.boxShadow = boxShadow;
        }
        setContain(contain) {
            if (this._contain === contain) {
                return;
            }
            this._contain = contain;
            this.domNode.style.contain = this._contain;
        }
        setAttribute(name, value) {
            this.domNode.setAttribute(name, value);
        }
        removeAttribute(name) {
            this.domNode.removeAttribute(name);
        }
        appendChild(child) {
            this.domNode.appendChild(child.domNode);
        }
        removeChild(child) {
            this.domNode.removeChild(child.domNode);
        }
    }
    exports.FastDomNode = FastDomNode;
    function numberAsPixels(value) {
        return (typeof value === 'number' ? `${value}px` : value);
    }
    function createFastDomNode(domNode) {
        return new FastDomNode(domNode);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFzdERvbU5vZGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9mYXN0RG9tTm9kZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzVGhHLDhDQUVDO0lBdFRELE1BQWEsV0FBVztRQWdDdkIsWUFDaUIsT0FBVTtZQUFWLFlBQU8sR0FBUCxPQUFPLENBQUc7WUEvQm5CLGNBQVMsR0FBVyxFQUFFLENBQUM7WUFDdkIsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQUNwQixZQUFPLEdBQVcsRUFBRSxDQUFDO1lBQ3JCLFNBQUksR0FBVyxFQUFFLENBQUM7WUFDbEIsVUFBSyxHQUFXLEVBQUUsQ0FBQztZQUNuQixZQUFPLEdBQVcsRUFBRSxDQUFDO1lBQ3JCLFdBQU0sR0FBVyxFQUFFLENBQUM7WUFDcEIsZ0JBQVcsR0FBVyxFQUFFLENBQUM7WUFDekIsaUJBQVksR0FBVyxFQUFFLENBQUM7WUFDMUIsbUJBQWMsR0FBVyxFQUFFLENBQUM7WUFDNUIsa0JBQWEsR0FBVyxFQUFFLENBQUM7WUFDM0IsZ0JBQVcsR0FBVyxFQUFFLENBQUM7WUFDekIsZ0JBQVcsR0FBVyxFQUFFLENBQUM7WUFDekIsY0FBUyxHQUFXLEVBQUUsQ0FBQztZQUN2QixlQUFVLEdBQVcsRUFBRSxDQUFDO1lBQ3hCLHlCQUFvQixHQUFXLEVBQUUsQ0FBQztZQUNsQywyQkFBc0IsR0FBVyxFQUFFLENBQUM7WUFDcEMsb0JBQWUsR0FBVyxFQUFFLENBQUM7WUFDN0IsZ0JBQVcsR0FBVyxFQUFFLENBQUM7WUFDekIsbUJBQWMsR0FBVyxFQUFFLENBQUM7WUFDNUIsZUFBVSxHQUFXLEVBQUUsQ0FBQztZQUN4QixhQUFRLEdBQVcsRUFBRSxDQUFDO1lBQ3RCLGNBQVMsR0FBVyxFQUFFLENBQUM7WUFDdkIsZ0JBQVcsR0FBVyxFQUFFLENBQUM7WUFDekIsV0FBTSxHQUFXLEVBQUUsQ0FBQztZQUNwQixxQkFBZ0IsR0FBVyxFQUFFLENBQUM7WUFDOUIsZUFBVSxHQUFZLEtBQUssQ0FBQztZQUM1QixhQUFRLEdBQTBFLE1BQU0sQ0FBQztZQUN6RixlQUFVLEdBQVcsRUFBRSxDQUFDO1FBSTVCLENBQUM7UUFFRSxXQUFXLENBQUMsU0FBMEI7WUFDNUMsTUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNDLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDakMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUM5QyxDQUFDO1FBRU0sUUFBUSxDQUFDLE1BQXVCO1lBQ3RDLE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQzNCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDeEMsQ0FBQztRQUVNLFNBQVMsQ0FBQyxPQUF3QjtZQUN4QyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFDLENBQUM7UUFFTSxNQUFNLENBQUMsSUFBcUI7WUFDbEMsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNwQyxDQUFDO1FBRU0sT0FBTyxDQUFDLEtBQXNCO1lBQ3BDLE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDdEMsQ0FBQztRQUVNLFNBQVMsQ0FBQyxPQUF3QjtZQUN4QyxNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzFDLENBQUM7UUFFTSxRQUFRLENBQUMsTUFBdUI7WUFDdEMsTUFBTSxLQUFLLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN4QyxDQUFDO1FBRU0sYUFBYSxDQUFDLFdBQTRCO1lBQ2hELE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztRQUVNLGNBQWMsQ0FBQyxZQUE2QjtZQUNsRCxNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDakQsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN2QyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ3BELENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxjQUErQjtZQUN0RCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUMzQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQ3hELENBQUM7UUFFTSxlQUFlLENBQUMsYUFBOEI7WUFDcEQsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25ELElBQUksSUFBSSxDQUFDLGFBQWEsS0FBSyxZQUFZLEVBQUUsQ0FBQztnQkFDekMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUN0RCxDQUFDO1FBRU0sYUFBYSxDQUFDLFVBQWtCO1lBQ3RDLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDckMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNsRCxDQUFDO1FBRU0sYUFBYSxDQUFDLFVBQWtCO1lBQ3RDLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxVQUFVLEVBQUUsQ0FBQztnQkFDckMsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNsRCxDQUFDO1FBRU0sV0FBVyxDQUFDLFNBQTBCO1lBQzVDLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDOUMsQ0FBQztRQUVNLFlBQVksQ0FBQyxTQUFpQjtZQUNwQyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDaEQsQ0FBQztRQUVNLHNCQUFzQixDQUFDLG1CQUEyQjtZQUN4RCxJQUFJLElBQUksQ0FBQyxvQkFBb0IsS0FBSyxtQkFBbUIsRUFBRSxDQUFDO2dCQUN2RCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztZQUNoRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDcEUsQ0FBQztRQUVNLHdCQUF3QixDQUFDLHFCQUE2QjtZQUM1RCxJQUFJLElBQUksQ0FBQyxzQkFBc0IsS0FBSyxxQkFBcUIsRUFBRSxDQUFDO2dCQUMzRCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxxQkFBcUIsQ0FBQztZQUNwRCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUM7UUFDeEUsQ0FBQztRQUVNLGlCQUFpQixDQUFDLGNBQXNCO1lBQzlDLElBQUksSUFBSSxDQUFDLGVBQWUsS0FBSyxjQUFjLEVBQUUsQ0FBQztnQkFDN0MsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztRQUMxRCxDQUFDO1FBRU0sYUFBYSxDQUFDLFdBQTRCO1lBQ2hELE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMvQyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztRQUVNLGdCQUFnQixDQUFDLGNBQStCO1lBQ3RELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNyRCxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQzNDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7WUFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDeEQsQ0FBQztRQUVNLFlBQVksQ0FBQyxTQUFpQjtZQUNwQyxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUMxQyxDQUFDO1FBRU0sZUFBZSxDQUFDLFNBQWlCLEVBQUUsWUFBc0I7WUFDL0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQzFDLENBQUM7UUFFTSxVQUFVLENBQUMsT0FBZTtZQUNoQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDNUMsQ0FBQztRQUVNLFdBQVcsQ0FBQyxRQUFnQjtZQUNsQyxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7WUFDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDOUMsQ0FBQztRQUVNLGFBQWEsQ0FBQyxVQUFrQjtZQUN0QyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDbEQsQ0FBQztRQUVNLFFBQVEsQ0FBQyxLQUFhO1lBQzVCLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN4QyxDQUFDO1FBRU0sa0JBQWtCLENBQUMsZUFBdUI7WUFDaEQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssZUFBZSxFQUFFLENBQUM7Z0JBQy9DLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzVELENBQUM7UUFFTSxlQUFlLENBQUMsU0FBa0I7WUFDeEMsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3BGLENBQUM7UUFFTSxZQUFZLENBQUMsU0FBaUI7WUFDcEMsSUFBSSxJQUFJLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzVCLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDMUMsQ0FBQztRQUVNLFVBQVUsQ0FBQyxPQUE4RTtZQUMvRixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQy9CLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDbEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDbkQsQ0FBQztRQUVNLFlBQVksQ0FBQyxJQUFZLEVBQUUsS0FBYTtZQUM5QyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUVNLGVBQWUsQ0FBQyxJQUFZO1lBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTSxXQUFXLENBQUMsS0FBcUI7WUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTSxXQUFXLENBQUMsS0FBcUI7WUFDdkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRDtJQTlTRCxrQ0E4U0M7SUFFRCxTQUFTLGNBQWMsQ0FBQyxLQUFzQjtRQUM3QyxPQUFPLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQsU0FBZ0IsaUJBQWlCLENBQXdCLE9BQVU7UUFDbEUsT0FBTyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxDQUFDIn0=