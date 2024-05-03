/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITextModelService = void 0;
    exports.isResolvedTextEditorModel = isResolvedTextEditorModel;
    exports.ITextModelService = (0, instantiation_1.createDecorator)('textModelService');
    function isResolvedTextEditorModel(model) {
        const candidate = model;
        return !!candidate.textEditorModel;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3Jlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrRmhHLDhEQUlDO0lBNUVZLFFBQUEsaUJBQWlCLEdBQUcsSUFBQSwrQkFBZSxFQUFvQixrQkFBa0IsQ0FBQyxDQUFDO0lBd0V4RixTQUFnQix5QkFBeUIsQ0FBQyxLQUF1QjtRQUNoRSxNQUFNLFNBQVMsR0FBRyxLQUFpQyxDQUFDO1FBRXBELE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7SUFDcEMsQ0FBQyJ9