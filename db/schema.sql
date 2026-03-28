CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(55) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `muscle_groups` (
  `muscle_group_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  PRIMARY KEY (`muscle_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `exercises` (
  `exercise_id` int NOT NULL AUTO_INCREMENT,
  `muscle_group_id` int NOT NULL,
  `exercise_name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`exercise_id`),
  KEY `fk_exercises_muscle_group` (`muscle_group_id`),
  CONSTRAINT `fk_exercises_muscle_group` FOREIGN KEY (`muscle_group_id`) REFERENCES `muscle_groups` (`muscle_group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `workout_sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_date` date NOT NULL,
  `note` text,
  `duration_total_minutes` int,
  PRIMARY KEY (`session_id`),
  KEY `fk_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_date` (`user_id`, `session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `exercise_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `exercise_id` int NOT NULL,
  `sets` int,
  `reps` int,
  `weight_kg` decimal(8, 2),
  `duration_minutes` int,
  PRIMARY KEY (`log_id`),
  KEY `fk_logs_session` (`session_id`),
  KEY `fk_logs_exercise` (`exercise_id`),
  CONSTRAINT `fk_logs_session` FOREIGN KEY (`session_id`) REFERENCES `workout_sessions` (`session_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logs_exercise` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`exercise_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
