/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/common/viewModel/overviewZoneManager", "vs/editor/common/viewEventHandler"], function (require, exports, fastDomNode_1, overviewZoneManager_1, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewRuler = void 0;
    class OverviewRuler extends viewEventHandler_1.ViewEventHandler {
        constructor(context, cssClassName) {
            super();
            this._context = context;
            const options = this._context.configuration.options;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._domNode.setClassName(cssClassName);
            this._domNode.setPosition('absolute');
            this._domNode.setLayerHinting(true);
            this._domNode.setContain('strict');
            this._zoneManager = new overviewZoneManager_1.OverviewZoneManager((lineNumber) => this._context.viewLayout.getVerticalOffsetForLineNumber(lineNumber));
            this._zoneManager.setDOMWidth(0);
            this._zoneManager.setDOMHeight(0);
            this._zoneManager.setOuterHeight(this._context.viewLayout.getScrollHeight());
            this._zoneManager.setLineHeight(options.get(67 /* EditorOption.lineHeight */));
            this._zoneManager.setPixelRatio(options.get(143 /* EditorOption.pixelRatio */));
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                this._zoneManager.setLineHeight(options.get(67 /* EditorOption.lineHeight */));
                this._render();
            }
            if (e.hasChanged(143 /* EditorOption.pixelRatio */)) {
                this._zoneManager.setPixelRatio(options.get(143 /* EditorOption.pixelRatio */));
                this._domNode.setWidth(this._zoneManager.getDOMWidth());
                this._domNode.setHeight(this._zoneManager.getDOMHeight());
                this._domNode.domNode.width = this._zoneManager.getCanvasWidth();
                this._domNode.domNode.height = this._zoneManager.getCanvasHeight();
                this._render();
            }
            return true;
        }
        onFlushed(e) {
            this._render();
            return true;
        }
        onScrollChanged(e) {
            if (e.scrollHeightChanged) {
                this._zoneManager.setOuterHeight(e.scrollHeight);
                this._render();
            }
            return true;
        }
        onZonesChanged(e) {
            this._render();
            return true;
        }
        // ---- end view event handlers
        getDomNode() {
            return this._domNode.domNode;
        }
        setLayout(position) {
            this._domNode.setTop(position.top);
            this._domNode.setRight(position.right);
            let hasChanged = false;
            hasChanged = this._zoneManager.setDOMWidth(position.width) || hasChanged;
            hasChanged = this._zoneManager.setDOMHeight(position.height) || hasChanged;
            if (hasChanged) {
                this._domNode.setWidth(this._zoneManager.getDOMWidth());
                this._domNode.setHeight(this._zoneManager.getDOMHeight());
                this._domNode.domNode.width = this._zoneManager.getCanvasWidth();
                this._domNode.domNode.height = this._zoneManager.getCanvasHeight();
                this._render();
            }
        }
        setZones(zones) {
            this._zoneManager.setZones(zones);
            this._render();
        }
        _render() {
            if (this._zoneManager.getOuterHeight() === 0) {
                return false;
            }
            const width = this._zoneManager.getCanvasWidth();
            const height = this._zoneManager.getCanvasHeight();
            const colorZones = this._zoneManager.resolveColorZones();
            const id2Color = this._zoneManager.getId2Color();
            const ctx = this._domNode.domNode.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            if (colorZones.length > 0) {
                this._renderOneLane(ctx, colorZones, id2Color, width);
            }
            return true;
        }
        _renderOneLane(ctx, colorZones, id2Color, width) {
            let currentColorId = 0;
            let currentFrom = 0;
            let currentTo = 0;
            for (const zone of colorZones) {
                const zoneColorId = zone.colorId;
                const zoneFrom = zone.from;
                const zoneTo = zone.to;
                if (zoneColorId !== currentColorId) {
                    ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
                    currentColorId = zoneColorId;
                    ctx.fillStyle = id2Color[currentColorId];
                    currentFrom = zoneFrom;
                    currentTo = zoneTo;
                }
                else {
                    if (currentTo >= zoneFrom) {
                        currentTo = Math.max(currentTo, zoneTo);
                    }
                    else {
                        ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
                        currentFrom = zoneFrom;
                        currentTo = zoneTo;
                    }
                }
            }
            ctx.fillRect(0, currentFrom, width, currentTo - currentFrom);
        }
    }
    exports.OverviewRuler = OverviewRuler;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdSdWxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL292ZXJ2aWV3UnVsZXIvb3ZlcnZpZXdSdWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxhQUFjLFNBQVEsbUNBQWdCO1FBTWxELFlBQVksT0FBb0IsRUFBRSxZQUFvQjtZQUNyRCxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUVwRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRW5DLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx5Q0FBbUIsQ0FBQyxDQUFDLFVBQWtCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLDhCQUE4QixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDekksSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENB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