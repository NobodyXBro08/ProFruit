import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createProduct, deleteProduct, getProductById, updateProduct } from "@/lib/products";
import { readJsonBody, parseQueryId } from "@/lib/http";
import { validateProductCreate, validateProductUpdate } from "@/lib/productValidators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id !== null && id !== "") {
      const parsed = parseQueryId(id);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const product = await getProductById(parsed.id);
      if (!product) {
        return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
      }
      return NextResponse.json(product, { status: 200 });
    }

    const [rows] = await pool.query("SELECT * FROM products LIMIT 10");
    return Response.json(rows);
  } catch (error) {
    console.error("Error en /api/products:", error);
    return Response.json({ error: "Error en base de datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductCreate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const product = await createProduct({
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear el producto." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const raw = await readJsonBody(request);
    if (!raw.ok) return raw.response;

    const v = validateProductUpdate(raw.body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updated = await updateProduct({
      id: v.data.id,
      name: v.data.name,
      description: v.data.description,
      price: v.data.price,
      stock: v.data.stock,
      weight: v.data.weight,
    });

    if (!updated) {
      return NextResponse.json({ error: "Producto no encontrado. No se pudo actualizar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto actualizado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("El id es obligatorio")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al actualizar el producto." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const parsed = parseQueryId(id);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deleted = await deleteProduct(parsed.id);

    if (!deleted) {
      return NextResponse.json({ error: "Producto no encontrado. No se pudo eliminar." }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto eliminado correctamente." }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar el producto." }, { status: 500 });
  }
}
