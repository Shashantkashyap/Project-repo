DELIMITER $$

CREATE PROCEDURE LoginAdmin (
  IN input_phone VARCHAR(20)
)
BEGIN
  SELECT id, phone_number, password
  FROM users
  WHERE phone_number = input_phone;
END$$

DELIMITER ;
