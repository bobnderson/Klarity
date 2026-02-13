-- Create logistics.urgencies table
IF OBJECT_ID('logistics.urgencies', 'U') IS NOT NULL
    DROP TABLE logistics.urgencies;
GO

CREATE TABLE logistics.urgencies (
    urgency_id VARCHAR(50) PRIMARY KEY,
    urgency_label NVARCHAR(100) NOT NULL,
    display_order INT NOT NULL
);
GO

-- Insert mock data
INSERT INTO logistics.urgencies (urgency_id, urgency_label, display_order)
VALUES 
('routine', 'Routine', 1),
('priority', 'Priority', 2),
('urgent', 'Urgent', 3),
('critical', 'Critical', 4);
GO
