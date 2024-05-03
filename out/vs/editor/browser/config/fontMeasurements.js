/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/pixelRatio", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/charWidthReader", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo"], function (require, exports, dom_1, pixelRatio_1, event_1, lifecycle_1, charWidthReader_1, editorOptions_1, fontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontMeasurements = exports.FontMeasurementsImpl = void 0;
    class FontMeasurementsImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._cache = new Map();
            this._evictUntrustedReadingsTimeout = -1;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            if (this._evictUntrustedReadingsTimeout !== -1) {
                clearTimeout(this._evictUntrustedReadingsTimeout);
                this._evictUntrustedReadingsTimeout = -1;
            }
            super.dispose();
        }
        /**
         * Clear all cached font information and trigger a change event.
         */
        clearAllFontInfos() {
            this._cache.clear();
            this._onDidChange.fire();
        }
        _ensureCache(targetWindow) {
            const windowId = (0, dom_1.getWindowId)(targetWindow);
            let cache = this._cache.get(windowId);
            if (!cache) {
                cache = new FontMeasurementsCache();
                this._cache.set(windowId, cache);
            }
            return cache;
        }
        _writeToCache(targetWindow, item, value) {
            const cache = this._ensureCache(targetWindow);
            cache.put(item, value);
            if (!value.isTrusted && this._evictUntrustedReadingsTimeout === -1) {
                // Try reading again after some time
                this._evictUntrustedReadingsTimeout = targetWindow.setTimeout(() => {
                    this._evictUntrustedReadingsTimeout = -1;
                    this._evictUntrustedReadings(targetWindow);
                }, 5000);
            }
        }
        _evictUntrustedReadings(targetWindow) {
            const cache = this._ensureCache(targetWindow);
            const values = cache.getValues();
            let somethingRemoved = false;
            for (const item of values) {
                if (!item.isTrusted) {
                    somethingRemoved = true;
                    cache.remove(item);
                }
            }
            if (somethingRemoved) {
                this._onDidChange.fire();
            }
        }
        /**
         * Serialized currently cached font information.
         */
        serializeFontInfo(targetWindow) {
            // Only save trusted font info (that has been measured in this running instance)
            const cache = this._ensureCache(targetWindow);
            return cache.getValues().filter(item => item.isTrusted);
        }
        /**
         * Restore previously serialized font informations.
         */
        restoreFontInfo(targetWindow, savedFontInfos) {
            // Take all the saved font info and insert them in the cache without the trusted flag.
            // The reason for this is that a font might have been installed on the OS in the meantime.
            for (const savedFontInfo of savedFontInfos) {
                if (savedFontInfo.version !== fontInfo_1.SERIALIZED_FONT_INFO_VERSION) {
                    // cannot use older version
                    continue;
                }
                const fontInfo = new fontInfo_1.FontInfo(savedFontInfo, false);
                this._writeToCache(targetWindow, fontInfo, fontInfo);
            }
        }
        /**
         * Read font information.
         */
        readFontInfo(targetWindow, bareFontInfo) {
            const cache = this._ensureCache(targetWindow);
            if (!cache.has(bareFontInfo)) {
                let readConfig = this._actualReadFontInfo(targetWindow, bareFontInfo);
                if (readConfig.typicalHalfwidthCharacterWidth <= 2 || readConfig.typicalFullwidthCharacterWidth <= 2 || readConfig.spaceWidth <= 2 || readConfig.maxDigitWidth <= 2) {
                    // Hey, it's Bug 14341 ... we couldn't read
                    readConfig = new fontInfo_1.FontInfo({
                        pixelRatio: pixelRatio_1.PixelRatio.getInstance(targetWindow).value,
                        fontFamily: readConfig.fontFamily,
                        fontWeight: readConfig.fontWeight,
                        fontSize: readConfig.fontSize,
                        fontFeatureSettings: readConfig.fontFeatureSettings,
                        fontVariationSettings: readConfig.fontVariationSettings,
                        lineHeight: readConfig.lineHeight,
                        letterSpacing: readConfig.letterSpacing,
                        isMonospace: readConfig.isMonospace,
                        typicalHalfwidthCharacterWidth: Math.max(readConfig.typicalHalfwidthCharacterWidth, 5),
                        typicalFullwidthCharacterWidth: Math.max(readConfig.typicalFullwidthCharacterWidth, 5),
                        canUseHalfwidthRightwardsArrow: readConfig.canUseHalfwidthRightwardsArrow,
                        spaceWidth: Math.max(readConfig.spaceWidth, 5),
                        middotWidth: Math.max(readConfig.middotWidth, 5),
                        wsmiddotWidth: Math.max(readConfig.wsmiddotWidth, 5),
                        maxDigitWidth: Math.max(readConfig.maxDigitWidth, 5),
                    }, false);
                }
                this._writeToCache(targetWindow, bareFontInfo, readConfig);
            }
            return cache.get(bareFontInfo);
        }
        _createRequest(chr, type, all, monospace) {
            const result = new charWidthReader_1.CharWidthRequest(chr, type);
            all.push(result);
            monospace?.push(result);
            return result;
        }
        _actualReadFontInfo(targetWindow, bareFontInfo) {
            const all = [];
            const monospace = [];
            const typicalHalfwidthCharacter = this._createRequest('n', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const typicalFullwidthCharacter = this._createRequest('\uff4d', 0 /* CharWidthRequestType.Regular */, all, null);
            const space = this._createRequest(' ', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit0 = this._createRequest('0', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit1 = this._createRequest('1', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit2 = this._createRequest('2', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit3 = this._createRequest('3', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit4 = this._createRequest('4', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit5 = this._createRequest('5', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit6 = this._createRequest('6', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit7 = this._createRequest('7', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit8 = this._createRequest('8', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const digit9 = this._createRequest('9', 0 /* CharWidthRequestType.Regular */, all, monospace);
            // monospace test: used for whitespace rendering
            const rightwardsArrow = this._createRequest('→', 0 /* CharWidthRequestType.Regular */, all, monospace);
            const halfwidthRightwardsArrow = this._createRequest('￫', 0 /* CharWidthRequestType.Regular */, all, null);
            // U+00B7 - MIDDLE DOT
            const middot = this._createRequest('·', 0 /* CharWidthRequestType.Regular */, all, monospace);
            // U+2E31 - WORD SEPARATOR MIDDLE DOT
            const wsmiddotWidth = this._createRequest(String.fromCharCode(0x2E31), 0 /* CharWidthRequestType.Regular */, all, null);
            // monospace test: some characters
            const monospaceTestChars = '|/-_ilm%';
            for (let i = 0, len = monospaceTestChars.length; i < len; i++) {
                this._createRequest(monospaceTestChars.charAt(i), 0 /* CharWidthRequestType.Regular */, all, monospace);
                this._createRequest(monospaceTestChars.charAt(i), 1 /* CharWidthRequestType.Italic */, all, monospace);
                this._createRequest(monospaceTestChars.charAt(i), 2 /* CharWidthRequestType.Bold */, all, monospace);
            }
            (0, charWidthReader_1.readCharWidths)(targetWindow, bareFontInfo, all);
            const maxDigitWidth = Math.max(digit0.width, digit1.width, digit2.width, digit3.width, digit4.width, digit5.width, digit6.width, digit7.width, digit8.width, digit9.width);
            let isMonospace = (bareFontInfo.fontFeatureSettings === editorOptions_1.EditorFontLigatures.OFF);
            const referenceWidth = monospace[0].width;
            for (let i = 1, len = monospace.length; isMonospace && i < len; i++) {
                const diff = referenceWidth - monospace[i].width;
                if (diff < -0.001 || diff > 0.001) {
                    isMonospace = false;
                    break;
                }
            }
            let canUseHalfwidthRightwardsArrow = true;
            if (isMonospace && halfwidthRightwardsArrow.width !== referenceWidth) {
                // using a halfwidth rightwards arrow would break monospace...
                canUseHalfwidthRightwardsArrow = false;
            }
            if (halfwidthRightwardsArrow.width > rightwardsArrow.width) {
                // using a halfwidth rightwards arrow would paint a larger arrow than a regular rightwards arrow
                canUseHalfwidthRightwardsArrow = false;
            }
            return new fontInfo_1.FontInfo({
                pixelRatio: pixelRatio_1.PixelRatio.getInstance(targetWindow).value,
                fontFamily: bareFontInfo.fontFamily,
                fontWeight: bareFontInfo.fontWeight,
                fontSize: bareFontInfo.fontSize,
                fontFeatureSettings: bareFontInfo.fontFeatureSettings,
                fontVariationSettings: bareFontInfo.fontVariationSettings,
                lineHeight: bareFontInfo.lineHeight,
                letterSpacing: bareFontInfo.letterSpacing,
                isMonospace: isMonospace,
                typicalHalfwidthCharacterWidth: typicalHalfwidthCharacter.width,
                typicalFullwidthCharacterWidth: typicalFullwidthCharacter.width,
                canUseHalfwidthRightwardsArrow: canUseHalfwidthRightwardsArrow,
                spaceWidth: space.width,
                middotWidth: middot.width,
                wsmiddotWidth: wsmiddotWidth.width,
                maxDigitWidth: maxDigitWidth
            }, true);
        }
    }
    exports.FontMeasurementsImpl = FontMeasurementsImpl;
    class FontMeasurementsCache {
        constructor() {
            this._keys = Object.create(null);
            this._values = Object.create(null);
        }
        has(item) {
            const itemId = item.getId();
            return !!this._values[itemId];
        }
        get(item) {
            const itemId = item.getId();
            return this._values[itemId];
        }
        put(item, value) {
            const itemId = item.getId();
            this._keys[itemId] = item;
            this._values[itemId] = value;
        }
        remove(item) {
            const itemId = item.getId();
            delete this._keys[itemId];
            delete this._values[itemId];
        }
        getValues() {
            return Object.keys(this._keys).map(id => this._values[id]);
        }
    }
    exports.FontMeasurements = new FontMeasurementsImpl();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udE1lYXN1cmVtZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29uZmlnL2ZvbnRNZWFzdXJlbWVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUNoRyxNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBQXBEOztZQUVrQixXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQWlDLENBQUM7WUFFM0QsbUNBQThCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFM0IsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUNwRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBME12RCxDQUFDO1FBeE1nQixPQUFPO1lBQ3RCLElBQUksSUFBSSxDQUFDLDhCQUE4QixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELFlBQVksQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLDhCQUE4QixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFDRCxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksaUJBQWlCO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8sWUFBWSxDQUFDLFlBQW9CO1lBQ3hDLE1BQU0sUUFBUSxHQUFHLElBQUEsaUJBQVcsRUFBQyxZQUFZLENBQUMsQ0FBQztZQUMzQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FB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QUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEYsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFdEYsZ0RBQWdEO1lBQ2hELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyx3Q0FBZ0MsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLHdDQUFnQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbkcsc0JBQXNCO1lBQ3RCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMs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