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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/theme/common/themeService", "vs/editor/common/editorCommon", "vs/base/browser/dom", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/iconLabels", "vs/platform/theme/common/iconRegistry", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/htmlContent", "vs/base/browser/touch"], function (require, exports, errorMessage_1, lifecycle_1, simpleIconLabel_1, commands_1, telemetry_1, statusbar_1, themeService_1, editorCommon_1, dom_1, notification_1, types_1, keyboardEvent_1, iconLabels_1, iconRegistry_1, updatableHoverWidget_1, htmlContent_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarEntryItem = void 0;
    let StatusbarEntryItem = class StatusbarEntryItem extends lifecycle_1.Disposable {
        get name() {
            return (0, types_1.assertIsDefined)(this.entry).name;
        }
        get hasCommand() {
            return typeof this.entry?.command !== 'undefined';
        }
        constructor(container, entry, hoverDelegate, commandService, notificationService, telemetryService, themeService) {
            super();
            this.container = container;
            this.hoverDelegate = hoverDelegate;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.themeService = themeService;
            this.entry = undefined;
            this.foregroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.backgroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandMouseListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandTouchListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandKeyboardListener = this._register(new lifecycle_1.MutableDisposable());
            this.focusListener = this._register(new lifecycle_1.MutableDisposable());
            this.focusOutListener = this._register(new lifecycle_1.MutableDisposable());
            this.hover = undefined;
            // Label Container
            this.labelContainer = document.createElement('a');
            this.labelContainer.tabIndex = -1; // allows screen readers to read title, but still prevents tab focus.
            this.labelContainer.setAttribute('role', 'button');
            this.labelContainer.className = 'statusbar-item-label';
            this._register(touch_1.Gesture.addTarget(this.labelContainer)); // enable touch
            // Label (with support for progress)
            this.label = this._register(new StatusBarCodiconLabel(this.labelContainer));
            this.container.appendChild(this.labelContainer);
            // Beak Container
            this.beakContainer = document.createElement('div');
            this.beakContainer.className = 'status-bar-item-beak-container';
            this.container.appendChild(this.beakContainer);
            this.update(entry);
        }
        update(entry) {
            // Update: Progress
            this.label.showProgress = entry.showProgress ?? false;
            // Update: Text
            if (!this.entry || entry.text !== this.entry.text) {
                this.label.text = entry.text;
                if (entry.text) {
                    (0, dom_1.show)(this.labelContainer);
                }
                else {
                    (0, dom_1.hide)(this.labelContainer);
                }
            }
            // Update: ARIA label
            //
            // Set the aria label on both elements so screen readers would read
            // the correct thing without duplication #96210
            if (!this.entry || entry.ariaLabel !== this.entry.ariaLabel) {
                this.container.setAttribute('aria-label', entry.ariaLabel);
                this.labelContainer.setAttribute('aria-label', entry.ariaLabel);
            }
            if (!this.entry || entry.role !== this.entry.role) {
                this.labelContainer.setAttribute('role', entry.role || 'button');
            }
            // Update: Hover
            if (!this.entry || !this.isEqualTooltip(this.entry, entry)) {
                const hoverContents = (0, htmlContent_1.isMarkdownString)(entry.tooltip) ? { markdown: entry.tooltip, markdownNotSupportedFallback: undefined } : entry.tooltip;
                if (this.hover) {
                    this.hover.update(hoverContents);
                }
                else {
                    this.hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(this.hoverDelegate, this.container, hoverContents));
                }
                if (entry.command !== statusbar_1.ShowTooltipCommand /* prevents flicker on click */) {
                    this.focusListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.FOCUS, e => {
                        dom_1.EventHelper.stop(e);
                        this.hover?.show(false);
                    });
                    this.focusOutListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.FOCUS_OUT, e => {
                        dom_1.EventHelper.stop(e);
                        this.hover?.hide();
                    });
                }
            }
            // Update: Command
            if (!this.entry || entry.command !== this.entry.command) {
                this.commandMouseListener.clear();
                this.commandTouchListener.clear();
                this.commandKeyboardListener.clear();
                const command = entry.command;
                if (command && (command !== statusbar_1.ShowTooltipCommand || this.hover) /* "Show Hover" is only valid when we have a hover */) {
                    this.commandMouseListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.CLICK, () => this.executeCommand(command));
                    this.commandTouchListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, touch_1.EventType.Tap, () => this.executeCommand(command));
                    this.commandKeyboardListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.KEY_DOWN, e => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if (event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */)) {
                            dom_1.EventHelper.stop(e);
                            this.executeCommand(command);
                        }
                        else if (event.equals(9 /* KeyCode.Escape */) || event.equals(15 /* KeyCode.LeftArrow */) || event.equals(17 /* KeyCode.RightArrow */)) {
                            dom_1.EventHelper.stop(e);
                            this.hover?.hide();
                        }
                    });
                    this.labelContainer.classList.remove('disabled');
                }
                else {
                    this.labelContainer.classList.add('disabled');
                }
            }
            // Update: Beak
            if (!this.entry || entry.showBeak !== this.entry.showBeak) {
                if (entry.showBeak) {
                    this.container.classList.add('has-beak');
                }
                else {
                    this.container.classList.remove('has-beak');
                }
            }
            const hasBackgroundColor = !!entry.backgroundColor || (entry.kind && entry.kind !== 'standard');
            // Update: Kind
            if (!this.entry || entry.kind !== this.entry.kind) {
                for (const kind of statusbar_1.StatusbarEntryKinds) {
                    this.container.classList.remove(`${kind}-kind`);
                }
                if (entry.kind && entry.kind !== 'standard') {
                    this.container.classList.add(`${entry.kind}-kind`);
                }
                this.container.classList.toggle('has-background-color', hasBackgroundColor);
            }
            // Update: Foreground
            if (!this.entry || entry.color !== this.entry.color) {
                this.applyColor(this.labelContainer, entry.color);
            }
            // Update: Background
            if (!this.entry || entry.backgroundColor !== this.entry.backgroundColor) {
                this.container.classList.toggle('has-background-color', hasBackgroundColor);
                this.applyColor(this.container, entry.backgroundColor, true);
            }
            // Remember for next round
            this.entry = entry;
        }
        isEqualTooltip({ tooltip }, { tooltip: otherTooltip }) {
            if (tooltip === undefined) {
                return otherTooltip === undefined;
            }
            if ((0, htmlContent_1.isMarkdownString)(tooltip)) {
                return (0, htmlContent_1.isMarkdownString)(otherTooltip) && (0, htmlContent_1.markdownStringEqual)(tooltip, otherTooltip);
            }
            return tooltip === otherTooltip;
        }
        async executeCommand(command) {
            // Custom command from us: Show tooltip
            if (command === statusbar_1.ShowTooltipCommand) {
                this.hover?.show(true /* focus */);
            }
            // Any other command is going through command service
            else {
                const id = typeof command === 'string' ? command : command.id;
                const args = typeof command === 'string' ? [] : command.arguments ?? [];
                this.telemetryService.publicLog2('workbenchActionExecuted', { id, from: 'status bar' });
                try {
                    await this.commandService.executeCommand(id, ...args);
                }
                catch (error) {
                    this.notificationService.error((0, errorMessage_1.toErrorMessage)(error));
                }
            }
        }
        applyColor(container, color, isBackground) {
            let colorResult = undefined;
            if (isBackground) {
                this.backgroundListener.clear();
            }
            else {
                this.foregroundListener.clear();
            }
            if (color) {
                if ((0, editorCommon_1.isThemeColor)(color)) {
                    colorResult = this.themeService.getColorTheme().getColor(color.id)?.toString();
                    const listener = this.themeService.onDidColorThemeChange(theme => {
                        const colorValue = theme.getColor(color.id)?.toString();
                        if (isBackground) {
                            container.style.backgroundColor = colorValue ?? '';
                        }
                        else {
                            container.style.color = colorValue ?? '';
                        }
                    });
                    if (isBackground) {
                        this.backgroundListener.value = listener;
                    }
                    else {
                        this.foregroundListener.value = listener;
                    }
                }
                else {
                    colorResult = color;
                }
            }
            if (isBackground) {
                container.style.backgroundColor = colorResult ?? '';
            }
            else {
                container.style.color = colorResult ?? '';
            }
        }
    };
    exports.StatusbarEntryItem = StatusbarEntryItem;
    exports.StatusbarEntryItem = StatusbarEntryItem = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, themeService_1.IThemeService)
    ], StatusbarEntryItem);
    class StatusBarCodiconLabel extends simpleIconLabel_1.SimpleIconLabel {
        constructor(container) {
            super(container);
            this.container = container;
            this.progressCodicon = (0, iconLabels_1.renderIcon)(iconRegistry_1.syncing);
            this.currentText = '';
            this.currentShowProgress = false;
        }
        set showProgress(showProgress) {
            if (this.currentShowProgress !== showProgress) {
                this.currentShowProgress = showProgress;
                this.progressCodicon = (0, iconLabels_1.renderIcon)(showProgress === 'loading' ? iconRegistry_1.spinningLoading : iconRegistry_1.syncing);
                this.text = this.currentText;
            }
        }
        set text(text) {
            // Progress: insert progress codicon as first element as needed
            // but keep it stable so that the animation does not reset
            if (this.currentShowProgress) {
                // Append as needed
                if (this.container.firstChild !== this.progressCodicon) {
                    this.container.appendChild(this.progressCodicon);
                }
                // Remove others
                for (const node of Array.from(this.container.childNodes)) {
                    if (node !== this.progressCodicon) {
                        node.remove();
                    }
                }
                // If we have text to show, add a space to separate from progress
                let textContent = text ?? '';
                if (textContent) {
                    textContent = ` ${textContent}`;
                }
                // Append new elements
                (0, dom_1.append)(this.container, ...(0, iconLabels_1.renderLabelWithIcons)(textContent));
            }
            // No Progress: no special handling
            else {
                super.text = text;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzYmFySXRlbS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvc3RhdHVzYmFyL3N0YXR1c2Jhckl0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJ6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBb0JqRCxJQUFJLElBQUk7WUFDUCxPQUFPLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxJQUFJLFVBQVU7WUFDYixPQUFPLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEtBQUssV0FBVyxDQUFDO1FBQ25ELENBQUM7UUFFRCxZQUNTLFNBQXNCLEVBQzlCLEtBQXNCLEVBQ0wsYUFBNkIsRUFDN0IsY0FBZ0QsRUFDM0MsbUJBQTBELEVBQzdELGdCQUFvRCxFQUN4RCxZQUE0QztZQUUzRCxLQUFLLEVBQUUsQ0FBQztZQVJBLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFFYixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDWixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDMUIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM1QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3ZDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBL0JwRCxVQUFLLEdBQWdDLFNBQVMsQ0FBQztZQUV0Qyx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzdELHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFFN0QseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUMvRCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDbEUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFFcEUsVUFBSyxHQUE2QixTQUFTLENBQUM7WUF3Qm5ELGtCQUFrQjtZQUNsQixJQUFJLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxxRUFBcUU7WUFDeEcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxHQUFHLHNCQUFzQixDQUFDO1lBQ3ZELElBQUksQ0FBQyxTQUFTLENBQUMsZUFBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWU7WUFFdkUsb0NBQW9DO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQzVFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVoRCxpQkFBaUI7WUFDakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLGdDQUFnQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUUvQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBc0I7WUFFNUIsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDO1lBRXRELGVBQWU7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBRTdCLElBQUksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNoQixJQUFBLFVBQUksRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzNCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFBLFVBQUksRUFBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDRixDQUFDO1lBRUQscUJBQXFCO1lBQ3JCLEVBQUU7WUFDRixtRUFBbUU7WUFDbkUsK0NBQStDO1lBRS9DLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuRCxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxRQUFRLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBRUQsZ0JBQWdCO1lBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzVELE1BQU0sYUFBYSxHQUFHLElBQUEsOEJBQWdCLEVBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDO2dCQUM3SSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx1Q0FBZ0IsRUFBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDbEcsQ0FBQztnQkFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssOEJBQWtCLENBQUMsK0JBQStCLEVBQUUsQ0FBQztvQkFDMUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEdBQUcsSUFBQSwyQkFBcUIsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFFLGVBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUU7d0JBQzFGLGlCQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwQixJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDekIsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssR0FBRyxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsZUFBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRTt3QkFDakcsaUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3BCLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7b0JBQ3BCLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDekQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFckMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztnQkFDOUIsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLEtBQUssOEJBQWtCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLHFEQUFxRCxFQUFFLENBQUM7b0JBQ3JILElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEdBQUcsSUFBQSwyQkFBcUIsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFFLGVBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNsSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxHQUFHLElBQUEsMkJBQXFCLEVBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxpQkFBYyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ3JJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEdBQUcsSUFBQSwyQkFBcUIsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFFLGVBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUU7d0JBQ3ZHLE1BQU0sS0FBSyxHQUFHLElBQUkscUNBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzNDLElBQUksS0FBSyxDQUFDLE1BQU0sd0JBQWUsSUFBSSxLQUFLLENBQUMsTUFBTSx1QkFBZSxFQUFFLENBQUM7NEJBQ2hFLGlCQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUVwQixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUM5QixDQUFDOzZCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sd0JBQWdCLElBQUksS0FBSyxDQUFDLE1BQU0sNEJBQW1CLElBQUksS0FBSyxDQUFDLE1BQU0sNkJBQW9CLEVBQUUsQ0FBQzs0QkFDaEgsaUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBRXBCLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7d0JBQ3BCLENBQUM7b0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQztZQUVELGVBQWU7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNELElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzFDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztZQUVoRyxlQUFlO1lBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuRCxLQUFLLE1BQU0sSUFBSSxJQUFJLCtCQUFtQixFQUFFLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUM7Z0JBQ2pELENBQUM7Z0JBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUVELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFFRCxxQkFBcUI7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFFRCxxQkFBcUI7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN6RSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztnQkFDNUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELDBCQUEwQjtZQUMxQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNwQixDQUFDO1FBRU8sY0FBYyxDQUFDLEVBQUUsT0FBTyxFQUFtQixFQUFFLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBbUI7WUFDOUYsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sWUFBWSxLQUFLLFNBQVMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsSUFBSSxJQUFBLDhCQUFnQixFQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sSUFBQSw4QkFBZ0IsRUFBQyxZQUFZLENBQUMsSUFBSSxJQUFBLGlDQUFtQixFQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNyRixDQUFDO1lBRUQsT0FBTyxPQUFPLEtBQUssWUFBWSxDQUFDO1FBQ2pDLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQXlCO1lBRXJELHVDQUF1QztZQUN2QyxJQUFJLE9BQU8sS0FBSyw4QkFBa0IsRUFBRSxDQUFDO2dCQUNwQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUVELHFEQUFxRDtpQkFDaEQsQ0FBQztnQkFDTCxNQUFNLEVBQUUsR0FBRyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsTUFBTSxJQUFJLEdBQUcsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO2dCQUV4RSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFzRSx5QkFBeUIsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDN0osSUFBSSxDQUFDO29CQUNKLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZELENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sVUFBVSxDQUFDLFNBQXNCLEVBQUUsS0FBc0MsRUFBRSxZQUFzQjtZQUN4RyxJQUFJLFdBQVcsR0FBdUIsU0FBUyxDQUFDO1lBRWhELElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNqQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2pDLENBQUM7WUFFRCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNYLElBQUksSUFBQSwyQkFBWSxFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3pCLFdBQVcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7b0JBRS9FLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQ2hFLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO3dCQUV4RCxJQUFJLFlBQVksRUFBRSxDQUFDOzRCQUNsQixTQUFTLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxVQUFVLElBQUksRUFBRSxDQUFDO3dCQUNwRCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsVUFBVSxJQUFJLEVBQUUsQ0FBQzt3QkFDMUMsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztvQkFFSCxJQUFJLFlBQVksRUFBRSxDQUFDO3dCQUNsQixJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztvQkFDMUMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO29CQUMxQyxDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxXQUFXLEdBQUcsS0FBSyxDQUFDO2dCQUNyQixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLFNBQVMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLFdBQVcsSUFBSSxFQUFFLENBQUM7WUFDckQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFdBQVcsSUFBSSxFQUFFLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBeFBZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBZ0M1QixXQUFBLDBCQUFlLENBQUE7UUFDZixXQUFBLG1DQUFvQixDQUFBO1FBQ3BCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSw0QkFBYSxDQUFBO09BbkNILGtCQUFrQixDQXdQOUI7SUFFRCxNQUFNLHFCQUFzQixTQUFRLGlDQUFlO1FBT2xELFlBQ2tCLFNBQXNCO1lBRXZDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUZBLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFOaEMsb0JBQWUsR0FBRyxJQUFBLHVCQUFVLEVBQUMsc0JBQU8sQ0FBQyxDQUFDO1lBRXRDLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLHdCQUFtQixHQUFvQyxLQUFLLENBQUM7UUFNckUsQ0FBQztRQUVELElBQUksWUFBWSxDQUFDLFlBQTZDO1lBQzdELElBQUksSUFBSSxDQUFDLG1CQUFtQixLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsWUFBWSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUEsdUJBQVUsRUFBQyxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyw4QkFBZSxDQUFDLENBQUMsQ0FBQyxzQkFBTyxDQUFDLENBQUM7Z0JBQzFGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQztRQUVELElBQWEsSUFBSSxDQUFDLElBQVk7WUFFN0IsK0RBQStEO1lBQy9ELDBEQUEwRDtZQUMxRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUU5QixtQkFBbUI7Z0JBQ25CLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN4RCxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2xELENBQUM7Z0JBRUQsZ0JBQWdCO2dCQUNoQixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUMxRCxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7d0JBQ25DLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDZixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsaUVBQWlFO2dCQUNqRSxJQUFJLFdBQVcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUM3QixJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUNqQixXQUFXLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxzQkFBc0I7Z0JBQ3RCLElBQUEsWUFBTSxFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxJQUFBLGlDQUFvQixFQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELG1DQUFtQztpQkFDOUIsQ0FBQztnQkFDTCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNuQixDQUFDO1FBQ0YsQ0FBQztLQUNEIn0=