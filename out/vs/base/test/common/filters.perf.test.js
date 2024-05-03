define(["require", "exports", "vs/amdX", "vs/base/common/filters", "vs/base/common/network"], function (require, exports, amdX_1, filters, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const patterns = ['cci', 'ida', 'pos', 'CCI', 'enbled', 'callback', 'gGame', 'cons', 'zyx', 'aBc'];
    const _enablePerf = false;
    function perfSuite(name, callback) {
        if (_enablePerf) {
            suite(name, callback);
        }
    }
    perfSuite('Performance - fuzzyMatch', async function () {
        const uri = network_1.FileAccess.asBrowserUri('vs/base/test/common/filters.perf.data').toString(true);
        const { data } = await (0, amdX_1.importAMDNodeModule)(uri, '');
        // suiteSetup(() => console.profile());
        // suiteTeardown(() => console.profileEnd());
        console.log(`Matching ${data.length} items against ${patterns.length} patterns (${data.length * patterns.length} operations) `);
        function perfTest(name, match) {
            test(name, () => {
                const t1 = Date.now();
                let count = 0;
                for (let i = 0; i < 2; i++) {
                    for (const pattern of patterns) {
                        const patternLow = pattern.toLowerCase();
                        for (const item of data) {
                            count += 1;
                            match(pattern, patternLow, 0, item, item.toLowerCase(), 0);
                        }
                    }
                }
                const d = Date.now() - t1;
                console.log(name, `${d}ms, ${Math.round(count / d) * 15}/15ms, ${Math.round(count / d)}/1ms`);
            });
        }
        perfTest('fuzzyScore', filters.fuzzyScore);
        perfTest('fuzzyScoreGraceful', filters.fuzzyScoreGraceful);
        perfTest('fuzzyScoreGracefulAggressive', filters.fuzzyScoreGracefulAggressive);
    });
    perfSuite('Performance - IFilter', async function () {
        const uri = network_1.FileAccess.asBrowserUri('vs/base/test/common/filters.perf.data').toString(true);
        const { data } = await (0, amdX_1.importAMDNodeModule)(uri, '');
        function perfTest(name, match) {
            test(name, () => {
                const t1 = Date.now();
                let count = 0;
                for (let i = 0; i < 2; i++) {
                    for (const pattern of patterns) {
                        for (const item of data) {
                            count += 1;
                            match(pattern, item);
                        }
                    }
                }
                const d = Date.now() - t1;
                console.log(name, `${d}ms, ${Math.round(count / d) * 15}/15ms, ${Math.round(count / d)}/1ms`);
            });
        }
        perfTest('matchesFuzzy', filters.matchesFuzzy);
        perfTest('matchesFuzzy2', filters.matchesFuzzy2);
        perfTest('matchesPrefix', filters.matchesPrefix);
        perfTest('matchesContiguousSubString', filters.matchesContiguousSubString);
        perfTest('matchesCamelCase', filters.matchesCamelCase);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVycy5wZXJmLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vZmlsdGVycy5wZXJmLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBUUEsTUFBTSxRQUFRLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVuRyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFFMUIsU0FBUyxTQUFTLENBQUMsSUFBWSxFQUFFLFFBQXFDO1FBQ3JFLElBQUksV0FBVyxFQUFFLENBQUM7WUFDakIsS0FBSyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2QixDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxLQUFLO1FBRTFDLE1BQU0sR0FBRyxHQUFHLG9CQUFVLENBQUMsWUFBWSxDQUFDLHVDQUF1QyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVGLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUEsMEJBQW1CLEVBQXlELEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUU1Ryx1Q0FBdUM7UUFDdkMsNkNBQTZDO1FBRTdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxJQUFJLENBQUMsTUFBTSxrQkFBa0IsUUFBUSxDQUFDLE1BQU0sY0FBYyxJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLGVBQWUsQ0FBQyxDQUFDO1FBRWhJLFNBQVMsUUFBUSxDQUFDLElBQVksRUFBRSxLQUEwQjtZQUN6RCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtn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