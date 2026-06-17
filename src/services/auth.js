import { ID } from 'appwrite';
import { account } from '../lib/appwrite';

export async function registerUser({ name, email, password }) {
  await account.create({
    userId: ID.unique(),
    email,
    password,
    name,
  });

  return account.createEmailPasswordSession({ email, password });
}

export async function loginUser({ email, password }) {
  return account.createEmailPasswordSession({ email, password });
}

export async function getCurrentUser() {
  return account.get();
}

export async function logoutUser() {
  return account.deleteSession({ sessionId: 'current' });
}

export function getAuthErrorMessage(error) {
  return error?.message || 'Something went wrong. Please try again.';
}
