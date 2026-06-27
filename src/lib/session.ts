import { auth } from "@/auth";

export async function getUserId() {
    const session = await auth();
    return session!.user!.id; // Safe assertion because middleware handles the 401 check
}