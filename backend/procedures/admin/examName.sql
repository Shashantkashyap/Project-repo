DELIMITER $$

CREATE PROCEDURE GetExamNames()
BEGIN
    SELECT exam_name
    FROM sections
    GROUP BY exam_name;
END$$

DELIMITER ;