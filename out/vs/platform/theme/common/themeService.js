/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/theme"], function (require, exports, codicons_1, event_1, lifecycle_1, instantiation_1, platform, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Themable = exports.Extensions = exports.FolderThemeIcon = exports.FileThemeIcon = exports.IThemeService = void 0;
    exports.themeColorFromId = themeColorFromId;
    exports.getThemeTypeSelector = getThemeTypeSelector;
    exports.registerThemingParticipant = registerThemingParticipant;
    exports.IThemeService = (0, instantiation_1.createDecorator)('themeService');
    function themeColorFromId(id) {
        return { id };
    }
    exports.FileThemeIcon = codicons_1.Codicon.file;
    exports.FolderThemeIcon = codicons_1.Codicon.folder;
    function getThemeTypeSelector(type) {
        switch (type) {
            case theme_1.ColorScheme.DARK: return 'vs-dark';
            case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return 'hc-black';
            case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return 'hc-light';
            default: return 'vs';
        }
    }
    // static theming participant
    exports.Extensions = {
        ThemingContribution: 'base.contributions.theming'
    };
    class ThemingRegistry {
        constructor() {
            this.themingParticipants = [];
            this.themingParticipants = [];
            this.onThemingParticipantAddedEmitter = new event_1.Emitter();
        }
        onColorThemeChange(participant) {
            this.themingParticipants.push(participant);
            this.onThemingParticipantAddedEmitter.fire(participant);
            return (0, lifecycle_1.toDisposable)(() => {
                const idx = this.themingParticipants.indexOf(participant);
                this.themingParticipants.splice(idx, 1);
            });
        }
        get onThemingParticipantAdded() {
            return this.onThemingParticipantAddedEmitter.event;
        }
        getThemingParticipants() {
            return this.themingParticipants;
        }
    }
    const themingRegistry = new ThemingRegistry();
    platform.Registry.add(exports.Extensions.ThemingContribution, themingRegistry);
    function registerThemingParticipant(participant) {
        return themingRegistry.onColorThemeChange(participant);
    }
    /**
     * Utility base class for all themable components.
     */
    class Themable extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
            this.theme = themeService.getColorTheme();
            // Hook up to theme changes
            this._register(this.themeService.onDidColorThemeChange(theme => this.onThemeChange(theme)));
        }
        onThemeChange(theme) {
            this.theme = theme;
            this.updateStyles();
        }
        updateStyles() {
            // Subclasses to override
        }
        getColor(id, modify) {
            let color = this.theme.getColor(id);
            if (color && modify) {
                color = modify(color, this.theme);
            }
            return color ? color.toString() : null;
        }
    }
    exports.Themable = Themable;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90aGVtZS9jb21tb24vdGhlbWVTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWVoRyw0Q0FFQztJQUtELG9EQU9DO0lBc0lELGdFQUVDO0lBeEpZLFFBQUEsYUFBYSxHQUFHLElBQUEsK0JBQWUsRUFBZ0IsY0FBYyxDQUFDLENBQUM7SUFFNUUsU0FBZ0IsZ0JBQWdCLENBQUMsRUFBbUI7UUFDbkQsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUVZLFFBQUEsYUFBYSxHQUFHLGtCQUFPLENBQUMsSUFBSSxDQUFDO0lBQzdCLFFBQUEsZUFBZSxHQUFHLGtCQUFPLENBQUMsTUFBTSxDQUFDO0lBRTlDLFNBQWdCLG9CQUFvQixDQUFDLElBQWlCO1FBQ3JELFFBQVEsSUFBSSxFQUFFLENBQUM7WUFDZCxLQUFLLG1CQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7WUFDeEMsS0FBSyxtQkFBVyxDQUFDLGtCQUFrQixDQUFDLENBQUMsT0FBTyxVQUFVLENBQUM7WUFDdkQsS0FBSyxtQkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUMsT0FBTyxVQUFVLENBQUM7WUFDeEQsT0FBTyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUM7UUFDdEIsQ0FBQztJQUNGLENBQUM7SUF1RkQsNkJBQTZCO0lBQ2hCLFFBQUEsVUFBVSxHQUFHO1FBQ3pCLG1CQUFtQixFQUFFLDRCQUE0QjtLQUNqRCxDQUFDO0lBY0YsTUFBTSxlQUFlO1FBSXBCO1lBSFEsd0JBQW1CLEdBQTBCLEVBQUUsQ0FBQztZQUl2RCxJQUFJLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxnQ0FBZ0MsR0FBRyxJQUFJLGVBQU8sRUFBdUIsQ0FBQztRQUM1RSxDQUFDO1FBRU0sa0JBQWtCLENBQUMsV0FBZ0M7WUFDekQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBVyx5QkFBeUI7WUFDbkMsT0FBTyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsS0FBSyxDQUFDO1FBQ3BELENBQUM7UUFFTSxzQkFBc0I7WUFDNUIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztLQUNEO0lBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUM5QyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBVSxDQUFDLG1CQUFtQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXZFLFNBQWdCLDBCQUEwQixDQUFDLFdBQWdDO1FBQzFFLE9BQU8sZUFBZSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRDs7T0FFRztJQUNILE1BQWEsUUFBUyxTQUFRLHNCQUFVO1FBR3ZDLFlBQ1csWUFBMkI7WUFFckMsS0FBSyxFQUFFLENBQUM7WUFGRSxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUlyQyxJQUFJLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUUxQywyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0YsQ0FBQztRQUVTLGFBQWEsQ0FBQyxLQUFrQjtZQUN6QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUVuQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVELFlBQVk7WUFDWCx5QkFBeUI7UUFDMUIsQ0FBQztRQUVTLFFBQVEsQ0FBQyxFQUFVLEVBQUUsTUFBb0Q7WUFDbEYsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFcEMsSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuQyxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3hDLENBQUM7S0FDRDtJQWpDRCw0QkFpQ0MifQ==