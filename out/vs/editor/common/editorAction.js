/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalEditorAction = void 0;
    class InternalEditorAction {
        constructor(id, label, alias, metadata, _precondition, _run, _contextKeyService) {
            this.id = id;
            this.label = label;
            this.alias = alias;
            this.metadata = metadata;
            this._precondition = _precondition;
            this._run = _run;
            this._contextKeyService = _contextKeyService;
        }
        isSupported() {
            return this._contextKeyService.contextMatchesRules(this._precondition);
        }
        run(args) {
            if (!this.isSupported()) {
                return Promise.resolve(undefined);
            }
            return this._run(args);
        }
    }
    exports.InternalEditorAction = InternalEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2VkaXRvckFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxvQkFBb0I7UUFFaEMsWUFDaUIsRUFBVSxFQUNWLEtBQWEsRUFDYixLQUFhLEVBQ2IsUUFBc0MsRUFDckMsYUFBK0MsRUFDL0MsSUFBc0MsRUFDdEMsa0JBQXNDO1lBTnZDLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLGFBQVEsR0FBUixRQUFRLENBQThCO1lBQ3JDLGtCQUFhLEdBQWIsYUFBYSxDQUFrQztZQUMvQyxTQUFJLEdBQUosSUFBSSxDQUFrQztZQUN0Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1FBQ3BELENBQUM7UUFFRSxXQUFXO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRU0sR0FBRyxDQUFDLElBQWE7WUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUN6QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDO0tBQ0Q7SUF2QkQsb0RBdUJDIn0=