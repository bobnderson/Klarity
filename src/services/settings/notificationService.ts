import api from "../api";

export interface NotificationTemplate {
  templateId: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  description?: string;
  updatedAt: string;
}

export const getTemplates = async (): Promise<NotificationTemplate[]> => {
  const response = await api.get("/notifications/templates");
  return response.data;
};

export const getTemplateById = async (
  templateId: string,
): Promise<NotificationTemplate> => {
  const response = await api.get(`/notifications/templates/${templateId}`);
  return response.data;
};

export const updateTemplate = async (
  templateId: string,
  template: NotificationTemplate,
): Promise<NotificationTemplate> => {
  const response = await api.put(
    `/notifications/templates/${templateId}`,
    template,
  );
  return response.data;
};
