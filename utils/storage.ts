import * as SecureStore from "expo-secure-store";

const ADMIN_EMAIL_KEY = "adminEmail";

export async function saveAdminEmail(
  email: string
) {
  await SecureStore.setItemAsync(
    ADMIN_EMAIL_KEY,
    email
  );
}

export async function getAdminEmail() {
  return SecureStore.getItemAsync(
    ADMIN_EMAIL_KEY
  );
}

export async function removeAdminEmail() {
  await SecureStore.deleteItemAsync(
    ADMIN_EMAIL_KEY
  );
}