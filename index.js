require('dotenv').config()

const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const emailValidator = require("node-email-verifier")
const cors = require("cors");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const COOKIE_NAME = 'auth_token'

// ---------- BIZTONSAGI KORLATOK ----------
const MAX_USERNAME_LEN = 32;
const MAX_NAME_LEN = 64;
const MAX_EMAIL_LEN = 254;
const MIN_PASSWORD_LEN = 6;
const MAX_PASSWORD_LEN = 128;
const MAX_TEXT_LEN = 5000;   // news/update tartalom limit

if (!JWT_SECRET) {
    console.error("HIBA: JWT_SECRET nincs beallitva a .env-ben!");
    process.exit(1);
}

const COOKIE_OPTS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeOk = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
        cb(null, extOk && mimeOk);
    }
});

const app = express()

// Alap biztonsagi headerok (minimal "helmet-lite", extra dependency nelkul)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.removeHeader('X-Powered-By');
    next();
});

app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use(cors({
    origin: ["https://midnightracers.netlify.app", "http://localhost:5173"],
    credentials: true
}));
app.use('/uploads', express.static(UPLOADS_DIR));

// ---------- EGYSZERU IN-MEMORY RATE LIMITER ----------
// ~15 probalkozas / 15 perc / IP a belepesi / regisztracios vegpontokra
function createRateLimiter({ windowMs, max, keyFn }) {
    const hits = new Map();
    // takaritas periodikusan
    setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) {
            if (v.reset < now) hits.delete(k);
        }
    }, windowMs).unref?.();

    return (req, res, next) => {
        const key = keyFn ? keyFn(req) : (req.ip || req.connection.remoteAddress || 'unknown');
        const now = Date.now();
        let rec = hits.get(key);
        if (!rec || rec.reset < now) {
            rec = { count: 0, reset: now + windowMs };
            hits.set(key, rec);
        }
        rec.count++;
        if (rec.count > max) {
            return res.status(429).json({ message: "Tul sok probalkozas, probald kesobb." });
        }
        next();
    };
}

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 15 });
const scoreLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

// ---------- AUTH MIDDLEWARE (cookie VAGY Bearer token) ----------
function auth(req, res, next) {
    let token = req.cookies[COOKIE_NAME];
    if (!token) {
        const h = req.headers['authorization'] || '';
        if (h.startsWith('Bearer ')) token = h.slice(7).trim();
    }
    if (!token) {
        return res.status(401).json({ message: "Nem vagy bejelentkezve" });
    }
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ message: "Nem érvényes token" });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    next();
}

// ---------- INPUT HELPEREK ----------
const isStr = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
const clean = (v) => (typeof v === 'string' ? v.trim() : v);

app.get('/', (req, res) => {
    res.send("hi")
})

// ---------- REGISZTRACIO ----------
app.post('/regisztracio', authLimiter, async (req, res) => {
    const User_Name = clean(req.body.User_Name);
    const First_Name = clean(req.body.First_Name);
    const Last_Name = clean(req.body.Last_Name);
    const Email = clean(req.body.Email);
    const Password = req.body.Password;
    // BIZTONSAG: Is_Admin-t SOHA nem vesszuk at a klienstol.
    const Is_Admin = 0;

    if (!isStr(User_Name, MAX_USERNAME_LEN) ||
        !isStr(First_Name, MAX_NAME_LEN) ||
        !isStr(Last_Name, MAX_NAME_LEN) ||
        !isStr(Email, MAX_EMAIL_LEN) ||
        typeof Password !== 'string') {
        return res.status(400).json({ message: "Hiányzó vagy hibás adat(ok)" });
    }

    if (Password.length < MIN_PASSWORD_LEN || Password.length > MAX_PASSWORD_LEN) {
        return res.status(400).json({ message: `A jelszó ${MIN_PASSWORD_LEN}-${MAX_PASSWORD_LEN} karakter közt legyen` });
    }

    // egyszeru username szabaly: betu/szam/_/.-
    if (!/^[A-Za-z0-9_.-]+$/.test(User_Name)) {
        return res.status(400).json({ message: "A felhasználónév csak betűket, számokat, _, . és - karaktereket tartalmazhat" });
    }

    try {
        const isValid = await emailValidator(Email)
        if (!isValid) {
            return res.status(406).json({ message: "Nem valos emailt adtal meg" })
        }

        const [exist] = await pool.query('SELECT User_Id FROM user WHERE Email = ? OR User_Name = ?', [Email, User_Name]);
        if (exist.length > 0) {
            return res.status(402).json({ message: 'Mar foglalt az email vagy a felhasznalonev' });
        }

        const hash = await bcrypt.hash(Password, 12);
        const [result] = await pool.query(
            'INSERT INTO user (User_Name, First_Name, Last_Name, Email, Password, Is_Admin) VALUES (?,?,?,?,?,?)',
            [User_Name, First_Name, Last_Name, Email, hash, Is_Admin]
        );

        return res.status(200).json({ result: true, message: "Sikeres regisztráció!", id: result.insertId });

    } catch (error) {
        console.error("ADATBÁZIS HIBA:", error);
        return res.status(500).json({ message: "Szerver hiba történt" });
    }
});

// ---------- BEJELENTKEZES ----------
app.post('/belepes', authLimiter, async (req, res) => {
    const User_Name = clean(req.body.User_Name);
    const Password = req.body.Password;
    if (!isStr(User_Name, MAX_USERNAME_LEN) || typeof Password !== 'string' || Password.length === 0) {
        return res.status(400).json({ message: "Hiányos belépési adatok!" });
    }
    try {
        const [rows] = await pool.query('SELECT User_Id, User_Name, Password, Is_Admin FROM user WHERE User_Name = ?', [User_Name]);

        // Generikus hibauzenet, hogy ne lehessen user-enumeraciot csinalni
        const failMsg = "Helytelen felhasználónév vagy jelszó!";

        if (rows.length === 0) {
            // "idozitesi" tamadas kivedese - bcrypt.compare dummy hash-el
            await bcrypt.compare(Password, '$2a$12$CwTycUXWue0Thq9StjUM0uJ8.kG8XzFfY7jh6tM5I1jA1g5Z6rY0O');
            return res.status(401).json({ message: failMsg });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(Password, user.Password);

        if (!ok) {
            return res.status(401).json({ message: failMsg });
        }

        const token = jwt.sign(
            { id: user.User_Id, name: user.User_Name, is_admin: parseInt(user.Is_Admin) },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

        return res.status(200).json({
            result: true,
            message: "Sikeres belépés!",
            token, // cross-origin eseten fallback Bearer-hez
            user: { name: user.User_Name, is_admin: parseInt(user.Is_Admin) }
        });

    } catch (error) {
        console.error("Belépés hiba:", error);
        return res.status(500).json({ message: "Szerverhiba!" });
    }
});

// ---------- KIJELENTKEZES ----------
app.post('/kijelentkezes', auth, (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
    });
    res.status(200).json({ message: "Sikeres kijelentkezés" })
})

// ---------- /me: a frontend ebbol olvassa a megbizhato user infot ----------
app.get('/me', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT User_Id, User_Name, Is_Admin FROM user WHERE User_Id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Felhasználó nem található" });
        }
        const u = rows[0];
        res.status(200).json({
            id: u.User_Id,
            name: u.User_Name,
            is_admin: parseInt(u.Is_Admin)
        });
    } catch (error) {
        console.error("/me hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// ---------- SAJÁT PROFIL ----------
app.get('/profil-adatok', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT User_Name, First_Name, Last_Name, Email FROM user WHERE User_Id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Felhasználó nem található" });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Profil lekérés hiba:", error);
        res.status(500).json({ message: "Szerverhiba a lekérésnél" });
    }
});

// ---------- PROFIL UPDATE ----------
app.put('/profil-update', auth, async (req, res) => {
    const { field } = req.body;
    const value = clean(req.body.value);
    const allowedFields = ['First_Name', 'Last_Name', 'User_Name', 'Email'];

    if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Tiltott mezőmódosítás!" });
    }

    // hossz limitek mezo szerint
    const limits = { First_Name: MAX_NAME_LEN, Last_Name: MAX_NAME_LEN, User_Name: MAX_USERNAME_LEN, Email: MAX_EMAIL_LEN };
    if (!isStr(value, limits[field])) {
        return res.status(400).json({ message: "Érvénytelen érték" });
    }
    if (field === 'User_Name' && !/^[A-Za-z0-9_.-]+$/.test(value)) {
        return res.status(400).json({ message: "Érvénytelen felhasználónév" });
    }
    if (field === 'Email') {
        try {
            const isValid = await emailValidator(value);
            if (!isValid) return res.status(400).json({ message: "Nem érvényes email cím" });
        } catch { return res.status(400).json({ message: "Email ellenőrzési hiba" }); }
    }

    try {
        // uniqueness check User_Name-re es Email-re
        if (field === 'User_Name' || field === 'Email') {
            const col = field;
            const [exist] = await pool.query(`SELECT User_Id FROM user WHERE ${col} = ? AND User_Id <> ?`, [value, req.user.id]);
            if (exist.length > 0) {
                return res.status(409).json({ message: "Ez a(z) " + col + " már foglalt" });
            }
        }
        const sql = `UPDATE user SET ${field} = ? WHERE User_Id = ?`;
        await pool.query(sql, [value, req.user.id]);
        res.status(200).json({ result: true, message: "Sikeres frissítés!" });
    } catch (error) {
        console.error("Update hiba:", error);
        res.status(500).json({ message: "Hiba az adatbázis frissítésekor" });
    }
});

// ---------- JELSZÓ UPDATE ----------
app.put('/update-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        return res.status(400).json({ result: false, message: "Hiányzó adatok!" });
    }
    if (newPassword.length < MIN_PASSWORD_LEN || newPassword.length > MAX_PASSWORD_LEN) {
        return res.status(400).json({ result: false, message: `Az új jelszó ${MIN_PASSWORD_LEN}-${MAX_PASSWORD_LEN} karakter közt legyen` });
    }

    try {
        const [rows] = await pool.query('SELECT Password FROM user WHERE User_Id = ?', [req.user.id]);

        if (rows.length === 0) {
            return res.status(404).json({ result: false, message: "Felhasználó nem található!" });
        }

        const isMatch = await bcrypt.compare(currentPassword, rows[0].Password);
        if (!isMatch) {
            return res.status(401).json({ result: false, message: "A jelenlegi jelszó helytelen!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE user SET Password = ? WHERE User_Id = ?', [hashedNewPassword, req.user.id]);

        res.status(200).json({ result: true, message: "Jelszó sikeresen frissítve!" });

    } catch (error) {
        console.error("Jelszó update hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba a jelszó frissítésekor" });
    }
});

// ---------- FIÓK TÖRLÉSE ----------
// A felhasznalo sajat fiokjanak torlese. Jelszo megerositest kerunk
// (mert ez megforditthatatlan muvelet), es takaritjuk a kapcsolodo
// statisztikakat is. Cookie-t is torlunk.
app.delete('/profil-delete', auth, async (req, res) => {
    const { currentPassword } = req.body;
    if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
        return res.status(400).json({ result: false, message: "Jelszó megadása kötelező!" });
    }
    try {
        const [rows] = await pool.query('SELECT Password FROM user WHERE User_Id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ result: false, message: "Felhasználó nem található!" });
        }
        const isMatch = await bcrypt.compare(currentPassword, rows[0].Password);
        if (!isMatch) {
            return res.status(401).json({ result: false, message: "Hibás jelszó!" });
        }
        // Kapcsolodo rekordok elotte (stats FK miatt)
        await pool.query('DELETE FROM stats WHERE User_Id = ?', [req.user.id]);
        await pool.query('DELETE FROM user  WHERE User_Id = ?', [req.user.id]);

        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        });
        res.status(200).json({ result: true, message: "Fiók törölve!" });
    } catch (error) {
        console.error("Profil törlés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba törlés közben" });
    }
});

// ---------- HOME KÁRTYÁK ----------
app.get('/home-cards', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM home_cards');
        const result = {};
        rows.forEach(row => { result[row.kulcs] = { id: row.id, tartalom: row.tartalom }; });
        res.status(200).json(result);
    } catch (error) {
        console.error("Home cards hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.put('/home-cards/:id', auth, requireAdmin, async (req, res) => {
    const tartalom = clean(req.body.tartalom);
    if (!isStr(tartalom, MAX_TEXT_LEN)) return res.status(400).json({ result: false, message: "Érvénytelen tartalom" });
    try {
        await pool.query('UPDATE home_cards SET tartalom = ? WHERE id = ?', [tartalom, req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("Home cards update hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ---------- NEWS ----------
app.get('/news', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, cim, tartalom, DATE_FORMAT(datum, "%Y.%m.%d") as datum FROM news ORDER BY datum DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("News lekérés hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.post('/news', auth, requireAdmin, async (req, res) => {
    const cim = clean(req.body.cim);
    const tartalom = clean(req.body.tartalom);
    const datum = clean(req.body.datum);
    if (!isStr(cim, 200) || !isStr(tartalom, MAX_TEXT_LEN) || !isStr(datum, 32)) {
        return res.status(400).json({ result: false, message: "Hiányzó vagy hibás adatok!" });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO news (cim, tartalom, datum) VALUES (?, ?, ?)',
            [cim, tartalom, datum]
        );
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        console.error("News hozzáadás hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

app.put('/news/:id', auth, requireAdmin, async (req, res) => {
    const cim = clean(req.body.cim);
    const tartalom = clean(req.body.tartalom);
    const datum = clean(req.body.datum);
    if (!isStr(cim, 200) || !isStr(tartalom, MAX_TEXT_LEN) || !isStr(datum, 32)) {
        return res.status(400).json({ result: false, message: "Hiányzó vagy hibás adatok!" });
    }
    try {
        await pool.query(
            'UPDATE news SET cim = ?, tartalom = ?, datum = ? WHERE id = ?',
            [cim, tartalom, datum, req.params.id]
        );
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("News frissítés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

app.delete('/news/:id', auth, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("News törlés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ---------- ABOUT GALLERY ----------
app.get('/about-gallery', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM about_gallery ORDER BY sorrend ASC, id ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Gallery lekérés hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.post('/about-gallery', auth, requireAdmin, async (req, res) => {
    const url = clean(req.body.url);
    if (!isStr(url, 500)) return res.status(400).json({ result: false, message: "Hiányzó URL!" });
    try {
        const [result] = await pool.query('INSERT INTO about_gallery (url) VALUES (?)', [url]);
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        console.error("Gallery hozzáadás hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

app.post('/about-gallery/upload', auth, requireAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ result: false, message: "Nincs fájl!" });
    const url = `/uploads/${req.file.filename}`;
    try {
        const [result] = await pool.query('INSERT INTO about_gallery (url) VALUES (?)', [url]);
        res.status(200).json({ result: true, id: result.insertId, url });
    } catch (error) {
        console.error("Gallery feltöltés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

app.delete('/about-gallery/:id', auth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT url FROM about_gallery WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].url.startsWith('/uploads/')) {
            // path traversal vedekezes: csak a basename-t hasznaljuk
            const safeName = path.basename(rows[0].url);
            const filePath = path.join(UPLOADS_DIR, safeName);
            // Biztositsuk, hogy a filePath tenyleg az UPLOADS_DIR-en belul van
            if (filePath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await pool.query('DELETE FROM about_gallery WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("Gallery törlés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ---------- UPDATES ----------
app.get('/updates', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, DATE_FORMAT(datum, "%Y-%m-%d") as datum, szoveg FROM updates ORDER BY datum DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Updates lekérés hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.post('/updates', auth, requireAdmin, async (req, res) => {
    const datum = clean(req.body.datum);
    const szoveg = clean(req.body.szoveg);
    if (!isStr(datum, 32) || !isStr(szoveg, MAX_TEXT_LEN)) {
        return res.status(400).json({ result: false, message: "Hiányzó vagy hibás adatok!" });
    }
    try {
        const [result] = await pool.query('INSERT INTO updates (datum, szoveg) VALUES (?, ?)', [datum, szoveg]);
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        console.error("Update hozzáadás hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

app.delete('/updates/:id', auth, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM updates WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("Update törlés hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ---------- STATS ----------
app.get('/my-stats', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT MAX(Score) as Score FROM stats WHERE User_Id = ?',
            [req.user.id]
        );
        res.status(200).json({ Score: rows[0]?.Score || 0 });
    } catch (error) {
        console.error("My-stats hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.get('/leaderboard', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.User_Name, MAX(s.Score) as Score
            FROM stats s
            JOIN user u ON s.User_Id = u.User_Id
            GROUP BY s.User_Id, u.User_Name
            ORDER BY Score DESC
            LIMIT 10
        `);
        res.json(rows);
    } catch (error) {
        console.error("Leaderboard hiba:", error);
        res.status(500).json({ error: "Szerverhiba" });
    }
});

// ---------- ADMIN: USER LISTA + PROMOTE/DEMOTE ----------
// Igy van legalis modja adminok kezeleshez, kozvetlen DB hozzaferes nelkul.
app.get('/admin/users', auth, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT User_Id, User_Name, First_Name, Last_Name, Email, Is_Admin FROM user ORDER BY User_Id ASC'
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error("Admin users hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

app.put('/admin/users/:id/admin', auth, requireAdmin, async (req, res) => {
    const targetId = parseInt(req.params.id);
    const makeAdmin = req.body.is_admin === 1 || req.body.is_admin === true ? 1 : 0;
    if (!Number.isInteger(targetId)) {
        return res.status(400).json({ message: "Érvénytelen azonosító" });
    }
    // ne vehesse el sajat magatol az admint az utolso admin
    if (targetId === req.user.id && makeAdmin === 0) {
        const [rows] = await pool.query('SELECT COUNT(*) as c FROM user WHERE Is_Admin = 1');
        if (rows[0].c <= 1) {
            return res.status(400).json({ message: "Nem vonhatod el a sajat admin jogod, ha te vagy az utolso admin" });
        }
    }
    try {
        await pool.query('UPDATE user SET Is_Admin = ? WHERE User_Id = ?', [makeAdmin, targetId]);
        res.status(200).json({ result: true });
    } catch (error) {
        console.error("Admin promote hiba:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// ---------- GAME ENDPOINTS (JWT-vel vedve) ----------
// /user es /stats (publikus listak) MEGSZUNTETVE - a /leaderboard + /my-stats helyettesiti,
// illetve admin-only /admin/users van a userek listajara.

// A jatek kliens bejelentkezik, es JWT tokent kap. Cookie-t NEM hasznalunk,
// mert lehet hogy natív kliens (Unity/Godot/exe) hívja.
app.post('/login', authLimiter, async (req, res) => {
    const username = clean(req.body.username);
    const password = req.body.password;
    if (!isStr(username, MAX_USERNAME_LEN) || typeof password !== 'string' || password.length === 0) {
        return res.send({ success: false, message: "Hiányzó adatok!" });
    }
    try {
        const [rows] = await pool.query('SELECT User_Id, User_Name, Password, Is_Admin FROM user WHERE User_Name = ?', [username]);
        const failMsg = "Helytelen felhasználónév vagy jelszó!";
        if (rows.length === 0) {
            await bcrypt.compare(password, '$2a$12$CwTycUXWue0Thq9StjUM0uJ8.kG8XzFfY7jh6tM5I1jA1g5Z6rY0O');
            return res.send({ success: false, message: failMsg });
        }
        const ok = await bcrypt.compare(password, rows[0].Password);
        if (!ok) return res.send({ success: false, message: failMsg });

        const token = jwt.sign(
            { id: rows[0].User_Id, name: rows[0].User_Name, is_admin: parseInt(rows[0].Is_Admin) },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        // NEM adjuk vissza a userId-t - a jatek a tokent hasznalja es a /save-score a tokenbol olvassa
        res.send({ success: true, token });
    } catch (error) {
        console.error("Game login hiba:", error);
        res.status(500).send({ success: false, message: "Szerverhiba" });
    }
});

// Csak bejelentkezett user mentheti SAJAT magara a score-t.
app.post('/save-score', auth, scoreLimiter, async (req, res) => {
    const score = Number(req.body.score);
    if (!Number.isFinite(score) || score < 0 || score > 10_000_000) {
        return res.status(400).send({ success: false, message: "Érvénytelen score!" });
    }
    try {
        await pool.query('INSERT INTO Stats (User_Id, Score) VALUES (?, ?)', [req.user.id, Math.floor(score)]);
        res.send({ success: true });
    } catch (error) {
        console.error("Score mentés hiba:", error);
        res.status(500).send({ success: false, message: "Szerverhiba" });
    }
});

// ---------- 404 + GLOBAL ERROR HANDLER ----------
app.use((req, res) => {
    res.status(404).json({ message: "Ismeretlen végpont" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("Nem kezelt hiba:", err);
    res.status(500).json({ message: "Szerverhiba" });
});

app.listen(PORT, () => {
    console.log(`Megy a BackEnd ezen a porton: ${PORT}  (੭˶◕ω⁠◕)੭`)
});
