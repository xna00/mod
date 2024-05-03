/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, extpath_1, path_1, resources_1, uri_1, language_1, nls, actions_1, files_1, label_1, opener_1, quickInput_1, workspace_1, abstractSnippetsActions_1, snippets_1, textfiles_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureSnippetsAction = void 0;
    var ISnippetPick;
    (function (ISnippetPick) {
        function is(thing) {
            return !!thing && uri_1.URI.isUri(thing.filepath);
        }
        ISnippetPick.is = is;
    })(ISnippetPick || (ISnippetPick = {}));
    async function computePicks(snippetService, userDataProfileService, languageService, labelService) {
        const existing = [];
        const future = [];
        const seen = new Set();
        const added = new Map();
        for (const file of await snippetService.getSnippetFiles()) {
            if (file.source === 3 /* SnippetSource.Extension */) {
                // skip extension snippets
                continue;
            }
            if (file.isGlobalSnippets) {
                await file.load();
                // list scopes for global snippets
                const names = new Set();
                let source;
                outer: for (const snippet of file.data) {
                    if (!source) {
                        source = snippet.source;
                    }
                    for (const scope of snippet.scopes) {
                        const name = languageService.getLanguageName(scope);
                        if (name) {
                            if (names.size >= 4) {
                                names.add(`${name}...`);
                                break outer;
                            }
                            else {
                                names.add(name);
                            }
                        }
                    }
                }
                const snippet = {
                    label: (0, resources_1.basename)(file.location),
                    filepath: file.location,
                    description: names.size === 0
                        ? nls.localize('global.scope', "(global)")
                        : nls.localize('global.1', "({0})", [...names].join(', '))
                };
                existing.push(snippet);
                if (!source) {
                    continue;
                }
                const detail = nls.localize('detail.label', "({0}) {1}", source, labelService.getUriLabel(file.location, { relative: true }));
                const lastItem = added.get((0, resources_1.basename)(file.location));
                if (lastItem) {
                    snippet.detail = detail;
                    lastItem.snippet.detail = lastItem.detail;
                }
                added.set((0, resources_1.basename)(file.location), { snippet, detail });
            }
            else {
                // language snippet
                const mode = (0, resources_1.basename)(file.location).replace(/\.json$/, '');
                existing.push({
                    label: (0, resources_1.basename)(file.location),
                    description: `(${languageService.getLanguageName(mode)})`,
                    filepath: file.location
                });
                seen.add(mode);
            }
        }
        const dir = userDataProfileService.currentProfile.snippetsHome;
        for (const languageId of languageService.getRegisteredLanguageIds()) {
            const label = languageService.getLanguageName(languageId);
            if (label && !seen.has(languageId)) {
                future.push({
                    label: languageId,
                    description: `(${label})`,
                    filepath: (0, resources_1.joinPath)(dir, `${languageId}.json`),
                    hint: true
                });
            }
        }
        existing.sort((a, b) => {
            const a_ext = (0, path_1.extname)(a.filepath.path);
            const b_ext = (0, path_1.extname)(b.filepath.path);
            if (a_ext === b_ext) {
                return a.label.localeCompare(b.label);
            }
            else if (a_ext === '.code-snippets') {
                return -1;
            }
            else {
                return 1;
            }
        });
        future.sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        return { existing, future };
    }
    async function createSnippetFile(scope, defaultPath, quickInputService, fileService, textFileService, opener) {
        function createSnippetUri(input) {
            const filename = (0, path_1.extname)(input) !== '.code-snippets'
                ? `${input}.code-snippets`
                : input;
            return (0, resources_1.joinPath)(defaultPath, filename);
        }
        await fileService.createFolder(defaultPath);
        const input = await quickInputService.input({
            placeHolder: nls.localize('name', "Type snippet file name"),
            async validateInput(input) {
                if (!input) {
                    return nls.localize('bad_name1', "Invalid file name");
                }
                if (!(0, extpath_1.isValidBasename)(input)) {
                    return nls.localize('bad_name2', "'{0}' is not a valid file name", input);
                }
                if (await fileService.exists(createSnippetUri(input))) {
                    return nls.localize('bad_name3', "'{0}' already exists", input);
                }
                return undefined;
            }
        });
        if (!input) {
            return undefined;
        }
        const resource = createSnippetUri(input);
        await textFileService.write(resource, [
            '{',
            '\t// Place your ' + scope + ' snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and ',
            '\t// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope ',
            '\t// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is ',
            '\t// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: ',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. ',
            '\t// Placeholders with the same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"scope": "javascript,typescript",',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n'));
        await opener.open(resource);
        return undefined;
    }
    async function createLanguageSnippetFile(pick, fileService, textFileService) {
        if (await fileService.exists(pick.filepath)) {
            return;
        }
        const contents = [
            '{',
            '\t// Place your snippets for ' + pick.label + ' here. Each snippet is defined under a snippet name and has a prefix, body and ',
            '\t// description. The prefix is what is used to trigger the snippet and the body will be expanded and inserted. Possible variables are:',
            '\t// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. Placeholders with the ',
            '\t// same ids are connected.',
            '\t// Example:',
            '\t// "Print to console": {',
            '\t// \t"prefix": "log",',
            '\t// \t"body": [',
            '\t// \t\t"console.log(\'$1\');",',
            '\t// \t\t"$2"',
            '\t// \t],',
            '\t// \t"description": "Log output to console"',
            '\t// }',
            '}'
        ].join('\n');
        await textFileService.write(pick.filepath, contents);
    }
    class ConfigureSnippetsAction extends abstractSnippetsActions_1.SnippetsAction {
        constructor() {
            super({
                id: 'workbench.action.openSnippets',
                title: nls.localize2('openSnippet.label', "Configure User Snippets"),
                shortTitle: {
                    ...nls.localize2('userSnippets', "User Snippets"),
                    mnemonicTitle: nls.localize({ key: 'miOpenSnippets', comment: ['&& denotes a mnemonic'] }, "User &&Snippets"),
                },
                f1: true,
                menu: [
                    { id: actions_1.MenuId.MenubarPreferencesMenu, group: '2_configuration', order: 5 },
                    { id: actions_1.MenuId.GlobalActivity, group: '2_configuration', order: 5 },
                ]
            });
        }
        async run(accessor) {
            const snippetService = accessor.get(snippets_1.ISnippetsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const opener = accessor.get(opener_1.IOpenerService);
            const languageService = accessor.get(language_1.ILanguageService);
            const userDataProfileService = accessor.get(userDataProfile_1.IUserDataProfileService);
            const workspaceService = accessor.get(workspace_1.IWorkspaceContextService);
            const fileService = accessor.get(files_1.IFileService);
            const textFileService = accessor.get(textfiles_1.ITextFileService);
            const labelService = accessor.get(label_1.ILabelService);
            const picks = await computePicks(snippetService, userDataProfileService, languageService, labelService);
            const existing = picks.existing;
            const globalSnippetPicks = [{
                    scope: nls.localize('new.global_scope', 'global'),
                    label: nls.localize('new.global', "New Global Snippets file..."),
                    uri: userDataProfileService.currentProfile.snippetsHome
                }];
            const workspaceSnippetPicks = [];
            for (const folder of workspaceService.getWorkspace().folders) {
                workspaceSnippetPicks.push({
                    scope: nls.localize('new.workspace_scope', "{0} workspace", folder.name),
                    label: nls.localize('new.folder', "New Snippets file for '{0}'...", folder.name),
                    uri: folder.toResource('.vscode')
                });
            }
            if (existing.length > 0) {
                existing.unshift({ type: 'separator', label: nls.localize('group.global', "Existing Snippets") });
                existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
            }
            else {
                existing.push({ type: 'separator', label: nls.localize('new.global.sep', "New Snippets") });
            }
            const pick = await quickInputService.pick([].concat(existing, globalSnippetPicks, workspaceSnippetPicks, picks.future), {
                placeHolder: nls.localize('openSnippet.pickLanguage', "Select Snippets File or Create Snippets"),
                matchOnDescription: true
            });
            if (globalSnippetPicks.indexOf(pick) >= 0) {
                return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
            }
            else if (workspaceSnippetPicks.indexOf(pick) >= 0) {
                return createSnippetFile(pick.scope, pick.uri, quickInputService, fileService, textFileService, opener);
            }
            else if (ISnippetPick.is(pick)) {
                if (pick.hint) {
                    await createLanguageSnippetFile(pick, fileService, textFileService);
                }
                return opener.open(pick.filepath);
            }
        }
    }
    exports.ConfigureSnippetsAction = ConfigureSnippetsAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJlU25pcHBldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvY29tbWFuZHMvY29uZmlndXJlU25pcHBldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxJQUFVLFlBQVksQ0FJckI7SUFKRCxXQUFVLFlBQVk7UUFDckIsU0FBZ0IsRUFBRSxDQUFDLEtBQXlCO1lBQzNDLE9BQU8sQ0FBQyxDQUFDLEtBQUssSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFnQixLQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUZlLGVBQUUsS0FFakIsQ0FBQTtJQUNGLENBQUMsRUFKUyxZQUFZLEtBQVosWUFBWSxRQUlyQjtJQU9ELEtBQUssVUFBVSxZQUFZLENBQUMsY0FBZ0MsRUFBRSxzQkFBK0MsRUFBRSxlQUFpQyxFQUFFLFlBQTJCO1FBRTVLLE1BQU0sUUFBUSxHQUFtQixFQUFFLENBQUM7UUFDcEMsTUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQztRQUVsQyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBQy9CLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFxRCxDQUFDO1FBRTNFLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxjQUFjLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQztZQUUzRCxJQUFJLElBQUksQ0FBQyxNQUFNLG9DQUE0QixFQUFFLENBQUM7Z0JBQzdDLDBCQUEwQjtnQkFDMUIsU0FBUztZQUNWLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUUzQixNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFbEIsa0NBQWtDO2dCQUNsQyxNQUFN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