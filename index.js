const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcrypt")
const emailValidator = require("node-email-verifier")
const cors = require("cors");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')


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

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));






//REGISZTRACIO//
app.post('/regisztracio', async (req, res) => {
    const { User_Name, First_Name, Last_Name, Email, Password } = req.body;
    const Is_Admin = parseInt(req.body.Is_Admin); // Kényszerítsük számmá    
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

        return res.status(200).json({ message: "Sikeres regisztráció!", id: result.insertId });

    } catch (error) {
        console.error("ADATBÁZIS HIBA:", error);
        return res.status(500).json({ message: "Szerver hiba történt" });
    }
});

//BEJELENTKEZES//
app.post('/belepes', async (req, res) => {
    const { User_Name, Password } = req.body; // A te frontend változóid
    if (!User_Name || !Password) {
        return res.status(400).json({ message: "Hiányos belépési adatok!" });
    }
    try {
        // 1. Lekérjük a felhasználót (A te táblád neve: user)
        const sql = 'SELECT * FROM user WHERE User_Name = ?';
        const [rows] = await pool.query(sql, [User_Name]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Nincs ilyen felhasználó!" });
        }

        const user = rows[0];

        // 2. Jelszó ellenőrzése - FONTOS az await!
        const ok = await bcrypt.compare(Password, user.Password);

        if (!ok) {
            return res.status(403).json({ message: "Helytelen jelszó!" });
        }

        // 3. Token generálása (id: user.User_Id - mert ez van a phpMyAdminodban)
        const token = jwt.sign(
            { id: user.User_Id, name: user.User_Name, admin: user.Is_Admin },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // 4. Süti küldése - res.cookie (nem cookies!)
        res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
        
        return res.status(200).json({ 
            result: true, 
            message: "Sikeres belépés!",
            user: { name: user.User_Name, admin: user.Is_Admin }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Szerverhiba!" });
    }
});


//KIJELENTKEZES//
app.post('/kijelentkezes', auth, async (req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.status(200).json({ message: "Sikeres kijelentkezés |_(*)__(*)_|" })
})































//GAME//
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

// Add ezt az index.js fájlhoz a többi app.get/post közé
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT User_Id FROM User WHERE User_Name = ? AND Password = ?', [username, password]);
        if (rows.length > 0) {
            res.send({ success: true, userId: rows[0].User_Id });
        } else {
            res.send({ success: false, message: "Hibás adatok!" });
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/save-score', async (req, res) => {
    const { userId, score } = req.body;

    console.log(`Mentési kísérlet -> User: ${userId}, Pont: ${score}`); // Ez látszik a terminálban!

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