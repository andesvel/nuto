export async function insertUser(
  db: D1Database,
  user: {
    id: string;
    email: string;
    subscriptionPlan: string;
    createdAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO users (id, email, subscription_plan, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(user.id, user.email, user.subscriptionPlan, user.createdAt)
    .run();
}

export async function updateUser(
  db: D1Database,
  user: {
    id: string;
    email: string;
    subscriptionPlan: string | undefined;
    createdAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      "UPDATE users SET email = ?, subscription_plan = ?, created_at = ? WHERE id = ?",
    )
    .bind(user.email, user.subscriptionPlan, user.createdAt, user.id)
    .run();
}

export async function deleteUserById(db: D1Database, id: string): Promise<void> {
  await db
    .prepare("DELETE FROM users WHERE id = ?")
    .bind(id)
    .run();
}
