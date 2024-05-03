/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/browser/dom", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/ui/widget", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/css!./colorPicker"], function (require, exports, pixelRatio_1, dom, globalPointerMoveMonitor_1, widget_1, codicons_1, color_1, event_1, lifecycle_1, themables_1, nls_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorPickerWidget = exports.InsertButton = exports.ColorPickerBody = exports.ColorPickerHeader = void 0;
    const $ = dom.$;
    class ColorPickerHeader extends lifecycle_1.Disposable {
        constructor(container, model, themeService, showingStandaloneColorPicker = false) {
            super();
            this.model = model;
            this.showingStandaloneColorPicker = showingStandaloneColorPicker;
            this._closeButton = null;
            this._domNode = $('.colorpicker-header');
            dom.append(container, this._domNode);
            this._pickedColorNode = dom.append(this._domNode, $('.picked-color'));
            dom.append(this._pickedColorNode, $('span.codicon.codicon-color-mode'));
            this._pickedColorPresentation = dom.append(this._pickedColorNode, document.createElement('span'));
            this._pickedColorPresentation.classList.add('picked-color-presentation');
            const tooltip = (0, nls_1.localize)('clickToToggleColorOptions', "Click to toggle color options (rgb/hsl/hex)");
            this._pickedColorNode.setAttribute('title', tooltip);
            this._originalColorNode = dom.append(this._domNode, $('.original-color'));
            this._originalColorNode.style.backgroundColor = color_1.Color.Format.CSS.format(this.model.originalColor) || '';
            this.backgroundColor = themeService.getColorTheme().getColor(colorRegistry_1.editorHoverBackground) || color_1.Color.white;
            this._register(themeService.onDidColorThemeChange(theme => {
                this.backgroundColor = theme.getColor(colorRegistry_1.editorHoverBackground) || color_1.Color.white;
            }));
            this._register(dom.addDisposableListener(this._pickedColorNode, dom.EventType.CLICK, () => this.model.selectNextColorPresentation()));
            this._register(dom.addDisposableListener(this._originalColorNode, dom.EventType.CLICK, () => {
                this.model.color = this.model.originalColor;
                this.model.flushColor();
            }));
            this._register(model.onDidChangeColor(this.onDidChangeColor, this));
            this._register(model.onDidChangePresentation(this.onDidChangePresentation, this));
            this._pickedColorNode.style.backgroundColor = color_1.Color.Format.CSS.format(model.color) || '';
            this._pickedColorNode.classList.toggle('light', model.color.rgba.a < 0.5 ? this.backgroundColor.isLighter() : model.color.isLighter());
            this.onDidChangeColor(this.model.color);
            // When the color picker widget is a standalone color picker widget, then add a close button
            if (this.showingStandaloneColorPicker) {
                this._domNode.classList.add('standalone-colorpicker');
                this._closeButton = this._register(new CloseButton(this._domNode));
            }
        }
        get domNode() {
            return this._domNode;
        }
        get closeButton() {
            return this._closeButton;
        }
        get pickedColorNode() {
            return this._pickedColorNode;
        }
        get originalColorNode() {
            return this._originalColorNode;
        }
        onDidChangeColor(color) {
            this._pickedColorNode.style.backgroundColor = color_1.Color.Format.CSS.format(color) || '';
            this._pickedColorNode.classList.toggle('light', color.rgba.a < 0.5 ? this.backgroundColor.isLighter() : color.isLighter());
            this.onDidChangePresentation();
        }
        onDidChangePresentation() {
            this._pickedColorPresentation.textContent = this.model.presentation ? this.model.presentation.label : '';
        }
    }
    exports.ColorPickerHeader = ColorPickerHeader;
    class CloseButton extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this._onClicked = this._register(new event_1.Emitter());
            this.onClicked = this._onClicked.event;
            this._button = document.createElement('div');
            this._button.classList.add('close-button');
            dom.append(container, this._button);
            const innerDiv = document.createElement('div');
            innerDiv.classList.add('close-button-inner-div');
            dom.append(this._button, innerDiv);
            const closeButton = dom.append(innerDiv, $('.button' + themables_1.ThemeIcon.asCSSSelector((0, iconRegistry_1.registerIcon)('color-picker-close', codicons_1.Codicon.close, (0, nls_1.localize)('closeIcon', 'Icon to close the color picker')))));
            closeButton.classList.add('close-icon');
            this._register(dom.addDisposableListener(this._button, dom.EventType.CLICK, () => {
                this._onClicked.fire();
            }));
        }
    }
    class ColorPickerBody extends lifecycle_1.Disposable {
        constructor(container, model, pixelRatio, isStandaloneColorPicker = false) {
            super();
            this.model = model;
            this.pixelRatio = pixelRatio;
            this._insertButton = null;
            this._domNode = $('.colorpicker-body');
            dom.append(container, this._domNode);
            this._saturationBox = new SaturationBox(this._domNode, this.model, this.pixelRatio);
            this._register(this._saturationBox);
            this._register(this._saturationBox.onDidChange(this.onDidSaturationValueChange, this));
            this._register(this._saturationBox.onColorFlushed(this.flushColor, this));
            this._opacityStrip = new OpacityStrip(this._domNode, this.model, isStandaloneColorPicker);
            this._register(this._opacityStrip);
            this._register(this._opacityStrip.onDidChange(this.onDidOpacityChange, this));
            this._register(this._opacityStrip.onColorFlushed(this.flushColor, this));
            this._hueStrip = new HueStrip(this._domNode, this.model, isStandaloneColorPicker);
            this._register(this._hueStrip);
            this._register(this._hueStrip.onDidChange(this.onDidHueChange, this));
            this._register(this._hueStrip.onColorFlushed(this.flushColor, this));
            if (isStandaloneColorPicker) {
                this._insertButton = this._register(new InsertButton(this._domNode));
                this._domNode.classList.add('standalone-colorpicker');
            }
        }
        flushColor() {
            this.model.flushColor();
        }
        onDidSaturationValueChange({ s, v }) {
            const hsva = this.model.color.hsva;
            this.model.color = new color_1.Color(new color_1.HSVA(hsva.h, s, v, hsva.a));
        }
        onDidOpacityChange(a) {
            const hsva = this.model.color.hsva;
            this.model.color = new color_1.Color(new color_1.HSVA(hsva.h, hsva.s, hsva.v, a));
        }
        onDidHueChange(value) {
            const hsva = this.model.color.hsva;
            const h = (1 - value) * 360;
            this.model.color = new color_1.Color(new color_1.HSVA(h === 360 ? 0 : h, hsva.s, hsva.v, hsva.a));
        }
        get domNode() {
            return this._domNode;
        }
        get saturationBox() {
            return this._saturationBox;
        }
        get opacityStrip() {
            return this._opacityStrip;
        }
        get hueStrip() {
            return this._hueStrip;
        }
        get enterButton() {
            return this._insertButton;
        }
        layout() {
            this._saturationBox.layout();
            this._opacityStrip.layout();
            this._hueStrip.layout();
        }
    }
    exports.ColorPickerBody = ColorPickerBody;
    class SaturationBox extends lifecycle_1.Disposable {
        constructor(container, model, pixelRatio) {
            super();
            this.model = model;
            this.pixelRatio = pixelRatio;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onColorFlushed = new event_1.Emitter();
            this.onColorFlushed = this._onColorFlushed.event;
            this._domNode = $('.saturation-wrap');
            dom.append(container, this._domNode);
            // Create canvas, draw selected color
            this._canvas = document.createElement('canvas');
            this._canvas.className = 'saturation-box';
            dom.append(this._domNode, this._canvas);
            // Add selection circle
            this.selection = $('.saturation-selection');
            dom.append(this._domNode, this.selection);
            this.layout();
            this._register(dom.addDisposableListener(this._domNode, dom.EventType.POINTER_DOWN, e => this.onPointerDown(e)));
            this._register(this.model.onDidChangeColor(this.onDidChangeColor, this));
            this.monitor = null;
        }
        get domNode() {
            return this._domNode;
        }
        get canvas() {
            return this._canvas;
        }
        onPointerDown(e) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            this.monitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            const origin = dom.getDomNodePagePosition(this._domNode);
            if (e.target !== this.selection) {
                this.onDidChangePosition(e.offsetX, e.offsetY);
            }
            this.monitor.startMonitoring(e.target, e.pointerId, e.buttons, event => this.onDidChangePosition(event.pageX - origin.left, event.pageY - origin.top), () => null);
            const pointerUpListener = dom.addDisposableListener(e.target.ownerDocument, dom.EventType.POINTER_UP, () => {
                this._onColorFlushed.fire();
                pointerUpListener.dispose();
                if (this.monitor) {
                    this.monitor.stopMonitoring(true);
                    this.monitor = null;
                }
            }, true);
        }
        onDidChangePosition(left, top) {
            const s = Math.max(0, Math.min(1, left / this.width));
            const v = Math.max(0, Math.min(1, 1 - (top / this.height)));
            this.paintSelection(s, v);
            this._onDidChange.fire({ s, v });
        }
        layout() {
            this.width = this._domNode.offsetWidth;
            this.height = this._domNode.offsetHeight;
            this._canvas.width = this.width * this.pixelRatio;
            this._canvas.height = this.height * this.pixelRatio;
            this.paint();
            const hsva = this.model.color.hsva;
            this.paintSelection(hsva.s, hsva.v);
        }
        paint() {
            const hsva = this.model.color.hsva;
            const saturatedColor = new color_1.Color(new color_1.HSVA(hsva.h, 1, 1, 1));
            const ctx = this._canvas.getContext('2d');
            const whiteGradient = ctx.createLinearGradient(0, 0, this._canvas.width, 0);
            whiteGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            whiteGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
            whiteGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            const blackGradient = ctx.createLinearGradient(0, 0, 0, this._canvas.height);
            blackGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            blackGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx.rect(0, 0, this._canvas.width, this._canvas.height);
            ctx.fillStyle = color_1.Color.Format.CSS.format(saturatedColor);
            ctx.fill();
            ctx.fillStyle = whiteGradient;
            ctx.fill();
            ctx.fillStyle = blackGradient;
            ctx.fill();
        }
        paintSelection(s, v) {
            this.selection.style.left = `${s * this.width}px`;
            this.selection.style.top = `${this.height - v * this.height}px`;
        }
        onDidChangeColor(color) {
            if (this.monitor && this.monitor.isMonitoring()) {
                return;
            }
            this.paint();
            const hsva = color.hsva;
            this.paintSelection(hsva.s, hsva.v);
        }
    }
    class Strip extends lifecycle_1.Disposable {
        constructor(container, model, showingStandaloneColorPicker = false) {
            super();
            this.model = model;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._onColorFlushed = new event_1.Emitter();
            this.onColorFlushed = this._onColorFlushed.event;
            if (showingStandaloneColorPicker) {
                this.domNode = dom.append(container, $('.standalone-strip'));
                this.overlay = dom.append(this.domNode, $('.standalone-overlay'));
            }
            else {
                this.domNode = dom.append(container, $('.strip'));
                this.overlay = dom.append(this.domNode, $('.overlay'));
            }
            this.slider = dom.append(this.domNode, $('.slider'));
            this.slider.style.top = `0px`;
            this._register(dom.addDisposableListener(this.domNode, dom.EventType.POINTER_DOWN, e => this.onPointerDown(e)));
            this._register(model.onDidChangeColor(this.onDidChangeColor, this));
            this.layout();
        }
        layout() {
            this.height = this.domNode.offsetHeight - this.slider.offsetHeight;
            const value = this.getValue(this.model.color);
            this.updateSliderPosition(value);
        }
        onDidChangeColor(color) {
            const value = this.getValue(color);
            this.updateSliderPosition(value);
        }
        onPointerDown(e) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const monitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            const origin = dom.getDomNodePagePosition(this.domNode);
            this.domNode.classList.add('grabbing');
            if (e.target !== this.slider) {
                this.onDidChangeTop(e.offsetY);
            }
            monitor.startMonitoring(e.target, e.pointerId, e.buttons, event => this.onDidChangeTop(event.pageY - origin.top), () => null);
            const pointerUpListener = dom.addDisposableListener(e.target.ownerDocument, dom.EventType.POINTER_UP, () => {
                this._onColorFlushed.fire();
                pointerUpListener.dispose();
                monitor.stopMonitoring(true);
                this.domNode.classList.remove('grabbing');
            }, true);
        }
        onDidChangeTop(top) {
            const value = Math.max(0, Math.min(1, 1 - (top / this.height)));
            this.updateSliderPosition(value);
            this._onDidChange.fire(value);
        }
        updateSliderPosition(value) {
            this.slider.style.top = `${(1 - value) * this.height}px`;
        }
    }
    class OpacityStrip extends Strip {
        constructor(container, model, showingStandaloneColorPicker = false) {
            super(container, model, showingStandaloneColorPicker);
            this.domNode.classList.add('opacity-strip');
            this.onDidChangeColor(this.model.color);
        }
        onDidChangeColor(color) {
            super.onDidChangeColor(color);
            const { r, g, b } = color.rgba;
            const opaque = new color_1.Color(new color_1.RGBA(r, g, b, 1));
            const transparent = new color_1.Color(new color_1.RGBA(r, g, b, 0));
            this.overlay.style.background = `linear-gradient(to bottom, ${opaque} 0%, ${transparent} 100%)`;
        }
        getValue(color) {
            return color.hsva.a;
        }
    }
    class HueStrip extends Strip {
        constructor(container, model, showingStandaloneColorPicker = false) {
            super(container, model, showingStandaloneColorPicker);
            this.domNode.classList.add('hue-strip');
        }
        getValue(color) {
            return 1 - (color.hsva.h / 360);
        }
    }
    class InsertButton extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this._onClicked = this._register(new event_1.Emitter());
            this.onClicked = this._onClicked.event;
            this._button = dom.append(container, document.createElement('button'));
            this._button.classList.add('insert-button');
            this._button.textContent = 'Insert';
            this._register(dom.addDisposableListener(this._button, dom.EventType.CLICK, () => {
                this._onClicked.fire();
            }));
        }
        get button() {
            return this._button;
        }
    }
    exports.InsertButton = InsertButton;
    class ColorPickerWidget extends widget_1.Widget {
        static { this.ID = 'editor.contrib.colorPickerWidget'; }
        constructor(container, model, pixelRatio, themeService, standaloneColorPicker = false) {
            super();
            this.model = model;
            this.pixelRatio = pixelRatio;
            this._register(pixelRatio_1.PixelRatio.getInstance(dom.getWindow(container)).onDidChange(() => this.layout()));
            const element = $('.colorpicker-widget');
            container.appendChild(element);
            this.header = this._register(new ColorPickerHeader(element, this.model, themeService, standaloneColorPicker));
            this.body = this._register(new ColorPickerBody(element, this.model, this.pixelRatio, standaloneColorPicker));
        }
        getId() {
            return ColorPickerWidget.ID;
        }
        layout() {
            this.body.layout();
        }
    }
    exports.ColorPickerWidget = ColorPickerWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JQaWNrZXJXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2NvbG9yUGlja2VyL2Jyb3dzZXIvY29sb3JQaWNrZXJXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRWhCLE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7UUFTaEQsWUFBWSxTQUFzQixFQUFtQixLQUF1QixFQUFFLFlBQTJCLEVBQVUsK0JBQXdDLEtBQUs7WUFDL0osS0FBSyxFQUFFLENBQUM7WUFENEMsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFBdUMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUFpQjtZQUgvSSxpQkFBWSxHQUF1QixJQUFJLENBQUM7WUFNeEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN6QyxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFckMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUN0RSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbEcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFNBQVMs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