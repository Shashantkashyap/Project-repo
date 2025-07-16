const express = require("express")
const router = express.Router();
const db = require('../db'); // adjust path if needed
const CryptoJS = require("crypto-js");
const apiLogger = require("../middleware/apiLogger");
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateAdmin = require('../middleware/authenticateAdmin');

router.post("/create-admin", authenticateAdmin, apiLogger, async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required" });
  }

  try {
    // Encrypt password
    const encryptedPassword = CryptoJS.AES.encrypt(password, process.env.SECRET_KEY).toString();

    // Call procedure
    await db.query("CALL CreateAdmin(?, ?)", [phone, encryptedPassword]);

    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    if (error.message.includes("Admin with this contact already exists")) {
      return res.status(409).json({ error: error.message });
    }

    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/login-admins", apiLogger, async (req, res) => {
  // Extract the encrypted data from the request body
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "Missing encrypted payload" });
  }

  let decryptedData;
  let phone, password;
  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log(`[${new Date().toISOString()}] 🔑 Decrypted data:`, decryptedData);
    // decryptedData is already an object with phone and password
    ({ phone, password } = decryptedData);
    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Decryption failed:`, error);
    return res.status(400).json({ error: "Invalid encrypted payload" });
  }

  try {
    const [resultSets] = await db.query("CALL LoginAdmin(?)", [phone]);
    const adminResults = resultSets[0];

    if (!adminResults || adminResults.length === 0) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    const admin = adminResults;
    const decryptedPassword = CryptoJS.AES.decrypt(admin.password, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
    if (decryptedPassword !== password) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    // Generate JWT
    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Set cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // use true in production
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000, // 1 hour,
      path: '/', // ensure path matches
    });
    res.status(200).json({ success: true, message: "Login successful", adminId: admin.id, token });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout-admin", apiLogger, (req, res) => {
  console.log("Admin logging out");
  // Try clearing with options
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  });
  // Also try clearing without options (fallback)
  res.clearCookie('admin_token');
  res.status(200).json({ message: "Logged out successfully" });
});

router.post("/get-admins", authenticateAdmin, apiLogger, async (req, res) => {
  try {
    const [resultSets] = await db.query("CALL GetAllAdmins()");
    const admins = resultSets;

    if (!admins || admins.length === 0) {
      return res.status(404).json({ error: "No admins found" });
    }

    res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/delete-admin", authenticateAdmin, apiLogger, async (req, res) => {
  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ error: "Admin ID is required" });
  }

  try {
    await db.query("CALL DeleteAdmin(?)", [adminId]);
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    if (error.message.includes("Admin not found")) {
      return res.status(404).json({ error: error.message });
    }

    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/update-question", authenticateAdmin, apiLogger, async (req, res) => {
  const { question } = req.body;

  if (
    !question ||
    !question.question_id ||
    !question.question_text ||
    !Array.isArray(question.options)
  ) {
    return res.status(400).json({ error: "Invalid request: question_id, text, and options are required" });
  }

  const { question_id, question_text, options , section_id } = question;

  try {
    // 1. Update the question text
    await db.query(
      `UPDATE questions SET question_text = ?, section_id = ? WHERE id = ?`,
      [question_text, section_id , question_id]
    );

    // 2. Get existing options from DB
    const existingOptions = await db.query(
      `SELECT id FROM options WHERE question_id = ?`,
      [question_id]
    );
    const existingOptionIds = existingOptions.map(opt => opt.id);

    const incomingOptionIds = [];

    // 3. Process each option
    for (const opt of options) {
      if (!opt.option_text || opt.rating == null) continue;

      if (opt.option_id && opt.option_id !== 0) {
        // Update existing option
        await db.query(
          `UPDATE options SET text = ?, rating = ? WHERE id = ? AND question_id = ?`,
          [opt.option_text, opt.rating, opt.option_id, question_id]
        );
        incomingOptionIds.push(opt.option_id);
      } else if (opt.option_id === 0) {
        // Insert new option
        const result = await db.query(
          `INSERT INTO options (question_id, text, rating) VALUES (?, ?, ?)`,
          [question_id, opt.option_text, opt.rating]
        );
        incomingOptionIds.push(result.insertId);
      }
    }

    // 4. Delete options that were removed by the admin
    const toDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));
if (toDelete.length > 0) {
  const placeholders = toDelete.map(() => '?').join(', ');
  await db.query(
    `DELETE FROM options WHERE id IN (${placeholders}) AND question_id = ?`,
    [...toDelete, question_id]
  );
}

    res.status(200).json({ message: "Question and options updated successfully" });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error updating question:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post('/add-question', authenticateAdmin, apiLogger, async (req, res) => {
  const { question } = req.body;

  if (
    !question ||
    !question.section_id ||
    !question.question_text ||
    !Array.isArray(question.options)
  ) {
    return res.status(400).json({
      error: 'Invalid request: section_id, question_text, and options are required',
    });
  }

  const { section_id, question_text, options } = question;

  try {
    // Call the stored procedure
    await db.query('CALL AddQuestionToSection(?, ?, ?)', [
      section_id,
      question_text,
      JSON.stringify(options),
    ]);

    res.status(201).json({
      message: 'Question and options added successfully',
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error adding question to section:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/delete-question', authenticateAdmin, apiLogger, async (req, res) => {
  const { questionId } = req.body;

  if (!questionId) {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  const conn = await db.getConnection(); // assuming db pool supports getConnection()
  await conn.beginTransaction();

  try {
    // Optional: check if question exists
    const [question] = await conn.query('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (question.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Question not found' });
    }

    // Delete options
    await conn.query(`DELETE FROM options WHERE question_id = ?`, [questionId]);

    // Delete question
    await conn.query(`DELETE FROM questions WHERE id = ?`, [questionId]);

    await conn.commit();
    conn.release();

    res.status(200).json({ message: 'Question and its options deleted successfully' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error(`[${new Date().toISOString()}] ❌ Error deleting question:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Add new section
router.post('/add-section', authenticateAdmin, apiLogger, async (req, res) => {
  const { data: encryptedData } = req.body;

  if (!encryptedData) {
    return res.status(400).json({ error: 'Missing encrypted payload' });
  }

  let sectionData;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    sectionData = JSON.parse(decryptedText);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Decryption failed:`, error);
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }

  const { name, description = null, exam_name = null } = sectionData;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Section name is required and must be a string' });
  }

  try {
    // Call stored procedure
    const result = await db.query("CALL AddSection(?, ?, ?)", [
      name.trim(),
      description,
      exam_name
    ]);

    return res.status(201).json({
      message: 'Section added successfully',
      
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error adding section:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post("/get-sections", authenticateAdmin, apiLogger, async (req, res) => {
  try {
    const { exam_name } = req.body;
  
    if (!exam_name) {
      return res.status(400).json({ error: "Exam name is required" });
    }

    const sections = await db.query("Select * from sections where exam_name = ?", [exam_name]);

    res.status(200).json({ sections: sections });
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/get-exam-names', authenticateAdmin, apiLogger, async (req, res) => {
  try {
    const [rows] = await db.query("CALL GetExamNames();");

    if (!rows || rows[0].length === 0) {
      return res.status(404).json({ error: "No exam names found" });
    }

    res.status(200).json({ examNames: rows });
  } catch (error) {
    console.error("Error fetching exam names:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/get-submissions",  apiLogger, async (req, res) => {

  const {roll_no , exam_name} = req.body;

  if (!roll_no || !exam_name) {
    return res.status(400).json({ error: "Roll number and exam name are required" });
  }

  let status

  try {
   
    const candidate = await db.query("Select * from candidates where roll_no = ? and exam_name = ?", [roll_no, exam_name]);

    if (!candidate || candidate.length === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const [responses] = await db.query('CALL FetchCandidateResponsesByRollNo(?)', [roll_no]);
    if (!responses || responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this candidate' });
    }

    if(responses.length > 0) {
      status = "Completed";
    }else{
      status = "Pending";
    }

    return res.status(200).json({ message: "Data fetched successfully", candidate, status , responses });

    // const encrypted = CryptoJS.AES.encrypt(JSON.stringify(responses[0]), SECRET_KEY).toString();

    // res.status(200).json({ message: "Data fetched successfully", roll_no, encrypted });

  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }

})



router.post("/get-submissions-by-exam", apiLogger, async (req, res) => {
  
})

router.post("/get-all-pending-submissions", authenticateAdmin, apiLogger, async (req, res) => {
  const { exam_name, status = "Pending", roll_no } = req.body;

  let query = `SELECT * FROM candidates WHERE exam_name = ?`;
  let params = [exam_name];

  if (roll_no) {
    query += ` AND roll_no like ?`;
  params.push(`%${roll_no}%`);
  }

  console.log(`Fetching all submissions for exam: ${exam_name} with status: ${status}${roll_no ? ` and roll_no: ${roll_no}` : ''}`);

  try {
    const candidates = await db.query(query, params);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: "No candidates found for this exam" });
    }

    const submissions = [];
    for (const candidate of candidates) {
      const [responses] = await db.query('CALL FetchCandidateResponsesByRollNo(?)', [candidate.roll_no]);
      const candidateStatus = (responses && responses.length > 0) ? "Completed" : "Pending";
      if (status === "All" || status === candidateStatus) {
        submissions.push({
          ...candidate,
          status: candidateStatus,
        });
      }
    }

    return res.status(200).json({ message: "Data fetched successfully", submissions });

  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

router.post("/get-all-completed-submissions",  apiLogger, async (req, res) => {
  const { exam_name, status = "Completed", roll_no } = req.body;

  let query = `SELECT 
    c.*, 
    MIN(r.submitted_at) AS submission_date
FROM 
    candidates c
LEFT JOIN 
    responses r ON c.id = r.candidate_id
WHERE 
    exam_name = ?
GROUP BY 
    c.id;`;
  let params = [exam_name];

  if (roll_no) {
    query += ` AND roll_no like ?`;
    params.push(`%${roll_no}%`);
  }

  console.log(`Fetching all submissions for exam: ${exam_name} with status: ${status}${roll_no ? ` and roll_no: ${roll_no}` : ''}`);

  try {
    const candidates = await db.query(query, params);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: "No candidates found for this exam" });
    }

    console.log(candidates)

    const submissions = [];
    for (const candidate of candidates) {
      const [responses] = await db.query('CALL FetchCandidateResponsesByRollNo(?)', [candidate.roll_no]);
      const candidateStatus = (responses && responses.length > 0) ? "Completed" : "Pending";
      if (status === "All" || status === candidateStatus) {
        submissions.push({
          ...candidate,
          status: candidateStatus,
        });
      }
    }

    console.log(submissions);

    return res.status(200).json({ message: "Data fetched successfully", submissions });

  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

router.post("/edit-section", authenticateAdmin, apiLogger, async (req, res) => {
  const { section } = req.body;

  if (!section || !section.section_id || !section.name) {
    return res.status(400).json({ error: "Section ID and name are required" });
  }

  try {
    // Update section details
    await db.query(
      `UPDATE sections SET name = ?, description = ? WHERE id = ?`,
      [section.name, section.description || "", section.section_id]
    );

    res.status(200).json({ message: "Section updated successfully" });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/delete-section", authenticateAdmin, apiLogger, async (req, res) => {
  const { sectionId } = req.body;

  if (!sectionId) {
    return res.status(400).json({ error: "Section ID is required" });
  }

  try {
    // Delete options first (related to questions in the section)
    await db.query(
      "DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE section_id = ?)",
      [sectionId]
    );

    // Delete questions under the section
    await db.query("DELETE FROM questions WHERE section_id = ?", [sectionId]);

    // Finally, delete the section itself
    await db.query("DELETE FROM sections WHERE id = ?", [sectionId]);

    res.status(200).json({ message: "Section and its associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/add-section-to-new-exam" , authenticateAdmin, apiLogger, async (req, res) => {
  const { section } = req.body;

  if (!section || !section.name || !section.exam_name) {
    return res.status(400).json({ error: "Section name and exam name are required" });
  }

  try {
    // Call stored procedure to add section
    await db.query("CALL AddSectionToNewExam(?, ?)", [section.name, section.exam_name]);

    res.status(201).json({ message: "Section added to new exam successfully" });
  } catch (error) {
    console.error("Error adding section to new exam:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/edit-section", authenticateAdmin, apiLogger, async (req, res) => {
  const { section } = req.body;

  if (!section || !section.section_id || !section.name) {
    return res.status(400).json({ error: "Section ID and name are required" });
  }

  try {
    // Update section details
    await db.query(
      `UPDATE sections SET name = ?, description = ? WHERE id = ?`,
      [section.name, section.description || "", section.section_id]
    );

    res.status(200).json({ message: "Section updated successfully" });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/delete-section", authenticateAdmin, apiLogger, async (req, res) => {
  const { sectionId } = req.body;

  if (!sectionId) {
    return res.status(400).json({ error: "Section ID is required" });
  }

  try {
    // Delete options first (related to questions in the section)
    await db.query(
      "DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE section_id = ?)",
      [sectionId]
    );

    // Delete questions under the section
    await db.query("DELETE FROM questions WHERE section_id = ?", [sectionId]);

    // Finally, delete the section itself
    await db.query("DELETE FROM sections WHERE id = ?", [sectionId]);

    res.status(200).json({ message: "Section and its associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/add-section-to-new-exam" , authenticateAdmin, apiLogger, async (req, res) => {
  const { section } = req.body;

  if (!section || !section.name || !section.exam_name) {
    return res.status(400).json({ error: "Section name and exam name are required" });
  }

  try {
    // Call stored procedure to add section
    await db.query("CALL AddSectionToNewExam(?, ?)", [section.name, section.exam_name]);

    res.status(201).json({ message: "Section added to new exam successfully" });
  } catch (error) {
    console.error("Error adding section to new exam:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post ("login-test-candidates", async (req, res) => {
  const { sso_id, password } = req.body;

  if (!sso_id || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if(password !== "test1234") {
    return res.status(400).json({ error: "Invalid password" });
  }

  try {
        const candidate = await db.query(`SELECT * FROM candidates WHERE sso_id = ?`, [sso_id]);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.status(200).json({ message: "Login successful", candidate });
  } catch (error) {
    console.error("Error logging in test candidate:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;
