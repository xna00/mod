/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorContext = void 0;
    class CursorContext {
        constructor(model, viewModel, coordinatesConverter, cursorConfig) {
            this._cursorContextBrand = undefined;
            this.model = model;
            this.viewModel = viewModel;
            this.coordinatesConverter = coordinatesConverter;
            this.cursorConfig = cursorConfig;
        }
    }
    exports.CursorContext = CursorContext;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jdXJzb3IvY3Vyc29yQ29udGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxhQUFhO1FBUXpCLFlBQVksS0FBaUIsRUFBRSxTQUE2QixFQUFFLG9CQUEyQyxFQUFFLFlBQWlDO1lBUDVJLHdCQUFtQixHQUFTLFNBQVMsQ0FBQztZQVFyQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUMzQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7WUFDakQsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDbEMsQ0FBQztLQUNEO0lBZEQsc0NBY0MifQ==