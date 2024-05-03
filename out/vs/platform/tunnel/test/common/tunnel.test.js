define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/tunnel/common/tunnel", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, tunnel_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Tunnel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function portMappingDoTest(uri, func, expectedAddress, expectedPort) {
            const res = func(uri_1.URI.parse(uri));
            assert.strictEqual(!expectedAddress, !res);
            assert.strictEqual(res?.address, expectedAddress);
            assert.strictEqual(res?.port, expectedPort);
        }
        function portMappingTest(uri, expectedAddress, expectedPort) {
            portMappingDoTest(uri, tunnel_1.extractLocalHostUriMetaDataForPortMapping, expectedAddress, expectedPort);
        }
        function portMappingTestQuery(uri, expectedAddress, expectedPort) {
            portMappingDoTest(uri, tunnel_1.extractQueryLocalHostUriMetaDataForPortMapping, expectedAddress, expectedPort);
        }
        test('portMapping', () => {
            portMappingTest('file:///foo.bar/baz');
            portMappingTest('http://foo.bar:1234');
            portMappingTest('http://localhost:8080', 'localhost', 8080);
            portMappingTest('https://localhost:443', 'localhost', 443);
            portMappingTest('http://127.0.0.1:3456', '127.0.0.1', 3456);
            portMappingTest('http://0.0.0.0:7654', '0.0.0.0', 7654);
            portMappingTest('http://localhost:8080/path?foo=bar', 'localhost', 8080);
            portMappingTest('http://localhost:8080/path?foo=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8080);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8081);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Flocalhost%3A8081&url2=http%3A%2F%2Flocalhost%3A8082', 'localhost', 8081);
            portMappingTestQuery('http://foo.bar/path?url=http%3A%2F%2Fmicrosoft.com%2Fbad&url2=http%3A%2F%2Flocalhost%3A8081', 'localhost', 8081);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3R1bm5lbC90ZXN0L2NvbW1vbi90dW5uZWwudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7SUFhQSxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtRQUNwQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxpQkFBaUIsQ0FBQyxHQUFXLEVBQ3JDLElBQWlFLEVBQ2pFLGVBQXdCLEVBQ3hCLFlBQXFCO1lBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELFNBQVMsZUFBZSxDQUFDLEdBQVcsRUFBRSxlQUF3QixFQUFFLFlBQXFCO1lBQ3BGLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxrREFBeUMsRUFBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDbEcsQ0FBQztRQUVELFNBQVMsb0JBQW9CLENBQUMsR0FBVyxFQUFFLGVBQXdCLEVBQUUsWUFBcUI7WUFDekYsaUJBQWlCLENBQUMsR0FBRyxFQUFFLHVEQUE4QyxFQUFFLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2RyxDQUFDO1FBRUQsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDeEIsZUFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDdkMsZUFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDdkMsZUFBZSxDQUFDLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RCxlQUFlLENBQUMsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzNELGVBQWUsQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUQsZUFBZSxDQUFDLHFCQUFxQixFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN4RCxlQUFlLENBQUMsb0NBQW9DLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLGVBQWUsQ0FBQyw4REFBOEQsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbkcsb0JBQW9CLENBQUMsdURBQXVELEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pHLG9CQUFvQixDQUFDLDBGQUEwRixFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwSSxvQkFBb0IsQ0FBQyw2RkFBNkYsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEksQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9