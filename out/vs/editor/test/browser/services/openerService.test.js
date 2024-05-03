define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/utils", "vs/editor/browser/services/openerService", "vs/editor/test/browser/editorTestServices", "vs/platform/commands/common/commands", "vs/platform/commands/test/common/nullCommandService", "vs/base/common/network", "vs/platform/theme/test/common/testThemeService"], function (require, exports, assert, lifecycle_1, uri_1, utils_1, openerService_1, editorTestServices_1, commands_1, nullCommandService_1, network_1, testThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('OpenerService', function () {
        const themeService = new testThemeService_1.TestThemeService();
        const editorService = new editorTestServices_1.TestCodeEditorService(themeService);
        let lastCommand;
        const commandService = new (class {
            constructor() {
                this.onWillExecuteCommand = () => lifecycle_1.Disposable.None;
                this.onDidExecuteCommand = () => lifecycle_1.Disposable.None;
            }
            executeCommand(id, ...args) {
                lastCommand = { id, args };
                return Promise.resolve(undefined);
            }
        })();
        setup(function () {
            lastCommand = undefined;
        });
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('delegate to editorService, scheme:///fff', async function () {
            const openerService = new openerService_1.OpenerService(editorService, nullCommandService_1.NullCommandService);
            await openerService.open(uri_1.URI.parse('another:///somepath'));
            assert.strictEqual(editorService.lastInput.options.selection, undefined);
        });
        test('delegate to editorService, scheme:///fff#L123', async function () {
            const openerService = new openerService_1.OpenerService(editorService, nullCommandService_1.NullCommandService);
            await openerService.open(uri_1.URI.parse('file:///somepath#L23'));
            assert.strictEqual(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.strictEqual(editorService.lastInput.options.selection.startColumn, 1);
            assert.strictEqual(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.strictEqual(editorService.lastInput.options.selection.endColumn, undefined);
            assert.strictEqual(editorService.lastInput.resource.fragment, '');
            await openerService.open(uri_1.URI.parse('another:///somepath#L23'));
            assert.strictEqual(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.strictEqual(editorService.lastInput.options.selection.startColumn, 1);
            await openerService.open(uri_1.URI.parse('another:///somepath#L23,45'));
            assert.strictEqual(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.strictEqual(editorService.lastInput.options.selection.startColumn, 45);
            assert.strictEqual(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.strictEqual(editorService.lastInput.options.selection.endColumn, undefined);
            assert.strictEqual(editorService.lastInput.resource.fragment, '');
        });
        test('delegate to editorService, scheme:///fff#123,123', async function () {
            const openerService = new openerService_1.OpenerService(editorService, nullCommandService_1.NullCommandService);
            await openerService.open(uri_1.URI.parse('file:///somepath#23'));
            assert.strictEqual(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.strictEqual(editorService.lastInput.options.selection.startColumn, 1);
            assert.strictEqual(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.strictEqual(editorService.lastInput.options.selection.endColumn, undefined);
            assert.strictEqual(editorService.lastInput.resource.fragment, '');
            await openerService.open(uri_1.URI.parse('file:///somepath#23,45'));
            assert.strictEqual(editorService.lastInput.options.selection.startLineNumber, 23);
            assert.strictEqual(editorService.lastInput.options.selection.startColumn, 45);
            assert.strictEqual(editorService.lastInput.options.selection.endLineNumber, undefined);
            assert.strictEqual(editorService.lastInput.options.selection.endColumn, undefined);
            assert.strictEqual(editorService.lastInput.resource.fragment, '');
        });
        test('delegate to commandsService, command:someid', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            const id = `aCommand${Math.random()}`;
            store.add(commands_1.CommandsRegistry.registerCommand(id, function () { }));
            assert.strictEqual(lastCommand, undefined);
            await openerService.open(uri_1.URI.parse('command:' + id));
            assert.strictEqual(lastCommand, undefined);
        });
        test('delegate to commandsService, command:someid, 2', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            const id = `aCommand${Math.random()}`;
            store.add(commands_1.CommandsRegistry.registerCommand(id, function () { }));
            await openerService.open(uri_1.URI.parse('command:' + id).with({ query: '\"123\"' }), { allowCommands: true });
            assert.strictEqual(lastCommand.id, id);
            assert.strictEqual(lastCommand.args.length, 1);
            assert.strictEqual(lastCommand.args[0], '123');
            await openerService.open(uri_1.URI.parse('command:' + id), { allowCommands: true });
            assert.strictEqual(lastCommand.id, id);
            assert.strictEqual(lastCommand.args.length, 0);
            await openerService.open(uri_1.URI.parse('command:' + id).with({ query: '123' }), { allowCommands: true });
            assert.strictEqual(lastCommand.id, id);
            assert.strictEqual(lastCommand.args.length, 1);
            assert.strictEqual(lastCommand.args[0], 123);
            await openerService.open(uri_1.URI.parse('command:' + id).with({ query: JSON.stringify([12, true]) }), { allowCommands: true });
            assert.strictEqual(lastCommand.id, id);
            assert.strictEqual(lastCommand.args.length, 2);
            assert.strictEqual(lastCommand.args[0], 12);
            assert.strictEqual(lastCommand.args[1], true);
        });
        test('links are protected by validators', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            store.add(openerService.registerValidator({ shouldOpen: () => Promise.resolve(false) }));
            const httpResult = await openerService.open(uri_1.URI.parse('https://www.microsoft.com'));
            const httpsResult = await openerService.open(uri_1.URI.parse('https://www.microsoft.com'));
            assert.strictEqual(httpResult, false);
            assert.strictEqual(httpsResult, false);
        });
        test('links validated by validators go to openers', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            store.add(openerService.registerValidator({ shouldOpen: () => Promise.resolve(true) }));
            let openCount = 0;
            store.add(openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            }));
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.strictEqual(openCount, 1);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.strictEqual(openCount, 2);
        });
        test('links aren\'t manipulated before being passed to validator: PR #118226', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            store.add(openerService.registerValidator({
                shouldOpen: (resource) => {
                    // We don't want it to convert strings into URIs
                    assert.strictEqual(resource instanceof uri_1.URI, false);
                    return Promise.resolve(false);
                }
            }));
            await openerService.open('https://wwww.microsoft.com');
            await openerService.open('https://www.microsoft.com??params=CountryCode%3DUSA%26Name%3Dvscode"');
        });
        test('links validated by multiple validators', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            let v1 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v1++;
                    return Promise.resolve(true);
                }
            });
            let v2 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v2++;
                    return Promise.resolve(true);
                }
            });
            let openCount = 0;
            openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            });
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.strictEqual(openCount, 1);
            assert.strictEqual(v1, 1);
            assert.strictEqual(v2, 1);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.strictEqual(openCount, 2);
            assert.strictEqual(v1, 2);
            assert.strictEqual(v2, 2);
        });
        test('links invalidated by first validator do not continue validating', async function () {
            const openerService = new openerService_1.OpenerService(editorService, commandService);
            let v1 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v1++;
                    return Promise.resolve(false);
                }
            });
            let v2 = 0;
            openerService.registerValidator({
                shouldOpen: () => {
                    v2++;
                    return Promise.resolve(true);
                }
            });
            let openCount = 0;
            openerService.registerOpener({
                open: (resource) => {
                    openCount++;
                    return Promise.resolve(true);
                }
            });
            await openerService.open(uri_1.URI.parse('http://microsoft.com'));
            assert.strictEqual(openCount, 0);
            assert.strictEqual(v1, 1);
            assert.strictEqual(v2, 0);
            await openerService.open(uri_1.URI.parse('https://microsoft.com'));
            assert.strictEqual(openCount, 0);
            assert.strictEqual(v1, 2);
            assert.strictEqual(v2, 0);
        });
        test('matchesScheme', function () {
            assert.ok((0, network_1.matchesScheme)('https://microsoft.com', 'https'));
            assert.ok((0, network_1.matchesScheme)('http://microsoft.com', 'http'));
            assert.ok((0, network_1.matchesScheme)('hTTPs://microsoft.com', 'https'));
            assert.ok((0, network_1.matchesScheme)('httP://microsoft.com', 'http'));
            assert.ok((0, network_1.matchesScheme)(uri_1.URI.parse('https://microsoft.com'), 'https'));
            assert.ok((0, network_1.matchesScheme)(uri_1.URI.parse('http://microsoft.com'), 'http'));
            assert.ok((0, network_1.matchesScheme)(uri_1.URI.parse('hTTPs://microsoft.com'), 'https'));
            assert.ok((0, network_1.matchesScheme)(uri_1.URI.parse('httP://microsoft.com'), 'http'));
            assert.ok(!(0, network_1.matchesScheme)(uri_1.URI.parse('https://microsoft.com'), 'http'));
            assert.ok(!(0, network_1.matchesScheme)(uri_1.URI.parse('htt://microsoft.com'), 'http'));
            assert.ok(!(0, network_1.matchesScheme)(uri_1.URI.parse('z://microsoft.com'), 'http'));
        });
        test('matchesSomeScheme', function () {
            assert.ok((0, network_1.matchesSomeScheme)('https://microsoft.com', 'http', 'https'));
            assert.ok((0, network_1.matchesSomeScheme)('http://microsoft.com', 'http', 'https'));
            assert.ok(!(0, network_1.matchesSomeScheme)('x://microsoft.com', 'http', 'https'));
        });
        test('resolveExternalUri', async function () {
            const openerService = new openerService_1.OpenerService(editorService, nullCommandService_1.NullCommandService);
            try {
                await openerService.resolveExternalUri(uri_1.URI.parse('file:///Users/user/folder'));
                assert.fail('Should not reach here');
            }
            catch {
                // OK
            }
            const disposable = openerService.registerExternalUriResolver({
                async resolveExternalUri(uri) {
                    return { resolved: uri, dispose() { } };
                }
            });
            const result = await openerService.resolveExternalUri(uri_1.URI.parse('file:///Users/user/folder'));
            assert.deepStrictEqual(result.resolved.toString(), 'file:///Users/user/folder');
            disposable.dispose();
        });
        test('vscode.open command can\'t open HTTP URL with hash (#) in it [extension development] #140907', async function () {
            const openerService = new openerService_1.OpenerService(editorService, nullCommandService_1.NullCommandService);
            const actual = [];
            openerService.setDefaultExternalOpener({
                async openExternal(href) {
                    actual.push(href);
                    return true;
                }
            });
            const href = 'https://gitlab.com/viktomas/test-project/merge_requests/new?merge_request%5Bsource_branch%5D=test-%23-hash';
            const uri = uri_1.URI.parse(href);
            assert.ok(await openerService.open(uri));
            assert.ok(await openerService.open(href));
            assert.deepStrictEqual(actual, [
                encodeURI(uri.toString(true)), // BAD, the encoded # (%23) is double encoded to %2523 (% is double encoded)
                href // good
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbmVyU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3NlcnZpY2VzL29wZW5lclNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFnQkEsS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN0QixNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFnQixFQUFFLENBQUM7UUFDNUMsTUFBTSxhQUFhLEdBQUcsSUFBSSwwQ0FBcUIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUU5RCxJQUFJLFdBQW9ELENBQUM7UUFFekQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQUE7Z0JBRTNCLHlCQUFvQixHQUFHLEdBQUcsRUFBRSxDQUFDLHNCQUFVLENBQUMsSUFBSSxDQUFDO2dCQUM3Qyx3QkFBbUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUs3QyxDQUFDO1lBSkEsY0FBYyxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQVc7Z0JBQ3hDLFdBQVcsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25DLENBQUM7U0FDRCxDQUFDLEVBQUUsQ0FBQztRQUVMLEtBQUssQ0FBQztZQUNMLFdBQVcsR0FBRyxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEtBQUs7WUFDckQsTUFBTSxhQUFhLEdBQUcsSUFBSSw2QkFBYSxDQUFDLGFBQWEsRUFBRSx1Q0FBa0IsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sYUFBYSxDQUFDLElBQUksQ0FB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QUUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWhELE1BQU0sYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWhELE1BQU0sYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUU5QyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVB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