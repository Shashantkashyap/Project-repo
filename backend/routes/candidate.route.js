const express = require("express")
const router = express.Router();
const db = require('../db'); // adjust path if needed
const CryptoJS = require("crypto-js");
const apiLogger = require("../middleware/apiLogger");

const SECRET_KEY = process.env.SECRET_KEY 

router.get('/questions', async (req, res) => {
  try {
    const [results] = await db.query('CALL GetAllQuestions()');

    console.log( results , "shdgfsg");
    const rows = results[0]; // MySQL wraps results from stored procedures

    const sectionsMap = new Map();

    rows.forEach(row => {
      if (!sectionsMap.has(row.section_id)) {
        sectionsMap.set(row.section_id, {
          section_id: row.section_id,
          section_name: row.section_name,
          questionsMap: new Map()
        });
      }

      const section = sectionsMap.get(row.section_id);

      if (!section.questionsMap.has(row.question_id)) {
        section.questionsMap.set(row.question_id, {
          question_id: row.question_id,
          question_text: row.question_text,
          options: []
        });
      }

      if (row.option_id) {
        const question = section.questionsMap.get(row.question_id);
        question.options.push({
          option_id: row.option_id,
          option_text: row.option_text,
          rating: row.rating
        });
      }
    });

    const plainResponse = Array.from(sectionsMap.values()).map(section => ({
      section_id: section.section_id,
      section_name: section.section_name,
      questions: Array.from(section.questionsMap.values())
    }));

    // Attach to logger
    res.locals._logResponse = plainResponse;

    // Encrypt before sending
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(plainResponse), SECRET_KEY).toString();

    res.status(200).json({ data: encrypted });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Server Error:`, err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
});




// router.get('/questions', async (req, res) => {
//   const query = `
//     SELECT 
//       s.id AS section_id, s.name AS section_name,
//       q.id AS question_id, q.question_text AS question_text,
//       o.id AS option_id, o.text AS option_text, o.rating
//     FROM sections s
//     JOIN questions q ON q.section_id = s.id
//     LEFT JOIN options o ON o.question_id = q.id
//     ORDER BY s.id, q.id, o.id;
//   `;

//   try {
//     const results = await db.query(query);


//     const sectionsMap = new Map();

//     results.forEach(row => {
//       if (!sectionsMap.has(row.section_id)) {
//         sectionsMap.set(row.section_id, {
//           section_id: row.section_id,
//           section_name: row.section_name,
//           questionsMap: new Map()
//         });
//       }

//       const section = sectionsMap.get(row.section_id);

//       if (!section.questionsMap.has(row.question_id)) {
//         section.questionsMap.set(row.question_id, {
//           question_id: row.question_id,
//           question_text: row.question_text,
//           options: []
//         });
//       }

//       if (row.option_id) {
//         const question = section.questionsMap.get(row.question_id);
//         question.options.push({
//           option_id: row.option_id,
//           option_text: row.option_text,
//           rating: row.rating
//         });
//       }
//     });

//     const response = Array.from(sectionsMap.values()).map(section => ({
//       section_id: section.section_id,
//       section_name: section.section_name,
//       questions: Array.from(section.questionsMap.values())
//     }));

//     console.log( response, "Response Data");

//     const encrypted = CryptoJS.AES.encrypt(JSON.stringify(response), SECRET_KEY).toString();

//     res.status(200).json({ data: encrypted });
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] ❌ Server Error:`, err);
//     res.status(500).json({ error: 'Unexpected server error' });
//   }
// });



router.post('/submit-responses', apiLogger, async (req, res) => {
 const { data } = req.body; // 🔐 encrypted data

  if (!data) {
    return res.status(400).json({ error: 'Missing encrypted payload' });
  }

  let decrypted;
  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)); // 🔓 now a JS object
  } catch (err) {
    console.error('❌ Failed to decrypt:', err.message);
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }

  const { sso_id, responses } = decrypted;

  if (!sso_id || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  // ✅ Extract IP address
  const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;

  try {
    let candidateId;

    const existingCandidate = await db.query(
      'SELECT id FROM candidates WHERE sso_id = ?',
      [sso_id]
    );

    if (existingCandidate.length > 0) {
      candidateId = existingCandidate[0].id;
    } else {
      const insertCandidate = await db.query(
        'INSERT INTO candidates (sso_id) VALUES (?)',
        [sso_id]
      );
      candidateId = insertCandidate.insertId;
    }

    // ✅ Now include ip_address in your INSERT
    for (const r of responses) {
      const { question_id, option_id, rating } = r;

      if (!question_id || !option_id || rating == null) continue;

      await db.query(
        `INSERT INTO responses (candidate_id, question_id, option_id, rating, ip_address)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
            option_id = VALUES(option_id), 
            rating = VALUES(rating),
            ip_address = VALUES(ip_address)`, // Optional: update IP if changed
        [candidateId, question_id, option_id, rating, ip_address]
      );
    }

    res.status(200).json({ message: 'Responses submitted successfully' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error saving responses:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get candidate responses
router.post('/responses/fetch',apiLogger,  async (req, res) => {
  const { sso_id } = req.body;

  if (!sso_id) {
    return res.status(400).json({ error: 'SSO ID is required' });
  }

  try {
    // Check if candidate exists
    const [candidates] = await db.query(
      'SELECT id FROM candidates WHERE sso_id = ?',
      [sso_id]
    );

    if (candidates.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }


    const candidateId = candidates.id;

    // Fetch detailed responses
    const responses = await db.query(`
      SELECT 
        r.question_id,
        q.text AS question_text,
        o.text AS option_text,
        r.rating
      FROM responses r
      JOIN questions q ON r.question_id = q.id
      LEFT JOIN options o ON r.option_id = o.id
      WHERE r.candidate_id = ?
      ORDER BY r.question_id;
    `, [candidateId]);

    if (responses.length === 0) {
      return res.status(404).json({ error: 'No responses found for this candidate' });
    }

    
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(responses), SECRET_KEY).toString();


    res.status(200).json({message: "Data fetched successfully" ,sso_id, encrypted });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching responses:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




module.exports = router;

