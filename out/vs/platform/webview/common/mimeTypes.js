/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/mime", "vs/base/common/path"], function (require, exports, mime_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWebviewContentMimeType = getWebviewContentMimeType;
    const webviewMimeTypes = new Map([
        ['.svg', 'image/svg+xml'],
        ['.txt', mime_1.Mimes.text],
        ['.css', 'text/css'],
        ['.js', 'application/javascript'],
        ['.cjs', 'application/javascript'],
        ['.mjs', 'application/javascript'],
        ['.json', 'application/json'],
        ['.html', 'text/html'],
        ['.htm', 'text/html'],
        ['.xhtml', 'application/xhtml+xml'],
        ['.oft', 'font/otf'],
        ['.xml', 'application/xml'],
        ['.wasm', 'application/wasm'],
    ]);
    function getWebviewContentMimeType(resource) {
        const ext = (0, path_1.extname)(resource.fsPath).toLowerCase();
        return webviewMimeTypes.get(ext) || (0, mime_1.getMediaMime)(resource.fsPath) || mime_1.Mimes.unknown;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZVR5cGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93ZWJ2aWV3L2NvbW1vbi9taW1lVHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLDhEQUdDO0lBbkJELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUM7UUFDaEMsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO1FBQ3pCLENBQUMsTUFBTSxFQUFFLFlBQUssQ0FBQyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDO1FBQ3BCLENBQUMsS0FBSyxFQUFFLHdCQUF3QixDQUFDO1FBQ2pDLENBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDO1FBQ2xDLENBQUMsTUFBTSxFQUFFLHdCQUF3QixDQUFDO1FBQ2xDLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDO1FBQzdCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQztRQUN0QixDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUM7UUFDckIsQ0FBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUM7UUFDbkMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDO1FBQ3BCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDO1FBQzNCLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDO0tBQzdCLENBQUMsQ0FBQztJQUVILFNBQWdCLHlCQUF5QixDQUFDLFFBQWE7UUFDdEQsTUFBTSxHQUFHLEdBQUcsSUFBQSxjQUFPLEVBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25ELE9BQU8sZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUEsbUJBQVksRUFBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksWUFBSyxDQUFDLE9BQU8sQ0FBQztJQUNwRixDQUFDIn0=