/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "fs", "vs/base/common/functional"], function (require, exports, crypto, fs, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checksum = checksum;
    async function checksum(path, sha256hash) {
        const checksumPromise = new Promise((resolve, reject) => {
            const input = fs.createReadStream(path);
            const hash = crypto.createHash('sha256');
            input.pipe(hash);
            const done = (0, functional_1.createSingleCallFunction)((err, result) => {
                input.removeAllListeners();
                hash.removeAllListeners();
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
            input.once('error', done);
            input.once('end', done);
            hash.once('error', done);
            hash.once('data', (data) => done(undefined, data.toString('hex')));
        });
        const hash = await checksumPromise;
        if (hash !== sha256hash) {
            throw new Error('Hash mismatch');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvY3J5cHRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLDRCQTRCQztJQTVCTSxLQUFLLFVBQVUsUUFBUSxDQUFDLElBQVksRUFBRSxVQUE4QjtRQUMxRSxNQUFNLGVBQWUsR0FBRyxJQUFJLE9BQU8sQ0FBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDM0UsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVqQixNQUFNLElBQUksR0FBRyxJQUFBLHFDQUF3QixFQUFDLENBQUMsR0FBVyxFQUFFLE1BQWUsRUFBRSxFQUFFO2dCQUN0RSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBRTFCLElBQUksR0FBRyxFQUFFLENBQUM7b0JBQ1QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNiLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBWSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFlLENBQUM7UUFFbkMsSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO0lBQ0YsQ0FBQyJ9