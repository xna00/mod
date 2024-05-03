/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform"], function (require, exports, paths, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.URI = void 0;
    exports.isUriComponents = isUriComponents;
    exports.uriToFsPath = uriToFsPath;
    const _schemePattern = /^\w[\w\d+.-]*$/;
    const _singleSlashStart = /^\//;
    const _doubleSlashStart = /^\/\//;
    function _validateUri(ret, _strict) {
        // scheme, must be set
        if (!ret.scheme && _strict) {
            throw new Error(`[UriError]: Scheme is missing: {scheme: "", authority: "${ret.authority}", path: "${ret.path}", query: "${ret.query}", fragment: "${ret.fragment}"}`);
        }
        // scheme, https://tools.ietf.org/html/rfc3986#section-3.1
        // ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
        if (ret.scheme && !_schemePattern.test(ret.scheme)) {
            throw new Error('[UriError]: Scheme contains illegal characters.');
        }
        // path, http://tools.ietf.org/html/rfc3986#section-3.3
        // If a URI contains an authority component, then the path component
        // must either be empty or begin with a slash ("/") character.  If a URI
        // does not contain an authority component, then the path cannot begin
        // with two slash characters ("//").
        if (ret.path) {
            if (ret.authority) {
                if (!_singleSlashStart.test(ret.path)) {
                    throw new Error('[UriError]: If a URI contains an authority component, then the path component must either be empty or begin with a slash ("/") character');
                }
            }
            else {
                if (_doubleSlashStart.test(ret.path)) {
                    throw new Error('[UriError]: If a URI does not contain an authority component, then the path cannot begin with two slash characters ("//")');
                }
            }
        }
    }
    // for a while we allowed uris *without* schemes and this is the migration
    // for them, e.g. an uri without scheme and without strict-mode warns and falls
    // back to the file-scheme. that should cause the least carnage and still be a
    // clear warning
    function _schemeFix(scheme, _strict) {
        if (!scheme && !_strict) {
            return 'file';
        }
        return scheme;
    }
    // implements a bit of https://tools.ietf.org/html/rfc3986#section-5
    function _referenceResolution(scheme, path) {
        // the slash-character is our 'default base' as we don't
        // support constructing URIs relative to other URIs. This
        // also means that we alter and potentially break paths.
        // see https://tools.ietf.org/html/rfc3986#section-5.1.4
        switch (scheme) {
            case 'https':
            case 'http':
            case 'file':
                if (!path) {
                    path = _slash;
                }
                else if (path[0] !== _slash) {
                    path = _slash + path;
                }
                break;
        }
        return path;
    }
    const _empty = '';
    const _slash = '/';
    const _regexp = /^(([^:/?#]+?):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
    /**
     * Uniform Resource Identifier (URI) http://tools.ietf.org/html/rfc3986.
     * This class is a simple parser which creates the basic component parts
     * (http://tools.ietf.org/html/rfc3986#section-3) with minimal validation
     * and encoding.
     *
     * ```txt
     *       foo://example.com:8042/over/there?name=ferret#nose
     *       \_/   \______________/\_________/ \_________/ \__/
     *        |           |            |            |        |
     *     scheme     authority       path        query   fragment
     *        |   _____________________|__
     *       / \ /                        \
     *       urn:example:animal:ferret:nose
     * ```
     */
    class URI {
        static isUri(thing) {
            if (thing instanceof URI) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.authority === 'string'
                && typeof thing.fragment === 'string'
                && typeof thing.path === 'string'
                && typeof thing.query === 'string'
                && typeof thing.scheme === 'string'
                && typeof thing.fsPath === 'string'
                && typeof thing.with === 'function'
                && typeof thing.toString === 'function';
        }
        /**
         * @internal
         */
        constructor(schemeOrData, authority, path, query, fragment, _strict = false) {
            if (typeof schemeOrData === 'object') {
                this.scheme = schemeOrData.scheme || _empty;
                this.authority = schemeOrData.authority || _empty;
                this.path = schemeOrData.path || _empty;
                this.query = schemeOrData.query || _empty;
                this.fragment = schemeOrData.fragment || _empty;
                // no validation because it's this URI
                // that creates uri components.
                // _validateUri(this);
            }
            else {
                this.scheme = _schemeFix(schemeOrData, _strict);
                this.authority = authority || _empty;
                this.path = _referenceResolution(this.scheme, path || _empty);
                this.query = query || _empty;
                this.fragment = fragment || _empty;
                _validateUri(this, _strict);
            }
        }
        // ---- filesystem path -----------------------
        /**
         * Returns a string representing the corresponding file system path of this URI.
         * Will handle UNC paths, normalizes windows drive letters to lower-case, and uses the
         * platform specific path separator.
         *
         * * Will *not* validate the path for invalid characters and semantics.
         * * Will *not* look at the scheme of this URI.
         * * The result shall *not* be used for display purposes but for accessing a file on disk.
         *
         *
         * The *difference* to `URI#path` is the use of the platform specific separator and the handling
         * of UNC paths. See the below sample of a file-uri with an authority (UNC path).
         *
         * ```ts
            const u = URI.parse('file://server/c$/folder/file.txt')
            u.authority === 'server'
            u.path === '/shares/c$/file.txt'
            u.fsPath === '\\server\c$\folder\file.txt'
        ```
         *
         * Using `URI#path` to read a file (using fs-apis) would not be enough because parts of the path,
         * namely the server name, would be missing. Therefore `URI#fsPath` exists - it's sugar to ease working
         * with URIs that represent files on disk (`file` scheme).
         */
        get fsPath() {
            // if (this.scheme !== 'file') {
            // 	console.warn(`[UriError] calling fsPath with scheme ${this.scheme}`);
            // }
            return uriToFsPath(this, false);
        }
        // ---- modify to new -------------------------
        with(change) {
            if (!change) {
                return this;
            }
            let { scheme, authority, path, query, fragment } = change;
            if (scheme === undefined) {
                scheme = this.scheme;
            }
            else if (scheme === null) {
                scheme = _empty;
            }
            if (authority === undefined) {
                authority = this.authority;
            }
            else if (authority === null) {
                authority = _empty;
            }
            if (path === undefined) {
                path = this.path;
            }
            else if (path === null) {
                path = _empty;
            }
            if (query === undefined) {
                query = this.query;
            }
            else if (query === null) {
                query = _empty;
            }
            if (fragment === undefined) {
                fragment = this.fragment;
            }
            else if (fragment === null) {
                fragment = _empty;
            }
            if (scheme === this.scheme
                && authority === this.authority
                && path === this.path
                && query === this.query
                && fragment === this.fragment) {
                return this;
            }
            return new Uri(scheme, authority, path, query, fragment);
        }
        // ---- parse & validate ------------------------
        /**
         * Creates a new URI from a string, e.g. `http://www.example.com/some/path`,
         * `file:///usr/home`, or `scheme:with/path`.
         *
         * @param value A string which represents an URI (see `URI#toString`).
         */
        static parse(value, _strict = false) {
            const match = _regexp.exec(value);
            if (!match) {
                return new Uri(_empty, _empty, _empty, _empty, _empty);
            }
            return new Uri(match[2] || _empty, percentDecode(match[4] || _empty), percentDecode(match[5] || _empty), percentDecode(match[7] || _empty), percentDecode(match[9] || _empty), _strict);
        }
        /**
         * Creates a new URI from a file system path, e.g. `c:\my\files`,
         * `/usr/home`, or `\\server\share\some\path`.
         *
         * The *difference* between `URI#parse` and `URI#file` is that the latter treats the argument
         * as path, not as stringified-uri. E.g. `URI.file(path)` is **not the same as**
         * `URI.parse('file://' + path)` because the path might contain characters that are
         * interpreted (# and ?). See the following sample:
         * ```ts
        const good = URI.file('/coding/c#/project1');
        good.scheme === 'file';
        good.path === '/coding/c#/project1';
        good.fragment === '';
        const bad = URI.parse('file://' + '/coding/c#/project1');
        bad.scheme === 'file';
        bad.path === '/coding/c'; // path is now broken
        bad.fragment === '/project1';
        ```
         *
         * @param path A file system path (see `URI#fsPath`)
         */
        static file(path) {
            let authority = _empty;
            // normalize to fwd-slashes on windows,
            // on other systems bwd-slashes are valid
            // filename character, eg /f\oo/ba\r.txt
            if (platform_1.isWindows) {
                path = path.replace(/\\/g, _slash);
            }
            // check for authority as used in UNC shares
            // or use the path as given
            if (path[0] === _slash && path[1] === _slash) {
                const idx = path.indexOf(_slash, 2);
                if (idx === -1) {
                    authority = path.substring(2);
                    path = _slash;
                }
                else {
                    authority = path.substring(2, idx);
                    path = path.substring(idx) || _slash;
                }
            }
            return new Uri('file', authority, path, _empty, _empty);
        }
        /**
         * Creates new URI from uri components.
         *
         * Unless `strict` is `true` the scheme is defaults to be `file`. This function performs
         * validation and should be used for untrusted uri components retrieved from storage,
         * user input, command arguments etc
         */
        static from(components, strict) {
            const result = new Uri(components.scheme, components.authority, components.path, components.query, components.fragment, strict);
            return result;
        }
        /**
         * Join a URI path with path fragments and normalizes the resulting path.
         *
         * @param uri The input URI.
         * @param pathFragment The path fragment to add to the URI path.
         * @returns The resulting URI.
         */
        static joinPath(uri, ...pathFragment) {
            if (!uri.path) {
                throw new Error(`[UriError]: cannot call joinPath on URI without path`);
            }
            let newPath;
            if (platform_1.isWindows && uri.scheme === 'file') {
                newPath = URI.file(paths.win32.join(uriToFsPath(uri, true), ...pathFragment)).path;
            }
            else {
                newPath = paths.posix.join(uri.path, ...pathFragment);
            }
            return uri.with({ path: newPath });
        }
        // ---- printing/externalize ---------------------------
        /**
         * Creates a string representation for this URI. It's guaranteed that calling
         * `URI.parse` with the result of this function creates an URI which is equal
         * to this URI.
         *
         * * The result shall *not* be used for display purposes but for externalization or transport.
         * * The result will be encoded using the percentage encoding and encoding happens mostly
         * ignore the scheme-specific encoding rules.
         *
         * @param skipEncoding Do not encode the result, default is `false`
         */
        toString(skipEncoding = false) {
            return _asFormatted(this, skipEncoding);
        }
        toJSON() {
            return this;
        }
        static revive(data) {
            if (!data) {
                return data;
            }
            else if (data instanceof URI) {
                return data;
            }
            else {
                const result = new Uri(data);
                result._formatted = data.external ?? null;
                result._fsPath = data._sep === _pathSepMarker ? data.fsPath ?? null : null;
                return result;
            }
        }
    }
    exports.URI = URI;
    function isUriComponents(thing) {
        if (!thing || typeof thing !== 'object') {
            return false;
        }
        return typeof thing.scheme === 'string'
            && (typeof thing.authority === 'string' || typeof thing.authority === 'undefined')
            && (typeof thing.path === 'string' || typeof thing.path === 'undefined')
            && (typeof thing.query === 'string' || typeof thing.query === 'undefined')
            && (typeof thing.fragment === 'string' || typeof thing.fragment === 'undefined');
    }
    const _pathSepMarker = platform_1.isWindows ? 1 : undefined;
    // This class exists so that URI is compatible with vscode.Uri (API).
    class Uri extends URI {
        constructor() {
            super(...arguments);
            this._formatted = null;
            this._fsPath = null;
        }
        get fsPath() {
            if (!this._fsPath) {
                this._fsPath = uriToFsPath(this, false);
            }
            return this._fsPath;
        }
        toString(skipEncoding = false) {
            if (!skipEncoding) {
                if (!this._formatted) {
                    this._formatted = _asFormatted(this, false);
                }
                return this._formatted;
            }
            else {
                // we don't cache that
                return _asFormatted(this, true);
            }
        }
        toJSON() {
            const res = {
                $mid: 1 /* MarshalledId.Uri */
            };
            // cached state
            if (this._fsPath) {
                res.fsPath = this._fsPath;
                res._sep = _pathSepMarker;
            }
            if (this._formatted) {
                res.external = this._formatted;
            }
            //--- uri components
            if (this.path) {
                res.path = this.path;
            }
            // TODO
            // this isn't correct and can violate the UriComponents contract but
            // this is part of the vscode.Uri API and we shouldn't change how that
            // works anymore
            if (this.scheme) {
                res.scheme = this.scheme;
            }
            if (this.authority) {
                res.authority = this.authority;
            }
            if (this.query) {
                res.query = this.query;
            }
            if (this.fragment) {
                res.fragment = this.fragment;
            }
            return res;
        }
    }
    // reserved characters: https://tools.ietf.org/html/rfc3986#section-2.2
    const encodeTable = {
        [58 /* CharCode.Colon */]: '%3A', // gen-delims
        [47 /* CharCode.Slash */]: '%2F',
        [63 /* CharCode.QuestionMark */]: '%3F',
        [35 /* CharCode.Hash */]: '%23',
        [91 /* CharCode.OpenSquareBracket */]: '%5B',
        [93 /* CharCode.CloseSquareBracket */]: '%5D',
        [64 /* CharCode.AtSign */]: '%40',
        [33 /* CharCode.ExclamationMark */]: '%21', // sub-delims
        [36 /* CharCode.DollarSign */]: '%24',
        [38 /* CharCode.Ampersand */]: '%26',
        [39 /* CharCode.SingleQuote */]: '%27',
        [40 /* CharCode.OpenParen */]: '%28',
        [41 /* CharCode.CloseParen */]: '%29',
        [42 /* CharCode.Asterisk */]: '%2A',
        [43 /* CharCode.Plus */]: '%2B',
        [44 /* CharCode.Comma */]: '%2C',
        [59 /* CharCode.Semicolon */]: '%3B',
        [61 /* CharCode.Equals */]: '%3D',
        [32 /* CharCode.Space */]: '%20',
    };
    function encodeURIComponentFast(uriComponent, isPath, isAuthority) {
        let res = undefined;
        let nativeEncodePos = -1;
        for (let pos = 0; pos < uriComponent.length; pos++) {
            const code = uriComponent.charCodeAt(pos);
            // unreserved characters: https://tools.ietf.org/html/rfc3986#section-2.3
            if ((code >= 97 /* CharCode.a */ && code <= 122 /* CharCode.z */)
                || (code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */)
                || (code >= 48 /* CharCode.Digit0 */ && code <= 57 /* CharCode.Digit9 */)
                || code === 45 /* CharCode.Dash */
                || code === 46 /* CharCode.Period */
                || code === 95 /* CharCode.Underline */
                || code === 126 /* CharCode.Tilde */
                || (isPath && code === 47 /* CharCode.Slash */)
                || (isAuthority && code === 91 /* CharCode.OpenSquareBracket */)
                || (isAuthority && code === 93 /* CharCode.CloseSquareBracket */)
                || (isAuthority && code === 58 /* CharCode.Colon */)) {
                // check if we are delaying native encode
                if (nativeEncodePos !== -1) {
                    res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
                    nativeEncodePos = -1;
                }
                // check if we write into a new string (by default we try to return the param)
                if (res !== undefined) {
                    res += uriComponent.charAt(pos);
                }
            }
            else {
                // encoding needed, we need to allocate a new string
                if (res === undefined) {
                    res = uriComponent.substr(0, pos);
                }
                // check with default table first
                const escaped = encodeTable[code];
                if (escaped !== undefined) {
                    // check if we are delaying native encode
                    if (nativeEncodePos !== -1) {
                        res += encodeURIComponent(uriComponent.substring(nativeEncodePos, pos));
                        nativeEncodePos = -1;
                    }
                    // append escaped variant to result
                    res += escaped;
                }
                else if (nativeEncodePos === -1) {
                    // use native encode only when needed
                    nativeEncodePos = pos;
                }
            }
        }
        if (nativeEncodePos !== -1) {
            res += encodeURIComponent(uriComponent.substring(nativeEncodePos));
        }
        return res !== undefined ? res : uriComponent;
    }
    function encodeURIComponentMinimal(path) {
        let res = undefined;
        for (let pos = 0; pos < path.length; pos++) {
            const code = path.charCodeAt(pos);
            if (code === 35 /* CharCode.Hash */ || code === 63 /* CharCode.QuestionMark */) {
                if (res === undefined) {
                    res = path.substr(0, pos);
                }
                res += encodeTable[code];
            }
            else {
                if (res !== undefined) {
                    res += path[pos];
                }
            }
        }
        return res !== undefined ? res : path;
    }
    /**
     * Compute `fsPath` for the given uri
     */
    function uriToFsPath(uri, keepDriveLetterCasing) {
        let value;
        if (uri.authority && uri.path.length > 1 && uri.scheme === 'file') {
            // unc path: file://shares/c$/far/boo
            value = `//${uri.authority}${uri.path}`;
        }
        else if (uri.path.charCodeAt(0) === 47 /* CharCode.Slash */
            && (uri.path.charCodeAt(1) >= 65 /* CharCode.A */ && uri.path.charCodeAt(1) <= 90 /* CharCode.Z */ || uri.path.charCodeAt(1) >= 97 /* CharCode.a */ && uri.path.charCodeAt(1) <= 122 /* CharCode.z */)
            && uri.path.charCodeAt(2) === 58 /* CharCode.Colon */) {
            if (!keepDriveLetterCasing) {
                // windows drive letter: file:///c:/far/boo
                value = uri.path[1].toLowerCase() + uri.path.substr(2);
            }
            else {
                value = uri.path.substr(1);
            }
        }
        else {
            // other path
            value = uri.path;
        }
        if (platform_1.isWindows) {
            value = value.replace(/\//g, '\\');
        }
        return value;
    }
    /**
     * Create the external version of a uri
     */
    function _asFormatted(uri, skipEncoding) {
        const encoder = !skipEncoding
            ? encodeURIComponentFast
            : encodeURIComponentMinimal;
        let res = '';
        let { scheme, authority, path, query, fragment } = uri;
        if (scheme) {
            res += scheme;
            res += ':';
        }
        if (authority || scheme === 'file') {
            res += _slash;
            res += _slash;
        }
        if (authority) {
            let idx = authority.indexOf('@');
            if (idx !== -1) {
                // <user>@<auth>
                const userinfo = authority.substr(0, idx);
                authority = authority.substr(idx + 1);
                idx = userinfo.lastIndexOf(':');
                if (idx === -1) {
                    res += encoder(userinfo, false, false);
                }
                else {
                    // <user>:<pass>@<auth>
                    res += encoder(userinfo.substr(0, idx), false, false);
                    res += ':';
                    res += encoder(userinfo.substr(idx + 1), false, true);
                }
                res += '@';
            }
            authority = authority.toLowerCase();
            idx = authority.lastIndexOf(':');
            if (idx === -1) {
                res += encoder(authority, false, true);
            }
            else {
                // <auth>:<port>
                res += encoder(authority.substr(0, idx), false, true);
                res += authority.substr(idx);
            }
        }
        if (path) {
            // lower-case windows drive letters in /C:/fff or C:/fff
            if (path.length >= 3 && path.charCodeAt(0) === 47 /* CharCode.Slash */ && path.charCodeAt(2) === 58 /* CharCode.Colon */) {
                const code = path.charCodeAt(1);
                if (code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */) {
                    path = `/${String.fromCharCode(code + 32)}:${path.substr(3)}`; // "/c:".length === 3
                }
            }
            else if (path.length >= 2 && path.charCodeAt(1) === 58 /* CharCode.Colon */) {
                const code = path.charCodeAt(0);
                if (code >= 65 /* CharCode.A */ && code <= 90 /* CharCode.Z */) {
                    path = `${String.fromCharCode(code + 32)}:${path.substr(2)}`; // "/c:".length === 3
                }
            }
            // encode the rest of the path
            res += encoder(path, true, false);
        }
        if (query) {
            res += '?';
            res += encoder(query, false, false);
        }
        if (fragment) {
            res += '#';
            res += !skipEncoding ? encodeURIComponentFast(fragment, false, false) : fragment;
        }
        return res;
    }
    // --- decode
    function decodeURIComponentGraceful(str) {
        try {
            return decodeURIComponent(str);
        }
        catch {
            if (str.length > 3) {
                return str.substr(0, 3) + decodeURIComponentGraceful(str.substr(3));
            }
            else {
                return str;
            }
        }
    }
    const _rEncodedAsHex = /(%[0-9A-Za-z][0-9A-Za-z])+/g;
    function percentDecode(str) {
        if (!str.match(_rEncodedAsHex)) {
            return str;
        }
        return str.replace(_rEncodedAsHex, (match) => decodeURIComponentGraceful(match));
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJpLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2NvbW1vbi91cmkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc2FoRywwQ0FTQztJQXNMRCxrQ0F5QkM7SUF2bkJELE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDO0lBQ3hDLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBQ2hDLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDO0lBRWxDLFNBQVMsWUFBWSxDQUFDLEdBQVEsRUFBRSxPQUFpQjtRQUVoRCxzQkFBc0I7UUFDdEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQywyREFBMkQsR0FBRyxDQUFDLFNBQVMsYUFBYSxHQUFHLENBQUMsSUFBSSxjQUFjLEdBQUcsQ0FBQyxLQUFLLGlCQUFpQixHQUFHLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQztRQUN4SyxDQUFDO1FBRUQsMERBQTBEO1FBQzFELDZDQUE2QztRQUM3QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ3BELE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsdURBQXVEO1FBQ3ZELG9FQUFvRTtRQUNwRSx3RUFBd0U7UUFDeEUsc0VBQXNFO1FBQ3RFLG9DQUFvQztRQUNwQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLElBQUksR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMs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