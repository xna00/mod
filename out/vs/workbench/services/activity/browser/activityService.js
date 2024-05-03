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
define(["require", "exports", "vs/workbench/services/activity/common/activity", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/workbench/common/views", "vs/workbench/common/activity", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/common/types"], function (require, exports, activity_1, lifecycle_1, extensions_1, views_1, activity_2, event_1, instantiation_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityService = void 0;
    let ViewContainerActivityByView = class ViewContainerActivityByView extends lifecycle_1.Disposable {
        constructor(viewId, viewDescriptorService, activityService) {
            super();
            this.viewId = viewId;
            this.viewDescriptorService = viewDescriptorService;
            this.activityService = activityService;
            this.activity = undefined;
            this.activityDisposable = lifecycle_1.Disposable.None;
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeContainer, e => e.views.some(view => view.id === viewId))(() => this.update()));
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeLocation, e => e.views.some(view => view.id === viewId))(() => this.update()));
        }
        setActivity(activity) {
            this.activity = activity;
            this.update();
        }
        clearActivity() {
            this.activity = undefined;
            this.update();
        }
        update() {
            this.activityDisposable.dispose();
            const container = this.viewDescriptorService.getViewContainerByViewId(this.viewId);
            if (container && this.activity) {
                this.activityDisposable = this.activityService.showViewContainerActivity(container.id, this.activity);
            }
        }
        dispose() {
            this.activityDisposable.dispose();
            super.dispose();
        }
    };
    ViewContainerActivityByView = __decorate([
        __param(1, views_1.IViewDescriptorService),
        __param(2, activity_1.IActivityService)
    ], ViewContainerActivityByView);
    let ActivityService = class ActivityService extends lifecycle_1.Disposable {
        constructor(viewDescriptorService, instantiationService) {
            super();
            this.viewDescriptorService = viewDescriptorService;
            this.instantiationService = instantiationService;
            this.viewActivities = new Map();
            this._onDidChangeActivity = this._register(new event_1.Emitter());
            this.onDidChangeActivity = this._onDidChangeActivity.event;
            this.viewContainerActivities = new Map();
            this.globalActivities = new Map();
        }
        showViewContainerActivity(viewContainerId, activity) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            if (viewContainer) {
                let activities = this.viewContainerActivities.get(viewContainerId);
                if (!activities) {
                    activities = [];
                    this.viewContainerActivities.set(viewContainerId, activities);
                }
                for (let i = 0; i <= activities.length; i++) {
                    if (i === activities.length || (0, types_1.isUndefined)(activity.priority)) {
                        activities.push(activity);
                        break;
                    }
                    else if ((0, types_1.isUndefined)(activities[i].priority) || activities[i].priority <= activity.priority) {
                        activities.splice(i, 0, activity);
                        break;
                    }
                }
                this._onDidChangeActivity.fire(viewContainer);
                return (0, lifecycle_1.toDisposable)(() => {
                    activities.splice(activities.indexOf(activity), 1);
                    if (activities.length === 0) {
                        this.viewContainerActivities.delete(viewContainerId);
                    }
                    this._onDidChangeActivity.fire(viewContainer);
                });
            }
            return lifecycle_1.Disposable.None;
        }
        getViewContainerActivities(viewContainerId) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            if (viewContainer) {
                return this.viewContainerActivities.get(viewContainerId) ?? [];
            }
            return [];
        }
        showViewActivity(viewId, activity) {
            let maybeItem = this.viewActivities.get(viewId);
            if (maybeItem) {
                maybeItem.id++;
            }
            else {
                maybeItem = {
                    id: 1,
                    activity: this.instantiationService.createInstance(ViewContainerActivityByView, viewId)
                };
                this.viewActivities.set(viewId, maybeItem);
            }
            const id = maybeItem.id;
            maybeItem.activity.setActivity(activity);
            const item = maybeItem;
            return (0, lifecycle_1.toDisposable)(() => {
                if (item.id === id) {
                    item.activity.dispose();
                    this.viewActivities.delete(viewId);
                }
            });
        }
        showAccountsActivity(activity) {
            return this.showActivity(activity_2.ACCOUNTS_ACTIVITY_ID, activity);
        }
        showGlobalActivity(activity) {
            return this.showActivity(activity_2.GLOBAL_ACTIVITY_ID, activity);
        }
        getActivity(id) {
            return this.globalActivities.get(id) ?? [];
        }
        showActivity(id, activity) {
            let activities = this.globalActivities.get(id);
            if (!activities) {
                activities = [];
                this.globalActivities.set(id, activities);
            }
            activities.push(activity);
            this._onDidChangeActivity.fire(id);
            return (0, lifecycle_1.toDisposable)(() => {
                activities.splice(activities.indexOf(activity), 1);
                if (activities.length === 0) {
                    this.globalActivities.delete(id);
                }
                this._onDidChangeActivity.fire(id);
            });
        }
    };
    exports.ActivityService = ActivityService;
    exports.ActivityService = ActivityService = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, instantiation_1.IInstantiationService)
    ], ActivityService);
    (0, extensions_1.registerSingleton)(activity_1.IActivityService, ActivityService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHlTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYWN0aXZpdHkvYnJvd3Nlci9hY3Rpdml0eVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV2hHLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTRCLFNBQVEsc0JBQVU7UUFLbkQsWUFDa0IsTUFBYyxFQUNQLHFCQUE4RCxFQUNwRSxlQUFrRDtZQUVwRSxLQUFLLEVBQUUsQ0FBQztZQUpTLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDVSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ25ELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQU43RCxhQUFRLEdBQTBCLFNBQVMsQ0FBQztZQUM1Qyx1QkFBa0IsR0FBZ0Isc0JBQVUsQ0FBQyxJQUFJLENBQUM7WUFRekQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEosSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUs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