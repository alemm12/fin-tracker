export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  defaultCurrency: string;
  timezone: string;
}
