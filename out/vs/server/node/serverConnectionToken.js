/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "cookie", "fs", "vs/base/common/path", "vs/base/common/uuid", "vs/base/common/network", "vs/base/node/pfs"], function (require, exports, cookie, fs, path, uuid_1, network_1, pfs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ServerConnectionTokenParseError = exports.MandatoryServerConnectionToken = exports.NoneServerConnectionToken = exports.ServerConnectionTokenType = void 0;
    exports.parseServerConnectionToken = parseServerConnectionToken;
    exports.determineServerConnectionToken = determineServerConnectionToken;
    exports.requestHasValidConnectionToken = requestHasValidConnectionToken;
    const connectionTokenRegex = /^[0-9A-Za-z_-]+$/;
    var ServerConnectionTokenType;
    (function (ServerConnectionTokenType) {
        ServerConnectionTokenType[ServerConnectionTokenType["None"] = 0] = "None";
        ServerConnectionTokenType[ServerConnectionTokenType["Optional"] = 1] = "Optional";
        ServerConnectionTokenType[ServerConnectionTokenType["Mandatory"] = 2] = "Mandatory";
    })(ServerConnectionTokenType || (exports.ServerConnectionTokenType = ServerConnectionTokenType = {}));
    class NoneServerConnectionToken {
        constructor() {
            this.type = 0 /* ServerConnectionTokenType.None */;
        }
        validate(connectionToken) {
            return true;
        }
    }
    exports.NoneServerConnectionToken = NoneServerConnectionToken;
    class MandatoryServerConnectionToken {
        constructor(value) {
            this.value = value;
            this.type = 2 /* ServerConnectionTokenType.Mandatory */;
        }
        validate(connectionToken) {
            return (connectionToken === this.value);
        }
    }
    exports.MandatoryServerConnectionToken = MandatoryServerConnectionToken;
    class ServerConnectionTokenParseError {
        constructor(message) {
            this.message = message;
        }
    }
    exports.ServerConnectionTokenParseError = ServerConnectionTokenParseError;
    async function parseServerConnectionToken(args, defaultValue) {
        const withoutConnectionToken = args['without-connection-token'];
        const connectionToken = args['connection-token'];
        const connectionTokenFile = args['connection-token-file'];
        if (withoutConnectionToken) {
            if (typeof connectionToken !== 'undefined' || typeof connectionTokenFile !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' or '--connection-token-file' at the same time as '--without-connection-token'.`);
            }
            return new NoneServerConnectionToken();
        }
        if (typeof connectionTokenFile !== 'undefined') {
            if (typeof connectionToken !== 'undefined') {
                return new ServerConnectionTokenParseError(`Please do not use the argument '--connection-token' at the same time as '--connection-token-file'.`);
            }
            let rawConnectionToken;
            try {
                rawConnectionToken = fs.readFileSync(connectionTokenFile).toString().replace(/\r?\n$/, '');
            }
            catch (e) {
                return new ServerConnectionTokenParseError(`Unable to read the connection token file at '${connectionTokenFile}'.`);
            }
            if (!connectionTokenRegex.test(rawConnectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token defined in '${connectionTokenFile} does not adhere to the characters 0-9, a-z, A-Z, _, or -.`);
            }
            return new MandatoryServerConnectionToken(rawConnectionToken);
        }
        if (typeof connectionToken !== 'undefined') {
            if (!connectionTokenRegex.test(connectionToken)) {
                return new ServerConnectionTokenParseError(`The connection token '${connectionToken} does not adhere to the characters 0-9, a-z, A-Z or -.`);
            }
            return new MandatoryServerConnectionToken(connectionToken);
        }
        return new MandatoryServerConnectionToken(await defaultValue());
    }
    async function determineServerConnectionToken(args) {
        const readOrGenerateConnectionToken = async () => {
            if (!args['user-data-dir']) {
                // No place to store it!
                return (0, uuid_1.generateUuid)();
            }
            const storageLocation = path.join(args['user-data-dir'], 'token');
            // First try to find a connection token
            try {
                const fileContents = await pfs_1.Promises.readFile(storageLocation);
                const connectionToken = fileContents.toString().replace(/\r?\n$/, '');
                if (connectionTokenRegex.test(connectionToken)) {
                    return connectionToken;
                }
            }
            catch (err) { }
            // No connection token found, generate one
            const connectionToken = (0, uuid_1.generateUuid)();
            try {
                // Try to store it
                await pfs_1.Promises.writeFile(storageLocation, connectionToken, { mode: 0o600 });
            }
            catch (err) { }
            return connectionToken;
        };
        return parseServerConnectionToken(args, readOrGenerateConnectionToken);
    }
    function requestHasValidConnectionToken(connectionToken, req, parsedUrl) {
        // First check if there is a valid query parameter
        if (connectionToken.validate(parsedUrl.query[network_1.connectionTokenQueryName])) {
            return true;
        }
        // Otherwise, check if there is a valid cookie
        const cookies = cookie.parse(req.headers.cookie || '');
        return connectionToken.validate(cookies[network_1.connectionTokenCookieName]);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyQ29ubmVjdGlvblRva2VuLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9zZXJ2ZXIvbm9kZS9zZXJ2ZXJDb25uZWN0aW9uVG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBK0NoRyxnRUF3Q0M7SUFFRCx3RUE0QkM7SUFFRCx3RUFTQztJQXBIRCxNQUFNLG9CQUFvQixHQUFHLGtCQUFrQixDQUFDO0lBRWhELElBQWtCLHlCQUlqQjtJQUpELFdBQWtCLHlCQUF5QjtRQUMxQyx5RUFBSSxDQUFBO1FBQ0osaUZBQVEsQ0FBQTtRQUNSLG1GQUFTLENBQUE7SUFDVixDQUFDLEVBSmlCLHlCQUF5Qix5Q0FBekIseUJBQXlCLFFBSTFDO0lBRUQsTUFBYSx5QkFBeUI7UUFBdEM7WUFDaUIsU0FBSSwwQ0FBa0M7UUFLdkQsQ0FBQztRQUhPLFFBQVEsQ0FBQyxlQUFvQjtZQUNuQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7S0FDRDtJQU5ELDhEQU1DO0lBRUQsTUFBYSw4QkFBOEI7UUFHMUMsWUFBNEIsS0FBYTtZQUFiLFVBQUssR0FBTCxLQUFLLENBQVE7WUFGekIsU0FBSSwrQ0FBdUM7UUFHM0QsQ0FBQztRQUVNLFFBQVEsQ0FBQyxlQUFvQjtZQUNuQyxPQUFPLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxDQUFDO0tBQ0Q7SUFURCx3RUFTQztJQUlELE1BQWEsK0JBQStCO1FBQzNDLFlBQ2lCLE9BQWU7WUFBZixZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQzVCLENBQUM7S0FDTDtJQUpELDBFQUlDO0lBRU0sS0FBSyxVQUFVLDBCQUEwQixDQUFDLElBQXNCLEVBQUUsWUFBbUM7UUFDM0csTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FB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