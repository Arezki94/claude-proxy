# 🚀 Claude Proxy - Serveur API

Serveur proxy simple pour contourner les restrictions CORS de l'API Claude.

## 📦 Déploiement sur Railway

### **1. Push sur GitHub**

```bash
cd claude-proxy
git init
git add .
git commit -m "Initial commit - Claude proxy"
git remote add origin https://github.com/TON_USERNAME/claude-proxy.git
git push -u origin main
```

### **2. Déployer sur Railway**

1. Va sur **https://railway.app**
2. Connecte-toi avec GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Sélectionne **claude-proxy**
5. Railway détecte automatiquement Node.js

### **3. Configurer la variable d'environnement**

1. Dans Railway, clique sur ton projet
2. **"Variables"** tab
3. Ajoute : `CLAUDE_API_KEY` = `ta-clé-anthropic`
4. **Save**

### **4. Récupérer l'URL**

1. Railway génère une URL : `https://claude-proxy-production-xxxx.up.railway.app`
2. **Copie cette URL**

### **5. Mettre à jour ton app**

Dans `blog-generator-pommeaudevitesse/src/services/perplexity.ts` :

```javascript
// Ligne 4-5
const API_URL = 'https://claude-proxy-production-xxxx.up.railway.app/api/claude';
```

Rebuild l'app :
```bash
cd blog-generator-pommeaudevitesse
npm run build
```

---

## ✅ C'EST PRÊT !

Ton générateur appelle maintenant le proxy Railway qui appelle Claude API.

**Plus de CORS, tout fonctionne !** 🎉

---

## 💰 Coûts Railway

- **Gratuit** : 500h/mois (largement suffisant)
- Ensuite : ~$5/mois si dépassement

**Pour ton usage (quelques articles/jour) : 100% GRATUIT**

---

## 🔒 Sécurité

- ✅ Clé API côté serveur (invisible pour les users)
- ✅ CORS configuré
- ✅ Pas de limite de requêtes côté proxy
- ✅ Logs Railway pour debug

---

## 🧪 Test

Une fois déployé, teste :

```bash
curl https://ton-url-railway.app/
# Doit retourner : {"status":"ok"}
```
