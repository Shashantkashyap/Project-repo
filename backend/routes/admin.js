const express = require("express")
const router = express.Router();
const db = require('../db'); // adjust path if needed
const CryptoJS = require("crypto-js");
const apiLogger = require("../middleware/apiLogger");

const SECRET_KEY = process.env.SECRET_KEY 



router.post("/create-admin", apiLogger, async (req, res) => {
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
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone and password are required" });
  }

  try {
    const [resultSets] = await db.query("CALL LoginAdmin(?)", [phone]);
    const adminResults = resultSets[0];

    if (!adminResults || adminResults.length === 0) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    const admin = adminResults[0];

    const decryptedPassword = CryptoJS.AES.decrypt(admin.password, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword !== password) {
      return res.status(401).json({ error: "Invalid phone or password" });
    }

    res.status(200).json({ success: true, message: "Login successful", adminId: admin.id });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/get-admins", apiLogger, async (req, res) => {
  try {
    const [resultSets] = await db.query("CALL GetAllAdmins()");
    const admins = resultSets[0];

    if (!admins || admins.length === 0) {
      return res.status(404).json({ error: "No admins found" });
    }

    res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/delete-admin", apiLogger, async (req, res) => {
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


router.post("/update-question", apiLogger, async (req, res) => {
  const { question } = req.body;

  if (
    !question ||
    !question.question_id ||
    !question.question_text ||
    !Array.isArray(question.options)
  ) {
    return res.status(400).json({ error: "Invalid request: question_id, text, and options are required" });
  }

  const { question_id, question_text, options } = question;

  try {
    // 1. Update the question text
    await db.query(
      `UPDATE questions SET text = ? WHERE id = ?`,
      [question_text, question_id]
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


// Add new section
router.post('/add-section', async (req, res) => {
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

    // MySQL returns result as [[resultSet], ...], insertId in result[0][0].id
    const responsePayload = {
      message: 'Section added successfully',
      // You can return last inserted id if needed by SELECT LAST_INSERT_ID() in SP
    };

    const encryptedResponse = CryptoJS.AES.encrypt(
      JSON.stringify(responsePayload),
      SECRET_KEY
    ).toString();

    res.status(201).json({ data: encryptedResponse });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error adding section:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;