/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/goToCommands", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification"], function (require, exports, dom, actions_1, cancellation_1, uuid_1, range_1, resolverService_1, goToCommands_1, peekView_1, actions_2, commands_1, contextkey_1, contextView_1, instantiation_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showGoToContextMenu = showGoToContextMenu;
    exports.goToDefinitionWithLocation = goToDefinitionWithLocation;
    async function showGoToContextMenu(accessor, editor, anchor, part) {
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const commandService = accessor.get(commands_1.ICommandService);
        const instaService = accessor.get(instantiation_1.IInstantiationService);
        const notificationService = accessor.get(notification_1.INotificationService);
        await part.item.resolve(cancellation_1.CancellationToken.None);
        if (!part.part.location) {
            return;
        }
        const location = part.part.location;
        const menuActions = [];
        // from all registered (not active) context menu actions select those
        // that are a symbol navigation actions
        const filter = new Set(actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.EditorContext)
            .map(item => (0, actions_2.isIMenuItem)(item) ? item.command.id : (0, uuid_1.generateUuid)()));
        for (const delegate of goToCommands_1.SymbolNavigationAction.all()) {
            if (filter.has(delegate.desc.id)) {
                menuActions.push(new actions_1.Action(delegate.desc.id, actions_2.MenuItemAction.label(delegate.desc, { renderShortTitle: true }), undefined, true, async () => {
                    const ref = await resolverService.createModelReference(location.uri);
                    try {
                        const symbolAnchor = new goToCommands_1.SymbolNavigationAnchor(ref.object.textEditorModel, range_1.Range.getStartPosition(location.range));
                        const range = part.item.anchor.range;
                        await instaService.invokeFunction(delegate.runEditorCommand.bind(delegate), editor, symbolAnchor, range);
                    }
                    finally {
                        ref.dispose();
                    }
                }));
            }
        }
        if (part.part.command) {
            const { command } = part.part;
            menuActions.push(new actions_1.Separator());
            menuActions.push(new actions_1.Action(command.id, command.title, undefined, true, async () => {
                try {
                    await commandService.executeCommand(command.id, ...(command.arguments ?? []));
                }
                catch (err) {
                    notificationService.notify({
                        severity: notification_1.Severity.Error,
                        source: part.item.provider.displayName,
                        message: err
                    });
                }
            }));
        }
        // show context menu
        const useShadowDOM = editor.getOption(127 /* EditorOption.useShadowDOM */);
        contextMenuService.showContextMenu({
            domForShadowRoot: useShadowDOM ? editor.getDomNode() ?? undefined : undefined,
            getAnchor: () => {
                const box = dom.getDomNodePagePosition(anchor);
                return { x: box.left, y: box.top + box.height + 8 };
            },
            getActions: () => menuActions,
            onHide: () => {
                editor.focus();
            },
            autoSelectFirstItem: true,
        });
    }
    async function goToDefinitionWithLocation(accessor, event, editor, location) {
        const resolverService = accessor.get(resolverService_1.ITextModelService);
        const ref = await resolverService.createModelReference(location.uri);
        await editor.invokeWithinContext(async (accessor) => {
            const openToSide = event.hasSideBySideModifier;
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const isInPeek = peekView_1.PeekContext.inPeekEditor.getValue(contextKeyService);
            const canPeek = !openToSide && editor.getOption(88 /* EditorOption.definitionLinkOpensInPeek */) && !isInPeek;
            const action = new goToCommands_1.DefinitionAction({ openToSide, openInPeek: canPeek, muteMessage: true }, { title: { value: '', original: '' }, id: '', precondition: undefined });
            return action.run(accessor, new goToCommands_1.SymbolNavigationAnchor(ref.object.textEditorModel, range_1.Range.getStartPosition(location.range)), range_1.Range.lift(location.range));
        });
        ref.dispose();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5sYXlIaW50c0xvY2F0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5sYXlIaW50cy9icm93c2VyL2lubGF5SGludHNMb2NhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLGtEQXFFQztJQUVELGdFQWtCQztJQXpGTSxLQUFLLFVBQVUsbUJBQW1CLENBQUMsUUFBMEIsRUFBRSxNQUFtQixFQUFFLE1BQW1CLEVBQUUsSUFBZ0M7UUFFL0ksTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxtQ0FBaUIsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsQ0FBQyxDQUFDO1FBQzdELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO1FBQ3JELE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztRQUN6RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQztRQUUvRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3pCLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDOUMsTUFBTSxXQUFXLEdBQWMsRUFBRSxDQUFDO1FBRWxDLHFFQUFxRTtRQUNyRSx1Q0FBdUM7UUFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMs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