const express = require("express")
const router = express.Router();
const db = require('../db'); // adjust path if needed
const CryptoJS = require("crypto-js");
const apiLogger = require("../middleware/apiLogger");
const crypto = require('crypto'); // Added import for Node.js crypto module
const qs = require('querystring');
const axios = require('axios');



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








// router.post('/submit-responses', apiLogger, async (req, res) => {
//   const { data } = req.body;


//   if (!data) {
//     return res.status(400).json({ error: 'Missing encrypted payload' });
//   }

//   let decrypted;
//   try {
//     const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
//     decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
//   } catch (err) {
//     console.error('❌ Failed to decrypt:', err.message);
//     return res.status(400).json({ error: 'Invalid encrypted payload' });
//   }


//   const { roll_no, responses } = decrypted;

//   if (!roll_no || !Array.isArray(responses) || responses.length === 0) {
//     return res.status(400).json({ error: 'Invalid request data' });
//   }

//   const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;

//   try {
//     // You can optionally check if the candidate exists here,
//     // or rely on the procedure to throw an error
//     for (const r of responses) {
//       const { question_id, option_id, rating } = r;

//       if (
//         typeof question_id !== 'number' ||
//         typeof option_id !== 'number' ||
//         typeof rating !== 'number'
//       ) continue;

//       await db.query('CALL SubmitResponse(?, ?, ?, ?, ?)', [
//         roll_no,
//         question_id,
//         option_id,
//         rating,
//         ip_address
//       ]);
//     }








router.post('/submit-responses', apiLogger, async (req, res) => {
  console.log(`[${new Date().toISOString()}] 📥 Incoming request to /submit-responses`);

  const { data } = req.body;

  if (!data) {
    console.warn(`[${new Date().toISOString()}] ⚠️ Missing encrypted payload in request body`);
    return res.status(400).json({ error: 'Missing encrypted payload' });
  }

  let decrypted;
  try {
    console.log(`[${new Date().toISOString()}] 🔓 Attempting to decrypt payload...`);
    const bytes = CryptoJS.AES.decrypt(data, SECRET_KEY);
    decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log(`[${new Date().toISOString()}] ✅ Payload decrypted successfully`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to decrypt payload:`, err.message);
    return res.status(400).json({ error: 'Invalid encrypted payload' });
  }

  const { roll_no, sso_id, exam_name, responses , session } = decrypted;

  console.log(`[${new Date().toISOString()}] 📄 Decrypted Data:`, {
    roll_no,
    sso_id,
    exam_name,
    responsesLength: responses?.length,
    session
  });

  if (!sso_id || !exam_name) {
    console.warn(`[${new Date().toISOString()}] ⚠️ Missing required fields: sso_id or exam_name`);
    return res.status(400).json({ error: 'SSO ID and Exam Name are required' });
  }

  // 🔐 Step: Validate session using external API
  // try {
  //   console.log(`[${new Date().toISOString()}] 🔍 Validating session for SSO ID: ${sso_id}`);

  //   const formBody = qs.stringify({
  //     sessionValue: session,
  //     ssoID: sso_id
  //   });

  //   const validation = await axios.post(
  //     `http://${process.env.Validation_IP}/ia24/TokenValidationService.asmx/ValidateUser`,
  //     formBody,
  //     {
  //       headers: {
  //         'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //     }
  //   );

  //   const { data: validationData } = validation;

  //   if (validationData.status !== 200) {
  //     console.warn(`[${new Date().toISOString()}] ❌ Session validation failed: ${validationData.message}`);
  //     return res.redirect("http://localhost:5173/error?reason=session-validation-failed");
  //   }

  //   console.log(`[${new Date().toISOString()}] ✅ Session validated successfully`);
  // } catch (validationError) {
  //   console.error(`[${new Date().toISOString()}] ❌ Session validation request failed:`, validationError.message);
  //   return res.redirect("http://localhost:5173/error?reason=session-validation-error");
  // }

  if (!roll_no || !Array.isArray(responses) || responses.length === 0) {
    console.warn(`[${new Date().toISOString()}] ⚠️ Invalid roll_no or empty responses array`);
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const candidates = await db.query(`SELECT * FROM candidates WHERE roll_no = ? and exam_name = ?`, [roll_no, exam_name]);

  const sso_candidate = await db.query(`SELECT * FROM candidates WHERE sso_id = ?` , [sso_id]);

if (!sso_candidate || sso_candidate.length === 0) {
  return res.status(404).json({ error: 'Candidate not found with provided SSO ID' });
}


if (!candidates || candidates.length === 0) {
  return res.status(404).json({ error: 'Candidate not found' });
}

  if(candidates[0].id !== sso_candidate[0].id){
  return res.status(400).json({ error: 'Candidate roll number does not match with SSO ID' });
}


const candidate_id = candidates[0].id;

const existingResponses = await db.query(`SELECT * FROM responses WHERE candidate_id = ?`, [candidate_id]);

if (existingResponses.length > 0) {
   return res.status(400).json({ error: "Candidate already submit the response"});
}


  const ip_address = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  console.log(`[${new Date().toISOString()}] 🌐 Request received from IP: ${ip_address}`);

  const cleanResponses = responses.filter(r =>
    typeof r.question_id === 'number' &&
    typeof r.option_id === 'number' &&
    typeof r.rating === 'number'
  );

  if (cleanResponses.length === 0) {
    console.warn(`[${new Date().toISOString()}] ⚠️ No valid responses found in payload`);
    return res.status(400).json({ error: 'No valid responses found' });
  }

  try {
    console.log(`[${new Date().toISOString()}] 💾 Saving ${cleanResponses.length} responses to database...`);
    await db.query('CALL SubmitBulkResponses(?, ?, ?)', [
      roll_no,
      ip_address,
      JSON.stringify(cleanResponses)
    ]);
    console.log(`[${new Date().toISOString()}] ✅ Responses saved successfully for roll_no: ${roll_no}`);
    res.status(200).json({ message: 'Responses submitted successfully' });
  } catch (err) {
    const errorMsg = err?.sqlMessage || err.message;
    console.error(`[${new Date().toISOString()}] ❌ Error saving responses:`, errorMsg);
    res.status(500).json({
      error: errorMsg.includes('Candidate not found') ? 'Candidate not found' : 'Internal server error'
    });
  }
});



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

router.post("/fetch-roll-no" , async(req , res)=>{
  return res.status(200).json({
    success : true ,
    roll_no : "12345"
  })
})


// AES key and IV


const decryptAES = (encrypted) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.AES_key, 'utf-8'), Buffer.from(process.env.AES_iv, 'utf-8'));
  let decrypted = decipher.update(encrypted, 'base64', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
};

router.post("/check-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.redirect("http://13.201.44.91/error");
  }

  try {
    const decrypted = decryptAES(token);
    console.log("Decrypted token:", decrypted);

    // Parse the decrypted string as JSON
    let tokenObj;
    try {
      tokenObj = JSON.parse(decrypted);
    } catch (parseErr) {
      console.error("Failed to parse decrypted token as JSON:", parseErr.message);
      return res.status(400).send("Invalid token format");
    }

    // Access values from the token
    const { value, expires, session } = tokenObj;
    // Split the pipe-separated value
    const [sso_id, name, roll_no, exam_name] = value.split('|');
    console.log("Extracted values:", { sso_id, name, roll_no, exam_name });

    const candidates = await db.query(`SELECT * FROM candidates WHERE roll_no = ?`, [roll_no]);

if (!candidates || candidates.length === 0) {
  return res.status(404).json({ error: 'Candidate not found' });
}
console.log(candidates)
const candidate_id = candidates[0].id;

const existingResponses = await db.query(`SELECT * FROM responses WHERE candidate_id = ?`, [candidate_id]);

if (existingResponses.length > 0) {
   return res.redirect("http://13.201.44.91//error?reason=User already submit the form");
}

   
    const payloadData = {
      sso_id,
      name,
      roll_no,
      exam_name,
      expires,
      session
    };

   // const encrypted = CryptoJS.AES.encrypt(JSON.stringify(roll_no), SECRET_KEY).toString();

    const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(payloadData), SECRET_KEY).toString();
const safePayload = encodeURIComponent(encryptedPayload);

    if(sso_id){

return res.redirect(`http://localhost:5173?token=${safePayload}`);
    }

    
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return res.status(400).send("Invalid or corrupted token");
  }
});


module.exports = router;
