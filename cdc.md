1. Présentation Générale du Projet
Nom du projet : Gootunes

Type de plateforme : Marketplace de vente de musique en direct (Direct-to-Fan)

Marché ciblé : Congo, République Démocratique du Congo (RDC), Côte d'Ivoire, Cameroun, Sénégal.

Modèle économique : Commission de 20% prélevée par Gootunes sur chaque vente (80% reversés à l'artiste/label).

Moyen de paiement principal : Directement intégré via Mobile Money (MTN Mobile Money, Orange Money, Airtel Money, Wave, M-Pesa selon les pays).

2. Spécifications Techniques & Design
Stack Technique
Base de données & Authentification : Supabase (PostgreSQL, Auth, RLS).

Stockage de fichiers (Audio & Covers) : Cloudflare (R2 Storage / CDN).

Charte Graphique & Design System
Style : Minimaliste, moderne, épuré.

Thème par défaut : Mode Sombre (Dark Theme).

Accents & Boutons : Blanc / Contraste fort.

Thème clair (Light Theme) : Inversement (Fond clair, accents & boutons sombres/noirs).

3. Structure des Interfaces (Sitemap)
A. Landing Page
Interface simple, moderne et incitative.

Présentation du concept (Achat direct d'artistes locaux/africains via Mobile Money).

Appels à l'action distincts : "Explorer la musique" (pour les fans) et "Vendre ma musique" (Création de compte Artiste/Label).

B. Espace Fan & Feed (Navigation Principale)
L'espace utilisateur est articulé autour de 7 pages clés :

Accueil (Feed) : Fil d'actualité musical structuré en sections :

Sorties récentes

Tendances

Artistes en vogue

Albums à la une

Recommandés pour vous

Découvrir : Moteur de recherche avancé (par titres, artistes, albums).

Bibliothèque : Espace personnel regroupant les morceaux et albums achetés (téléchargement ou écoute).

Genres : Classification par styles musicaux (Afrobeats, Coupé-Décalé, Rumba, Makossa, Hip-Hop, etc.).

Nouveautés : Derniers ajouts sur la plateforme.

Playlists : Playlists thématiques ou créées par les fans.

Favoris : Titres et albums mis en coup de cœur par l'utilisateur.

4. Dashboard Artiste & Label
A. Compte Artiste (Gratuit)
Inscription : Gratuite.

Fonctionnalités :

Dashboard avec statistiques d'écoutes et de ventes.

Suivi des revenus générés (Net artiste : 80%).

Publication autonome de Singles et d'Albums.

B. Compte Label (Sur abonnement)
Principe : Le compte Label ne publie pas de morceaux directement sous son propre nom. Il gère un catalogue d'artistes rattachés.

Grille Tarifaire (Abonnement Annuel) :

Formule Label	Nombre d'Artistes	Prix (Valide 1 an)
Starter Label	Jusqu'à 5 artistes	2 999 FCFA / an
Unlimited Label	Artistes illimités	14 999 FCFA / an
5. Module de Publication (Upload)
Lors de la création d'un projet par un artiste ou un label (après sélection de l'artiste concerné), le créateur choisit entre Single ou Album :

                        [ Créer une publication ]
                                    |
            +-----------------------+-----------------------+
            |                                               |
       [ SINGLE ]                                      [ ALBUM ]
            |                                               |
  • Titre de la chanson                           • Titre de l'album
  • Cover Art (Pochette)                          • Cover Art (Pochette)
  • Fichier Audio                                 • Sélection multiple de titres
  • Crédits :                                     • Crédits généraux / par morceau
    - Auteur                                      • Prix global de l'album
    - Compositeur
    - Producteur (Beatmaker)
  • Collaborations / Featurings
  • Prix du Single
Détails du formulaire :
Single : Titre, cover art, fichier audio (format haute qualité), crédits (auteur, compositeur, produit par), mention des collaborateurs (Feat.), fixation du prix de vente.

Album : Titre de l'album, cover art globale, sélection multiple des fichiers audio avec ordre des pistes, crédits par morceau, fixation du prix global de l'album (et/ou prix par titre individuel).

6. Modèle Financier & Retraits
Prélèvement automatique : 20% de commission sur chaque transaction au profit de Gootunes.

Solde Artiste/Label : Mises à jour en temps réel dans le dashboard.

Paiements entrants/sortants : Intégration fluide du Mobile Money (Orange Money, MTN, Wave, Airtel, M-Pesa) pour l'achat instantané par les fans et le retrait des gains par les ayants droit.


