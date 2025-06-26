DELIMITER $$

CREATE PROCEDURE AddQuestionToSection (
    IN p_section_id INT,
    IN p_question_text TEXT,
    IN p_options_json JSON
)
BEGIN
    DECLARE v_question_id INT;
    DECLARE i INT DEFAULT 0;
    DECLARE v_option_text TEXT;
    DECLARE v_rating INT;
    DECLARE v_options_count INT;

    -- Insert question
    INSERT INTO questions (section_id, question_text)
    VALUES (p_section_id, p_question_text);

    SET v_question_id = LAST_INSERT_ID();

    -- Count how many options
    SET v_options_count = JSON_LENGTH(p_options_json);

    WHILE i < v_options_count DO
        SET v_option_text = JSON_UNQUOTE(JSON_EXTRACT(p_options_json, CONCAT('$[', i, '].option_text')));
        SET v_rating = JSON_UNQUOTE(JSON_EXTRACT(p_options_json, CONCAT('$[', i, '].rating')));

        IF v_option_text IS NOT NULL AND v_rating IS NOT NULL THEN
            INSERT INTO options (question_id, text, rating)
            VALUES (v_question_id, v_option_text, v_rating);
        END IF;

        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;
