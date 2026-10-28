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

// Only the email syncs from Clerk: the plan is managed here, and created_at
// is set once on user.created.
export async function updateUserEmail(
  db: D1Database,
  user: { id: string; email: string },
): Promise<void> {
  await db
    .prepare("UPDATE users SET email = ? WHERE id = ?")
    .bind(user.email, user.id)
    .run();
}

export async function deleteUserById(db: D1Database, id: string): Promise<void> {
  await db
    .prepare("DELETE FROM users WHERE id = ?")
    .bind(id)
    .run();
}
