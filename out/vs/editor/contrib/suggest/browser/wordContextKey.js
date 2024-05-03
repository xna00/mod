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
    var WordContextKey_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordContextKey = void 0;
    let WordContextKey = class WordContextKey {
        static { WordContextKey_1 = this; }
        static { this.AtEnd = new contextkey_1.RawContextKey('atEndOfWord', false); }
        constructor(_editor, contextKeyService) {
            this._editor = _editor;
            this._enabled = false;
            this._ckAtEnd = WordContextKey_1.AtEnd.bindTo(contextKeyService);
            this._configListener = this._editor.onDidChangeConfiguration(e => e.hasChanged(123 /* EditorOption.tabCompletion */) && this._update());
            this._update();
        }
        dispose() {
            this._configListener.dispose();
            this._selectionListener?.dispose();
            this._ckAtEnd.reset();
        }
        _update() {
            // only update this when tab completions are enabled
            const enabled = this._editor.getOption(123 /* EditorOption.tabCompletion */) === 'on';
            if (this._enabled === enabled) {
                return;
            }
            this._enabled = enabled;
            if (this._enabled) {
                const checkForWordEnd = () => {
                    if (!this._editor.hasModel()) {
                        this._ckAtEnd.set(false);
                        return;
                    }
                    const model = this._editor.getModel();
                    const selection = this._editor.getSelection();
                    const word = model.getWordAtPosition(selection.getStartPosition());
                    if (!word) {
                        this._ckAtEnd.set(false);
                        return;
                    }
                    this._ckAtEnd.set(word.endColumn === selection.getStartPosition().column);
                };
                this._selectionListener = this._editor.onDidChangeCursorSelection(checkForWordEnd);
                checkForWordEnd();
            }
            else if (this._selectionListener) {
                this._ckAtEnd.reset();
                this._selectionListener.dispose();
                this._selectionListener = undefined;
            }
        }
    };
    exports.WordContextKey = WordContextKey;
    exports.WordContextKey = WordContextKey = WordContextKey_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], WordContextKey);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZENvbnRleHRLZXkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvYnJvd3Nlci93b3JkQ29udGV4dEtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBT3pGLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWM7O2lCQUVWLFVBQUssR0FBRyxJQUFJLDBCQUFhLENBQVUsYUFBYSxFQUFFLEtBQUssQ0FBQyxBQUFuRCxDQUFvRDtRQVF6RSxZQUNrQixPQUFvQixFQUNqQixpQkFBcUM7WUFEeEMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUo5QixhQUFRLEdBQVksS0FBSyxDQUFDO1lBUWpDLElBQUksQ0FBQyxRQUFRLEdBQUcsZ0JBQWMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsc0NBQTRCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDOUgsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBRU8sT0FBTztZQUNkLG9EQUFvRDtZQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsc0NBQTRCLEtBQUssSUFBSSxDQUFDO1lBQzVFLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUV4QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFO29CQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3dCQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDekIsT0FBTztvQkFDUixDQUFDO29CQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3RDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzlDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO29CQUNuRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ1gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ3pCLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzRSxDQUFDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ25GLGVBQWUsRUFBRSxDQUFDO1lBRW5CLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDOztJQXpEVyx3Q0FBYzs2QkFBZCxjQUFjO1FBWXhCLFdBQUEsK0JBQWtCLENBQUE7T0FaUixjQUFjLENBMEQxQiJ9