DELIMITER $$

CREATE PROCEDURE GetAllQuestions()
BEGIN
  SELECT 
    s.id AS section_id, s.name AS section_name,
    q.id AS question_id, q.question_text AS question_text,
    o.id AS option_id, o.text AS option_text, o.rating
  FROM sections s
  JOIN questions q ON q.section_id = s.id
  LEFT JOIN options o ON o.question_id = q.id
  ORDER BY s.id, q.id, o.id;
END $$

DELIMITER ;