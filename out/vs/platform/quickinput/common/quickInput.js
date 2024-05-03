/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, instantiation_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IQuickInputService = exports.quickPickItemScorerAccessor = exports.QuickPickItemScorerAccessor = exports.ItemActivation = exports.QuickInputHideReason = exports.NO_KEY_MODS = void 0;
    exports.NO_KEY_MODS = { ctrlCmd: false, alt: false };
    var QuickInputHideReason;
    (function (QuickInputHideReason) {
        /**
         * Focus moved away from the quick input.
         */
        QuickInputHideReason[QuickInputHideReason["Blur"] = 1] = "Blur";
        /**
         * An explicit user gesture, e.g. pressing Escape key.
         */
        QuickInputHideReason[QuickInputHideReason["Gesture"] = 2] = "Gesture";
        /**
         * Anything else.
         */
        QuickInputHideReason[QuickInputHideReason["Other"] = 3] = "Other";
    })(QuickInputHideReason || (exports.QuickInputHideReason = QuickInputHideReason = {}));
    /**
     * Represents the activation behavior for items in a quick input. This means which item will be
     * "active" (aka focused).
     */
    var ItemActivation;
    (function (ItemActivation) {
        /**
         * No item will be active.
         */
        ItemActivation[ItemActivation["NONE"] = 0] = "NONE";
        /**
         * First item will be active.
         */
        ItemActivation[ItemActivation["FIRST"] = 1] = "FIRST";
        /**
         * Second item will be active.
         */
        ItemActivation[ItemActivation["SECOND"] = 2] = "SECOND";
        /**
         * Last item will be active.
         */
        ItemActivation[ItemActivation["LAST"] = 3] = "LAST";
    })(ItemActivation || (exports.ItemActivation = ItemActivation = {}));
    class QuickPickItemScorerAccessor {
        constructor(options) {
            this.options = options;
        }
        getItemLabel(entry) {
            return entry.label;
        }
        getItemDescription(entry) {
            if (this.options?.skipDescription) {
                return undefined;
            }
            return entry.description;
        }
        getItemPath(entry) {
            if (this.options?.skipPath) {
                return undefined;
            }
            if (entry.resource?.scheme === network_1.Schemas.file) {
                return entry.resource.fsPath;
            }
            return entry.resource?.path;
        }
    }
    exports.QuickPickItemScorerAccessor = QuickPickItemScorerAccessor;
    exports.quickPickItemScorerAccessor = new QuickPickItemScorerAccessor();
    //#endregion
    exports.IQuickInputService = (0, instantiation_1.createDecorator)('quickInputService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVpY2tJbnB1dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcXVpY2tpbnB1dC9jb21tb24vcXVpY2tJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtRW5GLFFBQUEsV0FBVyxHQUFhLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFrSHBFLElBQVksb0JBZ0JYO0lBaEJELFdBQVksb0JBQW9CO1FBRS9COztXQUVHO1FBQ0gsK0RBQVEsQ0FBQTtRQUVSOztXQUVHO1FBQ0gscUVBQU8sQ0FBQTtRQUVQOztXQUVHO1FBQ0gsaUVBQUssQ0FBQTtJQUNOLENBQUMsRUFoQlcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFnQi9CO0lBb0lEOzs7T0FHRztJQUNILElBQVksY0FpQlg7SUFqQkQsV0FBWSxjQUFjO1FBQ3pCOztXQUVHO1FBQ0gsbURBQUksQ0FBQTtRQUNKOztXQUVHO1FBQ0gscURBQUssQ0FBQTtRQUNMOztXQUVHO1FBQ0gsdURBQU0sQ0FBQTtRQUNOOztXQUVHO1FBQ0gsbURBQUksQ0FBQTtJQUNMLENBQUMsRUFqQlcsY0FBYyw4QkFBZCxjQUFjLFFBaUJ6QjtJQXNWRCxNQUFhLDJCQUEyQjtRQUV2QyxZQUFvQixPQUEyRDtZQUEzRCxZQUFPLEdBQVAsT0FBTyxDQUFvRDtRQUFJLENBQUM7UUFFcEYsWUFBWSxDQUFDLEtBQWlDO1lBQzdDLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNwQixDQUFDO1FBRUQsa0JBQWtCLENBQUMsS0FBaUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQzFCLENBQUM7UUFFRCxXQUFXLENBQUMsS0FBaUM7WUFDNUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO2dCQUM1QixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUM3QyxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO1lBQzlCLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO1FBQzdCLENBQUM7S0FDRDtJQTNCRCxrRUEyQkM7SUFFWSxRQUFBLDJCQUEyQixHQUFHLElBQUksMkJBQTJCLEVBQUUsQ0FBQztJQUU3RSxZQUFZO0lBRUMsUUFBQSxrQkFBa0IsR0FBRyxJQUFBLCtCQUFlLEVBQXFCLG1CQUFtQixDQUFDLENBQUMifQ==