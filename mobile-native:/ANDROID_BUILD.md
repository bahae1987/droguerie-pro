# Android APK / Play Store

## Générer APK interne
1. Installer Node.js + Android Studio.
2. Dans le dossier `mobile-native` :
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
3. Dans Android Studio :
   Build > Generate Signed Bundle / APK > APK.
4. Copier le fichier APK signé ici :
   frontend/public/mobile/drogueriepro-android.apk

## Play Store
Pour Play Store, générer AAB au lieu d’APK :
Build > Generate Signed Bundle / APK > Android App Bundle.
