const express = require("express")
const router = express.Router();
const db = require('../db'); // adjust path if needed
const CryptoJS = require("crypto-js");
const apiLogger = require("../middleware/apiLogger");

const SECRET_KEY = process.env.SECRET_KEY 

router.get('/questions', async (req, res) => {
  try {
    const results = await db.query('CALL GetAllQuestions()');

    
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
  const { data } = req.body;


  if (!data) {
    return res.status(400).json({ error: 'Missing encrypted payload' });
  }

  let decrypted;
  try {
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (err) {
    console.error('❌ Failed to decrypt:', err.message);
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }


  const { roll_no, responses } = decrypted;

  if (!roll_no || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;

  try {
    // You can optionally check if the candidate exists here,
    // or rely on the procedure to throw an error
    for (const r of responses) {
      const { question_id, option_id, rating } = r;

      if (
        typeof question_id !== 'number' ||
        typeof option_id !== 'number' ||
        typeof rating !== 'number'
      ) continue;

      await db.query('CALL SubmitResponse(?, ?, ?, ?, ?)', [
        roll_no,
        question_id,
        option_id,
        rating,
        ip_address
      ]);
    }

    res.status(200).json({ message: 'Responses submitted successfully' });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error saving responses:`, err);
    const message = err?.sqlMessage || err.message;
    res.status(500).json({ error: message.includes('Candidate not found') ? 'Candidate not found' : 'Internal server error' });
  }
});



// Get candidate responses
// router.post('/responses/fetch',apiLogger,  async (req, res) => {
//   const { roll_no } = req.body;

//   if (!roll_no) {
//     return res.status(400).json({ error: 'SSO ID is required' });
//   }

//   try {
//     // Check if candidate exists
//     const [candidates] = await db.query(
//       'SELECT id FROM candidates WHERE roll_no = ?',
//       [roll_no]
//     );

//     if (candidates.length === 0) {
//       return res.status(404).json({ error: 'Candidate not found' });
//     }


//     const candidateId = candidates.id;

//     // Fetch detailed responses
//     const responses = await db.query(`
//       SELECT 
//         r.question_id,
//         q.text AS question_text,
//         o.text AS option_text,
//         r.rating
//       FROM responses r
//       JOIN questions q ON r.question_id = q.id
//       LEFT JOIN options o ON r.option_id = o.id
//       WHERE r.candidate_id = ?
//       ORDER BY r.question_id;
//     `, [candidateId]);

//     if (responses.length === 0) {
//       return res.status(404).json({ error: 'No responses found for this candidate' });
//     }

    
//     const encrypted = CryptoJS.AES.encrypt(JSON.stringify(responses), SECRET_KEY).toString();


//     res.status(200).json({message: "Data fetched successfully" ,sso_id, encrypted });
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}] ❌ Error fetching responses:`, err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });


router.post('/responses/fetch', apiLogger, async (req, res) => {
  const { roll_no } = req.body;

  if (!roll_no) {
    return res.status(400).json({ error: 'Roll number is required' });
  }

  try {
    // Call stored procedure using roll_no
    const [responses] = await db.query('CALL FetchCandidateResponsesByRollNo(?)', [roll_no]);

    if (!responses || responses.length === 0 || responses[0].length === 0) {
      return res.status(404).json({ error: 'No responses found for this candidate' });
    }

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(responses[0]), SECRET_KEY).toString();

    res.status(200).json({ message: "Data fetched successfully", roll_no, encrypted });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Error fetching responses:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/encrypted-data', async (req, res) => {
  const data =  {
    "roll_no": "CS2023001",
    "responses": [
      {
        "question_id": 1,
        "option_id": 2,
        "rating": 4
      },
      {
        "question_id": 2,
        "option_id": 3,
        "rating": 5
      }
    ]
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid or missing JSON object to encrypt' });
  }

  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    res.status(200).json({ data: encrypted });
  } catch (err) {
    console.error('❌ Error encrypting data:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;

