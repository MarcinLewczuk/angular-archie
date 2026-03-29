-- Example data for Archie Workouts application
-- Includes workouts from February, March, and April 2026 with trainer and user notes

-- ============================================
-- CLEAR EXISTING DATA (in reverse order of dependencies)
-- ============================================
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `exercise_logs`;
TRUNCATE TABLE `workout_sessions`;
TRUNCATE TABLE `exercises`;
TRUNCATE TABLE `muscle_groups`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS=1;

-- ============================================
-- INSERT SAMPLE USERS
-- ============================================
INSERT INTO `users` (`user_id`, `username`, `password`, `role`, `trainer_id`, `created_at`) VALUES
(1, 'admin', '$2b$12$JJZfTT/gV49l8MYpV0TAWO/xjQoir1.G2q5fc6We9CyhZqBgTO6nO', 'trainer', NULL, NOW()),
(2, 'archie', '$2b$12$JJZfTT/gV49l8MYpV0TAWO/xjQoir1.G2q5fc6We9CyhZqBgTO6nO', 'client', 1, NOW());

-- ============================================
-- INSERT MUSCLE GROUPS
-- ============================================
INSERT INTO `muscle_groups` (`name`) VALUES
('Chest'),
('Back'),
('Legs'),
('Shoulders'),
('Arms'),
('Core'),
('Cardio');

-- ============================================
-- INSERT EXERCISES
-- ============================================
INSERT INTO `exercises` (`muscle_group_id`, `exercise_name`, `description`) VALUES
-- Chest (1)
(1, 'Bench Press', 'Barbell bench press on flat bench'),
(1, 'Incline Dumbbell Press', 'Dumbbell press on incline bench'),
(1, 'Cable Flyes', 'Cable machine chest flyes'),

-- Back (2)
(2, 'Deadlift', 'Conventional barbell deadlift'),
(2, 'Bent Over Rows', 'Barbell bent over rows'),
(2, 'Pull-ups', 'Bodyweight pull-ups'),
(2, 'Lat Pulldowns', 'Lat pulldown machine'),

-- Legs (3)
(3, 'Squats', 'Barbell back squats'),
(3, 'Leg Press', 'Leg press machine'),
(3, 'Leg Curls', 'Leg curl machine'),
(3, 'Lunges', 'Barbell lunges'),

-- Shoulders (4)
(4, 'Overhead Press', 'Barbell overhead shoulder press'),
(4, 'Lateral Raises', 'Dumbbell lateral raises'),
(4, 'Face Pulls', 'Rope face pulls'),

-- Arms (5)
(5, 'Barbell Curls', 'Barbell bicep curls'),
(5, 'Tricep Dips', 'Bodyweight tricep dips'),
(5, 'Hammer Curls', 'Dumbbell hammer curls'),

-- Core (6)
(6, 'Planks', 'Standard plank hold'),
(6, 'Ab Wheel', 'Ab wheel rollouts'),

-- Cardio (7)
(7, 'Treadmill', 'Treadmill running'),
(7, 'Rowing Machine', 'Rowing machine cardio');

-- ============================================
-- INSERT WORKOUT SESSIONS - FEBRUARY 2026
-- ============================================
INSERT INTO `workout_sessions` (`user_id`, `session_date`, `trainer_note`, `user_note`, `duration_total_minutes`) VALUES
(1, '2026-02-02', 'Great chest day! Increased weights on bench press. Focus on form over heavy weight.', 'Felt strong today, managed to add 5kg to bench press without sacrificing form. Ready for increased intensity next week.', 60),
(1, '2026-02-05', 'Good back workout. Pull-ups looking strong - almost at 10 reps unbroken!', 'Back was a bit sore from Monday but pushed through. Managed 8 consecutive pull-ups which is a PR for me!', 55),
(1, '2026-02-09', 'Leg day crushing it! Form on squats is improving. Keep the core tight!', 'Legs are definitely sore but in a good way. Hit new squat PR of 140kg for 5 reps. Feeling very motivated!', 70),
(1, '2026-02-12', 'Shoulder and arm day. Try adding more volume to lateral raises next session.', 'Shoulders felt pump-heavy today. Did 3 extra sets of lateral raises to push myself. Arms are pumped!', 50),
(1, '2026-02-16', 'Full body session. Maintain this intensity level - you\'re building great momentum!', 'Slightly tired from the week but didn\'t let that stop me. Great overall session with good energy throughout.', 75),
(1, '2026-02-19', 'Chest focus today. Good progression. Try pausing for 2 seconds at bottom of bench press.', 'Tired but determined. Followed the pause rep advice - definitely increased difficulty but great for strength.', 65),
(1, '2026-02-23', 'Back day redux. Your rows are looking much more controlled. Excellent form!', 'Feel like my back strength has improved significantly. Rows felt easier and more controlled than before.', 58),
(1, '2026-02-26', 'Light session to recover. Easy cardio and stretch. Your body needs this deload!', 'Needed this light day. Did easy cardio and lots of stretching. Feel refreshed and ready for March.', 40);

-- ============================================
-- INSERT WORKOUT SESSIONS - MARCH 2026
-- ============================================
INSERT INTO `workout_sessions` (`user_id`, `session_date`, `trainer_note`, `user_note`, `duration_total_minutes`) VALUES
(1, '2026-03-02', 'New month, new goals! Starting deload week with lighter weights. Focus on recovery.', 'Fresh start for March! Taking it easy this week as planned. Lighter weights but more reps to maintain volume.', 50),
(1, '2026-03-05', 'Chest looking good. Added incline work - perfect for building upper chest definition.', 'Incline press is challenging but I can feel it working my upper chest more effectively.', 60),
(1, '2026-03-09', 'Back is strong! Pull-ups at 9 reps now. You\'re two weeks away from hitting double digits!', 'Killer back session! Managed 9 pull-ups which is huge progress. Deadlifts felt solid too.', 70),
(1, '2026-03-12', 'Leg press going well. Add 20kg next session and maintain reps. Progressive overload working!', 'Legs are getting stronger every week. Really seeing the compound lifts improve with consistent work.', 65),
(1, '2026-03-15', 'Shoulder development is excellent. That lateral raise form is text-book perfect now!', 'Shoulders are starting to look more defined. The extra volume from last month is paying off!', 55),
(1, '2026-03-19', 'Great chest session! Your bench press form is nearly perfect. Keep pushing!', 'Feeling confident with my form now. Bench press has become my favorite lift. Consistent improvement.', 62),
(1, '2026-03-23', 'Back and biceps. Pull-ups reaching fatigue at 8 reps. Excellent work ethic today!', 'Great arm pump today. Did extra bicep work and feel like my arms are getting bigger. Very motivating!', 68),
(1, '2026-03-26', 'Core work this week - preparing for more advanced exercises next month. Planks at 2 minutes!', 'Core is definitely stronger. Held planks for 2 minutes which is great. Abs are starting to show!', 45),
(1, '2026-03-29', 'End of month check-in: Strength is up across all lifts. Recovery is good. Keep this up!', 'Amazing month! All my lifts have increased and I\'m feeling more motivated than ever. Ready for April!', 70);

-- ============================================
-- INSERT WORKOUT SESSIONS - APRIL 2026
-- ============================================
INSERT INTO `workout_sessions` (`user_id`, `session_date`, `trainer_note`, `user_note`, `duration_total_minutes`) VALUES
(1, '2026-04-02', 'Starting new training cycle. Increase all weights by 5%. Let\'s see that strength grow!', 'New cycle started! Weights increased across the board. Feeling pumped and ready to crush April goals.', 65),
(1, '2026-04-06', 'Upper body day. Bench press hitting harder. You\'re in a great place strength-wise!', 'Bench press felt easier with the increased weight than expected. Body is adapting well to the progression.', 60),
(1, '2026-04-09', 'Back is stronger than ever! Consider trying weighted pull-ups next session.', 'Trainer suggested weighted pull-ups - a bit nervous but excited to try! Pull-ups feeling very strong.', 72),
(1, '2026-04-13', 'Legs - you\'re definitely in the advanced zone now. Form is excellent!', 'Hitting new PRs on leg press. This consistent training is really paying off. Strong finish to the week!', 75),
(1, '2026-04-16', 'Shoulder and arm integration work. Great compound movement today!', 'Tried some new shoulder exercises today. Mixing it up keeps things fresh and targets muscles differently.', 58),
(1, '2026-04-20', 'Chest feels massive! Pump is looking great. Keep up the amazing work!', 'Chest is definitely more defined than a month ago. All the work is showing visible results now!', 63),
(1, '2026-04-23', 'Full body session - power day! Your strength levels are impressive.', 'End of month and feeling strong across all lifts. Really glad I started this training program!', 80),
(1, '2026-04-27', 'Deload week starting. Light work to prepare for next cycle. Recover well!', 'Taking it easy to recover before the next push. Body needs this after a heavy month of training.', 42);

-- ============================================
-- INSERT EXERCISE LOGS - FEBRUARY 2026
-- ============================================
-- Feb 2: Chest Day
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(1, 1, 4, 8, 100, NULL), -- Bench Press
(1, 2, 3, 10, 30, NULL), -- Incline Dumbbell Press
(1, 3, 3, 12, NULL, 15);  -- Cable Flyes

-- Feb 5: Back Day
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(2, 6, 4, 8, NULL, NULL), -- Pull-ups
(2, 5, 4, 10, 80, NULL),  -- Bent Over Rows
(2, 7, 3, 12, 80, NULL);  -- Lat Pulldowns

-- Feb 9: Leg Day
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(3, 8, 4, 6, 135, NULL),  -- Squats
(3, 9, 4, 10, 150, NULL), -- Leg Press
(3, 10, 3, 12, 70, NULL); -- Leg Curls

-- Feb 12: Shoulder & Arms
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(4, 13, 4, 8, 60, NULL),  -- Overhead Press
(4, 14, 4, 12, 15, NULL), -- Lateral Raises
(4, 17, 3, 10, 25, NULL); -- Hammer Curls

-- Feb 16: Full Body
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(5, 1, 3, 8, 100, NULL),  -- Bench Press
(5, 5, 3, 10, 80, NULL),  -- Bent Over Rows
(5, 8, 3, 6, 135, NULL);  -- Squats

-- Feb 19: Chest Focus
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(6, 1, 5, 5, 105, NULL),  -- Bench Press (with pause reps)
(6, 2, 4, 8, 32, NULL),   -- Incline Dumbbell Press
(6, 3, 3, 12, NULL, 20);  -- Cable Flyes

-- Feb 23: Back Day
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(7, 5, 4, 10, 85, NULL),  -- Bent Over Rows
(7, 6, 4, 7, NULL, NULL), -- Pull-ups
(7, 4, 2, 3, 160, NULL);  -- Deadlift

-- Feb 26: Light Cardio & Stretch
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(8, 17, 1, NULL, NULL, 30); -- Treadmill (easy pace)

-- ============================================
-- INSERT EXERCISE LOGS - MARCH 2026
-- ============================================
-- March 2: Deload Week
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(9, 1, 3, 10, 85, NULL),  -- Bench Press (light)
(9, 5, 3, 10, 70, NULL);  -- Bent Over Rows (light)

-- March 5: Chest
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(10, 1, 4, 8, 102, NULL), -- Bench Press
(10, 2, 4, 10, 32, NULL), -- Incline Dumbbell Press
(10, 3, 3, 12, NULL, 18);

-- March 9: Back
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(11, 6, 4, 9, NULL, NULL), -- Pull-ups (9 reps!)
(11, 5, 4, 10, 85, NULL),  -- Bent Over Rows
(11, 4, 3, 2, 165, NULL);  -- Deadlift

-- March 12: Legs
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(12, 8, 4, 6, 137, NULL),  -- Squats
(12, 9, 4, 10, 170, NULL), -- Leg Press (up 20kg!)
(12, 10, 3, 12, 75, NULL); -- Leg Curls

-- March 15: Shoulders
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(13, 13, 4, 8, 62, NULL),  -- Overhead Press
(13, 14, 4, 12, 16, NULL), -- Lateral Raises
(13, 15, 3, 15, NULL, 15); -- Face Pulls

-- March 19: Chest
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(14, 1, 4, 8, 105, NULL),  -- Bench Press
(14, 2, 4, 10, 34, NULL),  -- Incline Dumbbell Press
(14, 3, 3, 12, NULL, 20);

-- March 23: Back & Biceps
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(15, 6, 4, 8, NULL, NULL), -- Pull-ups
(15, 5, 4, 10, 87, NULL),  -- Bent Over Rows
(15, 17, 3, 10, 26, NULL); -- Hammer Curls

-- March 26: Core Work
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(16, 19, 3, NULL, NULL, 2), -- Planks (2 minutes)
(16, 20, 3, NULL, NULL, 12); -- Ab Wheel

-- March 29: End of Month Full Body
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(17, 1, 4, 8, 105, NULL),  -- Bench Press
(17, 5, 4, 10, 87, NULL),  -- Bent Over Rows
(17, 8, 4, 6, 138, NULL);  -- Squats

-- ============================================
-- INSERT EXERCISE LOGS - APRIL 2026
-- ============================================
-- April 2: New Cycle Start
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(18, 1, 4, 8, 110, NULL),  -- Bench Press (+5%)
(18, 5, 4, 10, 91, NULL);  -- Bent Over Rows (+5%)

-- April 6: Upper Body
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(19, 1, 4, 8, 110, NULL),  -- Bench Press
(19, 2, 4, 10, 36, NULL),  -- Incline Dumbbell Press
(19, 3, 3, 12, NULL, 22);

-- April 9: Back (Weighted Pull-ups!)
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(20, 6, 4, 6, 10, NULL),  -- Weighted Pull-ups (10kg added!)
(20, 5, 4, 10, 91, NULL),  -- Bent Over Rows
(20, 4, 3, 2, 170, NULL);  -- Deadlift

-- April 13: Legs
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(21, 8, 4, 6, 145, NULL),  -- Squats
(21, 9, 4, 10, 180, NULL), -- Leg Press
(21, 10, 3, 12, 80, NULL); -- Leg Curls

-- April 16: Shoulders & Arms
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(22, 13, 4, 8, 65, NULL),   -- Overhead Press
(22, 14, 4, 12, 17, NULL),  -- Lateral Raises
(22, 17, 4, 10, 28, NULL);  -- Hammer Curls

-- April 20: Chest
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(23, 1, 4, 8, 112, NULL),  -- Bench Press
(23, 2, 4, 10, 36, NULL),  -- Incline Dumbbell Press
(23, 3, 3, 12, NULL, 22);

-- April 23: Full Body Power
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(24, 1, 4, 8, 110, NULL),   -- Bench Press
(24, 5, 4, 10, 91, NULL),   -- Bent Over Rows
(24, 8, 4, 6, 145, NULL),   -- Squats
(24, 6, 3, 7, 12, NULL),    -- Weighted Pull-ups
(24, 13, 3, 8, 65, NULL);   -- Overhead Press

-- April 27: Deload Week
INSERT INTO `exercise_logs` (`session_id`, `exercise_id`, `sets`, `reps`, `weight_kg`, `duration_minutes`) VALUES
(25, 17, 1, NULL, NULL, 30); -- Treadmill (easy cardio)
