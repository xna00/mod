/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/progress/common/progress"], function (require, exports, event_1, lifecycle_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractProgressScope = exports.ScopedProgressIndicator = exports.EditorProgressIndicator = void 0;
    class EditorProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, group) {
            super();
            this.progressBar = progressBar;
            this.group = group;
            this.registerListeners();
        }
        registerListeners() {
            // Stop any running progress when the active editor changes or
            // the group becomes empty.
            // In contrast to the composite progress indicator, we do not
            // track active editor progress and replay it later (yet).
            this._register(this.group.onDidModelChange(e => {
                if (e.kind === 7 /* GroupModelChangeKind.EDITOR_ACTIVE */ ||
                    (e.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && this.group.isEmpty)) {
                    this.progressBar.stop().hide();
                }
            }));
        }
        show(infiniteOrTotal, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                return progress_1.emptyProgressRunner;
            }
            if (infiniteOrTotal === true) {
                return this.doShow(true, delay);
            }
            return this.doShow(infiniteOrTotal, delay);
        }
        doShow(infiniteOrTotal, delay) {
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressBar.infinite().show(delay);
            }
            else {
                this.progressBar.total(infiniteOrTotal).show(delay);
            }
            return {
                total: (total) => {
                    this.progressBar.total(total);
                },
                worked: (worked) => {
                    if (this.progressBar.hasTotal()) {
                        this.progressBar.worked(worked);
                    }
                    else {
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressBar.stop().hide();
                }
            };
        }
        async showWhile(promise, delay) {
            // No editor open: ignore any progress reporting
            if (this.group.isEmpty) {
                try {
                    await promise;
                }
                catch (error) {
                    // ignore
                }
            }
            return this.doShowWhile(promise, delay);
        }
        async doShowWhile(promise, delay) {
            try {
                this.progressBar.infinite().show(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                this.progressBar.stop().hide();
            }
        }
    }
    exports.EditorProgressIndicator = EditorProgressIndicator;
    var ProgressIndicatorState;
    (function (ProgressIndicatorState) {
        let Type;
        (function (Type) {
            Type[Type["None"] = 0] = "None";
            Type[Type["Done"] = 1] = "Done";
            Type[Type["Infinite"] = 2] = "Infinite";
            Type[Type["While"] = 3] = "While";
            Type[Type["Work"] = 4] = "Work";
        })(Type = ProgressIndicatorState.Type || (ProgressIndicatorState.Type = {}));
        ProgressIndicatorState.None = { type: 0 /* Type.None */ };
        ProgressIndicatorState.Done = { type: 1 /* Type.Done */ };
        ProgressIndicatorState.Infinite = { type: 2 /* Type.Infinite */ };
        class While {
            constructor(whilePromise, whileStart, whileDelay) {
                this.whilePromise = whilePromise;
                this.whileStart = whileStart;
                this.whileDelay = whileDelay;
                this.type = 3 /* Type.While */;
            }
        }
        ProgressIndicatorState.While = While;
        class Work {
            constructor(total, worked) {
                this.total = total;
                this.worked = worked;
                this.type = 4 /* Type.Work */;
            }
        }
        ProgressIndicatorState.Work = Work;
    })(ProgressIndicatorState || (ProgressIndicatorState = {}));
    class ScopedProgressIndicator extends lifecycle_1.Disposable {
        constructor(progressBar, scope) {
            super();
            this.progressBar = progressBar;
            this.scope = scope;
            this.progressState = ProgressIndicatorState.None;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.scope.onDidChangeActive(() => {
                if (this.scope.isActive) {
                    this.onDidScopeActivate();
                }
                else {
                    this.onDidScopeDeactivate();
                }
            }));
        }
        onDidScopeActivate() {
            // Return early if progress state indicates that progress is done
            if (this.progressState.type === ProgressIndicatorState.Done.type) {
                return;
            }
            // Replay Infinite Progress from Promise
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                let delay;
                if (this.progressState.whileDelay > 0) {
                    const remainingDelay = this.progressState.whileDelay - (Date.now() - this.progressState.whileStart);
                    if (remainingDelay > 0) {
                        delay = remainingDelay;
                    }
                }
                this.doShowWhile(delay);
            }
            // Replay Infinite Progress
            else if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                this.progressBar.infinite().show();
            }
            // Replay Finite Progress (Total & Worked)
            else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */) {
                if (this.progressState.total) {
                    this.progressBar.total(this.progressState.total).show();
                }
                if (this.progressState.worked) {
                    this.progressBar.worked(this.progressState.worked).show();
                }
            }
        }
        onDidScopeDeactivate() {
            this.progressBar.stop().hide();
        }
        show(infiniteOrTotal, delay) {
            // Sort out Arguments
            if (typeof infiniteOrTotal === 'boolean') {
                this.progressState = ProgressIndicatorState.Infinite;
            }
            else {
                this.progressState = new ProgressIndicatorState.Work(infiniteOrTotal, undefined);
            }
            // Active: Show Progress
            if (this.scope.isActive) {
                // Infinite: Start Progressbar and Show after Delay
                if (this.progressState.type === 2 /* ProgressIndicatorState.Type.Infinite */) {
                    this.progressBar.infinite().show(delay);
                }
                // Finite: Start Progressbar and Show after Delay
                else if (this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.total === 'number') {
                    this.progressBar.total(this.progressState.total).show(delay);
                }
            }
            return {
                total: (total) => {
                    this.progressState = new ProgressIndicatorState.Work(total, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.worked : undefined);
                    if (this.scope.isActive) {
                        this.progressBar.total(total);
                    }
                },
                worked: (worked) => {
                    // Verify first that we are either not active or the progressbar has a total set
                    if (!this.scope.isActive || this.progressBar.hasTotal()) {
                        this.progressState = new ProgressIndicatorState.Work(this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ ? this.progressState.total : undefined, this.progressState.type === 4 /* ProgressIndicatorState.Type.Work */ && typeof this.progressState.worked === 'number' ? this.progressState.worked + worked : worked);
                        if (this.scope.isActive) {
                            this.progressBar.worked(worked);
                        }
                    }
                    // Otherwise the progress bar does not support worked(), we fallback to infinite() progress
                    else {
                        this.progressState = ProgressIndicatorState.Infinite;
                        this.progressBar.infinite().show();
                    }
                },
                done: () => {
                    this.progressState = ProgressIndicatorState.Done;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            };
        }
        async showWhile(promise, delay) {
            // Join with existing running promise to ensure progress is accurate
            if (this.progressState.type === 3 /* ProgressIndicatorState.Type.While */) {
                promise = Promise.all([promise, this.progressState.whilePromise]);
            }
            // Keep Promise in State
            this.progressState = new ProgressIndicatorState.While(promise, delay || 0, Date.now());
            try {
                this.doShowWhile(delay);
                await promise;
            }
            catch (error) {
                // ignore
            }
            finally {
                // If this is not the last promise in the list of joined promises, skip this
                if (this.progressState.type !== 3 /* ProgressIndicatorState.Type.While */ || this.progressState.whilePromise === promise) {
                    // The while promise is either null or equal the promise we last hooked on
                    this.progressState = ProgressIndicatorState.None;
                    if (this.scope.isActive) {
                        this.progressBar.stop().hide();
                    }
                }
            }
        }
        doShowWhile(delay) {
            // Show Progress when active
            if (this.scope.isActive) {
                this.progressBar.infinite().show(delay);
            }
        }
    }
    exports.ScopedProgressIndicator = ScopedProgressIndicator;
    class AbstractProgressScope extends lifecycle_1.Disposable {
        get isActive() { return this._isActive; }
        constructor(scopeId, _isActive) {
            super();
            this.scopeId = scopeId;
            this._isActive = _isActive;
            this._onDidChangeActive = this._register(new event_1.Emitter());
            this.onDidChangeActive = this._onDidChangeActive.event;
        }
        onScopeOpened(scopeId) {
            if (scopeId === this.scopeId) {
                if (!this._isActive) {
                    this._isActive = true;
                    this._onDidChangeActive.fire();
                }
            }
        }
        onScopeClosed(scopeId) {
            if (scopeId === this.scopeId) {
                if (this._isActive) {
                    this._isActive = false;
                    this._onDidChangeActive.fire();
                }
            }
        }
    }
    exports.AbstractProgressScope = AbstractProgressScope;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NJbmRpY2F0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcm9ncmVzcy9icm93c2VyL3Byb2dyZXNzSW5kaWNhdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLHVCQUF3QixTQUFRLHNCQUFVO1FBRXRELFlBQ2tCLFdBQXdCLEVBQ3hCLEtBQXVCO1lBRXhDLEtBQUssRUFBRSxDQUFDO1lBSFMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFJeEMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4Qiw4REFBOEQ7WUFDOUQsMkJBQTJCO1lBQzNCLDZEQUE2RDtZQUM3RCwwREFBMEQ7WUFDMUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUM5QyxJQUNDLENBQUMsQ0FBQyxJQUFJLCtDQUF1QztvQkFDN0MsQ0FBQyxDQUFDLENBQUMsSUFBSSw4Q0FBc0MsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUNuRSxDQUFDO29CQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUlELElBQUksQ0FBQyxlQUE4QixFQUFFLEtBQWM7WUFFbEQsZ0RBQWdEO1lBQ2hELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyw4QkFBbUIsQ0FBQztZQUM1QixDQUFDO1lBRUQsSUFBSSxlQUFlLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUlPLE1BQU0sQ0FBQyxlQUE4QixFQUFFLEtBQWM7WUFDNUQsSUFBSSxPQUFPLGVBQWUsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsT0FBTztnQkFDTixLQUFLLEVBQUUsQ0FBQyxLQUFhLEVBQUUsRUFBRTtvQkFDeEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9CLENBQUM7Z0JBRUQsTUFBTSxFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7b0JBQzFCLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakMsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3BDLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLEVBQUUsR0FBRyxFQUFFO29CQUNWLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hDLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBeUIsRUFBRSxLQUFjO1lBRXhELGdEQUFnRDtZQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQztvQkFDSixNQUFNLE9BQU8sQ0FBQztnQkFDZixDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLFNBQVM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXlCLEVBQUUsS0FBYztZQUNsRSxJQUFJLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXhDLE1BQU0sT0FBTyxDQUFDO1lBQ2YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLFNBQVM7WUFDVixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBaEdELDBEQWdHQztJQUVELElBQVUsc0JBQXNCLENBeUMvQjtJQXpDRCxXQUFVLHNCQUFzQjtRQUUvQixJQUFrQixJQU1qQjtRQU5ELFdBQWtCLElBQUk7WUFDckIsK0JBQUksQ0FBQTtZQUNKLCtCQUFJLENBQUE7WUFDSix1Q0FBUSxDQUFBO1lBQ1IsaUNBQUssQ0FBQTtZQUNMLCtCQUFJLENBQUE7UUFDTCxDQUFDLEVBTmlCLElBQUksR0FBSiwyQkFBSSxLQUFKLDJCQUFJLFFBTXJCO1FBRVksMkJBQUksR0FBRyxFQUFFLElBQUksbUJBQVcsRUFBVyxDQUFDO1FBQ3BDLDJCQUFJLEdBQUcsRUFBRSxJQUFJLG1CQUFXLEVBQVcsQ0FBQztRQUNwQywrQkFBUSxHQUFHLEVBQUUsSUFBSSx1QkFBZSxFQUFXLENBQUM7UUFFekQsTUFBYSxLQUFLO1lBSWpCLFlBQ1UsWUFBOEIsRUFDOUIsVUFBa0IsRUFDbEIsVUFBa0I7Z0JBRmxCLGlCQUFZLEdBQVosWUFBWSxDQUFrQjtnQkFDOUIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtnQkFDbEIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtnQkFMbkIsU0FBSSxzQkFBYztZQU12QixDQUFDO1NBQ0w7UUFUWSw0QkFBSyxRQVNqQixDQUFBO1FBRUQsTUFBYSxJQUFJO1lBSWhCLFlBQ1UsS0FBeUIsRUFDekIsTUFBMEI7Z0JBRDFCLFVBQUssR0FBTCxLQUFLLENBQW9CO2dCQUN6QixXQUFNLEdBQU4sTUFBTSxDQUFvQjtnQkFKM0IsU0FBSSxxQkFBYTtZQUt0QixDQUFDO1NBQ0w7UUFSWSwyQkFBSSxPQVFoQixDQUFBO0lBUUYsQ0FBQyxFQXpDUyxzQkFBc0IsS0FBdEIsc0JBQXNCLFFBeUMvQjtJQWVELE1BQWEsdUJBQXdCLFNBQVEsc0JBQVU7UUFJdEQsWUFDa0IsV0FBd0IsRUFDeEIsS0FBcUI7WUFFdEMsS0FBSyxFQUFFLENBQUM7WUFIUyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUN4QixVQUFLLEdBQUwsS0FBSyxDQUFnQjtZQUovQixrQkFBYSxHQUFpQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7WUFRakYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFO2dCQUNoRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUMzQixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGtCQUFrQjtZQUV6QixpRUFBaUU7WUFDakUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksS0FBSyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2xFLE9BQU87WUFDUixDQUFDO1lBRUQsd0NBQXdDO1lBQ3hDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLDhDQUFzQyxFQUFFLENBQUM7Z0JBQ25FLElBQUksS0FBeUIsQ0FBQztnQkFDOUIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDcEcsSUFBSSxjQUFjLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3hCLEtBQUssR0FBRyxjQUFjLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLENBQUM7WUFFRCwyQkFBMkI7aUJBQ3RCLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLGlEQUF5QyxFQUFFLENBQUM7Z0JBQzNFLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDcEMsQ0FBQztZQUVELDBDQUEwQztpQkFDckMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksNkNBQXFDLEVBQUUsQ0FBQztnQkFDdkUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN6RCxDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDM0QsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sb0JBQW9CO1lBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUlELElBQUksQ0FBQyxlQUE4QixFQUFFLEtBQWM7WUFFbEQscUJBQXFCO1lBQ3JCLElBQUksT0FBTyxlQUFlLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxhQUFhLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxDQUFDO1lBQ3RELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRixDQUFDO1lBRUQsd0JBQXdCO1lBQ3hCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFFekIsbURBQW1EO2dCQUNuRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxpREFBeUMsRUFBRSxDQUFDO29CQUN0RSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDekMsQ0FBQztnQkFFRCxpREFBaUQ7cUJBQzVDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLDZDQUFxQyxJQUFJLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3ZILElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5RCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU87Z0JBQ04sS0FBSyxFQUFFLENBQUMsS0FBYSxFQUFFLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQ25ELEtBQUssRUFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksNkNBQXFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFFdkcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztnQkFDRixDQUFDO2dCQUVELE1BQU0sRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO29CQUUxQixnRkFBZ0Y7b0JBQ2hGLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7d0JBQ3pELElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQyxJQUFJLENBQ25ELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSw2Q0FBcUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFDbkcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLDZDQUFxQyxJQUFJLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUU5SixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7NEJBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUNqQyxDQUFDO29CQUNGLENBQUM7b0JBRUQsMkZBQTJGO3lCQUN0RixDQUFDO3dCQUNMLElBQUksQ0FBQyxhQUFhLEdBQUcsc0JBQXNCLENBQUMsUUFBUSxDQUFDO3dCQUNyRCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNwQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxFQUFFLEdBQUcsRUFBRTtvQkFDVixJQUFJLENBQUMsYUFBYSxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQztvQkFFakQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNoQyxDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBeUIsRUFBRSxLQUFjO1lBRXhELG9FQUFvRTtZQUNwRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSw4Q0FBc0MsRUFBRSxDQUFDO2dCQUNuRSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksc0JBQXNCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBRXZGLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV4QixNQUFNLE9BQU8sQ0FBQztZQUNmLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixTQUFTO1lBQ1YsQ0FBQztvQkFBUyxDQUFDO2dCQUVWLDRFQUE0RTtnQkFDNUUsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksOENBQXNDLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBRWxILDBFQUEwRTtvQkFDMUUsSUFBSSxDQUFDLGFBQWEsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7b0JBRWpELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxXQUFXLENBQUMsS0FBYztZQUVqQyw0QkFBNEI7WUFDNUIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBeEtELDBEQXdLQztJQUVELE1BQXNCLHFCQUFzQixTQUFRLHNCQUFVO1FBSzdELElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFFekMsWUFDUyxPQUFlLEVBQ2YsU0FBa0I7WUFFMUIsS0FBSyxFQUFFLENBQUM7WUFIQSxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ2YsY0FBUyxHQUFULFNBQVMsQ0FBUztZQVBWLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pFLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7UUFTM0QsQ0FBQztRQUVTLGFBQWEsQ0FBQyxPQUFlO1lBQ3RDLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBRXRCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRVMsYUFBYSxDQUFDLE9BQWU7WUFDdEMsSUFBSSxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBRXZCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFqQ0Qsc0RBaUNDIn0=