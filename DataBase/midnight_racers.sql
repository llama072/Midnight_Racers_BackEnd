-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 16, 2026 at 06:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `midnight_racers`
--
CREATE DATABASE IF NOT EXISTS `midnight_racers` DEFAULT CHARACTER SET utf8 COLLATE utf8_hungarian_ci;
USE `midnight_racers`;

-- --------------------------------------------------------

--
-- Table structure for table `about_gallery`
--

CREATE TABLE `about_gallery` (
  `id` int(11) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `sorrend` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `about_gallery`
--

INSERT INTO `about_gallery` (`id`, `url`, `sorrend`) VALUES
(1, '/uploads/1775830017620-914927.png', 0),
(2, '/uploads/1775830105331-132051.png', 0);

-- --------------------------------------------------------

--
-- Table structure for table `comment`
--

CREATE TABLE `comment` (
  `id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Comment_Text` text NOT NULL,
  `Created_At` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `Game_Id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Last_Login` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `home_cards`
--

CREATE TABLE `home_cards` (
  `id` int(11) NOT NULL,
  `kulcs` varchar(50) NOT NULL,
  `tartalom` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `home_cards`
--

INSERT INTO `home_cards` (`id`, `kulcs`, `tartalom`) VALUES
(1, 'news', 'Ide kerül a News tartalom...asdasdaqsd'),
(2, 'about', 'Midnight Racers is a free-to-play indie street racing game built for those who live for the thrill of the night. Inspired by the underground racing scene, the game puts you behind the wheel of customizable cars as you race through dark, neon-lit streets chasing the top spot on the leaderboard.\nEarn points, climb the rankings, and prove you\'re the fastest racer on the strip. Whether you\'re grinding for a high score or just cruising for fun, Midnight Racers delivers a fast-paced, arcade-style experience that keeps you coming back for more.\nCurrently in early development, the game is constantly evolving — with new updates, content, and features being added regularly. Jump in now, be part of the journey from the ground up, and help shape what Midnight Racers becomes.\nKey Features:\n\n- Free to download and play\n- Score-based competitive gameplay with a global leaderboard\n- Regular updates with new content\n- Lightweight and easy to get into\n\nAvailable on Windows. More platforms coming soon.');

-- --------------------------------------------------------

--
-- Table structure for table `news`
--

CREATE TABLE `news` (
  `id` int(11) UNSIGNED NOT NULL,
  `cim` varchar(255) NOT NULL,
  `tartalom` text NOT NULL,
  `datum` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `news`
--

INSERT INTO `news` (`id`, `cim`, `tartalom`, `datum`) VALUES
(3, 'New Update Is coming soon ', 'We are planning to release a new update soon. Stay tuned for the details.', '2026-04-14'),
(4, 'Beta Release', 'Good news now you can try out the game yourself. You can download it on the website. Give us feedback what\'s you think.\n', '2026-04-08');

-- --------------------------------------------------------

--
-- Table structure for table `stats`
--

CREATE TABLE `stats` (
  `Stat_Id` int(10) UNSIGNED NOT NULL,
  `User_Id` int(10) UNSIGNED NOT NULL,
  `Score` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `stats`
--

INSERT INTO `stats` (`Stat_Id`, `User_Id`, `Score`) VALUES
(1, 3, 33),
(2, 1, 31);

-- --------------------------------------------------------

--
-- Table structure for table `updates`
--

CREATE TABLE `updates` (
  `id` int(11) NOT NULL,
  `datum` date NOT NULL,
  `szoveg` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `updates`
--

INSERT INTO `updates` (`id`, `datum`, `szoveg`) VALUES
(9, '2026-04-08', 'v0.1.0 – First public release\nThe game is now available for download! This is the very first public build of Midnight Racers. Core gameplay is in — you can race, earn points, and submit your score to the leaderboard. Expect bugs, expect rough edges, and expect updates. Thanks for jumping in early.'),
(10, '2026-04-09', 'v0.1.1 – Stability & score fix\nFixed a bug where scores weren\'t being saved correctly after a race. Improved overall game stability and reduced crash frequency on lower-end machines. Minor UI tweaks to the HUD.'),
(11, '2026-04-12', 'v0.1.2 – Controls overhaul\nReworked the car handling to feel tighter and more responsive. Adjusted acceleration and braking curves based on early player feedback. Also fixed a collision issue where the car would clip through certain barriers.'),
(12, '2026-04-13', 'v0.1.3 – Visual polish\nAdded new night-time lighting effects and improved the look of the road surface. Fixed flickering shadows on some track sections. Optimized asset loading to reduce stuttering during the first few seconds of a race.'),
(13, '2026-04-15', 'v0.1.4 – Leaderboard & account update\nThe leaderboard now updates in real time. Players must be logged in to submit scores — guest runs are still playable but won\'t count toward the rankings. Fixed a login issue that caused some accounts to get stuck on the loading screen.');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `User_Id` int(10) UNSIGNED NOT NULL,
  `User_Name` varchar(255) NOT NULL,
  `First_Name` varchar(255) NOT NULL,
  `Last_Name` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Is_Admin` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`User_Id`, `User_Name`, `First_Name`, `Last_Name`, `Email`, `Password`, `Is_Admin`) VALUES
(1, 'asd', 'asd', 'asd', 'asd@gmail.com', '$2b$10$nxnamjuMQU.qOWOH5EdBdOad8kFm/8vIoel/Z6owJnjrbwLZPbztu', 1),
(2, 'a', 'asd', 'asd', 'a@gmail.com', '$2b$10$LzAJpGM6.j5UGBkFTp21juSj9lvbnuMvg2tNVhJf190Aah83NP0l.', 0),
(3, 'GAMETEST', 'GAME', 'TEST', 'GAMETEST@gmail.com', '$2b$10$2f1unnW8dz9/5XKUHgZK3OjUdPeh15BGhksro6EXkbhXF2GTn2pzO', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_gallery`
--
ALTER TABLE `about_gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comment_user_id_foreign` (`User_Id`);

--
-- Indexes for table `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`Game_Id`),
  ADD KEY `game_user_id_foreign` (`User_Id`);

--
-- Indexes for table `home_cards`
--
ALTER TABLE `home_cards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stats`
--
ALTER TABLE `stats`
  ADD PRIMARY KEY (`Stat_Id`),
  ADD KEY `stats_user_id_foreign` (`User_Id`);

--
-- Indexes for table `updates`
--
ALTER TABLE `updates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`User_Id`),
  ADD UNIQUE KEY `user_user_name_unique` (`User_Name`),
  ADD UNIQUE KEY `user_email_unique` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `about_gallery`
--
ALTER TABLE `about_gallery`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `comment`
--
ALTER TABLE `comment`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `game`
--
ALTER TABLE `game`
  MODIFY `Game_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `home_cards`
--
ALTER TABLE `home_cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stats`
--
ALTER TABLE `stats`
  MODIFY `Stat_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `updates`
--
ALTER TABLE `updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `User_Id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `comment_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`);

--
-- Constraints for table `game`
--
ALTER TABLE `game`
  ADD CONSTRAINT `game_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`);

--
-- Constraints for table `stats`
--
ALTER TABLE `stats`
  ADD CONSTRAINT `stats_user_id_foreign` FOREIGN KEY (`User_Id`) REFERENCES `user` (`User_Id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
