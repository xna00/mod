/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/zip", "vs/nls"], function (require, exports, zip_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getManifest = getManifest;
    function getManifest(vsix) {
        return (0, zip_1.buffer)(vsix, 'extension/package.json')
            .then(buffer => {
            try {
                return JSON.parse(buffer.toString('utf8'));
            }
            catch (err) {
                throw new Error((0, nls_1.localize)('invalidManifest', "VSIX invalid: package.json is not a JSON file."));
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWFuYWdlbWVudFV0aWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25NYW5hZ2VtZW50VXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxrQ0FTQztJQVRELFNBQWdCLFdBQVcsQ0FBQyxJQUFZO1FBQ3ZDLE9BQU8sSUFBQSxZQUFNLEVBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDO2FBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNkLElBQUksQ0FBQztnQkFDSixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO1lBQ2hHLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMifQ==