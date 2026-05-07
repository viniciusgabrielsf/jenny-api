-- Insert 30 payment records for Killua (20) and Gon (10)
-- Killua: 95485d7a-9c06-49a4-a7b9-72db266cf18e
-- Gon: 6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd

-- ============================================
-- Payments for Killua (20 payments)
-- ============================================

INSERT INTO payment (user_id, title, amount, payment_date, category, status) VALUES
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Equipamento de Treinamento Nen', 150.50, '2025-01-15', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Taxa da Família Zoldyck', 500.00, '2025-01-20', 'utilities', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Passagem para Whale Island', 75.25, '2025-02-01', 'transport', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Inscrição no Exame Hunter', 300.00, '2025-02-05', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Acomodação em York Shin', 450.75, '2025-02-10', 'utilities', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Suprimentos de Velocidade Divina', 200.00, '2025-02-15', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Entrada da Arena Celestial', 100.00, '2025-02-20', 'entertainment', 'pending'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Fundo da Expedição da Formiga Quimera', 600.00, '2025-03-01', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Refeições em Restaurante de Sushi', 85.50, '2025-03-05', 'food', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Livros em Quadrinhos do Togashi', 45.75, '2025-03-08', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Investigação da Tropa Fantasma', 250.00, '2025-03-12', 'entertainment', 'pending'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Passagem de Túnel da Montanha Kukuroo', 120.00, '2025-03-15', 'transport', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Entrada do Torneio de Artes Marciais', 180.00, '2025-03-18', 'entertainment', 'failed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Acampamento de Treinamento Bisky', 350.25, '2025-03-22', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Desenvolvimento da Habilidade Nen', 280.00, '2025-03-25', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Filiação à Associação Hunter', 1000.00, '2025-03-28', 'utilities', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Confronto da Guarda Real', 400.00, '2026-01-05', 'entertainment', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Bilhete de Airship do Kite', 220.50, '2026-01-10', 'transport', 'completed'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Suprimentos de Chiclete Ganache', 65.00, '2026-01-15', 'entertainment', 'pending'),
('95485d7a-9c06-49a4-a7b9-72db266cf18e', 'Medicamentos de Cura Avançados', 320.75, '2026-01-20', 'utilities', 'completed');

-- ============================================
-- Payments for Gon (10 payments)
-- ============================================

INSERT INTO payment (user_id, title, amount, payment_date, category, status) VALUES
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Vara de Bambú para Pesca', 55.00, '2025-01-10', 'entertainment', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Equipamento de Caça', 200.50, '2025-02-08', 'entertainment', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Suprimentos de Alimentos', 120.75, '2025-02-18', 'food', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Materiais da Licença Hunter', 250.00, '2025-03-01', 'entertainment', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Bilhete do Airship do Kite', 180.00, '2025-03-10', 'transport', 'pending'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Compra de Geleia Real', 500.00, '2025-03-20', 'utilities', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Pesquisa da Formiga Quimera', 350.25, '2026-01-08', 'entertainment', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Medicamentos de Cura Básicos', 95.50, '2026-01-12', 'utilities', 'completed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Suprimentos de Chiclete Ganache', 78.00, '2026-01-18', 'entertainment', 'failed'),
('6ae007c3-ba3f-48ad-aa7d-ffbf0d6ccdbd', 'Treinamento de Cultivo de Nen', 300.00, '2026-01-25', 'entertainment', 'completed');
