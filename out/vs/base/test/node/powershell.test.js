define(["require", "exports", "assert", "fs", "vs/base/common/platform", "vs/base/node/powershell", "vs/base/test/common/utils"], function (require, exports, assert, fs, platform, powershell_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function checkPath(exePath) {
        // Check to see if the path exists
        let pathCheckResult = false;
        try {
            const stat = fs.statSync(exePath);
            pathCheckResult = stat.isFile();
        }
        catch {
            // fs.exists throws on Windows with SymbolicLinks so we
            // also use lstat to try and see if the file exists.
            try {
                pathCheckResult = fs.statSync(fs.readlinkSync(exePath)).isFile();
            }
            catch {
            }
        }
        assert.strictEqual(pathCheckResult, true);
    }
    if (platform.isWindows) {
        suite('PowerShell finder', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            test('Can find first available PowerShell', async () => {
                const pwshExe = await (0, powershell_1.getFirstAvailablePowerShellInstallation)();
                const exePath = pwshExe?.exePath;
                assert.notStrictEqual(exePath, null);
                assert.notStrictEqual(pwshExe?.displayName, null);
                checkPath(exePath);
            });
            test('Can enumerate PowerShells', async () => {
                const pwshs = new Array();
                for await (const p of (0, powershell_1.enumeratePowerShellInstallations)()) {
                    pwshs.push(p);
                }
                const powershellLog = 'Found these PowerShells:\n' + pwshs.map(p => `${p.displayName}: ${p.exePath}`).join('\n');
                assert.strictEqual(pwshs.length >= 1, true, powershellLog);
                for (const pwsh of pwshs) {
                    checkPath(pwsh.exePath);
                }
                // The last one should always be Windows PowerShell.
                assert.strictEqual(pwshs[pwshs.length - 1].displayName, 'Windows PowerShell', powershellLog);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG93ZXJzaGVsbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS9wb3dlcnNoZWxsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBVUEsU0FBUyxTQUFTLENBQUMsT0FBZTtRQUNqQyxrQ0FBa0M7UUFDbEMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzVCLElBQUksQ0FBQztZQUNKLE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsZUFBZSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1IsdURBQXVEO1lBQ3ZELG9EQUFvRDtZQUNwRCxJQUFJLENBQUM7Z0JBQ0osZUFBZSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2xFLENBQUM7WUFBQyxNQUFNLENBQUM7WUFFVCxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN4QixLQUFLLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQy9CLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3RELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBQSxvREFBdUMsR0FBRSxDQUFDO2dCQUNoRSxNQUFNLE9BQU8sR0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDckMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVsRCxTQUFTLENBQUMsT0FBUSxDQUFDLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzVDLE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxFQUF5QixDQUFDO2dCQUNqRCxJQUFJLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFBLDZDQUFnQyxHQUFFLEVBQUUsQ0FBQztvQkFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZixDQUFDO2dCQUVELE1BQU0sYUFBYSxHQUFHLDRCQUE0QixHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNqSCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztnQkFFM0QsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekIsQ0FBQztnQkFFRCxvREFBb0Q7Z0JBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLG9CQUFvQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzlGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDIn0=