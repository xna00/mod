define(["require", "exports", "vs/workbench/contrib/files/common/explorerFileNestingTrie", "assert", "vs/base/test/common/utils"], function (require, exports, explorerFileNestingTrie_1, assert, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fakeFilenameAttributes = { dirname: 'mydir', basename: '', extname: '' };
    suite('SufTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('exactMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), []);
        });
        test('starMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['MyKey']);
        });
        test('starSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', '${capture}.json');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['.json']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['a.json']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['a.b.c.d.json']);
        });
        test('multiMatches', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'Key1');
            t.add('*.json', 'Key2');
            t.add('*d.npmrc', 'Key3');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1', 'Key3']);
        });
        test('multiSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.SufTrie();
            t.add('*.npmrc', 'Key1.${capture}.js');
            t.add('*.json', 'Key2.${capture}.js');
            t.add('*d.npmrc', 'Key3.${capture}.js');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1..js']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2..js']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2.a.js']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1.a.js']);
            assert.deepStrictEqual(t.get('a.b.cd.npmrc', fakeFilenameAttributes), ['Key1.a.b.cd.js', 'Key3.a.b.c.js']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1.a.b.c.d.js', 'Key3.a.b.c..js']);
        });
    });
    suite('PreTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('exactMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), []);
        });
        test('starMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'MyKey');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['MyKey']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['MyKey']);
        });
        test('starSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', '${capture}.json');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['.json']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['a.json']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['a.b.c.d.json']);
        });
        test('multiMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'Key1');
            t.add('*.json', 'Key2');
            t.add('*d.npmrc', 'Key3');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1', 'Key3']);
        });
        test('multiSubstitutes', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('*.npmrc', 'Key1.${capture}.js');
            t.add('*.json', 'Key2.${capture}.js');
            t.add('*d.npmrc', 'Key3.${capture}.js');
            assert.deepStrictEqual(t.get('.npmrc', fakeFilenameAttributes), ['Key1..js']);
            assert.deepStrictEqual(t.get('npmrc', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.npmrcs', fakeFilenameAttributes), []);
            assert.deepStrictEqual(t.get('.json', fakeFilenameAttributes), ['Key2..js']);
            assert.deepStrictEqual(t.get('a.json', fakeFilenameAttributes), ['Key2.a.js']);
            assert.deepStrictEqual(t.get('a.npmrc', fakeFilenameAttributes), ['Key1.a.js']);
            assert.deepStrictEqual(t.get('a.b.cd.npmrc', fakeFilenameAttributes), ['Key1.a.b.cd.js', 'Key3.a.b.c.js']);
            assert.deepStrictEqual(t.get('a.b.c.d.npmrc', fakeFilenameAttributes), ['Key1.a.b.c.d.js', 'Key3.a.b.c..js']);
        });
        test('emptyMatches', () => {
            const t = new explorerFileNestingTrie_1.PreTrie();
            t.add('package*json', 'package');
            assert.deepStrictEqual(t.get('package.json', fakeFilenameAttributes), ['package']);
            assert.deepStrictEqual(t.get('packagejson', fakeFilenameAttributes), ['package']);
            assert.deepStrictEqual(t.get('package-lock.json', fakeFilenameAttributes), ['package']);
        });
    });
    suite('StarTrie', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const assertMapEquals = (actual, expected) => {
            const actualStr = [...actual.entries()].map(e => `${e[0]} => [${[...e[1].keys()].join()}]`);
            const expectedStr = Object.entries(expected).map(e => `${e[0]}: [${[e[1]].join()}]`);
            const bigMsg = actualStr + '===' + expectedStr;
            assert.strictEqual(actual.size, Object.keys(expected).length, bigMsg);
            for (const parent of actual.keys()) {
                const act = actual.get(parent);
                const exp = expected[parent];
                const str = [...act.keys()].join() + '===' + exp.join();
                const msg = bigMsg + '\n' + str;
                assert(act.size === exp.length, msg);
                for (const child of exp) {
                    assert(act.has(child), msg);
                }
            }
        };
        test('does added extension nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${capture}.*']],
            ]);
            const nesting = t.nest([
                'file',
                'file.json',
                'boop.test',
                'boop.test1',
                'boop.test.1',
                'beep',
                'beep.test1',
                'beep.boop.test1',
                'beep.boop.test2',
                'beep.boop.a',
            ], 'mydir');
            assertMapEquals(nesting, {
                'file': ['file.json'],
                'boop.test': ['boop.test.1'],
                'boop.test1': [],
                'beep': ['beep.test1', 'beep.boop.test1', 'beep.boop.test2', 'beep.boop.a']
            });
        });
        test('does ext specific nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.ts', ['${capture}.js']],
                ['*.js', ['${capture}.map']],
            ]);
            const nesting = t.nest([
                'a.ts',
                'a.js',
                'a.jss',
                'ab.js',
                'b.js',
                'b.map',
                'c.ts',
                'c.js',
                'c.map',
                'd.ts',
                'd.map',
            ], 'mydir');
            assertMapEquals(nesting, {
                'a.ts': ['a.js'],
                'ab.js': [],
                'a.jss': [],
                'b.js': ['b.map'],
                'c.ts': ['c.js', 'c.map'],
                'd.ts': [],
                'd.map': [],
            });
        });
        test('handles loops', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.a', ['${capture}.b', '${capture}.c']],
                ['*.b', ['${capture}.a']],
                ['*.c', ['${capture}.d']],
                ['*.aa', ['${capture}.bb']],
                ['*.bb', ['${capture}.cc', '${capture}.dd']],
                ['*.cc', ['${capture}.aa']],
                ['*.dd', ['${capture}.ee']],
            ]);
            const nesting = t.nest([
                '.a', '.b', '.c', '.d',
                'a.a', 'a.b', 'a.d',
                'a.aa', 'a.bb', 'a.cc',
                'b.aa', 'b.bb',
                'c.bb', 'c.cc',
                'd.aa', 'd.cc',
                'e.aa', 'e.bb', 'e.dd', 'e.ee',
                'f.aa', 'f.bb', 'f.cc', 'f.dd', 'f.ee',
            ], 'mydir');
            assertMapEquals(nesting, {
                '.a': [], '.b': [], '.c': [], '.d': [],
                'a.a': [], 'a.b': [], 'a.d': [],
                'a.aa': [], 'a.bb': [], 'a.cc': [],
                'b.aa': ['b.bb'],
                'c.bb': ['c.cc'],
                'd.cc': ['d.aa'],
                'e.aa': ['e.bb', 'e.dd', 'e.ee'],
                'f.aa': [], 'f.bb': [], 'f.cc': [], 'f.dd': [], 'f.ee': []
            });
        });
        test('does general bidirectional suffix matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${capture}.js']],
                ['*.js', ['${capture}-vscdoc.js']],
            ]);
            const nesting = t.nest([
                'a-vsdoc.js',
                'a.js',
                'b.js',
                'b-vscdoc.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'a-vsdoc.js': ['a.js'],
                'b.js': ['b-vscdoc.js'],
            });
        });
        test('does general bidirectional prefix matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['vsdoc-*.js', ['${capture}.js']],
                ['*.js', ['vscdoc-${capture}.js']],
            ]);
            const nesting = t.nest([
                'vsdoc-a.js',
                'a.js',
                'b.js',
                'vscdoc-b.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'vsdoc-a.js': ['a.js'],
                'b.js': ['vscdoc-b.js'],
            });
        });
        test('does general bidirectional general matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['foo-*-bar.js', ['${capture}.js']],
                ['*.js', ['bib-${capture}-bap.js']],
            ]);
            const nesting = t.nest([
                'foo-a-bar.js',
                'a.js',
                'b.js',
                'bib-b-bap.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'foo-a-bar.js': ['a.js'],
                'b.js': ['bib-b-bap.js'],
            });
        });
        test('does extension specific path segment matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*.js', ['${capture}.*.js']],
            ]);
            const nesting = t.nest([
                'foo.js',
                'foo.test.js',
                'fooTest.js',
                'bar.js.js',
            ], 'mydir');
            assertMapEquals(nesting, {
                'foo.js': ['foo.test.js'],
                'fooTest.js': [],
                'bar.js.js': [],
            });
        });
        test('does exact match nesting', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['package.json', ['.npmrc', 'npm-shrinkwrap.json', 'yarn.lock', '.yarnclean', '.yarnignore', '.yarn-integrity', '.yarnrc']],
                ['bower.json', ['.bowerrc']],
            ]);
            const nesting = t.nest([
                'package.json',
                '.npmrc', 'npm-shrinkwrap.json', 'yarn.lock',
                '.bowerrc',
            ], 'mydir');
            assertMapEquals(nesting, {
                'package.json': [
                    '.npmrc', 'npm-shrinkwrap.json', 'yarn.lock'
                ],
                '.bowerrc': [],
            });
        });
        test('eslint test', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['.eslintrc*', ['.eslint*']],
            ]);
            const nesting1 = t.nest([
                '.eslintrc.json',
                '.eslintignore',
            ], 'mydir');
            assertMapEquals(nesting1, {
                '.eslintrc.json': ['.eslintignore'],
            });
            const nesting2 = t.nest([
                '.eslintrc',
                '.eslintignore',
            ], 'mydir');
            assertMapEquals(nesting2, {
                '.eslintrc': ['.eslintignore'],
            });
        });
        test('basename expansion', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${basename}.doc']],
            ]);
            const nesting1 = t.nest([
                'boop-vsdoc.js',
                'boop-vsdoc.doc',
                'boop.doc',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'boop-vsdoc.js': ['boop-vsdoc.doc'],
                'boop.doc': [],
            });
        });
        test('extname expansion', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*-vsdoc.js', ['${extname}.doc']],
            ]);
            const nesting1 = t.nest([
                'boop-vsdoc.js',
                'js.doc',
                'boop.doc',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'boop-vsdoc.js': ['js.doc'],
                'boop.doc': [],
            });
        });
        test('added segment matcher', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${basename}.*.${extname}']],
            ]);
            const nesting1 = t.nest([
                'some.file',
                'some.html.file',
                'some.html.nested.file',
                'other.file',
                'some.thing',
                'some.thing.else',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'some.file': ['some.html.file', 'some.html.nested.file'],
                'other.file': [],
                'some.thing': [],
                'some.thing.else': [],
            });
        });
        test('added segment matcher (old format)', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['$(basename).*.$(extname)']],
            ]);
            const nesting1 = t.nest([
                'some.file',
                'some.html.file',
                'some.html.nested.file',
                'other.file',
                'some.thing',
                'some.thing.else',
            ], 'mydir');
            assertMapEquals(nesting1, {
                'some.file': ['some.html.file', 'some.html.nested.file'],
                'other.file': [],
                'some.thing': [],
                'some.thing.else': [],
            });
        });
        test('dirname matching', () => {
            const t = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['index.ts', ['${dirname}.ts']],
            ]);
            const nesting1 = t.nest([
                'otherFile.ts',
                'MyComponent.ts',
                'index.ts',
            ], 'MyComponent');
            assertMapEquals(nesting1, {
                'index.ts': ['MyComponent.ts'],
                'otherFile.ts': [],
            });
        });
        test.skip('is fast', () => {
            const bigNester = new explorerFileNestingTrie_1.ExplorerFileNestingTrie([
                ['*', ['${capture}.*']],
                ['*.js', ['${capture}.*.js', '${capture}.map']],
                ['*.jsx', ['${capture}.js']],
                ['*.ts', ['${capture}.js', '${capture}.*.ts']],
                ['*.tsx', ['${capture}.js']],
                ['*.css', ['${capture}.*.css', '${capture}.map']],
                ['*.html', ['${capture}.*.html']],
                ['*.htm', ['${capture}.*.htm']],
                ['*.less', ['${capture}.*.less', '${capture}.css']],
                ['*.scss', ['${capture}.*.scss', '${capture}.css']],
                ['*.sass', ['${capture}.css']],
                ['*.styl', ['${capture}.css']],
                ['*.coffee', ['${capture}.*.coffee', '${capture}.js']],
                ['*.iced', ['${capture}.*.iced', '${capture}.js']],
                ['*.config', ['${capture}.*.config']],
                ['*.cs', ['${capture}.*.cs', '${capture}.cs.d.ts']],
                ['*.vb', ['${capture}.*.vb']],
                ['*.json', ['${capture}.*.json']],
                ['*.md', ['${capture}.html']],
                ['*.mdown', ['${capture}.html']],
                ['*.markdown', ['${capture}.html']],
                ['*.mdwn', ['${capture}.html']],
                ['*.svg', ['${capture}.svgz']],
                ['*.a', ['${capture}.b']],
                ['*.b', ['${capture}.a']],
                ['*.resx', ['${capture}.designer.cs']],
                ['package.json', ['.npmrc', 'npm-shrinkwrap.json', 'yarn.lock', '.yarnclean', '.yarnignore', '.yarn-integrity', '.yarnrc']],
                ['bower.json', ['.bowerrc']],
                ['*-vsdoc.js', ['${capture}.js']],
                ['*.tt', ['${capture}.*']]
            ]);
            const bigFiles = Array.from({ length: 50000 / 6 }).map((_, i) => [
                'file' + i + '.js',
                'file' + i + '.map',
                'file' + i + '.css',
                'file' + i + '.ts',
                'file' + i + '.d.ts',
                'file' + i + '.jsx',
            ]).flat();
            const start = performance.now();
            // const _bigResult =
            bigNester.nest(bigFiles, 'mydir');
            const end = performance.now();
            assert(end - start < 1000, 'too slow...' + (end - start));
            // console.log(bigResult)
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJGaWxlTmVzdGluZ1RyaWUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvdGVzdC9icm93c2VyL2V4cGxvcmVyRmlsZU5lc3RpbmdUcmllLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsTUFBTSxzQkFBc0IsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFFL0UsS0FBSyxDQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDckIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1lBQ3pCLE1BQU0sQ0FBQyxHQUFHLElBQUksaUNBQU8sRUFBRSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLE1BQU0sQ0FBQyxHQUFHLElBQUksaUNBQU8sRUFBRSxDQUFDO1lBQ3hC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