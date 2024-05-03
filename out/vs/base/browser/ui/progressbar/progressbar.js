/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/types", "vs/css!./progressbar"], function (require, exports, dom_1, async_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBar = exports.unthemedProgressBarOptions = void 0;
    const CSS_DONE = 'done';
    const CSS_ACTIVE = 'active';
    const CSS_INFINITE = 'infinite';
    const CSS_INFINITE_LONG_RUNNING = 'infinite-long-running';
    const CSS_DISCRETE = 'discrete';
    exports.unthemedProgressBarOptions = {
        progressBarBackground: undefined
    };
    /**
     * A progress bar with support for infinite or discrete progress.
     */
    class ProgressBar extends lifecycle_1.Disposable {
        /**
         * After a certain time of showing the progress bar, switch
         * to long-running mode and throttle animations to reduce
         * the pressure on the GPU process.
         *
         * https://github.com/microsoft/vscode/issues/97900
         * https://github.com/microsoft/vscode/issues/138396
         */
        static { this.LONG_RUNNING_INFINITE_THRESHOLD = 10000; }
        constructor(container, options) {
            super();
            this.workedVal = 0;
            this.showDelayedScheduler = this._register(new async_1.RunOnceScheduler(() => (0, dom_1.show)(this.element), 0));
            this.longRunningScheduler = this._register(new async_1.RunOnceScheduler(() => this.infiniteLongRunning(), ProgressBar.LONG_RUNNING_INFINITE_THRESHOLD));
            this.create(container, options);
        }
        create(container, options) {
            this.element = document.createElement('div');
            this.element.classList.add('monaco-progress-container');
            this.element.setAttribute('role', 'progressbar');
            this.element.setAttribute('aria-valuemin', '0');
            container.appendChild(this.element);
            this.bit = document.createElement('div');
            this.bit.classList.add('progress-bit');
            this.bit.style.backgroundColor = options?.progressBarBackground || '#0E70C0';
            this.element.appendChild(this.bit);
        }
        off() {
            this.bit.style.width = 'inherit';
            this.bit.style.opacity = '1';
            this.element.classList.remove(CSS_ACTIVE, CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DISCRETE);
            this.workedVal = 0;
            this.totalWork = undefined;
            this.longRunningScheduler.cancel();
        }
        /**
         * Indicates to the progress bar that all work is done.
         */
        done() {
            return this.doDone(true);
        }
        /**
         * Stops the progressbar from showing any progress instantly without fading out.
         */
        stop() {
            return this.doDone(false);
        }
        doDone(delayed) {
            this.element.classList.add(CSS_DONE);
            // discrete: let it grow to 100% width and hide afterwards
            if (!this.element.classList.contains(CSS_INFINITE)) {
                this.bit.style.width = 'inherit';
                if (delayed) {
                    setTimeout(() => this.off(), 200);
                }
                else {
                    this.off();
                }
            }
            // infinite: let it fade out and hide afterwards
            else {
                this.bit.style.opacity = '0';
                if (delayed) {
                    setTimeout(() => this.off(), 200);
                }
                else {
                    this.off();
                }
            }
            return this;
        }
        /**
         * Use this mode to indicate progress that has no total number of work units.
         */
        infinite() {
            this.bit.style.width = '2%';
            this.bit.style.opacity = '1';
            this.element.classList.remove(CSS_DISCRETE, CSS_DONE, CSS_INFINITE_LONG_RUNNING);
            this.element.classList.add(CSS_ACTIVE, CSS_INFINITE);
            this.longRunningScheduler.schedule();
            return this;
        }
        infiniteLongRunning() {
            this.element.classList.add(CSS_INFINITE_LONG_RUNNING);
        }
        /**
         * Tells the progress bar the total number of work. Use in combination with workedVal() to let
         * the progress bar show the actual progress based on the work that is done.
         */
        total(value) {
            this.workedVal = 0;
            this.totalWork = value;
            this.element.setAttribute('aria-valuemax', value.toString());
            return this;
        }
        /**
         * Finds out if this progress bar is configured with total work
         */
        hasTotal() {
            return (0, types_1.isNumber)(this.totalWork);
        }
        /**
         * Tells the progress bar that an increment of work has been completed.
         */
        worked(value) {
            value = Math.max(1, Number(value));
            return this.doSetWorked(this.workedVal + value);
        }
        /**
         * Tells the progress bar the total amount of work that has been completed.
         */
        setWorked(value) {
            value = Math.max(1, Number(value));
            return this.doSetWorked(value);
        }
        doSetWorked(value) {
            const totalWork = this.totalWork || 100;
            this.workedVal = value;
            this.workedVal = Math.min(totalWork, this.workedVal);
            this.element.classList.remove(CSS_INFINITE, CSS_INFINITE_LONG_RUNNING, CSS_DONE);
            this.element.classList.add(CSS_ACTIVE, CSS_DISCRETE);
            this.element.setAttribute('aria-valuenow', value.toString());
            this.bit.style.width = 100 * (this.workedVal / (totalWork)) + '%';
            return this;
        }
        getContainer() {
            return this.element;
        }
        show(delay) {
            this.showDelayedScheduler.cancel();
            if (typeof delay === 'number') {
                this.showDelayedScheduler.schedule(delay);
            }
            else {
                (0, dom_1.show)(this.element);
            }
        }
        hide() {
            (0, dom_1.hide)(this.element);
            this.showDelayedScheduler.cancel();
        }
    }
    exports.ProgressBar = ProgressBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NiYXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9wcm9ncmVzc2Jhci9wcm9ncmVzc2Jhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFRaEcsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDO0lBQ3hCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQztJQUM1QixNQUFNLFlBQVksR0FBRyxVQUFVLENBQUM7SUFDaEMsTUFBTSx5QkFBeUIsR0FBRyx1QkFBdUIsQ0FBQztJQUMxRCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUM7SUFTbkIsUUFBQSwwQkFBMEIsR0FBd0I7UUFDOUQscUJBQXFCLEVBQUUsU0FBUztLQUNoQyxDQUFDO0lBRUY7O09BRUc7SUFDSCxNQUFhLFdBQVksU0FBUSxzQkFBVTtRQUUxQzs7Ozs7OztXQU9HO2lCQUNxQixvQ0FBK0IsR0FBRyxLQUFLLENBQUM7UUFTaEUsWUFBWSxTQUFzQixFQUFFLE9BQTZCO1lBQ2hFLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFFbkIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFBLFVBQUksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLFdBQVcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFFaEosSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVPLE1BQU0sQ0FBQyxTQUFzQixFQUFFLE9BQTZCO1lBQ25FLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXBDLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLE9BQU8sRUFBRSxxQkFBcUIsSUFBSSxTQUFTLENBQUM7WUFDN0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFTyxHQUFHO1lBQ1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUNqQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQzdCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLHlCQUF5QixFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRWpHLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBRTNCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxJQUFJO1lBQ0gsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRDs7V0FFRztRQUNILElBQUk7WUFDSCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUVPLE1BQU0sQ0FBQyxPQUFnQjtZQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFckMsMERBQTBEO1lBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztnQkFFakMsSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDYixVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNaLENBQUM7WUFDRixDQUFDO1lBRUQsZ0RBQWdEO2lCQUMzQyxDQUFDO2dCQUNMLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7Z0JBQzdCLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ2IsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDWixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOztXQUVHO1FBQ0gsUUFBUTtZQUNQLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztZQUU3QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBRXJDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsS0FBSyxDQUFDLEtBQWE7WUFDbEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBRTdELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVEOztXQUVHO1FBQ0gsUUFBUTtZQUNQLE9BQU8sSUFBQSxnQkFBUSxFQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxNQUFNLENBQUMsS0FBYTtZQUNuQixLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFbkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVEOztXQUVHO1FBQ0gsU0FBUyxDQUFDLEtBQWE7WUFDdEIsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRW5DLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRU8sV0FBVyxDQUFDLEtBQWE7WUFDaEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUM7WUFFeEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFckQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSx5QkFBeUIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUU3RCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO1lBRWxFLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELFlBQVk7WUFDWCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELElBQUksQ0FBQyxLQUFjO1lBQ2xCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVuQyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFBLFVBQUksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEIsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJO1lBQ0gsSUFBQSxVQUFJLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQyxDQUFDOztJQXZMRixrQ0F3TEMifQ==