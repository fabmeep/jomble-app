import bcrypt from "bcryptjs";

export async function saltAndHashPassword(password: string, saltRounds: number = 10): Promise<string> {
    const salt = bcrypt.genSaltSync(saltRounds);
    return bcrypt.hashSync(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}