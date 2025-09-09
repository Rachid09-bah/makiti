# Makiti Backend

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```
npm install
```

3. Run in dev:

```
npm run dev
```

4. Build and start:

```
npm run build && npm start
```

Health check: `GET /health`

## Configuration des emails (mot de passe oublié)

Remplir les variables SMTP dans `.env`:

```
APP_WEB_URL=http://localhost:5173
SMTP_HOST=smtp.votre_fournisseur.com
SMTP_PORT=587
SMTP_USER=votre_utilisateur
SMTP_PASS=votre_mot_de_passe
SMTP_SECURE=false
SMTP_FROM="Makiti <no-reply@votredomaine.com>"
```

Notes:
- `APP_WEB_URL` est utilisé pour générer le lien `reset-password?token=...` dans les emails.
- En l’absence de configuration SMTP, l’appli utilise un transport JSON (dev) et ne contacte pas de serveur SMTP.
- En dev, l’endpoint `/auth/forgot-password` renvoie `devToken` dans la réponse pour faciliter les tests.