define(["require", "exports", "vs/nls", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/common/debug", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/views/common/viewsService", "vs/platform/commands/common/commands"], function (require, exports, nls, filters_1, lifecycle_1, debug_1, quickInput_1, viewsService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showDebugSessionMenu = showDebugSessionMenu;
    async function showDebugSessionMenu(accessor, selectAndStartID) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const debugService = accessor.get(debug_1.IDebugService);
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const commandService = accessor.get(commands_1.ICommandService);
        const localDisposableStore = new lifecycle_1.DisposableStore();
        const quickPick = quickInputService.createQuickPick();
        localDisposableStore.add(quickPick);
        quickPick.matchOnLabel = quickPick.matchOnDescription = quickPick.matchOnDetail = quickPick.sortByLabel = false;
        quickPick.placeholder = nls.localize('moveFocusedView.selectView', 'Search debug sessions by name');
        const pickItems = _getPicksAndActiveItem(quickPick.value, selectAndStartID, debugService, viewsService, commandService);
        quickPick.items = pickItems.picks;
        quickPick.activeItems = pickItems.activeItems;
        localDisposableStore.add(quickPick.onDidChangeValue(async () => {
            quickPick.items = _getPicksAndActiveItem(quickPick.value, selectAndStartID, debugService, viewsService, commandService).picks;
        }));
        localDisposableStore.add(quickPick.onDidAccept(() => {
            const selectedItem = quickPick.selectedItems[0];
            selectedItem.accept();
            quickPick.hide();
            localDisposableStore.dispose();
        }));
        quickPick.show();
    }
    function _getPicksAndActiveItem(filter, selectAndStartID, debugService, viewsService, commandService) {
        const debugConsolePicks = [];
        const headerSessions = [];
        const currSession = debugService.getViewModel().focusedSession;
        const sessions = debugService.getModel().getSessions(false);
        const activeItems = [];
        sessions.forEach((session) => {
            if (session.compact && session.parentSession) {
                headerSessions.push(session.parentSession);
            }
        });
        sessions.forEach((session) => {
            const isHeader = headerSessions.includes(session);
            if (!session.parentSession) {
                debugConsolePicks.push({ type: 'separator', label: isHeader ? session.name : undefined });
            }
            if (!isHeader) {
                const pick = _createPick(session, filter, debugService, viewsService, commandService);
                if (pick) {
                    debugConsolePicks.push(pick);
                    if (session.getId() === currSession?.getId()) {
                        activeItems.push(pick);
                    }
                }
            }
        });
        if (debugConsolePicks.length) {
            debugConsolePicks.push({ type: 'separator' });
        }
        const createDebugSessionLabel = nls.localize('workbench.action.debug.startDebug', 'Start a New Debug Session');
        debugConsolePicks.push({
            label: `$(plus) ${createDebugSessionLabel}`,
            ariaLabel: createDebugSessionLabel,
            accept: () => commandService.executeCommand(selectAndStartID)
        });
        return { picks: debugConsolePicks, activeItems };
    }
    function _getSessionInfo(session) {
        const label = (!session.configuration.name.length) ? session.name : session.configuration.name;
        const parentName = session.compact ? undefined : session.parentSession?.configuration.name;
        let description = '';
        let ariaLabel = '';
        if (parentName) {
            ariaLabel = nls.localize('workbench.action.debug.spawnFrom', 'Session {0} spawned from {1}', label, parentName);
            description = parentName;
        }
        return { label, description, ariaLabel };
    }
    function _createPick(session, filter, debugService, viewsService, commandService) {
        const pickInfo = _getSessionInfo(session);
        const highlights = (0, filters_1.matchesFuzzy)(filter, pickInfo.label, true);
        if (highlights) {
            return {
                label: pickInfo.label,
                description: pickInfo.description,
                ariaLabel: pickInfo.ariaLabel,
                highlights: { label: highlights },
                accept: () => {
                    debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
                    if (!viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                        viewsService.openView(debug_1.REPL_VIEW_ID, true);
                    }
                }
            };
        }
        return undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTZXNzaW9uUGlja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnU2Vzc2lvblBpY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFnQkEsb0RBMEJDO0lBMUJNLEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxRQUEwQixFQUFFLGdCQUF3QjtRQUM5RixNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsQ0FBQztRQUMzRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFCQUFhLENBQUMsQ0FBQztRQUNqRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFhLENBQUMsQ0FBQztRQUNqRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUFlLENBQUMsQ0FBQztRQUVyRCxNQUFNLG9CQUFvQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQ25ELE1BQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLGVBQWUsRUFBb0IsQ0FBQztRQUN4RSxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsU0FBUyxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUNoSCxTQUFTLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsK0JBQStCLENBQUMsQ0FBQztRQUVwRyxNQUFNLFNBQVMsR0FBRyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsY0FB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