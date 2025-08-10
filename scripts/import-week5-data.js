import { db } from "../server/db.ts";
import { students, weeklyProgressData } from "../shared/schema.ts";
import { eq } from "drizzle-orm";

const week5Data = [
  ["Aaditya Raj", "aadi2532", 27, 32, 39, 39, 58],
  ["Abhishek Singh", "Abhishek_2008", 11, 25, 40, 64, 68],
  ["Aditya", "Aadi_Singh_28", 0, 13, 28, 58, 83],
  ["Ajit Yadav", "Ajit_Yadav_2908", 6, 21, 36, 62, 76],
  ["Akanksha", "Akanksha_kushwaha_a", 22, 29, 48, 72, 84],
  ["Alok Raj", "alok-work23", 3, 9, 29, 53, 61],
  ["Aman Verma", "aman1640", 0, 4, 15, 15, 51],
  ["Aman Singh ", "Aman_Singh_Sitare", 123, 140, 176, 217, 243],
  ["Aman Adarsh", "amanadarsh1168", 0, 9, 26, 52, 69],
  ["Amit Kumar", "Amit_Kumar13", 3, 16, 31, 54, 65],
  ["Anamika Kumari", "tanamika", 4, 17, 42, 42, 55],
  ["Anand Singh", "of0DUuvBjV", 0, 0, 2, 12, 11],
  ["Anand Kumar Pandey", "Anand_Pandey123", 110, 139, 175, 218, 256],
  ["Anoop kumar", "Anoop_kumar123", 0, 8, 16, 53, 84],
  ["Anshu Kumar", "CodebyAnshu03", 4, 11, 19, 40, 61],
  ["Anuradha Tiwari", "anuradha_24", 52, 61, 94, 122, 134],
  ["Anushri Mishra", "Anushri_Mishra", 49, 53, 75, 90, 108],
  ["Aradhya patel", "aradhya789", 8, 20, 40, 50, 54],
  ["Arjun Kadam", "arjunkadampatil", 22, 57, 78, 112, 122],
  ["Arpita Tripathi", "Uny60jPJeO", 42, 53, 74, 91, 101],
  ["Arun kumar", "Arun_404", 0, 5, 12, 41, 41],
  ["Aryan Saini", "aryan8773", 15, 31, 57, 120, 160],
  ["Ashwin yadav", "ashwin-tech", 0, 5, 25, 49, 56],
  ["Ayush Kumar", "Ayush4Sony", 0, 5, 16, 41, 57],
  ["Ayush Kumar Yadav", "Ayush_Yadav_029", 9, 26, 42, 54, 63],
  ["Bhagwati", "Bhagwati323", 5, 27, 63, 98, 116],
  ["Bhaskar Mahato", "bhaskarmahato03", 1, 11, 27, 52, 67],
  ["Byagari Praveen Kumar ", "Mr_bpk_4433", 0, 9, 24, 44, 55],
  ["Challa Trivedh Kumar", "TrivedhChalla", 27, 41, 61, 87, 103],
  ["Chandan Giri", "WelcomeGseries", 12, 16, 31, 47, 47],
  ["Chiranjeet Biswas", "Chiranjeet_Biswas", 4, 5, 24, 60, 75],
  ["Debangsu Misra ", "debangsumisra", 18, 25, 40, 65, 90],
  ["Deepak Mandal", "AlgoMandal", 0, 0, 0, 0, 0],
  ["Dilip Vaishnav ", "Dilip_Vaishnav_07", 4, 8, 21, 56, 56],
  ["Dilip Suthar", "Dilip0552", 5, 15, 25, 49, 64],
  ["Disha Sahu", "Disha-01-alt", 30, 48, 68, 94, 101],
  ["Divyanshi Sahu", "ADHIINSVY13", 0, 8, 22, 54, 58],
  ["Divyanshi Rathour", "Divyanshirathour", 15, 21, 42, 62, 66],
  ["Ekta kumari", "EktaSaw1212", 20, 25, 48, 63, 83],
  ["Gaurav Rathore", "Gaurav_rathore96", 25, 35, 62, 87, 102],
  ["Gaurav kumar", "gaurav_vvv", 12, 14, 20, 51, 86],
  ["Gaurav Tiwari", "gauravtiwari_70", 5, 10, 20, 33, 55],
  ["Guman Singh Rajpoot", "Guman_singh_rajpoot", 8, 16, 52, 97, 120],
  ["Harisingh Rajpoot", "HarisinghRaj", 5, 25, 54, 98, 144],
  ["Harsh Chourasiya", "harshchourasiya295", 1, 30, 55, 120, 129],
  ["Harshit Chaturvedi", "thisharshit", 2, 18, 30, 65, 67],
  ["Himanshu kumar", "ansraaz86", 1, 14, 20, 55, 69],
  ["Himanshu Srivastav", "codeCrafter777", 33, 56, 71, 167, 178],
  ["Himanshu Kanwar Chundawat", "himanshu_chundawat", 16, 23, 28, 67, 69],
  ["Hirak Nath", "hirak__", 12, 21, 51, 78, 101],
  ["Hiranya Patil", "hiranya_patil", 7, 18, 49, 75, 105],
  ["Ishant Bhoyar", "Ishant_57", 38, 85, 121, 143, 156],
  ["Jagriti Pandey", "jagriti_Pandey01", 1, 5, 15, 22, 30],
  ["Jamal Akhtar", "kKJ7y7Q9Ks", 19, 30, 40, 60, 66],
  ["Janu Chaudhary", "Janu_Chaudhary", 41, 67, 89, 124, 131],
  ["KARANPAL SINGH RANAWAT", "krtechie", 0, 6, 41, 77, 112],
  ["khushi Narwariya", "khushi_narwariya", 18, 29, 50, 79, 101],
  ["Lakhan Rathore", "Lakhan_rathore", 0, 14, 19, 41, 63],
  ["Maneesh Sakhwar", "Maneesh_Sakhwar", 0, 4, 16, 21, 54],
  ["Mani Kumar", "MANIKUMAR7109", 9, 19, 44, 57, 57],
  ["Manish Chhaba ", "Chhaba_Manish", 0, 10, 21, 36, 50],
  ["Manish Kumar Tiwari", "manish__45", 156, 179, 211, 262, 301],
  ["Manoj Kharkar", "manojk909", 9, 21, 40, 78, 101],
  ["Manoj Dewda", "Manoj_Dewda022", 1, 14, 41, 67, 88],
  ["Mausam kumari", "Mausam-kumari", 23, 33, 68, 103, 116],
  ["Mayank Raj", "mayankRajRay", 0, 7, 19, 54, 74],
  ["Mehtab Alam", "alamehtab", 9, 16, 31, 63, 75],
  ["Mohammad Afzal Raza ", "Afzl_Raza", 4, 17, 29, 37, 56],
  ["MOHD MONIS", "codemon-07", 15, 19, 32, 50, 50],
  ["Mohit Sharma", "sharma_Mohit_2005", 13, 21, 37, 57, 71],
  ["Moirangthem Joel Singh", "JoelMoirangthem", 1, 10, 33, 68, 120],
  ["Monu Rajpoot", "Monurajpoot", 1, 15, 40, 78, 106],
  ["N.Arun Kumar", "Arunkumar087", 4, 12, 32, 53, 57],
  ["Neeraj Parmar", "Neeru888", 30, 35, 50, 70, 81],
  ["Nidhi Kumari", "Nid_Singh", 105, 120, 130, 153, 153],
  ["NIKHIL Chaurasiya", "Rdxnikhil", 6, 15, 21, 37, 50],
  ["Nikhil Kumar Mehta", "Nikhil_KM_04", 9, 41, 60, 93, 104],
  ["Nirmal Kumar", "r2GUlBuyLZ", 18, 27, 39, 46, 46],
  ["Nirmal Mewada", "nirmal_M01", 2, 8, 11, 39, 65],
  ["Ompal Yadav", "om_codes1", 2, 2, 12, 45, 50],
  ["Pawan Kushwah ", "pawankushwah", 12, 26, 50, 84, 90],
  ["Pinky Rana", "ranapink398", 0, 4, 14, 48, 58],
  ["Pooran Singh", "pooransingh01", 8, 26, 35, 55, 68],
  ["Prabhat Patidar", "Prabhat7987", 29, 46, 70, 73, 81],
  ["Prachi Dhakad", "prachiDhakad", 51, 79, 95, 129, 152],
  ["Pragati Chauhan", "Chauhan_Pragati", 31, 51, 87, 116, 116],
  ["Pranjal Dubey", "Pranjal428", 10, 20, 33, 53, 76],
  ["Prem Kumar", "prem2450", 6, 21, 41, 59, 86],
  ["Prem Shankar Kushwaha", "PCodex9", 2, 11, 25, 57, 67],
  ["Prerana Rajnag", "preranarajnag", 1, 10, 31, 51, 62],
  ["Priya Saini", "Priya_saini2004", 30, 45, 83, 118, 139],
  ["Priyadarshi Kumar", "iPriyadarshi", 78, 87, 122, 142, 179],
  ["Pushpraj singh", "Pushpraj_DSA", 0, 10, 26, 57, 57],
  ["Rahul Kumar", "rahu48", 0, 16, 24, 59, 62],
  ["Rahul Kumar Verma", "RahulVermaji", 7, 23, 43, 43, 70],
  ["Rajeev Yadav", "kn1gh7t", 7, 10, 32, 62, 67],
  ["Rajiv Kumar", "rajiv1478", 10, 16, 26, 61, 63],
  ["Rakshita K Biradar", "RakshitaKBiradar", 3, 8, 24, 74, 93],
  ["Ramraj Nagar", "Ramrajnagar", 37, 48, 85, 109, 110],
  ["Rani Kumari", "123_Rani", 110, 130, 168, 207, 219],
  ["Ranjeet kumar yadav", "DL6FbStsPL", 3, 8, 23, 40, 54],
  ["Ravi Mourya", "MouryaRavi", 0, 14, 21, 46, 60],
  ["Ravi Rajput", "RAVI-RAJPUT-UMATH", 1, 8, 25, 62, 85],
  ["Ritesh jha", "RITESH12JHA24", 1, 6, 19, 41, 60],
  ["Ritik Singh", "Ritik_Singh_2311", 61, 68, 101, 125, 141],
  ["Rohit Malviya", "RohitMelasiya", 7, 10, 35, 59, 59],
  ["Rohit Kumar", "rkprasad90600", 0, 8, 23, 52, 52],
  ["Sajan Kumar", "Sajan_kumar45", 5, 5, 5, 5, 5],
  ["Samina Sultana", "Samina_Sultana", 57, 65, 94, 130, 150],
  ["Sandeep Kumar", "sandeepsinu79", 0, 9, 17, 45, 45],
  ["Sandhya Kaushal", "Sandhya_Kaushal", 11, 24, 35, 64, 71],
  ["Sandhya Parmar", "Sandhya_Parmar", 80, 90, 100, 112, 120],
  ["Sarthaksuman Mishra", "sarthak-26", 0, 12, 18, 64, 73],
  ["Satish Mahto", "kr_satish", 8, 23, 40, 68, 79],
  ["Saurabh Bisht", "bocchi_277", 0, 4, 27, 60, 81],
  ["Shahid Ansari", "shahidthisside", 0, 4, 19, 54, 72],
  ["Shalini Priya", "Shalini_Priya29", 5, 13, 22, 62, 83],
  ["Shilpi shaw", "shilpishaw", 52, 65, 100, 136, 171],
  ["Shivam Shukla", "itz_shuklajii", 0, 17, 28, 50, 85],
  ["Shivam Shukla", "shivamm-shukla", 0, 7, 16, 52, 90],
  ["Shivang Dubey", "Shivangdubey9", 0, 11, 31, 67, 87],
  ["Shlok Gupta", "shlokg62", 69, 86, 103, 124, 154],
  ["Shreyank Sthavaramath", "shreyank_s", 84, 95, 102, 129, 144],
  ["Shubham Kang", "Shubham_Kang", 6, 20, 32, 58, 63],
  ["Sneha Shaw", "Sneha6289", 22, 35, 47, 70, 89],
  ["Sunny Kumar", "sunny_kumar_1", 38, 47, 59, 94, 97],
  ["Surveer Singh Rao", "Surveer686", 22, 40, 69, 106, 130],
  ["Swati Kumari", "Swati_Kumari_142", 112, 137, 162, 204, 228],
  ["Suyash Yadav", "yadavsuyash723", 83, 91, 102, 123, 132],
  ["Ujjval Baijal", "Ujjwal_Baijal", 4, 11, 24, 49, 62],
  ["Uppara Sai Maithreyi ", "sai_maithri", 11, 23, 44, 72, 83],
  ["Vinay Kumar", "Vinay_Prajapati", 2, 18, 41, 69, 97],
  ["Tamnna parveen", "Tamnnaparvreen", 8, 13, 40, 55, 71],
  ["Vinay Kumar Gupta", "vinay_gupta01", 0, 0, 11, 37, 38],
  ["Vishal Bhardwaj", "vishalbhardwaj123", 0, 7, 18, 35, 51],
  ["Vishal Kumar", "kumar_vishal_01", 0, 12, 29, 43, 64],
  ["Vivek Kumar", "its_vivek_001", 0, 5, 15, 20, 20],
  ["Vivek kumar", "vivek_75", 3, 12, 30, 46, 63],
  ["Yuvraj Chirag", "Yuvraj_Chirag", 85, 101, 126, 155, 181],
  ["Yuvraj Singh Bhati", "yuvrajsinghbhati01", 15, 24, 44, 66, 90],
  ["Naman Damami", "namandamami", 0, 7, 14, 51, 84],
  ["Ajay jatav", "Ajayjatav", 0, 15, 37, 73, 93],
  ["Kuldeep Saraswat", "Kuldeep_Saraswat", 0, 5, 10, 23, 53]
];

async function importWeek5Data() {
  let imported = 0;
  let updated = 0;
  let errors = [];

  console.log("Starting Week 5 data import...");

  for (const [name, username, week1, week2, week3, week4, week5] of week5Data) {
    try {
      // Find student by username
      const studentResult = await db.select().from(students).where(eq(students.leetcodeUsername, username)).limit(1);
      
      if (studentResult.length === 0) {
        errors.push(`Student not found: ${name} (${username})`);
        continue;
      }

      const student = studentResult[0];
      
      // Calculate progress increments
      const week2Progress = week2 - week1;
      const week3Progress = week3 - week2;
      const week4Progress = week4 - week3;
      const lastWeekToCurrentIncrement = week5 - week4;
      
      // Calculate totals
      const totalScore = week1 + week2 + week3 + week4 + week5;
      const averageWeeklyGrowth = Math.round((week2Progress + week3Progress + week4Progress + lastWeekToCurrentIncrement) / 4);

      const progressData = {
        studentId: student.id,
        week1Score: week1,
        week2Score: week2,
        week3Score: week3,
        week4Score: week4,
        currentWeekScore: week5,
        lastWeekToCurrentIncrement,
        week2Progress,
        week3Progress,
        week4Progress,
        totalScore,
        averageWeeklyGrowth
      };

      // Check if weekly progress data already exists
      const existingResult = await db.select().from(weeklyProgressData).where(eq(weeklyProgressData.studentId, student.id)).limit(1);
      
      if (existingResult.length > 0) {
        // Update existing data
        await db.update(weeklyProgressData)
          .set(progressData)
          .where(eq(weeklyProgressData.studentId, student.id));
        updated++;
        console.log(`Updated: ${name} - Week5: ${week5} (Increment: +${lastWeekToCurrentIncrement})`);
      } else {
        // Create new data
        await db.insert(weeklyProgressData).values(progressData);
        imported++;
        console.log(`Imported: ${name} - Week5: ${week5} (Increment: +${lastWeekToCurrentIncrement})`);
      }
    } catch (error) {
      console.error(`Error processing ${name}:`, error);
      errors.push(`Error processing ${name}: ${error.message}`);
    }
  }

  console.log("\n=== IMPORT SUMMARY ===");
  console.log(`✅ Imported: ${imported}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log("\nWeek 5 data import completed!");
}

// Run the import
importWeek5Data().catch(console.error);