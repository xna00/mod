/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/base/browser/dom", "vs/base/browser/window"], function (require, exports, nls, paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, dom_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileIconThemeLoader = exports.FileIconThemeData = void 0;
    class FileIconThemeData {
        static { this.STORAGE_KEY = 'iconThemeData'; }
        constructor(id, label, settingsId) {
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
            this.hasFileIcons = false;
            this.hasFolderIcons = false;
            this.hidesExplorerArrows = false;
        }
        ensureLoaded(themeLoader) {
            return !this.isLoaded ? this.load(themeLoader) : Promise.resolve(this.styleSheetContent);
        }
        reload(themeLoader) {
            return this.load(themeLoader);
        }
        load(themeLoader) {
            return themeLoader.load(this);
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new FileIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static { this._noIconTheme = null; }
        static get noIconTheme() {
            let themeData = FileIconThemeData._noIconTheme;
            if (!themeData) {
                themeData = FileIconThemeData._noIconTheme = new FileIconThemeData('', '', null);
                themeData.hasFileIcons = false;
                themeData.hasFolderIcons = false;
                themeData.hidesExplorerArrows = false;
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new FileIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.hasFileIcons = false;
            themeData.hasFolderIcons = false;
            themeData.hidesExplorerArrows = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(FileIconThemeData.STORAGE_KEY, 0 /* StorageScope.PROFILE */);
            if (!input) {
                return undefined;
            }
            try {
                const data = JSON.parse(input);
                const theme = new FileIconThemeData('', '', null);
                for (const key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'hasFileIcons':
                        case 'hidesExplorerArrows':
                        case 'hasFolderIcons':
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
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                styleSheetContent: this.styleSheetContent,
                hasFileIcons: this.hasFileIcons,
                hasFolderIcons: this.hasFolderIcons,
                hidesExplorerArrows: this.hidesExplorerArrows,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
                watch: this.watch
            });
            storageService.store(FileIconThemeData.STORAGE_KEY, data, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.FileIconThemeData = FileIconThemeData;
    class FileIconThemeLoader {
        constructor(fileService, languageService) {
            this.fileService = fileService;
            this.languageService = languageService;
        }
        load(data) {
            if (!data.location) {
                return Promise.resolve(data.styleSheetContent);
            }
            return this.loadIconThemeDocument(data.location).then(iconThemeDocument => {
                const result = this.processIconThemeDocument(data.id, data.location, iconThemeDocument);
                data.styleSheetContent = result.content;
                data.hasFileIcons = result.hasFileIcons;
                data.hasFolderIcons = result.hasFolderIcons;
                data.hidesExplorerArrows = result.hidesExplorerArrows;
                data.isLoaded = true;
                return data.styleSheetContent;
            });
        }
        loadIconThemeDocument(location) {
            return this.fileService.readExtensionResource(location).then((content) => {
                const errors = [];
                const contentValue = Json.parse(content, errors);
                if (errors.length > 0) {
                    return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing file icons file: {0}", errors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
                }
                else if (Json.getNodeType(contentValue) !== 'object') {
                    return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for file icons theme file: Object expected.")));
                }
                return Promise.resolve(contentValue);
            });
        }
        processIconThemeDocument(id, iconThemeDocumentLocation, iconThemeDocument) {
            const result = { content: '', hasFileIcons: false, hasFolderIcons: false, hidesExplorerArrows: !!iconThemeDocument.hidesExplorerArrows };
            let hasSpecificFileIcons = false;
            if (!iconThemeDocument.iconDefinitions) {
                return result;
            }
            const selectorByDefinitionId = {};
            const coveredLanguages = {};
            const iconThemeDocumentLocationDirname = resources.dirname(iconThemeDocumentLocation);
            function resolvePath(path) {
                return resources.joinPath(iconThemeDocumentLocationDirname, path);
            }
            function collectSelectors(associations, baseThemeClassName) {
                function addSelector(selector, defId) {
                    if (defId) {
                        let list = selectorByDefinitionId[defId];
                        if (!list) {
                            list = selectorByDefinitionId[defId] = [];
                        }
                        list.push(selector);
                    }
                }
                if (associations) {
                    let qualifier = '.show-file-icons';
                    if (baseThemeClassName) {
                        qualifier = baseThemeClassName + ' ' + qualifier;
                    }
                    const expanded = '.monaco-tl-twistie.collapsible:not(.collapsed) + .monaco-tl-contents';
                    if (associations.folder) {
                        addSelector(`${qualifier} .folder-icon::before`, associations.folder);
                        result.hasFolderIcons = true;
                    }
                    if (associations.folderExpanded) {
                        addSelector(`${qualifier} ${expanded} .folder-icon::before`, associations.folderExpanded);
                        result.hasFolderIcons = true;
                    }
                    const rootFolder = associations.rootFolder || associations.folder;
                    const rootFolderExpanded = associations.rootFolderExpanded || associations.folderExpanded;
                    if (rootFolder) {
                        addSelector(`${qualifier} .rootfolder-icon::before`, rootFolder);
                        result.hasFolderIcons = true;
                    }
                    if (rootFolderExpanded) {
                        addSelector(`${qualifier} ${expanded} .rootfolder-icon::before`, rootFolderExpanded);
                        result.hasFolderIcons = true;
                    }
                    if (associations.file) {
                        addSelector(`${qualifier} .file-icon::before`, associations.file);
                        result.hasFileIcons = true;
                    }
                    const folderNames = associations.folderNames;
                    if (folderNames) {
                        for (const key in folderNames) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(name)}-name-folder-icon`);
                            addSelector(`${qualifier} ${selectors.join('')}.folder-icon::before`, folderNames[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const folderNamesExpanded = associations.folderNamesExpanded;
                    if (folderNamesExpanded) {
                        for (const key in folderNamesExpanded) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(name)}-name-folder-icon`);
                            addSelector(`${qualifier} ${expanded} ${selectors.join('')}.folder-icon::before`, folderNamesExpanded[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const rootFolderNames = associations.rootFolderNames;
                    if (rootFolderNames) {
                        for (const key in rootFolderNames) {
                            const name = key.toLowerCase();
                            addSelector(`${qualifier} .${escapeCSS(name)}-root-name-folder-icon.rootfolder-icon::before`, rootFolderNames[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const rootFolderNamesExpanded = associations.rootFolderNamesExpanded;
                    if (rootFolderNamesExpanded) {
                        for (const key in rootFolderNamesExpanded) {
                            const name = key.toLowerCase();
                            addSelector(`${qualifier} ${expanded} .${escapeCSS(name)}-root-name-folder-icon.rootfolder-icon::before`, rootFolderNamesExpanded[key]);
                            result.hasFolderIcons = true;
                        }
                    }
                    const languageIds = associations.languageIds;
                    if (languageIds) {
                        if (!languageIds.jsonc && languageIds.json) {
                            languageIds.jsonc = languageIds.json;
                        }
                        for (const languageId in languageIds) {
                            addSelector(`${qualifier} .${escapeCSS(languageId)}-lang-file-icon.file-icon::before`, languageIds[languageId]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                            coveredLanguages[languageId] = true;
                        }
                    }
                    const fileExtensions = associations.fileExtensions;
                    if (fileExtensions) {
                        for (const key in fileExtensions) {
                            const selectors = [];
                            const name = handleParentFolder(key.toLowerCase(), selectors);
                            const segments = name.split('.');
                            if (segments.length) {
                                for (let i = 0; i < segments.length; i++) {
                                    selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                                }
                                selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                            }
                            addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileExtensions[key]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                        }
                    }
                    const fileNames = associations.fileNames;
                    if (fileNames) {
                        for (const key in fileNames) {
                            const selectors = [];
                            const fileName = handleParentFolder(key.toLowerCase(), selectors);
                            selectors.push(`.${escapeCSS(fileName)}-name-file-icon`);
                            selectors.push('.name-file-icon'); // extra segment to increase file-name score
                            const segments = fileName.split('.');
                            if (segments.length) {
                                for (let i = 1; i < segments.length; i++) {
                                    selectors.push(`.${escapeCSS(segments.slice(i).join('.'))}-ext-file-icon`);
                                }
                                selectors.push('.ext-file-icon'); // extra segment to increase file-ext score
                            }
                            addSelector(`${qualifier} ${selectors.join('')}.file-icon::before`, fileNames[key]);
                            result.hasFileIcons = true;
                            hasSpecificFileIcons = true;
                        }
                    }
                }
            }
            collectSelectors(iconThemeDocument);
            collectSelectors(iconThemeDocument.light, '.vs');
            collectSelectors(iconThemeDocument.highContrast, '.hc-black');
            collectSelectors(iconThemeDocument.highContrast, '.hc-light');
            if (!result.hasFileIcons && !result.hasFolderIcons) {
                return result;
            }
            const showLanguageModeIcons = iconThemeDocument.showLanguageModeIcons === true || (hasSpecificFileIcons && iconThemeDocument.showLanguageModeIcons !== false);
            const cssRules = [];
            const fonts = iconThemeDocument.fonts;
            const fontSizes = new Map();
            if (Array.isArray(fonts)) {
                const defaultFontSize = fonts[0].size || '150%';
                fonts.forEach(font => {
                    const src = font.src.map(l => `${(0, dom_1.asCSSUrl)(resolvePath(l.path))} format('${l.format}')`).join(', ');
                    cssRules.push(`@font-face { src: ${src}; font-family: '${font.id}'; font-weight: ${font.weight}; font-style: ${font.style}; font-display: block; }`);
                    if (font.size !== undefined && font.size !== defaultFontSize) {
                        fontSizes.set(font.id, font.size);
                    }
                });
                cssRules.push(`.show-file-icons .file-icon::before, .show-file-icons .folder-icon::before, .show-file-icons .rootfolder-icon::before { font-family: '${fonts[0].id}'; font-size: ${defaultFontSize}; }`);
            }
            for (const defId in selectorByDefinitionId) {
                const selectors = selectorByDefinitionId[defId];
                const definition = iconThemeDocument.iconDefinitions[defId];
                if (definition) {
                    if (definition.iconPath) {
                        cssRules.push(`${selectors.join(', ')} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(resolvePath(definition.iconPath))}; }`);
                    }
                    else if (definition.fontCharacter || definition.fontColor) {
                        const body = [];
                        if (definition.fontColor) {
                            body.push(`color: ${definition.fontColor};`);
                        }
                        if (definition.fontCharacter) {
                            body.push(`content: '${definition.fontCharacter}';`);
                        }
                        const fontSize = definition.fontSize ?? (definition.fontId ? fontSizes.get(definition.fontId) : undefined);
                        if (fontSize) {
                            body.push(`font-size: ${fontSize};`);
                        }
                        if (definition.fontId) {
                            body.push(`font-family: ${definition.fontId};`);
                        }
                        if (showLanguageModeIcons) {
                            body.push(`background-image: unset;`); // potentially set by the language default
                        }
                        cssRules.push(`${selectors.join(', ')} { ${body.join(' ')} }`);
                    }
                }
            }
            if (showLanguageModeIcons) {
                for (const languageId of this.languageService.getRegisteredLanguageIds()) {
                    if (!coveredLanguages[languageId]) {
                        const icon = this.languageService.getIcon(languageId);
                        if (icon) {
                            const selector = `.show-file-icons .${escapeCSS(languageId)}-lang-file-icon.file-icon::before`;
                            cssRules.push(`${selector} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(icon.dark)}; }`);
                            cssRules.push(`.vs ${selector} { content: ' '; background-image: ${(0, dom_1.asCSSUrl)(icon.light)}; }`);
                        }
                    }
                }
            }
            result.content = cssRules.join('\n');
            return result;
        }
    }
    exports.FileIconThemeLoader = FileIconThemeLoader;
    function handleParentFolder(key, selectors) {
        const lastIndexOfSlash = key.lastIndexOf('/');
        if (lastIndexOfSlash >= 0) {
            const parentFolder = key.substring(0, lastIndexOfSlash);
            selectors.push(`.${escapeCSS(parentFolder)}-name-dir-icon`);
            return key.substring(lastIndexOfSlash + 1);
        }
        return key;
    }
    function escapeCSS(str) {
        str = str.replace(/[\11\12\14\15\40]/g, '/'); // HTML class names can not contain certain whitespace characters, use / instead, which doesn't exist in file names.
        return window_1.mainWindow.CSS.escape(str);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUljb25UaGVtZURhdGEuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90aGVtZXMvYnJvd3Nlci9maWxlSWNvblRoZW1lRGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxpQkFBaUI7aUJBRWIsZ0JBQVcsR0FBRyxlQUFlLENBQUM7UUFnQjlDLFlBQW9CLEVBQVUsRUFBRSxLQUFhLEVBQUUsVUFBeUI7WUFDdkUsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM3QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1FBQ2xDLENBQUM7UUFFTSxZQUFZLENBQUMsV0FBZ0M7WUFDbkQsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVNLE1BQU0sQ0FBQyxXQUFnQztZQUM3QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVPLElBQUksQ0FBQyxXQUFnQztZQUM1QyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsQ0FB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