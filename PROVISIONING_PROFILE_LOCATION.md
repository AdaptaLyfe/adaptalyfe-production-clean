# Your Provisioning Profile Location

## File Details:
- **Filename:** `AdaptaLyfe_App_Store_Distribution (3).mobileprovision`
- **Location:** Root directory of your project
- **Size:** 13,074 bytes
- **Bundle ID:** com.adaptalyfe.app

## Upload to CodeMagic:
1. **Download the file** from your project:
   - Right-click on `AdaptaLyfe_App_Store_Distribution (3).mobileprovision` in the file explorer
   - Select "Download"

2. **Upload to CodeMagic:**
   - Go to Team settings → Code signing identities
   - Click "Add provisioning profile"
   - **Reference name:** `ADAPTALYFE_APP_STORE_PROFILE`
   - Upload the downloaded file

## Alternative - Direct Upload:
If you can't download, you can re-download from Apple Developer:
1. Go to https://developer.apple.com/account/resources/profiles/list
2. Find "AdaptaLyfe App Store Distribution"
3. Download the .mobileprovision file
4. Upload to CodeMagic with reference name `ADAPTALYFE_APP_STORE_PROFILE`

## Required Files for CodeMagic:
✅ Certificate: `ADAPTALYFE_DISTRIBUTION_CERT` (uploaded)
❓ Provisioning Profile: `ADAPTALYFE_APP_STORE_PROFILE` (needs upload)

Once both are uploaded, your iOS build should work correctly.