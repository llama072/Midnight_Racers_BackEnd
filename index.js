const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const emailValidator = require("node-email-verifier")
const cors = require("cors");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const PORT = 3000;
const HOST = 'localhost'
const JWT_SECRET = 'qwertzuiop'
const JWT_EXPIRES_IN = '7d'
const COOKIE_NAME = 'auth_token'

const COOKIE_OPTS = {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'midnight_racers'
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
    limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
    }
});

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use('/uploads', express.static(UPLOADS_DIR));

function auth(req, res, next) {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
        console.log("Nincs token a sütiben!");
        return res.status(401).json({ message: "Nem vagy bejelentkezve" });
    }
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        console.log("Hibás token!");
        return res.status(403).json({ message: "Nem érvényes token" });
    }
}

// REGISZTRACIO
app.post('/regisztracio', async (req, res) => {
    const { User_Name, First_Name, Last_Name, Email, Password } = req.body;
    const Is_Admin = parseInt(req.body.Is_Admin);
    console.log("Kapott adatok(Regisztracional):", req.body);

    if (!User_Name || !First_Name || !Last_Name || !Email || !Password || !(Is_Admin === 0 || Is_Admin === 1)) {
        return res.status(400).json({ message: "Hiányzó adat(ok)" });
    }

    try {
        const isValid = await emailValidator(Email)
        if (!isValid) {
            return res.status(406).json({ message: "Nem valos emailt adtal meg" })
        }

        const [exist] = await pool.query('SELECT * FROM user WHERE Email = ? OR User_Name = ?', [Email, User_Name]);
        if (exist.length > 0) {
            return res.status(402).json({ message: 'Már foglalt az email vagy a felhasznalonev' });
        }

        const hash = await bcrypt.hash(Password, 10);
        const regisztracioSQL = 'INSERT INTO user (User_Name, First_Name, Last_Name, Email, Password, Is_Admin) VALUES (?,?,?,?,?,?)';
        const [result] = await pool.query(regisztracioSQL, [User_Name, First_Name, Last_Name, Email, hash, Is_Admin]);

        return res.status(200).json({ result: true, message: "Sikeres regisztráció!", id: result.insertId });

    } catch (error) {
        console.error("ADATBÁZIS HIBA:", error);
        return res.status(500).json({ message: "Szerver hiba történt" });
    }
});

// BEJELENTKEZES
app.post('/belepes', async (req, res) => {
    const { User_Name, Password } = req.body;
    if (!User_Name || !Password) {
        return res.status(400).json({ message: "Hiányos belépési adatok!" });
    }
    try {
        const sql = 'SELECT * FROM user WHERE User_Name = ?';
        const [rows] = await pool.query(sql, [User_Name]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Nincs ilyen felhasználó!" });
        }

        const user = rows[0];
        const ok = await bcrypt.compare(Password, user.Password);

        if (!ok) {
            return res.status(403).json({ message: "Helytelen jelszó!" });
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
            user: { name: user.User_Name, is_admin: parseInt(user.Is_Admin) }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Szerverhiba!" });
    }
});

// KIJELENTKEZES
app.post('/kijelentkezes', auth, async (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.status(200).json({ message: "Sikeres kijelentkezés |_(*)__(*)_|" })
})

// SAJÁT ADATOK LEKÉRÉSE
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

// ADATOK FRISSÍTÉSE
app.put('/profil-update', auth, async (req, res) => {
    const { field, value } = req.body;
    const allowedFields = ['First_Name', 'Last_Name', 'User_Name', 'Email'];

    if (!allowedFields.includes(field)) {
        return res.status(400).json({ message: "Tiltott mezőmódosítás!" });
    }

    try {
        const sql = `UPDATE user SET ${field} = ? WHERE User_Id = ?`;
        await pool.query(sql, [value, req.user.id]);
        res.status(200).json({ result: true, message: "Sikeres frissítés!" });
    } catch (error) {
        console.error("Update hiba:", error);
        res.status(500).json({ message: "Hiba az adatbázis frissítésekor" });
    }
});

// JELSZÓ FRISSÍTÉSE
app.put('/update-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ result: false, message: "Hiányzó adatok!" });
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

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE user SET Password = ? WHERE User_Id = ?', [hashedNewPassword, req.user.id]);

        res.status(200).json({ result: true, message: "Jelszó sikeresen frissítve!" });

    } catch (error) {
        console.error("Jelszó update hiba:", error);
        res.status(500).json({ result: false, message: "Szerverhiba a jelszó frissítésekor" });
    }
});

// HOME KÁRTYÁK LEKÉRÉSE
app.get('/home-cards', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM home_cards');
        const result = {};
        rows.forEach(row => { result[row.kulcs] = { id: row.id, tartalom: row.tartalom }; });
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// HOME KÁRTYA FRISSÍTÉSE (csak admin)
app.put('/home-cards/:id', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    const { tartalom } = req.body;
    try {
        await pool.query('UPDATE home_cards SET tartalom = ? WHERE id = ?', [tartalom, req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// NEWS LEKÉRÉSE
app.get('/news', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, cim, tartalom, DATE_FORMAT(datum, "%Y.%m.%d") as datum FROM news ORDER BY datum DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// ÚJ NEWS HOZZÁADÁSA (csak admin)
app.post('/news', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    const { cim, tartalom, datum } = req.body;
    if (!cim || !tartalom || !datum) {
        return res.status(400).json({ result: false, message: "Hiányzó adatok!" });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO news (cim, tartalom, datum) VALUES (?, ?, ?)',
            [cim, tartalom, datum]
        );
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// NEWS SZERKESZTÉSE (csak admin)
app.put('/news/:id', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    const { cim, tartalom, datum } = req.body;
    if (!cim || !tartalom || !datum) {
        return res.status(400).json({ result: false, message: "Hiányzó adatok!" });
    }
    try {
        await pool.query(
            'UPDATE news SET cim = ?, tartalom = ?, datum = ? WHERE id = ?',
            [cim, tartalom, datum, req.params.id]
        );
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// NEWS TÖRLÉSE (csak admin)
app.delete('/news/:id', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    try {
        await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ABOUT GALLERY LEKÉRÉSE
app.get('/about-gallery', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM about_gallery ORDER BY sorrend ASC, id ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// ABOUT GALLERY KÉP HOZZÁADÁSA (csak admin)
app.post('/about-gallery', auth, async (req, res) => {
    if (req.user.is_admin !== 1) return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    const { url } = req.body;
    if (!url) return res.status(400).json({ result: false, message: "Hiányzó URL!" });
    try {
        const [result] = await pool.query('INSERT INTO about_gallery (url) VALUES (?)', [url]);
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ABOUT GALLERY KÉP FELTÖLTÉSE (csak admin)
app.post('/about-gallery/upload', auth, upload.single('image'), async (req, res) => {
    if (req.user.is_admin !== 1) return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    if (!req.file) return res.status(400).json({ result: false, message: "Nincs fájl!" });
    const url = `/uploads/${req.file.filename}`;
    try {
        const [result] = await pool.query('INSERT INTO about_gallery (url) VALUES (?)', [url]);
        res.status(200).json({ result: true, id: result.insertId, url });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// ABOUT GALLERY KÉP TÖRLÉSE (csak admin)
app.delete('/about-gallery/:id', auth, async (req, res) => {
    if (req.user.is_admin !== 1) return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    try {
        const [rows] = await pool.query('SELECT url FROM about_gallery WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].url.startsWith('/uploads/')) {
            const filePath = path.join(UPLOADS_DIR, path.basename(rows[0].url));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await pool.query('DELETE FROM about_gallery WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// UPDATES LEKÉRÉSE
app.get('/updates', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, DATE_FORMAT(datum, "%Y-%m-%d") as datum, szoveg FROM updates ORDER BY datum DESC'
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// ÚJ UPDATE HOZZÁADÁSA (csak admin)
app.post('/updates', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    const { datum, szoveg } = req.body;
    if (!datum || !szoveg) {
        return res.status(400).json({ result: false, message: "Hiányzó adatok!" });
    }
    try {
        const [result] = await pool.query('INSERT INTO updates (datum, szoveg) VALUES (?, ?)', [datum, szoveg]);
        res.status(200).json({ result: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// UPDATE TÖRLÉSE (csak admin)
app.delete('/updates/:id', auth, async (req, res) => {
    if (req.user.is_admin !== 1) {
        return res.status(403).json({ result: false, message: "Nincs jogosultságod!" });
    }
    try {
        await pool.query('DELETE FROM updates WHERE id = ?', [req.params.id]);
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false, message: "Szerverhiba" });
    }
});

// SAJÁT STATS LEKÉRÉSE
app.get('/my-stats', auth, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT MAX(Score) as Score FROM stats WHERE User_Id = ?',
            [req.user.id]
        );

        res.status(200).json({
            Score: rows[0]?.Score || 0
        });
    } catch (error) {
        console.error("MY-STATS ERROR:", error);
        res.status(500).json({ message: "Szerverhiba" });
    }
});

// LEADERBOARD
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
        console.error("LEADERBOARD ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

// GAME
app.get('/user', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT * FROM User')
        res.send(result)
    } catch (error) {
        res.send(error)
    }
})

app.get('/stats', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT * FROM stats')
        res.send(result)
    } catch (error) {
        res.send(error)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send({ success: false, message: "Hiányzó adatok!" });
    }
    try {
        const [rows] = await pool.query('SELECT User_Id, Password FROM user WHERE User_Name = ?', [username]);
        if (rows.length === 0) {
            return res.send({ success: false, message: "Nincs ilyen felhasználó!" });
        }
        const ok = await bcrypt.compare(password, rows[0].Password);
        if (!ok) {
            return res.send({ success: false, message: "Hibás jelszó!" });
        }
        res.send({ success: true, userId: rows[0].User_Id });
    } catch (error) {
        console.error("Game login hiba:", error);
        res.status(500).send({ success: false, message: "Szerverhiba" });
    }
});

app.post('/save-score', async (req, res) => {
    const { userId, score } = req.body;
    console.log(`Mentési kísérlet -> User: ${userId}, Pont: ${score}`);

    if (!userId || userId === -1) {
        return res.status(400).send({ success: false, message: "Nincs érvényes User ID!" });
    }

    try {
        await pool.query('INSERT INTO Stats (User_Id, Score) VALUES (?, ?)', [userId, score]);
        console.log("Sikeres mentés az adatbázisba!");
        res.send({ success: true });
    } catch (error) {
        console.error("Adatbázis hiba:", error);
        res.status(500).send(error);
    }
});

app.listen(PORT, () => {
    console.log(`Megy a BackEnd ezen a porton: ${PORT}  (੭˶◕ω⁠◕)੭`)
})