DELIMITER $$

CREATE PROCEDURE DeleteAdmin (
  IN input_id INT
)
BEGIN
  DECLARE exists_check INT;

  SELECT COUNT(*) INTO exists_check FROM users WHERE id = input_id;

  IF exists_check = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Admin not found';
  ELSE
    DELETE FROM users WHERE id = input_id;
  END IF;
END$$

DELIMITER ;
