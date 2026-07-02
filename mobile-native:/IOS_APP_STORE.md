# iOS App Store / TestFlight

iOS ne permet pas d’installer directement une application native en dehors de l’App Store/TestFlight sauf environnement développeur.

## Pré-requis
- Mac avec Xcode
- Apple Developer Program
- Bundle ID : com.drogueriepro.app

## Génération
1. Dans `mobile-native` :
   npm install
   npx cap add ios
   npx cap sync ios
   npx cap open ios
2. Dans Xcode :
   Product > Archive
3. Publier vers TestFlight ou App Store Connect.
4. Modifier :
   frontend/public/mobile/drogueriepro-ios-install.html
avec le lien TestFlight/App Store.
