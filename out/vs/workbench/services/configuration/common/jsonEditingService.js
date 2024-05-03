/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/async", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/editor/common/services/resolverService", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, json, jsonEdit_1, async_1, editOperation_1, range_1, selection_1, textfiles_1, files_1, resolverService_1, jsonEditing_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JSONEditingService = void 0;
    let JSONEditingService = class JSONEditingService {
        constructor(fileService, textModelResolverService, textFileService) {
            this.fileService = fileService;
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.queue = new async_1.Queue();
        }
        write(resource, values) {
            return Promise.resolve(this.queue.queue(() => this.doWriteConfiguration(resource, values))); // queue up writes to prevent race conditions
        }
        async doWriteConfiguration(resource, values) {
            const reference = await this.resolveAndValidate(resource, true);
            try {
                await this.writeToBuffer(reference.object.textEditorModel, values);
            }
            finally {
                reference.dispose();
            }
        }
        async writeToBuffer(model, values) {
            let hasEdits = false;
            for (const value of values) {
                const edit = this.getEdits(model, value)[0];
                hasEdits = !!edit && this.applyEditsToBuffer(edit, model);
            }
            if (hasEdits) {
                return this.textFileService.save(model.uri);
            }
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            const currentText = model.getValueInRange(range);
            if (edit.content !== currentText) {
                const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
                model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
                return true;
            }
            return false;
        }
        getEdits(model, configurationValue) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const { path, value } = configurationValue;
            // With empty path the entire file is being replaced, so we just use JSON.stringify
            if (!path.length) {
                const content = JSON.stringify(value, null, insertSpaces ? ' '.repeat(tabSize) : '\t');
                return [{
                        content,
                        length: content.length,
                        offset: 0
                    }];
            }
            return (0, jsonEdit_1.setProperty)(model.getValue(), path, value, { tabSize, insertSpaces, eol });
        }
        async resolveModelReference(resource) {
            const exists = await this.fileService.exists(resource);
            if (!exists) {
                await this.textFileService.write(resource, '{}', { encoding: 'utf8' });
            }
            return this.textModelResolverService.createModelReference(resource);
        }
        hasParseErrors(model) {
            const parseErrors = [];
            json.parse(model.getValue(), parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            return parseErrors.length > 0;
        }
        async resolveAndValidate(resource, checkDirty) {
            const reference = await this.resolveModelReference(resource);
            const model = reference.object.textEditorModel;
            if (this.hasParseErrors(model)) {
                reference.dispose();
                return this.reject(0 /* JSONEditingErrorCode.ERROR_INVALID_FILE */);
            }
            return reference;
        }
        reject(code) {
            const message = this.toErrorMessage(code);
            return Promise.reject(new jsonEditing_1.JSONEditingError(message, code));
        }
        toErrorMessage(error) {
            switch (error) {
                // User issues
                case 0 /* JSONEditingErrorCode.ERROR_INVALID_FILE */: {
                    return nls.localize('errorInvalidFile', "Unable to write into the file. Please open the file to correct errors/warnings in the file and try again.");
                }
            }
        }
    };
    exports.JSONEditingService = JSONEditingService;
    exports.JSONEditingService = JSONEditingService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, textfiles_1.ITextFileService)
    ], JSONEditingService);
    (0, extensions_1.registerSingleton)(jsonEditing_1.IJSONEditingService, JSONEditingService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbkVkaXRpbmdTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29uZmlndXJhdGlvbi9jb21tb24vanNvbkVkaXRpbmdTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7UUFNOUIsWUFDZ0MsV0FBeUIsRUFDcEIsd0JBQTJDLEVBQzVDLGVBQWlDO1lBRnJDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3BCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBbUI7WUFDNUMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBRXBFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxhQUFLLEVBQVEsQ0FBQztRQUNoQyxDQUFDO1FBRUQsS0FBSyxDQUFDLFFBQWEsRUFBRSxNQUFvQjtZQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw2Q0FBNkM7UUFDM0ksQ0FBQztRQUVPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUFhLEVBQUUsTUFBb0I7WUFDckUsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEUsQ0FBQztvQkFBUyxDQUFDO2dCQUNWLFNBQVMsQ0FB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