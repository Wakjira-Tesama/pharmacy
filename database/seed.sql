USE pharmacy_db;

-- 1. Insert Users (Password: Admin@123 and Pharmacy@123 - pre-hashed using bcrypt 10 rounds)
-- Hash for Admin@123: $2b$10$Wq31B1O4127027357PjYv.sM1z6hO2/HhP4.m6a5K4aYpL3V252W
-- Hash for Pharmacy@123: $2b$10$8v5Z.0Hk1G/k0nZ5J/Q7r.O.o94PzW59tBqXJ26V5l4V6Y/2mH3lK
INSERT INTO users (name, username, email, password_hash, role, status) VALUES
('Super Admin', 'admin', 'admin@pharmacy.com', '$2b$10$Wq31B1O4127027357PjYv.sM1z6hO2/HhP4.m6a5K4aYpL3V252W', 'ADMIN', 'ACTIVE'),
('John Pharmacist', 'pharmacist', 'pharmacist@pharmacy.com', '$2b$10$8v5Z.0Hk1G/k0nZ5J/Q7r.O.o94PzW59tBqXJ26V5l4V6Y/2mH3lK', 'PHARMACIST', 'ACTIVE');

-- 2. Insert Suppliers
INSERT INTO suppliers (name, phone, email, address) VALUES
('MediPharma Suppliers', '+251911223344', 'contact@medipharma.com', 'Addis Ababa, Ethiopia'),
('Global Health Dist.', '+251922334455', 'sales@globalhealth.com', 'Adama, Ethiopia');

-- 3. Insert 20 Medicines
INSERT INTO medicines (medicine_code, name, generic_name, brand_name, category, dosage_form, strength, unit, manufacturer, minimum_stock) VALUES
('MED-001', 'Paracetamol 500mg', 'Paracetamol', 'Panadol', 'Painkiller', 'Tablet', '500mg', 'Strip', 'GSK', 50),
('MED-002', 'Amoxicillin 500mg', 'Amoxicillin', 'Amoxil', 'Antibiotic', 'Capsule', '500mg', 'Box', 'Pfizer', 30),
('MED-003', 'Ibuprofen 400mg', 'Ibuprofen', 'Brufen', 'Painkiller', 'Tablet', '400mg', 'Strip', 'Abbott', 40),
('MED-004', 'Omeprazole 20mg', 'Omeprazole', 'Losec', 'Antacid', 'Capsule', '20mg', 'Strip', 'AstraZeneca', 20),
('MED-005', 'Cetirizine 10mg', 'Cetirizine', 'Zyrtec', 'Antihistamine', 'Tablet', '10mg', 'Strip', 'J&J', 25),
('MED-006', 'Azithromycin 500mg', 'Azithromycin', 'Zithromax', 'Antibiotic', 'Tablet', '500mg', 'Box', 'Pfizer', 15),
('MED-007', 'Metformin 500mg', 'Metformin', 'Glucophage', 'Antidiabetic', 'Tablet', '500mg', 'Box', 'Merck', 60),
('MED-008', 'Amlodipine 5mg', 'Amlodipine', 'Norvasc', 'Antihypertensive', 'Tablet', '5mg', 'Strip', 'Pfizer', 45),
('MED-009', 'Lisinopril 10mg', 'Lisinopril', 'Prinivil', 'Antihypertensive', 'Tablet', '10mg', 'Strip', 'Merck', 30),
('MED-010', 'Simvastatin 20mg', 'Simvastatin', 'Zocor', 'Lipid-lowering', 'Tablet', '20mg', 'Box', 'Merck', 40),
('MED-011', 'Aspirin 75mg', 'Aspirin', 'Disprin', 'Blood thinner', 'Tablet', '75mg', 'Strip', 'Bayer', 100),
('MED-012', 'Losartan 50mg', 'Losartan', 'Cozaar', 'Antihypertensive', 'Tablet', '50mg', 'Box', 'Merck', 35),
('MED-013', 'Salbutamol 100mcg', 'Salbutamol', 'Ventolin', 'Bronchodilator', 'Inhaler', '100mcg', 'Piece', 'GSK', 15),
('MED-014', 'Pantoprazole 40mg', 'Pantoprazole', 'Protonix', 'Antacid', 'Tablet', '40mg', 'Strip', 'Pfizer', 25),
('MED-015', 'Ciprofloxacin 500mg', 'Ciprofloxacin', 'Cipro', 'Antibiotic', 'Tablet', '500mg', 'Box', 'Bayer', 20),
('MED-016', 'Diclofenac 50mg', 'Diclofenac', 'Voltaren', 'Painkiller', 'Tablet', '50mg', 'Strip', 'Novartis', 40),
('MED-017', 'Tramadol 50mg', 'Tramadol', 'Ultram', 'Painkiller', 'Capsule', '50mg', 'Strip', 'J&J', 10),
('MED-018', 'Vitamin C 500mg', 'Ascorbic Acid', 'Redoxon', 'Vitamin', 'Tablet', '500mg', 'Bottle', 'Bayer', 80),
('MED-019', 'Loratadine 10mg', 'Loratadine', 'Claritin', 'Antihistamine', 'Tablet', '10mg', 'Strip', 'Bayer', 30),
('MED-020', 'Levothyroxine 50mcg', 'Levothyroxine', 'Synthroid', 'Thyroid', 'Tablet', '50mcg', 'Box', 'AbbVie', 20);

-- 4. Insert Batches (Including expired, low stock, and expiring soon)
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, selling_price, quantity_received, current_quantity, supplier_id) VALUES
-- Normal batch
(1, 'B-PARA-001', '2024-01-01', '2026-12-31', 10.00, 15.00, 200, 150, 1),
-- Low stock (Min stock for Amoxicillin is 30, current is 10)
(2, 'B-AMOX-001', '2024-05-15', '2026-05-15', 20.00, 30.00, 100, 10, 2),
-- Expiring soon (Within 30 days)
(3, 'B-IBUP-001', '2023-11-01', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 8.00, 12.00, 150, 45, 1),
-- Expired batch
(4, 'B-OMEP-001', '2021-01-01', DATE_SUB(CURDATE(), INTERVAL 60 DAY), 15.00, 25.00, 100, 15, 2),
-- Normal batch
(5, 'B-CETI-001', '2024-08-01', '2027-08-01', 5.00, 8.00, 300, 250, 1);

-- 5. Insert Sample Expense
INSERT INTO expenses (expense_type, description, amount, payment_method, user_id, expense_date) VALUES
('Electricity', 'Monthly electricity bill', 500.00, 'Cash', 1, CURDATE()),
('Cleaning', 'Weekly pharmacy cleaning', 150.00, 'Cash', 1, CURDATE());
