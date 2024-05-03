/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/memento", "vs/platform/theme/common/themeService"], function (require, exports, memento_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Component = void 0;
    class Component extends themeService_1.Themable {
        constructor(id, themeService, storageService) {
            super(themeService);
            this.id = id;
            this.memento = new memento_1.Memento(this.id, storageService);
            this._register(storageService.onWillSaveState(() => {
                // Ask the component to persist state into the memento
                this.saveState();
                // Then save the memento into storage
                this.memento.saveMemento();
            }));
        }
        getId() {
            return this.id;
        }
        getMemento(scope, target) {
            return this.memento.getMemento(scope, target);
        }
        reloadMemento(scope) {
            return this.memento.reloadMemento(scope);
        }
        onDidChangeMementoValue(scope, disposables) {
            return this.memento.onDidChangeValue(scope, disposables);
        }
        saveState() {
            // Subclasses to implement for storing state
        }
    }
    exports.Component = Component;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2NvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBYSxTQUFVLFNBQVEsdUJBQVE7UUFJdEMsWUFDa0IsRUFBVSxFQUMzQixZQUEyQixFQUMzQixjQUErQjtZQUUvQixLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFKSCxPQUFFLEdBQUYsRUFBRSxDQUFRO1lBTTNCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFFcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRTtnQkFFbEQsc0RBQXNEO2dCQUN0RCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBRWpCLHFDQUFxQztnQkFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELEtBQUs7WUFDSixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUVTLFVBQVUsQ0FBQyxLQUFtQixFQUFFLE1BQXFCO1lBQzlELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFFUyxhQUFhLENBQUMsS0FBbUI7WUFDMUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRVMsdUJBQXVCLENBQUMsS0FBbUIsRUFBRSxXQUE0QjtZQUNsRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFUyxTQUFTO1lBQ2xCLDRDQUE0QztRQUM3QyxDQUFDO0tBQ0Q7SUExQ0QsOEJBMENDIn0=