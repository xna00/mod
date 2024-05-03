/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels"], function (require, exports, dom_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleIconLabel = void 0;
    class SimpleIconLabel {
        constructor(_container) {
            this._container = _container;
        }
        set text(text) {
            (0, dom_1.reset)(this._container, ...(0, iconLabels_1.renderLabelWithIcons)(text ?? ''));
        }
        set title(title) {
            if (!this.hover && title) {
                this.hover = (0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this._container, title);
            }
            else if (this.hover) {
                this.hover.update(title);
            }
        }
        dispose() {
            this.hover?.dispose();
        }
    }
    exports.SimpleIconLabel = SimpleIconLabel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlSWNvbkxhYmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvaWNvbkxhYmVsL3NpbXBsZUljb25MYWJlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxlQUFlO1FBSTNCLFlBQ2tCLFVBQXVCO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7UUFDckMsQ0FBQztRQUVMLElBQUksSUFBSSxDQUFDLElBQVk7WUFDcEIsSUFBQSxXQUFLLEVBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLElBQUEsaUNBQW9CLEVBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLEtBQWE7WUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBQSx1Q0FBZ0IsRUFBQyxJQUFBLDhDQUF1QixFQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekYsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUIsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUF2QkQsMENBdUJDIn0=