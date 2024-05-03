define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/electron-sandbox/window", "vs/platform/tunnel/common/tunnel", "vs/base/common/uri", "vs/workbench/test/electron-sandbox/workbenchTestServices", "vs/base/common/lifecycle"], function (require, exports, assert, utils_1, window_1, tunnel_1, uri_1, workbenchTestServices_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TunnelMock {
        constructor() {
            this.assignedPorts = {};
            this.expectedDispose = false;
        }
        reset(ports) {
            this.assignedPorts = ports;
        }
        expectDispose() {
            this.expectedDispose = true;
        }
        getExistingTunnel() {
            return Promise.resolve(undefined);
        }
        openTunnel(_addressProvider, _host, port) {
            if (!this.assignedPorts[port]) {
                return Promise.reject(new Error('Unexpected tunnel request'));
            }
            const res = {
                localAddress: `localhost:${this.assignedPorts[port]}`,
                tunnelRemoteHost: '4.3.2.1',
                tunnelRemotePort: this.assignedPorts[port],
                privacy: '',
                dispose: () => {
                    assert(this.expectedDispose, 'Unexpected dispose');
                    this.expectedDispose = false;
                    return Promise.resolve();
                }
            };
            delete this.assignedPorts[port];
            return Promise.resolve(res);
        }
        validate() {
            try {
                assert(Object.keys(this.assignedPorts).length === 0, 'Expected tunnel to be used');
                assert(!this.expectedDispose, 'Expected dispose to be called');
            }
            finally {
                this.expectedDispose = false;
            }
        }
    }
    class TestNativeWindow extends window_1.NativeWindow {
        create() { }
        registerListeners() { }
        enableMultiWindowAwareTimeout() { }
    }
    suite.skip('NativeWindow:resolveExternal', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const tunnelMock = new TunnelMock();
        let window;
        setup(() => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(tunnel_1.ITunnelService, tunnelMock);
            window = disposables.add(instantiationService.createInstance(TestNativeWindow));
        });
        teardown(() => {
            disposables.clear();
        });
        async function doTest(uri, ports = {}, expectedUri) {
            tunnelMock.reset(ports);
            const res = await window.resolveExternalUri(uri_1.URI.parse(uri), {
                allowTunneling: true,
                openExternal: true
            });
            assert.strictEqual(!expectedUri, !res, `Expected URI ${expectedUri} but got ${res}`);
            if (expectedUri && res) {
                assert.strictEqual(res.resolved.toString(), uri_1.URI.parse(expectedUri).toString());
            }
            tunnelMock.validate();
        }
        test('invalid', async () => {
            await doTest('file:///foo.bar/baz');
            await doTest('http://foo.bar/path');
        });
        test('simple', async () => {
            await doTest('http://localhost:1234/path', { 1234: 1234 }, 'http://localhost:1234/path');
        });
        test('all interfaces', async () => {
            await doTest('http://0.0.0.0:1234/path', { 1234: 1234 }, 'http://localhost:1234/path');
        });
        test('changed port', async () => {
            await doTest('http://localhost:1234/path', { 1234: 1235 }, 'http://localhost:1235/path');
        });
        test('query', async () => {
            await doTest('http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 4455: 4455 }, 'http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        test('query with different port', async () => {
            tunnelMock.expectDispose();
            await doTest('http://foo.bar/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 4455: 4567 });
        });
        test('both url and query', async () => {
            await doTest('http://localhost:1234/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 1234: 4321, 4455: 4455 }, 'http://localhost:4321/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        test('both url and query, query rejected', async () => {
            tunnelMock.expectDispose();
            await doTest('http://localhost:1234/path?a=b&c=http%3a%2f%2flocalhost%3a4455', { 1234: 4321, 4455: 5544 }, 'http://localhost:4321/path?a=b&c=http%3a%2f%2flocalhost%3a4455');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzb2x2ZUV4dGVybmFsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2VsZWN0cm9uLXNhbmRib3gvcmVzb2x2ZUV4dGVybmFsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBZ0JBLE1BQU0sVUFBVTtRQUFoQjtZQUNTLGtCQUFhLEdBQVksRUFBRSxDQUFDO1lBQzVCLG9CQUFlLEdBQUcsS0FBSyxDQUFDO1FBeUNqQyxDQUFDO1FBdkNBLEtBQUssQ0FBQyxLQUFjO1lBQ25CLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO1FBQzVCLENBQUM7UUFFRCxhQUFhO1lBQ1osSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDN0IsQ0FBQztRQUVELGlCQUFpQjtZQUNoQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELFVBQVUsQ0FBQyxnQkFBOEMsRUFBRSxLQUF5QixFQUFFLElBQVk7WUFDakcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQWlCO2dCQUN6QixZQUFZLEVBQUUsYUFBYSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNyRCxnQkFBZ0IsRUFBRSxTQUFTO2dCQUMzQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztnQkFDMUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFDYixNQUFNLENBQUMsSUFBSSxDQUFD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