# Firebase Setup — Login + Cloud Database (5 minutes)

MonkMode uses **Firebase** for login/logout and to store each user's data in the
cloud, so the same account stays in sync across phone, laptop, any device.

Until you finish these steps the app keeps working in **local-only mode** (data in
this browser, no login). After you paste the keys, a Login screen appears automatically.

---

## 1. Create a Firebase project

1. Go to **https://console.firebase.google.com** and sign in with your Google account.
2. Click **Add project** → give it a name (e.g. `monkmode`) → Continue.
3. Google Analytics is optional — you can turn it off. Click **Create project**.

## 2. Add a Web app & copy the config

1. On the project dashboard, click the **`</>` (Web)** icon.
2. Give it a nickname (e.g. `monkmode-web`) → **Register app**.
3. Firebase shows a `firebaseConfig` object like:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "monkmode.firebaseapp.com",
     projectId: "monkmode",
     storageBucket: "monkmode.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
   };
   ```

4. Open the **`.env`** file in this project and paste each value:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=monkmode.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=monkmode
   VITE_FIREBASE_STORAGE_BUCKET=monkmode.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## 3. Turn on Authentication

1. Left menu → **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Email/Password**.
3. (Optional) Also enable **Google** for the "Continue with Google" button.

## 4. Create the database (Cloud Firestore)

1. Left menu → **Build → Firestore Database → Create database**.
2. Start in **production mode** → pick a location → Enable.
3. Go to the **Rules** tab, replace everything with the rules below, and **Publish**.
   This makes each user able to read/write **only their own** data:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /userState/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

## 5. Restart the dev server

Env changes need a restart:

```bash
npm run dev
```

Open the app — you'll now see the **Login / Sign up** screen. Create an account,
and your tasks, goals, habits, and progress will sync to the cloud and follow you
to any device you log in on.

---

### How your data is stored

- Each account's whole app state (tasks, goals, habits, journal, weight, water,
  profile) is saved as one document at **`userState/{your-uid}`** in Firestore.
- Changes sync **in real time** across devices, and work **offline** — they upload
  when you're back online.
- **Log out** clears this device's local copy; your data stays safe in the cloud
  and returns when you log back in.
