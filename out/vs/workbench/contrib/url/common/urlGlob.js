/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testUrlMatchesGlob = void 0;
    // TODO: rewrite this to use URIs directly and validate each part individually
    // instead of relying on memoization of the stringified URI.
    const testUrlMatchesGlob = (uri, globUrl) => {
        let url = uri.with({ query: null, fragment: null }).toString(true);
        const normalize = (url) => url.replace(/\/+$/, '');
        globUrl = normalize(globUrl);
        url = normalize(url);
        const memo = Array.from({ length: url.length + 1 }).map(() => Array.from({ length: globUrl.length + 1 }).map(() => undefined));
        if (/^[^./:]*:\/\//.test(globUrl)) {
            return doUrlMatch(memo, url, globUrl, 0, 0);
        }
        const scheme = /^(https?):\/\//.exec(url)?.[1];
        if (scheme) {
            return doUrlMatch(memo, url, `${scheme}://${globUrl}`, 0, 0);
        }
        return false;
    };
    exports.testUrlMatchesGlob = testUrlMatchesGlob;
    const doUrlMatch = (memo, url, globUrl, urlOffset, globUrlOffset) => {
        if (memo[urlOffset]?.[globUrlOffset] !== undefined) {
            return memo[urlOffset][globUrlOffset];
        }
        const options = [];
        // Endgame.
        // Fully exact match
        if (urlOffset === url.length) {
            return globUrlOffset === globUrl.length;
        }
        // Some path remaining in url
        if (globUrlOffset === globUrl.length) {
            const remaining = url.slice(urlOffset);
            return remaining[0] === '/';
        }
        if (url[urlOffset] === globUrl[globUrlOffset]) {
            // Exact match.
            options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === '*.') {
            // Any subdomain match. Either consume one thing that's not a / or : and don't advance base or consume nothing and do.
            if (!['/', ':'].includes(url[urlOffset])) {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
        }
        if (globUrl[globUrlOffset] === '*') {
            // Any match. Either consume one thing and don't advance base or consume nothing and do.
            if (urlOffset + 1 === url.length) {
                // If we're at the end of the input url consume one from both.
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === ':*') {
            // any port match. Consume a port if it exists otherwise nothing. Always comsume the base.
            if (url[urlOffset] === ':') {
                let endPortIndex = urlOffset + 1;
                do {
                    endPortIndex++;
                } while (/[0-9]/.test(url[endPortIndex]));
                options.push(doUrlMatch(memo, url, globUrl, endPortIndex, globUrlOffset + 2));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
            }
        }
        return (memo[urlOffset][globUrlOffset] = options.some(a => a === true));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsR2xvYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXJsL2NvbW1vbi91cmxHbG9iLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUloRyw4RUFBOEU7SUFDOUUsNERBQTREO0lBQ3JELE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxHQUFRLEVBQUUsT0FBZSxFQUFXLEVBQUU7UUFDeEUsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25FLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRCxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFckIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQy9ELENBQUM7UUFFRixJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNuQyxPQUFPLFVBQVUsQ0FBQyxJQUFJLEVBQUUs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