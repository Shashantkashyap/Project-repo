DELIMITER $$

CREATE PROCEDURE SubmitResponse (
  IN p_roll_no VARCHAR(255),
  IN p_question_id INT,
  IN p_option_id INT,
  IN p_rating INT,
  IN p_ip_address VARCHAR(255)
)
BEGIN
  DECLARE v_candidate_id INT;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_candidate_id = NULL;

  -- Get candidate ID by roll_no
  SELECT id INTO v_candidate_id
  FROM candidates
  WHERE roll_no = p_roll_no
  LIMIT 1;

  -- If candidate not found, exit silently or handle as needed
  IF v_candidate_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Candidate not found';
  END IF;

  -- Insert or update the response
  INSERT INTO responses (candidate_id, question_id, option_id, rating, ip_address)
  VALUES (v_candidate_id, p_question_id, p_option_id, p_rating, p_ip_address)
  ON DUPLICATE KEY UPDATE
    option_id = VALUES(option_id),
    rating = VALUES(rating),
    ip_address = VALUES(ip_address);
END $$

DELIMITER ;
