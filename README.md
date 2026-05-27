# 🌳 Tapatan — IA & Visualiseur d'Arbre de Décision Interactif

Bienvenue dans l'application **Tapatan**, un jeu de stratégie traditionnel combiné à un outil pédagogique d'intelligence artificielle de pointe ! 

Cette application web moderne (développée avec React et Vite) intègre un visualiseur graphique en temps réel des algorithmes **Minimax** et **Élagage Alpha-Bêta** sous forme d'un arbre de décision interactif.

---

## 🚀 Comment lancer le projet chez soi en local ?

### 📋 Prérequis
Assurez-vous d'avoir installé **Node.js** (version 16 ou supérieure recommandée) sur votre machine. Vous pouvez le télécharger sur [nodejs.org](https://nodejs.org/).

### 💻 Étapes d'installation rapides

1. **Télécharger / Cloner le projet** dans le dossier de votre choix :
   ```bash
   git clone <url-du-depot>
   cd Tapatan
   ```

2. **Installer les dépendances** nécessaires (Vite, React, etc.) :
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement** local :
   ```bash
   npm run dev
   ```

4. **Ouvrir votre navigateur** et rendez-vous sur l'adresse locale affichée dans votre terminal (généralement) :
   👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🎮 Règles du Tapatan

Le Tapatan est un jeu de pions traditionnel qui se joue sur une grille de 3x3 intersections reliées horizontalement, verticalement et diagonalement. Chaque joueur dispose de **3 pions**.

La partie se déroule en deux phases stratégiques :

1. **Phase 1 — Le Placement** :
   Chaque joueur dépose, à tour de rôle, un pion sur l'une des intersections vides du plateau.
2. **Phase 2 — Le Déplacement** :
   Une fois les 3 pions placés, les joueurs déplacent, à tour de rôle, l'un de leurs pions vers une intersection **adjacente vide** connectée par une ligne de la grille.
3. **But du jeu** :
   Le premier joueur qui parvient à aligner ses 3 pions horizontalement, verticalement ou diagonalement remporte instantanément la partie !

---

## 🧠 Comprendre l'Intelligence Artificielle en temps réel

L'application intègre deux algorithmes de décision classiques de la théorie des jeux pour l'IA, que vous pouvez basculer et comparer à tout moment :

* **Minimax pur** : L'IA simule l'intégralité des configurations possibles sur plusieurs coups d'avance et choisit le meilleur chemin en supposant que l'adversaire joue de manière optimale.
* **Élagage Alpha-Bêta** : Une optimisation majeure du Minimax qui permet d'écarter (d'élaguer) les branches inutiles au calcul (les coups visiblement plus mauvais que ce qui a déjà été évalué). Cela permet de diviser par 5 le nombre de cas étudiés et d'anticiper beaucoup plus rapidement !

### 📏 L'Heuristique Réelle
L'IA évalue chaque état du plateau grâce à une formule d'évaluation précise programmée dans [ai.js](file:///d:/Tapatan/src/game/ai.js) :
* **Victoire/Défaite** : $+100$ pour l'IA, $-100$ pour le joueur.
* **Alignements partiels** : $+10$ si l'IA menace d'aligner 3 pions au prochain coup, $-10$ si le joueur a 2 pions alignés (l'IA va immédiatement parer le coup pour se défendre).
* **Contrôle géométrique** : $+3$ si l'IA possède l'intersection centrale de la grille, $-3$ si c'est le joueur.

---

## 🎛️ Fonctionnalités clés de l'interface

* **Séparateur Central Coulissant (Splitter)** : Survolez et faites glisser la démarcation centrale de l'écran pour diviser la vue entre le jeu et l'arbre de décision à votre convenance (50/50 par défaut).
* **Infobulle Flottante Interactive** : Survolez n'importe quel nœud de l'arbre pour faire apparaître une fiche d'information mobile contenant les limites $\alpha$ & $\beta$, ainsi qu'une **mini-grille 3x3** affichant l'état simulé du plateau à cette étape !
* **Zoom et Défilement Natifs** :
  * Utilisez les boutons de zoom ou la molette de votre souris pour naviguer de façon fluide.
  * Utilisez le bouton **`1:1`** pour figer l'arbre à taille réelle et le faire défiler sans aucune miniaturisation.
  * Utilisez le bouton **`Ajuster`** pour faire tenir l'arbre entier dans votre écran.
* **Effet de Construction Progressive** : À chaque coup joué, l'arbre se construit sous vos yeux avec un magnifique effet de cascade de haut en bas selon la profondeur.
