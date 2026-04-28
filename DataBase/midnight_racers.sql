- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Gép: 192.168.255.103
-- Létrehozás ideje: 2026. Ápr 28. 10:14
-- Kiszolgáló verziója: 11.4.7-MariaDB-log
-- PHP verzió: 8.4.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `midnight_racers`
--
CREATE DATABASE IF NOT EXISTS `midnight_racers` DEFAULT CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci;
USE `midnight_racers`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `about_gallery`
--

DROP TABLE IF EXISTS `about_gallery`;
CREATE TABLE `about_gallery` (
  `id` int(11) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `sorrend` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `about_gallery`
--

INSERT INTO `about_gallery` (`id`, `url`, `sorrend`) VALUES
(1, '/uploads/1775830017620-914927.png', 0),
(2, '/uploads/1775830105331-132051.png', 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `comment`
--

DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
  `id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Comment_Text` text NOT NULL,
  `Created_At` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `game`
--

DROP TABLE IF EXISTS `game`;
CREATE TABLE `game` (
  `Game_Id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Last_Login` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `home_cards`
--

DROP TABLE IF EXISTS `home_cards`;
CREATE TABLE `home_cards` (
  `id` int(11) NOT NULL,
  `kulcs` varchar(50) NOT NULL,
  `tartalom` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `home_cards`
--

INSERT INTO `home_cards` (`id`, `kulcs`, `tartalom`) VALUES
(1, 'news', 'Ide kerül a News tartalom...asdasdaqsd'),
(2, 'about', 'Midnight Racers is a free-to-play indie street racing game built for those who live for the thrill of the night. Inspired by the underground racing scene, the game puts you behind the wheel of customizable cars as you race through dark, neon-lit streets chasing the top spot on the leaderboard.\nEarn points, climb the rankings, and prove you\'re the fastest racer on the strip. Whether you\'re grinding for a high score or just cruising for fun, Midnight Racers delivers a fast-paced, arcade-style experience that keeps you coming back for more.\nCurrently in early development, the game is constantly evolving — with new updates, content, and features being added regularly. Jump in now, be part of the journey from the ground up, and help shape what Midnight Racers becomes.\nKey Features:\n\n- Free to download and play\n- Score-based competitive gameplay with a global leaderboard\n- Regular updates with new content\n- Lightweight and easy to get into\n\nAvailable on Windows. More platforms coming soon.');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `news`
--

DROP TABLE IF EXISTS `news`;
CREATE TABLE `news` (
  `id` int(11) UNSIGNED NOT NULL,
  `cim` varchar(255) NOT NULL,
  `tartalom` text NOT NULL,
  `datum` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `news`
--

INSERT INTO `news` (`id`, `cim`, `tartalom`, `datum`) VALUES
(3, 'New Update Is coming soon ', 'We are planning to release a new update soon. Stay tuned for the details.', '2026-04-14'),
(4, 'Beta Release', 'Good news now you can try out the game yourself. You can download it on the website. Give us feedback what\'s you think.\n', '2026-04-08');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `stats`
--

DROP TABLE IF EXISTS `stats`;
CREATE TABLE `stats` (
  `Stat_Id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Score` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `stats`
--

INSERT INTO `stats` (`Stat_Id`, `User_Id`, `Score`) VALUES
(5, 8, 31),
(8, 8, 32),
(11, 8, 32),
(14, 8, 30);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `updates`
--

DROP TABLE IF EXISTS `updates`;
CREATE TABLE `updates` (
  `id` int(11) NOT NULL,
  `datum` date NOT NULL,
  `szoveg` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `updates`
--

INSERT INTO `updates` (`id`, `datum`, `szoveg`) VALUES
(9, '2026-04-08', 'v0.1.0 – First public release\nThe game is now available for download! This is the very first public build of Midnight Racers. Core gameplay is in — you can race, earn points, and submit your score to the leaderboard. Expect bugs, expect rough edges, and expect updates. Thanks for jumping in early.'),
(10, '2026-04-09', 'v0.1.1 – Stability & score fix\nFixed a bug where scores weren\'t being saved correctly after a race. Improved overall game stability and reduced crash frequency on lower-end machines. Minor UI tweaks to the HUD.'),
(11, '2026-04-12', 'v0.1.2 – Controls overhaul\nReworked the car handling to feel tighter and more responsive. Adjusted acceleration and braking curves based on early player feedback. Also fixed a collision issue where the car would clip through certain barriers.'),
(12, '2026-04-13', 'v0.1.3 – Visual polish\nAdded new night-time lighting effects and improved the look of the road surface. Fixed flickering shadows on some track sections. Optimized asset loading to reduce stuttering during the first few seconds of a race.'),
(13, '2026-04-15', 'v0.1.4 – Leaderboard & account update\nThe leaderboard now updates in real time. Players must be logged in to submit scores — guest runs are still playable but won\'t count toward the rankings. Fixed a login issue that caused some accounts to get stuck on the loading screen.');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `User_Id` int(10) UNSIGNED NOT NULL,
  `User_Name` varchar(255) NOT NULL,
  `First_Name` varchar(255) NOT NULL,
  `Last_Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Is_Admin` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_hungarian_ci;

--
-- A tábla adatainak kiíratása `user`
--

INSERT INTO `user` (`User_Id`, `User_Name`, `First_Name`, `Last_Name`, `Email`, `Password`, `Is_Admin`) VALUES
(8, 'TEST', 'TEST', 'TEST', 'TEST@gmail.com', '$2b$10$.Thlgwwi6hwlBHe16.W2Wu1pwuhJr454Wd8szqgVGTm2zYV6HW73K', 0),
(29, 'admin', 'John', 'Doe', 'admin@admin.com', '$2b$12$3Gu0npLT/9LM6DVph7jpjuT8DiOF4rtWVFV9OMVMC1ZwsMyQbcmZa', 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `about_gallery`
--
ALTER TABLE `about_gallery`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comment_user_id_foreign` (`User_Id`);

--
-- A tábla indexei `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`Game_Id`),
  ADD KEY `game_user_id_foreign` (`User_Id`);

--
-- A tábla indexei `home_cards`
--
ALTER TABLE `home_cards`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `stats`
--
ALTER TABLE `stats`
  ADD PRIMARY KEY (`Stat_Id`),
  ADD KEY `stats_user_id_foreign` (`User_Id`);

--
-- A tábla indexei `updates`
--
ALTER TABLE `updates`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`User_Id`),
  ADD UNIQUE KEY `user_user_name_unique` (`User_Name`),
  ADD UNIQUE KEY `user_email_unique` (`Email`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `about_gallery`
--
ALTER TABLE `about_gallery`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `comment`
--
ALTER TABLE `comment`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `game`
--
ALTER TABLE `game`
  MODIFY `Game_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `home_cards`
--
ALTER TABLE `home_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT a táblához `stats`
--
ALTER TABLE `stats`
  MODIFY `Stat_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT a táblához `updates`
--
ALTER TABLE `updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT a táblához `user`
--
ALTER TABLE `user`
  MODIFY `User_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `comment_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `game`
--
ALTER TABLE `game`
  ADD CONSTRAINT `game_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `stats`
--
ALTER TABLE `stats`
  ADD CONSTRAINT `stats_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
