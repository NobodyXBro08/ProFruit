import { NextResponse } from "next/server";
import { createProduct, deleteProduct, getProductById, listProducts, updateProduct } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const product = await getProductById(Number(id));
      if (!product) {
        return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    const products = await listProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: "Error al obtener productos", error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al crear producto" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateProduct(body);

    if (!updated) {
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto actualizado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "El parámetro id es obligatorio" }, { status: 400 });
    }

    const deleted = await deleteProduct(Number(id));

    if (!deleted) {
      return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar producto" }, { status: 500 });
  }
}

