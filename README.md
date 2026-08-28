# CR3@TIX-JARVIS V1

Nouvelle base propre de CR3@TIX-JARVIS.

## Objectif V1

Un assistant visuel React Native destiné à Android, avec une version web de prévisualisation publiée sur GitHub Pages.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- TypeScript strict
- React Native Web
- GitHub Pages pour la prévisualisation

## Prototype actuel

- interface mobile sombre
- avatar humanoïde énergétique cyan/bleu
- yeux, bouche et cœur orange/ambre
- cœur placé sous le pectoral gauche de l'avatar
- particules et halos animés
- moteur d'états : IDLE, WAKE, LISTENING, UNDERSTANDING, THINKING, SPEAKING, ACTION, ERROR
- bouche plus active pendant SPEAKING
- erreur : transition orange vers rouge puis retour orange
- vibration d'erreur réservée à Android

## Développement

```bash
npm install
npm run start
```

Web :

```bash
npm run web
```

Android :

```bash
npm run android
```

## GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` exporte automatiquement la version web et la publie sur GitHub Pages à chaque push sur `main`.

URL prévue :

https://kevinlabens-del.github.io/assistant-jarvis/

---

CR3@TIX-JARVIS — V1 foundation
