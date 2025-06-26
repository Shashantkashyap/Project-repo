DELIMITER //

CREATE PROCEDURE delete_question(IN p_question_id INT)
BEGIN
  -- Delete all options linked to the question
  DELETE FROM options WHERE question_id = p_question_id;

  -- Delete the question itself
  DELETE FROM questions WHERE id = p_question_id;
END //

DELIMITER ;