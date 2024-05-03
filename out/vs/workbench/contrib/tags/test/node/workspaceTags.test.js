/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "crypto", "vs/base/test/common/utils", "vs/workbench/contrib/tags/common/workspaceTags"], function (require, exports, assert, crypto, utils_1, workspaceTags_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    function hash(value) {
        return crypto.createHash('sha1').update(value.toString()).digest('hex');
    }
    async function asyncHash(value) {
        return hash(value);
    }
    async function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return (0, workspaceTags_1.getHashedRemotesFromConfig)(text, stripEndingDotGit, remote => asyncHash(remote));
    }
    suite('Telemetry - WorkspaceTags', () => {
        test('Single remote hashed', async function () {
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('https://username:password@github3.com/username/repository.git')), [hash('github3.com/username/repository.git')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('ssh://user@git.server.org/project.git')), [hash('git.server.org/project.git')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('user@git.server.org:project.git')), [hash('git.server.org/project.git')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('/opt/git/project.git')), []);
            // Strip .git
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('https://username:password@github3.com/username/repository.git'), true), [hash('github3.com/username/repository')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('ssh://user@git.server.org/project.git'), true), [hash('git.server.org/project')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('user@git.server.org:project.git'), true), [hash('git.server.org/project')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('/opt/git/project.git'), true), []);
            // Compare Striped .git with no .git
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('https://username:password@github3.com/username/repository.git'), true), await getHashedRemotesFromConfig(remote('https://username:password@github3.com/username/repository')));
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('ssh://user@git.server.org/project.git'), true), await getHashedRemotesFromConfig(remote('ssh://user@git.server.org/project')));
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('user@git.server.org:project.git'), true), [hash('git.server.org/project')]);
            assert.deepStrictEqual(await getHashedRemotesFromConfig(remote('/opt/git/project.git'), true), await getHashedRemotesFromConfig(remote('/opt/git/project')));
        });
        test('Multiple remotes hashed', async function () {
            const config = ['https://github.com/microsoft/vscode.git', 'https://git.example.com/gitproject.git'].map(remote).join(' ');
            assert.deepStrictEqual(await getHashedRemotesFromConfig(config), [hash('github.com/microsoft/vscode.git'), hash('git.example.com/gitproject.git')]);
            // Strip .git
            assert.deepStrictEqual(await getHashedRemotesFromConfig(config, true), [hash('github.com/microsoft/vscode'), hash('git.example.com/gitproject')]);
            // Compare Striped .git with no .git
            const noDotGitConfig = ['https://github.com/microsoft/vscode', 'https://git.example.com/gitproject'].map(remote).join(' ');
            assert.deepStrictEqual(await getHashedRemotesFromConfig(config, true), await getHashedRemotesFromConfig(noDotGitConfig));
        });
        function remote(url) {
            return `[remote "origin"]
	url = ${url}
	fetch = +refs/heads/*:refs/remotes/origin/*
`;
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVGFncy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90YWdzL3Rlc3Qvbm9kZS93b3Jrc3BhY2VUYWdzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsZ0VBRUM7SUFWRCxTQUFTLElBQUksQ0FBQyxLQUFhO1FBQzFCLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFFRCxLQUFLLFVBQVUsU0FBUyxDQUFDLEtBQWE7UUFDckMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsQ0FBQztJQUVNLEtBQUssVUFBVSwwQkFBMEIsQ0FBQyxJQUFZLEVBQUUsb0JBQTZCLEtBQUs7UUFDaEcsT0FBTyxJQUFBLDBDQUE4QixFQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFFRCxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBRXZDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxLQUFLO1lBQ2pDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSwwQkFBMEIsQ0FBQyxNQUFNLENBQUMsK0RBQStELENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pMLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSwwQkFBMEIsQ0FBQyxNQUFNLENBQUMsdUNBQXVDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFD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