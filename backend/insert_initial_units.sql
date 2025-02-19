USE role_based_auth;

-- Insert initial units for the default regular user
-- Note: Replace 2 with the actual user ID if different
INSERT INTO units (unit_number, unit_name, userId) VALUES
(1, 'Unit 1', 2),
(2, 'Unit 2', 2),
(3, 'Unit 3', 2);
