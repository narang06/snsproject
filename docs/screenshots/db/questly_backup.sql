CREATE DATABASE  IF NOT EXISTS `snsproject` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `snsproject`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: snsproject
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `submission_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `submission_id` (`submission_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,8,4,'ㅁㄴㅇㅁㄴㅇ','2025-11-26 15:10:23'),(2,8,4,'ㅁㄴㅇㅁㄴㅇ','2025-11-26 15:10:25'),(3,8,3,'물은 맛 없어요','2025-11-26 18:07:58'),(5,14,3,'dd','2025-11-27 15:30:47'),(6,14,4,'으으','2025-11-27 17:58:49'),(7,17,3,'asd','2025-11-28 10:38:39'),(8,16,3,'asdad','2025-11-28 10:38:55'),(9,16,3,'안녕','2025-11-28 12:01:12'),(10,13,3,'안녕','2025-11-28 12:01:19'),(14,16,4,'ㅁㄴㅇ','2025-11-28 12:02:09'),(15,17,4,'asd','2025-11-28 12:34:53'),(16,16,3,'asdasd','2025-11-28 12:40:02'),(17,13,4,'ㅁㄴㅇ','2025-11-28 15:06:42'),(19,16,3,'알즤','2025-11-28 15:08:25'),(20,17,7,'@테스트#4009 언급','2025-11-28 15:26:19'),(21,14,3,'@하늘#4605 ㅁㄴㅇㅁㄴㅇ','2025-11-28 16:01:22'),(22,16,3,'#하늘4605 안녕','2025-11-28 16:06:34'),(23,16,3,'#하늘4605 죽어','2025-11-28 16:08:55'),(27,14,3,'야 @하늘#4605 나와!','2025-11-28 17:04:44'),(28,17,3,'@하늘#4605 죽어','2025-11-28 17:05:11'),(29,17,3,'@하늘#4605 안녕','2025-11-28 17:08:03'),(30,18,4,'빵이 맛있어 보이네요.','2025-12-01 11:43:03'),(31,18,4,'빵','2025-12-01 11:43:25'),(32,16,4,'ㅇㅇ','2025-12-01 11:43:39'),(33,16,4,'ㅇㅇ','2025-12-01 11:44:06'),(34,18,3,'그런가용','2025-12-01 13:00:11'),(37,11,3,'ㅇㅇ','2025-12-01 13:38:40'),(40,13,3,'ㅇ','2025-12-01 15:13:12'),(56,19,7,'ㅁㄴㅇ','2025-12-01 17:30:04'),(59,21,3,'힘들다','2025-12-02 11:40:40'),(60,21,3,'ㅁㄴㅇ','2025-12-02 12:12:34'),(62,21,9,'안녕하세요','2025-12-02 12:33:40'),(64,22,8,'굳!','2025-12-02 15:30:32'),(70,22,8,'@테스트#4009 언급','2025-12-02 16:59:39'),(71,26,4,'ㄴㅇㄴ','2025-12-02 18:21:43'),(77,28,7,'ㅇㅇ','2025-12-03 10:14:55'),(80,29,7,'날씨가 좀 춥네요.','2025-12-03 10:21:07'),(81,30,9,'날씨가 추워 따뜻한 집에서 커피한잔','2025-12-03 11:32:56'),(82,30,4,'@최종테스트#5452 날씨가 너무 추워요','2025-12-03 11:33:26'),(90,30,8,'저도 날씨가 추워서 집 밖으로 나가기 싫어요.','2025-12-03 11:35:12'),(91,30,3,'@하늘#4605 님은 바쁘신가?','2025-12-03 11:36:53'),(93,29,3,'@하늘#4605 님도 밖에 나왔어야','2025-12-03 11:46:30'),(94,30,9,'@하늘#4605','2025-12-03 11:59:04'),(95,29,7,'@최종테스트#5452 ㅇ','2025-12-03 11:59:55');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_quests`
--

DROP TABLE IF EXISTS `daily_quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_quests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quest_id` int NOT NULL,
  `date` date NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`),
  KEY `quest_id` (`quest_id`),
  CONSTRAINT `daily_quests_ibfk_1` FOREIGN KEY (`quest_id`) REFERENCES `quests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_quests`
--

LOCK TABLES `daily_quests` WRITE;
/*!40000 ALTER TABLE `daily_quests` DISABLE KEYS */;
INSERT INTO `daily_quests` VALUES (1,2,'2025-11-26','2025-11-26 11:41:23'),(3,5,'2025-11-27','2025-11-27 09:24:20'),(4,4,'2025-11-28','2025-11-28 09:20:17'),(5,8,'2025-12-01','2025-12-01 09:50:01'),(6,1,'2025-12-02','2025-12-02 09:33:06'),(7,3,'2025-12-03','2025-12-03 09:29:33');
/*!40000 ALTER TABLE `daily_quests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `follower_id` bigint NOT NULL,
  `following_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`,`following_id`),
  KEY `following_id` (`following_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES (3,4,'2025-11-27 17:16:45'),(3,7,'2025-11-28 16:49:27'),(4,3,'2025-11-27 17:19:07'),(7,3,'2025-12-01 16:59:22');
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `submission_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`submission_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (11,7,'2025-12-01 16:47:05'),(13,8,'2025-12-02 16:56:13'),(17,8,'2025-12-02 16:54:39'),(19,4,'2025-12-02 18:10:13'),(21,4,'2025-12-02 12:47:17'),(21,8,'2025-12-02 16:56:08'),(21,9,'2025-12-02 12:33:33'),(22,4,'2025-12-02 18:14:45'),(22,8,'2025-12-02 15:30:34'),(28,3,'2025-12-03 11:23:52'),(29,9,'2025-12-03 11:37:50'),(30,3,'2025-12-03 11:36:46'),(30,4,'2025-12-03 11:37:12'),(30,7,'2025-12-03 11:33:38'),(30,8,'2025-12-03 11:35:19');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `recipient_id` bigint NOT NULL,
  `sender_id` bigint DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `comment_id` bigint DEFAULT NULL,
  `read_timer_started_at` datetime DEFAULT NULL COMMENT '1시간 읽음 처리 타이머 시작 시간',
  `grouping_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actors` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `recipient_id` (`recipient_id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_grouping_key` (`grouping_key`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 17:33:46',NULL,NULL,NULL,NULL),(2,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 17:33:49',NULL,NULL,NULL,NULL),(3,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:02:04',NULL,NULL,NULL,NULL),(4,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:07:47',NULL,NULL,NULL,NULL),(5,4,3,'COMMENT','SUBMISSION',8,NULL,1,'2025-11-26 18:07:58',NULL,NULL,NULL,NULL),(6,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:11:46',NULL,NULL,NULL,NULL),(7,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:12:58',NULL,NULL,NULL,NULL),(8,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:13:08',NULL,NULL,NULL,NULL),(9,4,3,'LIKE','SUBMISSION',8,NULL,1,'2025-11-26 18:13:18',NULL,NULL,NULL,NULL),(10,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:07:17',NULL,NULL,NULL,NULL),(11,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:07:18',NULL,NULL,NULL,NULL),(12,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:07:19',NULL,NULL,NULL,NULL),(13,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:07:22',NULL,NULL,NULL,NULL),(14,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:07:23',NULL,NULL,NULL,NULL),(15,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:08:00',NULL,NULL,NULL,NULL),(16,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:08:02',NULL,NULL,NULL,NULL),(17,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:08:05',NULL,NULL,NULL,NULL),(18,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 16:08:08',NULL,NULL,NULL,NULL),(19,4,3,'follow',NULL,NULL,NULL,1,'2025-11-27 17:16:45',NULL,NULL,NULL,NULL),(20,3,4,'follow',NULL,NULL,NULL,1,'2025-11-27 17:19:07',NULL,NULL,NULL,NULL),(21,3,4,'LIKE','SUBMISSION',14,NULL,1,'2025-11-27 17:58:19',NULL,NULL,NULL,NULL),(23,3,4,'COMMENT','SUBMISSION',14,NULL,1,'2025-11-27 17:58:49',NULL,NULL,NULL,NULL),(25,3,4,'LIKE','SUBMISSION',14,NULL,1,'2025-11-27 17:58:58',NULL,NULL,NULL,NULL),(26,3,4,'like','SUBMISSION',17,NULL,1,'2025-11-28 10:37:32',NULL,NULL,NULL,NULL),(27,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 10:38:55',NULL,NULL,NULL,NULL),(28,3,4,'like','SUBMISSION',14,NULL,1,'2025-11-28 10:40:08',NULL,NULL,NULL,NULL),(29,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 12:01:12',NULL,NULL,NULL,NULL),(30,4,3,'comment','SUBMISSION',13,NULL,1,'2025-11-28 12:01:19',NULL,NULL,NULL,NULL),(31,3,4,'comment','SUBMISSION',17,NULL,1,'2025-11-28 12:34:53',15,NULL,NULL,NULL),(32,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 12:40:02',16,NULL,NULL,NULL),(33,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 15:08:25',19,NULL,NULL,NULL),(34,3,7,'comment','SUBMISSION',17,NULL,1,'2025-11-28 15:26:19',20,NULL,NULL,NULL),(35,4,3,'like','SUBMISSION',16,NULL,1,'2025-11-28 15:37:44',NULL,NULL,NULL,NULL),(36,7,3,'follow',NULL,NULL,NULL,1,'2025-11-28 15:40:10',NULL,'2025-12-01 15:23:29',NULL,NULL),(37,7,3,'mention','SUBMISSION',14,NULL,1,'2025-11-28 16:01:22',21,'2025-12-01 15:23:29',NULL,NULL),(38,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 16:06:34',22,NULL,NULL,NULL),(39,4,3,'comment','SUBMISSION',16,NULL,1,'2025-11-28 16:08:55',23,NULL,NULL,NULL),(40,7,3,'mention','SUBMISSION',17,NULL,1,'2025-11-28 16:09:13',24,'2025-12-01 15:23:29',NULL,NULL),(41,7,3,'mention','SUBMISSION',17,NULL,1,'2025-11-28 16:14:10',26,'2025-12-01 15:23:29',NULL,NULL),(42,4,3,'like','SUBMISSION',16,NULL,1,'2025-11-28 16:39:45',NULL,NULL,NULL,NULL),(43,7,3,'follow',NULL,NULL,NULL,1,'2025-11-28 16:49:27',NULL,'2025-12-01 15:23:29',NULL,NULL),(44,7,3,'mention','SUBMISSION',14,NULL,1,'2025-11-28 17:04:44',27,'2025-12-01 15:23:29',NULL,NULL),(45,7,3,'mention','SUBMISSION',17,NULL,1,'2025-11-28 17:05:11',28,'2025-12-01 15:23:29',NULL,NULL),(46,7,3,'mention','SUBMISSION',17,NULL,1,'2025-11-28 17:08:03',29,'2025-12-01 15:23:29',NULL,NULL),(47,4,3,'like','SUBMISSION',16,NULL,1,'2025-11-28 17:20:50',NULL,NULL,NULL,NULL),(48,3,4,'comment','SUBMISSION',18,NULL,1,'2025-12-01 11:43:03',30,'2025-12-01 12:48:55',NULL,NULL),(49,3,4,'like','SUBMISSION',18,NULL,1,'2025-12-01 11:43:09',NULL,'2025-12-01 12:48:55',NULL,NULL),(50,3,4,'comment','SUBMISSION',18,NULL,1,'2025-12-01 11:43:25',31,'2025-12-01 12:48:55',NULL,NULL),(51,4,3,'comment_group','SUBMISSION',13,'TEST용님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-01 15:13:12',40,'2025-12-02 10:44:22','comment-submission-13','[\"TEST용\"]'),(53,3,7,'like_group','SUBMISSION',17,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 15:24:17',NULL,'2025-12-01 17:32:16','like-submission-17','[\"하늘\"]'),(60,7,8,'like_group','SUBMISSION',19,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 15:41:10',NULL,'2025-12-01 16:17:22','like-submission-19','[\"주인\"]'),(62,3,8,'like_group','SUBMISSION',17,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 15:42:38',NULL,'2025-12-01 17:32:16','like-submission-17','[\"주인\"]'),(64,4,8,'like_group','SUBMISSION',8,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 15:44:58',NULL,'2025-12-02 10:44:22','like-submission-8','[\"주인\"]'),(67,3,8,'like_group','SUBMISSION',11,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 15:52:28',NULL,'2025-12-01 17:32:16','like-submission-11','[\"주인\"]'),(69,4,3,'like_group','SUBMISSION',8,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:01:52',NULL,'2025-12-02 10:44:22','like-submission-8','[\"TEST용\"]'),(70,7,3,'like_group','SUBMISSION',19,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:02:25',NULL,'2025-12-01 16:17:22','like-submission-19','[\"TEST용\"]'),(71,4,3,'like_group','SUBMISSION',16,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:02:51',NULL,'2025-12-02 10:44:22','like-submission-16','[\"TEST용\"]'),(74,3,7,'like_group','SUBMISSION',18,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:18:06',NULL,'2025-12-01 17:32:16','like-submission-18','[\"하늘\"]'),(75,4,7,'like_group','SUBMISSION',16,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:22:17',NULL,'2025-12-02 10:44:22','like-submission-16','[\"하늘\"]'),(76,4,7,'like_group','SUBMISSION',16,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:26:02',NULL,'2025-12-02 10:44:22','like-submission-16','[\"하늘\"]'),(77,3,7,'like_group','SUBMISSION',14,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:31:31',NULL,'2025-12-01 17:32:16','like-submission-14','[\"하늘\"]'),(78,4,7,'like_group','SUBMISSION',8,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:32:22',NULL,'2025-12-02 10:44:22','like-submission-8','[\"하늘\"]'),(79,3,7,'like_group','SUBMISSION',11,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:33:43',NULL,'2025-12-01 17:32:16','like-submission-11','[\"하늘\"]'),(80,4,7,'like_group','SUBMISSION',13,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:34:04',NULL,'2025-12-02 10:44:22','like-submission-13','[\"하늘\"]'),(81,3,7,'like_group','SUBMISSION',11,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:34:52',NULL,'2025-12-01 17:32:16','like-submission-11','[\"하늘\"]'),(82,3,7,'like_group','SUBMISSION',11,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:38:44',NULL,'2025-12-01 17:32:16','like-submission-11','[\"하늘\"]'),(83,4,7,'like_group','SUBMISSION',8,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:39:34',NULL,'2025-12-02 10:44:22','like-submission-8','[\"하늘\"]'),(84,4,7,'like_group','SUBMISSION',8,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:40:58',NULL,'2025-12-02 10:44:22','like-submission-8','[\"하늘\"]'),(85,3,7,'like_group','SUBMISSION',11,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:47:05',NULL,'2025-12-01 17:32:16','like-submission-11','[\"하늘\"]'),(86,8,7,'like_group','SUBMISSION',20,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 16:47:33',NULL,'2025-12-01 17:53:22','like-submission-20','[\"하늘\"]'),(87,8,7,'comment_group','SUBMISSION',20,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-01 16:48:30',42,'2025-12-01 17:53:22','comment-submission-20','[\"하늘\"]'),(88,8,7,'comment_group','SUBMISSION',20,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-01 16:51:10',48,'2025-12-01 17:53:22','comment-submission-20','[\"하늘\"]'),(89,3,7,'follow',NULL,NULL,NULL,1,'2025-12-01 16:59:10',NULL,'2025-12-01 17:32:16',NULL,NULL),(90,8,7,'comment_group','SUBMISSION',20,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-01 17:16:05',52,'2025-12-01 17:53:22','comment-submission-20','[\"하늘\"]'),(91,8,7,'like_group','SUBMISSION',20,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 17:17:41',NULL,'2025-12-01 17:53:22','like-submission-20','[\"하늘\"]'),(92,8,7,'comment_group','SUBMISSION',20,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-01 17:29:45',55,'2025-12-01 17:53:22','comment-submission-20','[\"하늘\"]'),(93,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 17:45:53',NULL,'2025-12-01 17:53:22','like-submission-20','[\"TEST용\"]'),(94,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-01 17:53:10',NULL,'2025-12-01 17:53:22','like-submission-20','[\"TEST용\"]'),(95,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 11:25:23',NULL,'2025-12-02 15:30:36','like-submission-20','[\"TEST용\"]'),(96,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 12:02:58',NULL,'2025-12-02 15:30:36','like-submission-20','[\"TEST용\"]'),(97,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 12:06:38',NULL,'2025-12-02 15:30:36','like-submission-20','[\"TEST용\"]'),(98,8,3,'like_group','SUBMISSION',20,'TEST용님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 12:33:03',NULL,'2025-12-02 15:30:36','like-submission-20','[\"TEST용\"]'),(99,3,9,'like_group','SUBMISSION',21,'최종테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 12:33:33',NULL,'2025-12-02 12:33:53','like-submission-21','[\"최종테스트\"]'),(100,3,9,'comment_group','SUBMISSION',21,'최종테스트님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-02 12:33:40',62,'2025-12-02 12:33:53','comment-submission-21','[\"최종테스트\"]'),(101,3,4,'like_group','SUBMISSION',21,'테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 12:47:17',NULL,'2025-12-02 12:47:28','like-submission-21','[\"테스트\"]'),(102,7,8,'comment_group','SUBMISSION',22,'주인님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-02 15:30:32',64,'2025-12-03 09:50:01','comment-submission-22','[\"주인\"]'),(103,7,8,'like_group','SUBMISSION',22,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 15:30:34',NULL,'2025-12-03 09:50:01','like-submission-22','[\"주인\"]'),(104,4,8,'comment_group','SUBMISSION',16,'주인님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-02 16:31:58',68,'2025-12-02 17:04:07','comment-submission-16','[\"주인\"]'),(105,3,8,'like_group','SUBMISSION',18,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:53:23',NULL,'2025-12-02 17:01:51','like-submission-18','[\"주인\"]'),(106,3,8,'like_group','SUBMISSION',21,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:53:27',NULL,'2025-12-02 17:01:51','like-submission-21','[\"주인\"]'),(107,3,8,'like_group','SUBMISSION',17,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:54:39',NULL,'2025-12-02 17:01:51','like-submission-17','[\"주인\"]'),(108,3,8,'like_group','SUBMISSION',21,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:56:08',NULL,'2025-12-02 17:01:51','like-submission-21','[\"주인\"]'),(109,4,8,'like_group','SUBMISSION',13,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:56:13',NULL,'2025-12-02 17:04:07','like-submission-13','[\"주인\"]'),(110,3,8,'like_group','SUBMISSION',14,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 16:57:57',NULL,'2025-12-02 17:01:51','like-submission-14','[\"주인\"]'),(111,7,8,'comment_group','SUBMISSION',22,'주인님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-02 16:59:39',70,'2025-12-03 09:50:01','comment-submission-22','[\"주인\"]'),(112,4,8,'mention','SUBMISSION',22,'주인님이 댓글에서 회원님을 언급했습니다.',1,'2025-12-02 16:59:39',70,'2025-12-02 17:04:07',NULL,NULL),(113,3,4,'like_group','SUBMISSION',18,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:07:08',NULL,'2025-12-03 11:23:53','like-submission-18','[\"테스트\"]'),(114,3,4,'like_group','SUBMISSION',17,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:14:03',NULL,'2025-12-03 11:23:53','like-submission-17','[\"테스트\"]'),(115,3,4,'like_group','SUBMISSION',14,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:17:09',NULL,'2025-12-03 11:23:53','like-submission-14','[\"테스트\"]'),(116,3,4,'like_group','SUBMISSION',14,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:18:55',NULL,'2025-12-03 11:23:53','like-submission-14','[\"테스트\"]'),(117,3,4,'like_group','SUBMISSION',14,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:22:52',NULL,'2025-12-03 11:23:53','like-submission-14','[\"테스트\"]'),(119,3,4,'like_group','SUBMISSION',18,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:29:36',NULL,'2025-12-03 11:23:53','like-submission-18','[\"테스트\"]'),(120,8,4,'follow',NULL,NULL,NULL,0,'2025-12-02 17:31:16',NULL,NULL,NULL,NULL),(121,3,4,'like_group','SUBMISSION',14,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 17:36:20',NULL,'2025-12-03 11:23:53','like-submission-14','[\"테스트\"]'),(125,7,4,'like_group','SUBMISSION',22,'테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 18:07:04',NULL,'2025-12-03 09:50:01','like-submission-22','[\"테스트\"]'),(126,7,4,'like_group','SUBMISSION',19,'테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 18:10:13',NULL,'2025-12-03 09:50:01','like-submission-19','[\"테스트\"]'),(130,7,4,'like_group','SUBMISSION',22,'테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-02 18:14:45',NULL,'2025-12-03 09:50:01','like-submission-22','[\"테스트\"]'),(133,3,4,'like_group','SUBMISSION',14,'테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-02 18:15:39',NULL,'2025-12-03 11:23:53','like-submission-14','[\"테스트\"]'),(164,8,4,'comment_group','SUBMISSION',26,'테스트님이 회원님의 게시물에 댓글을 달았습니다.',0,'2025-12-02 18:21:43',71,NULL,'comment-submission-26','[\"테스트\"]'),(213,4,7,'comment_group','SUBMISSION',28,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',0,'2025-12-03 09:49:55',73,NULL,'comment-submission-28','[\"하늘\"]'),(238,4,7,'comment_group','SUBMISSION',28,'하늘님이 회원님의 게시물에 댓글을 달았습니다.',0,'2025-12-03 10:14:55',77,NULL,'comment-submission-28','[\"하늘\"]'),(239,4,3,'like_group','SUBMISSION',28,'TEST용님이 회원님의 게시물을 좋아합니다.',0,'2025-12-03 11:23:52',NULL,NULL,'like-submission-28','[\"TEST용\"]'),(240,9,3,'like_group','SUBMISSION',30,'하늘님이 회원님의 게시물을 좋아합니다.',1,'2025-12-03 11:33:38',NULL,'2025-12-03 11:35:32','like-submission-30','[\"하늘\"]'),(241,9,4,'comment_group','SUBMISSION',30,'테스트님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-03 11:33:26',82,'2025-12-03 11:35:32','comment-submission-30','[\"테스트\"]'),(242,9,8,'comment_group','SUBMISSION',30,'주인님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-03 11:35:12',90,'2025-12-03 11:35:32','comment-submission-30','[\"주인\"]'),(243,9,8,'like_group','SUBMISSION',30,'주인님이 회원님의 게시물을 좋아합니다.',1,'2025-12-03 11:35:19',NULL,'2025-12-03 11:35:32','like-submission-30','[\"주인\"]'),(244,9,3,'like_group','SUBMISSION',30,'TEST용님과 테스트님이 회원님의 게시물을 좋아합니다.',1,'2025-12-03 11:37:12',NULL,'2025-12-03 11:37:27','like-submission-30','[\"TEST용\", \"테스트\"]'),(245,9,3,'comment_group','SUBMISSION',30,'TEST용님이 회원님의 게시물에 댓글을 달았습니다.',1,'2025-12-03 11:36:53',91,'2025-12-03 11:37:27','comment-submission-30','[\"TEST용\"]'),(247,7,9,'like_group','SUBMISSION',29,'최종테스트님이 회원님의 게시물을 좋아합니다.',0,'2025-12-03 11:37:50',NULL,'2025-12-03 11:40:10','like-submission-29','[\"최종테스트\"]'),(248,7,3,'mention','SUBMISSION',29,'TEST용님이 댓글에서 회원님을 언급했습니다.',0,'2025-12-03 11:46:30',93,'2025-12-03 11:59:20',NULL,NULL),(249,7,9,'mention','SUBMISSION',30,'최종테스트님이 댓글에서 회원님을 언급했습니다.',0,'2025-12-03 11:59:04',94,'2025-12-03 11:59:20',NULL,NULL),(250,9,7,'mention','SUBMISSION',29,'하늘님이 댓글에서 회원님을 언급했습니다.',1,'2025-12-03 11:59:55',95,'2025-12-03 12:00:12',NULL,NULL);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quests`
--

DROP TABLE IF EXISTS `quests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quests`
--

LOCK TABLES `quests` WRITE;
/*!40000 ALTER TABLE `quests` DISABLE KEYS */;
INSERT INTO `quests` VALUES (1,'매일 아침 운동 30분 하기','매일 아침 30분 이상 운동을 하고 기록을 남겨보세요. 건강한 하루를 시작하는 습관을 들여봅시다.','2025-11-26 11:26:53'),(2,'하루 동안 물 2리터 마시기','하루 동안 최소 2리터의 물을 마시고 인증샷을 남겨주세요. 수분 보충은 건강의 기본!','2025-11-26 11:26:53'),(3,'새로운 지식 배우기 (1시간)','매일 1시간 동안 책을 읽거나 온라인 강의를 듣는 등 새로운 지식을 습득하고 요약해 보세요. 꾸준한 성장을 목표로!','2025-11-26 11:26:53'),(4,'친한 친구에게 응원 메시지 보내기','일상에 지친 친구에게 따뜻한 응원 메시지를 보내고, 친구의 반응을 기록해 보세요. 소중한 관계를 돈독히!','2025-11-26 11:26:53'),(5,'하늘 사진 찍어 올리기','오늘 하늘의 모습을 카메라에 담아 공유해주세요. 같은 하늘 아래 다른 풍경들을 감상해봅시다.','2025-11-26 11:26:53'),(6,'아침 햇살과 함께 셀카 찍기','오늘 아침 햇살을 배경으로 셀카를 찍어 피드에 올려보세요. 하루를 상쾌하게 시작하는 인증샷!','2025-11-28 17:50:04'),(7,'오늘의 책 한 장 인증샷','오늘 읽은 책 한 장을 사진으로 찍어 올려보세요. 지식 습득도 SNS로 공유!','2025-11-28 17:50:04'),(8,'집에서 만든 건강 간식','오늘 만든 건강 간식을 사진으로 찍어 인증샷을 올려보세요. 맛과 건강 모두 챙기기!','2025-11-28 17:50:04'),(9,'운동 인증샷','오늘 하루 운동한 모습을 사진으로 찍어 피드에 공유하세요. 건강한 하루를 기록!','2025-11-28 17:50:04'),(10,'오늘 마신 음료 인증샷','오늘 마신 커피나 차, 음료 중 하나를 사진으로 인증해보세요. 하루의 작은 즐거움 기록!','2025-11-28 17:50:04'),(11,'반려동물과의 순간','반려동물과 함께한 순간을 사진으로 찍어 공유하세요. 귀여운 인증샷 대방출!','2025-11-28 17:50:04'),(12,'집안 꾸미기 인증샷','오늘 집안 꾸민 모습을 사진으로 올려보세요. 작은 변화도 기록의 재미!','2025-11-28 17:50:04'),(13,'오늘 먹은 점심 인증샷','점심 식사를 사진으로 찍어 피드에 올려보세요. 맛있는 하루 인증!','2025-11-28 17:50:04'),(14,'오늘의 패션 인증샷','오늘 입은 옷차림을 사진으로 올리고 피드에 공유해보세요. 스타일 기록!','2025-11-28 17:50:04'),(15,'자연 속 산책 인증샷','오늘 산책하며 찍은 자연 풍경 사진을 올려보세요. 힐링 인증샷!','2025-11-28 17:50:04');
/*!40000 ALTER TABLE `quests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `daily_quest_id` int NOT NULL,
  `content_text` text COLLATE utf8mb4_unicode_ci,
  `content_image_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `daily_quest_id` (`daily_quest_id`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`daily_quest_id`) REFERENCES `daily_quests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
INSERT INTO `submissions` VALUES (8,4,1,'물 마셔요 물이 맛있어요','[\"/uploads/submissions/2025-11-26/1764141102164-689370402.jpg\",\"/uploads/submissions/2025-11-26/1764141102164-975090595.jpg\",\"/uploads/submissions/2025-11-26/1764142764090-994232978.jpg\"]','2025-11-26 15:09:10'),(11,3,1,'ㅁㄴㅇㅁㄴㅇㅁㄴㅇㅁㅇㄴㅁㄴ','[\"/uploads/submissions/2025-11-26/1764149912741-953296233.png\"]','2025-11-26 18:38:32'),(13,4,3,'하늘~~~~~~~~','[\"/uploads/submissions/2025-11-27/1764205232482-795770706.jpg\",\"/uploads/submissions/2025-11-27/1764205232482-521309449.jpg\",\"/uploads/submissions/2025-11-27/1764205232482-113060513.jpg\"]','2025-11-27 10:00:32'),(14,3,3,'하늘 하늘 하늘 테스트','[\"/uploads/submissions/2025-11-27/1764207226574-945601432.png\",\"/uploads/submissions/2025-11-27/1764207226578-296510456.jpg\"]','2025-11-27 10:33:46'),(16,4,4,'ㅁㄴㅇㅁㅇㅁㄴㅇㅁㄴㅇ@하늘#4605 보고있니?','[\"/uploads/submissions/2025-11-28/1764291321263-637313275.png\"]','2025-11-28 09:55:21'),(17,3,4,'ㅇㄴㅇㄴ ㅁㄴㅇㅁㅇ @하늘#4605 야','[\"/uploads/submissions/2025-11-28/1764291350370-182209070.jpg\"]','2025-11-28 09:55:50'),(18,3,5,'ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ','[\"/uploads/submissions/2025-12-01/1764550322026-146755287.jpg\"]','2025-12-01 09:52:02'),(19,7,5,'ㅁㄴㅇㅇㄴㅁㅇㅁㄴㅇㄴㅁㅇ','[\"/uploads/submissions/2025-12-01/1764570201219-216055290.jpg\"]','2025-12-01 15:23:21'),(21,3,6,'운동중~~~~~~~~','[\"/uploads/submissions/2025-12-02/1764642688781-596857208.jpg\",\"/uploads/submissions/2025-12-02/1764642688782-294957156.jpg\"]','2025-12-02 11:31:28'),(22,7,6,'오늘도 퀘스트 달성!!','[\"/uploads/submissions/2025-12-02/1764656901169-934655266.jpg\",\"/uploads/submissions/2025-12-02/1764656901170-178889150.jpg\"]','2025-12-02 15:28:21'),(26,8,6,'저는 오늘 수영을 했습니다~','[\"/uploads/submissions/2025-12-02/1764658458672-637401688.jpg\"]','2025-12-02 15:54:18'),(27,4,6,'ㄴㅇㄴㄴㄴㄴㄴㄴㄴㄴㄴ','[\"/uploads/submissions/2025-12-02/1764667320840-277992790.jpg\"]','2025-12-02 18:22:00'),(28,4,7,'물은 답을 알고있다.','[\"/uploads/submissions/2025-12-03/1764721953195-879236476.jpg\"]','2025-12-03 09:32:33'),(29,7,7,'오늘은 강가에서 책을 읽었습니다.','[\"/uploads/submissions/2025-12-03/1764724437484-613665289.jpg\"]','2025-12-03 10:13:57'),(30,9,7,'커피와 함께 자기개발서 읽었습니다.','[\"/uploads/submissions/2025-12-03/1764728674376-53974884.jpg\"]','2025-12-03 11:24:34');
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nickname_tag` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `follower_count` int DEFAULT '0',
  `following_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_nickname_tag` (`nickname`,`nickname_tag`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'TEST용','6399','test@naver.com','$2b$08$0Sauk09vw2D1MqBQllepkez4HTnLQqRGGdslzC7OZJfe/5FxORXDW','/uploads/profiles/1764210390441-82577842.jpg','s',0,0,'2025-11-25 13:10:43'),(4,'테스트','4009','test2@naver.com','$2b$08$ggMoFh0lhHEtorrrhd6CSuUWv7n40dkQ0SEq0sbuIUAqFNgM0PpJm','/uploads/profiles/1764206170060-272767140.png','테스입니다.',0,0,'2025-11-25 15:59:01'),(5,'test3','7823','test3@naver.com','$2b$08$Whid.LuKMaGFaiWxsXVAZeaXmrNr6YWNIa9eDqYoX.AoCHh4AICsy',NULL,NULL,0,0,'2025-11-25 17:31:32'),(7,'하늘','4605','sky@naver.com','$2b$08$TNUeBmAL6xw47ZZEvM3t9.maodl3.4B0xwXDPwP4t7n0p9gJ0094K','/uploads/profiles/1764220680406-545152876.jpg','하늘',0,0,'2025-11-27 14:18:00'),(8,'주인','8670','admin@naver.com','$2b$08$FadDrcGIS2lZZAHHozXpq.0LMBeW6TTldB1pl1AteU4xCANPQjtrW','/uploads/profiles/1764221062430-715782565.png','dasdasd',0,0,'2025-11-27 14:24:22'),(9,'최종테스트','5452','final@naver.com','$2b$08$rhlPc95w.nN/o5IPVnOplut2qomoInCgY2jBKxLlGqsA2IfisDnHe','/uploads/profiles/1764640195420-760487113.jpg','파이널 테스트',0,0,'2025-12-02 10:49:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-03 13:02:57
