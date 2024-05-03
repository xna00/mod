/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/languages/modesRegistry", "vs/platform/files/common/files"], function (require, exports, network_1, resources_1, modesRegistry_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIconClasses = getIconClasses;
    exports.getIconClassesForLanguageId = getIconClassesForLanguageId;
    const fileIconDirectoryRegex = /(?:\/|^)(?:([^\/]+)\/)?([^\/]+)$/;
    function getIconClasses(modelService, languageService, resource, fileKind, icon) {
        if (icon) {
            return [`codicon-${icon.id}`, 'predefined-file-icon'];
        }
        // we always set these base classes even if we do not have a path
        const classes = fileKind === files_1.FileKind.ROOT_FOLDER ? ['rootfolder-icon'] : fileKind === files_1.FileKind.FOLDER ? ['folder-icon'] : ['file-icon'];
        if (resource) {
            // Get the path and name of the resource. For data-URIs, we need to parse specially
            let name;
            if (resource.scheme === network_1.Schemas.data) {
                const metadata = resources_1.DataUri.parseMetaData(resource);
                name = metadata.get(resources_1.DataUri.META_DATA_LABEL);
            }
            else {
                const match = resource.path.match(fileIconDirectoryRegex);
                if (match) {
                    name = cssEscape(match[2].toLowerCase());
                    if (match[1]) {
                        classes.push(`${cssEscape(match[1].toLowerCase())}-name-dir-icon`); // parent directory
                    }
                }
                else {
                    name = cssEscape(resource.authority.toLowerCase());
                }
            }
            // Root Folders
            if (fileKind === files_1.FileKind.ROOT_FOLDER) {
                classes.push(`${name}-root-name-folder-icon`);
            }
            // Folders
            else if (fileKind === files_1.FileKind.FOLDER) {
                classes.push(`${name}-name-folder-icon`);
            }
            // Files
            else {
                // Name & Extension(s)
                if (name) {
                    classes.push(`${name}-name-file-icon`);
                    classes.push(`name-file-icon`); // extra segment to increase file-name score
                    // Avoid doing an explosive combination of extensions for very long filenames
                    // (most file systems do not allow files > 255 length) with lots of `.` characters
                    // https://github.com/microsoft/vscode/issues/116199
                    if (name.length <= 255) {
                        const dotSegments = name.split('.');
                        for (let i = 1; i < dotSegments.length; i++) {
                            classes.push(`${dotSegments.slice(i).join('.')}-ext-file-icon`); // add each combination of all found extensions if more than one
                        }
                    }
                    classes.push(`ext-file-icon`); // extra segment to increase file-ext score
                }
                // Detected Mode
                const detectedLanguageId = detectLanguageId(modelService, languageService, resource);
                if (detectedLanguageId) {
                    classes.push(`${cssEscape(detectedLanguageId)}-lang-file-icon`);
                }
            }
        }
        return classes;
    }
    function getIconClassesForLanguageId(languageId) {
        return ['file-icon', `${cssEscape(languageId)}-lang-file-icon`];
    }
    function detectLanguageId(modelService, languageService, resource) {
        if (!resource) {
            return null; // we need a resource at least
        }
        let languageId = null;
        // Data URI: check for encoded metadata
        if (resource.scheme === network_1.Schemas.data) {
            const metadata = resources_1.DataUri.parseMetaData(resource);
            const mime = metadata.get(resources_1.DataUri.META_DATA_MIME);
            if (mime) {
                languageId = languageService.getLanguageIdByMimeType(mime);
            }
        }
        // Any other URI: check for model if existing
        else {
            const model = modelService.getModel(resource);
            if (model) {
                languageId = model.getLanguageId();
            }
        }
        // only take if the language id is specific (aka no just plain text)
        if (languageId && languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID) {
            return languageId;
        }
        // otherwise fallback to path based detection
        return languageService.guessLanguageIdByFilepathOrFirstLine(resource);
    }
    function cssEscape(str) {
        return str.replace(/[\11\12\14\15\40]/g, '/'); // HTML class names can not contain certain whitespace characters, use / instead, which doesn't exist in file names.
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SWNvbkNsYXNzZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvZ2V0SWNvbkNsYXNzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsd0NBZ0VDO0lBRUQsa0VBRUM7SUF0RUQsTUFBTSxzQkFBc0IsR0FBRyxrQ0FBa0MsQ0FBQztJQUVsRSxTQUFnQixjQUFjLENBQUMsWUFBMkIsRUFBRSxlQUFpQyxFQUFFLFFBQXlCLEVBQUUsUUFBbUIsRUFBRSxJQUFnQjtRQUM5SixJQUFJLElBQUksRUFBRSxDQUFDO1lBQ1YsT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELGlFQUFpRTtRQUNqRSxNQUFNLE9BQU8sR0FBRyxRQUFRLEtBQUssZ0JBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxLQUFLLGdCQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pJLElBQUksUUFBUSxFQUFFLENBQUM7WUFFZCxtRkFBbUY7WUFDbkYsSUFBSSxJQUF3QixDQUFDO1lBQzdCLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN0QyxNQUFNLFFBQVEsR0FBRyxtQkFBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDakQsSUFBSSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUJBQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM5QyxDQUFDO2lCQUFNLENBQUM7Z0JB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