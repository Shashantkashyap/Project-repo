DELIMITER $$

CREATE PROCEDURE CreateAdmin (
  IN input_phone VARCHAR(20),
  IN input_password TEXT
)
BEGIN
  DECLARE existing_count INT;

  SELECT COUNT(*) INTO existing_count
  FROM users
  WHERE phone_number = input_phone;

  IF existing_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Admin with this contact already exists';
  ELSE
    INSERT INTO users (phone_number, password)
    VALUES (input_phone, input_password);
  END IF;
END$$

DELIMITER ;