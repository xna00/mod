/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DraggedTreeItemsIdentifier = exports.TreeViewsDnDService = void 0;
    class TreeViewsDnDService {
        constructor() {
            this._dragOperations = new Map();
        }
        removeDragOperationTransfer(uuid) {
            if ((uuid && this._dragOperations.has(uuid))) {
                const operation = this._dragOperations.get(uuid);
                this._dragOperations.delete(uuid);
                return operation;
            }
            return undefined;
        }
        addDragOperationTransfer(uuid, transferPromise) {
            this._dragOperations.set(uuid, transferPromise);
        }
    }
    exports.TreeViewsDnDService = TreeViewsDnDService;
    class DraggedTreeItemsIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedTreeItemsIdentifier = DraggedTreeItemsIdentifier;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXdzRG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3NlcnZpY2VzL3RyZWVWaWV3c0RuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxtQkFBbUI7UUFBaEM7WUFFUyxvQkFBZSxHQUF3QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBYzFFLENBQUM7UUFaQSwyQkFBMkIsQ0FBQyxJQUF3QjtZQUNuRCxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELHdCQUF3QixDQUFDLElBQVksRUFBRSxlQUF1QztZQUM3RSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDakQsQ0FBQztLQUNEO0lBaEJELGtEQWdCQztJQUdELE1BQWEsMEJBQTBCO1FBRXRDLFlBQXFCLFVBQWtCO1lBQWxCLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBSSxDQUFDO0tBQzVDO0lBSEQsZ0VBR0MifQ==