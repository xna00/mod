/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/instantiation/common/instantiation"], function (require, exports, path_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = exports.IV8InspectProfilingService = void 0;
    exports.IV8InspectProfilingService = (0, instantiation_1.createDecorator)('IV8InspectProfilingService');
    var Utils;
    (function (Utils) {
        function isValidProfile(profile) {
            return Boolean(profile.samples && profile.timeDeltas);
        }
        Utils.isValidProfile = isValidProfile;
        function rewriteAbsolutePaths(profile, replace = 'noAbsolutePaths') {
            for (const node of profile.nodes) {
                if (node.callFrame && node.callFrame.url) {
                    if ((0, path_1.isAbsolute)(node.callFrame.url) || /^\w[\w\d+.-]*:\/\/\/?/.test(node.callFrame.url)) {
                        node.callFrame.url = (0, path_1.join)(replace, (0, path_1.basename)(node.callFrame.url));
                    }
                }
            }
            return profile;
        }
        Utils.rewriteAbsolutePaths = rewriteAbsolutePaths;
    })(Utils || (exports.Utils = Utils = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9wcm9maWxpbmcvY29tbW9uL3Byb2ZpbGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4Qm5GLFFBQUEsMEJBQTBCLEdBQUcsSUFBQSwrQkFBZSxFQUE2Qiw0QkFBNEIsQ0FBQyxDQUFDO0lBWXBILElBQWlCLEtBQUssQ0FnQnJCO0lBaEJELFdBQWlCLEtBQUs7UUFFckIsU0FBZ0IsY0FBYyxDQUFDLE9BQW1CO1lBQ2pELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7UUFGZSxvQkFBYyxpQkFFN0IsQ0FBQTtRQUVELFNBQWdCLG9CQUFvQixDQUFDLE9BQW1CLEVBQUUsVUFBa0IsaUJBQWlCO1lBQzVGLEtBQUssTUFBTSxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxJQUFBLGlCQUFVLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUN4RixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxJQUFBLFdBQUksRUFBQyxPQUFPLEVBQUUsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNsRSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQVRlLDBCQUFvQix1QkFTbkMsQ0FBQTtJQUNGLENBQUMsRUFoQmdCLEtBQUsscUJBQUwsS0FBSyxRQWdCckIifQ==