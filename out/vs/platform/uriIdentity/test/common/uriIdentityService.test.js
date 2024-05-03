/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/uriIdentity/common/uriIdentityService", "vs/base/test/common/mock", "vs/base/common/uri", "vs/base/common/event", "vs/base/test/common/utils"], function (require, exports, assert, uriIdentityService_1, mock_1, uri_1, event_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI Identity', function () {
        class FakeFileService extends (0, mock_1.mock)() {
            constructor(data) {
                super();
                this.data = data;
                this.onDidChangeFileSystemProviderCapabilities = event_1.Event.None;
                this.onDidChangeFileSystemProviderRegistrations = event_1.Event.None;
            }
            hasProvider(uri) {
                return this.data.has(uri.scheme);
            }
            hasCapability(uri, flag) {
                const mask = this.data.get(uri.scheme) ?? 0;
                return Boolean(mask & flag);
            }
        }
        let _service;
        setup(function () {
            _service = new uriIdentityService_1.UriIdentityService(new FakeFileService(new Map([
                ['bar', 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */],
                ['foo', 0 /* FileSystemProviderCapabilities.None */]
            ])));
        });
        teardown(function () {
            _service.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertCanonical(input, expected, service = _service) {
            const actual = service.asCanonicalUri(input);
            assert.strictEqual(actual.toString(), expected.toString());
            assert.ok(service.extUri.isEqual(actual, expected));
        }
        test('extUri (isEqual)', function () {
            const a = uri_1.URI.parse('foo://bar/bang');
            const a1 = uri_1.URI.parse('foo://bar/BANG');
            const b = uri_1.URI.parse('bar://bar/bang');
            const b1 = uri_1.URI.parse('bar://bar/BANG');
            assert.strictEqual(_service.extUri.isEqual(a, a1), true);
            assert.strictEqual(_service.extUri.isEqual(a1, a), true);
            assert.strictEqual(_service.extUri.isEqual(b, b1), false);
            assert.strictEqual(_service.extUri.isEqual(b1, b), false);
        });
        test('asCanonicalUri (casing)', function () {
            const a = uri_1.URI.parse('foo://bar/bang');
            const a1 = uri_1.URI.parse('foo://bar/BANG');
            const b = uri_1.URI.parse('bar://bar/bang');
            const b1 = uri_1.URI.parse('bar://bar/BANG');
            assertCanonical(a, a);
            assertCanonical(a1, a);
            assertCanonical(b, b);
            assertCanonical(b1, b1); // case sensitive
        });
        test('asCanonicalUri (normalization)', function () {
            const a = uri_1.URI.parse('foo://bar/bang');
            assertCanonical(a, a);
            assertCanonical(uri_1.URI.parse('foo://bar/./bang'), a);
            assertCanonical(uri_1.URI.parse('foo://bar/./bang'), a);
            assertCanonical(uri_1.URI.parse('foo://bar/./foo/../bang'), a);
        });
        test('asCanonicalUri (keep fragement)', function () {
            const a = uri_1.URI.parse('foo://bar/bang');
            assertCanonical(a, a);
            assertCanonical(uri_1.URI.parse('foo://bar/./bang#frag'), a.with({ fragment: 'frag' }));
            assertCanonical(uri_1.URI.parse('foo://bar/./bang#frag'), a.with({ fragment: 'frag' }));
            assertCanonical(uri_1.URI.parse('foo://bar/./bang#frag'), a.with({ fragment: 'frag' }));
            assertCanonical(uri_1.URI.parse('foo://bar/./foo/../bang#frag'), a.with({ fragment: 'frag' }));
            const b = uri_1.URI.parse('foo://bar/bazz#frag');
            assertCanonical(b, b);
            assertCanonical(uri_1.URI.parse('foo://bar/bazz'), b.with({ fragment: '' }));
            assertCanonical(uri_1.URI.parse('foo://bar/BAZZ#DDD'), b.with({ fragment: 'DDD' })); // lower-case path, but fragment is kept
        });
        test.skip('[perf] CPU pegged after some builds #194853', function () {
            const n = 100 + (2 ** 16);
            for (let i = 0; i < n; i++) {
                const uri = uri_1.URI.parse(`foo://bar/${i}`);
                const uri2 = _service.asCanonicalUri(uri);
                assert.ok(uri2);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpSWRlbnRpdHlTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VyaUlkZW50aXR5L3Rlc3QvY29tbW9uL3VyaUlkZW50aXR5U2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyxjQUFjLEVBQUU7UUFFckIsTUFBTSxlQUFnQixTQUFRLElBQUEsV0FBSSxHQUFnQjtZQUtqRCxZQUFxQixJQUFpRDtnQkFDckUsS0FBSyxFQUFFLENBQUM7Z0JBRFksU0FBSSxHQUFKLElBQUksQ0FBNkM7Z0JBSDdELDhDQUF5QyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3ZELCtDQUEwQyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFJakUsQ0FBQztZQUNRLFdBQVcsQ0FBQyxHQUFRO2dCQUM1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNsQyxDQUFDO1lBQ1EsYUFBYSxDQUFDLEdBQVEsRUFBRSxJQUFvQztnQkFDcEUsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsT0FBTyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzdCLENBQUM7U0FDRDtRQUVELElBQUksUUFBNEIsQ0FBQztRQUVqQyxLQUFLLENBQUM7WUFDTCxRQUFRLEdBQUcsSUFBSSx1Q0FBa0IsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEdBQUcsQ0FBQztnQkFDN0QsQ0FBQyxLQUFLLDhEQUFtRDtnQkFDekQsQ0FBQyxLQUFLLDhDQUFzQzthQUM1QyxDQUFDLENBQUMs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