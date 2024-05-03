/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path"], function (require, exports, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mimes = void 0;
    exports.getMediaOrTextMime = getMediaOrTextMime;
    exports.getMediaMime = getMediaMime;
    exports.getExtensionForMimeType = getExtensionForMimeType;
    exports.normalizeMimeType = normalizeMimeType;
    exports.Mimes = Object.freeze({
        text: 'text/plain',
        binary: 'application/octet-stream',
        unknown: 'application/unknown',
        markdown: 'text/markdown',
        latex: 'text/latex',
        uriList: 'text/uri-list',
    });
    const mapExtToTextMimes = {
        '.css': 'text/css',
        '.csv': 'text/csv',
        '.htm': 'text/html',
        '.html': 'text/html',
        '.ics': 'text/calendar',
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.txt': 'text/plain',
        '.xml': 'text/xml'
    };
    // Known media mimes that we can handle
    const mapExtToMediaMimes = {
        '.aac': 'audio/x-aac',
        '.avi': 'video/x-msvideo',
        '.bmp': 'image/bmp',
        '.flv': 'video/x-flv',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.jpe': 'image/jpg',
        '.jpeg': 'image/jpg',
        '.jpg': 'image/jpg',
        '.m1v': 'video/mpeg',
        '.m2a': 'audio/mpeg',
        '.m2v': 'video/mpeg',
        '.m3a': 'audio/mpeg',
        '.mid': 'audio/midi',
        '.midi': 'audio/midi',
        '.mk3d': 'video/x-matroska',
        '.mks': 'video/x-matroska',
        '.mkv': 'video/x-matroska',
        '.mov': 'video/quicktime',
        '.movie': 'video/x-sgi-movie',
        '.mp2': 'audio/mpeg',
        '.mp2a': 'audio/mpeg',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.mp4a': 'audio/mp4',
        '.mp4v': 'video/mp4',
        '.mpe': 'video/mpeg',
        '.mpeg': 'video/mpeg',
        '.mpg': 'video/mpeg',
        '.mpg4': 'video/mp4',
        '.mpga': 'audio/mpeg',
        '.oga': 'audio/ogg',
        '.ogg': 'audio/ogg',
        '.opus': 'audio/opus',
        '.ogv': 'video/ogg',
        '.png': 'image/png',
        '.psd': 'image/vnd.adobe.photoshop',
        '.qt': 'video/quicktime',
        '.spx': 'audio/ogg',
        '.svg': 'image/svg+xml',
        '.tga': 'image/x-tga',
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.wav': 'audio/x-wav',
        '.webm': 'video/webm',
        '.webp': 'image/webp',
        '.wma': 'audio/x-ms-wma',
        '.wmv': 'video/x-ms-wmv',
        '.woff': 'application/font-woff',
    };
    function getMediaOrTextMime(path) {
        const ext = (0, path_1.extname)(path);
        const textMime = mapExtToTextMimes[ext.toLowerCase()];
        if (textMime !== undefined) {
            return textMime;
        }
        else {
            return getMediaMime(path);
        }
    }
    function getMediaMime(path) {
        const ext = (0, path_1.extname)(path);
        return mapExtToMediaMimes[ext.toLowerCase()];
    }
    function getExtensionForMimeType(mimeType) {
        for (const extension in mapExtToMediaMimes) {
            if (mapExtToMediaMimes[extension] === mimeType) {
                return extension;
            }
        }
        return undefined;
    }
    const _simplePattern = /^(.+)\/(.+?)(;.+)?$/;
    function normalizeMimeType(mimeType, strict) {
        const match = _simplePattern.exec(mimeType);
        if (!match) {
            return strict
                ? undefined
                : mimeType;
        }
        // https://datatracker.ietf.org/doc/html/rfc2045#section-5.1
        // media and subtype must ALWAYS be lowercase, parameter not
        return `${match[1].toLowerCase()}/${match[2].toLowerCase()}${match[3] ?? ''}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vbWltZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrRmhHLGdEQVFDO0lBRUQsb0NBR0M7SUFFRCwwREFRQztJQU1ELDhDQVdDO0lBdEhZLFFBQUEsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsTUFBTSxFQUFFLDBCQUEwQjtRQUNsQyxPQUFPLEVBQUUscUJBQXFCO1FBQzlCLFFBQVEsRUFBRSxlQUFlO1FBQ3pCLEtBQUssRUFBRSxZQUFZO1FBQ25CLE9BQU8sRUFBRSxlQUFlO0tBQ3hCLENBQUMsQ0FBQztJQU1ILE1BQU0saUJBQWlCLEdBQXVCO1FBQzdDLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE1BQU0sRUFBRSxXQUFXO1FBQ25CLE9BQU8sRUFBRSxXQUFXO1FBQ3BCLE1BQU0sRUFBRSxlQUFlO1FBQ3ZCLEtBQUssRUFBRSxpQkFBaUI7UUFDeEIsTUFBTSxFQUFFLGlCQUFpQjtRQUN6QixNQUFNLEVBQUUsWUFBWTtRQUNwQixNQUFNLEVBQUUsVUFBVTtLQUNsQixDQUFDO0lBRUYsdUNBQXVDO0lBQ3ZDLE1BQU0sa0JBQWtCLEdBQXVCO1FBQzlDLE1BQU0sRUFBRSxhQUFhO1FBQ3JCLE1BQU0sRUFBRSxpQkFBaUI7UUFDekIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsTUFBTSxFQUFFLGFBQWE7UUFDckIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsTUFBTSxFQUFFLGNBQWM7UUFDdEIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsT0FBTyxFQUFFLFdBQVc7UUFDcEIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsTUFBTSxFQUFFLFlBQVk7UUFDcEIsTUFBTSxF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