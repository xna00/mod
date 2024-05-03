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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento"], function (require, exports, event_1, instantiation_1, storage_1, memento_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatWidgetHistoryService = exports.IChatWidgetHistoryService = void 0;
    exports.IChatWidgetHistoryService = (0, instantiation_1.createDecorator)('IChatWidgetHistoryService');
    let ChatWidgetHistoryService = class ChatWidgetHistoryService {
        constructor(storageService) {
            this._onDidClearHistory = new event_1.Emitter();
            this.onDidClearHistory = this._onDidClearHistory.event;
            this.memento = new memento_1.Memento('interactive-session', storageService);
            const loadedState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            for (const provider in loadedState.history) {
                // Migration from old format
                loadedState.history[provider] = loadedState.history[provider].map(entry => typeof entry === 'string' ? { text: entry } : entry);
            }
            this.viewState = loadedState;
        }
        getHistory(providerId) {
            return this.viewState.history?.[providerId] ?? [];
        }
        saveHistory(providerId, history) {
            if (!this.viewState.history) {
                this.viewState.history = {};
            }
            this.viewState.history[providerId] = history;
            this.memento.saveMemento();
        }
        clearHistory() {
            this.viewState.history = {};
            this.memento.saveMemento();
            this._onDidClearHistory.fire();
        }
    };
    exports.ChatWidgetHistoryService = ChatWidgetHistoryService;
    exports.ChatWidgetHistoryService = ChatWidgetHistoryService = __decorate([
        __param(0, storage_1.IStorageService)
    ], ChatWidgetHistoryService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFdpZGdldEhpc3RvcnlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0V2lkZ2V0SGlzdG9yeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWW5GLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwyQkFBMkIsQ0FBQyxDQUFDO0lBZTFHLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXdCO1FBU3BDLFlBQ2tCLGNBQStCO1lBSmhDLHVCQUFrQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDakQsc0JBQWlCLEdBQWdCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFLdkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLGlCQUFPLENBQUMscUJBQXFCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLCtEQUErRCxDQUFDO1lBQzNHLEtBQUssTUFBTSxRQUFRLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM1Qyw0QkFBNEI7Z0JBQzVCLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNqSSxDQUFDO1lBRUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUM7UUFDOUIsQ0FBQztRQUVELFVBQVUsQ0FBQyxVQUFrQjtZQUM1QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ25ELENBQUM7UUFFRCxXQUFXLENBQUMsVUFBa0IsRUFBRSxPQUE0QjtZQUMzRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxPQUFPLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsWUFBWTtZQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQyxDQUFDO0tBQ0QsQ0FBQTtJQXZDWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQVVsQyxXQUFBLHlCQUFlLENBQUE7T0FWTCx3QkFBd0IsQ0F1Q3BDIn0=