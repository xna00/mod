/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform"], function (require, exports, dom, touch_1, arrays, event_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBoxNative = void 0;
    class SelectBoxNative extends lifecycle_1.Disposable {
        constructor(options, selected, styles, selectBoxOptions) {
            super();
            this.selected = 0;
            this.selectBoxOptions = selectBoxOptions || Object.create(null);
            this.options = [];
            this.selectElement = document.createElement('select');
            this.selectElement.className = 'monaco-select-box';
            if (typeof this.selectBoxOptions.ariaLabel === 'string') {
                this.selectElement.setAttribute('aria-label', this.selectBoxOptions.ariaLabel);
            }
            if (typeof this.selectBoxOptions.ariaDescription === 'string') {
                this.selectElement.setAttribute('aria-description', this.selectBoxOptions.ariaDescription);
            }
            this._onDidSelect = this._register(new event_1.Emitter());
            this.styles = styles;
            this.registerListeners();
            this.setOptions(options, selected);
        }
        registerListeners() {
            this._register(touch_1.Gesture.addTarget(this.selectElement));
            [touch_1.EventType.Tap].forEach(eventType => {
                this._register(dom.addDisposableListener(this.selectElement, eventType, (e) => {
                    this.selectElement.focus();
                }));
            });
            this._register(dom.addStandardDisposableListener(this.selectElement, 'click', (e) => {
                dom.EventHelper.stop(e, true);
            }));
            this._register(dom.addStandardDisposableListener(this.selectElement, 'change', (e) => {
                this.selectElement.title = e.target.value;
                this._onDidSelect.fire({
                    index: e.target.selectedIndex,
                    selected: e.target.value
                });
            }));
            this._register(dom.addStandardDisposableListener(this.selectElement, 'keydown', (e) => {
                let showSelect = false;
                if (platform_1.isMacintosh) {
                    if (e.keyCode === 18 /* KeyCode.DownArrow */ || e.keyCode === 16 /* KeyCode.UpArrow */ || e.keyCode === 10 /* KeyCode.Space */) {
                        showSelect = true;
                    }
                }
                else {
                    if (e.keyCode === 18 /* KeyCode.DownArrow */ && e.altKey || e.keyCode === 10 /* KeyCode.Space */ || e.keyCode === 3 /* KeyCode.Enter */) {
                        showSelect = true;
                    }
                }
                if (showSelect) {
                    // Space, Enter, is used to expand select box, do not propagate it (prevent action bar action run)
                    e.stopPropagation();
                }
            }));
        }
        get onDidSelect() {
            return this._onDidSelect.event;
        }
        setOptions(options, selected) {
            if (!this.options || !arrays.equals(this.options, options)) {
                this.options = options;
                this.selectElement.options.length = 0;
                this.options.forEach((option, index) => {
                    this.selectElement.add(this.createOption(option.text, index, option.isDisabled));
                });
            }
            if (selected !== undefined) {
                this.select(selected);
            }
        }
        select(index) {
            if (this.options.length === 0) {
                this.selected = 0;
            }
            else if (index >= 0 && index < this.options.length) {
                this.selected = index;
            }
            else if (index > this.options.length - 1) {
                // Adjust index to end of list
                // This could make client out of sync with the select
                this.select(this.options.length - 1);
            }
            else if (this.selected < 0) {
                this.selected = 0;
            }
            this.selectElement.selectedIndex = this.selected;
            if ((this.selected < this.options.length) && typeof this.options[this.selected].text === 'string') {
                this.selectElement.title = this.options[this.selected].text;
            }
            else {
                this.selectElement.title = '';
            }
        }
        setAriaLabel(label) {
            this.selectBoxOptions.ariaLabel = label;
            this.selectElement.setAttribute('aria-label', label);
        }
        focus() {
            if (this.selectElement) {
                this.selectElement.tabIndex = 0;
                this.selectElement.focus();
            }
        }
        blur() {
            if (this.selectElement) {
                this.selectElement.tabIndex = -1;
                this.selectElement.blur();
            }
        }
        setFocusable(focusable) {
            this.selectElement.tabIndex = focusable ? 0 : -1;
        }
        render(container) {
            container.classList.add('select-container');
            container.appendChild(this.selectElement);
            this.setOptions(this.options, this.selected);
            this.applyStyles();
        }
        style(styles) {
            this.styles = styles;
            this.applyStyles();
        }
        applyStyles() {
            // Style native select
            if (this.selectElement) {
                this.selectElement.style.backgroundColor = this.styles.selectBackground ?? '';
                this.selectElement.style.color = this.styles.selectForeground ?? '';
                this.selectElement.style.borderColor = this.styles.selectBorder ?? '';
            }
        }
        createOption(value, index, disabled) {
            const option = document.createElement('option');
            option.value = value;
            option.text = value;
            option.disabled = !!disabled;
            return option;
        }
    }
    exports.SelectBoxNative = SelectBoxNative;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0Qm94TmF0aXZlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvc2VsZWN0Qm94L3NlbGVjdEJveE5hdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxlQUFnQixTQUFRLHNCQUFVO1FBUzlDLFlBQVksT0FBNEIsRUFBRSxRQUFnQixFQUFFLE1BQXdCLEVBQUUsZ0JBQW9DO1lBQ3pILEtBQUssRUFBRSxDQUFDO1lBTEQsYUFBUSxHQUFHLENBQUMsQ0FBQztZQU1wQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoRSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUVsQixJQUFJLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFdEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUM7WUFFbkQsSUFBSSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDaEYsQ0FBQztZQUVELElBQUksT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvRCxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDNUYsQ0FBQztZQUVELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFFL0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFFckIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLGVBQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdEQsQ0FBQyxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtvQkFDN0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDbkYsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNwRixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUM7b0JBQ3RCLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLGFBQWE7b0JBQzdCLFFBQVEsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUs7aUJBQ3hCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUNyRixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7Z0JBRXZCLElBQUksc0JBQVcsRUFBRSxDQUFDO29CQUNqQixJQUFJLENBQUMsQ0FBQyxPQUFPLCtCQUFzQixJQUFJLENBQUMsQ0FBQyxPQUFPLDZCQUFvQixJQUFJLENBQUMsQ0FBQyxPQUFPLDJCQUFrQixFQUFFLENBQUM7d0JBQ3JHLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ25CLENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxDQUFDLE9BQU8sK0JBQXNCLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsT0FBTywyQkFBa0IsSUFBSSxDQUFDLENBQUMsT0FBTywwQkFBa0IsRUFBRSxDQUFDO3dCQUMvRyxVQUFVLEdBQUcsSUFBSSxDQUFDO29CQUNuQixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDaEIsa0dBQWtHO29CQUNsRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3JCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQVcsV0FBVztZQUNyQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1FBQ2hDLENBQUM7UUFFTSxVQUFVLENBQUMsT0FBNEIsRUFBRSxRQUFpQjtZQUVoRSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM1RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztnQkFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFFdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3RDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xGLENBQUMsQ0FBQyxDQUFDO1lBRUosQ0FBQztZQUVELElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRU0sTUFBTSxDQUFDLEtBQWE7WUFDMUIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDbkIsQ0FBQztpQkFBTSxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLENBQUM7aUJBQU0sSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzVDLDhCQUE4QjtnQkFDOUIscURBQXFEO2dCQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNqRCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDN0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVNLFlBQVksQ0FBQyxLQUFhO1lBQ2hDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sS0FBSztZQUNYLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFTSxJQUFJO1lBQ1YsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBRU0sWUFBWSxDQUFDLFNBQWtCO1lBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRU0sTUFBTSxDQUFDLFNBQXNCO1lBQ25DLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDNUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVNLEtBQUssQ0FBQyxNQUF3QjtZQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDcEIsQ0FBQztRQUVNLFdBQVc7WUFFakIsc0JBQXNCO1lBQ3RCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFLENBQUM7Z0JBQzlFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztZQUN2RSxDQUFDO1FBRUYsQ0FBQztRQUVPLFlBQVksQ0FBQyxLQUFhLEVBQUUsS0FBYSxFQUFFLFFBQWtCO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDckIsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7WUFDcEIsTUFBTSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRTdCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztLQUNEO0lBM0tELDBDQTJLQyJ9