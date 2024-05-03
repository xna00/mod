/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeGitHubUrl = normalizeGitHubUrl;
    function normalizeGitHubUrl(url) {
        // If the url has a .git suffix, remove it
        if (url.endsWith('.git')) {
            url = url.substr(0, url.length - 4);
        }
        // Remove trailing slash
        url = (0, strings_1.rtrim)(url, '/');
        if (url.endsWith('/new')) {
            url = (0, strings_1.rtrim)(url, '/new');
        }
        if (url.endsWith('/issues')) {
            url = (0, strings_1.rtrim)(url, '/issues');
        }
        return url;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVSZXBvcnRlclV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2lzc3VlL2NvbW1vbi9pc3N1ZVJlcG9ydGVyVXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQUloRyxnREFrQkM7SUFsQkQsU0FBZ0Isa0JBQWtCLENBQUMsR0FBVztRQUM3QywwQ0FBMEM7UUFDMUMsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDMUIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELHdCQUF3QjtRQUN4QixHQUFHLEdBQUcsSUFBQSxlQUFLLEVBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXRCLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQzFCLEdBQUcsR0FBRyxJQUFBLGVBQUssRUFBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzdCLEdBQUcsR0FBRyxJQUFBLGVBQUssRUFBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyJ9