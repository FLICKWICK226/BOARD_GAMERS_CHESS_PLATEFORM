# Debugging: Error Sending Confirmation Email

## 🔍 Analyse du Problème
L'erreur `Error sending confirmation email` que tu rencontres lors de la création d'un utilisateur sur Vercel est une erreur **directe de Supabase Auth**. Elle indique que Supabase a tenté d'envoyer l'email de confirmation mais a échoué.

## 🛠️ Est-ce que n8n est la cause ?
**Non.** D'après ton code (`src/app/actions/auth.ts`), la fonction `signUp` utilise directement la méthode `supabase.auth.signUp()`. 
- **n8n** est configuré dans ton projet pour envoyer les *puzzles quotidiens* via Gmail.
- Le flux d'inscription, lui, dépend exclusivement de la configuration SMTP de ton projet Supabase.

---

## 🚀 Solutions de Dépannage

### 1. Limites du SMTP intégré (Le plus probable)
Par défaut, Supabase fournit un service d'email intégré pour le test. Ce service est **extrêmement limité** :
- **Limite :** 3 emails par heure par projet.
- **Action :** Si tu as fait plusieurs tests d'inscription d'affilée, tu as probablement atteint cette limite. Attends 1 heure ou passe à la solution suivante.

### 2. Configuration d'un SMTP Personnalisé (Recommandé pour la Production)
Pour un déploiement Vercel sérieux, tu **dois** configurer ton propre fournisseur d'email (Resend, SendGrid, Mailgun, etc.).
1. Va sur ton **Dashboard Supabase**.
2. Settings -> **Auth**.
3. Section **SMTP Settings**.
4. Active "Enable Custom SMTP" et entre les informations de ton fournisseur (Host, Port, User, Password).
   - *Conseil :* Utilise **Resend**, c'est gratuit pour les petits volumes et très simple.

### 3. Désactiver la Confirmation d'Email (Pour tester rapidement)
Si tu veux juste vérifier que ton déploiement Vercel fonctionne sans attendre l'email :
1. Dashboard Supabase -> Settings -> **Auth**.
2. Désactive l'option **"Confirm email"**.
3. Les utilisateurs seront créés et connectés immédiatement sans avoir à cliquer sur un lien.
   - ⚠️ *Attention :* À réactiver en production pour éviter les faux comptes.

### 4. Vérification des Variables d'Environnement sur Vercel
Assure-toi que tes variables sont correctement configurées sur Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Si elles sont incorrectes, l'application ne pourrait même pas contacter Supabase, mais vérifie-les quand même par précaution.

---

## 📝 Résumé pour Fixer
Ton code est correct. Le problème est un **paramétrage côté Supabase Cloud**. n8n n'intervient pas dans ce processus précis.

> [!TIP]
> Pour tester n8n, assure-toi que ton instance locale de n8n est accessible depuis internet (via un tunnel comme ngrok ou Cloudflare Tunnel) si Supabase doit lui envoyer des webhooks, ce qui n'est pas le cas actuellement pour l'auth.
