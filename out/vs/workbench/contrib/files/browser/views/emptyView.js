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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/browser/dnd", "vs/platform/theme/common/colorRegistry", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/base/common/platform", "vs/base/browser/dom"], function (require, exports, nls, instantiation_1, themeService_1, keybinding_1, contextView_1, workspace_1, configuration_1, viewPane_1, dnd_1, colorRegistry_1, label_1, contextkey_1, views_1, opener_1, telemetry_1, platform_1, dom_1) {
    "use strict";
    var EmptyView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmptyView = void 0;
    let EmptyView = class EmptyView extends viewPane_1.ViewPane {
        static { EmptyView_1 = this; }
        static { this.ID = 'workbench.explorer.emptyView'; }
        static { this.NAME = nls.localize2('noWorkspace', "No Folder Opened"); }
        constructor(options, themeService, viewDescriptorService, instantiationService, keybindingService, contextMenuService, contextService, configurationService, labelService, contextKeyService, openerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.contextService = contextService;
            this.labelService = labelService;
            this._disposed = false;
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.refreshTitle()));
            this._register(this.labelService.onDidChangeFormatters(() => this.refreshTitle()));
        }
        shouldShowWelcome() {
            return true;
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(new dom_1.DragAndDropObserver(container, {
                onDrop: e => {
                    container.style.backgroundColor = '';
                    const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: !platform_1.isWeb || (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) });
                    dropHandler.handleDrop(e, (0, dom_1.getWindow)(container));
                },
                onDragEnter: () => {
                    const color = this.themeService.getColorTheme().getColor(colorRegistry_1.listDropOverBackground);
                    container.style.backgroundColor = color ? color.toString() : '';
                },
                onDragEnd: () => {
                    container.style.backgroundColor = '';
                },
                onDragLeave: () => {
                    container.style.backgroundColor = '';
                },
                onDragOver: e => {
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                }
            }));
            this.refreshTitle();
        }
        refreshTitle() {
            if (this._disposed) {
                return;
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                this.updateTitle(EmptyView_1.NAME.value);
            }
            else {
                this.updateTitle(this.title);
            }
        }
        dispose() {
            this._disposed = true;
            super.dispose();
        }
    };
    exports.EmptyView = EmptyView;
    exports.EmptyView = EmptyView = EmptyView_1 = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, label_1.ILabelService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, opener_1.IOpenerService),
        __param(11, telemetry_1.ITelemetryService)
    ], EmptyView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHlWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL3ZpZXdzL2VtcHR5Vmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLFNBQVMsR0FBZixNQUFNLFNBQVUsU0FBUSxtQkFBUTs7aUJBRXRCLE9BQUUsR0FBVyw4QkFBOEIsQUFBekMsQ0FBMEM7aUJBQzVDLFNBQUksR0FBcUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQUFBckUsQ0FBc0U7UUFHMUYsWUFDQyxPQUE0QixFQUNiLFlBQTJCLEVBQ2xCLHFCQUE2QyxFQUM5QyxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3BDLGtCQUF1QyxFQUNsQyxjQUF5RCxFQUM1RCxvQkFBMkMsRUFDbkQsWUFBbUMsRUFDOUIsaUJBQXFDLEVBQ3pDLGFBQTZCLEVBQzFCLGdCQUFtQztZQUV0RCxLQUFLLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQVBoSixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFFNUQsaUJBQVksR0FBWixZQUFZLENBQWU7WUFYM0MsY0FBUyxHQUFZLEtBQUssQ0FBQztZQWtCbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxD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