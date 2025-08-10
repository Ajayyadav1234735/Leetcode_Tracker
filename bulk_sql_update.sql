-- Bulk update weekly progress data for all students with present week - last week logic

-- Update Aditya
UPDATE weekly_progress_data 
SET week1_score = 0, week2_score = 13, week3_score = 28, week4_score = 58, week5_score = 83,
    week2_progress = 13, week3_progress = 15, week4_progress = 30, week5_progress = 25,
    average_weekly_growth = 21, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'Aadi_Singh_28');

-- Update Abhishek Singh
UPDATE weekly_progress_data 
SET week1_score = 11, week2_score = 25, week3_score = 40, week4_score = 64, week5_score = 68,
    week2_progress = 14, week3_progress = 15, week4_progress = 24, week5_progress = 4,
    average_weekly_growth = 14, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'Abhishek_2008');

-- Update KARANPAL SINGH RANAWAT
UPDATE weekly_progress_data 
SET week1_score = 0, week2_score = 6, week3_score = 41, week4_score = 77, week5_score = 112,
    week2_progress = 6, week3_progress = 35, week4_progress = 36, week5_progress = 35,
    average_weekly_growth = 28, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'krtechie');

-- Update Manish Kumar Tiwari
UPDATE weekly_progress_data 
SET week1_score = 156, week2_score = 179, week3_score = 211, week4_score = 262, week5_score = 301,
    week2_progress = 23, week3_progress = 32, week4_progress = 51, week5_progress = 39,
    average_weekly_growth = 36, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'manish__45');

-- Update Aman Verma
UPDATE weekly_progress_data 
SET week1_score = 0, week2_score = 4, week3_score = 15, week4_score = 15, week5_score = 51,
    week2_progress = 4, week3_progress = 11, week4_progress = 0, week5_progress = 36,
    average_weekly_growth = 13, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'aman1640');

-- Update Rahul Kumar Verma
UPDATE weekly_progress_data 
SET week1_score = 7, week2_score = 23, week3_score = 43, week4_score = 43, week5_score = 70,
    week2_progress = 16, week3_progress = 20, week4_progress = 0, week5_progress = 27,
    average_weekly_growth = 16, updated_at = NOW()
WHERE student_id = (SELECT id FROM students WHERE leetcode_username = 'RahulVermaji');