/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorPickerModel = void 0;
    class ColorPickerModel {
        get color() {
            return this._color;
        }
        set color(color) {
            if (this._color.equals(color)) {
                return;
            }
            this._color = color;
            this._onDidChangeColor.fire(color);
        }
        get presentation() { return this.colorPresentations[this.presentationIndex]; }
        get colorPresentations() {
            return this._colorPresentations;
        }
        set colorPresentations(colorPresentations) {
            this._colorPresentations = colorPresentations;
            if (this.presentationIndex > colorPresentations.length - 1) {
                this.presentationIndex = 0;
            }
            this._onDidChangePresentation.fire(this.presentation);
        }
        constructor(color, availableColorPresentations, presentationIndex) {
            this.presentationIndex = presentationIndex;
            this._onColorFlushed = new event_1.Emitter();
            this.onColorFlushed = this._onColorFlushed.event;
            this._onDidChangeColor = new event_1.Emitter();
            this.onDidChangeColor = this._onDidChangeColor.event;
            this._onDidChangePresentation = new event_1.Emitter();
            this.onDidChangePresentation = this._onDidChangePresentation.event;
            this.originalColor = color;
            this._color = color;
            this._colorPresentations = availableColorPresentations;
        }
        selectNextColorPresentation() {
            this.presentationIndex = (this.presentationIndex + 1) % this.colorPresentations.length;
            this.flushColor();
            this._onDidChangePresentation.fire(this.presentation);
        }
        guessColorPresentation(color, originalText) {
            let presentationIndex = -1;
            for (let i = 0; i < this.colorPresentations.length; i++) {
                if (originalText.toLowerCase() === this.colorPresentations[i].label) {
                    presentationIndex = i;
                    break;
                }
            }
            if (presentationIndex === -1) {
                // check which color presentation text has same prefix as original text's prefix
                const originalTextPrefix = originalText.split('(')[0].toLowerCase();
                for (let i = 0; i < this.colorPresentations.length; i++) {
                    if (this.colorPresentations[i].label.toLowerCase().startsWith(originalTextPrefix)) {
                        presentationIndex = i;
                        break;
                    }
                }
            }
            if (presentationIndex !== -1 && presentationIndex !== this.presentationIndex) {
                this.presentationIndex = presentationIndex;
                this._onDidChangePresentation.fire(this.presentation);
            }
        }
        flushColor() {
            this._onColorFlushed.fire(this._color);
        }
    }
    exports.ColorPickerModel = ColorPickerModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JQaWNrZXJNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9jb2xvclBpY2tlck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFhLGdCQUFnQjtRQUs1QixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELElBQUksS0FBSyxDQUFDLEtBQVk7WUFDckIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELElBQUksWUFBWSxLQUF5QixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJbEcsSUFBSSxrQkFBa0I7WUFDckIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksa0JBQWtCLENBQUMsa0JBQXdDO1lBQzlELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQztZQUM5QyxJQUFJLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzVELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUNELElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FB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