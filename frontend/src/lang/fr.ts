const fr = {
  appName: "QueryBot",
  startConversation: "Commencez une conversation",
  askAnything: "Posez-moi une question, téléversez des documents ou demandez de l'aide !",
  searchPlaceholder: "Rechercher dans la conversation...",
  clearConversationConfirm: "Êtes-vous sûr de vouloir effacer la conversation en cours ?",
  clearConversation: "Effacer la conversation",
  theme: "Thème",
  search: "Rechercher",
  uploadFile: "Téléverser un fichier",
  typeMessage: "Écrivez votre message...",
  connecting: "Connexion au serveur...",
  send: "Envoyer le message",
  pressEnter: "Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne",
  processingFiles: "Traitement des fichiers...",
  thinking: "Réflexion en cours...",
  fileUploaded: (filename: string) => `Le fichier \"${filename}\" a été téléversé et traité avec succès. Vous pouvez maintenant poser des questions sur son contenu.`,
  fileUploadFailed: (filename: string, error: string) => `Échec du téléversement de \"${filename}\" : ${error}`,
  connectionStatus: {
    connected: "Connecté",
    disconnected: "Déconnecté"
  },
  language: "Langue",
  english: "Anglais",
  french: "Français"
}

export default fr;
