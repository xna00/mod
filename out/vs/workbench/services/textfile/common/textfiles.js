/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/base/common/buffer", "vs/base/common/types"], function (require, exports, files_1, instantiation_1, buffer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncodingMode = exports.TextFileResolveReason = exports.TextFileEditorModelState = exports.TextFileOperationError = exports.TextFileOperationResult = exports.ITextFileService = void 0;
    exports.isTextFileEditorModel = isTextFileEditorModel;
    exports.snapshotToString = snapshotToString;
    exports.stringToSnapshot = stringToSnapshot;
    exports.toBufferOrReadable = toBufferOrReadable;
    exports.ITextFileService = (0, instantiation_1.createDecorator)('textFileService');
    var TextFileOperationResult;
    (function (TextFileOperationResult) {
        TextFileOperationResult[TextFileOperationResult["FILE_IS_BINARY"] = 0] = "FILE_IS_BINARY";
    })(TextFileOperationResult || (exports.TextFileOperationResult = TextFileOperationResult = {}));
    class TextFileOperationError extends files_1.FileOperationError {
        static isTextFileOperationError(obj) {
            return obj instanceof Error && !(0, types_1.isUndefinedOrNull)(obj.textFileOperationResult);
        }
        constructor(message, textFileOperationResult, options) {
            super(message, 10 /* FileOperationResult.FILE_OTHER_ERROR */);
            this.textFileOperationResult = textFileOperationResult;
            this.options = options;
        }
    }
    exports.TextFileOperationError = TextFileOperationError;
    /**
     * States the text file editor model can be in.
     */
    var TextFileEditorModelState;
    (function (TextFileEditorModelState) {
        /**
         * A model is saved.
         */
        TextFileEditorModelState[TextFileEditorModelState["SAVED"] = 0] = "SAVED";
        /**
         * A model is dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["DIRTY"] = 1] = "DIRTY";
        /**
         * A model is currently being saved but this operation has not completed yet.
         */
        TextFileEditorModelState[TextFileEditorModelState["PENDING_SAVE"] = 2] = "PENDING_SAVE";
        /**
         * A model is in conflict mode when changes cannot be saved because the
         * underlying file has changed. Models in conflict mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["CONFLICT"] = 3] = "CONFLICT";
        /**
         * A model is in orphan state when the underlying file has been deleted.
         */
        TextFileEditorModelState[TextFileEditorModelState["ORPHAN"] = 4] = "ORPHAN";
        /**
         * Any error that happens during a save that is not causing the CONFLICT state.
         * Models in error mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["ERROR"] = 5] = "ERROR";
    })(TextFileEditorModelState || (exports.TextFileEditorModelState = TextFileEditorModelState = {}));
    var TextFileResolveReason;
    (function (TextFileResolveReason) {
        TextFileResolveReason[TextFileResolveReason["EDITOR"] = 1] = "EDITOR";
        TextFileResolveReason[TextFileResolveReason["REFERENCE"] = 2] = "REFERENCE";
        TextFileResolveReason[TextFileResolveReason["OTHER"] = 3] = "OTHER";
    })(TextFileResolveReason || (exports.TextFileResolveReason = TextFileResolveReason = {}));
    var EncodingMode;
    (function (EncodingMode) {
        /**
         * Instructs the encoding support to encode the object with the provided encoding
         */
        EncodingMode[EncodingMode["Encode"] = 0] = "Encode";
        /**
         * Instructs the encoding support to decode the object with the provided encoding
         */
        EncodingMode[EncodingMode["Decode"] = 1] = "Decode";
    })(EncodingMode || (exports.EncodingMode = EncodingMode = {}));
    function isTextFileEditorModel(model) {
        const candidate = model;
        return (0, types_1.areFunctions)(candidate.setEncoding, candidate.getEncoding, candidate.save, candidate.revert, candidate.isDirty, candidate.getLanguageId);
    }
    function snapshotToString(snapshot) {
        const chunks = [];
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            chunks.push(chunk);
        }
        return chunks.join('');
    }
    function stringToSnapshot(value) {
        let done = false;
        return {
            read() {
                if (!done) {
                    done = true;
                    return value;
                }
                return null;
            }
        };
    }
    function toBufferOrReadable(value) {
        if (typeof value === 'undefined') {
            return undefined;
        }
        if (typeof value === 'string') {
            return buffer_1.VSBuffer.fromString(value);
        }
        return {
            read: () => {
                const chunk = value.read();
                if (typeof chunk === 'string') {
                    return buffer_1.VSBuffer.fromString(chunk);
                }
                return null;
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dGZpbGVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dGZpbGUvY29tbW9uL3RleHRmaWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFraEJoRyxzREFJQztJQVNELDRDQVNDO0lBRUQsNENBY0M7SUFNRCxnREFtQkM7SUE5akJZLFFBQUEsZ0JBQWdCLEdBQUcsSUFBQSwrQkFBZSxFQUFtQixpQkFBaUIsQ0FBQyxDQUFDO0lBc0lyRixJQUFrQix1QkFFakI7SUFGRCxXQUFrQix1QkFBdUI7UUFDeEMseUZBQWMsQ0FBQTtJQUNmLENBQUMsRUFGaUIsdUJBQXVCLHVDQUF2Qix1QkFBdUIsUUFFeEM7SUFFRCxNQUFhLHNCQUF1QixTQUFRLDBCQUFrQjtRQUU3RCxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBWTtZQUMzQyxPQUFPLEdBQUcsWUFBWSxLQUFLLElBQUksQ0FBQyxJQUFBLHlCQUFpQixFQUFFLEdBQThCLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUM1RyxDQUFDO1FBSUQsWUFDQyxPQUFlLEVBQ1IsdUJBQWdELEVBQ3ZELE9BQXNEO1lBRXRELEtBQUssQ0FBQyxPQUFPLGdEQUF1QyxDQUFDO1lBSDlDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBeUI7WUFLdkQsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBakJELHdEQWlCQztJQXVCRDs7T0FFRztJQUNILElBQWtCLHdCQWlDakI7SUFqQ0QsV0FBa0Isd0JBQXdCO1FBRXpDOztXQUVHO1FBQ0gseUVBQUssQ0FBQTtRQUVMOztXQUVHO1FBQ0gseUVBQUssQ0FBQTtRQUVMOztXQUVHO1FBQ0gsdUZBQVksQ0FBQTtRQUVaOzs7V0FHRztRQUNILCtFQUFRLENBQUE7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