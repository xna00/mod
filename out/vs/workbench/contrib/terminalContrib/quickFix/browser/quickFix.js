/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickFixType = exports.ITerminalQuickFixService = void 0;
    exports.ITerminalQuickFixService = (0, instantiation_1.createDecorator)('terminalQuickFixService');
    var TerminalQuickFixType;
    (function (TerminalQuickFixType) {
        TerminalQuickFixType[TerminalQuickFixType["TerminalCommand"] = 0] = "TerminalCommand";
        TerminalQuickFixType[TerminalQuickFixType["Opener"] = 1] = "Opener";
        TerminalQuickFixType[TerminalQuickFixType["Port"] = 2] = "Port";
        TerminalQuickFixType[TerminalQuickFixType["VscodeCommand"] = 3] = "VscodeCommand";
    })(TerminalQuickFixType || (exports.TerminalQuickFixType = TerminalQuickFixType = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tGaXguanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9xdWlja0ZpeC9icm93c2VyL3F1aWNrRml4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVduRixRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIseUJBQXlCLENBQUMsQ0FBQztJQStCN0csSUFBWSxvQkFLWDtJQUxELFdBQVksb0JBQW9CO1FBQy9CLHFGQUFtQixDQUFBO1FBQ25CLG1FQUFVLENBQUE7UUFDViwrREFBUSxDQUFBO1FBQ1IsaUZBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQUxXLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSy9CIn0=