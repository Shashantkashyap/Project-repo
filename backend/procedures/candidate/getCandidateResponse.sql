DELIMITER $$

CREATE PROCEDURE FetchCandidateResponsesByRollNo (
  IN input_roll_no VARCHAR(255)
)
BEGIN
  DECLARE cid INT;

  -- Get candidate ID using roll_no
  SELECT id INTO cid FROM candidates WHERE roll_no = input_roll_no;

  -- If not found, return an empty result
  IF cid IS NULL THEN
    SELECT NULL AS question_id, NULL AS question_text, NULL AS option_text, NULL AS rating WHERE FALSE;
  ELSE
    -- Fetch candidate responses
    SELECT 
      r.question_id,
      q.text AS question_text,
      o.text AS option_text,
      r.rating
    FROM responses r
    JOIN questions q ON r.question_id = q.id
    LEFT JOIN options o ON r.option_id = o.id
    WHERE r.candidate_id = cid
    ORDER BY r.question_id;
  END IF;
END$$

DELIMITER ;
