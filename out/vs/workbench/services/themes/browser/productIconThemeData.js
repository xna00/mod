/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/base/common/types", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables"], function (require, exports, nls, Paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, productIconThemeSchema_1, types_1, iconRegistry_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProductIconThemeData = exports.DEFAULT_PRODUCT_ICON_THEME_ID = void 0;
    exports.DEFAULT_PRODUCT_ICON_THEME_ID = ''; // TODO
    class ProductIconThemeData {
        static { this.STORAGE_KEY = 'productIconThemeData'; }
        constructor(id, label, settingsId) {
            this.iconThemeDocument = { iconDefinitions: new Map() };
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        getIcon(iconContribution) {
            return _resolveIconDefinition(iconContribution, this.iconThemeDocument);
        }
        ensureLoaded(fileService, logService) {
            return !this.isLoaded ? this.load(fileService, logService) : Promise.resolve(this.styleSheetContent);
        }
        reload(fileService, logService) {
            return this.load(fileService, logService);
        }
        async load(fileService, logService) {
            const location = this.location;
            if (!location) {
                return Promise.resolve(this.styleSheetContent);
            }
            const warnings = [];
            this.iconThemeDocument = await _loadProductIconThemeDocument(fileService, location, warnings);
            this.isLoaded = true;
            if (warnings.length) {
                logService.error(nls.localize('error.parseicondefs', "Problems processing product icons definitions in {0}:\n{1}", location.toString(), warnings.join('\n')));
            }
            return this.styleSheetContent;
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || Paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new ProductIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new ProductIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static { this._defaultProductIconTheme = null; }
        static get defaultTheme() {
            let themeData = ProductIconThemeData._defaultProductIconTheme;
            if (!themeData) {
                themeData = ProductIconThemeData._defaultProductIconTheme = new ProductIconThemeData(exports.DEFAULT_PRODUCT_ICON_THEME_ID, nls.localize('defaultTheme', 'Default'), workbenchThemeService_1.ThemeSettingDefaults.PRODUCT_ICON_THEME);
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(ProductIconThemeData.STORAGE_KEY, 0 /* StorageScope.PROFILE */);
            if (!input) {
                return undefined;
            }
            try {
                const data = JSON.parse(input);
                const theme = new ProductIconThemeData('', '', '');
                for (const key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                        case 'location':
                            // ignore, no longer restore
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                const { iconDefinitions, iconFontDefinitions } = data;
                if (Array.isArray(iconDefinitions) && (0, types_1.isObject)(iconFontDefinitions)) {
                    const restoredIconDefinitions = new Map();
                    for (const entry of iconDefinitions) {
                        const { id, fontCharacter, fontId } = entry;
                        if ((0, types_1.isString)(id) && (0, types_1.isString)(fontCharacter)) {
                            if ((0, types_1.isString)(fontId)) {
                                const iconFontDefinition = iconRegistry_1.IconFontDefinition.fromJSONObject(iconFontDefinitions[fontId]);
                                if (iconFontDefinition) {
                                    restoredIconDefinitions.set(id, { fontCharacter, font: { id: fontId, definition: iconFontDefinition } });
                                }
                            }
                            else {
                                restoredIconDefinitions.set(id, { fontCharacter });
                            }
                        }
                    }
                    theme.iconThemeDocument = { iconDefinitions: restoredIconDefinitions };
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            const iconDefinitions = [];
            const iconFontDefinitions = {};
            for (const entry of this.iconThemeDocument.iconDefinitions.entries()) {
                const font = entry[1].font;
                iconDefinitions.push({ id: entry[0], fontCharacter: entry[1].fontCharacter, fontId: font?.id });
                if (font && iconFontDefinitions[font.id] === undefined) {
                    iconFontDefinitions[font.id] = iconRegistry_1.IconFontDefinition.toJSONObject(font.definition);
                }
            }
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                styleSheetContent: this.styleSheetContent,
                watch: this.watch,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                iconDefinitions,
                iconFontDefinitions
            });
            storageService.store(ProductIconThemeData.STORAGE_KEY, data, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.ProductIconThemeData = ProductIconThemeData;
    function _loadProductIconThemeDocument(fileService, location, warnings) {
        return fileService.readExtensionResource(location).then((content) => {
            const parseErrors = [];
            const contentValue = Json.parse(content, parseErrors);
            if (parseErrors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing product icons file: {0}", parseErrors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for product icons theme file: Object expected.")));
            }
            else if (!contentValue.iconDefinitions || !Array.isArray(contentValue.fonts) || !contentValue.fonts.length) {
                return Promise.reject(new Error(nls.localize('error.missingProperties', "Invalid format for product icons theme file: Must contain iconDefinitions and fonts.")));
            }
            const iconThemeDocumentLocationDirname = resources.dirname(location);
            const sanitizedFonts = new Map();
            for (const font of contentValue.fonts) {
                if ((0, types_1.isString)(font.id) && font.id.match(productIconThemeSchema_1.fontIdRegex)) {
                    const fontId = font.id;
                    let fontWeight = undefined;
                    if ((0, types_1.isString)(font.weight) && font.weight.match(productIconThemeSchema_1.fontWeightRegex)) {
                        fontWeight = font.weight;
                    }
                    else {
                        warnings.push(nls.localize('error.fontWeight', 'Invalid font weight in font \'{0}\'. Ignoring setting.', font.id));
                    }
                    let fontStyle = undefined;
                    if ((0, types_1.isString)(font.style) && font.style.match(productIconThemeSchema_1.fontStyleRegex)) {
                        fontStyle = font.style;
                    }
                    else {
                        warnings.push(nls.localize('error.fontStyle', 'Invalid font style in font \'{0}\'. Ignoring setting.', font.id));
                    }
                    const sanitizedSrc = [];
                    if (Array.isArray(font.src)) {
                        for (const s of font.src) {
                            if ((0, types_1.isString)(s.path) && (0, types_1.isString)(s.format) && s.format.match(productIconThemeSchema_1.fontFormatRegex)) {
                                const iconFontLocation = resources.joinPath(iconThemeDocumentLocationDirname, s.path);
                                sanitizedSrc.push({ location: iconFontLocation, format: s.format });
                            }
                            else {
                                warnings.push(nls.localize('error.fontSrc', 'Invalid font source in font \'{0}\'. Ignoring source.', font.id));
                            }
                        }
                    }
                    if (sanitizedSrc.length) {
                        sanitizedFonts.set(fontId, { weight: fontWeight, style: fontStyle, src: sanitizedSrc });
                    }
                    else {
                        warnings.push(nls.localize('error.noFontSrc', 'No valid font source in font \'{0}\'. Ignoring font definition.', font.id));
                    }
                }
                else {
                    warnings.push(nls.localize('error.fontId', 'Missing or invalid font id \'{0}\'. Skipping font definition.', font.id));
                }
            }
            const iconDefinitions = new Map();
            const primaryFontId = contentValue.fonts[0].id;
            for (const iconId in contentValue.iconDefinitions) {
                const definition = contentValue.iconDefinitions[iconId];
                if ((0, types_1.isString)(definition.fontCharacter)) {
                    const fontId = definition.fontId ?? primaryFontId;
                    const fontDefinition = sanitizedFonts.get(fontId);
                    if (fontDefinition) {
                        const font = { id: `pi-${fontId}`, definition: fontDefinition };
                        iconDefinitions.set(iconId, { fontCharacter: definition.fontCharacter, font });
                    }
                    else {
                        warnings.push(nls.localize('error.icon.font', 'Skipping icon definition \'{0}\'. Unknown font.', iconId));
                    }
                }
                else {
                    warnings.push(nls.localize('error.icon.fontCharacter', 'Skipping icon definition \'{0}\'. Unknown fontCharacter.', iconId));
                }
            }
            return { iconDefinitions };
        });
    }
    const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
    function _resolveIconDefinition(iconContribution, iconThemeDocument) {
        const iconDefinitions = iconThemeDocument.iconDefinitions;
        let definition = iconDefinitions.get(iconContribution.id);
        let defaults = iconContribution.defaults;
        while (!definition && themables_1.ThemeIcon.isThemeIcon(defaults)) {
            // look if an inherited icon has a definition
            const ic = iconRegistry.getIcon(defaults.id);
            if (ic) {
                definition = iconDefinitions.get(ic.id);
                defaults = ic.defaults;
            }
            else {
                return undefined;
            }
        }
        if (definition) {
            return definition;
        }
        if (!themables_1.ThemeIcon.isThemeIcon(defaults)) {
            return defaults;
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZHVjdEljb25UaGVtZURhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvYnJvd3Nlci9wcm9kdWN0SWNvblRoZW1lRGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQm5GLFFBQUEsNkJBQTZCLEdBQUcsRUFBRSxDQUFDLENBQUMsT0FBTztJQUV4RCxNQUFhLG9CQUFvQjtpQkFFaEIsZ0JBQVcsR0FBRyxzQkFBc0IsQUFBekIsQ0FBMEI7UUFjckQsWUFBb0IsRUFBVSxFQUFFLEtBQWEsRUFBRSxVQUFrQjtZQUhqRSxzQkFBaUIsR0FBNkIsRUFBRSxlQUFlLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBSTVFLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7UUFDdkIsQ0FBQztRQUVNLE9BQU8sQ0FBQyxnQkFBa0M7WUFDaEQsT0FBTyxzQkFBc0IsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBRU0sWUFBWSxDQUFDLFdBQTRDLEVBQUUsVUFBdUI7WUFDeEYsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3RHLENBQUM7UUFFTSxNQUFNLENBQUMsV0FBNEMsRUFBRSxVQUF1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