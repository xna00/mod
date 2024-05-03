/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation"], function (require, exports, uri_1, range_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KEYWORD_ACTIVIATION_SETTING_ID = exports.IChatService = exports.ChatCopyKind = exports.InteractiveSessionVoteDirection = void 0;
    exports.isIDocumentContext = isIDocumentContext;
    exports.isIUsedContext = isIUsedContext;
    function isIDocumentContext(obj) {
        return (!!obj &&
            typeof obj === 'object' &&
            'uri' in obj && obj.uri instanceof uri_1.URI &&
            'version' in obj && typeof obj.version === 'number' &&
            'ranges' in obj && Array.isArray(obj.ranges) && obj.ranges.every(range_1.Range.isIRange));
    }
    function isIUsedContext(obj) {
        return (!!obj &&
            typeof obj === 'object' &&
            'documents' in obj &&
            Array.isArray(obj.documents) &&
            obj.documents.every(isIDocumentContext));
    }
    // Name has to match the one in vscode.d.ts for some reason
    var InteractiveSessionVoteDirection;
    (function (InteractiveSessionVoteDirection) {
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Down"] = 0] = "Down";
        InteractiveSessionVoteDirection[InteractiveSessionVoteDirection["Up"] = 1] = "Up";
    })(InteractiveSessionVoteDirection || (exports.InteractiveSessionVoteDirection = InteractiveSessionVoteDirection = {}));
    var ChatCopyKind;
    (function (ChatCopyKind) {
        // Keyboard shortcut or context menu
        ChatCopyKind[ChatCopyKind["Action"] = 1] = "Action";
        ChatCopyKind[ChatCopyKind["Toolbar"] = 2] = "Toolbar";
    })(ChatCopyKind || (exports.ChatCopyKind = ChatCopyKind = {}));
    exports.IChatService = (0, instantiation_1.createDecorator)('IChatService');
    exports.KEYWORD_ACTIVIATION_SETTING_ID = 'accessibility.voice.keywordActivation';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvY29tbW9uL2NoYXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdEaEcsZ0RBUUM7SUFPRCx3Q0FRQztJQXZCRCxTQUFnQixrQkFBa0IsQ0FBQyxHQUFZO1FBQzlDLE9BQU8sQ0FDTixDQUFDLENBQUMsR0FBRztZQUNMLE9BQU8sR0FBRyxLQUFLLFFBQVE7WUFDdkIsS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxZQUFZLFNBQUc7WUFDdEMsU0FBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxPQUFPLEtBQUssUUFBUTtZQUNuRCxRQUFRLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQUssQ0FBQyxRQUFRLENBQUMsQ0FDaEYsQ0FBQztJQUNILENBQUM7SUFPRCxTQUFnQixjQUFjLENBQUMsR0FBWTtRQUMxQyxPQUFPLENBQ04sQ0FBQyxDQUFDLEdBQUc7WUFDTCxPQUFPLEdBQUcsS0FBSyxRQUFRO1lBQ3ZCLFdBQVcsSUFBSSxHQUFHO1lBQ2xCLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztZQUM1QixHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUN2QyxDQUFDO0lBQ0gsQ0FBQztJQXFHRCwyREFBMkQ7SUFDM0QsSUFBWSwrQkFHWDtJQUhELFdBQVksK0JBQStCO1FBQzFDLHFGQUFRLENBQUE7UUFDUixpRkFBTSxDQUFBO0lBQ1AsQ0FBQyxFQUhXLCtCQUErQiwrQ0FBL0IsK0JBQStCLFFBRzFDO0lBUUQsSUFBWSxZQUlYO0lBSkQsV0FBWSxZQUFZO1FBQ3ZCLG9DQUFvQztRQUNwQyxtREFBVSxDQUFBO1FBQ1YscURBQVcsQ0FBQTtJQUNaLENBQUMsRUFKVyxZQUFZLDRCQUFaLFlBQVksUUFJdkI7SUF1RlksUUFBQSxZQUFZLEdBQUcsSUFBQSwrQkFBZSxFQUFlLGNBQWMsQ0FBQyxDQUFDO0lBb0M3RCxRQUFBLDhCQUE4QixHQUFHLHVDQUF1QyxDQUFDIn0=