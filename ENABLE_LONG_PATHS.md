# Enable Windows Long Paths

The AI installation failed due to Windows Long Path limitation. Here's how to fix it:

## Option 1: Enable Long Paths (Recommended)

### Method A - Using Registry Editor:
1. Press `Win + R`
2. Type `regedit` and press Enter
3. Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
4. Find `LongPathsEnabled`
5. Double-click it and set value to `1`
6. Click OK
7. **Restart your computer**

### Method B - Using PowerShell (Run as Administrator):
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```
Then restart your computer.

### Method C - Using Group Policy:
1. Press `Win + R`
2. Type `gpedit.msc` and press Enter
3. Navigate to: Computer Configuration > Administrative Templates > System > Filesystem
4. Double-click "Enable Win32 long paths"
5. Select "Enabled"
6. Click OK
7. **Restart your computer**

## Option 2: Use Alternative Installation (Temporary Workaround)

If you can't enable long paths right now, we can:

1. **Disable AI Validation** (keep current setup)
   - App works perfectly without AI
   - Enable it later when long paths are enabled

2. **Use Cloud AI Service** (future enhancement)
   - Use external API for validation
   - No local installation needed

## After Enabling Long Paths:

1. Restart your computer
2. Run: `install-ai.bat`
3. Or manually: `pip install transformers torch torchvision Pillow`

## Verify Long Paths are Enabled:

```powershell
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled"
```

Should return: `LongPathsEnabled : 1`

## Current Status:

✅ Python installed
✅ pip installed  
❌ AI dependencies (blocked by long path issue)

## Recommendation:

**For now**: Keep AI validation disabled (`ENABLE_AI_VALIDATION=false`)
- Your app works perfectly
- All features functional
- No AI validation

**Later**: Enable long paths and install AI dependencies
- Follow steps above
- Run install-ai.bat
- Enable AI validation
