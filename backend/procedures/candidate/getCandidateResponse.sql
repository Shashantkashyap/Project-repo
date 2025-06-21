DELIMITER $$

CREATE PROCEDURE GetCandidateResponses(IN ssoId VARCHAR(100))
BEGIN
  DECLARE cid INT;

  SELECT id INTO cid FROM candidates WHERE sso_id = ssoId;

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
END $$

DELIMITER ;