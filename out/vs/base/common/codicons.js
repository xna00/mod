define(["require", "exports", "vs/base/common/codiconsUtil", "vs/base/common/codiconsLibrary"], function (require, exports, codiconsUtil_1, codiconsLibrary_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Codicon = exports.codiconsDerived = void 0;
    exports.getAllCodicons = getAllCodicons;
    /**
     * Only to be used by the iconRegistry.
     */
    function getAllCodicons() {
        return Object.values(exports.Codicon);
    }
    /**
     * Derived icons, that could become separate icons.
     * These mappings should be moved into the mapping file in the vscode-codicons repo at some point.
     */
    exports.codiconsDerived = {
        dialogError: (0, codiconsUtil_1.register)('dialog-error', 'error'),
        dialogWarning: (0, codiconsUtil_1.register)('dialog-warning', 'warning'),
        dialogInfo: (0, codiconsUtil_1.register)('dialog-info', 'info'),
        dialogClose: (0, codiconsUtil_1.register)('dialog-close', 'close'),
        treeItemExpanded: (0, codiconsUtil_1.register)('tree-item-expanded', 'chevron-down'), // collapsed is done with rotation
        treeFilterOnTypeOn: (0, codiconsUtil_1.register)('tree-filter-on-type-on', 'list-filter'),
        treeFilterOnTypeOff: (0, codiconsUtil_1.register)('tree-filter-on-type-off', 'list-selection'),
        treeFilterClear: (0, codiconsUtil_1.register)('tree-filter-clear', 'close'),
        treeItemLoading: (0, codiconsUtil_1.register)('tree-item-loading', 'loading'),
        menuSelection: (0, codiconsUtil_1.register)('menu-selection', 'check'),
        menuSubmenu: (0, codiconsUtil_1.register)('menu-submenu', 'chevron-right'),
        menuBarMore: (0, codiconsUtil_1.register)('menubar-more', 'more'),
        scrollbarButtonLeft: (0, codiconsUtil_1.register)('scrollbar-button-left', 'triangle-left'),
        scrollbarButtonRight: (0, codiconsUtil_1.register)('scrollbar-button-right', 'triangle-right'),
        scrollbarButtonUp: (0, codiconsUtil_1.register)('scrollbar-button-up', 'triangle-up'),
        scrollbarButtonDown: (0, codiconsUtil_1.register)('scrollbar-button-down', 'triangle-down'),
        toolBarMore: (0, codiconsUtil_1.register)('toolbar-more', 'more'),
        quickInputBack: (0, codiconsUtil_1.register)('quick-input-back', 'arrow-left'),
        dropDownButton: (0, codiconsUtil_1.register)('drop-down-button', 0xeab4),
        symbolCustomColor: (0, codiconsUtil_1.register)('symbol-customcolor', 0xeb5c),
        exportIcon: (0, codiconsUtil_1.register)('export', 0xebac),
        workspaceUnspecified: (0, codiconsUtil_1.register)('workspace-unspecified', 0xebc3),
        newLine: (0, codiconsUtil_1.register)('newline', 0xebea),
        thumbsDownFilled: (0, codiconsUtil_1.register)('thumbsdown-filled', 0xec13),
        thumbsUpFilled: (0, codiconsUtil_1.register)('thumbsup-filled', 0xec14),
        gitFetch: (0, codiconsUtil_1.register)('git-fetch', 0xec1d),
        lightbulbSparkleAutofix: (0, codiconsUtil_1.register)('lightbulb-sparkle-autofix', 0xec1f),
        debugBreakpointPending: (0, codiconsUtil_1.register)('debug-breakpoint-pending', 0xebd9),
    };
    /**
     * The Codicon library is a set of default icons that are built-in in VS Code.
     *
     * In the product (outside of base) Codicons should only be used as defaults. In order to have all icons in VS Code
     * themeable, component should define new, UI component specific icons using `iconRegistry.registerIcon`.
     * In that call a Codicon can be named as default.
     */
    exports.Codicon = {
        ...codiconsLibrary_1.codiconsLibrary,
        ...exports.codiconsDerived
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kaWNvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvY29tbW9uL2NvZGljb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFZQSx3Q0FFQztJQUxEOztPQUVHO0lBQ0gsU0FBZ0IsY0FBYztRQUM3QixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsZUFBTyxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7T0FHRztJQUNVLFFBQUEsZUFBZSxHQUFHO1FBQzlCLFdBQVcsRUFBRSxJQUFBLHVCQUFRLEVBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQztRQUM5QyxhQUFhLEVBQUUsSUFBQSx1QkFBUSxFQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQztRQUNwRCxVQUFVLEVBQUUsSUFBQSx1QkFBUSxFQUFDLGFBQWEsRUFBRSxNQUFNLENBQUM7UUFDM0MsV0FBVyxFQUFFLElBQUEsdUJBQVEsRUFBQyxjQUFjLEVBQUUsT0FBTyxDQUFDO1FBQzlDLGdCQUFnQixFQUFFLElBQUEsdUJBQVEsRUFBQyxvQkFBb0IsRUFBRSxjQUFjLENBQUMsRUFBRSxrQ0FBa0M7UUFDcEcsa0JBQWtCLEVBQUUsSUFBQSx1QkFBUSxFQUFDLHdCQUF3QixFQUFFLGFBQWEsQ0FBQztRQUNyRSxtQkFBbUIsRUFBRSxJQUFBLHVCQUFRLEVBQUMseUJBQXlCLEVBQUUsZ0JBQWdCLENBQUM7UUFDMUUsZUFBZSxFQUFFLElBQUEsdUJBQVEsRUFBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUM7UUFDdkQsZUFBZSxFQUFFLElBQUEsdUJBQVEsRUFBQyxtQkFBbUIsRUFBRSxTQUFTLENBQUM7UUFDekQsYUFBYSxFQUFFLElBQUEsdUJBQVEsRUFBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUM7UUFDbEQsV0FBVyxFQUFFLElBQUEsdUJBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO1FBQ3RELFdBQVcsRUFBRSxJQUFBLHVCQUFRLEVBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM3QyxtQkFBbUIsRUFBRSxJQUFBLHVCQUFRLEVBQUMsdUJBQXVCLEVBQUUsZUFBZSxDQUFDO1FBQ3ZFLG9CQUFvQixFQUFFLElBQUEsdUJBQVEsRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsQ0FBQztRQUMxRSxpQkFBaUIsRUFBRSxJQUFBLHVCQUFRLEVBQUMscUJBQXFCLEVBQUUsYUFBYSxDQUFDO1FBQ2pFLG1CQUFtQixFQUFFLElBQUEsdUJBQVEsRUFBQyx1QkFBdUIsRUFBRSxlQUFlLENBQUM7UUFDdkUsV0FBVyxFQUFFLElBQUEsdUJBQVEsRUFBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzdDLGNBQWMsRUFBRSxJQUFBLHVCQUFRLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxDQUFDO1FBQzFELGNBQWMsRUFBRSxJQUFBLHVCQUFRLEVBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDO1FBQ3BELGlCQUFpQixFQUFFLElBQUEsdUJBQVEsRUFBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUM7UUFDekQsVUFBVSxFQUFFLElBQUEsdUJBQVEsRUFBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO1FBQ3RDLG9CQUFvQixFQUFFLElBQUEsdUJBQVEsRUFBQyx1QkFBdUIsRUFBRSxNQUFNLENBQUM7UUFDL0QsT0FBTyxFQUFFLElBQUEsdUJBQVEsRUFBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO1FBQ3BDLGdCQUFnQixFQUFFLElBQUEsdUJBQVEsRUFBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUM7UUFDdkQsY0FBYyxFQUFFLElBQUEsdUJBQVEsRUFBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUM7UUFDbkQsUUFBUSxFQUFFLElBQUEsdUJBQVEsRUFBQyxXQUFXLEVBQUUsTUFBTSxDQUFDO1FBQ3ZDLHVCQUF1QixFQUFFLElBQUEsdUJBQVEsRUFBQywyQkFBMkIsRUFBRSxNQUFNLENBQUM7UUFDdEUsc0JBQXNCLEVBQUUsSUFBQSx1QkFBUSxFQUFDLDBCQUEwQixFQUFFLE1BQU0sQ0FBQztLQUUzRCxDQUFDO0lBRVg7Ozs7OztPQU1HO0lBQ1UsUUFBQSxPQUFPLEdBQUc7UUFDdEIsR0FBRyxpQ0FBZTtRQUNsQixHQUFHLHVCQUFlO0tBRVQsQ0FBQyJ9