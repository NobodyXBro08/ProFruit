import { NextResponse } from "next/server";
import {
  createUser,
  findUserByUsername,
  hashPassword,
  verifyPassword,
} from "./auth";
import { apiErrorFromUnknown } from "./apiError";
import { corsHeaders } from "./cors";
import { readJsonBody } from "./http";
import { parseValidatedCredentials } from "./parseValidatedCredentials";
import { signToken } from "./tokens";
import { validateRegisterBody } from "./registerValidators";

export async function handleRegisterPost(request: Request): Promise<NextResponse> {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateRegisterBody(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400, headers: corsHeaders });
    }

    const { username, password } = v.data;

    let existingUser;
    try {
      existingUser = await findUserByUsername(username);
    } catch (dbError) {
      return apiErrorFromUnknown("register/findUser", dbError);
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está registrado." },
        { status: 409, headers: corsHeaders }
      );
    }

    const passwordHash = await hashPassword(password);
    try {
      await createUser(username, passwordHash);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "El nombre de usuario ya está registrado." },
          { status: 409, headers: corsHeaders }
        );
      }
      return apiErrorFromUnknown("register/createUser", e);
    }

    return NextResponse.json({ message: "Usuario registrado correctamente" }, { status: 201, headers: corsHeaders });
  } catch (e) {
    return apiErrorFromUnknown("register", e);
  }
}

export async function handleLoginPost(request: Request): Promise<NextResponse> {
  try {
    const parsed = await parseValidatedCredentials(request);
    if (!parsed.ok) return parsed.response;

    const user = parsed.username;
    const pass = parsed.password;

    let row;
    try {
      row = await findUserByUsername(user);
    } catch (dbError) {
      return apiErrorFromUnknown("login/findUser", dbError);
    }

    if (!row || !(await verifyPassword(pass, row.password_hash))) {
      return NextResponse.json({ error: "Error en la autenticación" }, { status: 401, headers: corsHeaders });
    }

    let token: string;
    try {
      token = signToken({ sub: row.id, username: user, role: row.role });
    } catch (tokenError) {
      return apiErrorFromUnknown("login/signToken", tokenError, 503);
    }

    return NextResponse.json(
      {
        message: "Autenticación satisfactoria",
        token,
        user: {
          id: row.id,
          username: user,
          role: row.role,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    return apiErrorFromUnknown("login", e);
  }
}
