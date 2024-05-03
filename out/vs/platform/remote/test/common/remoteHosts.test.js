/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/remote/common/remoteHosts"], function (require, exports, assert, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('remoteHosts', () => {
        test('parseAuthority hostname', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithPort)('localhost:8080'), { host: 'localhost', port: 8080 });
        });
        test('parseAuthority ipv4', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithPort)('127.0.0.1:8080'), { host: '127.0.0.1', port: 8080 });
        });
        test('parseAuthority ipv6', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithPort)('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8080'), { host: '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]', port: 8080 });
        });
        test('parseAuthorityWithOptionalPort hostname', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('localhost:8080', 123), { host: 'localhost', port: 8080 });
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('localhost', 123), { host: 'localhost', port: 123 });
        });
        test('parseAuthorityWithOptionalPort ipv4', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('127.0.0.1:8080', 123), { host: '127.0.0.1', port: 8080 });
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('127.0.0.1', 123), { host: '127.0.0.1', port: 123 });
        });
        test('parseAuthorityWithOptionalPort ipv6', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8080', 123), { host: '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]', port: 8080 });
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]', 123), { host: '[2001:0db8:85a3:0000:0000:8a2e:0370:7334]', port: 123 });
        });
        test('issue #151748: Error: Remote authorities containing \'+\' need to be resolved!', () => {
            assert.deepStrictEqual((0, remoteHosts_1.parseAuthorityWithOptionalPort)('codespaces+aaaaa-aaaaa-aaaa-aaaaa-a111aa111', 123), { host: 'codespaces+aaaaa-aaaaa-aaaa-aaaaa-a111aa111', port: 123 });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlSG9zdHMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcmVtb3RlL3Rlc3QvY29tbW9uL3JlbW90ZUhvc3RzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFLaEcsS0FBSyxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFFekIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsb0NBQXNCLEVBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSxvQ0FBc0IsRUFBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyRyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7WUFDaEMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLG9DQUFzQixFQUFDLGdEQUFnRCxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsMkNBQTJDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckssQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSw0Q0FBOEIsRUFBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLDRDQUE4QixFQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDNUcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSw0Q0FBOEIsRUFBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDakgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLDRDQUE4QixFQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDNUcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQ2hELE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSw0Q0FBOEIsRUFBQyxnREFBZ0QsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSwyQ0FBMkMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNqTCxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUEsNENBQThCLEVBQUMsMkNBQTJDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsMkNBQTJDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDNUssQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0ZBQWdGLEVBQUUsR0FBRyxFQUFFO1lBQzNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBQSw0Q0FBOEIsRUFBQyw2Q0FBNkMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSw2Q0FBNkMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNoTCxDQUFDLENBQUMsQ0FBQztJQUVKLENBQUMsQ0FBQyxDQUFDIn0=