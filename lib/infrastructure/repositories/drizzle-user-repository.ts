import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { IUserRepository } from '@/lib/core/repositories/interfaces';
import type { User, RecurringBlock } from '@/lib/core/entities/user';

export class DrizzleUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await db.query.users.findFirst({ where: eq(users.id, id) });
    return (row as unknown as User) ?? null;
  }

  async update(id: string, data: {
    name?: string;
    productiveHours?: string[];
    recurringBlocks?: RecurringBlock[];
    onboardedAt?: Date;
  }): Promise<void> {
    await db.update(users).set(data).where(eq(users.id, id));
  }
}

export const userRepository = new DrizzleUserRepository();
