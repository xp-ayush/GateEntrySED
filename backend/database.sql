DROP DATABASE IF EXISTS role_based_auth;
CREATE DATABASE role_based_auth;

USE role_based_auth;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@example.com', '$2a$10$HMWpVkZzVQYXVLIBJXxBPOqfR4YPXwYWu2yQoqKqxNL3UhKHZdKDe', 'admin');

-- Insert a default regular user (password: user123)
INSERT INTO users (name, email, password, role) VALUES
('Regular User', 'user@example.com', '$2a$10$YEwPHQWMnklSg/tCbQvxBOCRZ0YqITVqUCA9PwJrT.IFOGhF7P0Uy', 'user');

-- Create entries table
CREATE TABLE entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    serialNumber VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    driverMobile VARCHAR(15),
    driverName VARCHAR(100) NOT NULL,
    vehicleNumber VARCHAR(20) NOT NULL,
    vehicleType VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    loadingUnload VARCHAR(20),
    timeIn TIME NOT NULL,
    timeOut TIME,
    checkBy VARCHAR(100),
    remarks TEXT,
    recordedBy VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

ALTER TABLE entries
ADD COLUMN recordedBy VARCHAR(100) NOT NULL AFTER remarks;
