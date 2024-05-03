/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/api/common/extHostWebview", "vs/workbench/api/common/extHostWebviewPanels", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/contrib/webview/common/webview"], function (require, exports, assert, lifecycle_1, network_1, uri_1, mock_1, utils_1, log_1, extHostApiDeprecationService_1, extHostWebview_1, extHostWebviewPanels_1, testRPCProtocol_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostWebview', () => {
        let disposables;
        let rpcProtocol;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const shape = createNoopMainThreadWebviews();
            rpcProtocol = (0, testRPCProtocol_1.SingleProxyRPCProtocol)(shape);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createWebview(rpcProtocol, remoteAuthority) {
            const extHostWebviews = disposables.add(new extHostWebview_1.ExtHostWebviews(rpcProtocol, {
                authority: remoteAuthority,
                isRemote: !!remoteAuthority,
            }, undefined, new log_1.NullLogService(), extHostApiDeprecationService_1.NullApiDeprecationService));
            const extHostWebviewPanels = disposables.add(new extHostWebviewPanels_1.ExtHostWebviewPanels(rpcProtocol, extHostWebviews, undefined));
            return disposables.add(extHostWebviewPanels.createWebviewPanel({
                extensionLocation: uri_1.URI.from({
                    scheme: remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file,
                    authority: remoteAuthority,
                    path: '/ext/path',
                })
            }, 'type', 'title', 1, {}));
        }
        test('Cannot register multiple serializers for the same view type', async () => {
            const viewType = 'view.type';
            const extHostWebviews = disposables.add(new extHostWebview_1.ExtHostWebviews(rpcProtocol, { authority: undefined, isRemote: false }, undefined, new log_1.NullLogService(), extHostApiDeprecationService_1.NullApiDeprecationService));
            const extHostWebviewPanels = disposables.add(new extHostWebviewPanels_1.ExtHostWebviewPanels(rpcProtocol, extHostWebviews, undefined));
            let lastInvokedDeserializer = undefined;
            class NoopSerializer {
                async deserializeWebviewPanel(webview, _state) {
                    lastInvokedDeserializer = this;
                    disposables.add(webview);
                }
            }
            const extension = {};
            const serializerA = new NoopSerializer();
            const serializerB = new NoopSerializer();
            const serializerARegistration = extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializerA);
            await extHostWebviewPanels.$deserializeWebviewPanel('x', viewType, {
                title: 'title',
                state: {},
                panelOptions: {},
                webviewOptions: {},
                active: true,
            }, 0);
            assert.strictEqual(lastInvokedDeserializer, serializerA);
            assert.throws(() => disposables.add(extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializerB)), 'Should throw when registering two serializers for the same view');
            serializerARegistration.dispose();
            disposables.add(extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializerB));
            await extHostWebviewPanels.$deserializeWebviewPanel('x', viewType, {
                title: 'title',
                state: {},
                panelOptions: {},
                webviewOptions: {},
                active: true,
            }, 0);
            assert.strictEqual(lastInvokedDeserializer, serializerB);
        });
        test('asWebviewUri for local file paths', () => {
            const webview = createWebview(rpcProtocol, /* remoteAuthority */ undefined);
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html')).toString()), `https://file%2B.vscode-resource.${webview_1.webviewResourceBaseHost}/Users/codey/file.html`, 'Unix basic');
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html#frag')).toString()), `https://file%2B.vscode-resource.${webview_1.webviewResourceBaseHost}/Users/codey/file.html#frag`, 'Unix should preserve fragment');
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/f%20ile.html')).toString()), `https://file%2B.vscode-resource.${webview_1.webviewResourceBaseHost}/Users/codey/f%20ile.html`, 'Unix with encoding');
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file://localhost/Users/codey/file.html')).toString()), `https://file%2Blocalhost.vscode-resource.${webview_1.webviewResourceBaseHost}/Users/codey/file.html`, 'Unix should preserve authority');
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file:///c:/codey/file.txt')).toString()), `https://file%2B.vscode-resource.${webview_1.webviewResourceBaseHost}/c%3A/codey/file.txt`, 'Windows C drive');
        });
        test('asWebviewUri for remote file paths', () => {
            const webview = createWebview(rpcProtocol, /* remoteAuthority */ 'remote');
            assert.strictEqual((webview.webview.asWebviewUri(uri_1.URI.parse('file:///Users/codey/file.html')).toString()), `https://vscode-remote%2Bremote.vscode-resource.${webview_1.webviewResourceBaseHost}/Users/codey/file.html`, 'Unix basic');
        });
        test('asWebviewUri for remote with / and + in name', () => {
            const webview = createWebview(rpcProtocol, /* remoteAuthority */ 'remote');
            const authority = 'ssh-remote+localhost=foo/bar';
            const sourceUri = uri_1.URI.from({
                scheme: 'vscode-remote',
                authority: authority,
                path: '/Users/cody/x.png'
            });
            const webviewUri = webview.webview.asWebviewUri(sourceUri);
            assert.strictEqual(webviewUri.toString(), `https://vscode-remote%2Bssh-002dremote-002blocalhost-003dfoo-002fbar.vscode-resource.vscode-cdn.net/Users/cody/x.png`, 'Check transform');
            assert.strictEqual((0, webview_1.decodeAuthority)(webviewUri.authority), `vscode-remote+${authority}.vscode-resource.vscode-cdn.net`, 'Check decoded authority');
        });
        test('asWebviewUri for remote with port in name', () => {
            const webview = createWebview(rpcProtocol, /* remoteAuthority */ 'remote');
            const authority = 'localhost:8080';
            const sourceUri = uri_1.URI.from({
                scheme: 'vscode-remote',
                authority: authority,
                path: '/Users/cody/x.png'
            });
            const webviewUri = webview.webview.asWebviewUri(sourceUri);
            assert.strictEqual(webviewUri.toString(), `https://vscode-remote%2Blocalhost-003a8080.vscode-resource.vscode-cdn.net/Users/cody/x.png`, 'Check transform');
            assert.strictEqual((0, webview_1.decodeAuthority)(webviewUri.authority), `vscode-remote+${authority}.vscode-resource.vscode-cdn.net`, 'Check decoded authority');
        });
    });
    function createNoopMainThreadWebviews() {
        return new class extends (0, mock_1.mock)() {
            $disposeWebview() { }
            $createWebviewPanel() { }
            $registerSerializer() { }
            $unregisterSerializer() { }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXcudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS90ZXN0L2Jyb3dzZXIvZXh0SG9zdFdlYnZpZXcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM1QixJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxXQUErRCxDQUFDO1FBRXBFLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFcEMsTUFBTSxLQUFLLEdBQUcsNEJBQTRCLEVBQUUsQ0FBQztZQUM3QyxXQUFXLEdBQUcsSUFBQSx3Q0FBc0IsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxhQUFhLENBQUMsV0FBK0QsRUFBRSxlQUFtQztZQUMxSCxNQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksZ0NBQWUsQ0FBQyxXQUFZLEVBQUU7Z0JBQ3pFLFNBQVMsRUFBRSxlQUFlO2dCQUMxQixRQUFRLEVBQUUsQ0FBQyxDQUFDLGVBQWU7YUFDM0IsRUFBRSxTQUFTLEVBQUUsSUFBSSxvQkFBYyxFQUFFLEVBQUUsd0RBQXlCLENBQUMsQ0FBQyxDQUFDO1lBRWhFLE1BQU0sb0JBQW9CLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJDQUFvQixDQUFDLFdBQVksRUFBRSxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUVqSCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLENBQUM7Z0JBQzlELGlCQUFpQixFQUFFLFNBQUcsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLGlCQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxpQkFBTyxDQUFDLElBQUk7b0JBQzdELFNBQVMsRUFBRSxlQUFlO29CQUMxQixJQUFJLEVBQUUsV0FBVztpQkFDakIsQ0FBQzthQUN1QixFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELElBQUksQ0FBQyw2REFBNkQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM5RSxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUM7WUFFN0IsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGdDQUFlLENBQUMsV0FBWSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksb0JBQWMsRUFBRSxFQUFFLHdEQUF5QixDQUFDLENBQUMsQ0FBQztZQUVsTCxNQUFNLG9CQUFvQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQ0FBb0IsQ0FBQyxXQUFZLEVBQUUsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFakgsSUFBSSx1QkFBdUIsR0FBOEMsU0FBUyxDQUFDO1lBRW5GLE1BQU0sY0FBYztnQkFDbkIsS0FBSyxDQUFDLHVCQUF1QixDQUFDLE9BQTRCLEVBQUUsTUFBVztvQkFDdEUsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO29CQUMvQixXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2FBQ0Q7WUFFRCxNQUFNLFNBQVMsR0FBRyxFQUEyQixDQUFDO1lBRTlDLE1BQU0sV0FBVyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFDekMsTUFBTSxXQUFXLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUV6QyxNQUFNLHVCQUF1QixHQUFHLG9CQUFvQixDQUFDLDhCQUE4QixDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFdEgsTUFBTSxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFO2dCQUNsRSxLQUFLLEVBQUUsT0FBTztnQkFDZCxLQUFLLEVBQUUsRUFBRTtnQkFDVCxZQUFZLEVBQUUsRUFBRTtnQkFDaEIsY0FBYyxFQUFFLEVBQUU7Z0JBQ2xCLE1BQU0sRUFBRSxJQUFJO2FBQ1osRUFBRSxDQUFzQixDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV6RCxNQUFNLENBQUMsTUFBTSxDQUNaLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsOEJBQThCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxFQUM1RyxpRUFBaUUsQ0FBQyxDQUFDO1lBRXBFLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWxDLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsOEJBQThCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1lBRXZHLE1BQU0sb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRTtnQkFDbEUsS0FBSyxFQUFFLE9BQU87Z0JBQ2QsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLGNBQWMsRUFBRSxFQUFFO2dCQUNsQixNQUFNLEVBQUUsSUFBSTthQUNaLEVBQUUsQ0FBc0IsQ0FBQyxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUscUJBQXFCLENBQUEsU0FBUyxDQUFDLENBQUM7WUFFM0UsTUFBTSxDQUFDLFdBQVcsQ0FDakIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUNyRixtQ0FBbUMsaUNBQXVCLHdCQUF3QixFQUNsRixZQUFZLENBQ1osQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDMUYsbUNBQW1DLGlDQUF1Qiw2QkFBNkIsRUFDdkYsK0JBQStCLENBQy9CLENBQUM7WUFFRixNQUFNLENBQUMsV0FBVyxDQUNqQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQ3hGLG1DQUFtQyxpQ0FBdUIsMkJBQTJCLEVBQ3JGLG9CQUFvQixDQUNwQixDQUFDO1lBRUYsTUFBTSxDQUFDLFdBQVcsQ0FDakIsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUM5Riw0Q0FBNEMsaUNBQXVCLHdCQUF3QixFQUMzRixnQ0FBZ0MsQ0FDaEMsQ0FBQztZQUVGLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsU0FBRyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDakYsbUNBQW1DLGlDQUF1QixzQkFBc0IsRUFDaEYsaUJBQWlCLENBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7WUFDL0MsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLFdBQVcsRUFBRSxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUUzRSxNQUFNLENBQUMsV0FBVyxDQUNqQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQ3JGLGtEQUFrRCxpQ0FBdUIsd0JBQXdCLEVBQ2pHLFlBQVksQ0FDWixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0UsTUFBTSxTQUFTLEdBQUcsOEJBQThCLENBQUM7WUFFakQsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztnQkFDMUIsTUFBTSxFQUFFLGVBQWU7Z0JBQ3ZCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixJQUFJLEVBQUUsbUJBQW1CO2FBQ3pCLENBQUMsQ0FBQztZQUVILE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQ2pCLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFDckIsc0hBQXNILEVBQ3RILGlCQUFpQixDQUFDLENBQUM7WUFFcEIsTUFBTSxDQUFDLFdBQVcsQ0FDakIsSUFBQSx5QkFBZSxFQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFDckMsaUJBQWlCLFNBQVMsaUNBQWlDLEVBQzNELHlCQUF5QixDQUN6QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO1lBQ3RELE1BQU0sT0FBTyxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0UsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUM7WUFFbkMsTUFBTSxTQUFTLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztnQkFDMUIsTUFBTSxFQUFFLGVBQWU7Z0JBQ3ZCLFNBQVMsRUFBRSxTQUFTO2dCQUNwQixJQUFJLEVBQUUsbUJBQW1CO2FBQ3pCLENBQUMsQ0FBQztZQUVILE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQ2pCLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFDckIsNEZBQTRGLEVBQzVGLGlCQUFpQixDQUFDLENBQUM7WUFFcEIsTUFBTSxDQUFDLFdBQVcsQ0FDakIsSUFBQSx5QkFBZSxFQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFDckMsaUJBQWlCLFNBQVMsaUNBQWlDLEVBQzNELHlCQUF5QixDQUN6QixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUdILFNBQVMsNEJBQTRCO1FBQ3BDLE9BQU8sSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTRCO1lBQ3hELGVBQWUsS0FBZ0IsQ0FBQztZQUNoQyxtQkFBbUIsS0FBZ0IsQ0FBQztZQUNwQyxtQkFBbUIsS0FBZ0IsQ0FBQztZQUNwQyxxQkFBcUIsS0FBZ0IsQ0FBQztTQUN0QyxDQUFDO0lBQ0gsQ0FBQyJ9