import { create } from 'zustand';
import { ipc } from '@/lib/ipc';
export const useInboxStore = create((set, get) => ({
    inboxItems: [],
    isLoading: false,
    error: null,
    getUnprocessedItems: () => {
        return get().inboxItems.filter((item) => item.processed === 0);
    },
    getProcessedItems: () => {
        return get().inboxItems.filter((item) => item.processed === 1);
    },
    getUnprocessedCount: () => {
        return get().inboxItems.filter((item) => item.processed === 0).length;
    },
    loadInboxItems: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.inbox.getAll();
            if (result.success && result.data) {
                set({ inboxItems: result.data, isLoading: false });
            }
            else {
                set({ error: result.error || 'Failed to load inbox items', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    createInboxItem: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.inbox.create(data);
            if (result.success && result.data) {
                set((state) => ({
                    inboxItems: [result.data, ...state.inboxItems],
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to create inbox item', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    markAsProcessed: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.inbox.markProcessed(id);
            if (result.success && result.data) {
                set((state) => ({
                    inboxItems: state.inboxItems.map((item) => item.id === id ? result.data : item),
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to mark as processed', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
    deleteInboxItem: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await ipc.inbox.delete(id);
            if (result.success) {
                set((state) => ({
                    inboxItems: state.inboxItems.filter((item) => item.id !== id),
                    isLoading: false,
                }));
            }
            else {
                set({ error: result.error || 'Failed to delete inbox item', isLoading: false });
            }
        }
        catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));
