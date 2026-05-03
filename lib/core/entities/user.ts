export interface ProductiveHours {
  [key: string]: string | string[];
}

export interface RecurringBlock {
  day: string;
  block: string;
}

export interface User {
  id: string;
  name: string | null;
  bio: string | null;
  productiveHours: ProductiveHours | null;
  recurringBlocks: RecurringBlock[] | null;
  onboardedAt: Date | null;
  lastActiveAt: Date | null;
}
