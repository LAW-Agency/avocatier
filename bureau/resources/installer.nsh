; Page d'accueil de l'installateur, avec l'image du bandeau latéral (resources/installerSidebar.bmp) : par défaut,
; electron-builder ne la montre qu'à la fin de l'installation
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenue dans l'installation de Chez L'Avocatier"
  !define MUI_WELCOMEPAGE_TEXT "Le logiciel des hôtes et de la réception de Chez L'Avocatier : demandes à traiter, planning, clients, encaissements et tarifs.$\r$\n$\r$\nCliquez sur Suivant pour continuer."
  !insertmacro MUI_PAGE_WELCOME
!macroend
