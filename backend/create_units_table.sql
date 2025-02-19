USE role_based_auth;

CREATE TABLE units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unit_number INT NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    userId INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE KEY unique_user_unit (userId, unit_number)
);
