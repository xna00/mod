/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer"], function (require, exports, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLogMarkers = exports.MessageType = exports.ExtensionHostExitCode = exports.UIKind = void 0;
    exports.createMessageOfType = createMessageOfType;
    exports.isMessageOfType = isMessageOfType;
    var UIKind;
    (function (UIKind) {
        UIKind[UIKind["Desktop"] = 1] = "Desktop";
        UIKind[UIKind["Web"] = 2] = "Web";
    })(UIKind || (exports.UIKind = UIKind = {}));
    var ExtensionHostExitCode;
    (function (ExtensionHostExitCode) {
        // nodejs uses codes 1-13 and exit codes >128 are signal exits
        ExtensionHostExitCode[ExtensionHostExitCode["VersionMismatch"] = 55] = "VersionMismatch";
        ExtensionHostExitCode[ExtensionHostExitCode["UnexpectedError"] = 81] = "UnexpectedError";
    })(ExtensionHostExitCode || (exports.ExtensionHostExitCode = ExtensionHostExitCode = {}));
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["Initialized"] = 0] = "Initialized";
        MessageType[MessageType["Ready"] = 1] = "Ready";
        MessageType[MessageType["Terminate"] = 2] = "Terminate";
    })(MessageType || (exports.MessageType = MessageType = {}));
    function createMessageOfType(type) {
        const result = buffer_1.VSBuffer.alloc(1);
        switch (type) {
            case 0 /* MessageType.Initialized */:
                result.writeUInt8(1, 0);
                break;
            case 1 /* MessageType.Ready */:
                result.writeUInt8(2, 0);
                break;
            case 2 /* MessageType.Terminate */:
                result.writeUInt8(3, 0);
                break;
        }
        return result;
    }
    function isMessageOfType(message, type) {
        if (message.byteLength !== 1) {
            return false;
        }
        switch (message.readUInt8(0)) {
            case 1: return type === 0 /* MessageType.Initialized */;
            case 2: return type === 1 /* MessageType.Ready */;
            case 3: return type === 2 /* MessageType.Terminate */;
            default: return false;
        }
    }
    var NativeLogMarkers;
    (function (NativeLogMarkers) {
        NativeLogMarkers["Start"] = "START_NATIVE_LOG";
        NativeLogMarkers["End"] = "END_NATIVE_LOG";
    })(NativeLogMarkers || (exports.NativeLogMarkers = NativeLogMarkers = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdFByb3RvY29sLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9ucy9jb21tb24vZXh0ZW5zaW9uSG9zdFByb3RvY29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVIaEcsa0RBVUM7SUFFRCwwQ0FXQztJQXhERCxJQUFZLE1BR1g7SUFIRCxXQUFZLE1BQU07UUFDakIseUNBQVcsQ0FBQTtRQUNYLGlDQUFPLENBQUE7SUFDUixDQUFDLEVBSFcsTUFBTSxzQkFBTixNQUFNLFFBR2pCO0lBRUQsSUFBa0IscUJBSWpCO0lBSkQsV0FBa0IscUJBQXFCO1FBQ3RDLDhEQUE4RDtRQUM5RCx3RkFBb0IsQ0FBQTtRQUNwQix3RkFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBSmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBSXRDO0lBa0JELElBQWtCLFdBSWpCO0lBSkQsV0FBa0IsV0FBVztRQUM1QiwyREFBVyxDQUFBO1FBQ1gsK0NBQUssQ0FBQTtRQUNMLHVEQUFTLENBQUE7SUFDVixDQUFDLEVBSmlCLFdBQVcsMkJBQVgsV0FBVyxRQUk1QjtJQUVELFNBQWdCLG1CQUFtQixDQUFDLElBQWlCO1FBQ3BELE1BQU0sTUFBTSxHQUFHLGlCQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRWpDLFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDZDtnQkFBOEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUM3RDtnQkFBd0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtZQUN2RDtnQkFBNEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTTtRQUM1RCxDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLE9BQWlCLEVBQUUsSUFBaUI7UUFDbkUsSUFBSSxPQUFPLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzlCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFFBQVEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzlCLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLG9DQUE0QixDQUFDO1lBQ2hELEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLDhCQUFzQixDQUFDO1lBQzFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLGtDQUEwQixDQUFDO1lBQzlDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDO1FBQ3ZCLENBQUM7SUFDRixDQUFDO0lBRUQsSUFBa0IsZ0JBR2pCO0lBSEQsV0FBa0IsZ0JBQWdCO1FBQ2pDLDhDQUEwQixDQUFBO1FBQzFCLDBDQUFzQixDQUFBO0lBQ3ZCLENBQUMsRUFIaUIsZ0JBQWdCLGdDQUFoQixnQkFBZ0IsUUFHakMifQ==