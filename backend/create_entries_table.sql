USE role_based_auth;

-- Create entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS entries (
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
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);
