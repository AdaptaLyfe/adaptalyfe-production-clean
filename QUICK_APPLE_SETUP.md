# Quick Apple Developer Setup for Adaptalyfe

## What You Need Right Now

1. **Apple Developer Account** - $99/year subscription
2. **Certificate Signing Request** - I already created this for you: `Adaptalyfe.certSigningRequest`

## 5-Minute Setup Process

### Step 1: Apple Developer Account
- Go to https://developer.apple.com/programs/
- Enroll in Apple Developer Program ($99/year)
- Wait for approval (usually instant for individuals)

### Step 2: Create Distribution Certificate
1. **Login to** https://developer.apple.com/account
2. **Go to** Certificates, Identifiers & Profiles
3. **Certificates** → **+** → **iOS Distribution** 
4. **Upload** the `Adaptalyfe.certSigningRequest` file I created
5. **Download** the certificate
6. **Convert to .p12** (instructions in main guide)

### Step 3: Create App ID
1. **Identifiers** → **+** → **App IDs**
2. **Bundle ID:** `com.adaptalyfe.app`
3. **Name:** Adaptalyfe

### Step 4: Create Provisioning Profile  
1. **Profiles** → **+** → **App Store Distribution**
2. **Select** your App ID and Certificate
3. **Download** the `.mobileprovision` file

### Step 5: Upload to CodeMagic
- Upload both files to CodeMagic Team settings
- Start your iOS build

## Total Time: ~15 minutes
## Cost: $99/year for Apple Developer Program

The `Adaptalyfe.certSigningRequest` file I generated will work perfectly for creating your certificates.