DELIMITER $$

CREATE PROCEDURE GetAllQuestions()
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'section_id', s.id,
        'section_name', s.name,
        'questions', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'question_id', q.id,
                    'question_text', q.question_text,
                    'options', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'option_id', o.id,
                                'option_text', o.text,
                                'rating', o.rating
                            )
                        )
                        FROM options o
                        WHERE o.question_id = q.id
                    )
                )
            )
            FROM questions q
            WHERE q.section_id = s.id
        )
    )
) AS result
FROM sections s;
END $$

DELIMITER ;