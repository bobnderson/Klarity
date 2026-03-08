-- Create notification_templates table
CREATE TABLE master.notification_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html NVARCHAR(MAX) NOT NULL,
    description VARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Seed initial templates
INSERT INTO master.notification_templates (template_id, template_name, subject, body_html, description)
VALUES 
(
    'voyage-assignment', 
    'Voyage Assignment Notification', 
    'Klarity Notification: Items for Request {RequestId} assigned to Voyage', 
    '<h2>Items Assigned to Voyage</h2><p>Items from your movement request <strong>{RequestId}</strong> have been scheduled on a voyage.</p><ul><li><strong>Vessel:</strong> {VesselName}</li><li><strong>Voyage:</strong> {OriginName} to {DestinationName}</li><li><strong>Departure:</strong> {DepartureTime}</li><li><strong>Urgency:</strong> {Urgency}</li></ul><p>Please log in to Klarity for full details.</p>',
    'Sent when items are assigned to a voyage.'
),
(
    'voyage-departure', 
    'Voyage Departure Notification', 
    'Voyage Departure Notification: {VesselName} - {VoyageId}', 
    '<h2>Voyage Departure Notification</h2><p>The voyage <strong>{VoyageId}</strong> has departed.</p><p><strong>Vessel:</strong> {VesselName}</p><p><strong>Route:</strong> {OriginName} to {DestinationName}</p><p><strong>ETA:</strong> {Eta}</p><hr/><h3>Your Scheduled Items:</h3>{ItemsTable}<p>The full voyage manifest is attached for your reference.</p>',
    'Sent when a voyage status changes to En Route.'
);

-- Add Menu Item for Notification Templates
-- First, find the group ID for "Settings"
DECLARE @SettingsGroupId INT;
SELECT @SettingsGroupId = menu_group_id FROM auth.menu_groups WHERE label = 'Settings';

IF @SettingsGroupId IS NOT NULL
BEGIN
    INSERT INTO auth.menu_items (label, path, menu_group_id, display_order)
    VALUES ('Notification Templates', '/settings-notifications', @SettingsGroupId, 40);

    -- Grant access to Admin role (assuming ID 1 or 'admin')
    DECLARE @TemplateMenuItemId INT;
    SELECT @TemplateMenuItemId = SCOPE_IDENTITY();

    INSERT INTO auth.role_menu_access (role_id, menu_item_id)
    SELECT role_id, @TemplateMenuItemId FROM auth.roles WHERE role_name IN ('Admin', 'Administrator', 'Super Admin');
END
GO
