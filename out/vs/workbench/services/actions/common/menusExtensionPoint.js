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
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/base/common/process", "vs/base/common/htmlContent", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls_1, strings_1, resources, extensionsRegistry_1, contextkey_1, actions_1, lifecycle_1, themables_1, arrays_1, extensions_1, extensionFeatures_1, platform_1, descriptors_1, process_1, htmlContent_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.commandsExtensionPoint = void 0;
    const apiMenus = [
        {
            key: 'commandPalette',
            id: actions_1.MenuId.CommandPalette,
            description: (0, nls_1.localize)('menus.commandPalette', "The Command Palette"),
            supportsSubmenus: false
        },
        {
            key: 'touchBar',
            id: actions_1.MenuId.TouchBarContext,
            description: (0, nls_1.localize)('menus.touchBar', "The touch bar (macOS only)"),
            supportsSubmenus: false
        },
        {
            key: 'editor/title',
            id: actions_1.MenuId.EditorTitle,
            description: (0, nls_1.localize)('menus.editorTitle', "The editor title menu")
        },
        {
            key: 'editor/title/run',
            id: actions_1.MenuId.EditorTitleRun,
            description: (0, nls_1.localize)('menus.editorTitleRun', "Run submenu inside the editor title menu")
        },
        {
            key: 'editor/context',
            id: actions_1.MenuId.EditorContext,
            description: (0, nls_1.localize)('menus.editorContext', "The editor context menu")
        },
        {
            key: 'editor/context/copy',
            id: actions_1.MenuId.EditorContextCopy,
            description: (0, nls_1.localize)('menus.editorContextCopyAs', "'Copy as' submenu in the editor context menu")
        },
        {
            key: 'editor/context/share',
            id: actions_1.MenuId.EditorContextShare,
            description: (0, nls_1.localize)('menus.editorContextShare', "'Share' submenu in the editor context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'explorer/context',
            id: actions_1.MenuId.ExplorerContext,
            description: (0, nls_1.localize)('menus.explorerContext', "The file explorer context menu")
        },
        {
            key: 'explorer/context/share',
            id: actions_1.MenuId.ExplorerContextShare,
            description: (0, nls_1.localize)('menus.explorerContextShare', "'Share' submenu in the file explorer context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'editor/title/context',
            id: actions_1.MenuId.EditorTitleContext,
            description: (0, nls_1.localize)('menus.editorTabContext', "The editor tabs context menu")
        },
        {
            key: 'editor/title/context/share',
            id: actions_1.MenuId.EditorTitleContextShare,
            description: (0, nls_1.localize)('menus.editorTitleContextShare', "'Share' submenu inside the editor title context menu"),
            proposed: 'contribShareMenu'
        },
        {
            key: 'debug/callstack/context',
            id: actions_1.MenuId.DebugCallStackContext,
            description: (0, nls_1.localize)('menus.debugCallstackContext', "The debug callstack view context menu")
        },
        {
            key: 'debug/variables/context',
            id: actions_1.MenuId.DebugVariablesContext,
            description: (0, nls_1.localize)('menus.debugVariablesContext', "The debug variables view context menu")
        },
        {
            key: 'debug/toolBar',
            id: actions_1.MenuId.DebugToolBar,
            description: (0, nls_1.localize)('menus.debugToolBar', "The debug toolbar menu")
        },
        {
            key: 'notebook/variables/context',
            id: actions_1.MenuId.NotebookVariablesContext,
            description: (0, nls_1.localize)('menus.notebookVariablesContext', "The notebook variables view context menu")
        },
        {
            key: 'menuBar/home',
            id: actions_1.MenuId.MenubarHomeMenu,
            description: (0, nls_1.localize)('menus.home', "The home indicator context menu (web only)"),
            proposed: 'contribMenuBarHome',
            supportsSubmenus: false
        },
        {
            key: 'menuBar/edit/copy',
            id: actions_1.MenuId.MenubarCopy,
            description: (0, nls_1.localize)('menus.opy', "'Copy as' submenu in the top level Edit menu")
        },
        {
            key: 'scm/title',
            id: actions_1.MenuId.SCMTitle,
            description: (0, nls_1.localize)('menus.scmTitle', "The Source Control title menu")
        },
        {
            key: 'scm/sourceControl',
            id: actions_1.MenuId.SCMSourceControl,
            description: (0, nls_1.localize)('menus.scmSourceControl', "The Source Control menu")
        },
        {
            key: 'scm/sourceControl/title',
            id: actions_1.MenuId.SCMSourceControlTitle,
            description: (0, nls_1.localize)('menus.scmSourceControlTitle', "The Source Control title menu"),
            proposed: 'contribSourceControlTitleMenu'
        },
        {
            key: 'scm/resourceState/context',
            id: actions_1.MenuId.SCMResourceContext,
            description: (0, nls_1.localize)('menus.resourceStateContext', "The Source Control resource state context menu")
        },
        {
            key: 'scm/resourceFolder/context',
            id: actions_1.MenuId.SCMResourceFolderContext,
            description: (0, nls_1.localize)('menus.resourceFolderContext', "The Source Control resource folder context menu")
        },
        {
            key: 'scm/resourceGroup/context',
            id: actions_1.MenuId.SCMResourceGroupContext,
            description: (0, nls_1.localize)('menus.resourceGroupContext', "The Source Control resource group context menu")
        },
        {
            key: 'scm/change/title',
            id: actions_1.MenuId.SCMChangeContext,
            description: (0, nls_1.localize)('menus.changeTitle', "The Source Control inline change menu")
        },
        {
            key: 'scm/inputBox',
            id: actions_1.MenuId.SCMInputBox,
            description: (0, nls_1.localize)('menus.input', "The Source Control input box menu"),
            proposed: 'contribSourceControlInputBoxMenu'
        },
        {
            key: 'scm/incomingChanges',
            id: actions_1.MenuId.SCMIncomingChanges,
            description: (0, nls_1.localize)('menus.incomingChanges', "The Source Control incoming changes menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/incomingChanges/context',
            id: actions_1.MenuId.SCMIncomingChangesContext,
            description: (0, nls_1.localize)('menus.incomingChangesContext', "The Source Control incoming changes context menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/outgoingChanges',
            id: actions_1.MenuId.SCMOutgoingChanges,
            description: (0, nls_1.localize)('menus.outgoingChanges', "The Source Control outgoing changes menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/outgoingChanges/context',
            id: actions_1.MenuId.SCMOutgoingChangesContext,
            description: (0, nls_1.localize)('menus.outgoingChangesContext', "The Source Control outgoing changes context menu"),
            proposed: 'contribSourceControlHistoryItemGroupMenu'
        },
        {
            key: 'scm/incomingChanges/allChanges/context',
            id: actions_1.MenuId.SCMIncomingChangesAllChangesContext,
            description: (0, nls_1.localize)('menus.incomingChangesAllChangesContext', "The Source Control all incoming changes context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/incomingChanges/historyItem/context',
            id: actions_1.MenuId.SCMIncomingChangesHistoryItemContext,
            description: (0, nls_1.localize)('menus.incomingChangesHistoryItemContext', "The Source Control incoming changes history item context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/outgoingChanges/allChanges/context',
            id: actions_1.MenuId.SCMOutgoingChangesAllChangesContext,
            description: (0, nls_1.localize)('menus.outgoingChangesAllChangesContext', "The Source Control all outgoing changes context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'scm/outgoingChanges/historyItem/context',
            id: actions_1.MenuId.SCMOutgoingChangesHistoryItemContext,
            description: (0, nls_1.localize)('menus.outgoingChangesHistoryItemContext', "The Source Control outgoing changes history item context menu"),
            proposed: 'contribSourceControlHistoryItemMenu'
        },
        {
            key: 'statusBar/remoteIndicator',
            id: actions_1.MenuId.StatusBarRemoteIndicatorMenu,
            description: (0, nls_1.localize)('menus.statusBarRemoteIndicator', "The remote indicator menu in the status bar"),
            supportsSubmenus: false
        },
        {
            key: 'terminal/context',
            id: actions_1.MenuId.TerminalInstanceContext,
            description: (0, nls_1.localize)('menus.terminalContext', "The terminal context menu")
        },
        {
            key: 'terminal/title/context',
            id: actions_1.MenuId.TerminalTabContext,
            description: (0, nls_1.localize)('menus.terminalTabContext', "The terminal tabs context menu")
        },
        {
            key: 'view/title',
            id: actions_1.MenuId.ViewTitle,
            description: (0, nls_1.localize)('view.viewTitle', "The contributed view title menu")
        },
        {
            key: 'view/item/context',
            id: actions_1.MenuId.ViewItemContext,
            description: (0, nls_1.localize)('view.itemContext', "The contributed view item context menu")
        },
        {
            key: 'comments/comment/editorActions',
            id: actions_1.MenuId.CommentEditorActions,
            description: (0, nls_1.localize)('commentThread.editorActions', "The contributed comment editor actions"),
            proposed: 'contribCommentEditorActionsMenu'
        },
        {
            key: 'comments/commentThread/title',
            id: actions_1.MenuId.CommentThreadTitle,
            description: (0, nls_1.localize)('commentThread.title', "The contributed comment thread title menu")
        },
        {
            key: 'comments/commentThread/context',
            id: actions_1.MenuId.CommentThreadActions,
            description: (0, nls_1.localize)('commentThread.actions', "The contributed comment thread context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'comments/commentThread/additionalActions',
            id: actions_1.MenuId.CommentThreadAdditionalActions,
            description: (0, nls_1.localize)('commentThread.actions', "The contributed comment thread context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false,
            proposed: 'contribCommentThreadAdditionalMenu'
        },
        {
            key: 'comments/commentThread/title/context',
            id: actions_1.MenuId.CommentThreadTitleContext,
            description: (0, nls_1.localize)('commentThread.titleContext', "The contributed comment thread title's peek context menu, rendered as a right click menu on the comment thread's peek title."),
            proposed: 'contribCommentPeekContext'
        },
        {
            key: 'comments/comment/title',
            id: actions_1.MenuId.CommentTitle,
            description: (0, nls_1.localize)('comment.title', "The contributed comment title menu")
        },
        {
            key: 'comments/comment/context',
            id: actions_1.MenuId.CommentActions,
            description: (0, nls_1.localize)('comment.actions', "The contributed comment context menu, rendered as buttons below the comment editor"),
            supportsSubmenus: false
        },
        {
            key: 'comments/commentThread/comment/context',
            id: actions_1.MenuId.CommentThreadCommentContext,
            description: (0, nls_1.localize)('comment.commentContext', "The contributed comment context menu, rendered as a right click menu on the an individual comment in the comment thread's peek view."),
            proposed: 'contribCommentPeekContext'
        },
        {
            key: 'commentsView/commentThread/context',
            id: actions_1.MenuId.CommentsViewThreadActions,
            description: (0, nls_1.localize)('commentsView.threadActions', "The contributed comment thread context menu in the comments view"),
            proposed: 'contribCommentsViewThreadMenus'
        },
        {
            key: 'notebook/toolbar',
            id: actions_1.MenuId.NotebookToolbar,
            description: (0, nls_1.localize)('notebook.toolbar', "The contributed notebook toolbar menu")
        },
        {
            key: 'notebook/kernelSource',
            id: actions_1.MenuId.NotebookKernelSource,
            description: (0, nls_1.localize)('notebook.kernelSource', "The contributed notebook kernel sources menu"),
            proposed: 'notebookKernelSource'
        },
        {
            key: 'notebook/cell/title',
            id: actions_1.MenuId.NotebookCellTitle,
            description: (0, nls_1.localize)('notebook.cell.title', "The contributed notebook cell title menu")
        },
        {
            key: 'notebook/cell/execute',
            id: actions_1.MenuId.NotebookCellExecute,
            description: (0, nls_1.localize)('notebook.cell.execute', "The contributed notebook cell execution menu")
        },
        {
            key: 'interactive/toolbar',
            id: actions_1.MenuId.InteractiveToolbar,
            description: (0, nls_1.localize)('interactive.toolbar', "The contributed interactive toolbar menu"),
        },
        {
            key: 'interactive/cell/title',
            id: actions_1.MenuId.InteractiveCellTitle,
            description: (0, nls_1.localize)('interactive.cell.title', "The contributed interactive cell title menu"),
        },
        {
            key: 'issue/reporter',
            id: actions_1.MenuId.IssueReporter,
            description: (0, nls_1.localize)('issue.reporter', "The contributed issue reporter menu"),
            proposed: 'contribIssueReporter'
        },
        {
            key: 'testing/item/context',
            id: actions_1.MenuId.TestItem,
            description: (0, nls_1.localize)('testing.item.context', "The contributed test item menu"),
        },
        {
            key: 'testing/item/gutter',
            id: actions_1.MenuId.TestItemGutter,
            description: (0, nls_1.localize)('testing.item.gutter.title', "The menu for a gutter decoration for a test item"),
        },
        {
            key: 'testing/item/result',
            id: actions_1.MenuId.TestPeekElement,
            description: (0, nls_1.localize)('testing.item.result.title', "The menu for an item in the Test Results view or peek."),
        },
        {
            key: 'testing/message/context',
            id: actions_1.MenuId.TestMessageContext,
            description: (0, nls_1.localize)('testing.message.context.title', "A prominent button overlaying editor content where the message is displayed"),
        },
        {
            key: 'testing/message/content',
            id: actions_1.MenuId.TestMessageContent,
            description: (0, nls_1.localize)('testing.message.content.title', "Context menu for the message in the results tree"),
        },
        {
            key: 'extension/context',
            id: actions_1.MenuId.ExtensionContext,
            description: (0, nls_1.localize)('menus.extensionContext', "The extension context menu")
        },
        {
            key: 'timeline/title',
            id: actions_1.MenuId.TimelineTitle,
            description: (0, nls_1.localize)('view.timelineTitle', "The Timeline view title menu")
        },
        {
            key: 'timeline/item/context',
            id: actions_1.MenuId.TimelineItemContext,
            description: (0, nls_1.localize)('view.timelineContext', "The Timeline view item context menu")
        },
        {
            key: 'ports/item/context',
            id: actions_1.MenuId.TunnelContext,
            description: (0, nls_1.localize)('view.tunnelContext', "The Ports view item context menu")
        },
        {
            key: 'ports/item/origin/inline',
            id: actions_1.MenuId.TunnelOriginInline,
            description: (0, nls_1.localize)('view.tunnelOriginInline', "The Ports view item origin inline menu")
        },
        {
            key: 'ports/item/port/inline',
            id: actions_1.MenuId.TunnelPortInline,
            description: (0, nls_1.localize)('view.tunnelPortInline', "The Ports view item port inline menu")
        },
        {
            key: 'file/newFile',
            id: actions_1.MenuId.NewFile,
            description: (0, nls_1.localize)('file.newFile', "The 'New File...' quick pick, shown on welcome page and File menu."),
            supportsSubmenus: false,
        },
        {
            key: 'webview/context',
            id: actions_1.MenuId.WebviewContext,
            description: (0, nls_1.localize)('webview.context', "The webview context menu")
        },
        {
            key: 'file/share',
            id: actions_1.MenuId.MenubarShare,
            description: (0, nls_1.localize)('menus.share', "Share submenu shown in the top level File menu."),
            proposed: 'contribShareMenu'
        },
        {
            key: 'editor/inlineCompletions/actions',
            id: actions_1.MenuId.InlineCompletionsActions,
            description: (0, nls_1.localize)('inlineCompletions.actions', "The actions shown when hovering on an inline completion"),
            supportsSubmenus: false,
            proposed: 'inlineCompletionsAdditions'
        },
        {
            key: 'editor/inlineEdit/actions',
            id: actions_1.MenuId.InlineEditActions,
            description: (0, nls_1.localize)('inlineEdit.actions', "The actions shown when hovering on an inline edit"),
            supportsSubmenus: false,
            proposed: 'inlineEdit'
        },
        {
            key: 'editor/content',
            id: actions_1.MenuId.EditorContent,
            description: (0, nls_1.localize)('merge.toolbar', "The prominent button in an editor, overlays its content"),
            proposed: 'contribEditorContentMenu'
        },
        {
            key: 'editor/lineNumber/context',
            id: actions_1.MenuId.EditorLineNumberContext,
            description: (0, nls_1.localize)('editorLineNumberContext', "The contributed editor line number context menu")
        },
        {
            key: 'mergeEditor/result/title',
            id: actions_1.MenuId.MergeInputResultToolbar,
            description: (0, nls_1.localize)('menus.mergeEditorResult', "The result toolbar of the merge editor"),
            proposed: 'contribMergeEditorMenus'
        },
        {
            key: 'multiDiffEditor/resource/title',
            id: actions_1.MenuId.MultiDiffEditorFileToolbar,
            description: (0, nls_1.localize)('menus.multiDiffEditorResource', "The resource toolbar in the multi diff editor"),
            proposed: 'contribMultiDiffEditorMenus'
        },
        {
            key: 'diffEditor/gutter/hunk',
            id: actions_1.MenuId.DiffEditorHunkToolbar,
            description: (0, nls_1.localize)('menus.diffEditorGutterToolBarMenus', "The gutter toolbar in the diff editor"),
            proposed: 'contribDiffEditorGutterToolBarMenus'
        },
        {
            key: 'diffEditor/gutter/selection',
            id: actions_1.MenuId.DiffEditorSelectionToolbar,
            description: (0, nls_1.localize)('menus.diffEditorGutterToolBarMenus', "The gutter toolbar in the diff editor"),
            proposed: 'contribDiffEditorGutterToolBarMenus'
        }
    ];
    var schema;
    (function (schema) {
        // --- menus, submenus contribution point
        function isMenuItem(item) {
            return typeof item.command === 'string';
        }
        schema.isMenuItem = isMenuItem;
        function isValidMenuItem(item, collector) {
            if (typeof item.command !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (item.alt && typeof item.alt !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'alt'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidMenuItem = isValidMenuItem;
        function isValidSubmenuItem(item, collector) {
            if (typeof item.submenu !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'submenu'));
                return false;
            }
            if (item.when && typeof item.when !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                return false;
            }
            if (item.group && typeof item.group !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'group'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenuItem = isValidSubmenuItem;
        function isValidItems(items, collector) {
            if (!Array.isArray(items)) {
                collector.error((0, nls_1.localize)('requirearray', "submenu items must be an array"));
                return false;
            }
            for (const item of items) {
                if (isMenuItem(item)) {
                    if (!isValidMenuItem(item, collector)) {
                        return false;
                    }
                }
                else {
                    if (!isValidSubmenuItem(item, collector)) {
                        return false;
                    }
                }
            }
            return true;
        }
        schema.isValidItems = isValidItems;
        function isValidSubmenu(submenu, collector) {
            if (typeof submenu !== 'object') {
                collector.error((0, nls_1.localize)('require', "submenu items must be an object"));
                return false;
            }
            if (typeof submenu.id !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                return false;
            }
            if (typeof submenu.label !== 'string') {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'label'));
                return false;
            }
            return true;
        }
        schema.isValidSubmenu = isValidSubmenu;
        const menuItem = {
            type: 'object',
            required: ['command'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.command', 'Identifier of the command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                alt: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.alt', 'Identifier of an alternative command to execute. The command must be declared in the \'commands\'-section'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenuItem = {
            type: 'object',
            required: ['submenu'],
            properties: {
                submenu: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.submenu', 'Identifier of the submenu to display in this item.'),
                    type: 'string'
                },
                when: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.when', 'Condition which must be true to show this item'),
                    type: 'string'
                },
                group: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.menuItem.group', 'Group into which this item belongs'),
                    type: 'string'
                }
            }
        };
        const submenu = {
            type: 'object',
            required: ['id', 'label'],
            properties: {
                id: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.id', 'Identifier of the menu to display as a submenu.'),
                    type: 'string'
                },
                label: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.label', 'The label of the menu item which leads to this submenu.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.submenu.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the submenu in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.submenu.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.menusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.menus', "Contributes menu items to the editor"),
            type: 'object',
            properties: (0, arrays_1.index)(apiMenus, menu => menu.key, menu => ({
                markdownDescription: menu.proposed ? (0, nls_1.localize)('proposed', "Proposed API, requires `enabledApiProposal: [\"{0}\"]` - {1}", menu.proposed, menu.description) : menu.description,
                type: 'array',
                items: menu.supportsSubmenus === false ? menuItem : { oneOf: [menuItem, submenuItem] }
            })),
            additionalProperties: {
                description: 'Submenu',
                type: 'array',
                items: { oneOf: [menuItem, submenuItem] }
            }
        };
        schema.submenusContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.submenus', "Contributes submenu items to the editor"),
            type: 'array',
            items: submenu
        };
        function isValidCommand(command, collector) {
            if (!command) {
                collector.error((0, nls_1.localize)('nonempty', "expected non-empty value."));
                return false;
            }
            if ((0, strings_1.isFalsyOrWhitespace)(command.command)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'command'));
                return false;
            }
            if (!isValidLocalizedString(command.title, collector, 'title')) {
                return false;
            }
            if (command.shortTitle && !isValidLocalizedString(command.shortTitle, collector, 'shortTitle')) {
                return false;
            }
            if (command.enablement && typeof command.enablement !== 'string') {
                collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'precondition'));
                return false;
            }
            if (command.category && !isValidLocalizedString(command.category, collector, 'category')) {
                return false;
            }
            if (!isValidIcon(command.icon, collector)) {
                return false;
            }
            return true;
        }
        schema.isValidCommand = isValidCommand;
        function isValidIcon(icon, collector) {
            if (typeof icon === 'undefined') {
                return true;
            }
            if (typeof icon === 'string') {
                return true;
            }
            else if (typeof icon.dark === 'string' && typeof icon.light === 'string') {
                return true;
            }
            collector.error((0, nls_1.localize)('opticon', "property `icon` can be omitted or must be either a string or a literal like `{dark, light}`"));
            return false;
        }
        function isValidLocalizedString(localized, collector, propertyName) {
            if (typeof localized === 'undefined') {
                collector.error((0, nls_1.localize)('requireStringOrObject', "property `{0}` is mandatory and must be of type `string` or `object`", propertyName));
                return false;
            }
            else if (typeof localized === 'string' && (0, strings_1.isFalsyOrWhitespace)(localized)) {
                collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", propertyName));
                return false;
            }
            else if (typeof localized !== 'string' && ((0, strings_1.isFalsyOrWhitespace)(localized.original) || (0, strings_1.isFalsyOrWhitespace)(localized.value))) {
                collector.error((0, nls_1.localize)('requirestrings', "properties `{0}` and `{1}` are mandatory and must be of type `string`", `${propertyName}.value`, `${propertyName}.original`));
                return false;
            }
            return true;
        }
        const commandType = {
            type: 'object',
            required: ['command', 'title'],
            properties: {
                command: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.command', 'Identifier of the command to execute'),
                    type: 'string'
                },
                title: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.title', 'Title by which the command is represented in the UI'),
                    type: 'string'
                },
                shortTitle: {
                    markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.commandType.shortTitle', '(Optional) Short title by which the command is represented in the UI. Menus pick either `title` or `shortTitle` depending on the context in which they show commands.'),
                    type: 'string'
                },
                category: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.category', '(Optional) Category string by which the command is grouped in the UI'),
                    type: 'string'
                },
                enablement: {
                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.precondition', '(Optional) Condition which must be true to enable the command in the UI (menu and keybindings). Does not prevent executing the command by other means, like the `executeCommand`-api.'),
                    type: 'string'
                },
                icon: {
                    description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.commandType.icon', comment: ['do not translate or change `\\$(zap)`, \\ in front of $ is important.'] }, '(Optional) Icon which is used to represent the command in the UI. Either a file path, an object with file paths for dark and light themes, or a theme icon references, like `\\$(zap)`'),
                    anyOf: [{
                            type: 'string'
                        },
                        {
                            type: 'object',
                            properties: {
                                light: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.light', 'Icon path when a light theme is used'),
                                    type: 'string'
                                },
                                dark: {
                                    description: (0, nls_1.localize)('vscode.extension.contributes.commandType.icon.dark', 'Icon path when a dark theme is used'),
                                    type: 'string'
                                }
                            }
                        }]
                }
            }
        };
        schema.commandsContribution = {
            description: (0, nls_1.localize)('vscode.extension.contributes.commands', "Contributes commands to the command palette."),
            oneOf: [
                commandType,
                {
                    type: 'array',
                    items: commandType
                }
            ]
        };
    })(schema || (schema = {}));
    const _commandRegistrations = new lifecycle_1.DisposableStore();
    exports.commandsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'commands',
        jsonSchema: schema.commandsContribution,
        activationEventsGenerator: (contribs, result) => {
            for (const contrib of contribs) {
                if (contrib.command) {
                    result.push(`onCommand:${contrib.command}`);
                }
            }
        }
    });
    exports.commandsExtensionPoint.setHandler(extensions => {
        function handleCommand(userFriendlyCommand, extension) {
            if (!schema.isValidCommand(userFriendlyCommand, extension.collector)) {
                return;
            }
            const { icon, enablement, category, title, shortTitle, command } = userFriendlyCommand;
            let absoluteIcon;
            if (icon) {
                if (typeof icon === 'string') {
                    absoluteIcon = themables_1.ThemeIcon.fromString(icon) ?? { dark: resources.joinPath(extension.description.extensionLocation, icon), light: resources.joinPath(extension.description.extensionLocation, icon) };
                }
                else {
                    absoluteIcon = {
                        dark: resources.joinPath(extension.description.extensionLocation, icon.dark),
                        light: resources.joinPath(extension.description.extensionLocation, icon.light)
                    };
                }
            }
            const existingCmd = actions_1.MenuRegistry.getCommand(command);
            if (existingCmd) {
                if (existingCmd.source) {
                    extension.collector.info((0, nls_1.localize)('dup1', "Command `{0}` already registered by {1} ({2})", userFriendlyCommand.command, existingCmd.source.title, existingCmd.source.id));
                }
                else {
                    extension.collector.info((0, nls_1.localize)('dup0', "Command `{0}` already registered", userFriendlyCommand.command));
                }
            }
            _commandRegistrations.add(actions_1.MenuRegistry.addCommand({
                id: command,
                title,
                source: { id: extension.description.identifier.value, title: extension.description.displayName ?? extension.description.name },
                shortTitle,
                tooltip: title,
                category,
                precondition: contextkey_1.ContextKeyExpr.deserialize(enablement),
                icon: absoluteIcon
            }));
        }
        // remove all previous command registrations
        _commandRegistrations.clear();
        for (const extension of extensions) {
            const { value } = extension;
            if (Array.isArray(value)) {
                for (const command of value) {
                    handleCommand(command, extension);
                }
            }
            else {
                handleCommand(value, extension);
            }
        }
    });
    const _submenus = new Map();
    const submenusExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'submenus',
        jsonSchema: schema.submenusContribution
    });
    submenusExtensionPoint.setHandler(extensions => {
        _submenus.clear();
        for (const extension of extensions) {
            const { value, collector } = extension;
            for (const [, submenuInfo] of Object.entries(value)) {
                if (!schema.isValidSubmenu(submenuInfo, collector)) {
                    continue;
                }
                if (!submenuInfo.id) {
                    collector.warn((0, nls_1.localize)('submenuId.invalid.id', "`{0}` is not a valid submenu identifier", submenuInfo.id));
                    continue;
                }
                if (_submenus.has(submenuInfo.id)) {
                    collector.info((0, nls_1.localize)('submenuId.duplicate.id', "The `{0}` submenu was already previously registered.", submenuInfo.id));
                    continue;
                }
                if (!submenuInfo.label) {
                    collector.warn((0, nls_1.localize)('submenuId.invalid.label', "`{0}` is not a valid submenu label", submenuInfo.label));
                    continue;
                }
                let absoluteIcon;
                if (submenuInfo.icon) {
                    if (typeof submenuInfo.icon === 'string') {
                        absoluteIcon = themables_1.ThemeIcon.fromString(submenuInfo.icon) || { dark: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon) };
                    }
                    else {
                        absoluteIcon = {
                            dark: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon.dark),
                            light: resources.joinPath(extension.description.extensionLocation, submenuInfo.icon.light)
                        };
                    }
                }
                const item = {
                    id: actions_1.MenuId.for(`api:${submenuInfo.id}`),
                    label: submenuInfo.label,
                    icon: absoluteIcon
                };
                _submenus.set(submenuInfo.id, item);
            }
        }
    });
    const _apiMenusByKey = new Map(apiMenus.map(menu => ([menu.key, menu])));
    const _menuRegistrations = new lifecycle_1.DisposableStore();
    const _submenuMenuItems = new Map();
    const menusExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'menus',
        jsonSchema: schema.menusContribution,
        deps: [submenusExtensionPoint]
    });
    menusExtensionPoint.setHandler(extensions => {
        // remove all previous menu registrations
        _menuRegistrations.clear();
        _submenuMenuItems.clear();
        for (const extension of extensions) {
            const { value, collector } = extension;
            for (const entry of Object.entries(value)) {
                if (!schema.isValidItems(entry[1], collector)) {
                    continue;
                }
                let menu = _apiMenusByKey.get(entry[0]);
                if (!menu) {
                    const submenu = _submenus.get(entry[0]);
                    if (submenu) {
                        menu = {
                            key: entry[0],
                            id: submenu.id,
                            description: ''
                        };
                    }
                }
                if (!menu) {
                    continue;
                }
                if (menu.proposed && !(0, extensions_1.isProposedApiEnabled)(extension.description, menu.proposed)) {
                    collector.error((0, nls_1.localize)('proposedAPI.invalid', "{0} is a proposed menu identifier. It requires 'package.json#enabledApiProposals: [\"{1}\"]' and is only available when running out of dev or with the following command line switch: --enable-proposed-api {2}", entry[0], menu.proposed, extension.description.identifier.value));
                    continue;
                }
                for (const menuItem of entry[1]) {
                    let item;
                    if (schema.isMenuItem(menuItem)) {
                        const command = actions_1.MenuRegistry.getCommand(menuItem.command);
                        const alt = menuItem.alt && actions_1.MenuRegistry.getCommand(menuItem.alt) || undefined;
                        if (!command) {
                            collector.error((0, nls_1.localize)('missing.command', "Menu item references a command `{0}` which is not defined in the 'commands' section.", menuItem.command));
                            continue;
                        }
                        if (menuItem.alt && !alt) {
                            collector.warn((0, nls_1.localize)('missing.altCommand', "Menu item references an alt-command `{0}` which is not defined in the 'commands' section.", menuItem.alt));
                        }
                        if (menuItem.command === menuItem.alt) {
                            collector.info((0, nls_1.localize)('dupe.command', "Menu item references the same command as default and alt-command"));
                        }
                        item = { command, alt, group: undefined, order: undefined, when: undefined };
                    }
                    else {
                        if (menu.supportsSubmenus === false) {
                            collector.error((0, nls_1.localize)('unsupported.submenureference', "Menu item references a submenu for a menu which doesn't have submenu support."));
                            continue;
                        }
                        const submenu = _submenus.get(menuItem.submenu);
                        if (!submenu) {
                            collector.error((0, nls_1.localize)('missing.submenu', "Menu item references a submenu `{0}` which is not defined in the 'submenus' section.", menuItem.submenu));
                            continue;
                        }
                        let submenuRegistrations = _submenuMenuItems.get(menu.id.id);
                        if (!submenuRegistrations) {
                            submenuRegistrations = new Set();
                            _submenuMenuItems.set(menu.id.id, submenuRegistrations);
                        }
                        if (submenuRegistrations.has(submenu.id.id)) {
                            collector.warn((0, nls_1.localize)('submenuItem.duplicate', "The `{0}` submenu was already contributed to the `{1}` menu.", menuItem.submenu, entry[0]));
                            continue;
                        }
                        submenuRegistrations.add(submenu.id.id);
                        item = { submenu: submenu.id, icon: submenu.icon, title: submenu.label, group: undefined, order: undefined, when: undefined };
                    }
                    if (menuItem.group) {
                        const idx = menuItem.group.lastIndexOf('@');
                        if (idx > 0) {
                            item.group = menuItem.group.substr(0, idx);
                            item.order = Number(menuItem.group.substr(idx + 1)) || undefined;
                        }
                        else {
                            item.group = menuItem.group;
                        }
                    }
                    item.when = contextkey_1.ContextKeyExpr.deserialize(menuItem.when);
                    _menuRegistrations.add(actions_1.MenuRegistry.appendMenuItem(menu.id, item));
                }
            }
        }
    });
    let CommandsTableRenderer = class CommandsTableRenderer extends lifecycle_1.Disposable {
        constructor(_keybindingService) {
            super();
            this._keybindingService = _keybindingService;
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.commands;
        }
        render(manifest) {
            const rawCommands = manifest.contributes?.commands || [];
            const commands = rawCommands.map(c => ({
                id: c.command,
                title: c.title,
                keybindings: [],
                menus: []
            }));
            const byId = (0, arrays_1.index)(commands, c => c.id);
            const menus = manifest.contributes?.menus || {};
            for (const context in menus) {
                for (const menu of menus[context]) {
                    if (menu.command) {
                        let command = byId[menu.command];
                        if (command) {
                            command.menus.push(context);
                        }
                        else {
                            command = { id: menu.command, title: '', keybindings: [], menus: [context] };
                            byId[command.id] = command;
                            commands.push(command);
                        }
                    }
                }
            }
            const rawKeybindings = manifest.contributes?.keybindings ? (Array.isArray(manifest.contributes.keybindings) ? manifest.contributes.keybindings : [manifest.contributes.keybindings]) : [];
            rawKeybindings.forEach(rawKeybinding => {
                const keybinding = this.resolveKeybinding(rawKeybinding);
                if (!keybinding) {
                    return;
                }
                let command = byId[rawKeybinding.command];
                if (command) {
                    command.keybindings.push(keybinding);
                }
                else {
                    command = { id: rawKeybinding.command, title: '', keybindings: [keybinding], menus: [] };
                    byId[command.id] = command;
                    commands.push(command);
                }
            });
            if (!commands.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('command name', "ID"),
                (0, nls_1.localize)('command title', "Title"),
                (0, nls_1.localize)('keyboard shortcuts', "Keyboard Shortcuts"),
                (0, nls_1.localize)('menuContexts', "Menu Contexts")
            ];
            const rows = commands.sort((a, b) => a.id.localeCompare(b.id))
                .map(command => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${command.id}\``),
                    typeof command.title === 'string' ? command.title : command.title.value,
                    command.keybindings,
                    new htmlContent_1.MarkdownString().appendMarkdown(`${command.menus.map(menu => `\`${menu}\``).join('&nbsp;')}`),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
        resolveKeybinding(rawKeyBinding) {
            let key;
            switch (process_1.platform) {
                case 'win32':
                    key = rawKeyBinding.win;
                    break;
                case 'linux':
                    key = rawKeyBinding.linux;
                    break;
                case 'darwin':
                    key = rawKeyBinding.mac;
                    break;
            }
            return this._keybindingService.resolveUserBinding(key ?? rawKeyBinding.key)[0];
        }
    };
    CommandsTableRenderer = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], CommandsTableRenderer);
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'commands',
        label: (0, nls_1.localize)('commands', "Commands"),
        access: {
            canToggle: false,
        },
        renderer: new descriptors_1.SyncDescriptor(CommandsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudXNFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2FjdGlvbnMvY29tbW9uL21lbnVzRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxNQUFNLFFBQVEsR0FBZTtRQUM1QjtZQUNDLEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYztZQUN6QixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUscUJBQXFCLENBQUM7WUFDcEUsZ0JBQWdCLEVBQUUsS0FBSztTQUN2QjtRQUNEO1lBQ0MsR0FBRyxFQUFFLFVBQVU7WUFDZixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxlQUFlO1lBQzFCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSw0QkFBNEIsQ0FBQztZQUNyRSxnQkFBZ0IsRUFBRSxLQUFLO1NBQ3ZCO1FBQ0Q7WUFDQyxHQUFHLEVBQUUsY0FBYztZQUNuQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO1lBQ3RCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxtQkFBbUIsRUFBRSx1QkFBdUIsQ0FBQztTQUNuRTtRQUNEO1lBQ0MsR0FBRyxFQUFFLGtCQUFrQjtZQUN2QixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxjQUFjO1lBQ3pCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxzQkFBc0IsRUFBRSwwQ0FBMEMsQ0FBQztTQUN6RjtRQUNEO1lBQ0MsR0FBRyxFQUFFLGdCQUFnQjtZQUNyQixFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxhQUFhO1lBQ3hCLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSx5QkFBeUIsQ0FBQztT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