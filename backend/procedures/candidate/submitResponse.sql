DELIMITER $$

CREATE PROCEDURE InsertOrUpdateResponse(
  IN candidateId INT,
  IN questionId INT,
  IN optionId INT,
  IN rating INT,
  IN ipAddress VARCHAR(255)
)
BEGIN
  INSERT INTO responses (candidate_id, question_id, option_id, rating, ip_address)
  VALUES (candidateId, questionId, optionId, rating, ipAddress)
  ON DUPLICATE KEY UPDATE 
    option_id = VALUES(option_id),
    rating = VALUES(rating),
    ip_address = VALUES(ip_address);
END $$

DELIMITER ;