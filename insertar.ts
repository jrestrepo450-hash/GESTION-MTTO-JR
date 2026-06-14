import { db } from "@/server/db";
import { tickets, spaces, waUsers } from "@/server/schema";

async function rellenarBaseDeDatos() {
  try {
    console.log("Iniciando llenado de datos de soporte...");

    // 1. Insertar un Espacio / Habitación inicial
    const [nuevoEspacio] = await db.insert(spaces).values({
      name: "Apartamento de Prueba",
      code: "1111",
      type: "Habitación"
    }).returning({ id: spaces.id });
    console.log("✔️ Espacio inicial insertado con ID:", nuevoEspacio.id);

    // 2. Insertar un Usuario inicial
    const [nuevoUsuario] = await db.insert(waUsers).values({
      name: "Técnico de Soporte",
      phone: "573000000000",
      role: "Técnico"
    }).returning({ id: waUsers.id });
    console.log("✔️ Usuario inicial insertado con ID:", nuevoUsuario.id);

    // 3. Insertar el Ticket enlazado
    await db.insert(tickets).values({
      title: "Revisión inicial del sistema",
      description: "Pendiente automático para levantar la interfaz y evitar bloqueos.",
      status: "pendiente",
      priority: "baja",
      spaceId: nuevoEspacio.id,
      assignedToId: nuevoUsuario.id
    });
    console.log("✔️ Ticket inicial enlazado correctamente.");

    console.log("🎉 ¡Base de datos rellenada con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al rellenar los datos:", error);
    process.exit(1);
  }
}

rellenarBaseDeDatos();