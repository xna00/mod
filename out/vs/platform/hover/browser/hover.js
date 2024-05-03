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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/base/browser/dom"], function (require, exports, instantiation_1, lifecycle_1, configuration_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nativeHoverDelegate = exports.WorkbenchHoverDelegate = exports.IHoverService = void 0;
    exports.IHoverService = (0, instantiation_1.createDecorator)('hoverService');
    let WorkbenchHoverDelegate = class WorkbenchHoverDelegate extends lifecycle_1.Disposable {
        get delay() {
            if (this.isInstantlyHovering()) {
                return 0; // show instantly when a hover was recently shown
            }
            return this._delay;
        }
        constructor(placement, instantHover, overrideOptions = {}, configurationService, hoverService) {
            super();
            this.placement = placement;
            this.instantHover = instantHover;
            this.overrideOptions = overrideOptions;
            this.configurationService = configurationService;
            this.hoverService = hoverService;
            this.lastHoverHideTime = 0;
            this.timeLimit = 200;
            this.hoverDisposables = this._register(new lifecycle_1.DisposableStore());
            this._delay = this.configurationService.getValue('workbench.hover.delay');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.hover.delay')) {
                    this._delay = this.configurationService.getValue('workbench.hover.delay');
                }
            }));
        }
        showHover(options, focus) {
            const overrideOptions = typeof this.overrideOptions === 'function' ? this.overrideOptions(options, focus) : this.overrideOptions;
            // close hover on escape
            this.hoverDisposables.clear();
            const targets = options.target instanceof HTMLElement ? [options.target] : options.target.targetElements;
            for (const target of targets) {
                this.hoverDisposables.add((0, dom_1.addStandardDisposableListener)(target, 'keydown', (e) => {
                    if (e.equals(9 /* KeyCode.Escape */)) {
                        this.hoverService.hideHover();
                    }
                }));
            }
            const id = options.content instanceof HTMLElement ? undefined : options.content.toString();
            return this.hoverService.showHover({
                ...options,
                ...overrideOptions,
                persistence: {
                    hideOnKeyDown: true,
                    ...overrideOptions.persistence
                },
                id,
                appearance: {
                    ...options.appearance,
                    compact: true,
                    skipFadeInAnimation: this.isInstantlyHovering(),
                    ...overrideOptions.appearance
                }
            }, focus);
        }
        isInstantlyHovering() {
            return this.instantHover && Date.now() - this.lastHoverHideTime < this.timeLimit;
        }
        setInstantHoverTimeLimit(timeLimit) {
            if (!this.instantHover) {
                throw new Error('Instant hover is not enabled');
            }
            this.timeLimit = timeLimit;
        }
        onDidHideHover() {
            this.hoverDisposables.clear();
            if (this.instantHover) {
                this.lastHoverHideTime = Date.now();
            }
        }
    };
    exports.WorkbenchHoverDelegate = WorkbenchHoverDelegate;
    exports.WorkbenchHoverDelegate = WorkbenchHoverDelegate = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, exports.IHoverService)
    ], WorkbenchHoverDelegate);
    // TODO@benibenj remove this, only temp fix for contextviews
    exports.nativeHoverDelegate = {
        showHover: function () {
            throw new Error('Native hover function not implemented.');
        },
        delay: 0,
        showNativeHover: true
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG92ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2hvdmVyL2Jyb3dzZXIvaG92ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWW5GLFFBQUEsYUFBYSxHQUFHLElBQUEsK0JBQWUsRUFBZ0IsY0FBYyxDQUFDLENBQUM7SUE2TnJFLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEsc0JBQVU7UUFNckQsSUFBSSxLQUFLO1lBQ1IsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO2dCQUNoQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGlEQUFpRDtZQUM1RCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLENBQUM7UUFJRCxZQUNpQixTQUE4QixFQUM3QixZQUFxQixFQUM5QixrQkFBMEgsRUFBRSxFQUM3RyxvQkFBNEQsRUFDcEUsWUFBNEM7WUFFM0QsS0FBSyxFQUFFLENBQUM7WUFOUSxjQUFTLEdBQVQsU0FBUyxDQUFxQjtZQUM3QixpQkFBWSxHQUFaLFlBQVksQ0FBUztZQUM5QixvQkFBZSxHQUFmLGVBQWUsQ0FBNkc7WUFDNUYseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQWxCcEQsc0JBQWlCLEdBQUcsQ0FBQyxDQUFDO1lBQ3RCLGNBQVMsR0FBRyxHQUFHLENBQUM7WUFVaEIscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBV2hFLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBUyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ2xGLElBQUksQ0FBQyxTQUFTLENBQUMs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