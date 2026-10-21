/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  // Adresse du site imposée à la compilation (fichier bureau/.env), sinon SERVEUR_PAR_DEFAUT (session.ts)
  readonly MAIN_VITE_SERVEUR?: string
}
