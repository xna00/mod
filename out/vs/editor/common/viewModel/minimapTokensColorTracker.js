/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/rgba", "vs/editor/common/languages"], function (require, exports, event_1, lifecycle_1, rgba_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapTokensColorTracker = void 0;
    class MinimapTokensColorTracker extends lifecycle_1.Disposable {
        static { this._INSTANCE = null; }
        static getInstance() {
            if (!this._INSTANCE) {
                this._INSTANCE = (0, lifecycle_1.markAsSingleton)(new MinimapTokensColorTracker());
            }
            return this._INSTANCE;
        }
        constructor() {
            super();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._updateColorMap();
            this._register(languages_1.TokenizationRegistry.onDidChange(e => {
                if (e.changedColorMap) {
                    this._updateColorMap();
                }
            }));
        }
        _updateColorMap() {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            if (!colorMap) {
                this._colors = [rgba_1.RGBA8.Empty];
                this._backgroundIsLight = true;
                return;
            }
            this._colors = [rgba_1.RGBA8.Empty];
            for (let colorId = 1; colorId < colorMap.length; colorId++) {
                const source = colorMap[colorId].rgba;
                // Use a VM friendly data-type
                this._colors[colorId] = new rgba_1.RGBA8(source.r, source.g, source.b, Math.round(source.a * 255));
            }
            const backgroundLuminosity = colorMap[2 /* ColorId.DefaultBackground */].getRelativeLuminance();
            this._backgroundIsLight = backgroundLuminosity >= 0.5;
            this._onDidChange.fire(undefined);
        }
        getColor(colorId) {
            if (colorId < 1 || colorId >= this._colors.length) {
                // background color (basically invisible)
                colorId = 2 /* ColorId.DefaultBackground */;
            }
            return this._colors[colorId];
        }
        backgroundIsLight() {
            return this._backgroundIsLight;
        }
    }
    exports.MinimapTokensColorTracker = MinimapTokensColorTracker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcFRva2Vuc0NvbG9yVHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvbWluaW1hcFRva2Vuc0NvbG9yVHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSx5QkFBMEIsU0FBUSxzQkFBVTtpQkFDekMsY0FBUyxHQUFxQyxJQUFJLEFBQXpDLENBQTBDO1FBQzNELE1BQU0sQ0FBQyxXQUFXO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBQSwyQkFBZSxFQUFDLElBQUkseUJBQXlCLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQVFEO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFKUSxpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDcEMsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFJbEUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxTQUFTLENBQUMsZ0NBQW9CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNuRCxJQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN4QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFTyxlQUFlO1lBQ3RCLE1BQU0sUUFBUSxHQUFHLGdDQUFvQixDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsWUFBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dCQUMvQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxZQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0IsS0FBSyxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDNUQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDdEMsOEJBQThCO2dCQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksWUFBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdGLENBQUM7WUFDRCxNQUFNLG9CQUFvQixHQUFHLFFBQVEsbUNBQTJCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUN4RixJQUFJLENBQUMsa0JBQWtCLEdBQUcsb0JBQW9CLElBQUksR0FBRyxDQUFDO1lBQ3RELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFTSxRQUFRLENBQUMsT0FBZ0I7WUFDL0IsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuRCx5Q0FBeUM7Z0JBQ3pDLE9BQU8sb0NBQTRCLENBQUM7WUFDckMsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM5QixDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7O0lBckRGLDhEQXNEQyJ9