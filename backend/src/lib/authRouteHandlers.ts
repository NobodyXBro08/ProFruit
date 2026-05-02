import { NextResponse } from "next/server";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  hashPassword,
  verifyPassword,
} from "./auth";
import { readJsonBody } from "./http";
import { parseValidatedCredentials } from "./parseValidatedCredentials";
import { validateRegisterBody } from "./registerValidators";

export async function handleRegisterPost(request: Request): Promise<NextResponse> {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateRegisterBody(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const { username, password, fullName, email, phone, shippingAddress } = v.data;

    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: "El nombre de usuario ya está registrado." }, { status: 409 });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese correo electrónico." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    try {
      await createUser(username, passwordHash, {
        fullName,
        email,
        phone,
        shippingAddress,
      });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "El nombre de usuario o el correo ya está registrado." },
          { status: 409 }
        );
      }
      throw e;
    }

    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

export async function handleLoginPost(request: Request): Promise<NextResponse> {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    const row = await findUserByUsername(user);
    if (!row || !verifyPassword(pass, row.password_hash)) {
      return NextResponse.json({ error: "Error en la autenticación" }, { status: 401 });
    }

    return NextResponse.json(
      {
        message: "Autenticación satisfactoria",
        user: {
          id: row.id,
          username: user,
          ...(row.full_name && { fullName: row.full_name }),
          ...(row.email && { email: row.email }),
          ...(row.phone && { phone: row.phone }),
          ...(row.shipping_address && { shippingAddress: row.shipping_address }),
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
