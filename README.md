# 🏎️ Midnight Racers Backend  
Node.js • Express • MySQL • JWT

---

## 📋 Tartalomjegyzék
- A projektről  
- Főbb funkciók  
- Technológiai stack  
- Adatbázis struktúra  
- Projekt struktúra  
- Környezeti változók  
- API végpontok  
- Biztonsági funkciók  
- Használt függőségek  
- Tesztelés  
- Jövőbeli fejlesztések  

---

## 🎯 A projektről
A **Midnight Racers Backend** egy Node.js alapú REST API, amely egy játék/webalkalmazás szerveroldali működését biztosítja.

A rendszer kezeli:
- felhasználók regisztrációját és bejelentkezését  
- profil adatokat  
- híreket (news)  
- galériát (képfeltöltés)  
- frissítéseket (updates)  
- játék statisztikákat és leaderboardot  

JWT alapú hitelesítést és MySQL adatbázist használ.

---

## ✨ Főbb funkciók
- 🔐 Regisztráció és bejelentkezés (JWT + cookie)  
- 👤 Profil kezelés és adatmódosítás  
- 🔑 Jelszó frissítés  
- 📰 Hírek kezelése (CRUD – admin)  
- 🖼️ Képfeltöltés és galéria kezelés  
- 📊 Játék statisztikák mentése  
- 🏆 Leaderboard (top játékosok)  
- ⚙️ Admin jogosultság kezelés  

---

## 🛠️ Technológiai stack

### Backend
- Node.js  
- Express  
- MySQL (mysql2)  
- JSON Web Token (JWT)  
- Multer  

### Egyéb
- bcrypt / bcryptjs  
- cookie-parser  
- cors  
- dotenv  

---

## 🗄️ Adatbázis struktúra

| Tábla | Leírás |
|------|--------|
| user | Felhasználók |
| stats | Pontszámok |
| news | Hírek |
| updates | Frissítések |
| home_cards | Főoldal tartalom |
| about_gallery | Galéria |

---

## 📂 Projekt struktúra

```bash
project-root/
├── index.js
├── uploads/
├── .env
├── package.json
└── package-lock.json
```
---

## 🔧 Környezeti változók
```bash
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
```

---

## 🌐 API végpontok

### 🔐 Auth
- POST /regisztracio – Új felhasználó létrehozása az adatbázisban  
- POST /belepes – Felhasználó bejelentkeztetése és JWT token generálása  
- POST /kijelentkezes – Felhasználó kijelentkeztetése cookie törlésével  

### 👤 Profil
- GET /profil-adatok – A bejelentkezett felhasználó adatainak lekérése  
- PUT /profil-update – Felhasználói adatok (név, email stb.) módosítása  
- PUT /update-password – Felhasználó jelszavának biztonságos frissítése  

### 📰 News
- GET /news – Összes hír lekérése dátum szerint rendezve  
- POST /news (admin) – Új hír létrehozása admin jogosultsággal  
- PUT /news/:id (admin) – Meglévő hír szerkesztése admin által  
- DELETE /news/:id (admin) – Hír törlése admin jogosultsággal  

### 🖼️ Galéria
- GET /about-gallery – Galéria képek lekérése sorrendben  
- POST /about-gallery (admin) – Új kép hozzáadása URL alapján  
- POST /about-gallery/upload (admin) – Kép feltöltése szerverre és mentése  
- DELETE /about-gallery/:id (admin) – Kép törlése adatbázisból és fájlrendszerből  

### 🏠 Home
- GET /home-cards – Főoldali tartalmak lekérése kulcs szerint  
- PUT /home-cards/:id (admin) – Főoldali tartalom módosítása admin által  

### 🔄 Updates
- GET /updates – Frissítések lekérése időrendben  
- POST /updates (admin) – Új frissítés hozzáadása admin által  
- DELETE /updates/:id (admin) – Frissítés törlése admin jogosultsággal  

### 🎮 Game
- GET /my-stats – Bejelentkezett felhasználó legjobb pontszámának lekérése  
- GET /leaderboard – Top 10 játékos listázása pontszám alapján  
- POST /save-score – Játékos pontszámának mentése az adatbázisba  
- POST /login – Játékhoz szükséges egyszerű bejelentkezés user ID visszaadásával 

---

## 🔒 Biztonsági funkciók
- JWT hitelesítés  
- HTTP-only cookie  
- bcrypt jelszó hashelés  
- email validáció  
- fájl feltöltési limit  
- admin jogosultság ellenőrzés  

---

## 📦 Használt függőségek

```bash
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "multer": "^2.1.1",
    "mysql2": "^3.18.1",
    "node-email-verifier": "^4.0.0"
  }
}
```

---

## 🧪 Tesztelés

- Postman
- Frontend integráció
