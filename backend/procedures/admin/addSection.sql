DELIMITER $$

CREATE PROCEDURE AddSection (
    IN p_name VARCHAR(255),
    IN p_description TEXT,
    IN p_exam_name VARCHAR(255)
)
BEGIN
    INSERT INTO sections (name, description, exam_name)
    VALUES (p_name, p_description, p_exam_name);
END$$

DELIMITER ;