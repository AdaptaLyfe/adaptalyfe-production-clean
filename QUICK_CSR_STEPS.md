# Quick CSR Generation for Apple Developer

## Fastest Method: Mac Users

1. **Open Keychain Access** (Applications > Utilities)
2. **Menu**: Keychain Access > Certificate Assistant > Request Certificate from CA
3. **Email**: Your Apple Developer account email
4. **Name**: Adaptalyfe Development
5. **Save to disk** and **specify key pair info**
6. **Key size**: 2048 bits, **Algorithm**: RSA
7. **Save as**: `Adaptalyfe_CSR.certSigningRequest`

## Alternative: Online Generator

If you don't have a Mac:

1. **Go to**: https://www.sslshopper.com/csr-generator.html
2. **Fill in**:
   - Common Name: Adaptalyfe Development
   - Organization: Adaptalyfe  
   - Email: your-apple-developer-email
   - Country: US (or your country)
   - State/City: Your location
3. **Generate CSR**
4. **Download** the .csr file

## Upload to Apple

1. **Go to**: https://developer.apple.com/account/
2. **Navigate**: Certificates, Identifiers & Profiles > Certificates
3. **Click**: + button
4. **Select**: iOS Distribution (for App Store)
5. **Upload**: Your CSR file
6. **Download**: The generated certificate

## What You'll Get

After uploading CSR:
- **Development Certificate** - for testing
- **Distribution Certificate** - for App Store submission
- **Push Notification Certificate** - for notifications

## Why Apple Needs This

The CSR proves you own the private key that will sign your iOS app. This creates a secure chain of trust from Apple to your app.

Your CSR file enables Apple to generate the certificates needed for iOS app submission.