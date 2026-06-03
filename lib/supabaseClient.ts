import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Mock Client implementation for local development without credentials
class MockSupabaseClient {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Mock Authentication
  auth = {
    getUser: async () => {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };
      const user = this.getStorageItem('mock_user', null);
      return { data: { user }, error: null };
    },
    getSession: async () => {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };
      const session = this.getStorageItem('mock_session', null);
      return { data: { session }, error: null };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      const mockUser = {
        id: 'mock-user-id-123',
        email,
        user_metadata: { full_name: email.split('@')[0], avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}` },
      };
      const mockSession = { user: mockUser, access_token: 'mock-jwt-token' };
      this.setStorageItem('mock_user', mockUser);
      this.setStorageItem('mock_session', mockSession);

      // Initialize default profile
      const profiles = this.getStorageItem<any[]>('mock_profiles', []);
      if (!profiles.some((p: any) => p.id === mockUser.id)) {
        profiles.push({
          id: mockUser.id,
          full_name: mockUser.user_metadata.full_name,
          avatar_url: mockUser.user_metadata.avatar_url,
          preferred_exam: 'PTE',
          target_score: 79,
          created_at: new Date().toISOString(),
        });
        this.setStorageItem('mock_profiles', profiles);
      }

      // Trigger standard auth state change listener
      this.triggerAuthChange('SIGNED_IN', mockSession);

      return { data: { user: mockUser, session: mockSession }, error: null };
    },
    signUp: async ({ email }: { email: string }) => {
      return this.auth.signInWithPassword({ email });
    },
    signInWithOAuth: async ({ provider }: { provider: string }) => {
      // Direct mock OAuth login
      const mockUser = {
        id: 'mock-user-id-123',
        email: 'googleuser@example.com',
        user_metadata: { full_name: 'Google User', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google' },
      };
      const mockSession = { user: mockUser, access_token: 'mock-jwt-token-google' };
      this.setStorageItem('mock_user', mockUser);
      this.setStorageItem('mock_session', mockSession);

      const profiles = this.getStorageItem<any[]>('mock_profiles', []);
      if (!profiles.some((p: any) => p.id === mockUser.id)) {
        profiles.push({
          id: mockUser.id,
          full_name: mockUser.user_metadata.full_name,
          avatar_url: mockUser.user_metadata.avatar_url,
          preferred_exam: 'PTE',
          target_score: 79,
          created_at: new Date().toISOString(),
        });
        this.setStorageItem('mock_profiles', profiles);
      }

      this.triggerAuthChange('SIGNED_IN', mockSession);

      return { data: { provider, url: '#' }, error: null };
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_user');
        localStorage.removeItem('mock_session');
      }
      this.triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },
    onAuthStateChange: (callback: any) => {
      if (typeof window === 'undefined') return { data: { subscription: { unsubscribe: () => {} } } };
      
      // Keep track of active listeners
      if (!(window as any).__mockAuthListeners) {
        (window as any).__mockAuthListeners = [];
      }
      (window as any).__mockAuthListeners.push(callback);

      // Call immediately with current session
      const session = this.getStorageItem('mock_session', null);
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              (window as any).__mockAuthListeners = ((window as any).__mockAuthListeners || []).filter(
                (l: any) => l !== callback
              );
            },
          },
        },
      };
    },
  };

  private triggerAuthChange(event: string, session: any) {
    if (typeof window !== 'undefined' && (window as any).__mockAuthListeners) {
      (window as any).__mockAuthListeners.forEach((callback: any) => callback(event, session));
    }
  }

  // Mock Database Client
  from(table: string) {
    const self = this;
    let data = this.getStorageItem<any[]>(`mock_${table}`, []);
    let filteredData = [...data];

    const queryBuilder = {
      select: (columns: string = '*') => {
        // Return matching chain
        return queryBuilder;
      },
      eq: (column: string, value: any) => {
        filteredData = filteredData.filter((item: any) => item[column] === value);
        return queryBuilder;
      },
      order: (column: string, { ascending = true } = {}) => {
        filteredData.sort((a: any, b: any) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
        return queryBuilder;
      },
      limit: (count: number) => {
        filteredData = filteredData.slice(0, count);
        return queryBuilder;
      },
      insert: async (newData: any) => {
        const arrayToInsert = Array.isArray(newData) ? newData : [newData];
        const updatedArray = [...arrayToInsert].map((item: any) => ({
          id: item.id || `id-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          ...item,
        }));
        
        data = [...data, ...updatedArray];
        self.setStorageItem(`mock_${table}`, data);
        return { data: updatedArray, error: null };
      },
      upsert: async (newData: any) => {
        const arrayToUpsert = Array.isArray(newData) ? newData : [newData];
        const updatedArray = [...data];
        
        arrayToUpsert.forEach((item: any) => {
          const index = updatedArray.findIndex((x: any) => x.id === item.id);
          if (index !== -1) {
            updatedArray[index] = { ...updatedArray[index], ...item };
          } else {
            updatedArray.push({
              id: item.id || `id-${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              ...item,
            });
          }
        });

        self.setStorageItem(`mock_${table}`, updatedArray);
        return { data: arrayToUpsert, error: null };
      },
      update: async (updateData: any) => {
        // Modify current filtered items
        const updatedArray = data.map((item: any) => {
          const match = filteredData.some((f: any) => f.id === item.id);
          if (match) {
            return { ...item, ...updateData };
          }
          return item;
        });
        self.setStorageItem(`mock_${table}`, updatedArray);
        return { data: filteredData.map((item: any) => ({ ...item, ...updateData })), error: null };
      },
      // Promise resolution
      then: (resolve: any) => {
        resolve({ data: filteredData, error: null });
      },
    };

    return queryBuilder;
  }

  // Mock Storage Client
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: Blob) => {
        // Mock upload: resolve a mock path
        const fileUrl = `https://mock-supabase-storage.com/${bucket}/${path}`;
        return { data: { path, fullPath: fileUrl }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `https://mock-supabase-storage.com/${bucket}/${path}` } };
      },
    }),
  };
}

// Instantiate either real or mock client
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

if (isMockMode && typeof window !== 'undefined') {
  console.warn("⚠️ Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. Operating in local-storage mock mode.");
}

export const supabase = !isMockMode 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (new MockSupabaseClient() as any);
