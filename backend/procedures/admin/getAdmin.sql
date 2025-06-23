DELIMITER $$

CREATE PROCEDURE GetAllAdmins()
BEGIN
  SELECT id, phone_number FROM users;
END$$

DELIMITER ;
