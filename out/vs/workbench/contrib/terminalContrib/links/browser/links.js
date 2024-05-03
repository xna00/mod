/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalBuiltinLinkType = exports.ITerminalLinkProviderService = void 0;
    exports.ITerminalLinkProviderService = (0, instantiation_1.createDecorator)('terminalLinkProviderService');
    var TerminalBuiltinLinkType;
    (function (TerminalBuiltinLinkType) {
        /**
         * The link is validated to be a file on the file system and will open an editor.
         */
        TerminalBuiltinLinkType["LocalFile"] = "LocalFile";
        /**
         * The link is validated to be a folder on the file system and is outside the workspace. It will
         * reveal the folder within the explorer.
         */
        TerminalBuiltinLinkType["LocalFolderOutsideWorkspace"] = "LocalFolderOutsideWorkspace";
        /**
         * The link is validated to be a folder on the file system and is within the workspace and will
         * reveal the folder within the explorer.
         */
        TerminalBuiltinLinkType["LocalFolderInWorkspace"] = "LocalFolderInWorkspace";
        /**
         * A low confidence link which will search for the file in the workspace. If there is a single
         * match, it will open the file; otherwise, it will present the matches in a quick pick.
         */
        TerminalBuiltinLinkType["Search"] = "Search";
        /**
         * A link whose text is a valid URI.
         */
        TerminalBuiltinLinkType["Url"] = "Url";
    })(TerminalBuiltinLinkType || (exports.TerminalBuiltinLinkType = TerminalBuiltinLinkType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlua3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9saW5rcy9icm93c2VyL2xpbmtzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNuRixRQUFBLDRCQUE0QixHQUFHLElBQUEsK0JBQWUsRUFBK0IsNkJBQTZCLENBQUMsQ0FBQztJQXNHekgsSUFBa0IsdUJBNEJqQjtJQTVCRCxXQUFrQix1QkFBdUI7UUFDeEM7O1dBRUc7UUFDSCxrREFBdUIsQ0FBQTtRQUV2Qjs7O1dBR0c7UUFDSCxzRkFBMkQsQ0FBQTtRQUUzRDs7O1dBR0c7UUFDSCw0RUFBaUQsQ0FBQTtRQUVqRDs7O1dBR0c7UUFDSCw0Q0FBaUIsQ0FBQTtRQUVqQjs7V0FFRztRQUNILHNDQUFXLENBQUE7SUFDWixDQUFDLEVBNUJpQix1QkFBdUIsdUNBQXZCLHVCQUF1QixRQTRCeEMifQ==