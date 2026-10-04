import Ably from "ably";
import api from "./api";

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  list: async (): Promise<AdminNotification[]> => {
    const response = await api.get("/api/v1/notifications?limit=30");
    return response.data.data || [];
  },

  unreadCount: async (): Promise<number> => {
    const response = await api.get("/api/v1/notifications/unread-count");
    return response.data.data?.count || 0;
  },

  markRead: async (id: string) => {
    await api.patch(`/api/v1/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await api.patch("/api/v1/notifications/read-all");
  },

  createRealtimeClient: () =>
    new Ably.Realtime({
      authCallback: async (_params, callback) => {
        try {
          const response = await api.get("/api/v1/notifications/ably-token");
          callback(null, response.data.data);
        } catch (error) {
          callback(error as any, null);
        }
      },
    }),
};
