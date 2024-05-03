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
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    var SuggestAlternatives_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestAlternatives = void 0;
    let SuggestAlternatives = class SuggestAlternatives {
        static { SuggestAlternatives_1 = this; }
        static { this.OtherSuggestions = new contextkey_1.RawContextKey('hasOtherSuggestions', false); }
        constructor(_editor, contextKeyService) {
            this._editor = _editor;
            this._index = 0;
            this._ckOtherSuggestions = SuggestAlternatives_1.OtherSuggestions.bindTo(contextKeyService);
        }
        dispose() {
            this.reset();
        }
        reset() {
            this._ckOtherSuggestions.reset();
            this._listener?.dispose();
            this._model = undefined;
            this._acceptNext = undefined;
            this._ignore = false;
        }
        set({ model, index }, acceptNext) {
            // no suggestions -> nothing to do
            if (model.items.length === 0) {
                this.reset();
                return;
            }
            // no alternative suggestions -> nothing to do
            const nextIndex = SuggestAlternatives_1._moveIndex(true, model, index);
            if (nextIndex === index) {
                this.reset();
                return;
            }
            this._acceptNext = acceptNext;
            this._model = model;
            this._index = index;
            this._listener = this._editor.onDidChangeCursorPosition(() => {
                if (!this._ignore) {
                    this.reset();
                }
            });
            this._ckOtherSuggestions.set(true);
        }
        static _moveIndex(fwd, model, index) {
            let newIndex = index;
            for (let rounds = model.items.length; rounds > 0; rounds--) {
                newIndex = (newIndex + model.items.length + (fwd ? +1 : -1)) % model.items.length;
                if (newIndex === index) {
                    break;
                }
                if (!model.items[newIndex].completion.additionalTextEdits) {
                    break;
                }
            }
            return newIndex;
        }
        next() {
            this._move(true);
        }
        prev() {
            this._move(false);
        }
        _move(fwd) {
            if (!this._model) {
                // nothing to reason about
                return;
            }
            try {
                this._ignore = true;
                this._index = SuggestAlternatives_1._moveIndex(fwd, this._model, this._index);
                this._acceptNext({ index: this._index, item: this._model.items[this._index], model: this._model });
            }
            finally {
                this._ignore = false;
            }
        }
    };
    exports.SuggestAlternatives = SuggestAlternatives;
    exports.SuggestAlternatives = SuggestAlternatives = SuggestAlternatives_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], SuggestAlternatives);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdEFsdGVybmF0aXZlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RBbHRlcm5hdGl2ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFtQjs7aUJBRWYscUJBQWdCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxBQUEzRCxDQUE0RDtRQVU1RixZQUNrQixPQUFvQixFQUNqQixpQkFBcUM7WUFEeEMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQVA5QixXQUFNLEdBQVcsQ0FBQyxDQUFDO1lBVTFCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxxQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNkLENBQUM7UUFFRCxLQUFLO1lBQ0osSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7WUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDdEIsQ0FBQztRQUVELEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQXVCLEVBQUUsVUFBa0Q7WUFFNUYsa0NBQWtDO1lBQ2xDLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7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